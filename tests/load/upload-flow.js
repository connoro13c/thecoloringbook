import http from 'k6/http';
import { check, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';

export let options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Simulate user uploading a photo
  const fd = new FormData();
  
  // Create a dummy image file (base64 encoded 1x1 pixel PNG)
  const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  fd.append('file', http.file(imageData, 'test.png', 'image/png'));
  fd.append('prompt', 'A friendly cartoon character');
  fd.append('style', 'Classic Cartoon');
  fd.append('difficulty', '3');

  let response = http.post(`${BASE_URL}/api/v1/upload`, fd.body(), {
    headers: {
      'Content-Type': 'multipart/form-data; boundary=' + fd.boundary,
      'Authorization': 'Bearer test-token', // Mock token for load testing
    },
  });

  check(response, {
    'upload status is 200': (r) => r.status === 200,
    'upload response has jobId': (r) => JSON.parse(r.body).jobId !== undefined,
  });

  if (response.status === 200) {
    const jobId = JSON.parse(response.body).jobId;
    
    // Poll for job completion
    let jobCompleted = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while (!jobCompleted && attempts < maxAttempts) {
      sleep(1);
      
      const statusResponse = http.get(`${BASE_URL}/api/v1/job/${jobId}`, {
        headers: {
          'Authorization': 'Bearer test-token',
        },
      });

      check(statusResponse, {
        'job status check is 200': (r) => r.status === 200,
      });

      if (statusResponse.status === 200) {
        const jobStatus = JSON.parse(statusResponse.body);
        if (jobStatus.status === 'completed') {
          jobCompleted = true;
          check(statusResponse, {
            'job completed successfully': (r) => JSON.parse(r.body).status === 'completed',
            'job has result URL': (r) => JSON.parse(r.body).resultUrl !== undefined,
          });
        } else if (jobStatus.status === 'failed') {
          check(statusResponse, {
            'job did not fail': (r) => false,
          });
          break;
        }
      }
      
      attempts++;
    }
  }

  sleep(1);
}