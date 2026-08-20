# Genuine Bug Reports

These reports separate test-oracle failures from test-harness failures. Each defect is supported by repeatable black-box evidence; source inspection is used only to explain the likely cause. GitHub Issue creation is deferred until the student approves the representational action and public-repository change.


## BUG-01 — Passwords are stored in plaintext and login returns the full user record including password/reset_token/locked_until.

- Severity: **Critical**
- Area: Authentication
- Evidence cases: R-H-05, R-H-06
- Environment: EShop backend, Node.js, SQLite, `http://127.0.0.1:3000`

### Steps to reproduce

1. From PowerShell in the repository root, run `npm.cmd run test:api -- --student-id YOUR_REAL_STUDENT_ID`.
2. Open the matching latest HTML report under `evidence/newman/`.
3. Filter or search for the evidence case IDs above.
4. Compare the response and database-state assertion with the authoritative FR/SEC rule.

### Expected

The endpoint enforces the cited business/security rule, returns a non-leaking response, and preserves the required state invariant.

### Actual

The recorded assertion fails consistently in the isolated local run. See `evidence/newman/dry-run-summary.json` and the endpoint HTML report. The current files are labeled dry-run until the real `X-Student-Id` rerun is made.

### GitHub evidence

- Issue URL: **HUMAN_REVIEW_REQUIRED_AFTER_PUBLIC_PUSH**
- Screenshot: **HUMAN_REVIEW_REQUIRED — attach the real Newman/response screenshot to the issue**


## BUG-02 — Reset accepts weak, missing, null, empty, and numeric passwords, contrary to FR-01.

- Severity: **High**
- Area: Password reset
- Evidence cases: R-AI-05..10, R-AI-35..38
- Environment: EShop backend, Node.js, SQLite, `http://127.0.0.1:3000`

### Steps to reproduce

1. From PowerShell in the repository root, run `npm.cmd run test:api -- --student-id YOUR_REAL_STUDENT_ID`.
2. Open the matching latest HTML report under `evidence/newman/`.
3. Filter or search for the evidence case IDs above.
4. Compare the response and database-state assertion with the authoritative FR/SEC rule.

### Expected

The endpoint enforces the cited business/security rule, returns a non-leaking response, and preserves the required state invariant.

### Actual

The recorded assertion fails consistently in the isolated local run. See `evidence/newman/dry-run-summary.json` and the endpoint HTML report. The current files are labeled dry-run until the real `X-Student-Id` rerun is made.

### GitHub evidence

- Issue URL: **HUMAN_REVIEW_REQUIRED_AFTER_PUBLIC_PUSH**
- Screenshot: **HUMAN_REVIEW_REQUIRED — attach the real Newman/response screenshot to the issue**


## BUG-03 — Forgot-password generates only four digits and stores no expiry timestamp; SEC-07 cannot be met.

- Severity: **High**
- Area: OTP lifecycle
- Evidence cases: Source review + R-AI-15
- Environment: EShop backend, Node.js, SQLite, `http://127.0.0.1:3000`

### Steps to reproduce

1. From PowerShell in the repository root, run `npm.cmd run test:api -- --student-id YOUR_REAL_STUDENT_ID`.
2. Open the matching latest HTML report under `evidence/newman/`.
3. Filter or search for the evidence case IDs above.
4. Compare the response and database-state assertion with the authoritative FR/SEC rule.

### Expected

The endpoint enforces the cited business/security rule, returns a non-leaking response, and preserves the required state invariant.

### Actual

The recorded assertion fails consistently in the isolated local run. See `evidence/newman/dry-run-summary.json` and the endpoint HTML report. The current files are labeled dry-run until the real `X-Student-Id` rerun is made.

### GitHub evidence

- Issue URL: **HUMAN_REVIEW_REQUIRED_AFTER_PUBLIC_PUSH**
- Screenshot: **HUMAN_REVIEW_REQUIRED — attach the real Newman/response screenshot to the issue**


## BUG-04 — Apply-coupon has no JWT gate and trusts body user_id, enabling identity substitution and usage-limit bypass.

- Severity: **Critical**
- Area: Coupon authorization
- Evidence cases: C-AI-02..06, C-AI-08..09
- Environment: EShop backend, Node.js, SQLite, `http://127.0.0.1:3000`

