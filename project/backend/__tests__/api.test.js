const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { MongoMemoryServer } = require('mongodb-memory-server');

let app;
let mongoServer;
let token;
let companyId;
let productId;
let serviceId;

beforeAll(async () => {
  const mongoCacheDir = path.join(__dirname, '../.mongo-memory-cache');
  fs.mkdirSync(mongoCacheDir, { recursive: true });
  process.env.MONGOMS_DOWNLOAD_DIR = mongoCacheDir;
  process.env.MONGOMS_DISABLE_POSTINSTALL = '1';

  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  process.env.JWT_SECRET = 'test_secret';
  process.env.ADMIN_EMAIL = 'admin@test.local';
  process.env.ADMIN_PASSWORD = 'Admin1234';
  process.env.ALLOWED_ORIGINS = 'http://localhost:5000';

  app = require('../server');
  await mongoose.connection.asPromise();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

test('admin can login', async () => {
  const res = await request(app)
    .post('/api/admin/login')
    .send({ email: 'admin@test.local', password: 'Admin1234' })
    .expect(200);

  expect(res.body.success).toBe(true);
  token = res.body.token;
});

test('companies can be created, listed, and reject duplicates', async () => {
  const create = await request(app)
    .post('/api/companies')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Samsung', isActive: true })
    .expect(201);

  companyId = create.body.data._id;

  await request(app)
    .post('/api/companies')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: ' samsung ' })
    .expect(400);

  const list = await request(app).get('/api/companies').expect(200);
  expect(list.body.data[0].name).toBe('Samsung');
});

test('products can be created and listed', async () => {
  const create = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${token}`)
    .send({
      companyId,
      name: 'Fast Charger',
      category: 'Charger',
      price: 799,
      isAvailable: true
    })
    .expect(201);

  productId = create.body.data._id;

  const list = await request(app)
    .get('/api/products')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(list.body.data.some(product => product._id === productId)).toBe(true);
});

test('services can be created and listed', async () => {
  const create = await request(app)
    .post('/api/services')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Screen Replacement',
      type: 'repair',
      price: 999,
      isAvailable: true
    })
    .expect(201);

  serviceId = create.body.data._id;

  const list = await request(app)
    .get('/api/services')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(list.body.data.some(service => service._id === serviceId)).toBe(true);
});

test('requests can be submitted and updated', async () => {
  const create = await request(app)
    .post('/api/orders/request-order')
    .send({
      customerName: 'Test Customer',
      customerPhone: '9876543210',
      type: 'product',
      item: 'Fast Charger',
      amount: 799,
      message: 'Need one charger'
    })
    .expect(201);

  let list = await request(app)
    .get('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  let createdRequest = list.body.data.find(order => order._id === create.body.data._id);
  expect(createdRequest.notificationHistory[0].notificationType).toBe('Request Received');

  await request(app)
    .patch(`/api/orders/${create.body.data._id}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      status: 'Contacted',
      notes: 'Called customer',
      followUpNotes: 'Customer wants a callback'
    })
    .expect(200);

  const contacted = await request(app)
    .patch(`/api/orders/${create.body.data._id}/contacted`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(contacted.body.data.status).toBe('Contacted');
  expect(contacted.body.data.lastContactDate).toBeTruthy();

  const followUp = await request(app)
    .patch(`/api/orders/${create.body.data._id}/follow-up`)
    .set('Authorization', `Bearer ${token}`)
    .send({ nextFollowUpDate: '2026-06-25', followUpNotes: 'Call after stock check' })
    .expect(200);

  expect(followUp.body.data.nextFollowUpDate).toBeTruthy();
  expect(followUp.body.data.followUpNotes).toBe('Call after stock check');

  const whatsapp = await request(app)
    .post(`/api/orders/${create.body.data._id}/notifications/whatsapp`)
    .set('Authorization', `Bearer ${token}`)
    .expect(201);

  expect(whatsapp.body.data.whatsappUrl).toContain('https://wa.me/9876543210');

  list = await request(app)
    .get('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  createdRequest = list.body.data.find(order => order._id === create.body.data._id);
  expect(createdRequest.notificationHistory.length).toBeGreaterThanOrEqual(3);

  const analytics = await request(app)
    .get('/api/analytics?range=all')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);

  expect(analytics.body.data.cards.totalFollowUps).toBeGreaterThanOrEqual(1);
  expect(analytics.body.data.cards.totalContacted).toBeGreaterThanOrEqual(1);

  await request(app)
    .get('/api/analytics/export/requests?format=csv&range=all')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /text\/csv/);

  await request(app)
    .get('/api/analytics/export/requests?format=excel&range=all')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /application\/vnd\.ms-excel/);
});
