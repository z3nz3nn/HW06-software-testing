# CI/CD Report

## Pipeline design

GitHub Actions uses Windows/Ubuntu-compatible Node commands to install the root runner and SUT dependencies, regenerate the collection/data, execute Newman against `127.0.0.1`, and upload HTML/JUnit/summary artifacts. The workflow file is `.github/workflows/api-tests.yml`.

The **diagnostic** lane preserves genuine SUT assertion failures and always uploads evidence. The **mutation demonstration** lane exists solely to satisfy the assignment's two-commit learning demonstration without mislabeling a defective SUT as compliant: the baseline commit expects its deliberate sentinel assertion to pass; the mutation commit changes exactly one sentinel expectation so exactly one test fails.

## Required run pair

| Run | Commit/link | Expected result | Screenshot |
| --- | --- | --- | --- |
| All-pass demonstration | HUMAN_REVIEW_REQUIRED_AFTER_PUSH | All mutation-demo cases pass | HUMAN_REVIEW_REQUIRED_AFTER_ACTIONS_RUN |
| One-fail mutation | HUMAN_REVIEW_REQUIRED_AFTER_PUSH | Exactly one deliberate sentinel failure | HUMAN_REVIEW_REQUIRED_AFTER_ACTIONS_RUN |

## Human review

The repository is currently private and empty on GitHub. Changing visibility, pushing, and creating representational evidence must be approved/performed before links can be finalized. Do not claim the mutation lane proves the unmodified SUT passes; the diagnostic Newman reports are the authoritative product-quality result.
