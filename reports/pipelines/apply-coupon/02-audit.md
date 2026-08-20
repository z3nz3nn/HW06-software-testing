# POST /api/apply-coupon — Human Audit Ledger

| Label | Count |
| --- | --- |
| INCOMPLETE | 9 |
| VALID | 33 |
| INVALID | 2 |
| STUDENT_ADDED | 5 |

## Corrected or constrained AI rows

| Case | Audit label | Reason |
| --- | --- | --- |
| C-AI-01 | INCOMPLETE | Original AI oracle incorrectly claimed apply-coupon consumes usage; corrected to an idempotent calculation. |
| C-AI-07 | INCOMPLETE | Rejecting or using the JWT identity are both defensible. |
| C-AI-14 | INCOMPLETE | Code normalization is unspecified. |
| C-AI-23 | INCOMPLETE | Currency rounding is unspecified. |
| C-AI-27 | INCOMPLETE | JSON type coercion is unspecified. |
| C-AI-29 | INVALID | AI originally asserted usage increments; corrected case verifies idempotence and unchanged usage. |
| C-AI-30 | INVALID | AI originally asserted usage increments; corrected to externally seeded max-1. |
| C-AI-39 | INCOMPLETE | Extra property policy is unspecified. |
| C-AI-41 | INCOMPLETE | Duplicate-key parsing is unspecified. |
| C-AI-42 | INCOMPLETE | Type coercion is unspecified. |
| C-AI-44 | INCOMPLETE | Requires controlled clock; seeded EXPIRED provides executable equivalent coverage. |

VALID rows have a normative or deliberately conservative executable oracle. INVALID rows remain visible for traceability and are corrected/excluded explicitly. INCOMPLETE rows assert only safe observations because the specification is silent.
