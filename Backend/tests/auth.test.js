// ===============================================================
//  audit.test.js
//  End-to-End In-Memory Test Suite (Task E-3)
// ===============================================================

const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../app');

// Allow up to 10 minutes for the MongoDB binary to download on the first run
jest.setTimeout(600000);

let replSet;
let userToken;
let testCategoryId;

beforeAll(async () => {
  // Mock the cron jobs so they don't run during testing
  jest.mock('../utils/cronJobs', () => jest.fn());
  
  // Force Mongoose to disconnect completely before setting up the test server
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  // 1. Explicitly create a Replica Set instead of a standalone server
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  
  // 2. MUST wait for the replica set to be fully elected and running
  await replSet.waitUntilRunning();
  
  // 3. Get the URI of the running replica set
  const uri = replSet.getUri();
  
  // 4. Connect Mongoose
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (replSet) {
    await replSet.stop();
  }
});

describe('End-to-End Security & Cascade Audit', () => {
  
  it('should register a user and return a hardened JWT (Task E-1)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Audit',
        lastName: 'Test',
        email: 'audit@example.com',
        password: 'Password123!'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
    userToken = res.body.token; // Save token for protected routes
  });

  it('should create a custom category', async () => {
    const res = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Dining',
        type: 'expense',
        color: '#FF5733'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    testCategoryId = res.body.data._id;
  });

  it('should safely delete the category and cascade (Task E-2)', async () => {
    const res = await request(app)
      .delete(`/api/categories/${testCategoryId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/safely reassigned/);
  });
});
