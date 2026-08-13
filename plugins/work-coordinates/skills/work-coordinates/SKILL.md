---
name: work-coordinates
description: Keep a persistent north-star goal, evidence-backed current state, one next action, and an exact verification prompt across substantial work sessions; distinguish observation, reproduction, hypotheses, instrumentation, root-cause fixes, mitigations, and workarounds while debugging. Use for "작업 좌표", "work coordinates", "상태 보고", "현재 어디까지", "다음", "인계", evidence-based debugging, or explicit requests to activate, update, inspect, or remove the global Work Coordinates rules.
---

# Work Coordinates

Read [references/work-coordinates.md](references/work-coordinates.md) before reporting work state or debugging. That file is the single canonical rule set used both by this skill and by activation.

## Choose the operation

- For a status report, handoff, completion, pause, or substantial work session, follow the canonical rules directly.
- For debugging, apply the canonical evidence sequence and label the change honestly.
- For setup, inspection, update, or removal, use `scripts/work_coordinates.py`.

## Activate safely

Installing the plugin must not modify any `AGENTS.md` file. Activate only after the user explicitly asks to activate or install the persistent rules.

1. Run the dry-run first:

   `python3 scripts/work_coordinates.py activate`

2. Show the selected file, selection reason, project-instruction warning, and unified diff.
3. Run the write only after explicit approval:

   `python3 scripts/work_coordinates.py activate --apply`

The script uses `CODEX_HOME` when set and `~/.codex` otherwise. It chooses the active non-empty global file according to Codex precedence, never edits project instructions, creates a timestamped backup before changing an existing file, and updates only the managed marker block.

After activation, tell the user to start a new Codex session because global instructions load at session start. Give this exact verification:

`북극성은 "결제 실패를 재현하고 원인을 제거한다"입니다. 현재 상태를 한 문장 판정으로 시작하고, 마지막에 작업 좌표와 복사 가능한 테스트를 보여 주세요.`

Expected: the final response ends with `◤◤◤◤◤◤◤◤`, a five-cell gauge, the same north-star goal, one next action, and an exact input/action plus observable expectation.

## Inspect or remove

- Inspect without writing: `python3 scripts/work_coordinates.py status`
- Preview removal: `python3 scripts/work_coordinates.py remove`
- Remove after explicit approval: `python3 scripts/work_coordinates.py remove --apply`

Removal deletes only the managed block. Never delete or overwrite a user instruction file. If marker structure is malformed or duplicated, stop and report it instead of guessing.
