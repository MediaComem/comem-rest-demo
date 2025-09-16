import express from 'express';

import Movie from '../models/movie.js';
import Person from '../models/person.js';
import * as utils from './utils.js';

const router = express.Router();

router.post('/reset', utils.authenticate, async function (req, res) {
  await reset();
  res.sendStatus(204);
});

async function reset() {
  await Movie.deleteMany({});
  await Person.deleteMany({});
}

export default router;
