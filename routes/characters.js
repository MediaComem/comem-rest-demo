const Character = require('../models/character');
const express = require('express');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const router = express.Router();

/**
 * @api {post} /api/characters Create a character in a movie
 * @apiName CreateCharacter
 * @apiGroup Character
 * @apiVersion 1.0.0
 *
 * @apiParam {String{3..30}} name The name of the character
 * @apiParam {String="male,female"} gender The gender of the character
 * @apiParam {Number{0..}} age The age of the character in years
 * @apiParam {String} movie The ID of the movie in which the character appears
 *
 * @apiSuccess {String} name The name of the character
 * @apiSuccess {String} gender The gender of the character
 * @apiSuccess {Number} age The age of the character in years
 * @apiSuccess {String} createdAt The creation date of the character
 *
 * @apiError (Error 422) {Object} CharacterInvalid Some of the character's properties are invalid
 * @apiErrorExample {json} CharacterInvalid
 *     HTTP/1.1 422 Not Found
 *     Content-Type: application/json
 *
 *     {
 *       "message": "Character validation failed",
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
  new Character(req.body).save(function(err, savedCharacter) {
    if (err) {
      if (err.name == 'ValidationError') {
        err.status = 422;
      }
      return next(err);
    }

    res.status(201).send(savedCharacter);
  });
});

router.get('/', function(req, res, next) {
  Character.find().sort({ name: 1 }).exec(function(err, characters) {
    if (err) {
      return next(err);
    }

    res.send(characters);
  });
});

router.patch('/:id', loadCharacterFromParams, function(req, res, next) {
  if (req.body.name !== undefined) {
    req.character.name = req.body.name;
  }
  if (req.body.gender !== undefined) {
    req.character.gender = req.body.gender;
  }
  if (req.body.birthDate !== undefined) {
    req.character.birthDate = req.body.birthDate;
  }
  req.character.save(function(err, savedCharacter) {
    if (err) {
      return next(err);
    }

    res.send(savedCharacter);
  });
});

router.put('/:id', loadCharacterFromParams, function(req, res, next) {
  req.character.name = req.body.name;
  req.character.gender = req.body.gender;
  req.character.birthDate = req.body.birthDate;
  req.character.save(function(err, savedCharacter) {
    if (err) {
      return next(err);
    }

    res.send(savedCharacter);
  });
});

router.delete('/:id', loadCharacterFromParams, function(req, res, next) {
  req.character.remove(function(err) {
    if (err) {
      return next(err);
    }

    res.sendStatus(204);
  });
});

function loadCharacterFromParams(req, res, next) {

  const characterId = req.params.id;
  if (!ObjectId.isValid(characterId)) {
    return res.status(404).send('No character found with ID ' + characterId);
  }

  Character.findOne({ _id: ObjectId(characterId) }).exec(function(err, character) {
    if (err) {
      return next(err);
    } else if (!character) {
      return res.status(404).send('No character found with ID ' + characterId);
    }

    req.character = character;
    next();
  });
}

module.exports = router;
