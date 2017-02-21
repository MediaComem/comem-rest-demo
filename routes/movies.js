const debug = require('debug')('demo:movies');
const Movie = require('../models/movie');
const express = require('express');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const router = express.Router();

router.post('/', function(req, res, next) {
  new Movie(req.body).save(function(err, savedMovie) {
    if (err) {
      if (err.name == 'ValidationError') {
        err.status = 422;
      }
      return next(err);
    }

    debug(`Created movie "${savedMovie.title}"`);
    res.status(201).set('Location', `/api/movies/${savedMovie._id}`).send(savedMovie);
  });
});

router.get('/', function(req, res, next) {
  Movie.find().sort({ title: 1 }).exec(function(err, movies) {
    if (err) {
      return next(err);
    }

    res.send(movies);
  });
});

router.get('/:id', loadMovieFromParams, function(req, res, next) {
  res.send(req.movie);
});

router.patch('/:id', loadMovieFromParams, function(req, res, next) {
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

router.put('/:id', loadMovieFromParams, function(req, res, next) {
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

function loadMovieFromParams(req, res, next) {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(404).send('No movie found with ID ' + req.params.id);
  }

  Movie.findOne({ _id: ObjectId(req.params.id) }).exec(function(err, movie) {
    if (err) {
      return next(err);
    } else if (!movie) {
      return res.status(404).send('No movie found with ID ' + req.params.id);
    }

    req.movie = movie;
    next();
  });
}

module.exports = router;
