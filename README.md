# COMEM+ Web Development Express REST Demo

A demonstration RESTful API implemented with [Express][express].

[![GitHub](https://img.shields.io/github/license/MediaComem/comem-webdev-express-rest-demo)](https://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.org/MediaComem/comem-webdev-express-rest-demo.svg?branch=master)](https://travis-ci.org/MediaComem/comem-webdev-express-rest-demo)
[![Coverage Status](https://coveralls.io/repos/github/MediaComem/comem-webdev-express-rest-demo/badge.svg?branch=master)](https://coveralls.io/github/MediaComem/comem-webdev-express-rest-demo?branch=master)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Requirements](#requirements)
- [Usage](#usage)
- [Configuration](#configuration)
- [API Resources](#api-resources)
- [Automated tests](#automated-tests)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->



## Requirements

* [Node.js][node] 14.x
* [MongoDB][mongo] 4.x



## Usage

```bash
# Clone the application.
git clone git@github.com:MediaComem/comem-webdev-express-rest-demo.git

# Install dependencies.
cd comem-webdev-express-rest-demo
npm ci

# Start the application in development mode.
DEBUG=demo:* npm start
```

Visit [http://localhost:3000](http://localhost:3000).

To automatically reload the code and re-generate the API documentation on
changes, use `npm run dev` instead of `npm start`.



## Configuration

The application will attempt to connect to the MongoDB database at
`mongodb://localhost/comem-webdev-express-rest-demo` by default.

Use the `$DATABASE_URL` or the `$MONGODB_URI` environment variables to specify a
different connection URL.



## API Resources

This API allows you to work with **Movies** and **People**. A Movie MUST have
one **director** (who is a Person).

Read the [full documentation][docs] to know more.



## Automated tests

This application has an automated test suite which you can run with `npm test`.

It will attempt to connect to the MongoDB database at
`mongodb://localhost/comem-webdev-express-rest-demo-test`.

The tests are implemented with [Mocha][mocha], [Chai][chai] and
[SuperTest][supertest].



[chai]: https://www.chaijs.com
[docs]: https://mediacomem.github.io/comem-webdev-express-rest-demo/
[express]: https://expressjs.com
[mocha]: https://mochajs.org
[mongo]: https://www.mongodb.com
[node]: https://nodejs.org
[supertest]: https://github.com/visionmedia/supertest#readme
