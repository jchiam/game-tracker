## 1. Sync specs to main

- [ ] 1.1 Run `/opsx:sync` to merge delta spec into `openspec/specs/`
- [ ] 1.2 Verify `openspec/specs/r1999-arcanist-detail/spec.md` exists and contains all requirements

## 2. Validate and archive

- [ ] 2.1 Run `openspec validate --all --json` and confirm 0 failures
- [ ] 2.2 Run `/opsx:archive` to close this bootstrap change
