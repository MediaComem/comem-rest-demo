const express = require('express');
const Movie = require('../models/movie');
const Person = require('../models/person');
const utils = require('./utils');

const router = express.Router();

router.post('/reset', utils.authenticate, function (req, res, next) {
  removeAll()
    .then(() => res.sendStatus(204))
    .catch(next);
});

function removeAll() {
  return Movie.remove({}).then(() => Person.remove({}));
}

module.exports = router;
