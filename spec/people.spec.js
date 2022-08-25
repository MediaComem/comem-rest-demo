const { expect } = require('chai');
const mongoose = require('mongoose');
const supertest = require('supertest');

const app = require('../app');
const { baseUrl } = require('../config');
const Movie = require('../models/movie');
const Person = require('../models/person');
const { cleanUpDatabase } = require('./utils');

// Clean up leftover data in the database before each test in this block.
beforeEach(cleanUpDatabase);

describe('POST /api/people', function () {
  it('should create a person', async function () {
    // Make a POST request on /api/people.
    const res = await supertest(app).post('/api/people').send({
      name: 'John Doe',
      gender: 'male'
    });

    // Check that the status and headers of the response are correct.
    expect(res.status, 'res.status').to.equal(201);
    expect(res.get('Content-Type'), 'res.headers.Content-Type').to.have.string('application/json');

    // Check that the response body is the created person.
    const body = res.body;
    expect(body, 'res.body').to.be.an('object');
    expect(body.createdAt, 'res.body.createdAt').to.be.a('string');
    expect(body.gender, 'res.body.gender').to.equal('male');
    expect(body.id, 'res.body.id').to.be.a('string');
    expect(body.name, 'res.body.name').to.equal('John Doe');
    expect(body, 'res.body').to.have.all.keys('createdAt', 'gender', 'id', 'name');

    // Check that the Location header points to the correct resource.
    expect(res.get('Location'), 'res.headers.Location').to.equal(
      `${baseUrl}/api/people/${body.id}`
    );
  });
});

describe('GET /api/people', function () {
  beforeEach(async function () {
    // Create 2 people in the database before each test in this block.
    const [johnSmith, janeSmith] = await Promise.all([
      Person.create({ name: 'John Smith', gender: 'male' }),
      Person.create({ name: 'Jane Smith', gender: 'female' })
    ]);

    // Also create 3 movies directed by the 2 people.
    await Promise.all([
      Movie.create({ title: 'An Amazing Story', rating: 10, directorId: janeSmith.id }),
      Movie.create({ title: 'A Bad Story', rating: 2, directorId: janeSmith.id }),
      Movie.create({ title: 'A So-So Story', rating: 4, directorId: johnSmith.id })
    ]);
  });

  it('should retrieve a list of people', async function () {
    // Make a GET request on /api/people.
    const res = await supertest(app).get('/api/people');

    // Check that the status and headers of the response are correct.
    expect(res.status, 'res.status').to.equal(200);
    expect(res.get('Content-Type'), 'res.headers.Content-Type').to.have.string('application/json');

    // Check that the response body is an array.
    const body = res.body;
    expect(body, 'res.body').to.be.an('array');

    // Check that the first person is the correct one.
    expect(body[0].birthDate, 'res.body[0].birthDate').to.equal(null);
    expect(body[0].createdAt, 'res.body[0].createdAt').to.be.a('string');
    expect(body[0].directedMovies, 'res.body[0].directedMovies').to.equal(2);
    expect(body[0].gender, 'res.body[0].gender').to.equal('female');
    expect(body[0].id, 'res.body[0].id').to.be.a('string');
    expect(body[0].name, 'res.body[0].name').to.equal('Jane Smith');
    expect(body[0], 'res.body[0]').to.have.all.keys(
      'birthDate',
      'createdAt',
      'directedMovies',
      'gender',
      'id',
      'name'
    );

    // Check that the second person is the correct one.
    expect(body[1].birthDate, 'res.body[1].birthDate').to.equal(null);
    expect(body[1].createdAt, 'res.body[1].createdAt').to.be.a('string');
    expect(body[1].directedMovies, 'res.body[1].directedMovies').to.equal(1);
    expect(body[1].gender, 'res.body[1].gender').to.equal('male');
    expect(body[1].id, 'res.body[1].id').to.be.a('string');
    expect(body[1].name, 'res.body[1].name').to.equal('John Smith');
    expect(body[1], 'res.body[1]').to.have.all.keys(
      'birthDate',
      'createdAt',
      'directedMovies',
      'gender',
      'id',
      'name'
    );

    // Check that the list is the correct length.
    expect(body).to.have.lengthOf(2);
  });
});

// Disconnect from the database once the tests are done.
after(mongoose.disconnect);
