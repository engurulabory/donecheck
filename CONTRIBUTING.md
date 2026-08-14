# Contributing to DoneCheck

Thank you for helping improve DoneCheck.

Contributions should preserve vendor-neutral architecture, explicit runtime validation, evidence over completion claims, fail-closed handling, transparent reasons/evidence references, and separation between automated `VerificationResult` and final `HumanReview`.

Before proposing a change, run:

```sh
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

Changes to contracts, validation rules, verification aggregation, evidence semantics, or human review authority should include focused positive and negative tests.

Do not commit secrets or silently weaken fail-closed behavior.

Claims are not evidence.
