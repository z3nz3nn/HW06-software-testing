# POST /api/reset-password — Student Extensions

| Case | Title | Technique | Requirement | Why added |
| --- | --- | --- | --- | --- |
| R-H-01 | JSON sent with text/plain Content-Type | Protocol robustness | Schema | Added during human review because the AI candidate pool missed this risk. |
| R-H-02 | OTP brute-force and rate-limit exploration | Abuse case | SEC-07 | Added during human review because the AI candidate pool missed this risk. |
| R-H-03 | Wrong HTTP method does not reset password | Protocol negative | API specification | Added during human review because the AI candidate pool missed this risk. |
| R-H-04 | Password contains a NUL character | Robustness | FR-01 | Added during human review because the AI candidate pool missed this risk. |
| R-H-05 | Successful reset/login responses do not leak password or reset token | Information disclosure | SEC-01,SEC-07 | Added during human review because the AI candidate pool missed this risk. |
| R-H-06 | Password storage is not plaintext | White-box security | SEC-01 | Added during human review because the AI candidate pool missed this risk. |

Gemini underweighted protocol edge cases, information leakage, identity trust, atomic rollback, and metamorphic boundaries because its generation objective favored broad input enumeration. These rows require personal student review before being represented as student work.
