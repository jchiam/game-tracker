## 1. Sync specs to main

- [ ] 1.1 Run `/openspec-sync-specs` to merge both delta specs into `openspec/specs/`
- [ ] 1.2 Verify `openspec/specs/roster/spec.md` exists and contains all requirements
- [ ] 1.3 Verify `openspec/specs/parties/spec.md` exists and contains all requirements

## 2. Validate and archive

- [ ] 2.1 Run `openspec validate --all --json` and confirm 0 failures
- [ ] 2.2 Run `/openspec-archive-change` to close this bootstrap change
