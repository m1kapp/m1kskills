#!/usr/bin/env python3
"""Regression fixtures for non-destructive Work Coordinates activation."""

from __future__ import annotations

import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import unittest


SCRIPT = Path(__file__).resolve().parent / "work_coordinates.py"
RULES = SCRIPT.parent.parent / "references" / "work-coordinates.md"
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
        arguments = [sys.executable, str(SCRIPT), action]
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

    def test_6_results_require_clickable_markdown_links(self) -> None:
        rules = RULES.read_text(encoding="utf-8")
        self.assertIn("GitHub Flavored Markdown 링크", rules)
        self.assertIn("[라벨](</절대/경로 with spaces>)", rules)
        self.assertIn("맨 경로, 맨 URL, 백틱 경로는 금지", rules)


if __name__ == "__main__":
    unittest.main(verbosity=2)