### Steps to reproduce

1. From PowerShell in the repository root, run `npm.cmd run test:api -- --student-id YOUR_REAL_STUDENT_ID`.
2. Open the matching latest HTML report under `evidence/newman/`.
3. Filter or search for the evidence case IDs above.
4. Compare the response and database-state assertion with the authoritative FR/SEC rule.

### Expected

The endpoint enforces the cited business/security rule, returns a non-leaking response, and preserves the required state invariant.

### Actual

The recorded assertion fails consistently in the isolated local run. See `evidence/newman/dry-run-summary.json` and the endpoint HTML report. The current files are labeled dry-run until the real `X-Student-Id` rerun is made.

### GitHub evidence

- Issue URL: **HUMAN_REVIEW_REQUIRED_AFTER_PUBLIC_PUSH**
- Screenshot: **HUMAN_REVIEW_REQUIRED — attach the real Newman/response screenshot to the issue**


## BUG-05 — Percent discount uses total × (1 − discount_value), yielding negative discounts and inflated final totals.

- Severity: **High**
- Area: Coupon formula
- Evidence cases: C-AI-01, C-AI-19, C-AI-34
- Environment: EShop backend, Node.js, SQLite, `http://127.0.0.1:3000`

### Steps to reproduce

1. From PowerShell in the repository root, run `npm.cmd run test:api -- --student-id YOUR_REAL_STUDENT_ID`.
2. Open the matching latest HTML report under `evidence/newman/`.
3. Filter or search for the evidence case IDs above.
4. Compare the response and database-state assertion with the authoritative FR/SEC rule.

### Expected

The endpoint enforces the cited business/security rule, returns a non-leaking response, and preserves the required state invariant.

### Actual

The recorded assertion fails consistently in the isolated local run. See `evidence/newman/dry-run-summary.json` and the endpoint HTML report. The current files are labeled dry-run until the real `X-Student-Id` rerun is made.

### GitHub evidence

- Issue URL: **HUMAN_REVIEW_REQUIRED_AFTER_PUBLIC_PUSH**
- Screenshot: **HUMAN_REVIEW_REQUIRED — attach the real Newman/response screenshot to the issue**


## BUG-06 — Minimum-order check uses > instead of >=, rejecting exact threshold values.

- Severity: **Medium**
- Area: Coupon boundary
- Evidence cases: C-AI-18, C-AI-21, C-AI-22
- Environment: EShop backend, Node.js, SQLite, `http://127.0.0.1:3000`

### Steps to reproduce

1. From PowerShell in the repository root, run `npm.cmd run test:api -- --student-id YOUR_REAL_STUDENT_ID`.
2. Open the matching latest HTML report under `evidence/newman/`.
3. Filter or search for the evidence case IDs above.
4. Compare the response and database-state assertion with the authoritative FR/SEC rule.

### Expected

The endpoint enforces the cited business/security rule, returns a non-leaking response, and preserves the required state invariant.

### Actual

The recorded assertion fails consistently in the isolated local run. See `evidence/newman/dry-run-summary.json` and the endpoint HTML report. The current files are labeled dry-run until the real `X-Student-Id` rerun is made.

### GitHub evidence

- Issue URL: **HUMAN_REVIEW_REQUIRED_AFTER_PUBLIC_PUSH**
- Screenshot: **HUMAN_REVIEW_REQUIRED — attach the real Newman/response screenshot to the issue**


## BUG-07 — Import-products authenticates a JWT but never enforces role=admin.

- Severity: **Critical**
- Area: Admin authorization
- Evidence cases: I-AI-02, I-AI-56
- Environment: EShop backend, Node.js, SQLite, `http://127.0.0.1:3000`

### Steps to reproduce

1. From PowerShell in the repository root, run `npm.cmd run test:api -- --student-id YOUR_REAL_STUDENT_ID`.
2. Open the matching latest HTML report under `evidence/newman/`.
3. Filter or search for the evidence case IDs above.
4. Compare the response and database-state assertion with the authoritative FR/SEC rule.

### Expected

