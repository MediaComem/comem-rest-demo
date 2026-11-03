import assert from 'node:assert/strict';
import { after, beforeEach, describe, it } from 'node:test';

import mongoose from 'mongoose';
import supertest from 'supertest';

import app from '../app.js';
import { authToken } from '../config.js';
import Movie from '../models/movie.js';
import Person from '../models/person.js';
import { cleanUpDatabase, toAttributes } from './utils.js';

// Clean up leftover data in the database before each test in this file.
beforeEach(cleanUpDatabase);

// Disconnect from the database once the tests are done.
after(() => mongoose.disconnect());

describe('POST /admin/reset', () => {
  let janeSmith;
  let movie;
  beforeEach(async () => {
    janeSmith = await Person.create({ name: 'Jane Smith', gender: 'female' });
    movie = await Movie.create({ title: 'An Amazing Story', directorId: janeSmith.id });
  });

  /**
   * Checks that the database still contains the fixtures, unchanged.
   */
  async function assertNothingDeleted() {
    const [people, movies] = await Promise.all([Person.find().exec(), Movie.find().exec()]);
    assert.deepEqual(people.map(toAttributes), [toAttributes(janeSmith)]);
    assert.deepEqual(movies.map(toAttributes), [toAttributes(movie)]);
  }

  it('should delete all data', async () => {
    const res = await supertest(app)
      .post('/admin/reset')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(204);

    assert.equal(res.text, '');

    // Check that everything has been deleted from the database.
    const [peopleCount, moviesCount] = await Promise.all([
      Person.countDocuments().exec(),
      Movie.countDocuments().exec()
    ]);
    assert.equal(peopleCount, 0);
    assert.equal(moviesCount, 0);
  });

  it('should not delete anything without authentication', async () => {
    const res = await supertest(app).post('/admin/reset').expect(401);

    assert.equal(res.text, 'Unauthorized');
    await assertNothingDeleted();
  });

  it('should not delete anything with a malformed Authorization header', async () => {
    const res = await supertest(app)
      .post('/admin/reset')
      .set('Authorization', authToken)
      .expect(401);

    assert.equal(res.text, 'Unauthorized');
    await assertNothingDeleted();
  });

  it('should not delete anything with an invalid token', async () => {
    const res = await supertest(app)
      .post('/admin/reset')
      .set('Authorization', 'Bearer not-the-right-token')
      .expect(401);

    assert.equal(res.text, 'Unauthorized');
    await assertNothingDeleted();
  });
});
