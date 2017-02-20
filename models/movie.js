const mongoose = require('mongoose');

/**
 * A movie with a rating and reviews.
 */
const movieSchema = new mongoose.Schema({
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
  reviews: [
    {
      author: {
        type: String,
        minlength: 3,
        maxlength: 30
      },
      comment: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 10000
      },
      postedAt: {
        type: Date,
        default: Date.now
      }
    }
  ]
});

module.exports = mongoose.model('Movie', movieSchema);
