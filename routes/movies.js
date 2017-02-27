const config = require('../config');
const debug = require('debug')('demo:movies');
const express = require('express');
const mongoose = require('mongoose');
const Movie = require('../models/movie');
const ObjectId = mongoose.Types.ObjectId;
const utils = require('./utils');

const router = express.Router();

router.post('/', utils.requireJson, function(req, res, next) {
  new Movie(req.body).save(function(err, savedMovie) {
    if (err) {
      if (err.name == 'ValidationError') {
        err.status = 422;
      }
      return next(err);
    }

    debug(`Created movie "${savedMovie.title}"`);
    res.status(201).set('Location', `${config.baseUrl}/api/movies/${savedMovie._id}`).send(savedMovie);
  });
});

router.get('/', function(req, res, next) {

  const countQuery = queryMovies(req);
  countQuery.count(function(err, total) {
    if (err) {
      return next(err);
    }

    let query = queryMovies(req);

    query = utils.paginate('/api/movies', query, total, req, res);

    if (utils.responseShouldInclude(req, 'director')) {
      query = query.populate('director');
    }

    query.sort({ title: 1 }).exec(function(err, movies) {
      if (err) {
        return next(err);
      }

      res.send(movies);
    });
  });
});

router.get('/:id', loadMovieFromParams, function(req, res, next) {
  res.send(req.movie);
});

router.patch('/:id', utils.requireJson, loadMovieFromParams, function(req, res, next) {

  if (req.body.title !== undefined) {
    req.movie.title = req.body.title;
  }
  if (req.body.rating !== undefined) {
    req.movie.rating = req.body.rating;
  }

  req.movie.save(function(err, savedMovie) {
    if (err) {
      if (err.name == 'ValidationError') {
        err.status = 422;
      }
      return next(err);
    }

    debug(`Updated movie "${savedMovie.title}"`);
    res.send(savedMovie);
  });
});

router.put('/:id', utils.requireJson, loadMovieFromParams, function(req, res, next) {

  req.movie.title = req.body.title;
  req.movie.rating = req.body.rating;

  req.movie.save(function(err, savedMovie) {
    if (err) {
      if (err.name == 'ValidationError') {
        err.status = 422;
      }
      return next(err);
    }

    debug(`Updated movie "${savedMovie.title}"`);
    res.send(savedMovie);
  });
});

router.delete('/:id', loadMovieFromParams, function(req, res, next) {
  req.movie.remove(function(err) {
    if (err) {
      return next(err);
    }

    debug(`Deleted movie "${req.movie.title}"`);
    res.sendStatus(204);
  });
});

function queryMovies(req) {

  let query = Movie.find();

  if (Array.isArray(req.query.director)) {
    const directors = req.query.director.filter(ObjectId.isValid);
    query = query.where('director').in(directors);
  } else if (ObjectId.isValid(req.query.director)) {
    query = query.where('director').equals(req.query.director);
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

function loadMovieFromParams(req, res, next) {

  const movieId = req.params.id;
  if (!ObjectId.isValid(movieId)) {
    return movieNotFound(res, movieId);
  }

  Movie.findById(movieId, function(err, movie) {
    if (err) {
      return next(err);
    } else if (!movie) {
      return movieNotFound(res, movieId);
    }

    req.movie = movie;
    next();
  });
}

function movieNotFound(res, movieId) {
  return res.status(404).type('text').send(`No movie found with ID ${movieId}`);
}

module.exports = router;
