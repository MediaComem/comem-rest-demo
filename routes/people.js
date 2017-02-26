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
 * @apiDescription Registers a new person.
 *
 * @apiParam (Request body) {String{3..30}} name The name of the person
 * @apiParam (Request body) {String="male,female"} gender The gender of the person
 * @apiParam (Request body) {String} [birthDate] The birth date of the person ([ISO-8601](https://en.wikipedia.org/wiki/ISO_8601) format)
 *
 * @apiExample Example
 *     POST /api/people HTTP/1.1
 *     Content-Type: application/json
 *
 *     {
 *       "name": "John Doe",
 *       "gender": "male",
 *       "birthDate": "2001-02-03T08:30:00.000Z"
 *     }
 *
 * @apiSuccess (Response body) {String} id A unique identifier for the person (generated)
 * @apiSuccess (Response body) {String} name The name of the person
 * @apiSuccess (Response body) {String} gender The gender of the person
 * @apiSuccess (Response body) {String} birthDate The birth date of the person (if any)
 * @apiSuccess (Response body) {String} createdAt The creation date of the person
 *
 * @apiSuccessExample 201 Created
 *     HTTP/1.1 201 Created
 *     Content-Type: application/json
 *     Location: https://evening-meadow-25867.herokuapp.com/api/people/58b2926f5e1def0123e97bc0
 *
 *     {
 *       "id": "58b2926f5e1def0123e97bc0",
 *       "name": "John Doe",
 *       "gender": "male",
 *       "birthDate": "2001-02-03T08:30:00.000Z",
 *       "createdAt": "2017-01-01T14:31:87.000Z"
 *     }
 *
 * @apiError {Object} PersonInvalid Some of the person's properties are invalid
 *
 * @apiErrorExample {json} PersonInvalid
 *     HTTP/1.1 422 Unprocessable Entity
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
      return next(err);
    }

    res.status(201).set('Location', `${config.baseUrl}/api/people/${savedPerson._id}`).send(savedPerson);
  });
});

/**
 * @api {get} /api/people List people
 * @apiName RetrievePeople
 * @apiGroup Person
 * @apiVersion 1.0.0
 * @apiDescription Retrieves a paginated list of people.
 *
 * @apiExample Example
 *     GET /api/people?page=1&pageSize=50 HTTP/1.1
 *
 * @apiParam (URL query parameters) {Number{1..}} [page] The page to retrieve (defaults to 1)
 * @apiParam (URL query parameters) {Number{1..100}} [pageSize] The number of people to retrieve in one page (defaults to 100)
 *
 * @apiSuccess (Response body) {String} id The unique identifier of the person
 * @apiSuccess (Response body) {String} name The name of the person
 * @apiSuccess (Response body) {String} gender The gender of the person
 * @apiSuccess (Response body) {String} birthDate The birth date of the person (if any)
 * @apiSuccess (Response body) {String} createdAt The creation date of the person
 *
 * @apiSuccessExample 200 OK
 *     HTTP/1.1 200 OK
 *     Content-Type: application/json
 *
 *     [
 *       {
 *         "id": "58b2926f5e1def0123e97bc0",
 *         "name": "John Doe",
 *         "gender": "male",
 *         "birthDate": "2001-02-03T08:30:00.000Z",
 *         "createdAt": "2017-01-01T14:31:87.000Z"
 *       },
 *       {
 *         "id": "58b2926f5e1def0123e97bc1",
 *         "name": "John Smith",
 *         "gender": "male",
 *         "birthDate": "2001-02-04T07:00:00.000Z",
 *         "createdAt": "2017-01-11T09:12:12.000Z"
 *       }
 *     ]
 */
