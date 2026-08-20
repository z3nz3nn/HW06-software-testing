# POST /api/apply-coupon — Generation

- Gemini sequence: COUPON-P1 → COUPON-P2 → COUPON-P3 → COUPON-P4
- Initial generated candidate target/result: 45
- Canonical AI candidates after correction: 44
- Evidence: `evidence/gemini/apply-coupon-session.txt` and matching timestamp JSON/screenshot.

The final correction ledger excluded one unusable concurrency case and corrected usage-state assumptions.

Coverage was driven parameter-by-parameter, then by state, applicable security rules, and schema/robustness. Implementation behavior was not supplied to Gemini during candidate generation.
