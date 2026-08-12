import { Application, Request, Response } from 'express';
import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'gateway_' });

const httpRequestCounter = new client.Counter({
  name: 'gateway_http_requests_total',
  help: 'Total HTTP requests processed by API Gateway',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestCounter);

export const setupGatewayMetrics = (app: Application): void => {
  app.use((req, res, next) => {
    res.on('finish', () => {
      const route = req.route ? req.route.path : req.path;
      httpRequestCounter.inc({
        method: req.method,
        route,
        status_code: res.statusCode.toString(),
      });
    });
    next();
  });

  app.get('/metrics', async (_req: Request, res: Response) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  });
};
