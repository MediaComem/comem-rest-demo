const Actor = require('../../models/actor');
const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

router.post('/', function(req, res, next) {
  new Actor(req.body).save(function(err, savedActor) {
    if (err) {
      return next(err);
    }

    res.status(201).send(savedActor);
  });
});

module.exports = router;
