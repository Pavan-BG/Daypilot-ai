// Sample test for Mongoose model (User)
const User = require('./src/models/User');

describe('User Model', () => {
  it('should be invalid if email is empty', (done) => {
    const user = new User();
    user.validate((err) => {
      expect(err.errors.email).toBeDefined();
      done();
    });
  });
});
