// These routes are used in the course's "unrest" exercise, in which students
// find out what is not RESTful about them. Their bad design is INTENTIONAL: these
// tests check that the routes keep behaving as the exercise expects, including
// the status codes, headers and URLs that a real API should not have.

import assert from 'node:assert/strict';
import { after, describe, it } from 'node:test';

import mongoose from 'mongoose';
import supertest from 'supertest';

import app from '../app.js';

// Disconnect from the database once the tests are done (these routes do not use
// it, but importing the application connects to it).
after(() => mongoose.disconnect());

describe('GET /unrest/people', () => {
  it('should retrieve the list of people', async () => {
    const res = await supertest(app)
      .get('/unrest/people')
      .expect(200)
      .expect('Content-Type', /json/);

    assert.deepEqual(res.body, [
      { id: 2, firstName: 'Lorna', lastName: 'Cole', age: 35 },
      { id: 4, firstName: 'John', lastName: 'Doe', age: 20 },
      { id: 23, firstName: 'Peter', lastName: 'Gibbons', age: 30 },
      { id: 11, firstName: 'Abigail', lastName: 'McDeere', age: 28 },
      { id: 42, firstName: 'Mitch', lastName: 'McDeere', age: 29 },
      { id: 82, firstName: 'Daryl', lastName: 'Richardson', age: 12 },
      { id: 7, firstName: 'Martin', lastName: 'Riggs', age: 35 },
      { id: 12, firstName: 'John', lastName: 'Smith', age: 40 },
      { id: 88, firstName: 'Michael', lastName: 'Walsch', age: 11 }
    ]);
  });
});

// Intentional: filters are separate paths instead of URL query parameters.
describe('GET /unrest/people/byAge/:age', () => {
  it('should retrieve the people of that age', async () => {
    const res = await supertest(app)
      .get('/unrest/people/byAge/35')
      .expect(200)
      .expect('Content-Type', /json/);

    assert.deepEqual(res.body, [
      { id: 2, firstName: 'Lorna', lastName: 'Cole', age: 35 },
      { id: 7, firstName: 'Martin', lastName: 'Riggs', age: 35 }
    ]);
  });
});

// Intentional: filters are separate paths instead of URL query parameters.
describe('GET /unrest/people/byFirstName/:firstName', () => {
  it('should retrieve the people with that first name', async () => {
    const res = await supertest(app)
      .get('/unrest/people/byFirstName/John')
      .expect(200)
      .expect('Content-Type', /json/);

    assert.deepEqual(res.body, [
      { id: 4, firstName: 'John', lastName: 'Doe', age: 20 },
      { id: 12, firstName: 'John', lastName: 'Smith', age: 40 }
    ]);
  });
});

// Intentional: filters are separate paths instead of URL query parameters.
describe('GET /unrest/people/byLastName/:lastName', () => {
  it('should retrieve the people with that last name', async () => {
    const res = await supertest(app)
      .get('/unrest/people/byLastName/McDeere')
      .expect(200)
      .expect('Content-Type', /json/);

    assert.deepEqual(res.body, [
      { id: 11, firstName: 'Abigail', lastName: 'McDeere', age: 28 },
      { id: 42, firstName: 'Mitch', lastName: 'McDeere', age: 29 }
    ]);
  });
});

// Intentional: a verb in the path, and a collection path that does not match
// the one used to retrieve the person later.
describe('POST /unrest/people/create', () => {
  it('should create a person', async () => {
    const res = await supertest(app)
      .post('/unrest/people/create')
      .send({ firstName: 'John', lastName: 'Doe', age: 20 })
      // Intentional: 200 OK instead of 201 Created.
      .expect(200)
      .expect('Content-Type', /json/);

    const { id, ...rest } = res.body;
    assert.ok(Number.isInteger(id));
    assert.deepEqual(rest, { firstName: 'John', lastName: 'Doe', age: 20 });

    // Intentional: no Location header.
    assert.equal(res.get('Location'), undefined);

    // Nothing is actually saved: the people are hardcoded in the application,
    // so there is no side effect to check.
  });
});

// Intentional: singular "person" instead of the "people" collection.
describe('GET /unrest/person/:id', () => {
  it('should retrieve a person', async () => {
    const res = await supertest(app)
      .get('/unrest/person/7')
      .expect(200)
      .expect('Content-Type', /json/);

    assert.deepEqual(res.body, { id: 7, firstName: 'Martin', lastName: 'Riggs', age: 35 });
  });

  // Intentional: a GET request with a URL query parameter that "modifies" the
  // person. Only the response pretends that the person was updated: nothing is
  // actually changed, so there is no side effect to check.
  it('should pretend to update a person', async () => {
    const res = await supertest(app)
      .get('/unrest/person/7?updateFirstName=Bob')
      .expect(200)
      .expect('Content-Type', /json/);

    assert.deepEqual(res.body, { id: 7, firstName: 'Bob', lastName: 'Riggs', age: 35 });
  });

  it('should not retrieve a person that does not exist', async () => {
    const res = await supertest(app)
      .get('/unrest/person/1')
      .expect(404)
      // Intentional: a plain text error sent as HTML.
      .expect('Content-Type', /html/);

    assert.equal(res.text, 'No person found with ID 1');
  });
});

describe('POST /unrest/things', () => {
  it('should create a thing', async () => {
    const res = await supertest(app)
      .post('/unrest/things')
      .send({ name: 'Some thing' })
      .expect(201)
      .expect('Content-Type', /json/);

    const { id, ...rest } = res.body;
    assert.ok(Number.isInteger(id));
    assert.deepEqual(rest, { name: 'Some thing' });

    // Intentional: no Location header, although the status is 201 Created.
    assert.equal(res.get('Location'), undefined);
  });

  it('should not create a thing without a name', async () => {
    const res = await supertest(app)
      .post('/unrest/things')
      .send({})
      // Intentional: 500 Internal Server Error for a client error.
      .expect(500)
      // Intentional: a plain text error sent as HTML.
      .expect('Content-Type', /html/);

    assert.equal(res.text, 'The "name" property is required');
  });

  it('should not create a thing with a name that is not a string', async () => {
    const res = await supertest(app)
      .post('/unrest/things')
      .send({ name: 42 })
      // Intentional: 500 Internal Server Error for a client error.
      .expect(500)
      // Intentional: a plain text error sent as HTML.
      .expect('Content-Type', /html/);

    assert.equal(res.text, '"name" must be a string');
  });

  it('should not create a thing from a request body that is not an object', async () => {
    const res = await supertest(app)
      .post('/unrest/things')
      .send([])
      // Intentional: 500 Internal Server Error for a client error.
      .expect(500)
      // Intentional: a plain text error sent as HTML.
      .expect('Content-Type', /html/);

    assert.equal(res.text, 'The request body must be a JSON object');
  });
});
