const config = require('../config');
const debug = require('debug')('demo:people');
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
 * @apiUse PersonInRequestBody
 * @apiUse PersonInResponseBody
 * @apiUse PersonValidationError
 * @apiSuccess (Response body) {String} id A unique identifier for the person generated by the server
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
 * @apiSuccessExample 201 Created
 *     HTTP/1.1 201 Created
 *     Content-Type: application/json
 *     Location: https://comem-rest-demo.herokuapp.com/api/people/58b2926f5e1def0123e97bc0
 *
 *     {
 *       "id": "58b2926f5e1def0123e97bc0",
 *       "name": "John Doe",
 *       "gender": "male",
 *       "birthDate": "2001-02-03T08:30:00.000Z",
 *       "createdAt": "2017-01-01T14:31:87.000Z",
 *       "directedMovies": 0
 *     }
 */
router.post('/', utils.requireJson, function (req, res, next) {
  new Person(req.body).save(function (err, savedPerson) {
    if (err) {
      return next(err);
    }

    debug(`Created person "${savedPerson.name}"`);

    res
      .status(201)
      .set('Location', `${config.baseUrl}/api/people/${savedPerson._id}`)
      .send(savedPerson);
  });
});

/**
 * @api {get} /api/people List people
 * @apiName RetrievePeople
 * @apiGroup Person
 * @apiVersion 1.0.0
 * @apiDescription Retrieves a paginated list of people sorted by name (in alphabetical order).
 *
 * @apiUse PersonInResponseBody
 * @apiUse Pagination
 *
 * @apiParam (URL query parameters) {String} [gender] Select only people of the specified gender
 *
 * @apiExample Example
 *     GET /api/people?gender=male&page=2&pageSize=50 HTTP/1.1
 *
 * @apiSuccessExample 200 OK
 *     HTTP/1.1 200 OK
 *     Content-Type: application/json
 *     Link: &lt;https://comem-rest-demo.herokuapp.com/api/people?page=1&pageSize=50&gt;; rel="first prev"
 *
 *     [
 *       {
 *         "id": "58b2926f5e1def0123e97bc0",
 *         "name": "John Doe",
 *         "gender": "male",
 *         "birthDate": "2001-02-03T08:30:00.000Z",
 *         "createdAt": "2017-01-01T14:31:87.000Z",
 *         "directedMovies": 2
 *       },
 *       {
 *         "id": "58b2926f5e1def0123e97bc1",
 *         "name": "John Smith",
 *         "gender": "male",
 *         "birthDate": "2001-02-04T07:00:00.000Z",
 *         "createdAt": "2017-01-11T09:12:12.000Z",
 *         "directedMovies": 3
 *       }
 *     ]
 */
router.get('/', function (req, res, next) {
  const countQuery = queryPeople(req);
  countQuery.countDocuments(function (err, total) {
    if (err) {
      return next(err);
    }

    // Parse pagination parameters from URL query parameters.
    const { page, pageSize } = utils.getPaginationParameters(req);

    Person.aggregate(
      [
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
        {
          $addFields: {
            directedMovies: {
              $cond: {
                if: '$directedMovies',
                then: 1,
                else: 0
              }
            }
          }
        },
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
        {
          $sort: {
            name: 1
          }
        },
        {
          $skip: (page - 1) * pageSize
        },
        {
          $limit: pageSize
        }
      ],
      (err, people) => {
        if (err) {
          return next(err);
        }

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
      }
    );
  });
});

/**
 * @api {get} /api/people/:id Retrieve a person
 * @apiName RetrievePerson
 * @apiGroup Person
 * @apiVersion 1.0.0
 * @apiDescription Retrieves one person.
 *
 * @apiUse PersonIdInUrlPath
 * @apiUse PersonInResponseBody
 * @apiUse PersonNotFoundError
 *
 * @apiExample Example
 *     GET /api/people/58b2926f5e1def0123e97bc0 HTTP/1.1
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
 *       "createdAt": "2017-01-01T14:31:87.000Z",
 *       "directedMovies": 3
 *     }
 */
router.get('/:id', loadPersonFromParamsMiddleware, function (req, res, next) {
  countMoviesDirectedBy(req.person, function (err, directedMovies) {
    if (err) {
      return next(err);
    }

    res.send({
      ...req.person.toJSON(),
      directedMovies
    });
  });
});

/**
 * @api {patch} /api/people/:id Partially update a person
 * @apiName PartiallyUpdatePerson
 * @apiGroup Person
 * @apiVersion 1.0.0
 * @apiDescription Partially updates a person's data (only the properties found in the request body will be updated).
 * All properties are optional.
 *
 * @apiUse PersonIdInUrlPath
 * @apiUse PersonInRequestBody
 * @apiUse PersonInResponseBody
 * @apiUse PersonNotFoundError
 * @apiUse PersonValidationError
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
 * @apiSuccessExample 200 OK
 *     HTTP/1.1 200 OK
 *     Content-Type: application/json
 *
 *     {
 *       "id": "58b2926f5e1def0123e97bc0",
 *       "name": "Johnny Doe",
 *       "gender": "male",
 *       "birthDate": "1999-01-01T08:30:00.000Z",
 *       "createdAt": "2017-01-01T14:31:87.000Z",
 *       "directedMovies": 3
 *     }
 */
