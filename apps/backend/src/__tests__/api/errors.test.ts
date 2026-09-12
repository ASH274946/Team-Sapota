import { describe, it, expect } from 'vitest';
import { AppError, AuthError, NotFoundError, ValidationError, ApiError, isApiError } from '../../api/common/errors';

describe('Error Classes', () => {
  it('AuthError should have 401 status', () => {
    const err = new AuthError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.isOperational).toBe(true);
  });

  it('NotFoundError should have 404 status', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
  });

  it('ValidationError should include field errors', () => {
    const fields = { email: ['Invalid email format'] };
    const err = new ValidationError('Validation failed', fields);
    expect(err.fields).toEqual(fields);
    expect(err.statusCode).toBe(400);
  });

  it('AppError base class works correctly', () => {
    const err = new AppError('test', 400, 'TEST');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('TEST');
    expect(err.isOperational).toBe(true);
  });

  it('isApiError identifies ApiError instances only', () => {
    expect(isApiError(ApiError.forbidden())).toBe(true);
    expect(isApiError(ApiError.unauthorized())).toBe(true);
    expect(isApiError(new Error('test'))).toBe(false);
  });
});
