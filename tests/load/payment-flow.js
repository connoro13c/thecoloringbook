import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 5 },  // Ramp up to 5 users
    { duration: '3m', target: 5 },  // Stay at 5 users
    { duration: '1m', target: 10 }, // Ramp up to 10 users
    { duration: '3m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% of requests under 3s
    http_req_failed: ['rate<0.05'],    // Error rate under 5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Simulate payment flow
  const jobId = 'test-job-' + Math.random().toString(36).substr(2, 9);
  
  // Create checkout session
  let response = http.post(`${BASE_URL}/api/v1/checkout`, 
    JSON.stringify({
      jobId: jobId,
      priceId: 'price_coloring_book_page',
    }), 
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
    }
  );

  check(response, {
    'checkout session created': (r) => r.status === 200,
    'checkout has session URL': (r) => JSON.parse(r.body).url !== undefined,
  });

  if (response.status === 200) {
    const checkoutData = JSON.parse(response.body);
    
    // Simulate successful payment webhook
    const webhookPayload = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: checkoutData.sessionId,
          payment_status: 'paid',
          metadata: {
            jobId: jobId,
          },
        },
      },
    };

    const webhookResponse = http.post(`${BASE_URL}/api/v1/webhook/stripe`,
      JSON.stringify(webhookPayload),
      {
        headers: {
          'Content-Type': 'application/json',
          'Stripe-Signature': 'test-signature',
        },
      }
    );

    check(webhookResponse, {
      'webhook processed successfully': (r) => r.status === 200,
    });

    // Download PDF
    sleep(1); // Allow webhook processing time
    
    const downloadResponse = http.get(`${BASE_URL}/api/v1/download/${jobId}`, {
      headers: {
        'Authorization': 'Bearer test-token',
      },
    });

    check(downloadResponse, {
      'PDF download successful': (r) => r.status === 200,
      'PDF content type correct': (r) => r.headers['Content-Type'] === 'application/pdf',
    });
  }

  sleep(2);
}