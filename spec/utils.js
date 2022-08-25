import Movie from '../models/movie.js';
import Person from '../models/person.js';

export async function cleanUpDatabase() {
  await Promise.all([Movie.deleteMany().exec(), Person.deleteMany().exec()]);
}
