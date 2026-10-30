import assert from 'node:assert';
import { OmniRouter } from '../src/core/router.mjs';
import { json } from '../src/middleware/index.mjs';

console.log('\x1b[36m=== Running NEXA-LOGICS Route Test Suite ===\x1b[0m\n');

// ─── Test 1: Basic Route Registration & Resolution ───
const router = new OmniRouter();
let handlerCalled = false;

router.get('/api/health', async (ctx) => { handlerCalled = true; });
router.post('/api/data', async (ctx) => {});
router.get('/api/users/:id', async (ctx) => {});
router.get('/api/orders/:orderId/items/:itemId', async (ctx) => {});

const match1 = router.resolve('GET', '/api/health');
assert(match1 !== null, 'Must match GET /api/health');
console.log('  [PASS] Static route resolution verified.');

// ─── Test 2: Dynamic Path Parameters ───
const match2 = router.resolve('GET', '/api/users/42');
assert(match2 !== null, 'Must match /api/users/:id');
assert.strictEqual(match2.params.id, '42', 'Must extract id=42');
console.log('  [PASS] Dynamic path parameter extraction verified (id=42).');

// ─── Test 3: Multi-Parameter Nested Routes ───
const match3 = router.resolve('GET', '/api/orders/ORD-001/items/ITEM-99');
assert(match3 !== null, 'Must match nested param route');
assert.strictEqual(match3.params.orderId, 'ORD-001');
assert.strictEqual(match3.params.itemId, 'ITEM-99');
console.log('  [PASS] Multi-parameter nested routes verified (orderId=ORD-001, itemId=ITEM-99).');

// ─── Test 4: Method Isolation ───
const noMatch = router.resolve('DELETE', '/api/health');
assert(noMatch === null, 'DELETE /api/health must NOT match GET handler');
console.log('  [PASS] HTTP method isolation verified.');

// ─── Test 5: 404 for Unknown Routes ───
const noRoute = router.resolve('GET', '/api/unknown/path');
assert(noRoute === null, 'Unknown path must return null');
console.log('  [PASS] 404 route miss verified.');

// ─── Test 6: Route Groups (Prefix Nesting) ───
const groupRouter = new OmniRouter();
groupRouter.group('/api/v2/products', (r) => {
  r.get('/', async (ctx) => {});
  r.get('/:productId', async (ctx) => {});
  r.post('/', async (ctx) => {});
});

const gMatch1 = groupRouter.resolve('GET', '/api/v2/products/');
assert(gMatch1 !== null, 'Grouped root must match');

const gMatch2 = groupRouter.resolve('GET', '/api/v2/products/SKU-500');
assert(gMatch2 !== null, 'Grouped param route must match');
assert.strictEqual(gMatch2.params.productId, 'SKU-500');

const gMatch3 = groupRouter.resolve('POST', '/api/v2/products/');
assert(gMatch3 !== null, 'Grouped POST must match');
console.log('  [PASS] Route groups with prefix nesting verified.');

// ─── Test 7: Route Table Inspection ───
const table = groupRouter.getRouteTable();
assert(Array.isArray(table) && table.length === 3, 'Must list 3 grouped routes');
console.log('  [PASS] Route table introspection verified (' + table.length + ' routes).');

// ─── Test 8: Wildcard Catch-All ───
const wildRouter = new OmniRouter();
wildRouter.all('/api/*', async (ctx) => {});

const wMatch = wildRouter.resolve('PATCH', '/api/any/deep/path');
assert(wMatch !== null, 'Wildcard must catch all sub-paths');
console.log('  [PASS] Wildcard catch-all route verified.');

console.log('\n\x1b[32m[ALL 8 NEXA-LOGICS ROUTE TESTS PASSED!]\x1b[0m');
