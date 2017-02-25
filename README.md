# COMEM+ Web Development Express REST Demo

A demonstration RESTful API implemented with [Express][express].



## Requirements

* [Node.js][node] 6.x



## Usage

```bash
git clone git@github.com:MediaComem/comem-webdev-express-rest-demo.git
cd comem-webdev-express-rest-demo
npm install
DEBUG=demo:* npm start
```

Visit [http://localhost:3000](http://localhost:3000).

To automatically reload the code and re-generate the API documentation on changes, use `npm run dev` instead of `npm start`.



## Resources

This API allows you to work with **Movies** and **People**:

* A **Movie** MUST have one **director** (who is a Person)



[express]: https://expressjs.com
[node]: https://nodejs.org/
