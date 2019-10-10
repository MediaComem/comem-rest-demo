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
  director: {
    type: Schema.Types.ObjectId,
    ref: 'Person',
    default: null,
    validate: {
      // Validate that the director is a valid ObjectId
      // and references an existing person
      validator: validateDirector,
      //message: function(props) { return props.reason.message; }
    }
  }
});

/**
 * Add a virtual "directorHref" property:
 *
 * * "movie.directorHref" will return the result of calling getDirectorHref with the movie as this
 * * "movie.directorHref = value" will return the result of calling setDirectorHref with the movie as this and value as an argument
 */
movieSchema.virtual('directorHref').get(getDirectorHref).set(setDirectorHref);

// Customize the behavior of movie.toJSON() (called when using res.send)
movieSchema.set('toJSON', {
  transform: transformJsonMovie, // Modify the serialized JSON with a custom function
  virtuals: true // Include virtual properties when serializing documents to JSON
});

/**
 * Given a person ID, ensures that it references an existing person.
 *
 * If it's not the case or the ID is missing or not a valid object ID,
 * the "directorHref" property is invalidated instead of "director".
 * (That way, the client gets an error on "directorHref", which is the
 * property they sent, rather than "director", which they don't know.)
 */
function validateDirector(value) {
  return new Promise((resolve, reject) => {

    if (!value) {
      //reject(new Error('directorHref', 'Path `directorHref` is required', value, 'required'));
    } else if (!ObjectId.isValid(value)) {
      reject(new Error('directorHref', 'Path `directorHref` is not a valid Person reference', value, 'resourceNotFound'))
    }

    mongoose.model('Person').findOne({ _id: ObjectId(value) }).exec()
      .then(function (err, person) {
        if (err || !person) {
          reject(new Error('directorHref', 'Path `directorHref` does not reference a Person that exists', value, 'resourceNotFound'));
        }
      }).catch(e => { reject(e) });
  })
}

/**
 * Given a title, calls the callback function with true if no movie exists with that title
 * (or the only movie that exists is the same as the movie being validated).
 */
function validateMovieTitleUniqueness(value) {
  let MovieModel = mongoose.model('Movie', movieSchema);

  return MovieModel.findOne().where('title').equals(value).exec().then(function (existingMovie) {
    return (!existingMovie || existingMovie._id.equals(value._id))
  });
}

/**
 * Returns the hyperlink to the movie's director.
 * (If the director has been populated, the _id will be extracted from it.)
 */
function getDirectorHref() {
  return `/api/people/${this.director._id || this.director}`;
}

/**
 * Sets the movie's director from a person hyperlink.
 */
function setDirectorHref(value) {

  // Store the original hyperlink 
  this._directorHref = value;

  // Remove "/api/people/" from the beginning of the value
  const personId = value.replace(/^\/api\/people\//, '');

  if (ObjectId.isValid(personId)) {
    // Set the director if the value is a valid MongoDB ObjectId
    this.director = personId;
  } else {
    // Unset the director otherwise
    this.director = null;
  }
}

/**
 * Removes extra MongoDB properties from serialized movies,
 * and includes the director's data if it has been populated.
 */
function transformJsonMovie(doc, json, options) {

  // Remove MongoDB _id & __v (there's a default virtual "id" property)
  delete json._id;
  delete json.__v;

  if (json.director instanceof ObjectId) {
    // Remove the director property by default (there's a "directorHref" virtual property)
    delete json.director;
  } else {
    // If the director was populated, include it in the serialization
    json.director = doc.director.toJSON();
  }

  return json;
}

module.exports = mongoose.model('Movie', movieSchema);