router.patch('/:id', utils.requireJson, loadPersonFromParamsMiddleware, function (req, res, next) {
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

  req.person.save(function (err, savedPerson) {
    if (err) {
      return next(err);
    }

    debug(`Updated person "${savedPerson.name}"`);
    res.send(savedPerson);
  });
});

/**
 * @api {put} /api/people/:id Update a person
 * @apiName UpdatePerson
 * @apiGroup Person
 * @apiVersion 1.0.0
 * @apiDescription Replaces all the person's data (the request body must represent a full, valid person).
 *
 * @apiUse PersonIdInUrlPath
 * @apiUse PersonInRequestBody
 * @apiUse PersonInResponseBody
 * @apiUse PersonNotFoundError
 * @apiUse PersonValidationError
 *
 * @apiExample Example
 *     PUT /api/people/58b2926f5e1def0123e97bc0 HTTP/1.1
 *     Content-Type: application/json
 *
 *     {
 *       "name": "Jenny Doe",
 *       "gender": "female",
 *       "birthDate": "1999-01-01T08:30:00.000Z",
 *       "directedMovies": 2
 *     }
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
 *       "createdAt": "2017-01-01T14:31:87.000Z",
 *       "directedMovies": 2
 *     }
 */
router.put('/:id', utils.requireJson, loadPersonFromParamsMiddleware, function (req, res, next) {
  // Update all properties (regardless of whether they are in the request body or not)
  req.person.name = req.body.name;
  req.person.gender = req.body.gender;
  req.person.birthDate = req.body.birthDate;

  req.person.save(function (err, savedPerson) {
    if (err) {
      return next(err);
    }

    debug(`Updated person "${savedPerson.name}"`);
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
 * @apiUse PersonIdInUrlPath
 * @apiUse PersonNotFoundError
 *
 * @apiExample Example
 *     DELETE /api/people/58b2926f5e1def0123e97bc0 HTTP/1.1
 *
 * @apiSuccessExample 204 No Content
 *     HTTP/1.1 204 No Content
 */
router.delete('/:id', loadPersonFromParamsMiddleware, function (req, res, next) {
  // Check if a movie exists before deleting
  Movie.findOne({ directorId: req.person._id }).exec(function (err, movie) {
    if (err) {
      return next(err);
    } else if (movie) {
      // Do not delete if any movie is directed by this person
      return res
        .status(409)
        .type('text')
        .send(`Cannot delete person ${req.person.name} because movies are directed by them`);
    }

    req.person.remove(function (err) {
      if (err) {
        return next(err);
      }

      debug(`Deleted person "${req.person.name}"`);
      res.sendStatus(204);
    });
  });
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
function loadPersonFromParamsMiddleware(req, res, next) {
  const personId = req.params.id;
  if (!ObjectId.isValid(personId)) {
    return personNotFound(res, personId);
  }

  Person.findById(req.params.id, function (err, person) {
    if (err) {
      return next(err);
    } else if (!person) {
      return personNotFound(res, personId);
    }

    req.person = person;
    next();
  });
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
function countMoviesDirectedBy(person, callback) {
  Movie.countDocuments().where('directorId', person._id).exec(callback);
}

/**
 * @apiDefine PersonIdInUrlPath
 * @apiParam (URL path parameters) {String} id The unique identifier of the person to retrieve
 */

/**
 * @apiDefine PersonInRequestBody
 * @apiParam (Request body) {String{3..30}} name The name of the person (must be unique)
 * @apiParam (Request body) {String="male","female","other"} gender The gender of the person
 * @apiParam (Request body) {String} [birthDate] The birth date of the person ([ISO-8601](https://en.wikipedia.org/wiki/ISO_8601) format)
 */

/**
 * @apiDefine PersonInResponseBody
 * @apiSuccess (Response body) {String} id The unique identifier of the person
 * @apiSuccess (Response body) {String} name The name of the person
 * @apiSuccess (Response body) {String} gender The gender of the person
 * @apiSuccess (Response body) {String} birthDate The birth date of the person (if any)
 * @apiSuccess (Response body) {String} createdAt The date at which the person was registered
 * @apiSuccess (Response body) {String} directedMovies The number of movies the person directed
 */

/**
 * @apiDefine PersonNotFoundError
 *
 * @apiError {Object} 404/NotFound No person was found corresponding to the ID in the URL path
 *
 * @apiErrorExample {json} 404 Not Found
 *     HTTP/1.1 404 Not Found
 *     Content-Type: text/plain
 *
 *     No person found with ID 58b2926f5e1def0123e97bc0
 */

/**
 * @apiDefine PersonValidationError
 *
 * @apiError {Object} 422/UnprocessableEntity Some of the person's properties are invalid
 *
 * @apiErrorExample {json} 422 Unprocessable Entity
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
 *               "female",
 *               "other"
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

module.exports = router;
