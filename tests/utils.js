import assert from 'node:assert/strict';

import mongoose from 'mongoose';
import parseLinkHeader from 'parse-link-header';

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

/**
 * Returns the attributes of a Mongoose document as stored in the database, with
 * IDs as strings, so that they can be compared with `assert.deepEqual`.
 */
export function toAttributes(document) {
  return document.toObject({ flattenObjectIds: true });
}

/**
 * Parses the Link header of a response, and returns the URL of each link by
 * relation, e.g. `{ next: 'http://…', last: 'http://…' }`.
 */
export function getLinks(res) {
  const links = parseLinkHeader(res.get('Link')) ?? {};
  return Object.fromEntries(Object.entries(links).map(([rel, link]) => [rel, link.url]));
}

/**
 * Checks that a response body is a Mongoose validation error for the specified
 * model, and that exactly the expected properties are invalid. The expected
 * errors are the kind of error for each invalid property, e.g.
 * `{ name: 'required' }`.
 */
export function assertValidationError(body, modelName, expectedErrors) {
  const { message, errors, ...rest } = body;
  assert.deepEqual(rest, {});
  assert.ok(message.startsWith(`${modelName} validation failed: `), message);

  const errorKinds = Object.fromEntries(
    Object.entries(errors).map(([path, error]) => [path, error.kind])
  );
  assert.deepEqual(errorKinds, expectedErrors);
}
