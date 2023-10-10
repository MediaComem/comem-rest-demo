import express from 'express';

import * as config from '../config.js';
import pkg from '../package.json' assert { type: 'json' };

const router = express.Router();

router.get('/', (req, res) =>
  res.send({
    title: 'Demonstration REST API',
    version: pkg.version,
    docs: `${config.baseUrl}/docs}`
  })
);

export default router;
