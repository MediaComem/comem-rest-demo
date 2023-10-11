import express from 'express';

import * as config from '../config.js';

const router = express.Router();

router.get('/', (req, res) =>
  res.send({
    title: 'Demonstration REST API',
    version: config.version,
    docs: `${config.baseUrl}/docs}`
  })
);

export default router;
