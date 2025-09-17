# COMEM+ REST Demo

A demonstration RESTful API implemented with [Express][express].

[![build](https://github.com/MediaComem/comem-rest-demo/actions/workflows/build.yml/badge.svg)](https://github.com/MediaComem/comem-rest-demo/actions/workflows/build.yml)
[![publish](https://github.com/MediaComem/comem-rest-demo/actions/workflows/publish.yml/badge.svg)](https://github.com/MediaComem/comem-rest-demo/actions/workflows/publish.yml)
[![license](https://img.shields.io/github/license/MediaComem/comem-rest-demo)](https://opensource.org/licenses/MIT)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Requirements](#requirements)
- [Usage](#usage)
- [Configuration](#configuration)
- [API Resources](#api-resources)
- [Automated tests](#automated-tests)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Requirements

- [Node.js][node] 24.x
- [MongoDB][mongo] 7.x or 8.x

## Usage

```bash
# Clone the application.
git clone git@github.com:MediaComem/comem-rest-demo.git

# Install dependencies.
cd comem-rest-demo
npm ci

# Start the application in development mode.
DEBUG=demo:* npm start
```

Visit [http://localhost:3000](http://localhost:3000).

To automatically reload the code and re-generate the API documentation on
changes, use `npm run dev` instead of `npm start`.

## Configuration

The application will attempt to connect to the MongoDB database at
`mongodb://localhost/comem-rest-demo` by default.

Use the `$DATABASE_URL` or the `$MONGODB_URI` environment variables to specify a
different connection URL.

## API Resources

This API allows you to work with **Movies** and **People**. A Movie MUST have
one **director** (who is a Person).

Read the [full documentation][docs] to know more.

## Automated tests

This application has an automated test suite which you can run with `npm test`.

It will attempt to connect to the MongoDB database at
`mongodb://localhost/comem-rest-demo-test`.

The tests are implemented with [Mocha][mocha], [Chai][chai] and
[SuperTest][supertest].

[chai]: https://www.chaijs.com
[docs]: https://demo.archioweb.ch
[express]: https://expressjs.com
[mocha]: https://mochajs.org
[mongo]: https://www.mongodb.com
[node]: https://nodejs.org
[supertest]: https://github.com/visionmedia/supertest#readme
