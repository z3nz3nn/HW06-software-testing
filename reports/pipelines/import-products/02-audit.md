# POST /api/admin/import-products — Human Audit Ledger

| Label | Count |
| --- | --- |
| VALID | 32 |
| INVALID | 7 |
| INCOMPLETE | 17 |
| STUDENT_ADDED | 5 |

## Corrected or constrained AI rows

| Case | Audit label | Reason |
| --- | --- | --- |
| I-AI-08 | INVALID | AI incorrectly called this pre-processing rejection; corrected to authenticated payload validation. |
| I-AI-09 | INVALID | Corrected outcome terminology. |
| I-AI-10 | INVALID | Corrected outcome terminology. |
| I-AI-11 | INVALID | Corrected outcome terminology. |
| I-AI-12 | INVALID | Original outcome was observational; API cannot import zero rows and should reject at validation. |
| I-AI-14 | INCOMPLETE | Batch-size limits are unspecified; reduced to 500 for safe execution. |
| I-AI-18 | INCOMPLETE | Trimming is unspecified. |
| I-AI-27 | INVALID | AI marked this observational despite the stated numeric >0 rule; corrected to commit. |
| I-AI-28 | INCOMPLETE | JSON coercion is unspecified. |
| I-AI-29 | INCOMPLETE | No maximum is specified. |
| I-AI-34 | INCOMPLETE | JSON coercion is unspecified. |
| I-AI-35 | INCOMPLETE | Optional-field behavior is unspecified. |
| I-AI-36 | INCOMPLETE | Optional-field behavior is unspecified. |
| I-AI-37 | INCOMPLETE | No description maximum is specified. |
| I-AI-38 | INCOMPLETE | URL validation is unspecified. |
| I-AI-39 | INCOMPLETE | API storage can be checked; safe UI rendering requires a separate end-to-end review. |
| I-AI-43 | INCOMPLETE | Black-box literal handling is evidence but source review is needed to prove parameterization. |
| I-AI-44 | INCOMPLETE | Extra-property handling is unspecified. |
| I-AI-46 | INCOMPLETE | Duplicate-key behavior is parser-dependent. |
| I-AI-47 | INCOMPLETE | Name uniqueness is unspecified. |
| I-AI-48 | INVALID | Ordinary black-box input cannot establish this precondition; controlled fault injection is required. |
| I-AI-50 | INCOMPLETE | Optional-field null semantics are unspecified. |
| I-AI-53 | INCOMPLETE | Safe ignore or rejection are both acceptable; no prototype mutation is allowed. |
| I-AI-54 | INCOMPLETE | Idempotency and name uniqueness are unspecified; parallel execution is a companion run. |

VALID rows have a normative or deliberately conservative executable oracle. INVALID rows remain visible for traceability and are corrected/excluded explicitly. INCOMPLETE rows assert only safe observations because the specification is silent.
