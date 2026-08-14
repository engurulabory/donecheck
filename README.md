# DoneCheck

**DoneCheck is a vendor-neutral verification layer for AI-generated work.** It turns a task, measurable success criteria, AI output, and evidence into a transparent automated verification result, then preserves final human judgment as `accepted`, `revise`, or `rejected`.

> Claims are not evidence.

## Core lifecycle

`task → success criteria → AI-generated output → evidence → verification → human review → accepted / revise / rejected`

Automated verification and final human judgment remain separate authorities throughout the flow.

## Working Core capabilities

- runtime-validated `Task`, `SuccessCriterion`, `Evidence`, `VerificationResult`, and `HumanReview`
- deterministic, provider-neutral `verifyTask` engine
- transparent per-criterion reasons and evidence references
- `pass` / `fail` / `inconclusive` automated outcomes
- final `accepted` / `revise` / `rejected` human decisions
- explicit human override visibility
- fail-closed structural checks
- reusable public core entry point at `src/donecheck-core.ts`

## Current machine-verifiable evidence rule

For an objective criterion, the Working Core automatically interprets only criterion-scoped `system` evidence of kind `log` or `test_report` whose trimmed content begins with `[DONECHECK:PASS]` or `[DONECHECK:FAIL]`.

Human or AI claims cannot manufacture an automated pass. Subjective criteria remain inconclusive at the automated layer and require human judgment.

## Quick start

```sh
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

Public core entry point:

```ts
import { verifyTask, transitionToHumanDecision } from "./src/donecheck-core";
```

## Reference application contract

`docs/REFERENCE_APP_CONTRACT.md` defines the required eight-step product flow from task definition through final human judgment.

## Architecture and security

See `docs/ARCHITECTURE.md`, `docs/P10_SECURITY_REVIEW.md`, `SECURITY.md`, and `RELEASE_PROVENANCE.md`.

## License

Apache License 2.0. See `LICENSE`.

## Release status

This public Working Core was promoted from the controlled development repository after explicit human approval. Exact provenance is recorded in `RELEASE_PROVENANCE.md`.
