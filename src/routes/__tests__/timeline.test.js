const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Redis = require('ioredis-mock');
const timelineRouter = require('../timeline');
const { Post } = require('../../models/Post');

const app = express();
app.use(express.json());
app.use('/timeline', timelineRouter);

beforeAll(async () => {
  await mongoose.connect('mongodb://localhost:27017/test-social', { useNewUrlParser: true, useUnifiedTopology: true });
  await Post.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Timeline Route', () => {
  it('returns empty timeline for new user', async () => {
    const res = await request(app)
      .get('/timeline?userId=507f1f77bcf86cd799439011');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns timeline with posts and caches result', async () => {
    await Post.create({ userId: '507f1f77bcf86cd799439011', content: 'Hello world!' });
    const res1 = await request(app)
      .get('/timeline?userId=507f1f77bcf86cd799439011');
    expect(res1.statusCode).toBe(200);
    expect(res1.body.length).toBe(1);
    expect(res1.body[0].content).toBe('Hello world!');
    // Second request should hit cache
    const res2 = await request(app)
      .get('/timeline?userId=507f1f77bcf86cd799439011');
    expect(res2.statusCode).toBe(200);
    expect(res2.body.length).toBe(1);
  });
});
