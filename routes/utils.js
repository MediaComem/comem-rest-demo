import formatLinkHeader from 'format-link-header';

import { authToken, baseUrl } from '../config.js';

/**
 * Responds with 415 Unsupported Media Type if the request does not have the Content-Type application/json.
 */
export function requireJson(req, res, next) {
  if (req.is('application/json')) {
    return next();
  }

  const error = new Error('This resource only has an application/json representation');
  error.status = 415; // 415 Unsupported Media Type
  next(error);
}

/**
 * Parses the pagination parameters (i.e. page & page size) from the request.
 *
 * @param {ExpressRequest} req - The Express request object
 * @returns An object with "page" and "pageSize" properties
 */
export function getPaginationParameters(req) {
  // Parse the "page" URL query parameter indicating the index of the first element that should be in the response
  let page = parseInt(req.query.page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  // Parse the "pageSize" URL query parameter indicating how many elements should be in the response
  let pageSize = parseInt(req.query.pageSize, 10);
  if (isNaN(pageSize) || pageSize < 0 || pageSize > 100) {
    pageSize = 100;
  }

  return { page, pageSize };
}

/**
 * Adds a Link header to the response (if applicable).
 *
 * @param {String} resourceHref - The hyperlink reference of the collection (e.g. "/api/people")
 * @param {Number} page - The page being listed
 * @param {Number} pageSize - The page size
 * @param {Number} total - The total number of elements
 * @param {ExpressResponse} res - The Exprss response object
 */
export function addLinkHeader(resourceHref, page, pageSize, total, res) {
  const links = {};
  const url = baseUrl + resourceHref;
  const maxPage = Math.ceil(total / pageSize);

  // Add first & prev links if current page is not the first one
  if (page > 1) {
    links.first = { rel: 'first', url: `${url}?page=1&pageSize=${pageSize}` };
    links.prev = { rel: 'prev', url: `${url}?page=${page - 1}&pageSize=${pageSize}` };
  }

  // Add next & last links if current page is not the last one
  if (page < maxPage) {
    links.next = { rel: 'next', url: `${url}?page=${page + 1}&pageSize=${pageSize}` };
    links.last = { rel: 'last', url: `${url}?page=${maxPage}&pageSize=${pageSize}` };
  }

  // If there are any links (i.e. if there is more than one page),
  // add the Link header to the response
  if (Object.keys(links).length >= 1) {
    res.set('Link', formatLinkHeader(links));
  }
}

/**
 * Returns true if the specified property is among the "include" URL query parameters sent by the client
 */
export function responseShouldInclude(req, property) {
  // Get the "include" URL query parameter
  let propertiesToInclude = req.query.include;
  if (!propertiesToInclude) {
    return false;
  }

  // If it's not an array, wrap it into an array
  if (!Array.isArray(propertiesToInclude)) {
    propertiesToInclude = [propertiesToInclude];
  }

  // Check whether the property is inside the array
  return propertiesToInclude.indexOf(property) >= 0;
}

/**
 * Middleware that responds with 401 Unauthorized if the client did not sent a bearer authentication token
 * equal to the $AUTH_TOKEN environment variable.
 */
export function authenticate(req, res, next) {
  if (!authToken) {
    return res.sendStatus(401);
  }

  const authorizationHeader = req.get('Authorization');
  if (!authorizationHeader) {
    return res.sendStatus(401);
  }

  const match = authorizationHeader.match(/^Bearer +(.+)$/);
  if (!match) {
    return res.sendStatus(401);
  }

  if (match[1] !== authToken) {
    return res.sendStatus(401);
  }

  next();
}

/**
 * @apiDefine Pagination
 * @apiParam (URL query parameters) {Number{1..}} [page] The page to retrieve (defaults to 1)
 * @apiParam (URL query parameters) {Number{1..100}} [pageSize] The number of elements to retrieve in one page (defaults to 100)
 * @apiSuccess (Response headers) {String} Link Links to the first, previous, next and last pages of the collection (if applicable)
 */
