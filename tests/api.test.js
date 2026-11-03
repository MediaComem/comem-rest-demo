import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';

import mongoose from 'mongoose';
import supertest from 'supertest';

import app from '../app.js';
import { baseUrl, version } from '../config.js';

// Disconnect from the database once the tests are done.
after(() => mongoose.disconnect());

describe('GET /api', () => {
  it('should describe the API', async () => {
    const res = await supertest(app).get('/api').expect(200).expect('Content-Type', /json/);

    assert.deepEqual(res.body, {
      docs: `${baseUrl}/docs`,
      title: 'Demonstration REST API',
      version
    });
  });
});
