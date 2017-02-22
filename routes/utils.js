const _ = require('lodash');
const express = require('express');
const mongoose = require('mongoose');
const Movie = require('../models/movie');
const ObjectId = mongoose.Types.ObjectId;
const Person = require('../models/person');

const router = express.Router();

router.post('/reset', authenticate, function(req, res, next) {
  removeAll().then(() => res.sendStatus(204)).catch(next);
});

function authenticate(req, res, next) {
  if (!process.env.AUTH_TOKEN) {
    return res.sendStatus(401);
  }

  const authorizationHeader = req.get('Authorization');
  if (!authorizationHeader) {
    return res.sendStatus(401);
  }

  const match = authorizationHeader.match(/^Bearer +(.+)$/);
  if (!match) {
    return res.sendStatus(401);
  }

  if (match[1] != process.env.AUTH_TOKEN) {
    return res.sendStatus(401);
  }

  next();
}

function removeAll() {
  return Movie.remove({}).then(() => Person.remove({}));
}

module.exports = router;
