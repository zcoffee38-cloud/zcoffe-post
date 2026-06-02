export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'fallback-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
