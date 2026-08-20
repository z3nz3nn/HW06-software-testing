# POST /api/apply-coupon — Student Extensions

| Case | Title | Technique | Requirement | Why added |
| --- | --- | --- | --- | --- |
| C-H-01 | Coupon code with surrounding whitespace | Input normalization | C1 | Added during human review because the AI candidate pool missed this risk. |
| C-H-02 | Unicode-confusable coupon code | Abuse case | C1 | Added during human review because the AI candidate pool missed this risk. |
| C-H-03 | Seeded percentage coupon over 100 percent | Cross-feature robustness | Formula,FR-17 | Added during human review because the AI candidate pool missed this risk. |
| C-H-04 | Very large numeric exponent | Numeric robustness | Formula,Schema | Added during human review because the AI candidate pool missed this risk. |
| C-H-05 | Fixed discount larger than order | Business invariant | Formula | Added during human review because the AI candidate pool missed this risk. |

Gemini underweighted protocol edge cases, information leakage, identity trust, atomic rollback, and metamorphic boundaries because its generation objective favored broad input enumeration. These rows require personal student review before being represented as student work.
