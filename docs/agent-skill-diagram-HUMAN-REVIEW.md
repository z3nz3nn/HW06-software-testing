# Agent Skill Diagram — Human Drawing Checklist

**Do not submit this file as the diagram.** The assignment explicitly requires a self-drawn diagram. Use this only as a completeness checklist, then make your own design decisions and draw/export the final PNG manually.

Include, in your own layout and wording:

1. Inputs: API specification, FR/SEC rules, selected endpoint, execution environment.
2. Requirement decomposer: parameters, equivalence partitions, boundaries, states, security, schema.
3. Ambiguity gate: normative oracle vs observational oracle vs human clarification.
4. Candidate generator: ≥35 rows, traceability IDs, prerequisites, request, expected result.
5. Audit loop: VALID / INVALID / INCOMPLETE with reason and correction.
6. Human-extension gate: at least five missed risks.
7. Emitters: canonical JSON, Postman collection/data, Excel, audit ledger.
8. Runner: fixture isolation → SUT → Newman → HTML/JUnit/compact summary.
9. Feedback: failed requirement assertion → bug candidate → reproduce/triage → GitHub issue.
10. Human sign-off boundaries: identity evidence, row review, issue publication, self-drawn diagram, video/submission.

Add arrows that make the correction loop and human decision points unambiguous. Put your name/date on the editable source and export a PNG.
