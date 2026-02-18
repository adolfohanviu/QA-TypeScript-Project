# Playwright TypeScript Automated Testing Suite

A **production-grade**, **enterprise-level** test automation framework built with **Playwright**, **TypeScript**, and **Jest**. Includes comprehensive UI testing, API testing, and integration tests with modern tooling for CI/CD pipelines.

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
- 🧪 **100% Test Coverage** - Jest configuration with coverage reports
- 📊 **Code Metrics** - Complexity and maintainability reports

### DevOps & Deployment
- 🐳 **Docker** - Multi-stage builds with optimized images
- 🐙 **Kubernetes** - Production-ready K8s manifests
- 🚀 **CI/CD** - GitHub Actions workflows for automated testing
- 📈 **Scheduled Tests** - Nightly and weekly test runs
- 📊 **Test Reports** - HTML, JSON, and JUnit formats

### Enterprise Features
- 🔐 **Secrets Management** - Secured credential handling
- 🔄 **Retry Logic** - Intelligent test retries with backoff
- 📝 **Structured Logging** - Winston-based logging system
- 🎯 **Test Tagging** - @smoke, @regression, @api tags for filtering
- 📊 **Metrics & Analytics** - Performance tracking and reporting

## 📦 Project Structure

```
├── tests/
│   ├── api/                    # API test suites
│   │   ├── users.spec.ts       # User API tests
│   │   ├── products.spec.ts    # Product API tests
│   │   ├── orders.spec.ts      # Order API tests
│   │   └── workflows.spec.ts   # E2E API workflows
│   ├── ui/
│   │   ├── auth.spec.ts        # Authentication tests
│   │   ├── shopping-cart.spec.ts # Shopping & cart tests
│   │   └── checkout.spec.ts    # Checkout flow tests
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
│   │   ├── api-test-helpers.ts # API testing utilities
│   │   └── fixtures.ts         # Test fixtures
│   └── setup.ts                # Jest setup file
├── src/
│   ├── utils/
│   │   ├── config.ts           # Type-safe config with Zod
│   │   ├── logger.ts           # Winston logging setup
│   │   ├── api-client.ts       # Axios HTTP client
│   │   └── error-handler.ts    # Error handling utilities
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
- **Node.js** 18+ and npm
- **Docker** (optional, for containerized testing)
- **Kubernetes** cluster (optional, for K8s deployment)

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/playwright-tests.git
cd playwright-tests

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
# Run all tests
npm test

# Run specific test suites
npm run test:ui          # UI tests only
npm run test:api         # API tests only
npm run test:unit        # Unit tests only

# Run with specific tags
npm run test -- --grep "@smoke"           # Smoke tests
npm run test -- --grep "@regression"      # Regression tests

# Run in debug mode
npm run test:debug

# Run with UI mode
npm run test:ui:mode

# Generate coverage report
npm run coverage
```

### Configuration

Create `.env` file in root directory:

```env
# Application
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

## 🐳 Docker Usage

### Build Image
```bash
docker build -t playwright-tests:latest .
```

### Run with Docker Compose
```bash
# Start all services (app, api, tests)
docker-compose up --build

# Run specific service
docker-compose up tests-ui
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
- Runs: Unit, API, and UI tests
- Matrix: Node 18.x & 20.x
- Reports: Test results & Playwright reports

#### 2. **Pull Request Workflow** (test-pr.yml)
- Runs on PR creation/update
- Includes: Test suite, code coverage, visual regression, accessibility
- Comments results on PR

#### 3. **Scheduled Workflows** (test-scheduled.yml)
- **Nightly**: Full test suite (2 AM UTC)
- **Weekly**: Regression suite (Sunday 6 AM UTC)
- **On-demand**: Manual trigger via workflow_dispatch
- Includes: Performance tests, database tests, Slack notifications

### Viewing Results
```bash
# GitHub Actions
https://github.com/your-org/playwright-tests/actions

# Artifact downloads
- Test results (HTML, JSON, JUnit)
- Coverage reports
- Playwright reports
```

## 📊 Test Reports

### Generate Reports
```bash
# Auto-generated during test runs
npm run test

# Generate from results
npm run test:report:merge
npm run test:report:html
npm run test:report:json
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

## 🤝 Contributing

### Adding New Tests

1. **Create page object** (if UI test):
   ```typescript
   export class NewPage extends BasePage {
     async navigate(): Promise<void> {
       await this.page.goto('/new-page');
     }
   }
   ```

2. **Write test file**:
   ```typescript
   test.describe('@feature New Feature Tests', () => {
     test('@smoke should verify feature', async () => {
       // Arrange, Act, Assert
     });
   });
   ```

3. **Run tests**:
   ```bash
   npm run test tests/ui/new-feature.spec.ts
   ```

### Test Standards
- Use **AAA pattern**: Arrange, Act, Assert
- Add **descriptive comments**: @feature, @smoke, @regression tags
- Include **error messages**: Clear assertion messages
- Follow **naming convention**: `should_do_something_when_condition`

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

## 📞 Support

- **Issues**: GitHub Issues page
- **Discussions**: GitHub Discussions
- **Email**: qa-team@company.com

## 📄 License

MIT License - See LICENSE file for details

## 🎖️ Enterprise Features Checklist

- ✅ TypeScript with strict type checking
- ✅ Page Object Model architecture
- ✅ API testing with contract validation
- ✅ Mock Service Worker for API mocking
- ✅ Comprehensive error handling
- ✅ Structured logging system
- ✅ Docker containerization
- ✅ Kubernetes deployment ready
- ✅ GitHub Actions CI/CD pipelines
- ✅ Test reporting (HTML, JSON, JUnit)
- ✅ Code coverage analysis
- ✅ Performance testing framework
- ✅ Security scanning in pipelines
- ✅ Scheduled test runs
- ✅ Production-grade documentation

---

**Built with ❤️ for enterprise test automation**
