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

movieSchema.virtual('directorHref').get(getDirectorHref).set(setDirectorHref);

movieSchema.set('toJSON', { transform: transformJsonMovie, virtuals: true });

function validateDirector(value, callback) {
  if (!value && !this._directorHref) {
    this.invalidate('directorHref', 'Path `directorHref` is required', value, 'required');
    return callback();
  } else if (!ObjectId.isValid(value)) {
    this.invalidate('directorHref', 'Path `directorHref` is not a valid Person reference', this._directorHref, 'resourceNotFound');
    return callback();
  }

  mongoose.model('Person').findOne({ _id: ObjectId(value) }).exec(function(err, person) {
    if (err || !person) {
      this.invalidate('directorHref', 'Path `directorHref` does not reference a Person that exists', this._directorHref, 'resourceNotFound');
    }

    callback();
  });
}

function getDirectorHref() {
  return `/api/people/${this.director._id || this.director}`;
}

function setDirectorHref(value) {

  this._directorHref = value;

  value = value.replace(/^\/api\/people\//, '');
  if (ObjectId.isValid(value)) {
    this.director = value;
  } else {
    this.director = null;
  }
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
