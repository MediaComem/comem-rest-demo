const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const yaml = require('js-yaml');
const logger = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

const config = require('./config');
const moviesApi = require('./routes/movies');
const peopleApi = require('./routes/people');
const adminRoutes = require('./routes/admin');
const unrestRoutes = require('./unrest/routes');

// Connect to the database (can be overriden from environment)
mongoose.Promise = Promise;
mongoose.connect(config.databaseUrl, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const app = express();

if (config.debug) {
  mongoose.set('debug', true);
}

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// General middlewares
if (config.env !== 'test') {
  app.use(logger('dev'));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Parse the OpenAPI document.
const openApiDocument = yaml.safeLoad(fs.readFileSync('./openapi.yml'));
// Update the first server's URL to this application's.
openApiDocument.servers[0].url = `${config.baseUrl}/api`;
// Server the Swagger UI documentation.
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(openApiDocument));

// Serve the apiDoc documentation on /.
app.use(express.static(path.join(__dirname, 'docs')));

// REST API routes
app.use('/api/movies', moviesApi);
app.use('/api/people', peopleApi);
app.use('/admin', adminRoutes);
app.use('/unrest', unrestRoutes);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// API error handler (responds with JSON)
app.use('/api', function(err, req, res, next) {

  // Log the error on stderr
  console.warn(err);

  // Respond with 422 Unprocessable Entity if it's a Mongoose validation error
  if (err.name == 'ValidationError' && !err.status) {
    err.status = 422;
  }

  // Set the response status code
  res.status(err.status || 500);

  // Send the error message in the response
  const response = {
    message: err.message
  };

  // If it's a validation error, also send the errors details from Mongoose
  if (err.status == 422) {
    response.errors = err.errors;
  }

  // Send the error response
  res.send(response);
});

// Generic error handler (responds with HTML)
app.use(function(err, req, res, next) {

  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
