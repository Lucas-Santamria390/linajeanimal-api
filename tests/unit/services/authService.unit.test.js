const jwt = require('jsonwebtoken');

jest.mock('../../../config/env', () => ({ jwtSecret: 'test-secret-key' }));
const { generateToken } = require('../../../services/authService');

describe('authService — generateToken (unitaria)', () => {
  const SECRET = 'test-secret-key';

  it('debería generar un token JWT válido', () => {
    const token = generateToken('abc123', 'admin', 1);
    const decoded = jwt.verify(token, SECRET);
    expect(decoded).toHaveProperty('id', 'abc123');
    expect(decoded).toHaveProperty('rol', 'admin');
    expect(decoded).toHaveProperty('tokenVersion', 1);
  });

  it('debería incluir una expiración de 7 días', () => {
    const token = generateToken('id', 'user', 0);
    const decoded = jwt.verify(token, SECRET, { complete: true });
    const exp = decoded.payload.exp;
    const iat = decoded.payload.iat;
    const diffSeconds = exp - iat;
    expect(diffSeconds).toBeCloseTo(7 * 24 * 3600, -1);
  });

  it('debería usar tokenVersion 0 por defecto', () => {
    const token = generateToken('id', 'user');
    const decoded = jwt.verify(token, SECRET);
    expect(decoded).toHaveProperty('tokenVersion', 0);
  });

  it('debería generar tokens distintos para distintas versiones', () => {
    const token1 = generateToken('id', 'user', 0);
    const token2 = generateToken('id', 'user', 1);
    expect(token1).not.toEqual(token2);
  });
});
