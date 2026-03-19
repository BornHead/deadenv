# deadenv

> Find unused and missing environment variables before your `.env` files turn into archaeology.

`deadenv` is a tiny cross-stack CLI that scans your project and compares:
- variables defined in `.env*` files
- variables actually referenced in code

It currently detects common patterns in:
- Node.js / TypeScript
- Python
- C# / .NET
- Flutter / Dart

## Why this might be useful

Most projects slowly accumulate:
- dead `.env` keys no one uses anymore
- missing variables referenced in code but not documented
- multiple `.env` files with unclear ownership

`deadenv` gives you a quick signal before config drift becomes a deployment bug.

## Install

```bash
npm install -g deadenv
```

Or run locally:

```bash
node ./bin/deadenv.js scan .
```

## Usage

```bash
deadenv scan .
deadenv scan . --json
```

## Example output

```text
deadenv scan: /Users/you/my-app
Detected env files: 1
Referenced env vars: 4
Unused env vars: 1
Missing env vars: 2

Env files
  - .env (3)

Unused env vars
  - LEGACY_TOKEN

Missing env vars
  - OPENAI_API_KEY
  - SENTRY_DSN
```

## Detected patterns

### Node.js / TS
- `process.env.MY_KEY`
- `process.env['MY_KEY']`

### Python
- `os.getenv('MY_KEY')`
- `os.environ['MY_KEY']`

### C#
- `Environment.GetEnvironmentVariable("MY_KEY")`

### Flutter / Dart
- `String.fromEnvironment('MY_KEY')`
- `Platform.environment['MY_KEY']`

## Roadmap

- support `.env.example` comparison mode
- support custom ignore patterns
- detect more framework-specific accessors
- CI-friendly exit codes
- GitHub Action wrapper

## Why this repo has star potential

This is the kind of tool developers understand in 10 seconds:
- small install surface
- immediately useful
- easy to demo in a GIF
- solves a real everyday annoyance

## License

MIT
