# DoneCheck Working Core Architecture

DoneCheck separates what the user asked for, how success is measured, what evidence exists, and who has final authority.

`Task → SuccessCriterion[] → AI output + Evidence[] → VerificationResult → HumanReview`

The reusable entry point is `src/donecheck-core.ts`.

## Verification authority

`verifyTask` is deterministic and provider-neutral. Structural inconsistency fails closed; any required failure produces `fail`; missing or insufficient required evidence produces `inconclusive`; all required criteria passing produces `pass`. Subjective criteria remain inconclusive at the automated layer.

`transitionToHumanDecision` validates result/review references and preserves final human authority. Automated results never become final acceptance by themselves.

## Evidence producers and provenance

External systems may act as evidence producers without becoming DoneCheck authorities.

Supported producer classes are:

- GitHub CI
- Playwright
- LangSmith
- Braintrust
- Mac Engineer
- custom producers

`createProducerEvidence()` normalizes those producers into criterion-scoped DoneCheck system evidence.

An `EvidenceProvenance` record contains:

- producer kind
- producer identity
- execution identity
- SHA-256 artifact digest
- observation timestamp
- optional verification reference

Strict verification can set `requireEvidenceProvenance: true` and optionally provide `trustedProducerIds`. A system PASS/FAIL assertion that does not satisfy the active provenance policy remains `inconclusive`.

The producer allow-list is an explicit trust policy. It is not cryptographic authentication. Authentication and authorization of a producer remain responsibilities of the integration boundary.

## Trust boundary

DoneCheck does not treat AI prose, human prose, or unscoped external claims as machine proof.

The Working Core does not require UI components, browser APIs, LLM/provider SDKs, network access, persistence clients, authentication providers, credentials, or secrets. Zod is the runtime validation dependency.

Cryptographic producer identity, durable persistence, reviewer authentication/authorization, and remote artifact retrieval remain separate layers.

Claims are not evidence.
