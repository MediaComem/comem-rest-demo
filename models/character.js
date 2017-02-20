const mongoose = require('mongoose');
const mongooseInteger = require('mongoose-integer');
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;

/**
 * A named character in a movie.
 */
const characterSchema = new Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 30,
    unique: true
  },
  gender: {
    type: String,
    required: true,
    enum: [ 'male', 'female' ]
  },
  age: {
    type: Number,
    integer: true,
    min: 0
  },
  movie: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Movie',
    validate: {
      validator: function(value, callback) {
        if (!ObjectId.isValid(value)) {
          return false;
        }

        mongoose.model('Movie').findOne({ _id: ObjectId(value) }).exec(function(err, movie) {
          if (err) {
            return callback(false);
          }

          callback(movie);
        });
      },
      message: '{VALUE} is not a valid movie ID'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

characterSchema.plugin(mongooseInteger);

module.exports = mongoose.model('Character', characterSchema);
