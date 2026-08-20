# POST /api/reset-password — Generation

- Gemini sequence: RESET-P1 → RESET-P2 → RESET-P3
- Initial generated candidate target/result: 42
- Canonical AI candidates after correction: 42
- Evidence: `evidence/gemini/reset-password-session.txt` and matching timestamp JSON/screenshot.

The correction phase removed invented status-code and email-grammar assumptions before generation.

Coverage was driven parameter-by-parameter, then by state, applicable security rules, and schema/robustness. Implementation behavior was not supplied to Gemini during candidate generation.
