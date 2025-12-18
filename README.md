# TSGO Readiness Bot

Run TypeScript native preview (tsgo) on pull requests and post diagnostics as a sticky PR comment and job summary.

- **No-install mode by default**: uses `npx --package=@typescript/native-preview tsgo ...`.
- **Drop-in typecheck**: supports both `--project` and `-b` (`--build`) modes.

## Usage

Add this workflow (or merge into an existing one):

```yaml
name: TSGO Readiness

on:
  pull_request:

permissions:
  contents: read
  issues: write

jobs:
  tsgo:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: TSGO Readiness
        uses: OWNER/tsgo-readiness-action@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          tsconfig: tsconfig.json
          mode: project # or "build" for tsgo -b
          noEmit: "true"
          extendedDiagnostics: "false"
          failOnError: "true"
          maxDiagnostics: "50"
          commentMode: sticky
          installMode: npx # default
```

## Inputs

- `tsconfig` (default: `tsconfig.json`)
- `mode`: `project` (tsgo `--project`) or `build` (tsgo `-b`)
- `noEmit` (default: `true`)
- `extendedDiagnostics` (default: `false`)
- `failOnError` (default: `true`)
- `maxDiagnostics` (default: `50`)
- `commentMode`: `sticky` or `off` (default: `sticky`)
- `github-token`: token used to create/update the sticky PR comment
- `installMode`: `npx` (default, no install) or `local` (runs `tsgo` from PATH)

## Notes

- This action posts a sticky PR comment identified by a hidden marker and also writes the same markdown to the job summary.
- If you set `commentMode: off`, the action will still write the job summary.
