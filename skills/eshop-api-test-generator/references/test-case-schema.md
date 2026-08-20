# Canonical test-case ledger

The validator accepts a JSON array. Each row must contain:

```json
{
  "id": "R-AI-01",
  "endpoint": "POST /api/reset-password",
  "title": "Active six-digit OTP resets a valid password",
  "origin": "Gemini Pro candidate",
  "auditLabel": "VALID",
  "auditReason": "FR-03 provides a deterministic success oracle.",
  "oracleClass": "NORMATIVE",
  "requirements": "FR-01,FR-03,SEC-07",
  "technique": "Equivalence partitioning",
  "priority": "High",
  "preconditions": "Registered isolated user and active email-bound OTP",
  "input": { "email": "...", "resetToken": "012345", "newPassword": "Valid123!" },
  "expected": "2xx response; new password authenticates; token cannot be replayed"
}
```

Rules:

- ID format: `<endpoint-prefix>-AI-##` for AI candidates or `<endpoint-prefix>-H-##` for student extensions.
- `auditLabel`: `VALID`, `INVALID`, `INCOMPLETE`, or `STUDENT_ADDED`.
- `oracleClass`: `NORMATIVE`, `OBSERVATIONAL`, or `NEEDS_HUMAN`.
- An AI candidate always keeps its AI ID and origin even when corrected.
- An invalid candidate remains in the audit ledger but must have an explicit execution disposition.
- Never put credentials, private tokens, or personal email addresses in the ledger.