router.get('/', function(req, res, next) {

  const countQuery = queryPeople(req);
  countQuery.count(function(err, total) {
    if (err) {
      return next(err);
    }

    let query = queryPeople(req);

    query = utils.paginate('/api/people', query, total, req, res);

    query.sort('name').exec(function(err, people) {
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

/**
 * @api {get} /api/people/:id Retrieve a person
 * @apiName RetrievePerson
 * @apiGroup Person
 * @apiVersion 1.0.0
 * @apiDescription Retrieves one person.
 *
 * @apiExample Example
 *     GET /api/people/58b2926f5e1def0123e97bc0 HTTP/1.1
 *
 * @apiParam (URL path parameters) {String} id The unique identifier of the person to retrieve
 *
 * @apiSuccess (Response body) {String} id The unique identifier of the person
 * @apiSuccess (Response body) {String} name The name of the person
 * @apiSuccess (Response body) {String} gender The gender of the person
 * @apiSuccess (Response body) {String} birthDate The birth date of the person (if any)
 * @apiSuccess (Response body) {String} createdAt The creation date of the person
 *
 * @apiSuccessExample 200 OK
 *     HTTP/1.1 200 OK
 *     Content-Type: application/json
 *
 *     {
 *       "id": "58b2926f5e1def0123e97bc0",
 *       "name": "John Doe",
 *       "gender": "male",
 *       "birthDate": "2001-02-03T08:30:00.000Z",
 *       "createdAt": "2017-01-01T14:31:87.000Z"
 *     }
 */
router.get('/:id', loadPersonFromParams, function(req, res, next) {
  res.send(req.person);
});


/**
 * @api {patch} /api/people/:id Partially update a person
 * @apiName PartiallyUpdatePerson
 * @apiGroup Person
 * @apiVersion 1.0.0
 * @apiDescription Partially updates a person (only the properties found in the request body will be updated).
 *
 * @apiParam (URL path parameters) {String} id The unique identifier of the person to retrieve
 * @apiParam (Request body) {String{3..30}} name The name of the person
 * @apiParam (Request body) {String="male,female"} gender The gender of the person
 * @apiParam (Request body) {String} [birthDate] The birth date of the person ([ISO-8601](https://en.wikipedia.org/wiki/ISO_8601) format)
 *
 * @apiExample Example
 *     PATCH /api/people/58b2926f5e1def0123e97bc0 HTTP/1.1
 *     Content-Type: application/json
 *
 *     {
 *       "name": "Johnny Doe",
 *       "birthDate": "1999-01-01T08:30:00.000Z"
 *     }
 *
 * @apiSuccess (Response body) {String} id The unique identifier of the person
 * @apiSuccess (Response body) {String} name The name of the person
 * @apiSuccess (Response body) {String} gender The gender of the person
 * @apiSuccess (Response body) {String} birthDate The birth date of the person (if any)
 * @apiSuccess (Response body) {String} createdAt The creation date of the person
 *
 * @apiSuccessExample 200 OK
 *     HTTP/1.1 200 OK
 *     Content-Type: application/json
 *
 *     {
 *       "id": "58b2926f5e1def0123e97bc0",
 *       "name": "Johnny Doe",
 *       "gender": "male",
 *       "birthDate": "1999-01-01T08:30:00.000Z",
 *       "createdAt": "2017-01-01T14:31:87.000Z"
 *     }
 *
 * @apiError {Object} PersonInvalid Some of the person's properties are invalid
 *
 * @apiErrorExample {json} PersonInvalid
 *     HTTP/1.1 422 Unprocessable Entity
 *     Content-Type: application/json
 *
 *     {
 *       "message": "Person validation failed",
 *       "errors": {
 *         "gender": {
 *           "kind": "enum",
 *           "message": "`foo` is not a valid enum value for path `gender`.",
 *           "name": "ValidatorError",
 *           "path": "gender",
 *           "properties": {
 *             "enumValues": [
 *               "male",
 *               "female"
 *             ],
 *             "message": "`{VALUE}` is not a valid enum value for path `{PATH}`.",
 *             "path": "gender",
 *             "type": "enum",
 *             "value": "foo"
 *           },
 *           "value": "foo"
 *         }
 *       }
 *     }
 */
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

/**
 * @api {put} /api/people/:id Update a person
 * @apiName UpdatePerson
 * @apiGroup Person
 * @apiVersion 1.0.0
 * @apiDescription Replaces the entire person (the request body must represent a full, valid person).
 *
 * @apiParam (URL path parameters) {String} id The unique identifier of the person to retrieve
 * @apiParam (Request body) {String{3..30}} name The name of the person
 * @apiParam (Request body) {String="male,female"} gender The gender of the person
 * @apiParam (Request body) {String} [birthDate] The birth date of the person ([ISO-8601](https://en.wikipedia.org/wiki/ISO_8601) format)
 *
 * @apiExample Example
 *     PUT /api/people/58b2926f5e1def0123e97bc0 HTTP/1.1
 *     Content-Type: application/json
 *
 *     {
 *       "name": "Jenny Doe",
 *       "gender": "female",
 *       "birthDate": "1999-01-01T08:30:00.000Z"
 *     }
 *
 * @apiSuccess (Response body) {String} id The unique identifier of the person
 * @apiSuccess (Response body) {String} name The name of the person
 * @apiSuccess (Response body) {String} gender The gender of the person
 * @apiSuccess (Response body) {String} birthDate The birth date of the person (if any)
 * @apiSuccess (Response body) {String} createdAt The creation date of the person
 *
 * @apiSuccessExample 200 OK
 *     HTTP/1.1 200 OK
 *     Content-Type: application/json
 *
 *     {
 *       "id": "58b2926f5e1def0123e97bc0",
 *       "name": "Jenny Doe",
 *       "gender": "female",
 *       "birthDate": "1999-01-01T08:30:00.000Z",
 *       "createdAt": "2017-01-01T14:31:87.000Z"
 *     }
 *
 * @apiError {Object} PersonNotFound No person was found corresponding to the ID in the URL path
 * @apiError {Object} PersonInvalid Some of the person's properties are invalid
 *
 * @apiErrorExample {json} PersonNotFound
 *     HTTP/1.1 404 Not Found
 *     Content-Type: text/plain
 *
 *     No person found with ID 58b2926f5e1def0123e97bc0
 *
 * @apiErrorExample {json} PersonInvalid
 *     HTTP/1.1 422 Unprocessable Entity
 *     Content-Type: application/json
 *
 *     {
 *       "message": "Person validation failed",
 *       "errors": {
 *         "gender": {
 *           "kind": "enum",
 *           "message": "`foo` is not a valid enum value for path `gender`.",
 *           "name": "ValidatorError",
 *           "path": "gender",
 *           "properties": {
 *             "enumValues": [
 *               "male",
 *               "female"
 *             ],
 *             "message": "`{VALUE}` is not a valid enum value for path `{PATH}`.",
 *             "path": "gender",
 *             "type": "enum",
 *             "value": "foo"
 *           },
 *           "value": "foo"
 *         }
 *       }
 *     }
 */
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

/**
 * @api {delete} /api/people/:id Delete a person
 * @apiName DeletePerson
 * @apiGroup Person
 * @apiVersion 1.0.0
 * @apiDescription Permanently deletes a person.
 *
 * @apiExample Example
 *     DELETE /api/people/58b2926f5e1def0123e97bc0 HTTP/1.1
 *
 * @apiParam (URL path parameters) {String} id The unique identifier of the person to retrieve
 *
 * @apiSuccessExample 204 No Content
 *     HTTP/1.1 204 No Content
 */
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

  let query = Person.find();

  if (typeof(req.query.gender) == 'string') {
    query = query.where('gender').equals(req.query.gender);
  }

  return query;
}

function loadPersonFromParams(req, res, next) {

  const personId = req.params.id;
  if (!ObjectId.isValid(personId)) {
    return personNotFound(res, personId);
  }

  Person.findById(req.params.id, function(err, person) {
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

  // Do not perform the aggregation query if there are no people to retrieve movies for
  if (people.length <= 0) {
    return callback(undefined, []);
  }

  // Aggregate movies count by director (i.e. person ID)
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
