# DoneCheck

**DoneCheck is a vendor-neutral verification layer for AI-generated work.** It turns a task, measurable success criteria, AI output, and evidence into a transparent automated verification result, then preserves final human judgment as `accepted`, `revise`, or `rejected`.

> Claims are not evidence.

## Core lifecycle

`task → success criteria → AI-generated output → evidence → verification → human review → accepted / revise / rejected`

Automated verification and final human judgment remain separate authorities throughout the flow.

## ENGÜRÜ Language Governance™ integration

DoneCheck exposes a read-only governance projection for the locked ENGÜRÜ Language Governance™ contract:

`state → claim → evidence → next action`

`toLanguageGovernanceView()` converts an existing DoneCheck `VerificationResult` into that governance view without creating a second verification authority. DoneCheck remains the machine verification authority; Human Review / Human Threshold retains final human authority.

See `docs/ENGURU_LANGUAGE_GOVERNANCE_INTEGRATION.md`.

## Working Core capabilities

- runtime-validated `Task`, `SuccessCriterion`, `Evidence`, `VerificationResult`, and `HumanReview`
- deterministic, provider-neutral `verifyTask` engine
- transparent per-criterion reasons and evidence references
- `pass` / `fail` / `inconclusive` automated outcomes
- final `accepted` / `revise` / `rejected` human decisions
- explicit human override visibility
- fail-closed structural checks
- optional provenance-gated machine verification
- producer normalization for GitHub CI, Playwright, LangSmith, Braintrust, Mac Engineer, and custom producers
- read-only ENGÜRÜ Language Governance™ projection
- reusable public core entry point at `src/donecheck-core.ts`

## Machine-verifiable evidence

For an objective criterion, the Working Core interprets only criterion-scoped `system` evidence of kind `log` or `test_report` whose trimmed content begins with `[DONECHECK:PASS]` or `[DONECHECK:FAIL]`.

Human or AI claims cannot manufacture an automated pass. Subjective criteria remain inconclusive at the automated layer and require human judgment.

### Strict provenance mode

DoneCheck v1.1+ can require a producer provenance record before a system PASS/FAIL assertion becomes machine-verifiable:

```ts
const result = verifyTask({
  task,
  criteria,
  aiOutput,
  evidence,
  resultId,
  verifiedAt,
  policy: {
    requireEvidenceProvenance: true,
    trustedProducerIds: ["enguru.github-ci", "enguru.playwright"],
  },
});
```

`createProducerEvidence()` normalizes external verification producers into a common DoneCheck Evidence contract containing producer kind, producer identity, execution identity, SHA-256 artifact digest, observation time, and an optional verification reference.

A provenance record improves traceability and enables explicit producer allow-lists. It does **not** cryptographically authenticate a producer by itself; the integration boundary remains responsible for producer authentication and authorization.

## Producer model

```text
GitHub CI ─────┐
Playwright ────┤
LangSmith ─────┤
Braintrust ────┼→ DoneCheck Evidence → Verification → Human Review
Mac Engineer ──┤
Custom ────────┘
```

DoneCheck does not replace those tools. They can act as evidence producers while DoneCheck remains the verification and human-authority boundary.

## Full Product controls

DoneCheck v1.2 adds a Node runtime for production closure:

- durable append-only JSONL audit history with SHA-256 hash chaining;
- tamper detection before further writes;
- Ed25519 reviewer authentication;
- per-reviewer decision authorization;
- `recordVerifiedFinish()`, which returns a finish receipt only after machine `pass` + cryptographically authorized human `accepted`;
- a Release Authority workflow that requires merged-PR provenance before an exact `main` SHA is treated as a verified release.

The provider-neutral Working Core remains available from `src/donecheck-core.ts`. Node production controls are exposed separately from `src/donecheck-runtime-node.ts`.

See `docs/FULL_PRODUCT_CONTROLS.md`.

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
import {
  createProducerEvidence,
  verifyTask,
  transitionToHumanDecision,
  toLanguageGovernanceView,
} from "./src/donecheck-core";
```

## Reference application contract

`docs/REFERENCE_APP_CONTRACT.md` defines the required eight-step product flow from task definition through final human judgment.

## Architecture and security

See `docs/ARCHITECTURE.md`, `docs/P10_SECURITY_REVIEW.md`, `SECURITY.md`, and `RELEASE_PROVENANCE.md`.

## License

Apache License 2.0. See `LICENSE`.

## Release status

This public Working Core is promoted from the controlled development repository through evidence-backed review and independent public CI. Package-registry publication remains a separate decision.
