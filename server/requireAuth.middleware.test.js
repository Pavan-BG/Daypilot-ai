// Sample test for middleware (requireAuth)
const requireAuth = require('./src/middleware/requireAuth');

describe('requireAuth Middleware', () => {
  it('should call next with error if not authenticated', () => {
    const req = { isAuthenticated: () => false };
    const res = {};
    const next = jest.fn();
    requireAuth(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
