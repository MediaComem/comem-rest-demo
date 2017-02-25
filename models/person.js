const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;

/**
 * A person.
 */
const personSchema = new Schema({
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
  birthDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

personSchema.set('toJSON', { transform: transformJsonPerson, virtuals: true });

function transformJsonPerson(doc, json, options) {

  delete json._id;
  delete json.__v;

  return json;
}

module.exports = mongoose.model('Person', personSchema);
