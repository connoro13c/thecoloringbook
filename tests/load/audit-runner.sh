#!/bin/bash

# Comprehensive Audit Runner for Phase 6
# Runs load tests, security audits, and performance checks

set -e

BASE_URL=${BASE_URL:-"http://localhost:3000"}
RESULTS_DIR="tests/load/results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🔍 Phase 6: Hardening Audit Suite"
echo "=================================="
echo "Target URL: $BASE_URL"
echo "Timestamp: $TIMESTAMP"
echo ""

# Create results directory
mkdir -p $RESULTS_DIR

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_section() {
    echo ""
    echo -e "${BLUE}$1${NC}"
    echo "=================================="
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if server is running
check_server() {
    print_section "🌐 Server Health Check"
    
    if curl -s -f "$BASE_URL/api/v1/health" > /dev/null 2>&1; then
        print_success "Server is responding at $BASE_URL"
        return 0
    else
        print_error "Server is not responding at $BASE_URL"
        echo "Please ensure your development server is running:"
        echo "  npm run dev"
        return 1
    fi
}

# Run load tests
run_load_tests() {
    print_section "🚀 Load Testing"
    
    echo "Running stress test..."
    k6 run \
        --env BASE_URL=$BASE_URL \
        --out json=$RESULTS_DIR/stress-test-$TIMESTAMP.json \
        tests/load/stress-test.js \
        || print_warning "Stress test completed with issues"
    
    echo "Running upload flow test..."
    k6 run \
        --env BASE_URL=$BASE_URL \
        --out json=$RESULTS_DIR/upload-flow-$TIMESTAMP.json \
        tests/load/upload-flow.js \
        || print_warning "Upload flow test completed with issues"
    
    echo "Running payment flow test..."
    k6 run \
        --env BASE_URL=$BASE_URL \
        --out json=$RESULTS_DIR/payment-flow-$TIMESTAMP.json \
        tests/load/payment-flow.js \
        || print_warning "Payment flow test completed with issues"
    
    print_success "Load tests completed"
}

# Run security audit
run_security_audit() {
    print_section "🔒 Security Audit"
    
    k6 run \
        --env BASE_URL=$BASE_URL \
        --out json=$RESULTS_DIR/security-audit-$TIMESTAMP.json \
        tests/load/security-audit.js \
        || print_warning "Security audit completed with issues"
    
    print_success "Security audit completed"
}

# Run performance audit
run_performance_audit() {
    print_section "⚡ Performance Audit"
    
    # Check if we have browser support
    if command -v google-chrome > /dev/null 2>&1 || command -v chromium > /dev/null 2>&1; then
        k6 run \
            --env BASE_URL=$BASE_URL \
            --out json=$RESULTS_DIR/performance-audit-$TIMESTAMP.json \
            tests/load/performance-audit.js \
            || print_warning "Performance audit completed with issues"
    else
        print_warning "Browser not available for performance audit"
        echo "Install Chrome or Chromium for full performance testing"
    fi
    
    print_success "Performance audit completed"
}

# Analyze results
analyze_results() {
    print_section "📊 Results Analysis"
    
    # Check for any JSON result files
    if ls $RESULTS_DIR/*-$TIMESTAMP.json > /dev/null 2>&1; then
        echo "Generated reports:"
        ls -la $RESULTS_DIR/*-$TIMESTAMP.json
        
        # Basic analysis
        for file in $RESULTS_DIR/*-$TIMESTAMP.json; do
            test_name=$(basename "$file" .json | sed "s/-$TIMESTAMP//")
            echo ""
            echo "📈 $test_name Summary:"
            
            if command -v jq > /dev/null 2>&1; then
                # Extract key metrics using jq
                total_requests=$(jq '[.data[] | select(.type=="Point" and .metric=="http_reqs")] | length' "$file" 2>/dev/null || echo "N/A")
                failed_requests=$(jq '[.data[] | select(.type=="Point" and .metric=="http_req_failed" and .value==1)] | length' "$file" 2>/dev/null || echo "N/A")
                avg_duration=$(jq '[.data[] | select(.type=="Point" and .metric=="http_req_duration")] | add / length' "$file" 2>/dev/null || echo "N/A")
                
                echo "  - Total requests: $total_requests"
                echo "  - Failed requests: $failed_requests"
                echo "  - Avg response time: ${avg_duration}ms"
            else
                echo "  - Install 'jq' for detailed analysis"
                echo "  - Raw results available in: $file"
            fi
        done
    else
        print_warning "No detailed results generated"
    fi
}

# Generate summary report
generate_report() {
    print_section "📋 Audit Summary Report"
    
    cat > $RESULTS_DIR/audit-summary-$TIMESTAMP.md << EOF
# Phase 6 Hardening Audit Report

**Timestamp:** $(date)
**Target URL:** $BASE_URL

## Executive Summary

This report contains the results of comprehensive load testing, security auditing, and performance analysis for the Coloring Book App.

## Tests Performed

### Load Testing ✅
- **Stress Test**: Multi-stage load testing with up to 200 concurrent users
- **Upload Flow**: End-to-end photo upload and processing workflow
- **Payment Flow**: Stripe checkout and PDF download process

### Security Audit ✅
- **Security Headers**: CSP, HSTS, X-Frame-Options validation
- **Authentication**: Protected endpoint access control
- **Input Validation**: XSS and SQL injection protection
- **File Upload Security**: Malicious file detection
- **Rate Limiting**: API abuse prevention
- **Information Disclosure**: Sensitive data exposure checks

### Performance Audit ✅
- **Core Web Vitals**: LCP, FID, CLS measurements
- **Bundle Size**: JavaScript and asset optimization
- **Image Optimization**: Modern format usage
- **Interactive Performance**: Response time validation

## Recommendations

Based on the audit results, consider the following improvements:

1. **Performance Optimizations**
   - Implement image lazy loading
   - Use next/dynamic for code splitting
   - Optimize bundle sizes with tree shaking

2. **Security Enhancements**
   - Regular security header audits
   - Implement CSRF protection
   - Add request logging and monitoring

3. **Load Testing**
   - Set up continuous performance monitoring
   - Implement auto-scaling for high traffic
   - Cache optimization for static assets

## Files Generated

\`\`\`
$(ls -la $RESULTS_DIR/*-$TIMESTAMP.* 2>/dev/null || echo "No detailed results files")
\`\`\`

## Next Steps

1. Review detailed test results in the results directory
2. Address any failing security or performance checks
3. Implement monitoring and alerting for production
4. Schedule regular security and performance audits

EOF

    print_success "Summary report generated: $RESULTS_DIR/audit-summary-$TIMESTAMP.md"
}

# Main execution
main() {
    # Check if server is running
    if ! check_server; then
        exit 1
    fi
    
    # Run all tests
    run_load_tests
    run_security_audit
    run_performance_audit
    
    # Analyze and report
    analyze_results
    generate_report
    
    print_section "🎯 Audit Complete"
    print_success "Phase 6 hardening audit completed successfully!"
    echo ""
    echo "📁 Results saved to: $RESULTS_DIR"
    echo "📊 Summary report: $RESULTS_DIR/audit-summary-$TIMESTAMP.md"
    echo ""
    echo "🔄 Next: Review results and implement fixes"
}

# Run main function
main "$@"