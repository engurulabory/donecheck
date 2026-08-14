# Public Core API / Package Boundary

Stable reusable entry point: `src/donecheck-core.ts`.

It exposes Task, SuccessCriterion, Evidence, VerificationResult, HumanReview contracts and validators, deterministic `verifyTask`, and `transitionToHumanDecision`.

The boundary is independent of React/UI, browser APIs, provider SDKs, LLM APIs, network calls, persistence clients, authentication providers, secrets, and credentials.

Package-registry publishing is intentionally disabled; `package.json` remains `private: true`.
