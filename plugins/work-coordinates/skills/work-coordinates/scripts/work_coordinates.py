#!/usr/bin/env python3
"""Safely manage the global Work Coordinates instruction block."""

from __future__ import annotations

import argparse
import difflib
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import sys
import tempfile
from datetime import datetime, timezone


START = b"<!-- m1kskills:work-coordinates:start -->"
END = b"<!-- m1kskills:work-coordinates:end -->"
RULES_PATH = Path(__file__).resolve().parent.parent / "references" / "work-coordinates.md"


class SafetyError(RuntimeError):
    """Refuse ambiguous or unsafe mutations."""


def codex_home() -> tuple[Path, str]:
    configured = os.environ.get("CODEX_HOME")
    if configured:
        return Path(configured).expanduser().resolve(), "CODEX_HOME 환경 변수가 설정됨"
    return (Path.home() / ".codex").resolve(), "CODEX_HOME이 없어 ~/.codex 사용"


def read_bytes(path: Path) -> bytes:
    if not path.exists():
        return b""
    if path.is_symlink():
        raise SafetyError(f"심볼릭 링크는 자동 수정하지 않음: {path}")
    data = path.read_bytes()
    try:
        data.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise SafetyError(f"UTF-8이 아닌 파일은 자동 수정하지 않음: {path}") from exc
    return data


def locate_block(data: bytes) -> tuple[int, int] | None:
    starts = list(re.finditer(rb"(?m)^" + re.escape(START) + rb"\r?$", data))
    ends = list(re.finditer(rb"(?m)^" + re.escape(END) + rb"\r?$", data))
    if not starts and not ends:
        return None
    if len(starts) != 1 or len(ends) != 1 or starts[0].start() >= ends[0].start():
        raise SafetyError("관리 마커가 중복되었거나 짝이 맞지 않아 자동 변경을 중단함")
    return starts[0].start(), ends[0].end()


def managed_block() -> bytes:
    rules = RULES_PATH.read_text(encoding="utf-8").rstrip("\n").encode("utf-8")
    return START + b"\n" + rules + b"\n" + END


def choose_target(home: Path) -> tuple[Path, str]:
    override = home / "AGENTS.override.md"
    agents = home / "AGENTS.md"
    override_data = read_bytes(override)
    agents_data = read_bytes(agents)

    if override_data.strip():
        return override, "비어 있지 않은 AGENTS.override.md가 전역 우선순위 1순위"
    if agents.exists() and agents_data.strip():
        return agents, "override가 없거나 비어 있어 기존 AGENTS.md가 활성 파일"
    if agents.exists():
        return agents, "override가 없거나 비어 있어 기존 AGENTS.md를 활성 파일로 사용"
    return agents, "활성 전역 파일이 없어 기본 AGENTS.md를 새로 사용"


def activate(data: bytes) -> bytes:
    block = managed_block()
    found = locate_block(data)
    if found:
        start, end = found
        return data[:start] + block + data[end:]
    if data:
        return block + b"\n\n" + data
    return block + b"\n"


def remove(data: bytes) -> bytes:
    found = locate_block(data)
    if not found:
        return data
    start, end = found
    suffix = data[end:]
    if start == 0:
        if suffix.startswith(b"\r\n\r\n"):
            suffix = suffix[4:]
        elif suffix.startswith(b"\n\n"):
            suffix = suffix[2:]
        elif suffix in (b"\n", b"\r\n"):
            suffix = b""
    return data[:start] + suffix


def project_instruction_files(target: Path) -> list[Path]:
    try:
        result = subprocess.run(
            ["git", "-C", str(Path.cwd()), "rev-parse", "--show-toplevel"],
            check=True,
            capture_output=True,
            text=True,
        )
        root = Path(result.stdout.strip()).resolve()
    except (subprocess.CalledProcessError, FileNotFoundError):
        root = Path.cwd().resolve()

    current = Path.cwd().resolve()
    try:
        current.relative_to(root)
    except ValueError:
        root = current

    found: list[Path] = []
    cursor = root
    while True:
        for name in ("AGENTS.override.md", "AGENTS.md"):
            candidate = cursor / name
            if candidate.exists() and candidate.resolve() != target.resolve():
                found.append(candidate)
                break
        if cursor == current:
            break
        relative = current.relative_to(cursor)
        cursor = cursor / relative.parts[0]
    return found


def unified_diff(path: Path, before: bytes, after: bytes, operation: str) -> str:
    before_text = before.decode("utf-8").splitlines(keepends=True)
    after_text = after.decode("utf-8").splitlines(keepends=True)
    return "".join(
        difflib.unified_diff(
            before_text,
            after_text,
            fromfile=f"{path} (현재)",
            tofile=f"{path} ({operation})",
        )
    )


def backup(path: Path) -> Path | None:
    if not path.exists():
        return None
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    candidate = path.with_name(f"{path.name}.bak-{stamp}")
    counter = 1
    while candidate.exists():
        candidate = path.with_name(f"{path.name}.bak-{stamp}-{counter}")
        counter += 1
    shutil.copy2(path, candidate)
    return candidate


def atomic_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    existing_mode = stat.S_IMODE(path.stat().st_mode) if path.exists() else 0o600
    descriptor, temporary_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    temporary = Path(temporary_name)
    try:
        os.fchmod(descriptor, existing_mode)
        with os.fdopen(descriptor, "wb") as handle:
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
    finally:
        if temporary.exists():
            temporary.unlink()


def run() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("activate", "remove", "status"))
    parser.add_argument("--apply", action="store_true", help="dry-run 결과를 실제 파일에 반영")
    args = parser.parse_args()

    home, home_reason = codex_home()
    target, target_reason = choose_target(home)
    before = read_bytes(target)
    block_present = locate_block(before) is not None

    print(f"Codex home: {home} · {home_reason}")
    print(f"선택 파일: {target}")
    print(f"선택 근거: {target_reason}")

    project_files = project_instruction_files(target)
    if project_files:
        print("경고: 프로젝트 지침이 전역 지침보다 뒤에 적용되어 충돌 시 우선함")
        for path in project_files:
            print(f"  - 수정하지 않음: {path}")

    if args.command == "status":
        print(f"상태: {'활성 · 관리 블록 1개' if block_present else '비활성 · 관리 블록 없음'}")
        return 0

    after = activate(before) if args.command == "activate" else remove(before)
    label = "활성화/갱신" if args.command == "activate" else "제거"
    print("모드: APPLY" if args.apply else "모드: DRY-RUN · 파일을 변경하지 않음")
    print("diff:")
    diff = unified_diff(target, before, after, label)
    print(diff if diff else "(변경 없음)")

    if not args.apply:
        print(f"반영 명령: python3 {Path(__file__).resolve()} {args.command} --apply")
        return 0
    if before == after:
        print("결과: 변경 없음")
        return 0

    saved = backup(target)
    atomic_write(target, after)
    print(f"백업: {saved}" if saved else "백업: 기존 파일 없음")
    print(f"결과: {label} 완료 · 관리 마커 밖 사용자 바이트 보존")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(run())
    except SafetyError as exc:
        print(f"안전 중단: {exc}", file=sys.stderr)
        raise SystemExit(2)
