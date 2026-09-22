# DoneCheck v1.2 — Full Product Controls

DoneCheck v1.2 closes three production-control boundaries without changing the v1.1 verification semantics.

## 1. Release Authority

GitHub branch protection is useful defense-in-depth, but it is not the DoneCheck release authority.

The authoritative rule is:

`main SHA → merged PR provenance → CI gates → Release Authority PASS → release receipt`

A direct push may technically change GitHub `main` when repository administration permits it. It does **not** become a DoneCheck Verified Release. The `Release Authority` workflow fails closed unless the exact SHA is the merge result of a pull request into `main`, then reruns lint, typecheck, tests, and build before emitting a release receipt artifact.

This is the compensating control for environments where native branch protection is unavailable or intentionally not relied upon.

## 2. Durable audit history

The Node runtime exposes `JsonlAuditLedger`.

Properties:

- append-only JSONL storage;
- process-safe lock file around writes;
- filesystem sync before successful return;
- monotonic sequence numbers;
- duplicate event-ID rejection;
- SHA-256 hash chaining;
- full-chain verification on reopen;
- tamper detection before further writes.

A corrupted ledger fails closed.

## 3. Reviewer authentication and authorization

The Node runtime supports Ed25519 reviewer attestations.

A reviewer authority record binds:

- `reviewerId`;
- `keyId`;
- Ed25519 public key;
- optional allowed human decisions.

The signed payload covers the complete `HumanReview` plus attestation timestamp. A changed decision, reason, reviewer identity, or signature fails verification.

Private signing keys remain outside DoneCheck source control. DoneCheck verifies public-key attestations.

## Verified Finish

`recordVerifiedFinish()` is the production closure gate.

It requires all of the following:

1. valid cryptographic reviewer attestation;
2. reviewer authorization for the decision;
3. automated `VerificationResult.outcome === "pass"`;
4. final human decision `accepted`;
5. durable append of authorization and finish events into the verified audit ledger.

Only then is a `donecheck.verified-finish/v1` receipt returned.

## Authority chain

```text
Evidence Producers
      ↓
DoneCheck Verification
      ↓
PASS
      ↓
Cryptographically Authorized Human Review
      ↓
Durable Tamper-Evident Audit Ledger
      ↓
Verified Finish Receipt
```

Repository release authority is parallel:

```text
Merged PR
   ↓
Exact main SHA
   ↓
Release Authority CI
   ↓
Release Receipt
```

Claims are not evidence.
