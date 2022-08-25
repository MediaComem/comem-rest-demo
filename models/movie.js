const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;

/**
 * A movie directed by a person.
 */
const movieSchema = new Schema({
  title: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 50,
    unique: true,
    validate: {
      // Manually validate uniqueness to send a "pretty" validation error
      // rather than a MongoDB duplicate key error
      validator: validateMovieTitleUniqueness,
      message: 'Movie {VALUE} already exists'
    }
  },
  rating: {
    type: Number,
    min: 0,
    max: 10
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  directorId: {
    type: Schema.Types.ObjectId,
    ref: 'Person',
    default: null,
    required: true,
    validate: {
      // Validate that the directorId is a valid ObjectId
      // and references an existing person
      validator: validateDirector,
      message: props => props.reason.message
    }
  }
});

// Customize the behavior of movie.toJSON() (called when using res.send)
movieSchema.set('toJSON', {
  transform: transformJsonMovie, // Modify the serialized JSON with a custom function
  virtuals: true // Include virtual properties when serializing documents to JSON
});

/**
 * Given a person ID, ensures that it references an existing person.
 *
 * If it's not the case or the ID is missing or not a valid object ID,
 * the "directorId" property is invalidated.
 */
function validateDirector(value) {
  if (!ObjectId.isValid(value)) {
    throw new Error('person not found');
  }

  return mongoose
    .model('Person')
    .findOne({ _id: ObjectId(value) })
    .exec()
    .then(person => {
      if (!person) {
        throw new Error('person not found');
      }

      return true;
    });
}

/**
 * Given a title, calls the callback function with true if no movie exists with that title
 * (or the only movie that exists is the same as the movie being validated).
 */
function validateMovieTitleUniqueness(value) {
  const MovieModel = mongoose.model('Movie', movieSchema);
  return MovieModel.findOne()
    .where('title')
    .equals(value)
    .exec()
    .then(existingMovie => {
      return !existingMovie || existingMovie._id.equals(this._id);
    });
}

/**
 * Removes extra MongoDB properties from serialized movies,
 * and includes the director's data if it has been populated.
 */
function transformJsonMovie(doc, json, options) {
  // Remove MongoDB _id & __v (there's a default virtual "id" property)
  delete json._id;
  delete json.__v;

  if (!(json.directorId instanceof ObjectId)) {
    // If the director was populated, include it in the serialization
    json.director = doc.directorId.toJSON();
    json.directorId = doc.directorId._id;
  }

  return json;
}

module.exports = mongoose.model('Movie', movieSchema);
