const config = require('../config');
const formatLinkHeader = require('format-link-header');

exports.requireJson = function(req, res, next) {
  if (req.is('application/json')) {
    return next();
  }

  const error = new Error('This resource only has an application/json representation');
  error.status = 415; // 415 Unsupported Media Type
  next(error);
};

exports.paginate = function(resourceHref, query, total, req, res) {

  let page = parseInt(req.query.page, 10);
  if (isNaN(page) || page < 1) {
    page = 1;
  }

  let pageSize = parseInt(req.query.pageSize, 10);
  if (isNaN(pageSize) || pageSize < 0 || pageSize > 100) {
    pageSize = 100;
  }

  query = query.skip((page - 1) * pageSize).limit(pageSize);

  const maxPage = Math.ceil(total / pageSize);

  const links = {};
  const url = config.baseUrl + resourceHref;

  if (page > 1) {
    links.first = { rel: 'first', url: `${url}?page=1&pageSize=${pageSize}` };
    links.prev = { rel: 'prev', url: `${url}?page=${page - 1}&pageSize=${pageSize}` };
  }

  if (page < maxPage) {
    links.next = { rel: 'next', url: `${url}?page=${page + 1}&pageSize=${pageSize}` };
    links.last = { rel: 'last', url: `${url}?page=${maxPage}&pageSize=${pageSize}` };
  }

  if (Object.keys(links).length >= 1) {
    res.set('Link', formatLinkHeader(links));
  }

  return query;
};

exports.responseShouldInclude = function(req, property) {

  let propertiesToInclude = req.query.include;
  if (!propertiesToInclude) {
    return false;
  }

  if (!Array.isArray(propertiesToInclude)) {
    propertiesToInclude = [ propertiesToInclude ];
  }

  return propertiesToInclude.indexOf(property) >= 0;
};
