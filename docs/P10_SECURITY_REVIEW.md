# P10 Security / Fail-Closed Review

Reviewed properties include malformed-input rejection, missing required evidence never producing pass, human/AI claims never manufacturing machine pass, duplicate IDs failing closed, cross-task and unknown references failing closed, HumanReview validation, separate automated/human authority, provider-neutral behavior, provenance runtime validation, and strict producer allow-list behavior.

In strict provenance mode:

- a system PASS/FAIL assertion without provenance cannot produce a machine pass;
- a producer outside the configured allow-list cannot produce a machine pass;
- malformed provenance fails runtime validation;
- malformed SHA-256 artifact digests are rejected.

Known limits: provenance records and producer allow-lists improve traceability and policy enforcement but do not cryptographically authenticate producer identity. Cryptographic authenticity, durable persistence, reviewer authentication/authorization, and remote evidence fetching remain outside the Working Core.

A fresh public release review remains mandatory.
