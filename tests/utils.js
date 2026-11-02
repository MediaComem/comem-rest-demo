import mongoose from 'mongoose';

import Movie from '../models/movie.js';
import Person from '../models/person.js';

export async function cleanUpDatabase() {
  // Refuse to wipe a database that is not meant for tests (wait for the
  // connection first, since the application does not await it).
  await mongoose.connection.asPromise();
  if (!mongoose.connection.name.endsWith('-test')) {
    throw new Error(`Refusing to clean up database ${mongoose.connection.name}`);
  }

  await Promise.all([Movie.deleteMany().exec(), Person.deleteMany().exec()]);
}
