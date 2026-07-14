import app from '../src/app.js';
import { connectDatabase } from '../src/config/database.js';
import { syncMissingRolePermissions } from '../src/services/permission.service.js';
import { seedCmsIfEmpty } from '../src/services/cms.service.js';

let initPromise = null;

function ensureReady() {
  if (!initPromise) {
    initPromise = (async () => {
      await connectDatabase();
      await syncMissingRolePermissions();
      await seedCmsIfEmpty();
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

export default async function handler(req, res) {
  await ensureReady();
  return app(req, res);
}
