# Minimal Reference Application Contract

The visible product must preserve this eight-step chain:

1. define task
2. define measurable success criteria
3. provide AI-generated output
4. attach evidence
5. run verification
6. inspect overall and criterion-level reasons/evidence references
7. perform human review
8. finalize as accepted / revise / rejected

Every external Task, SuccessCriterion, Evidence, VerificationResult, and HumanReview value crosses its runtime validator. `fail` and `inconclusive` are first-class outcomes. A missing or malformed HumanReview cannot become final acceptance. UI code may change presentation but must not recreate or weaken Working Core rules.

Claims are not evidence.
