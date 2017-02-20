const mongoose = require('mongoose');

const actorSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 3,
    maxlength: 50,
    unique: true
  },
  gender: {
    type: String,
    required: true,
    enum: [ 'male', 'female' ]
  },
  birthDate: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Actor', actorSchema);
