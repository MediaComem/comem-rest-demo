import debugFactory from 'debug';
import express from 'express';
import mongoose from 'mongoose';

import * as config from '../config.js';
import Movie from '../models/movie.js';
import * as utils from './utils.js';

const debug = debugFactory('demo:movies');
const ObjectId = mongoose.Types.ObjectId;

const router = express.Router();

router.post('/', utils.requireJson, async (req, res) => {
  let createdMovie = await new Movie(req.body).save();
  debug(`Created movie "${createdMovie.title}"`);

  if (utils.responseShouldInclude(req, 'director')) {
    createdMovie = await createdMovie.populate('directorId');
  }

  res
    .status(201)
    .set('Location', `${config.baseUrl}/api/movies/${createdMovie._id}`)
    .send(createdMovie);
});

router.get('/', async (req, res) => {
  // Count total movies matching the URL query parameters
  const countQuery = queryMovies(req);
  const total = await countQuery.countDocuments();

  // Prepare the initial database query from the URL query parameters
  let query = queryMovies(req);

  // Parse pagination parameters from URL query parameters
  const { page, pageSize } = utils.getPaginationParameters(req);

  // Apply the pagination to the database query
  query = query.skip((page - 1) * pageSize).limit(pageSize);

  // Add the Link header to the response
  utils.addLinkHeader('/api/movies', page, pageSize, total, res);

  // Populate the directorId if indicated in the "include" URL query parameter
  if (utils.responseShouldInclude(req, 'director')) {
    query = query.populate('directorId');
  }

  // Execute the query
  const movies = await query.exec();
  res.send(movies);
});

router.get('/:id', loadMovieFromParamsMiddleware, (req, res) => {
  res.send(req.movie);
});

router.patch('/:id', utils.requireJson, loadMovieFromParamsMiddleware, async (req, res) => {
  // Update only properties present in the request body
  if (req.body.title !== undefined) {
    req.movie.title = req.body.title;
  }

  if (req.body.rating !== undefined) {
    req.movie.rating = req.body.rating;
  }

  const savedMovie = await req.movie.save();
  debug(`Updated movie "${savedMovie.title}"`);

  res.send(savedMovie);
});

router.put('/:id', utils.requireJson, loadMovieFromParamsMiddleware, async (req, res) => {
  // Update all properties (regardless of whether the are present in the request body or not)
  req.movie.title = req.body.title;
  req.movie.rating = req.body.rating;

  const savedMovie = await req.movie.save();
  debug(`Updated movie "${savedMovie.title}"`);

  res.send(savedMovie);
});

router.delete('/:id', loadMovieFromParamsMiddleware, async (req, res) => {
  await req.movie.deleteOne();
  debug(`Deleted movie "${req.movie.title}"`);

  res.sendStatus(204);
});

/**
 * Returns a Mongoose query that will retrieve movies filtered with the URL query parameters.
 */
function queryMovies(req) {
  let query = Movie.find();

  if (Array.isArray(req.query.directorId)) {
    const directors = req.query.directorId.filter(ObjectId.isValid);
    query = query.where('directorId').in(directors);
  } else if (ObjectId.isValid(req.query.directorId)) {
    query = query.where('directorId').equals(req.query.directorId);
  }

  if (!isNaN(req.query.rating)) {
    query = query.where('rating').equals(req.query.rating);
  }

  if (!isNaN(req.query.ratedAtLeast)) {
    query = query.where('rating').gte(req.query.ratedAtLeast);
  }

  if (!isNaN(req.query.ratedAtMost)) {
    query = query.where('rating').lte(req.query.ratedAtMost);
  }

  return query;
}

/**
 * Middleware that loads the movie corresponding to the ID in the URL path.
 * Responds with 404 Not Found if the ID is not valid or the movie doesn't exist.
 */
async function loadMovieFromParamsMiddleware(req, res, next) {
  const movieId = req.params.id;
  if (!ObjectId.isValid(movieId)) {
    return movieNotFound(res, movieId);
  }

  let query = Movie.findById(movieId);
  // Populate the director if indicated in the "include" URL query parameter
  if (utils.responseShouldInclude(req, 'director')) {
    query = query.populate('directorId');
  }

  const movie = await query.exec();
  if (!movie) {
    return movieNotFound(res, movieId);
  }

  req.movie = movie;
  next();
}

/**
 * Responds with 404 Not Found and a message indicating that the movie with the specified ID was not found.
 */
function movieNotFound(res, movieId) {
  return res.status(404).type('text').send(`No movie found with ID ${movieId}`);
}

export default router;
