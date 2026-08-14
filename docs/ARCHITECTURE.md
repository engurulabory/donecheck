# DoneCheck Working Core Architecture

DoneCheck separates what the user asked for, how success is measured, what evidence exists, and who has final authority.

`Task → SuccessCriterion[] → AI output + Evidence[] → VerificationResult → HumanReview`

The reusable entry point is `src/donecheck-core.ts`.

`verifyTask` is deterministic and provider-neutral. Structural inconsistency fails closed; any required failure produces `fail`; missing or insufficient required evidence produces `inconclusive`; all required criteria passing produces `pass`. Subjective criteria remain inconclusive at the automated layer.

`transitionToHumanDecision` validates result/review references and preserves final human authority. Automated results never become final acceptance by themselves.

The Working Core does not require UI components, browser APIs, LLM/provider SDKs, network access, persistence clients, authentication providers, credentials, or secrets. Zod is the runtime validation dependency.

Claims are not evidence.
