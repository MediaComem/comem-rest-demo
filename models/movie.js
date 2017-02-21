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
    required: true,
    ref: 'Person',
    validate: {
      validator: validateDirector,
      message: '{VALUE} is not a valid person ID'
    }
  }
});

movieSchema.plugin(mongooseInteger);

function validateDirector(value, callback) {
  if (!ObjectId.isValid(value)) {
    return false;
  }

  mongoose.model('Person').findOne({ _id: ObjectId(value) }).exec(function(err, person) {
    if (err) {
      return callback(false);
    }

    callback(person);
  });
}

module.exports = mongoose.model('Movie', movieSchema);
