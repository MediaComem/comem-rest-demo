# COMEM+ Web Development Express REST Demo

A demonstration RESTful API implemented with [Express][express].



## Requirements

* [Node.js][node] 12.x
* [MongoDB][mongo] 3.x



## Usage

```bash
git clone git@github.com:MediaComem/comem-webdev-express-rest-demo.git
cd comem-webdev-express-rest-demo
npm ci
DEBUG=demo:* npm start
```

Visit [http://localhost:3000](http://localhost:3000).

To automatically reload the code and re-generate the API documentation on changes, use `npm run dev` instead of `npm start`.



## Configuration

The app will attempt to connect to the MongoDB database at `mongodb://localhost/comem-webdev-express-rest-demo` by default.

Use the `$DATABASE_URL` or the `$MONGODB_URI` environment variables to specify a different connection URL.



## Resources

This API allows you to work with **Movies** and **People**:

* A **Movie** MUST have one **director** (who is a Person)

Read the [full documentation][docs] to know more.



[docs]: https://mediacomem.github.io/comem-webdev-express-rest-demo/
[express]: https://expressjs.com
[mongo]: https://www.mongodb.com
[node]: https://nodejs.org/
