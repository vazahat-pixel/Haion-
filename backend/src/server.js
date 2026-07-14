import app from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { startReportScheduler } from './jobs/reportScheduler.js';
import { seedCmsIfEmpty } from './services/cms.service.js';
import { syncMissingRolePermissions } from './services/permission.service.js';

async function start() {
  try {
    await connectDatabase();
    await syncMissingRolePermissions();
    await seedCmsIfEmpty();
    if (env.isDev || process.env.ENABLE_REPORT_CRON === 'true') {
      startReportScheduler();
    }
    app.listen(env.port, () => {
      console.log(`Haion ERP API listening on port ${env.port}`);
      console.log(`Environment: ${env.nodeEnv}`);
      console.log(`CORS origins: ${env.corsOrigins.join(', ')}${env.isDev ? ' (+ localhost auto)' : ''}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
