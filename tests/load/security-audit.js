import http from 'k6/http';
import { check, group } from 'k6';

export let options = {
  vus: 1,
  duration: '5m',
  thresholds: {
    checks: ['rate>0.9'], // 90% of security checks should pass
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  group('Security Headers', function () {
    const response = http.get(BASE_URL);
    
    check(response, {
      'Has Content-Security-Policy': (r) => r.headers['Content-Security-Policy'] !== undefined,
      'Has X-Frame-Options': (r) => r.headers['X-Frame-Options'] !== undefined,
      'Has X-Content-Type-Options': (r) => r.headers['X-Content-Type-Options'] === 'nosniff',
      'Has Strict-Transport-Security': (r) => r.headers['Strict-Transport-Security'] !== undefined,
      'Has X-XSS-Protection': (r) => r.headers['X-XSS-Protection'] !== undefined,
      'No Server header exposure': (r) => r.headers['Server'] === undefined,
      'No X-Powered-By header': (r) => r.headers['X-Powered-By'] === undefined,
    });
  });

  group('Authentication Tests', function () {
    // Test unauthorized access to protected endpoints
    const protectedEndpoints = [
      '/api/v1/upload',
      '/api/v1/checkout',
      '/dashboard',
    ];

    protectedEndpoints.forEach(endpoint => {
      const response = http.get(`${BASE_URL}${endpoint}`);
      check(response, {
        [`${endpoint} requires auth`]: (r) => r.status === 401 || r.status === 403 || r.status === 302,
      });
    });
  });

  group('Input Validation', function () {
    // Test for XSS vulnerabilities
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '"><script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src=x onerror=alert("xss")>',
    ];

    xssPayloads.forEach(payload => {
      const response = http.post(`${BASE_URL}/api/v1/upload`, {
        prompt: payload,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      check(response, {
        [`XSS payload rejected: ${payload.substring(0, 20)}...`]: (r) => 
          r.status >= 400 || !r.body.includes(payload),
      });
    });

    // Test for SQL injection
    const sqlPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "1' UNION SELECT * FROM users --",
    ];

    sqlPayloads.forEach(payload => {
      const response = http.get(`${BASE_URL}/api/v1/job/${payload}`);
      check(response, {
        [`SQL injection rejected: ${payload.substring(0, 20)}...`]: (r) => 
          r.status >= 400 || !r.body.toLowerCase().includes('error'),
      });
    });
  });

  group('File Upload Security', function () {
    // Test malicious file uploads
    const maliciousFiles = [
      { name: 'test.php', content: '<?php echo "hack"; ?>', type: 'application/x-php' },
      { name: 'test.exe', content: 'MZ\x90\x00', type: 'application/octet-stream' },
      { name: 'test.svg', content: '<svg><script>alert("xss")</script></svg>', type: 'image/svg+xml' },
    ];

    maliciousFiles.forEach(file => {
      const response = http.post(`${BASE_URL}/api/v1/upload`, {
        file: http.file(file.content, file.name, file.type),
      });
      
      check(response, {
        [`Malicious file rejected: ${file.name}`]: (r) => r.status >= 400,
      });
    });

    // Test oversized files
    const oversizedFile = 'A'.repeat(15 * 1024 * 1024); // 15MB
    const oversizeResponse = http.post(`${BASE_URL}/api/v1/upload`, {
      file: http.file(oversizedFile, 'large.jpg', 'image/jpeg'),
    });
    
    check(oversizeResponse, {
      'Oversized file rejected': (r) => r.status >= 400,
    });
  });

  group('Rate Limiting', function () {
    // Test rate limiting by making rapid requests
    const responses = [];
    for (let i = 0; i < 20; i++) {
      responses.push(http.get(`${BASE_URL}/api/v1/health`));
    }
    
    const rateLimited = responses.some(r => r.status === 429);
    check(null, {
      'Rate limiting is enforced': () => rateLimited,
    });
  });

  group('Information Disclosure', function () {
    // Test for sensitive information in responses
    const sensitiveEndpoints = [
      '/api/v1/config',
      '/.env',
      '/config.json',
      '/package.json',
    ];

    sensitiveEndpoints.forEach(endpoint => {
      const response = http.get(`${BASE_URL}${endpoint}`);
      check(response, {
        [`${endpoint} not accessible`]: (r) => r.status === 404 || r.status === 403,
      });
    });

    // Check for error message information disclosure
    const errorResponse = http.get(`${BASE_URL}/api/v1/nonexistent`);
    check(errorResponse, {
      'Error messages do not expose stack traces': (r) => 
        !r.body.includes('Error:') && !r.body.includes('at '),
    });
  });
}