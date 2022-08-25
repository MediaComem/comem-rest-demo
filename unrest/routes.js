const express = require('express');

const people = [
  { id: 2, firstName: 'Lorna', lastName: 'Cole', age: 35 },
  { id: 4, firstName: 'John', lastName: 'Doe', age: 20 },
  { id: 23, firstName: 'Peter', lastName: 'Gibbons', age: 30 },
  { id: 11, firstName: 'Abigail', lastName: 'McDeere', age: 28 },
  { id: 42, firstName: 'Mitch', lastName: 'McDeere', age: 29 },
  { id: 82, firstName: 'Daryl', lastName: 'Richardson', age: 12 },
  { id: 7, firstName: 'Martin', lastName: 'Riggs', age: 35 },
  { id: 12, firstName: 'John', lastName: 'Smith', age: 40 },
  { id: 88, firstName: 'Michael', lastName: 'Walsch', age: 11 }
];

const router = express.Router();

router.get('/people', (req, res) => res.send(people));
router.get('/people/byAge/:age', (req, res) =>
  res.send(people.filter(person => person.age === parseInt(req.params.age, 10)))
);
router.get('/people/byFirstName/:firstName', (req, res) =>
  res.send(people.filter(person => person.firstName === req.params.firstName))
);
router.get('/people/byLastName/:lastName', (req, res) =>
  res.send(people.filter(person => person.lastName === req.params.lastName))
);

router.post('/people/create', (req, res) => {
  res.send({
    ...req.body,
    id: Math.round(Math.random() * 100000)
  });
});

router.get('/person/:id', (req, res) => {
  const person = people.find(p => p.id === parseInt(req.params.id, 10));
  if (!person) {
    return res.status(404).send(`No person found with ID ${req.params.id}`);
  }

  const newFirstName = req.query.updateFirstName;
  if (newFirstName) {
    person.firstName = newFirstName;
  }

  res.send(person);
});

router.post('/things', (req, res) => {
  if (typeof req.body !== 'object' || req.body === null || Array.isArray(req.body)) {
    return res.status(500).send('The request body must be a JSON object');
  } else if (!req.body.name) {
    return res.status(500).send('The "name" property is required');
  } else if (typeof req.body.name !== 'string') {
    return res.status(500).send('"name" must be a string');
  }

  res.status(201).send({
    id: Math.round(Math.random() * 100000),
    name: req.body.name
  });
});

module.exports = router;
