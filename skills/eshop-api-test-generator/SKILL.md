---
name: eshop-api-test-generator
description: Generate, audit, and export traceable API test cases from the EShop specification. Use when asked to design 35+ cases for an EShop endpoint, distinguish normative and observational oracles, add human-review extensions, or validate a case ledger before Postman/Newman generation.
---

# EShop API Test Generator

Generate auditable cases in phases. Never infer a rule from the implementation when the specification is silent.

## Workflow

1. Read the API specification and the cited FR/SEC requirements completely.
2. Select one endpoint. Record the request method, path, schema, authentication, roles, response promises, and observable persistent state.
3. Produce a traceability model before cases:
   - equivalence partitions and boundaries for every parameter;
   - legal and illegal state transitions;
   - applicable SEC-01–SEC-07 threats;
   - request/response schema rules;
   - explicit ambiguities.
4. Classify each oracle:
   - `NORMATIVE` when an authoritative rule gives a binary verdict;
   - `OBSERVATIONAL` when behavior is unspecified; assert only safety, stability, or recorded state;
   - `NEEDS_HUMAN` when the precondition cannot be produced safely or deterministically.
5. Generate at least 35 AI candidate rows. Give each a unique endpoint-scoped ID, requirement trace, precondition, exact input variation, expected outcome, technique, and priority.
6. Audit every candidate as `VALID`, `INVALID`, or `INCOMPLETE`, with a concrete reason. Correct or exclude invalid rows. Never silently relabel them.
7. Add at least five `STUDENT_ADDED` rows focused on risks the generation pass missed. Require the student to approve these rows; do not claim automated output is human work.
8. Save the ledger as JSON using [test-case-schema.md](references/test-case-schema.md), then run:

   `node scripts/validate_cases.mjs path/to/cases.json`

9. Only after validation, emit data-driven Postman rows and Excel/report views. Keep a single canonical ledger to prevent count and oracle drift.
10. Execute against an isolated SUT. Preserve failed normative assertions as defect evidence. Do not force a green report.

## Quality Gates

- Reject a ledger with fewer than 35 AI candidates, duplicate IDs, missing reasons, or fewer than five student extensions.
- Do not require an exact status code or error schema unless specified.
- Do not treat SQL/XSS-looking literals as invalid solely because they are adversarial; parameterization/encoding should preserve safe literals where allowed.
- Do not mix frontend CSV parsing cases into a JSON import API unless explicitly labeled as frontend scope.
- Separate JWT authentication, role authorization, and body identity trust.
- For database mutations, verify state before and after, including rollback/atomicity.
- For secrets, assert both storage protection and response non-disclosure where observable.

## Outputs

Return:

1. Requirement/ambiguity table.
2. Canonical JSON ledger.
3. Audit counts and correction ledger.
4. Five-or-more human-review extensions with missed-risk explanations.
5. Postman/export guidance and execution limitations.
6. A list of items requiring genuine human evidence or approval.

Do not generate the homework's final “self-drawn” diagram. Explain components so the student can draw it personally.
