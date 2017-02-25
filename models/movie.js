const mongoose = require('mongoose');
const mongooseInteger = require('mongoose-integer');
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
    unique: true
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
      validator: validateDirector
    }
  }
});

movieSchema.plugin(mongooseInteger);

movieSchema.virtual('directorUrl').get(getDirectorUrl).set(setDirectorUrl);

movieSchema.set('toJSON', { transform: transformJsonMovie, virtuals: true });

function validateDirector(value, callback) {
  if (!value && !this._directorUrl) {
    this.invalidate('directorUrl', 'Path `directorUrl` is required', value, 'required');
    return callback();
  } else if (!ObjectId.isValid(value)) {
    this.invalidate('directorUrl', 'Path `directorUrl` is not a valid Person URL', this._directorUrl, 'resourceNotFound');
    return callback();
  }

  mongoose.model('Person').findOne({ _id: ObjectId(value) }).exec(function(err, person) {
    if (err || !person) {
      this.invalidate('directorUrl', 'Path `directorUrl` does not reference a Person that exists', this._directorUrl, 'resourceNotFound');
    }

    callback();
  });
}

function getDirectorUrl() {
  return `/api/people/${this.director._id || this.director}`;
}

function setDirectorUrl(value) {

  let match;
  if (typeof(value) == 'string' && (match = value.match(/^\/api\/people\/([^\/]+)$/)) && ObjectId.isValid(match[1])) {
    this.director = match[1];
  } else {
    this.director = null;
  }

  this._directorUrl = value;
}

function transformJsonMovie(doc, json, options) {

  delete json._id;
  delete json.__v;

  if (json.director instanceof ObjectId) {
    delete json.director;
  } else {
    json.director = doc.director.toJSON();
  }

  return json;
}

module.exports = mongoose.model('Movie', movieSchema);
