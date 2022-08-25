const Movie = require('../models/movie');
const Person = require('../models/person');

exports.cleanUpDatabase = async function () {
  await Promise.all([Movie.deleteMany().exec(), Person.deleteMany().exec()]);
};
