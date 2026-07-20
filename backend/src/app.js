import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import productRoutes from './routes/product.routes.js';
import warehouseRoutes from './routes/warehouse.routes.js';
import dealerRoutes from './routes/dealer.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import grnRoutes from './routes/grn.routes.js';
import dispatchRoutes from './routes/dispatch.routes.js';
import dealerPanelRoutes from './routes/dealerPanel.routes.js';
import { categoryRouter, brandRouter } from './routes/catalog.routes.js';
import customerPanelRoutes from './routes/customerPanel.routes.js';
import customerRoutes from './routes/customer.routes.js';
import billingRoutes from './routes/billing.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import warrantyRoutes from './routes/warranty.routes.js';
import gstRoutes from './routes/gst.routes.js';
import complaintRoutes from './routes/complaint.routes.js';
import spareRoutes from './routes/spare.routes.js';
import returnRoutes from './routes/return.routes.js';
import serviceRequestRoutes from './routes/serviceRequest.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import taskRoutes from './routes/task.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import employeePanelRoutes from './routes/employeePanel.routes.js';
import approvalRoutes from './routes/approval.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import auditRoutes from './routes/audit.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import orderRoutes from './routes/order.routes.js';
import reportRoutes from './routes/report.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import pricingRoutes from './routes/pricing.routes.js';
import rbacRoutes from './routes/rbac.routes.js';
import searchRoutes from './routes/search.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import addressRoutes from './routes/address.routes.js';
import stockMovementRoutes from './routes/stockMovement.routes.js';
import adminCmsRoutes from './routes/cms/admin.cms.routes.js';
import publicCmsRoutes from './routes/cms/public.cms.routes.js';
import partyRoutes from './routes/party.routes.js';
import purchaseRoutes from './routes/purchase.routes.js';
import manufactureRoutes from './routes/manufacture.routes.js';
import storeRoutes from './routes/store.routes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.middleware.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// ── Health check — placed before CORS/rate-limit so it is always reachable ────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'OK', data: { version: process.env.npm_package_version || '1.0.0' } });
});

// ── Security headers (helmet) ─────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: env.isDev ? null : [],
    },
  },
  hsts: env.isDev ? false : { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false,
}));

// ── HTTP request logging (no body — avoids logging passwords) ─────────────────
app.use(morgan(env.isDev ? 'dev' : 'combined'));

// ── CORS — only explicitly allowlisted origins ────────────────────────────────
// SECURITY: Removed wildcard *.vercel.app — attacker could register evil.vercel.app
const _corsAllowedSet = new Set(env.corsOrigins);
function isAllowedCorsOrigin(origin) {
  if (!origin) {
    // No origin = same-origin, server-to-server, or supertest — allow in dev/test, block in production
    return env.isDev || env.nodeEnv === 'test';
  }
  if (_corsAllowedSet.has(origin)) return true;
  // Dev only: allow any localhost Vite port (5173, 5174, …)
  if (env.isDev && /^https?:\/\/localhost(:\d+)?$/.test(origin)) return true;
  if (env.isDev && /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return true;
  return false;
}

app.use(cors({
  origin(origin, callback) {
    if (isAllowedCorsOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Panel', 'X-Request-ID'],
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// ── NoSQL injection prevention — strip $ and . from req.body/query/params ─────
app.use(mongoSanitize({ replaceWith: '_', allowDots: false }));

// ── HTTP Parameter Pollution prevention ───────────────────────────────────────
app.use(hpp());

// ── Uploaded files — force download, prevent script execution ────────────────
app.use('/uploads', (req, res, next) => {
  // Prevent browsers from executing uploaded files as scripts
  res.setHeader('Content-Disposition', 'attachment');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  next();
}, express.static(path.join(__dirname, '../uploads')));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isDev ? 1000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// (health check registered above, before CORS middleware)

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/dealers', dealerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/grn', grnRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/categories', categoryRouter);
app.use('/api/brands', brandRouter);
app.use('/api/dealer', dealerPanelRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/customer-panel', customerPanelRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/warranty', warrantyRoutes);
app.use('/api/gst', gstRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/spares', spareRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/employee', employeePanelRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/stock-movements', stockMovementRoutes);
app.use('/api/cms', publicCmsRoutes);
app.use('/api/admin/cms', adminCmsRoutes);
app.use('/api/parties', partyRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/manufacture', manufactureRoutes);
app.use('/api/store', storeRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
