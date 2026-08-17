#!/usr/bin/env python3
"""Regression fixtures for non-destructive Work Coordinates activation."""

from __future__ import annotations

import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import unittest


PLUGIN = Path(__file__).resolve().parents[3]
SCRIPT = PLUGIN / "bin" / "work-coordinates.mjs"
RULES = PLUGIN / "skills" / "work-coordinates" / "references" / "work-coordinates.md"
PACKAGE = PLUGIN.parents[1] / "package.json"
NODE = shutil.which("node")
START = b"<!-- m1kskills:work-coordinates:start -->"
END = b"<!-- m1kskills:work-coordinates:end -->"


def outside_managed(data: bytes) -> bytes:
    pattern = re.compile(
        rb"^" + re.escape(START) + rb"\r?\n.*?\r?\n" + re.escape(END) + rb"(?:\r?\n\r?\n|\r?\n)?",
        re.DOTALL,
    )
    return pattern.sub(b"", data, count=1)


class WorkCoordinatesFixtures(unittest.TestCase):
    def setUp(self) -> None:
        if NODE is None:
            self.skipTest("node is required")
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.home = self.root / "codex-home"
        self.project = self.root / "project"
        self.project.mkdir()
        subprocess.run(["git", "init", "-q", str(self.project)], check=True)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def command(self, action: str, apply: bool = False) -> subprocess.CompletedProcess[str]:
        environment = os.environ.copy()
        environment["CODEX_HOME"] = str(self.home)
        arguments = [NODE, str(SCRIPT), action]
        if apply:
            arguments.append("--apply")
        return subprocess.run(
            arguments,
            cwd=self.project,
            env=environment,
            check=True,
            capture_output=True,
            text=True,
        )

    def test_1_no_existing_agents_uses_agents_md(self) -> None:
        preview = self.command("activate")
        target = self.home / "AGENTS.md"
        self.assertIn("DRY-RUN", preview.stdout)
        self.assertIn(str(target), preview.stdout)
        self.assertFalse(target.exists())

        self.command("activate", apply=True)
        data = target.read_bytes()
        self.assertEqual(data.count(START), 1)
        self.assertEqual(data.count(END), 1)

    def test_2_existing_agents_preserves_unique_sentinel(self) -> None:
        self.home.mkdir()
        target = self.home / "AGENTS.md"
        original = "# 내 규칙\r\nUNIQUE-SENTINEL-한글\r\n".encode()
        target.write_bytes(original)

        self.command("activate")
        self.command("activate", apply=True)
        data = target.read_bytes()
        self.assertEqual(outside_managed(data), original)
        self.assertIn(b"UNIQUE-SENTINEL", data)
        self.assertTrue(list(self.home.glob("AGENTS.md.bak-*")))

        self.command("activate", apply=True)
        self.assertEqual(target.read_bytes().count(START), 1)

    def test_3_existing_managed_block_updates_only_block(self) -> None:
        self.home.mkdir()
        target = self.home / "AGENTS.md"
        sentinel = b"# KEEP-THIS-BYTE-FOR-BYTE\n"
        target.write_bytes(START + b"\nold rules\n" + END + b"\n\n" + sentinel)

        self.command("activate")
        self.command("activate", apply=True)
        data = target.read_bytes()
        self.assertEqual(outside_managed(data), sentinel)
        self.assertNotIn(b"old rules", data)
        self.assertIn("증거 기반 디버깅".encode(), data)

    def test_4_nonempty_override_wins_and_project_file_is_warning_only(self) -> None:
        self.home.mkdir()
        agents = self.home / "AGENTS.md"
        override = self.home / "AGENTS.override.md"
        agents_original = b"BASE-SENTINEL\n"
        override_original = b"OVERRIDE-SENTINEL\n"
        project_agents = self.project / "AGENTS.md"
        project_original = b"PROJECT-SENTINEL\n"
        agents.write_bytes(agents_original)
        override.write_bytes(override_original)
        project_agents.write_bytes(project_original)

        preview = self.command("activate")
        self.assertIn(str(override), preview.stdout)
        self.assertIn("수정하지 않음", preview.stdout)
        self.command("activate", apply=True)

        self.assertEqual(agents.read_bytes(), agents_original)
        self.assertEqual(outside_managed(override.read_bytes()), override_original)
        self.assertEqual(project_agents.read_bytes(), project_original)

    def test_5_remove_restores_original_bytes(self) -> None:
        self.home.mkdir()
        target = self.home / "AGENTS.md"
        original = b"alpha\nUNIQUE-REMOVE-SENTINEL\nomega"
        target.write_bytes(original)
        self.command("activate")
        self.command("activate", apply=True)
        preview = self.command("remove")
        self.assertIn("DRY-RUN", preview.stdout)
        self.assertIn("UNIQUE-REMOVE-SENTINEL", target.read_text())

        self.command("remove", apply=True)
        self.assertEqual(target.read_bytes(), original)
        self.assertNotIn(START, target.read_bytes())

    def test_6_openable_targets_require_clickable_markdown_links(self) -> None:
        rules = RULES.read_text(encoding="utf-8")
        self.assertIn("GitHub Flavored Markdown 링크", rules)
        self.assertIn("`다음`, `테스트`, `결과`", rules)
        self.assertIn("[파일명](/절대/파일경로) · [상위 폴더명](/절대/상위폴더)", rules)
        self.assertIn("[파일명](</절대/경로 with spaces/file.md>)", rules)
        self.assertIn("맨 경로, 맨 URL, 백틱 경로는 금지", rules)
        self.assertNotIn("  - `[PR]", rules)
        self.assertIn("같은 정본을 가리키는 기존의 더 짧은 워크스페이스 경로", rules)
        self.assertIn("일부 클라이언트가 클릭 대상을 괄호로 펼치는 것", rules)
        self.assertIn("가설 적용 · 인과 미확정", rules)
        self.assertIn("근본 해결 · 전후 인과 확인", rules)
        self.assertIn("완료물 · 미검증", rules)
        self.assertIn("작업 좌표 전체에서 한 번만 링크", rules)
        self.assertIn("위 PR #2", rules)
        self.assertIn("PR만 링크하고 개별 커밋은 생략", rules)
        self.assertIn("기본 1~2개, 최대 3개", rules)

        self.command("activate", apply=True)
        activated = (self.home / "AGENTS.md").read_text(encoding="utf-8")
        self.assertIn("[work.md](/절대/docs/work.md) · [docs](/절대/docs) · 원인 수정", activated)

    def test_7_package_exposes_the_single_node_cli(self) -> None:
        package = json.loads(PACKAGE.read_text(encoding="utf-8"))
        relative_bin = package["bin"]["work-coordinates"]
        self.assertEqual((PACKAGE.parent / relative_bin).resolve(), SCRIPT)
        self.assertEqual(package["engines"]["node"], ">=18")

        version = subprocess.run(
            [NODE, str(SCRIPT), "--version"],
            check=True,
            capture_output=True,
            text=True,
        )
        self.assertEqual(version.stdout.strip(), package["version"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
