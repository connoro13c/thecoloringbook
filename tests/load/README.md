# Phase 6: Hardening Test Suite

This directory contains comprehensive testing tools for Phase 6 hardening of the Coloring Book App.

## Test Scripts

### Load Testing
- **`stress-test.js`** - Multi-stage load testing with up to 200 concurrent users
- **`upload-flow.js`** - End-to-end photo upload and processing workflow testing
- **`payment-flow.js`** - Stripe checkout and PDF download process testing

### Security Auditing
- **`security-audit.js`** - Comprehensive security vulnerability testing including:
  - Security headers validation
  - Authentication bypass attempts
  - XSS and SQL injection tests
  - File upload security
  - Rate limiting validation
  - Information disclosure checks

### Performance Auditing
- **`performance-audit.js`** - Core Web Vitals and performance testing:
  - Largest Contentful Paint (LCP)
  - First Input Delay (FID)
  - Cumulative Layout Shift (CLS)
  - Bundle size optimization
  - Image optimization validation

## Running Tests

### Quick Start
```bash
# Run all tests with default settings
./tests/load/audit-runner.sh

# Run individual test suites
./tests/load/run-tests.sh

# Run security audit only
k6 run tests/load/security-audit.js

# Run with custom target URL
BASE_URL=https://your-app.vercel.app ./tests/load/audit-runner.sh
```

### Prerequisites
1. **k6 installed**: `brew install k6` (macOS) or [download from k6.io](https://k6.io/docs/getting-started/installation/)
2. **jq installed** (optional, for detailed analysis): `brew install jq`
3. **Chrome/Chromium** (for performance auditing)
4. **Running application** at target URL

## Performance Thresholds

Based on AGENT.md requirements:

### Load Testing
- **Response Time**: 95% < 2-5 seconds
- **Error Rate**: < 5-20% depending on test
- **Throughput**: Support 50-200 concurrent users

### Security
- **Security Headers**: All required headers present
- **Authentication**: Protected endpoints require auth
- **Input Validation**: XSS/SQL injection prevented
- **Rate Limiting**: 100 requests/minute per IP

### Performance
- **Core Web Vitals**: LCP < 2.5s, CLS < 0.1, FID < 100ms
- **Bundle Size**: JavaScript < 200KB
- **Page Load**: < 3 seconds
- **Total Size**: < 1MB per page

## Results Analysis

Test results are saved in `tests/load/results/` with timestamps:
- **JSON files**: Detailed k6 metrics
- **CSV files**: Time-series data for graphing
- **Markdown reports**: Executive summaries

### Key Metrics to Monitor
1. **http_req_duration**: Response time distribution
2. **http_req_failed**: Error rate
3. **http_reqs**: Total request count
4. **browser_web_vitals_***: Core Web Vitals scores
5. **checks**: Security/validation pass rate

## Continuous Monitoring

The test suite is designed for:
- **CI/CD Integration**: Automated testing in GitHub Actions
- **Production Monitoring**: Regular health checks
- **Performance Budgets**: Fail builds if thresholds exceeded
- **Security Scanning**: Regular vulnerability assessment

## Troubleshooting

### Common Issues
1. **Server not responding**: Ensure `npm run dev` is running
2. **Rate limiting triggered**: Wait 60 seconds between test runs
3. **Browser tests failing**: Install Chrome/Chromium
4. **Memory issues**: Reduce concurrent users in test scripts

### Debug Mode
Add `-v` flag to k6 commands for verbose output:
```bash
k6 run -v tests/load/stress-test.js
```

## Implementation Notes

- **Rate limiting**: Uses in-memory store (use Redis in production)
- **Security headers**: Applied via Next.js middleware
- **Performance monitoring**: Client-side Web Vitals collection
- **Analytics**: Custom endpoints for metrics collection

This test suite ensures the Coloring Book App meets production-ready standards for performance, security, and scalability.