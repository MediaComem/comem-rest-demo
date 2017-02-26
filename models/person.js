const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const Schema = mongoose.Schema;

/**
 * A person with a name, gender and optional birth date.
 */
const personSchema = new Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 30,
    unique: true,
    validate: {
      validator: validatePersonNameUniqueness,
      message: 'Person {VALUE} already exists'
    }
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

function validatePersonNameUniqueness(value, callback) {
  this.constructor.findOne().where('name').equals(value).exec(function(err, existingPerson) {
    callback(!err && !existingPerson);
  });
}

function transformJsonPerson(doc, json, options) {

  // Remove MongoDB _id (there's a default virtual "id" field)
  delete json._id;

  // Remove MongoDB __v
  delete json.__v;

  return json;
}

module.exports = mongoose.model('Person', personSchema);
