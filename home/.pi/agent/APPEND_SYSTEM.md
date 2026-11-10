## Commit messages

Always use Conventional Commits:

    <type>(<scope>): <summary>

    <body: what changed and why, wrapped at 72 chars>

    Refs: <ticket-id>

- type: feat | fix | chore | docs | refactor | test | ci | build | perf
- summary: imperative mood, lowercase, no trailing period, max 50 chars
- scope: the component or directory touched (e.g. `terraform`, `helm`, `catalog`)
- Body is required for non-trivial changes; explain *why*, not just *what*
- One logical change per commit; split unrelated changes
- Never add "Co-authored-by" or AI attribution lines

Example:

    fix(helm): pin dynatrace-operator chart to 1.4.x

    Unpinned chart pulled a breaking CRD change into staging.

    Refs: PLAT-1234
