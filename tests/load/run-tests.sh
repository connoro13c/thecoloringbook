#!/bin/bash

# Load Testing Runner Script
# Runs k6 load tests and generates reports

set -e

BASE_URL=${BASE_URL:-"http://localhost:3000"}
RESULTS_DIR="tests/load/results"

echo "🚀 Starting load tests for Coloring Book App"
echo "Target URL: $BASE_URL"

# Create results directory
mkdir -p $RESULTS_DIR

# Function to run a test with output
run_test() {
    local test_name=$1
    local test_file=$2
    
    echo ""
    echo "📊 Running $test_name..."
    echo "=================================="
    
    k6 run \
        --env BASE_URL=$BASE_URL \
        --out json=$RESULTS_DIR/${test_name}-results.json \
        --out csv=$RESULTS_DIR/${test_name}-results.csv \
        $test_file
    
    echo "✅ $test_name completed"
}

# Run basic stress test first
run_test "stress-test" "tests/load/stress-test.js"

# Run upload flow test
run_test "upload-flow" "tests/load/upload-flow.js"

# Run payment flow test
run_test "payment-flow" "tests/load/payment-flow.js"

echo ""
echo "🎯 All load tests completed!"
echo "Results saved to: $RESULTS_DIR"
echo ""
echo "📈 Performance Summary:"
echo "======================"

# Basic analysis of results
for file in $RESULTS_DIR/*.json; do
    if [ -f "$file" ]; then
        test_name=$(basename "$file" -results.json)
        echo ""
        echo "$test_name:"
        echo "  - Total requests: $(jq '[.data[] | select(.type=="Point" and .metric=="http_reqs")] | length' "$file")"
        echo "  - Failed requests: $(jq '[.data[] | select(.type=="Point" and .metric=="http_req_failed" and .value==1)] | length' "$file")"
        echo "  - Avg response time: $(jq '[.data[] | select(.type=="Point" and .metric=="http_req_duration")] | add / length' "$file" 2>/dev/null || echo "N/A")ms"
    fi
done

echo ""
echo "💡 Next steps:"
echo "1. Review detailed results in $RESULTS_DIR"
echo "2. Check for performance bottlenecks"
echo "3. Optimize slow endpoints"
echo "4. Re-run tests after optimizations"