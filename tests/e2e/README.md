# E2E Tests

This directory contains Playwright-based end-to-end tests for the Beauty Masters application.

## Test Coverage

### Masters Directory Page (`masters.spec.ts`)

Tests the `/masters` page functionality including:

- **Page Loading**: Verifies the page loads without console errors
- **Loading States**: Validates loading → results/empty state transitions
- **Filter Interactions**: Tests city, service, and language filter changes
- **Error Handling**: Ensures no Firestore-related errors occur
- **UI States**: Validates mutually exclusive loading/results/empty states

## Running Tests

### CI/Headless Mode
```bash
npm run e2e
```

### Local Development (Headed Mode)
```bash
npm run e2e:headed
```

### Update Snapshots (if needed)
```bash
npm run e2e:update
```

## Test Structure

Each test includes:
- Console error monitoring (fails on any error)
- Resilient selectors using `data-testid` attributes
- Network idle waiting for stability
- Soft assertions to avoid flakiness

## Environment Variables

- `E2E_BASE_URL`: Base URL for tests (defaults to `http://localhost:3000`)
- `CI`: Set to `true` in CI environments for appropriate retry logic

## Browser Support

Tests run against:
- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)

## Debugging

For debugging failed tests:
1. Run with `--headed` flag to see browser
2. Use `--debug` flag for step-by-step debugging
3. Check console output for error details
4. Review test traces in `test-results/` directory
