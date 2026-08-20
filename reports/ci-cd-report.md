# CI/CD Report

## Pipeline design

GitHub Actions uses Windows/Ubuntu-compatible Node commands to install the root runner and SUT dependencies, regenerate the collection/data, execute Newman against `127.0.0.1`, and upload HTML/JUnit/summary artifacts. The workflow file is `.github/workflows/api-tests.yml`.

The **diagnostic** lane preserves genuine SUT assertion failures and always uploads evidence. The **mutation demonstration** lane exists solely to satisfy the assignment's two-commit learning demonstration without mislabeling a defective SUT as compliant: the baseline commit expects its deliberate sentinel assertion to pass; the mutation commit changes exactly one sentinel expectation so exactly one test fails.

## Required run pair

| Run | Commit/link | Expected result | Screenshot |
| --- | --- | --- | --- |
| All-pass demonstration | [run 32405131238](https://github.com/z3nz3nn/HW06-software-testing/actions/runs/32405131238) / commit beecfaa | All mutation-demo cases pass | evidence/screenshots/04-ci-all-pass.jpg |
| One-fail mutation | [run 32405318145](https://github.com/z3nz3nn/HW06-software-testing/actions/runs/32405318145) / commit a40164b | Exactly one deliberate data case fails (two linked assertions) | evidence/screenshots/05-ci-one-fail.jpg and 06-ci-one-fail-log.jpg |

## Human review

Both runs were produced by GitHub Actions after separate pushes and include downloadable HTML/JUnit artifacts. The repository remains private pending explicit approval to change visibility. Do not claim the mutation lane proves the unmodified SUT passes; the diagnostic Newman reports are the authoritative product-quality result.
