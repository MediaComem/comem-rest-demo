exports.port = process.env.PORT || '3000';
exports.databaseUrl = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost/comem-webdev-express-rest-demo';
exports.baseUrl = process.env.BASE_URL || `http://localhost:${exports.port}`;
