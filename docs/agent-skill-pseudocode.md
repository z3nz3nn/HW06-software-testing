# AI-Driven API Test Generator — Pseudocode

```text
GENERATE_AND_AUDIT(specification, endpoint, minimumAI = 35):
    requirements ← read_authoritative_FR_SEC_and_endpoint_contract(specification, endpoint)
    model ← decompose(requirements,
                      parameters = partitions + boundaries + JSON types,
                      states = transitions + persistent invariants,
                      security = applicable_SEC_rules + trust_boundaries,
                      schema = request + response,
                      ambiguities = unspecified_behavior)

    FOR each proposed oracle IN model:
        IF directly supported by requirement:
            oracle.class ← NORMATIVE
        ELSE IF safe behavior can be observed without inventing success/failure:
            oracle.class ← OBSERVATIONAL
        ELSE:
            oracle.class ← NEEDS_HUMAN

    candidates ← AI_generate_stepwise(model, count ≥ minimumAI)

    audited ← empty ledger
    FOR each case IN candidates:
        trace ← map_to_requirement_and_model_partition(case)
        precondition ← determine_reproducible_fixture(case)
        IF contradiction OR duplicate OR impossible precondition:
            label ← INVALID
            disposition ← exclude_or_correct_explicitly
        ELSE IF ambiguous oracle OR partial coverage:
            label ← INCOMPLETE
            disposition ← constrain_to_safe_observation
        ELSE:
            label ← VALID
        append(audited, case + trace + label + reason + disposition)

    missedRisks ← human_review(audited, focus = security + state + protocol + leakage)
    extensions ← student_add_at_least_five(missedRisks)
    canonicalLedger ← audited + extensions

    validate_schema_counts_ids_and_reasons(canonicalLedger)
    emit(canonicalLedger, JSON, PostmanData, Excel, AuditMarkdown)

    results ← run_isolated_Newman(canonicalLedger,
                                  header = X-Student-Id,
                                  verify_before_after_state = true)
    defects ← triage_only_repeatable_normative_failures(results)
    return canonicalLedger, results, defects, humanReviewItems
```
