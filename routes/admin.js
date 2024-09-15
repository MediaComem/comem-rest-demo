import express from 'express';

import Movie from '../models/movie.js';
import Person from '../models/person.js';
import * as utils from './utils.js';

const router = express.Router();

router.post('/reset', utils.authenticate, function (req, res, next) {
  reset()
    .then(() => res.sendStatus(204))
    .catch(next);
});

function reset() {
  return Movie.deleteMany({}).then(() => Person.deleteMany({}));
}

export default router;
