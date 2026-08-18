# ENGÜRÜ Language Governance™ × DoneCheck™

Status: **FINAL INTEGRATION CONTRACT**

Date: 2026-08-19

## Research origin

ENGÜRÜ Language Governance™ grew from approximately two years of R&D that inverted the usual model-benchmark question.

The common benchmark asks:

> Which AI model is more correct?

The ENGÜRÜ research question became:

> How well do we understand the AI system, and under which language and decision structure does it behave more truthfully, verifiably and recoverably?

Prompt and behavior experiments repeatedly focused on the relationship between language, state interpretation, completion claims, evidence, recovery and human authority. The resulting compact governance core is:

`state → claim → evidence → next action`

The purpose is not stylistic prompting. The purpose is to govern production truth behavior.

## Authority boundary

ENGÜRÜ Language Governance™ and DoneCheck™ are complementary, not competing, authorities.

- **ENGÜRÜ Language Governance™** keeps state, claim, evidence and next action aligned during production communication and decision behavior.
- **DoneCheck™** performs evidence-bound verification and produces the automated verification result.
- **Human Review / Human Threshold** retains final authority where human judgment or approval is required.

Language Governance must never manufacture a DoneCheck PASS, replace evidence, or bypass Human Review.

## DoneCheck projection

DoneCheck exposes a read-only Language Governance view through `toLanguageGovernanceView()`.

The adapter maps a verified `VerificationResult` into:

- `state` — DoneCheck verification outcome
- `claim` — DoneCheck verification reason
- `evidenceIds` — evidence references already bound by DoneCheck
- `nextAction` — the next sufficient action for the current state
- `humanThresholdRequired` — always true before final human acceptance

The projection creates no second decision engine.

## Fail-closed behavior

- `pass` → proceed to Human Review; automated PASS is not final acceptance
- `fail` → revise failed criteria, produce new evidence, re-run DoneCheck
- `inconclusive` → collect sufficient criterion-scoped evidence, re-run DoneCheck

A claim cannot substitute for evidence.

## Final operating chain

`Niyet → ENGÜRÜ Language Governance™ → Üretim → Evidence → DoneCheck™ → Mizan / Human Threshold → Verified Finish`

Within that chain, Language Governance continuously preserves:

`state → claim → evidence → next action`

DoneCheck remains the final machine verification authority.

## Truth boundary

**PASS** — the DoneCheck integration contract and read-only governance projection are implemented and testable.

**HOLD** — universal generalization of ENGÜRÜ Language Governance™ across independent models and real field environments remains governed by its separate G1–G5 evidence program. This DoneCheck integration does not inflate that evidence score.
