import request from 'supertest';
import app from '../src/app';

describe('API Gateway Tests', () => {
  it('should return 200 OK for /health endpoint', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('UP');
    expect(response.body.service).toBe('api-gateway');
  });

  it('should return 200 OK for /metrics Prometheus endpoint', async () => {
    const response = await request(app).get('/metrics');
    expect(response.status).toBe(200);
    expect(response.text).toContain('gateway_http_requests_total');
  });

  it('should return 200 OK for /dashboard HTML UI', async () => {
    const response = await request(app).get('/dashboard');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Cloud Order Orchestrator');
  });

  it('should return 200 OK for /api/dashboard JSON stats', async () => {
    const response = await request(app).get('/api/dashboard');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.services).toBeDefined();
  });

  it('should return 404 for non-existent route in gateway', async () => {
    const response = await request(app).get('/non-existent-gateway-route');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      status: 'fail',
      message: 'Route not found in api-gateway',
    });
  });
});
