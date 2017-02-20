const bodyParser = require('body-parser');
const express = require('express');
const favicon = require('serve-favicon');
const logger = require('morgan');
const mongoose = require('mongoose');
const path = require('path');

const charactersApi = require('./routes/characters');
const moviesApi = require('./routes/movies');

const app = express();

if (process.env.DEBUG) {
  mongoose.set('debug', true);
}

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// General middleware
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'docs')));

// REST API routes
app.use('/api/characters', charactersApi);
app.use('/api/movies', moviesApi);

// Catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// API error handler (responds with JSON)
app.use('/api', function(err, req, res, next) {

  res.status(err.status || 500);

  if (err.status == 422) {
    return res.send({
      message: err.message,
      errors: err.errors
    });
  }

  res.send({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {}
  });
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
