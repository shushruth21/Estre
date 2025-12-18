# Testing Guide

## Overview
This project uses [Vitest](https://vitest.dev/) for unit and integration testing, and [React Testing Library](https://testing-library.com/) for component testing.

## Running Tests

### Run all tests
```bash
npm test
```

### Run with coverage
```bash
npm run test:coverage
```

### Watch mode
```bash
npm test -- --watch
```

## Structure
- Unit tests are co-located with source files (e.g., `src/lib/pricing-engine.test.ts`).
- Snapshot tests should be stored in `__snapshots__` directories (automatically managed by Vitest).
- Test setup is in `src/test/setup.ts`.

## Writing Tests
- Use `vi.mock` to mock external dependencies like Supabase.
- Use `toMatchSnapshot()` for PDF HTML generation tests.
- Ensure deterministic behavior (mock dates/randomness if necessary).

## CI Integration
Tests are configured to run in CI environments using the `npm test` command.
