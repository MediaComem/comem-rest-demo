import debugFactory from 'debug';
import express from 'express';
import mongoose from 'mongoose';

import * as config from '../config.js';
import Movie from '../models/movie.js';
import Person from '../models/person.js';
import * as utils from './utils.js';

const debug = debugFactory('demo:people');
const ObjectId = mongoose.Types.ObjectId;

const router = express.Router();

router.post('/', utils.requireJson, async (req, res) => {
  const savedPerson = await new Person(req.body).save();
  debug(`Created person "${savedPerson.name}"`);

  res
    .status(201)
    .set('Location', `${config.baseUrl}/api/people/${savedPerson._id}`)
    .send(savedPerson);
});

router.get('/', async (req, res) => {
  const countQuery = queryPeople(req);
  const total = await countQuery.countDocuments();

  // Parse pagination parameters from URL query parameters.
  const { page, pageSize } = utils.getPaginationParameters(req);

  const pipeline = [];

  if (typeof req.query.gender === 'string') {
    pipeline.push({ $match: { gender: req.query.gender } });
  }

  pipeline.push(
    {
      $lookup: {
        from: 'movies',
        localField: '_id',
        foreignField: 'directorId',
        as: 'directedMovies'
      }
    },
    {
      $unwind: {
        path: '$directedMovies',
        // Preserve people who have not directed any movie
        // ("directedMovies" will be null).
        preserveNullAndEmptyArrays: true
      }
    },
    // Replace "directedMovies" by 1 when set, or by 0 when null.
    { $addFields: { directedMovies: { $cond: { if: '$directedMovies', then: 1, else: 0 } } } },
    {
      $group: {
        _id: '$_id',
        birthDate: { $first: '$birthDate' },
        createdAt: { $first: '$createdAt' },
        // Sum the 1s and 0s in the "directedMovies" property
        // to obtain the final count.
        directedMovies: { $sum: '$directedMovies' },
        gender: { $first: '$gender' },
        name: { $first: '$name' }
      }
    },
    { $sort: { name: 1 } },
    { $skip: (page - 1) * pageSize },
    { $limit: pageSize }
  );

  const people = await Person.aggregate(pipeline).exec();
  utils.addLinkHeader('/api/people', page, pageSize, total, res);

  res.send(
    people.map(person => {
      // Transform the aggregated object into a Mongoose model.
      const serialized = new Person(person).toJSON();

      // Add the aggregated property.
      serialized.directedMovies = person.directedMovies;

      return serialized;
    })
  );
});

router.get('/:id', loadPersonFromParamsMiddleware, async (req, res) => {
  const directedMovies = await countMoviesDirectedBy(req.person);
  res.send({ ...req.person.toJSON(), directedMovies });
});

router.patch('/:id', utils.requireJson, loadPersonFromParamsMiddleware, async (req, res) => {
  // Update properties present in the request body
  if (req.body.name !== undefined) {
    req.person.name = req.body.name;
  }
  if (req.body.gender !== undefined) {
    req.person.gender = req.body.gender;
  }
  if (req.body.birthDate !== undefined) {
    req.person.birthDate = req.body.birthDate;
  }

  const savedPerson = await req.person.save();
  debug(`Updated person "${savedPerson.name}"`);

  res.send(savedPerson);
});

router.put('/:id', utils.requireJson, loadPersonFromParamsMiddleware, async (req, res) => {
  // Update all properties (regardless of whether they are in the request body or not)
  req.person.name = req.body.name;
  req.person.gender = req.body.gender;
  req.person.birthDate = req.body.birthDate;

  const savedPerson = await req.person.save();
  debug(`Updated person "${savedPerson.name}"`);

  res.send(savedPerson);
});

router.delete('/:id', loadPersonFromParamsMiddleware, async (req, res) => {
  // Check if a movie exists before deleting
  const movie = await Movie.findOne({ directorId: req.person._id }).exec();
  if (movie) {
    // Do not delete if any movie is directed by this person
    return res
      .status(409)
      .type('text')
      .send(`Cannot delete person ${req.person.name} because movies are directed by them`);
  }

  await req.person.deleteOne();
  debug(`Deleted person "${req.person.name}"`);

  res.sendStatus(204);
});

/**
 * Returns a Mongoose query that will retrieve people filtered with the URL query parameters.
 */
function queryPeople(req) {
  let query = Person.find();

  if (typeof req.query.gender == 'string') {
    query = query.where('gender').equals(req.query.gender);
  }

  return query;
}

/**
 * Middleware that loads the person corresponding to the ID in the URL path.
 * Responds with 404 Not Found if the ID is not valid or the person doesn't exist.
 */
async function loadPersonFromParamsMiddleware(req, res, next) {
  const personId = req.params.id;
  if (!ObjectId.isValid(personId)) {
    return personNotFound(res, personId);
  }

  const person = await Person.findById(req.params.id);
  if (!person) {
    return personNotFound(res, personId);
  }

  req.person = person;
  next();
}

/**
 * Responds with 404 Not Found and a message indicating that the person with the specified ID was not found.
 */
function personNotFound(res, personId) {
  return res.status(404).type('text').send(`No person found with ID ${personId}`);
}

/**
 * Given a person, asynchronously returns the number of movies directed by the person.
 */
function countMoviesDirectedBy(person) {
  return Movie.countDocuments().where('directorId', person._id).exec();
}

export default router;
