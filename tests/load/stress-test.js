import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 50 },  // Ramp up to 50 users
    { duration: '5m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Spike to 200 users
    { duration: '1m', target: 200 }, // Stay at 200 users
    { duration: '3m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% of requests under 5s
    http_req_failed: ['rate<0.2'],     // Error rate under 20%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test different endpoints randomly
  const endpoints = [
    { method: 'GET', url: `${BASE_URL}/` },
    { method: 'GET', url: `${BASE_URL}/upload` },
    { method: 'GET', url: `${BASE_URL}/dashboard` },
    { method: 'GET', url: `${BASE_URL}/api/v1/health` },
  ];

  const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  
  let response;
  if (randomEndpoint.method === 'GET') {
    response = http.get(randomEndpoint.url, {
      headers: {
        'User-Agent': 'k6-load-test',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
  }

  check(response, {
    'status is 200 or 302': (r) => r.status === 200 || r.status === 302,
    'response time < 5s': (r) => r.timings.duration < 5000,
  });

  // Simulate user behavior with random think time
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}