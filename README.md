# Playwright TypeScript Automated Testing Suite

[![Test Suite - Push](https://github.com/adolfohanviu/qa-typescript-framework/actions/workflows/test-push.yml/badge.svg)](https://github.com/adolfohanviu/qa-typescript-framework/actions/workflows/test-push.yml)

A test automation framework built with **Playwright**, **TypeScript**, and **Jest**: real end-to-end tests against a live app (saucedemo.com), mocked API tests, and an AI-assisted development workflow documented in [`AGENTS.md`](./AGENTS.md) from an actual audit-and-repair pass on this exact codebase.

## 🎯 Features

### Core Testing
- ✅ **UI Testing** - Comprehensive end-to-end tests with Playwright
- ✅ **API Testing** - Contract testing, integration, and workflow tests
- ✅ **API Mocking** - Mock Service Worker for isolated testing
- ✅ **Type Safety** - Full TypeScript support with strict mode
- ✅ **Page Object Model** - Clean, maintainable test architecture

### Code Quality
- 🔍 **TypeScript** - Strict type checking and inference
- 📝 **ESLint** - Code linting with modern rules
- 🧪 **Coverage Threshold** - Jest enforces a 70% branches/functions/lines/statements minimum on the API suite

### DevOps & Deployment
- 🐳 **Docker** - Multi-stage builds with optimized images
- 🐙 **Kubernetes** - Production-ready K8s manifests
- 🚀 **CI/CD** - GitHub Actions workflows for automated testing
- 📈 **Scheduled Tests** - Nightly and weekly test runs
- 📊 **Test Reports** - HTML and JSON formats (Playwright), default console reporter (Jest)

### Reliability & Ops
- 🔐 **Secrets Management** - Secured credential handling
- 🔄 **Retry Logic** - Intelligent test retries with backoff
- 📝 **Structured Logging** - Winston-based logging system
- 🎯 **Test Tagging** - @smoke, @regression, @contract tags for filtering (two different mechanisms — see `AGENTS.md`)

## 📦 Project Structure

```
├── tests/
│   ├── api/                    # API test suites
│   │   ├── users.spec.ts       # User API tests
│   │   ├── products.spec.ts    # Product API tests
│   │   ├── orders.spec.ts      # Order API tests
│   │   └── workflows.spec.ts   # E2E API workflows
│   ├── e2e/                    # Playwright end-to-end suites
│   │   ├── auth.spec.ts        # Authentication tests
│   │   ├── shopping-cart.spec.ts # Shopping & cart tests
│   │   └── checkout.spec.ts    # Checkout flow tests
│   ├── utils/
│   │   └── api-test-helpers.ts # API testing utilities
│   └── setup.ts                # Jest setup file
├── src/
│   ├── pages/                  # Page Object Models
│   │   ├── BasePage.ts         # Base class for all pages
│   │   ├── LoginPage.ts        # Login page object
│   │   ├── ProductsPage.ts     # Products page object
│   │   ├── ShoppingPage.ts     # Shopping page object
│   │   ├── CartPage.ts         # Cart page object
│   │   └── CheckoutPage.ts     # Checkout page object
│   ├── mocks/                  # Mock Service Worker setup
│   │   ├── handlers.ts         # MSW request handlers
│   │   └── server.ts           # MSW server setup
│   ├── utils/
│   │   ├── config.ts           # Type-safe config with Zod
│   │   ├── logger.ts           # Winston logging setup
│   │   └── api-client.ts       # Axios HTTP client (ApiError + error handling inline)
│   └── types/
│       └── index.ts            # TypeScript type definitions
├── k8s/                        # Kubernetes manifests
│   ├── namespace.yaml          # K8s namespace
│   ├── deployment.yaml         # K8s deployments & cronjobs
│   ├── service.yaml            # K8s services
│   ├── configmap.yaml          # K8s configurations
│   └── rbac.yaml               # K8s RBAC configuration
├── .github/workflows/          # CI/CD pipelines
│   ├── test-push.yml           # Tests on push
│   ├── test-pr.yml             # Tests on pull request
│   └── test-scheduled.yml      # Scheduled test runs
├── docker-compose.yml          # Docker Compose setup
├── Dockerfile                  # Docker image definition
├── playwright.config.ts        # Playwright configuration
├── jest.config.ts              # Jest configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies & scripts
└── README.md                   # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 20+ and npm 10+
- **Docker** (optional, for containerized testing)
- **Kubernetes** cluster (optional, for K8s deployment)

### Installation

```bash
# Clone repository
git clone https://github.com/adolfohanviu/qa-typescript-framework.git
cd qa-typescript-framework

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Setup environment
cp .env.example .env
# Edit .env with your configuration
```

### Run Tests

```bash
# Run all tests (API via Jest + E2E via Playwright)
npm test

# Run specific test suites
npm run test:api         # API tests only (Jest)
npm run test:e2e         # E2E tests only (Playwright)

# Run with specific tags
npm run test:smoke        # @smoke across both Jest and Playwright
npm run test:regression   # @regression across both Jest and Playwright

# Run in debug mode (API/Jest suite)
npm run test:debug

# Run E2E in headed mode
npm run test:e2e:headed

# Generate coverage report
npm run coverage
```

### Configuration

Create `.env` from `.env.example` in the root directory - these are the actual keys `src/utils/config.ts` reads:

```env
# Test Configuration
BASE_URL=https://www.saucedemo.com
API_BASE_URL=https://jsonplaceholder.typicode.com

# Browser Configuration
HEADLESS=true
BROWSER_TYPE=chromium
TIMEOUT=30000
RETRIES=0

# Logging
LOG_LEVEL=info

# API Mocking
MOCK_API=false

# CI/CD
CI=false
```

## 🏗️ Architecture

### Page Object Model (POM)
Each page has a dedicated POM class extending `BasePage`:

```typescript
class LoginPage extends BasePage {
  private readonly emailInput = this.page.locator('[data-testid="email"]');
  
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    // ...
  }
}
```

### API Testing
Centralized API client with error handling:

```typescript
const client = createApiClient(baseUrl);
const users = await client.get<User[]>('/users');
const created = await client.post<User>('/users', userData);
```

### MSW Mocking
Mock API responses for isolated testing:

```typescript
export const handlers = [
  http.get('/api/users', async () =>
    HttpResponse.json(mockUsers)
  ),
];
```

## 🤖 AI-Assisted Development

This repo carries an `AGENTS.md` (canonical, tool-agnostic) plus a thin `CLAUDE.md` pointer, three
project skills under `.claude/skills/`, and reusable prompt templates under `prompts/`. Any AI
agent working here — Claude Code included — is expected to read `AGENTS.md` first and use the
skills/prompts rather than re-deriving repo conventions from scratch each time.

## 🐳 Docker Usage

### Build Image
```bash
docker build -t qa-typescript-tests:latest .
```

### Run with Docker Compose
```bash
# Start all services (app, api, tests)
docker-compose up --build

# Run specific service
docker-compose up tests-e2e
docker-compose up tests-api
```

### View Reports
```bash
docker-compose up report-server
# Access at http://localhost:3333
```

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (1.24+)
- kubectl configured

### Deploy

```bash
# Create namespace and deploy
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/rbac.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Check deployment status
kubectl get pods -n qa-automation
kubectl logs -n qa-automation -l app=playwright-tests -f

# View test results
kubectl port-forward -n qa-automation svc/report-server 3333:80
```

### Scheduled Tests
Tests run automatically via CronJob:
- **Daily** at 2 AM UTC
- **Weekly regression** tests on Sunday at 6 AM UTC

View scheduled jobs:
```bash
kubectl get cronjobs -n qa-automation
kubectl describe cronjob playwright-tests-scheduled -n qa-automation
```

## 🔄 CI/CD Pipelines

### GitHub Actions Workflows

#### 1. **Push Workflow** (test-push.yml)
- Triggers on push to main/develop/feature branches
- Runs: API (Jest) and E2E (Playwright) tests
- Matrix: Node 20.x
- Reports: Test results & Playwright reports

#### 2. **Pull Request Workflow** (test-pr.yml)
- Runs on PR creation/update
- Includes: Full test suite (API + E2E), code coverage
- Comments results on PR

#### 3. **Scheduled Workflows** (test-scheduled.yml)
- **Nightly**: Full test suite (2 AM UTC)
- **Weekly**: Regression suite (Sunday 6 AM UTC)
- **On-demand**: Manual trigger via workflow_dispatch (all/api/e2e/regression/smoke)
- Includes: Slack notifications

### Viewing Results
```bash
# GitHub Actions
https://github.com/adolfohanviu/qa-typescript-framework/actions

# Artifact downloads
- Test results (HTML, JSON, JUnit)
- Coverage reports
- Playwright reports
```

## 📊 Test Reports

### Generate Reports
```bash
# Auto-generated during test runs
npm test
```

### Access Reports
```bash
# Playwright HTML Report
npx playwright show-report

# Coverage Report
open coverage/index.html
```

## 🔐 Security & Best Practices

### Secrets Management
Store sensitive data in GitHub Secrets or K8s Secrets:

```yaml
# .env (local - NEVER commit)
API_KEY=secret_value
DB_PASSWORD=secret_password

# GitHub Secrets UI
Settings → Secrets and variables → Actions
```

### Test Data Management
```typescript
// ✅ Use test fixtures
const testUser = await createTestUser();

// ✅ Cleanup after tests
afterEach(async () => {
  await testUser.delete();
});

// ❌ Don't hardcode credentials
// ❌ Don't use production data
```

### Performance Optimization
- Parallel test execution: configured in `playwright.config.ts`
- Smart retries: only for flaky tests
- Timeouts: appropriate for your application

## 📈 Metrics & Monitoring

### Test Metrics
Track in `test-results/metrics.json`:
- Total tests run
- Pass/fail counts
- Duration
- Flakiness score

### Performance Metrics
Performance tests measure:
- API response times
- Page load times
- Memory usage

### Dashboards
- GitHub Actions: Built-in workflow metrics
- Kubernetes: Prometheus metrics
- Custom: Parse `metrics.json` for visualization

## 📚 Documentation

- **Playwright Docs**: https://playwright.dev
- **Jest Docs**: https://jestjs.io
- **TypeScript Docs**: https://www.typescriptlang.org
- **Docker Docs**: https://docs.docker.com
- **Kubernetes Docs**: https://kubernetes.io/docs

## 🐛 Troubleshooting

### Tests timeout
```typescript
// Increase timeout in playwright.config.ts
use: {
  navigationTimeout: 60000,
  actionTimeout: 30000,
}
```

### Flaky tests
```typescript
// Use retry configuration
test('flaky test', async () => {
  // ...
}, { retries: 2 });
```

### Docker build fails
```bash
# Clean build
docker-compose build --no-cache

# Check logs
docker-compose logs playwright
```

### Kubernetes pod errors
```bash
# Check pod logs
kubectl logs -n qa-automation pod-name

# Describe pod for events
kubectl describe pod pod-name -n qa-automation
```

## ✅ What's Actually Implemented

- ✅ TypeScript with strict type checking
- ✅ Page Object Model architecture (Locator-based, verified against the live app)
- ⚠️ API contract checks - currently shallow (`toHaveProperty`/`typeof`); real schema-validated contract tests are scaffolded via the `generate-contract-test` skill, not yet applied repo-wide
- ✅ Mock Service Worker v2 for API mocking
- ✅ Comprehensive error handling
- ✅ Structured logging system
- ✅ Docker containerization
- ✅ Kubernetes deployment ready
- ✅ GitHub Actions CI/CD pipelines (no `continue-on-error` masking on real test steps)
- ✅ Test reporting (HTML, JSON)
- ✅ Code coverage analysis (70% threshold enforced on the API suite)
- ✅ Security scanning in pipelines (`npm audit --audit-level=moderate`)
- ✅ Scheduled test runs
- ✅ AI-assisted development workflow (`AGENTS.md`, project skills, documented prompts)
