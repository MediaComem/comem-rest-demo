import debugFactory from 'debug';
import express from 'express';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import swaggerUi from 'swagger-ui-express';

import * as config from '../config.js';

const router = express.Router();

const debug = debugFactory('demo:docs');
const docsTemplate = path.join(config.projectRoot, 'views', 'docs.html');

router.get('', (req, res) => {
  res.sendFile(docsTemplate);
});

// Parse the OpenAPI document.
const openApiDocument = yaml.load(fs.readFileSync('./openapi.yml'));

// Update the first server's URL to this application's.
openApiDocument.servers[0].url = `${config.baseUrl}/api`;

// Serve the Open API document on /docs/openapi.json.
router.get('/openapi.json', (req, res) => res.json(openApiDocument));
debug('Serving OpenAPI document at /docs/openapi.json');

const swaggerUiExpressOptions = {
  customSiteTitle: 'Demonstration REST API (OpenAPI)',
  swaggerOptions: { url: '/docs/openapi.json' }
};

// Serve the Open API documentation on /docs/openapi.
router.use(
  '/',
  swaggerUi.serveFiles(null, swaggerUiExpressOptions),
  swaggerUi.setup(null, swaggerUiExpressOptions)
);
debug('Serving OpenAPI Swagger UI documentation at /docs/openapi');

export default router;
