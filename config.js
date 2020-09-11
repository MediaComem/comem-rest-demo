const env = process.env.NODE_ENV || 'development';

let defaultDatabaseUrl = 'mongodb://localhost/comem-webdev-express-rest-demo';
if (env === 'test') {
  defaultDatabaseUrl = `${defaultDatabaseUrl}-test`;
}

exports.port = process.env.PORT || '3000';
exports.databaseUrl = process.env.DATABASE_URL || process.env.MONGODB_URI || defaultDatabaseUrl;
exports.baseUrl = process.env.BASE_URL || `http://localhost:${exports.port}`;
