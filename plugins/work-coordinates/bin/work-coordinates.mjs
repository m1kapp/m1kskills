#!/usr/bin/env node

import {
  chmodSync,
  closeSync,
  copyFileSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const BIN_DIR = dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = resolve(BIN_DIR, "..");
const REPO_ROOT = resolve(PLUGIN_ROOT, "..", "..");
const RULES_PATH = join(
  PLUGIN_ROOT,
  "skills",
  "work-coordinates",
  "references",
  "work-coordinates.md",
);
const PACKAGE_PATH = join(REPO_ROOT, "package.json");
const START = "<!-- m1kskills:work-coordinates:start -->";
const END = "<!-- m1kskills:work-coordinates:end -->";
const PUBLIC_INVOKE = "npx github:m1kapp/m1kskills";
const UTF8_FATAL = new TextDecoder("utf-8", { fatal: true });

class SafetyError extends Error {}

function expandHome(value) {
  if (value === "~") return homedir();
  if (value.startsWith(`~${sep}`)) return join(homedir(), value.slice(2));
  return value;
}

function codexHome() {
  const configured = process.env.CODEX_HOME;
  if (configured) {
    return [resolve(expandHome(configured)), "CODEX_HOME 환경 변수가 설정됨"];
  }
  return [resolve(homedir(), ".codex"), "CODEX_HOME이 없어 ~/.codex 사용"];
}

function readBytes(path) {
  if (!existsSync(path)) return Buffer.alloc(0);
  if (lstatSync(path).isSymbolicLink()) {
    throw new SafetyError(`심볼릭 링크는 자동 수정하지 않음: ${path}`);
  }
  const data = readFileSync(path);
  try {
    UTF8_FATAL.decode(data);
  } catch {
    throw new SafetyError(`UTF-8이 아닌 파일은 자동 수정하지 않음: ${path}`);
  }
  return data;
}

function decode(data) {
  return data.toString("utf8");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function markerMatches(text, marker) {
  const expression = new RegExp(`^${escapeRegExp(marker)}\\r?$`, "gm");
  return [...text.matchAll(expression)];
}

function locateBlock(text) {
  const starts = markerMatches(text, START);
  const ends = markerMatches(text, END);
  if (starts.length === 0 && ends.length === 0) return null;
  if (starts.length !== 1 || ends.length !== 1 || starts[0].index >= ends[0].index) {
    throw new SafetyError("관리 마커가 중복되었거나 짝이 맞지 않아 자동 변경을 중단함");
  }
  return [starts[0].index, ends[0].index + ends[0][0].length];
}

function managedBlock() {
  const rules = readFileSync(RULES_PATH, "utf8").replace(/\n+$/u, "");
  return `${START}\n${rules}\n${END}`;
}

function chooseTarget(home) {
  const override = join(home, "AGENTS.override.md");
  const agents = join(home, "AGENTS.md");
  const overrideData = readBytes(override);
  const agentsData = readBytes(agents);
  if (decode(overrideData).trim()) {
    return [override, "비어 있지 않은 AGENTS.override.md가 전역 우선순위 1순위"];
  }
  if (existsSync(agents) && decode(agentsData).trim()) {
    return [agents, "override가 없거나 비어 있어 기존 AGENTS.md가 활성 파일"];
  }
  if (existsSync(agents)) {
    return [agents, "override가 없거나 비어 있어 기존 AGENTS.md를 활성 파일로 사용"];
  }
  return [agents, "활성 전역 파일이 없어 기본 AGENTS.md를 새로 사용"];
}

function activate(text) {
  const block = managedBlock();
  const found = locateBlock(text);
  if (found) return text.slice(0, found[0]) + block + text.slice(found[1]);
  if (text) return `${block}\n\n${text}`;
  return `${block}\n`;
}

function remove(text) {
  const found = locateBlock(text);
  if (!found) return text;
  const prefix = text.slice(0, found[0]);
  let suffix = text.slice(found[1]);
  if (found[0] === 0) {
    if (suffix.startsWith("\r\n\r\n")) suffix = suffix.slice(4);
    else if (suffix.startsWith("\n\n")) suffix = suffix.slice(2);
    else if (suffix === "\n" || suffix === "\r\n") suffix = "";
  }
  return prefix + suffix;
}

function gitRoot(current) {
  const result = spawnSync("git", ["-C", current, "rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  });
  if (result.status === 0 && result.stdout.trim()) return resolve(result.stdout.trim());
  return current;
}

function projectInstructionFiles(target) {
  const current = resolve(process.cwd());
  let root = gitRoot(current);
  const fromRoot = relative(root, current);
  if (fromRoot.startsWith("..") || isAbsolute(fromRoot)) root = current;
  const found = [];
  let cursor = root;
  while (true) {
    for (const name of ["AGENTS.override.md", "AGENTS.md"]) {
      const candidate = join(cursor, name);
      if (existsSync(candidate) && resolve(candidate) !== resolve(target)) {
        found.push(candidate);
        break;
      }
    }
    if (cursor === current) break;
    const parts = relative(cursor, current).split(sep).filter(Boolean);
    if (parts.length === 0) break;
    cursor = join(cursor, parts[0]);
  }
  return found;
}

function diffLines(text) {
  return text ? text.split("\n") : [];
}

function rangeStart(index, count) {
  return count === 0 ? index : index + 1;
}

function unifiedDiff(path, before, after, operation) {
  if (before === after) return "";
  const oldLines = diffLines(before);
  const newLines = diffLines(after);
  let prefix = 0;
  while (
    prefix < oldLines.length &&
    prefix < newLines.length &&
    oldLines[prefix] === newLines[prefix]
  ) prefix += 1;
  let suffix = 0;
  while (
    suffix < oldLines.length - prefix &&
    suffix < newLines.length - prefix &&
    oldLines[oldLines.length - 1 - suffix] === newLines[newLines.length - 1 - suffix]
  ) suffix += 1;
  const contextBefore = Math.min(3, prefix);
  const contextAfter = Math.min(3, suffix);
  const oldChanged = oldLines.length - prefix - suffix;
  const newChanged = newLines.length - prefix - suffix;
  const oldStartIndex = prefix - contextBefore;
  const newStartIndex = prefix - contextBefore;
  const oldCount = contextBefore + oldChanged + contextAfter;
  const newCount = contextBefore + newChanged + contextAfter;
  const lines = [
    `--- ${path} (현재)`,
    `+++ ${path} (${operation})`,
    `@@ -${rangeStart(oldStartIndex, oldCount)},${oldCount} +${rangeStart(newStartIndex, newCount)},${newCount} @@`,
  ];
  for (let index = oldStartIndex; index < prefix; index += 1) lines.push(` ${oldLines[index]}`);
  for (let index = prefix; index < oldLines.length - suffix; index += 1) lines.push(`-${oldLines[index]}`);
  for (let index = prefix; index < newLines.length - suffix; index += 1) lines.push(`+${newLines[index]}`);
  for (let index = 0; index < contextAfter; index += 1) {
    lines.push(` ${oldLines[oldLines.length - suffix + index]}`);
  }
  return `${lines.join("\n")}\n`;
}

function utcStamp() {
  return new Date().toISOString().replace(/[-:]/gu, "").replace(/\.\d{3}Z$/u, "Z");
}

function backup(path) {
  if (!existsSync(path)) return null;
  const stamp = utcStamp();
  let candidate = `${path}.bak-${stamp}`;
  let counter = 1;
  while (existsSync(candidate)) {
    candidate = `${path}.bak-${stamp}-${counter}`;
    counter += 1;
  }
  copyFileSync(path, candidate);
  chmodSync(candidate, statSync(path).mode & 0o777);
  return candidate;
}

function atomicWrite(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  const mode = existsSync(path) ? statSync(path).mode & 0o777 : 0o600;
  let temporary;
  for (let counter = 0; counter < 100; counter += 1) {
    const token = `${process.pid}-${Date.now()}-${counter}`;
    const candidate = join(dirname(path), `.${basename(path)}.${token}.tmp`);
    let descriptor;
    try {
      descriptor = openSync(candidate, "wx", mode);
      writeFileSync(descriptor, data);
      fsyncSync(descriptor);
      closeSync(descriptor);
      descriptor = undefined;
      temporary = candidate;
      break;
    } catch (error) {
      if (descriptor !== undefined) closeSync(descriptor);
      if (existsSync(candidate)) unlinkSync(candidate);
      if (error.code !== "EEXIST") throw error;
    }
  }
  if (!temporary) throw new SafetyError(`임시 파일을 만들 수 없음: ${dirname(path)}`);
  try {
    renameSync(temporary, path);
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
  }
}

function packageVersion() {
  return JSON.parse(readFileSync(PACKAGE_PATH, "utf8")).version;
}

function printHelp() {
  console.log(`Work Coordinates ${packageVersion()}

Usage:
  ${PUBLIC_INVOKE} status
  ${PUBLIC_INVOKE} activate [--apply]
  ${PUBLIC_INVOKE} remove [--apply]

Commands:
  status      활성 파일과 관리 블록 상태를 읽기만 함
  activate    기본 dry-run, --apply에서만 삽입 또는 갱신
  remove      기본 dry-run, --apply에서만 관리 블록 제거
`);
}

function parseArguments(arguments_) {
  if (arguments_.length === 0 || arguments_.includes("--help") || arguments_.includes("-h")) {
    printHelp();
    return null;
  }
  if (arguments_.includes("--version") || arguments_.includes("-v")) {
    console.log(packageVersion());
    return null;
  }
  const command = arguments_[0];
  const rest = arguments_.slice(1);
  if (!["activate", "remove", "status"].includes(command)) {
    throw new SafetyError(`알 수 없는 명령: ${command}`);
  }
  const unknown = rest.filter((value) => value !== "--apply");
  if (unknown.length) throw new SafetyError(`알 수 없는 옵션: ${unknown.join(", ")}`);
  const apply = rest.includes("--apply");
  if (command === "status" && apply) throw new SafetyError("status에는 --apply를 사용할 수 없음");
  return { command, apply };
}

function run() {
  const parsed = parseArguments(process.argv.slice(2));
  if (!parsed) return 0;
  const [home, homeReason] = codexHome();
  const [target, targetReason] = chooseTarget(home);
  const beforeBytes = readBytes(target);
  const before = decode(beforeBytes);
  const blockPresent = locateBlock(before) !== null;
  console.log(`Codex home: ${home} · ${homeReason}`);
  console.log(`선택 파일: ${target}`);
  console.log(`선택 근거: ${targetReason}`);
  const projectFiles = projectInstructionFiles(target);
  if (projectFiles.length) {
    console.log("경고: 프로젝트 지침이 전역 지침보다 뒤에 적용되어 충돌 시 우선함");
    for (const path of projectFiles) console.log(`  - 수정하지 않음: ${path}`);
  }
  if (parsed.command === "status") {
    console.log(`상태: ${blockPresent ? "활성 · 관리 블록 1개" : "비활성 · 관리 블록 없음"}`);
    return 0;
  }
  const after = parsed.command === "activate" ? activate(before) : remove(before);
  const label = parsed.command === "activate" ? "활성화/갱신" : "제거";
  console.log(parsed.apply ? "모드: APPLY" : "모드: DRY-RUN · 파일을 변경하지 않음");
  console.log("diff:");
  console.log(unifiedDiff(target, before, after, label) || "(변경 없음)");
  if (!parsed.apply) {
    console.log(`반영 명령: ${PUBLIC_INVOKE} ${parsed.command} --apply`);
    return 0;
  }
  if (before === after) {
    console.log("결과: 변경 없음");
    return 0;
  }
  const saved = backup(target);
  atomicWrite(target, Buffer.from(after, "utf8"));
  console.log(saved ? `백업: ${saved}` : "백업: 기존 파일 없음");
  console.log(`결과: ${label} 완료 · 관리 마커 밖 사용자 바이트 보존`);
  return 0;
}

try {
  process.exitCode = run();
} catch (error) {
  if (error instanceof SafetyError) {
    console.error(`안전 중단: ${error.message}`);
    process.exitCode = 2;
  } else {
    console.error(`실행 실패: ${error.message}`);
    process.exitCode = 1;
  }
}
