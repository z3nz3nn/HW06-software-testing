# POST /api/reset-password — Human Audit Ledger

| Label | Count |
| --- | --- |
| VALID | 32 |
| INCOMPLETE | 10 |
| STUDENT_ADDED | 6 |

## Corrected or constrained AI rows

| Case | Audit label | Reason |
| --- | --- | --- |
| R-AI-11 | INCOMPLETE | Whitespace normalization is not specified; record actual behavior. |
| R-AI-12 | INCOMPLETE | Internal whitespace policy is unspecified. |
| R-AI-13 | INCOMPLETE | Unicode policy is unspecified. |
| R-AI-14 | INCOMPLETE | No maximum is specified; only stability is asserted. |
| R-AI-15 | INCOMPLETE | The SUT schema exposes no OTP expiry fixture; requires controlled time/database support. |
| R-AI-23 | INCOMPLETE | Requires a parallel runner; the Newman row records the baseline behavior. |
| R-AI-25 | INCOMPLETE | The requirements provide an example, not a complete email grammar. |
| R-AI-26 | INCOMPLETE | Email normalization is unspecified. |
| R-AI-34 | INCOMPLETE | The API specification example does not explicitly define JSON type coercion. |
| R-AI-39 | INCOMPLETE | Strict-versus-permissive extra-property handling is unspecified. |

VALID rows have a normative or deliberately conservative executable oracle. INVALID rows remain visible for traceability and are corrected/excluded explicitly. INCOMPLETE rows assert only safe observations because the specification is silent.
