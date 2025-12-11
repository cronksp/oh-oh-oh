# Testing

## Frameworks
- **Unit**: Vitest
- **E2E**: Playwright (optional setup)

## Running Tests
```bash
npm test
```

## Writing Tests
- Place unit tests alongside components/logic (e.g., `password.test.ts`).
- Mock DB calls for unit tests.
- Use integration tests for API routes with a test database.
