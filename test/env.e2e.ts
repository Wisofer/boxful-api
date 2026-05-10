process.env.IGNORE_ENV_FOR_E2E = '1';
delete process.env.MONGODB_URI;
process.env.NODE_ENV ??= 'test';
process.env.PORT ??= '3000';
process.env.JWT_SECRET ??= 'e2e-placeholder-secret-32chars!';
process.env.JWT_EXPIRES_IN ??= '1h';
