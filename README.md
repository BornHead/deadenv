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

## Why

Most projects quietly accumulate config drift:
- dead `.env` keys no one uses anymore
- missing variables referenced in code but never documented
- `.env.example` files that no longer match reality

`deadenv` is built to surface those problems quickly.

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
Referenced env vars: 4
Unused env vars: 1
Missing env vars: 2
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

## 한국어

**deadenv**는 코드에서 실제로 참조하는 환경변수와 `.env` 파일에 정의된 값을 비교해 사용하지 않는 키와 빠진 키를 찾아주는 CLI입니다.

### 사용법

```bash
node ./bin/deadenv.js scan .
node ./bin/deadenv.js example .
```

## 中文

**deadenv** 是一个用来比较代码中的环境变量引用与 `.env` 文件定义的 CLI，可找出未使用和缺失的变量。

### 用法

```bash
node ./bin/deadenv.js scan .
node ./bin/deadenv.js example .
```