The endpoint enforces the cited business/security rule, returns a non-leaking response, and preserves the required state invariant.

### Actual

The recorded assertion fails consistently in the isolated local run. See `evidence/newman/dry-run-summary.json` and the endpoint HTML report. The current files are labeled dry-run until the real `X-Student-Id` rerun is made.

### GitHub evidence

- Issue URL: **HUMAN_REVIEW_REQUIRED_AFTER_PUBLIC_PUSH**
- Screenshot: **HUMAN_REVIEW_REQUIRED — attach the real Newman/response screenshot to the issue**


## BUG-08 — Rows validate only truthy name; invalid price/category/name-length values are inserted.

- Severity: **High**
- Area: Import validation
- Evidence cases: I-AI-21..33, I-H-04
- Environment: EShop backend, Node.js, SQLite, `http://127.0.0.1:3000`

### Steps to reproduce

1. From PowerShell in the repository root, run `npm.cmd run test:api -- --student-id YOUR_REAL_STUDENT_ID`.
2. Open the matching latest HTML report under `evidence/newman/`.
3. Filter or search for the evidence case IDs above.
4. Compare the response and database-state assertion with the authoritative FR/SEC rule.

### Expected

The endpoint enforces the cited business/security rule, returns a non-leaking response, and preserves the required state invariant.

### Actual

The recorded assertion fails consistently in the isolated local run. See `evidence/newman/dry-run-summary.json` and the endpoint HTML report. The current files are labeled dry-run until the real `X-Student-Id` rerun is made.

### GitHub evidence

- Issue URL: **HUMAN_REVIEW_REQUIRED_AFTER_PUBLIC_PUSH**
- Screenshot: **HUMAN_REVIEW_REQUIRED — attach the real Newman/response screenshot to the issue**


## BUG-09 — Mixed-invalid batches partially commit instead of rolling back the whole batch.

- Severity: **High**
- Area: Import atomicity
- Evidence cases: I-AI-40..42, I-AI-51, I-H-01
- Environment: EShop backend, Node.js, SQLite, `http://127.0.0.1:3000`

### Steps to reproduce

1. From PowerShell in the repository root, run `npm.cmd run test:api -- --student-id YOUR_REAL_STUDENT_ID`.
2. Open the matching latest HTML report under `evidence/newman/`.
3. Filter or search for the evidence case IDs above.
4. Compare the response and database-state assertion with the authoritative FR/SEC rule.

### Expected

The endpoint enforces the cited business/security rule, returns a non-leaking response, and preserves the required state invariant.

### Actual

The recorded assertion fails consistently in the isolated local run. See `evidence/newman/dry-run-summary.json` and the endpoint HTML report. The current files are labeled dry-run until the real `X-Student-Id` rerun is made.

### GitHub evidence

- Issue URL: **HUMAN_REVIEW_REQUIRED_AFTER_PUBLIC_PUSH**
- Screenshot: **HUMAN_REVIEW_REQUIRED — attach the real Newman/response screenshot to the issue**


## BUG-10 — Malformed JSON and null rows expose Express/Node stack details.

- Severity: **Medium**
- Area: Error handling
- Evidence cases: R-AI-40, C-AI-40, I-AI-45, I-H-01
- Environment: EShop backend, Node.js, SQLite, `http://127.0.0.1:3000`

### Steps to reproduce

1. From PowerShell in the repository root, run `npm.cmd run test:api -- --student-id YOUR_REAL_STUDENT_ID`.
2. Open the matching latest HTML report under `evidence/newman/`.
3. Filter or search for the evidence case IDs above.
4. Compare the response and database-state assertion with the authoritative FR/SEC rule.

### Expected

The endpoint enforces the cited business/security rule, returns a non-leaking response, and preserves the required state invariant.

### Actual

The recorded assertion fails consistently in the isolated local run. See `evidence/newman/dry-run-summary.json` and the endpoint HTML report. The current files are labeled dry-run until the real `X-Student-Id` rerun is made.

### GitHub evidence

- Issue URL: **HUMAN_REVIEW_REQUIRED_AFTER_PUBLIC_PUSH**
- Screenshot: **HUMAN_REVIEW_REQUIRED — attach the real Newman/response screenshot to the issue**
