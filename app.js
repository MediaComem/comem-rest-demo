import bodyParser from 'body-parser';
import express from 'express';
import logger from 'morgan';
import mongoose from 'mongoose';
import path from 'path';

import * as config from './config.js';
import moviesApi from './routes/movies.js';
import peopleApi from './routes/people.js';
import rootApi from './routes/api.js';
import adminRoutes from './routes/admin.js';
import docRoutes from './routes/docs.js';
import unrestRoutes from './unrest/routes.js';

// Connect to the database (can be overriden from environment)
mongoose.connect(config.databaseUrl);

if (config.debug) {
  mongoose.set('debug', true);
}

const app = express();

// View engine setup
app.set('views', path.join(config.projectRoot, 'views'));
app.set('view engine', 'pug');

// General middlewares
if (config.env !== 'test') {
  app.use(logger('dev'));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// REST API routes
app.use('/api/movies', moviesApi);
app.use('/api/people', peopleApi);
app.use('/api', rootApi);

// REST API documentation
app.use('/docs', docRoutes);

// Other routes
app.use('/admin', adminRoutes);
app.use('/unrest', unrestRoutes);

// Redirect to the documentation by default.
app.get('/', (req, res) => res.redirect('/docs'));

// Catch 404 and forward to error handler.
app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// API error handler (responds with JSON)
app.use('/api', function (err, req, res, next) {
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
app.use(function (err, req, res, next) {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
