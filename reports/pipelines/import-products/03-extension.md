# POST /api/admin/import-products — Student Extensions

| Case | Title | Technique | Requirement | Why added |
| --- | --- | --- | --- | --- |
| I-H-01 | Null row inside products array | Schema/state | FR-16 | Added during human review because the AI candidate pool missed this risk. |
| I-H-02 | Name boundary after surrounding whitespace | Metamorphic | FR-15 | Added during human review because the AI candidate pool missed this risk. |
| I-H-03 | Very small positive fractional price | BVA | FR-15 | Added during human review because the AI candidate pool missed this risk. |
| I-H-04 | Category ID zero | BVA | FR-15 | Added during human review because the AI candidate pool missed this risk. |
| I-H-05 | One row has multiple simultaneous validation failures | Error guessing | FR-15,FR-16 | Added during human review because the AI candidate pool missed this risk. |

Gemini underweighted protocol edge cases, information leakage, identity trust, atomic rollback, and metamorphic boundaries because its generation objective favored broad input enumeration. These rows require personal student review before being represented as student work.
