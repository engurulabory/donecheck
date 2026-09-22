# DoneCheck v1.1 Working Core — Release Provenance

Public repository: `engurulabory/donecheck`

Development source repository: `engurulabory/donecheck-core-foundation`

## Exact promoted revisions

- Authoritative source commit: `f555354fa756b47f6e83ab05248e63005b1054bf`
- Source PR: `engurulabory/donecheck-core-foundation#19`
- Public core promotion commit: `cd85ec0aba41fbfe241ddd28590062487b446228`
- Public promotion PR: `engurulabory/donecheck#7`

## Verified release chain

Source PR verification:
- CI — PASS
- ENGURU IP Model Trust Fleet — PASS

Source exact-main verification at `f555354fa756b47f6e83ab05248e63005b1054bf`:
- CI run `35712572969` — PASS
- ENGURU IP Model Trust Fleet run `35712572946` — PASS

Public PR verification:
- CI run `35712831010` — PASS
- ENGURU IP Model Trust Fleet run `35712830973` — PASS

Public exact-main verification at `cd85ec0aba41fbfe241ddd28590062487b446228`:
- CI run `35712883845` — PASS
- ENGURU IP Model Trust Fleet run `35712883856` — PASS

CI gates include dependency installation, lint, typecheck, automated tests, and production build.

## v1.1 promoted capability

DoneCheck v1.1 adds a vendor-neutral evidence provenance contract and producer normalization for GitHub CI, Playwright, LangSmith, Braintrust, Mac Engineer, and custom producers.

Strict verification can require provenance and an explicit producer identity allow-list before a system `[DONECHECK:PASS]` or `[DONECHECK:FAIL]` assertion becomes machine-verifiable.

The provenance contract improves traceability and policy enforcement. It does not claim cryptographic producer authentication; integration boundaries remain responsible for producer identity authentication and authorization.

Automated verification and final Human Review / Human Threshold remain separate authorities.

Human release direction: **APPROVED** on 2026-09-22.

Package-registry publication remains disabled (`private: true`) and is a separate release decision.

Claims are not evidence.
