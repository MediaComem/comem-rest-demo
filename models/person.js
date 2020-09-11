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
    validate:
      // Manually validate uniqueness to send a "pretty" validation error
      // rather than a MongoDB duplicate key error
      [{
        validator: validatePersonNameUniqueness,
        message:'Person {VALUE} already exists'
      }],

  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'other']
  },
  birthDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Customize the behavior of person.toJSON() (called when using res.send)
personSchema.set('toJSON', {
  transform: transformJsonPerson, // Modify the serialized JSON with a custom function
  virtuals: true // Include virtual properties when serializing documents to JSON
});

/**
 * Given a name, calls the callback function with true if no person exists with that name
 * (or the only person that exists is the same as the person being validated).
 */
function validatePersonNameUniqueness(value) {
  return this.constructor.findOne().where('name').equals(value).exec().then((existingPerson) => {
    return !existingPerson || existingPerson._id.equals(this._id);
  });
}

/**
 * Removes extra MongoDB properties from serialized people.
 */
function transformJsonPerson(doc, json, options) {

  // Remove MongoDB _id & __v (there's a default virtual "id" property)
  delete json._id;
  delete json.__v;

  return json;
}

module.exports = mongoose.model('Person', personSchema);
