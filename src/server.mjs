import http from 'node:http';
import { OmniRouter } from './core/router.mjs';
import { cors, logger, rateLimiter, jsonParser, json } from './middleware/index.mjs';

const app = new OmniRouter();
const PORT = process.env.PORT || 4000;

// ─── Global Middleware Pipeline ───
app.use(cors());
app.use(logger());
app.use(rateLimiter({ windowMs: 60000, maxRequests: 200 }));

// ─── Health & System Routes ───
app.get('/api/health', async (ctx) => {
  json(ctx, 200, {
    engine: 'NEXA-LOGICS Route v1.0.0',
    status: 'operational',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/routes', async (ctx) => {
  json(ctx, 200, { routes: app.getRouteTable() });
});

// ─── User CRUD API Group ───
app.group('/api/v1/users', (r) => {
  r.get('/', async (ctx) => {
    json(ctx, 200, {
      data: [
        { id: 1, username: 'admin', role: 'superadmin' },
        { id: 2, username: 'engineer', role: 'developer' },
      ],
    });
  });

  r.get('/:id', async (ctx) => {
    json(ctx, 200, { data: { id: ctx.params.id, username: 'user_' + ctx.params.id } });
  });

  r.post('/', async (ctx) => {
    json(ctx, 201, { message: 'User created successfully', id: Date.now() });
  });

  r.delete('/:id', async (ctx) => {
    json(ctx, 200, { message: `User ${ctx.params.id} deleted` });
  });
});

// ─── Products API Group ───
app.group('/api/v1/products', (r) => {
  r.get('/', async (ctx) => {
    json(ctx, 200, {
      data: [
        { id: 'nx-001', name: 'NEXA Shield Pro', price: 299 },
        { id: 'nx-002', name: 'NEXA Vault Enterprise', price: 599 },
      ],
    });
  });

  r.get('/:productId', async (ctx) => {
    json(ctx, 200, { data: { id: ctx.params.productId, name: 'Product ' + ctx.params.productId } });
  });
});

// ─── Custom 404 ───
app.onNotFound((ctx) => {
  json(ctx, 404, { error: 'NEXA-LOGICS Route: Endpoint not found', path: ctx.pathname });
});

// ─── Custom Error Handler ───
app.onError((err, ctx) => {
  json(ctx, 500, { error: 'Internal Server Error', message: err.message });
});

// ─── Launch Server ───
const server = http.createServer((req, res) => app.handle(req, res));

export { server, app };

if (process.argv[1] && process.argv[1].endsWith('server.mjs')) {
  server.listen(PORT, () => {
    console.log(`\x1b[36m[NEXA-LOGICS Route]\x1b[0m API Gateway running on http://localhost:${PORT}`);
    console.log(`  Routes registered: ${app.getRouteTable().length}`);
  });
}
