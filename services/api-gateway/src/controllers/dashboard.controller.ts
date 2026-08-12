import { Request, Response } from 'express';
import { env } from '../config/env';

interface ServiceHealthStatus {
  name: string;
  url: string;
  port: number;
  database: string;
  status: 'ONLINE' | 'OFFLINE';
  latencyMs: number;
  details?: any;
}

export class DashboardController {
  private async checkServiceHealth(name: string, baseUrl: string, port: number, database: string): Promise<ServiceHealthStatus> {
    const startTime = Date.now();
    try {
      const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(2000) });
      const latencyMs = Date.now() - startTime;
      if (res.ok) {
        const details = await res.json().catch(() => ({}));
        return { name, url: baseUrl, port, database, status: 'ONLINE', latencyMs, details };
      }
    } catch {
      // Offline fallback
    }
    return { name, url: baseUrl, port, database, status: 'OFFLINE', latencyMs: Date.now() - startTime };
  }

  getDashboardJSON = async (_req: Request, res: Response): Promise<void> => {
    const services = await Promise.all([
      this.checkServiceHealth('user-auth-service', env.AUTH_SERVICE_URL, 3001, 'PostgreSQL (Prisma)'),
      this.checkServiceHealth('order-service', env.ORDER_SERVICE_URL, 3002, 'MongoDB (Mongoose) + Redis'),
      this.checkServiceHealth('notification-service', env.NOTIFICATION_SERVICE_URL, 3003, 'Redis Pub/Sub + Ethereal'),
      this.checkServiceHealth('payment-service', env.PAYMENT_SERVICE_URL, 3004, 'HMAC SHA-256 Webhooks'),
      this.checkServiceHealth('inventory-service', env.INVENTORY_SERVICE_URL, 3005, 'In-Memory Atomic Stock'),
    ]);

    const onlineCount = services.filter((s) => s.status === 'ONLINE').length;
    const systemStatus = onlineCount === services.length ? 'HEALTHY' : onlineCount > 0 ? 'DEGRADED' : 'UNHEALTHY';

    res.status(200).json({
      status: 'success',
      system: {
        status: systemStatus,
        totalServices: services.length,
        onlineServices: onlineCount,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        timestamp: new Date().toISOString(),
      },
      services,
    });
  };

  renderDashboardHTML = (_req: Request, res: Response): void => {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cloud Order Orchestrator - Ecosystem Dashboard</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
          body { background-color: #0F172A; color: #F8FAFC; padding: 30px 20px; min-height: 100vh; }
          .container { max-width: 1200px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 1px solid #1E293B; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: 800; background: linear-gradient(135deg, #818CF8 0%, #C084FC 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .system-badge { padding: 6px 16px; border-radius: 20px; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase; }
          .badge-healthy { background: rgba(34, 197, 94, 0.15); color: #4ADE80; border: 1px solid #22C55E; }
          .badge-degraded { background: rgba(234, 179, 8, 0.15); color: #FACC15; border: 1px solid #EAB308; }
          
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 35px; }
          .stat-card { background: #1E293B; padding: 20px; border-radius: 14px; border: 1px solid #334155; }
          .stat-label { font-size: 12px; color: #94A3B8; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
          .stat-value { font-size: 28px; font-weight: 800; color: #F8FAFC; }
          
          .section-title { font-size: 18px; font-weight: 700; margin-bottom: 20px; color: #E2E8F0; display: flex; align-items: center; gap: 10px; }
          .services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 40px; }
          .service-card { background: #1E293B; border-radius: 16px; padding: 24px; border: 1px solid #334155; transition: transform 0.2s, border-color 0.2s; }
          .service-card:hover { transform: translateY(-3px); border-color: #6366F1; }
          .service-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
          .service-name { font-size: 16px; font-weight: 700; color: #FFFFFF; }
          .status-pill { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
          .pill-online { background: #064E3B; color: #34D399; }
          .pill-offline { background: #7F1D1D; color: #FCA5A5; }
          
          .info-row { display: flex; justify-content: space-between; font-size: 13px; padding: 8px 0; border-bottom: 1px solid #334155; }
          .info-label { color: #94A3B8; }
          .info-val { color: #CBD5E1; font-weight: 600; }
          
          .footer { text-align: center; color: #64748B; font-size: 13px; margin-top: 50px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⚡ Cloud Order Orchestrator</div>
            <div id="systemBadge" class="system-badge badge-healthy">Checking Status...</div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Active Microservices</div>
              <div id="servicesStat" class="stat-value">---</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Gateway Memory</div>
              <div id="memoryStat" class="stat-value">---</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Gateway Uptime</div>
              <div id="uptimeStat" class="stat-value">---</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Prometheus Server</div>
              <div class="stat-value" style="font-size: 18px; margin-top: 6px;">
                <a href="http://localhost:9090" target="_blank" style="color: #818CF8; text-decoration: none;">Port 9090 ↗</a>
              </div>
            </div>
          </div>

          <div class="section-title">
            <span>🧩 Microservices Ecosystem Status</span>
          </div>

          <div id="servicesGrid" class="services-grid">
            <!-- Rendered dynamically -->
          </div>

          <div class="footer">
            <p>Cloud Order Orchestrator • Real-Time Distributed System Observability Dashboard</p>
            <p style="font-size: 11px; margin-top: 6px;">Auto-refreshing every 5 seconds</p>
          </div>
        </div>

        <script>
          async function fetchDashboard() {
            try {
              const res = await fetch('/api/dashboard');
              const data = await res.json();

              document.getElementById('servicesStat').innerText = data.system.onlineServices + ' / ' + data.system.totalServices;
              document.getElementById('memoryStat').innerText = data.system.memoryUsageMB + ' MB';
              document.getElementById('uptimeStat').innerText = data.system.uptimeSeconds + 's';

              const badge = document.getElementById('systemBadge');
              badge.innerText = 'SYSTEM: ' + data.system.status;
              badge.className = 'system-badge ' + (data.system.status === 'HEALTHY' ? 'badge-healthy' : 'badge-degraded');

              const grid = document.getElementById('servicesGrid');
              grid.innerHTML = data.services.map(s => \`
                <div class="service-card">
                  <div class="service-header">
                    <span class="service-name">\${s.name}</span>
                    <span class="status-pill \${s.status === 'ONLINE' ? 'pill-online' : 'pill-offline'}">\${s.status}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Port</span>
                    <span class="info-val">\${s.port}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Storage / Tech</span>
                    <span class="info-val">\${s.database}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Response Time</span>
                    <span class="info-val" style="color: \${s.latencyMs < 50 ? '#34D399' : '#FACC15'}">\${s.latencyMs} ms</span>
                  </div>
                </div>
              \`).join('');
            } catch (err) {
              console.error('Error updating dashboard:', err);
            }
          }

          fetchDashboard();
          setInterval(fetchDashboard, 5000);
        </script>
      </body>
      </html>
    `;
    res.status(200).send(html);
  };
}
