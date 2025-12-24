const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const authRouter = require('../auth');
const { User } = require('../../models/User');

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

beforeAll(async () => {
  await mongoose.connect('mongodb://localhost:27017/test-social', { useNewUrlParser: true, useUnifiedTopology: true });
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Auth Module', () => {
  it('registers a user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ username: 'testuser', password: 'testpass', role: 'user' });
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('User registered');
  });

  it('fails to register duplicate user', async () => {
    await request(app)
      .post('/auth/register')
      .send({ username: 'testuser', password: 'testpass', role: 'user' });
    const res = await request(app)
      .post('/auth/register')
      .send({ username: 'testuser', password: 'testpass', role: 'user' });
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Registration failed');
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'testpass' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('fails login with wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'wrongpass' });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Login failed');
  });

  it('returns user info with valid token', async () => {
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'testpass' });
    const token = loginRes.body.token;
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe('testuser');
    expect(res.body.role).toBe('user');
  });

  it('denies access with invalid token', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });
});
