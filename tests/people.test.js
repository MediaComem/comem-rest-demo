import mongoose from 'mongoose';
import supertest from 'supertest';

import app from '../app.js';
import { baseUrl } from '../config.js';
import Movie from '../models/movie.js';
import Person from '../models/person.js';
import { cleanUpDatabase } from './utils.js';

// Clean up leftover data in the database before each test in this block.
beforeEach(cleanUpDatabase);

test('POST /api/people', async () => {
  // Make a POST request on /api/people.
  const res = await supertest(app).post('/api/people').send({
    name: 'John Doe',
    gender: 'male'
  });

  // Check that the status and headers of the response are correct.
  expect(res.status).toBe(201);
  expect(res.get('Content-Type')).toContain('application/json');

  // Check that the response body is the created person.
  const body = res.body;
  expect(typeof body).toBe('object');
  expect(typeof body.createdAt).toBe('string');
  expect(body.gender).toBe('male');
  expect(typeof body.id).toBe('string');
  expect(body.name).toBe('John Doe');
  expect(Object.keys(body).sort()).toEqual(['createdAt', 'gender', 'id', 'name']);

  // Check that the Location header points to the correct resource.
  expect(res.get('Location')).toEqual(`${baseUrl}/api/people/${body.id}`);
});

test('GET /api/people', async () => {
  // Create 3 people in the database before each test in this block.
  const [johnSmith, janeSmith] = await Promise.all([
    Person.create({ name: 'John Smith', gender: 'male' }),
    Person.create({ name: 'Jane Smith', gender: 'female' }),
    Person.create({ name: 'Zoe Smith', gender: 'other' })
  ]);

  // Also create 3 movies directed by the 2 people.
  await Promise.all([
    Movie.create({ title: 'An Amazing Story', rating: 10, directorId: janeSmith.id }),
    Movie.create({ title: 'A Bad Story', rating: 2, directorId: janeSmith.id }),
    Movie.create({ title: 'A So-So Story', rating: 4, directorId: johnSmith.id })
  ]);

  // Make a GET request on /api/people.
  const res = await supertest(app).get('/api/people');

  // Check that the status and headers of the response are correct.
  expect(res.status).toBe(200);
  expect(res.get('Content-Type')).toContain('application/json');

  // Check that the response body is an array.
  const body = res.body;
  expect(Array.isArray(body)).toBe(true);

  // Check that the first person is the correct one.
  expect(typeof body[0].createdAt).toBe('string');
  expect(body[0].directedMovies).toBe(2);
  expect(body[0].gender).toBe('female');
  expect(typeof body[0].id).toBe('string');
  expect(body[0].name).toBe('Jane Smith');
  expect(Object.keys(body[0]).sort()).toEqual([
    'createdAt',
    'directedMovies',
    'gender',
    'id',
    'name'
  ]);

  // Check that the second person is the correct one.
  expect(typeof body[1].createdAt).toBe('string');
  expect(body[1].directedMovies).toBe(1);
  expect(body[1].gender).toBe('male');
  expect(typeof body[1].id).toBe('string');
  expect(body[1].name).toBe('John Smith');
  expect(Object.keys(body[1]).sort()).toEqual([
    'createdAt',
    'directedMovies',
    'gender',
    'id',
    'name'
  ]);

  // Check that the third person is the correct one (people who have not
  // directed any movie must also be listed).
  expect(typeof body[2].createdAt).toBe('string');
  expect(body[2].directedMovies).toBe(0);
  expect(body[2].gender).toBe('other');
  expect(typeof body[2].id).toBe('string');
  expect(body[2].name).toBe('Zoe Smith');
  expect(Object.keys(body[2]).sort()).toEqual([
    'createdAt',
    'directedMovies',
    'gender',
    'id',
    'name'
  ]);

  // Check that the list is the correct length.
  expect(body.length).toBe(3);
});

test('GET /api/people with an invalid page size', async () => {
  // Create a person in the database.
  await Person.create({ name: 'John Smith', gender: 'male' });

  // Make a GET request on /api/people with a page size of 0.
  const res = await supertest(app).get('/api/people?pageSize=0');

  // Check that the status and headers of the response are correct.
  expect(res.status).toBe(200);
  expect(res.get('Content-Type')).toContain('application/json');

  // Check that the response body is an array.
  const body = res.body;
  expect(Array.isArray(body)).toBe(true);

  // Check that the person is the correct one.
  expect(typeof body[0].createdAt).toBe('string');
  expect(body[0].directedMovies).toBe(0);
  expect(body[0].gender).toBe('male');
  expect(typeof body[0].id).toBe('string');
  expect(body[0].name).toBe('John Smith');
  expect(Object.keys(body[0]).sort()).toEqual([
    'createdAt',
    'directedMovies',
    'gender',
    'id',
    'name'
  ]);

  // Check that the list is the correct length.
  expect(body.length).toBe(1);
});

// Disconnect from the database once the tests are done.
afterAll(mongoose.disconnect);
