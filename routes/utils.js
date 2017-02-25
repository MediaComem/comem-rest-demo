exports.paginate = function(query, req, res) {

  let start = parseInt(req.query.start, 10);
  if (isNaN(start) || start < 0) {
    start = 0;
  }

  query = query.skip(start);
  res.set('Pagination-Start', start);

  let number = parseInt(req.query.number, 10);
  if (isNaN(number) || number < 0 || number > 100) {
    number = 100;
  }

  query = query.limit(number);
  res.set('Pagination-Number', number);

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
