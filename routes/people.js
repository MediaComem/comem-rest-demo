const config = require('../config');
const express = require('express');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Movie = require('../models/movie');
const Person = require('../models/person');
const utils = require('./utils');

const router = express.Router();

/**
 * @api {post} /api/people Create a person
 * @apiName CreatePerson
 * @apiGroup Person
 * @apiVersion 1.0.0
 *
 * @apiParam {String{3..30}} name The name of the person
 * @apiParam {String="male,female"} gender The gender of the person
 * @apiParam {String} birthDate The birth date of the person (ISO-8601 format)
 *
 * @apiSuccess {String} name The name of the person
 * @apiSuccess {String} gender The gender of the person
 * @apiSuccess {String} birthDate The birth date of the person
 * @apiSuccess {String} createdAt The creation date of the person
 *
 * @apiError (Error 422) {Object} PersonInvalid Some of the person's properties are invalid
 * @apiErrorExample {json} PersonInvalid
 *     HTTP/1.1 422 Not Found
 *     Content-Type: application/json
 *
 *     {
 *       "message": "Person validation failed",
 *       "errors": {
 *         "name": {
 *           "kind": "required",
 *           "message": "Path `name` is required.",
 *           "name": "ValidatorError",
 *           "path": "name",
 *           "properties": {
 *             "message": "Path `{PATH}` is required.",
 *             "path": "name",
 *             "type": "required"
 *           }
 *         }
 *       }
 *     }
 */
router.post('/', function(req, res, next) {
  new Person(req.body).save(function(err, savedPerson) {
    if (err) {
      if (err.name == 'ValidationError') {
        err.status = 422;
      }
      return next(err);
    }

    res.status(201).set('Location', `${config.baseUrl}/api/people/${savedPerson._id}`).send(savedPerson);
  });
});

router.get('/', function(req, res, next) {

  const countQuery = queryPeople(req);
  countQuery.count(function(err, total) {
    if (err) {
      return next(err);
    }

    let query = queryPeople(req);

    query = utils.paginate('/api/people', query, total, req, res);

    query.sort({ name: 1 }).exec(function(err, people) {
      if (err) {
        return next(err);
      }

      countMoviesDirectedBy(people, function(err, results) {
        if (err) {
          return next(err);
        }

        people = people.map(person => person.toJSON());

        results.forEach(function(result) {
          const person = people.find(person => person.id == result._id.toString());
          person.directedMoviesCount = result.moviesCount;
        });

        res.send(people);
      });
    });
  });
});

router.get('/:id', loadPersonFromParams, function(req, res, next) {
  res.send(req.person);
});

router.patch('/:id', loadPersonFromParams, function(req, res, next) {
  if (req.body.name !== undefined) {
    req.person.name = req.body.name;
  }
  if (req.body.gender !== undefined) {
    req.person.gender = req.body.gender;
  }
  if (req.body.birthDate !== undefined) {
    req.person.birthDate = req.body.birthDate;
  }
  req.person.save(function(err, savedPerson) {
    if (err) {
      if (err.name == 'ValidationError') {
        err.status = 422;
      }
      return next(err);
    }

    res.send(savedPerson);
  });
});

router.put('/:id', loadPersonFromParams, function(req, res, next) {
  req.person.name = req.body.name;
  req.person.gender = req.body.gender;
  req.person.birthDate = req.body.birthDate;
  req.person.save(function(err, savedPerson) {
    if (err) {
      if (err.name == 'ValidationError') {
        err.status = 422;
      }
      return next(err);
    }

    res.send(savedPerson);
  });
});

router.delete('/:id', loadPersonFromParams, function(req, res, next) {
  // TODO: 409 conflict if linked with movies
  req.person.remove(function(err) {
    if (err) {
      return next(err);
    }

    res.sendStatus(204);
  });
});

function queryPeople(req) {
  return Person.find();
}

function loadPersonFromParams(req, res, next) {

  const personId = req.params.id;
  if (!ObjectId.isValid(personId)) {
    return personNotFound(res, personId);
  }

  Person.findById(req.params.id).exec(function(err, person) {
    if (err) {
      return next(err);
    } else if (!person) {
      return personNotFound(res, personId);
    }

    req.person = person;
    next();
  });
}

function personNotFound(res, personId) {
  return res.status(404).type('text').send(`No person found with ID ${personId}`);
}

function countMoviesDirectedBy(people, callback) {
  Movie.aggregate([
    {
      $match: {
        director: {
          $in: people.map(person => person._id)
        }
      }
    },
    {
      $group: {
        _id: '$director',
        moviesCount: {
          $sum: 1
        }
      }
    }
  ], callback);
}

module.exports = router;
