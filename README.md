# deadenv

> Find unused, missing, and drifting environment variables before config debt turns into deployment bugs.

`deadenv` is a cross-stack CLI that scans your project and compares:
- variables defined in `.env*` files
- variables actually referenced in code

It helps answer questions like:
- Which env keys are no longer used?
- Which env keys are referenced in code but not defined?
- How complete is my current env coverage?
- What should my `.env.example` look like right now?

## Why

Most `.env` files rot quietly.

Old keys stay around for months, new keys appear in code without documentation, and eventually nobody trusts the config anymore.

`deadenv` gives you a fast signal before that drift becomes a broken deploy or a wasted debugging session.

## Supported patterns

### Node.js / TypeScript
- `process.env.MY_KEY`
- `process.env['MY_KEY']`

### Python
- `os.getenv('MY_KEY')`
- `os.environ['MY_KEY']`

### C# / .NET
- `Environment.GetEnvironmentVariable("MY_KEY")`

### Flutter / Dart
- `String.fromEnvironment('MY_KEY')`
- `Platform.environment['MY_KEY']`

## Install

```bash
npm install
```

## Usage

Scan a project:

```bash
node ./bin/deadenv.js scan .
```

JSON output:

```bash
node ./bin/deadenv.js scan . --json
```

Generate a starter example file from referenced keys:

```bash
node ./bin/deadenv.js example .
```

## Example output

```text
deadenv scan: /project
Detected env files: 1
Referenced env vars: 6
Unused env vars: 1
Missing env vars: 2
Coverage: 67%
```

Starter example output:

```text
OPENAI_API_KEY=
SENTRY_DSN=
DATABASE_URL=
```

## Use cases

- audit legacy projects before deployment
- clean up stale `.env` keys after refactors
- generate a better `.env.example` starting point
- catch missing config before CI or staging surprises you

## Roadmap

- ignore patterns
- CI-friendly exit codes
- framework-specific accessors
- GitHub Action wrapper improvements

## 한국어

**deadenv**는 코드에서 참조하는 환경변수와 `.env` 파일의 정의를 비교해서, 안 쓰는 키 / 빠진 키 / 현재 커버리지를 빠르게 보여주는 CLI입니다.

### 사용법

```bash
node ./bin/deadenv.js scan .
node ./bin/deadenv.js scan . --json
node ./bin/deadenv.js example .
```

## 中文

**deadenv** 是一个比较代码中的环境变量引用与 `.env` 文件定义的 CLI，可找出未使用、缺失的键，并给出当前覆盖率。

### 用法

```bash
node ./bin/deadenv.js scan .
node ./bin/deadenv.js scan . --json
node ./bin/deadenv.js example .
```
