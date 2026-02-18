# Quick Reference Guide

## 🏃 Getting Started in 5 Minutes

### 1. Setup
```bash
npm install
npx playwright install
cp .env.example .env
```

### 2. Run Tests
```bash
npm test                    # All tests
npm run test:ui             # UI only
npm run test:api            # API only
npm run test:smoke          # Smoke tests (@smoke tag)
npm run test:regression     # Regression tests (@regression tag)
```

### 3. View Reports
```bash
npx playwright show-report
```

---

## 📁 Key File Locations

| Purpose | File |
|---------|------|
| Run all tests | `package.json` - `npm test` |
| Configure tests | `playwright.config.ts` |
| Jest setup | `jest.config.ts` |
| Add new UI test | `tests/ui/*.spec.ts` |
| Add new API test | `tests/api/*.spec.ts` |
| Create page object | `tests/pages/*.ts` |
| Mock API | `tests/mocks/handlers.ts` |
| Configuration | `src/utils/config.ts` |
| Logging | `src/utils/logger.ts` |

---

## 🧪 Writing Tests

### UI Test Template
```typescript
test('@smoke should do something', async ({ page }) => {
  // Arrange
  const loginPage = new LoginPage(page);
  
  // Act
  await loginPage.navigate();
  await loginPage.login('user@test.com', 'password');
  
  // Assert
  expect(await loginPage.isLoggedIn()).toBe(true);
});
```

### API Test Template
```typescript
test('@api should fetch users', async () => {
  // Arrange
  const client = createApiClient();
  
  // Act
  const users = await client.get<User[]>('/users');
  
  // Assert
  expect(users.length).toBeGreaterThan(0);
});
```

---

## 🐛 Debugging

### Run Single Test
```bash
npm test -- --grep "test name"
npm test tests/ui/auth.spec.ts
```

### Debug Mode
```bash
npm run test:debug
```

### UI Debug Mode
```bash
npm run test:ui:mode
```

### View Logs
```bash
# During test
test('@smoke test', async () => {
  const logger = createLogger('TestName');
  logger.info('Message here');
});

# Check console output
```

---

## 🐳 Docker Commands

### Build & Run
```bash
docker-compose up --build

# Run specific service
docker-compose up tests-ui
docker-compose up tests-api

# View logs
docker-compose logs -f tests-ui

# Stop all
docker-compose down
```

### View Results
```bash
docker-compose up report-server
# http://localhost:3333
```

---

## ☸️ Kubernetes Commands

### Deploy
```bash
kubectl apply -f k8s/
```

### Monitor
```bash
# Check pods
kubectl get pods -n qa-automation

# View logs
kubectl logs -n qa-automation -l app=playwright-tests -f

# Describe pod
kubectl describe pod <pod-name> -n qa-automation
```

### View Results
```bash
# Forward port
kubectl port-forward -n qa-automation svc/report-server 3333:80
# http://localhost:3333
```

### Delete
```bash
kubectl delete namespace qa-automation
```

---

## 📊 Common Test Patterns

### Add Product to Cart
```typescript
const shopping = new ShoppingPage(page);
await shopping.navigate();
await shopping.addProductToCart('Laptop Pro', 2);
const count = await shopping.getCartCount();
expect(count).toBe(2);
```

### Complete Checkout
```typescript
const checkout = new CheckoutPage(page);
await checkout.navigate();
await checkout.fillCheckoutForm({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@test.com',
  // ... other fields
});
await checkout.placeOrder();
const orderNumber = await checkout.getOrderNumber();
```

### API Request with Error Handling
```typescript
const client = createApiClient();
try {
  const user = await client.get<User>('/users/999');
} catch (error) {
  expect(error).toBeInstanceOf(ApiError);
  const apiError = error as ApiError;
  expect(apiError.statusCode).toBe(404);
}
```

---

## 🔍 Test Tags

Use tags to filter tests:

```bash
# Run only smoke tests
npm test -- --grep "@smoke"

# Run only regression tests
npm test -- --grep "@regression"

# Run API tests
npm test -- --grep "@api"

# Run UI tests
npm test -- --grep "@ui"
```

### Tag Definitions
- `@smoke` - Quick, critical path tests
- `@regression` - Comprehensive coverage
- `@api` - API endpoint tests
- `@ui` - UI/E2E tests
- `@contract` - API contract tests
- `@workflow` - Multi-step workflows
- `@performance` - Performance tests

---

## 📋 Environment Variables

```env
# App
NODE_ENV=development
BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:3001

# Playwright
HEADLESS=true
SLOW_MO=0
TIMEOUT=30000

# Logging
LOG_LEVEL=info

# Reporting
REPORT_DIR=./test-results
```

---

## 🚨 Troubleshooting Quick Fixes

### Tests timeout
```typescript
// In test file
test.setTimeout(60000); // 60 seconds

// Or in playwright.config.ts
use: {
  navigationTimeout: 60000,
  actionTimeout: 30000,
}
```

### Flaky tests
```typescript
// Single test retry
test('may be flaky', async () => {
  // ...
}, { retries: 2 });

// All tests retry in config
fullyParallel: false,
retries: 1,
```

### Element not found
```bash
# Use debug mode to inspect
npm run test:debug

# Check selector in browser console
document.querySelector('[data-testid="element"]')
```

### Docker permission error
```bash
# Linux/Mac
sudo docker-compose up

# Or without sudo
sudo usermod -aG docker $USER
```

---

## 📈 Performance Tips

### Run tests faster
```bash
# Parallel execution (default in playwright.config.ts)
# workers: 4

# Headless mode (faster)
HEADLESS=true npm test

# Specific test file only
npm test tests/ui/auth.spec.ts
```

### Reduce flakiness
- Increase timeout: `navigationTimeout: 60000`
- Use stable selectors: `[data-testid="..."]` ✅ not `.button.primary` ❌
- Wait for element: `await page.waitForSelector(...)`
- Avoid hard waits: use `waitForElement()` instead of `setTimeout()`

---

## 🔗 Useful Links

- [Playwright Docs](https://playwright.dev)
- [Jest Docs](https://jestjs.io)
- [TypeScript Docs](https://www.typescriptlang.org)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Docker Docs](https://docs.docker.com)
- [Kubernetes Docs](https://kubernetes.io)

---

## 📞 Getting Help

1. Check `README.md` for comprehensive docs
2. Review example tests in `tests/`
3. Check page objects in `tests/pages/`
4. Run tests in debug mode
5. View Playwright trace files

---

**Last Updated**: 2024  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
