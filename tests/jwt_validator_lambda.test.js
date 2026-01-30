jest.mock('jwks-rsa');
jest.mock('jsonwebtoken');

const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');

// Import the lambda after setting up the mocks
const lambda = require('../src/jwt_validator_lambda');

describe('jwt_validator_lambda', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, AWS_REGION: 'sa-east-1', REGION: 'sa-east-1', USER_POOL_ID: 'sa-east-1_TEST', APP_CLIENT_ID: 'test-client-id' };

    // Mock jwksClient and getSigningKey
    const getSigningKeyMock = jest.fn((kid, cb) => {
      // Simulate public key return
      const key = {
        getPublicKey: () => '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkq...\n-----END PUBLIC KEY-----'
      };
      cb(null, key);
    });

    jwksClient.mockImplementation(() => ({
      getSigningKey: getSigningKeyMock
    }));

    // Mock jwt.verify to call callback with decoded payload
    jwt.verify.mockImplementation((token, getKey, options, callback) => {
      // Simulate call to getKey with header containing kid
      const header = { kid: 'abc123' };
      getKey(header, (err, key) => {
        if (err) return callback(err);
        // Simulate successful verification returning payload
        if (token === 'valid-token') {
          return callback(null, { sub: 'user123', email: 'user@example.com', aud: process.env.APP_CLIENT_ID });
        }
        // Simulate expired token
        const errObj = new Error('jwt expired');
        errObj.name = 'TokenExpiredError';
        return callback(errObj);
      });
    });
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.clearAllMocks();
  });

  test('returns 200 and claims when token is valid', async () => {
    const event = {
      headers: {
        Authorization: 'Bearer valid-token'
      }
    };

    const result = await lambda.handler(event);
    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Valid token');
    expect(body.claims).toHaveProperty('sub', 'user123');
    expect(body.claims).toHaveProperty('email', 'user@example.com');
  });

  test('returns 401 when Authorization header is missing', async () => {
    const event = { headers: {} };
    const result = await lambda.handler(event);
    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body);
    expect(body.error).toMatch(/Missing or invalid Authorization header/i);
  });

  test('returns 401 when token is expired or invalid', async () => {
    const event = {
      headers: {
        Authorization: 'Bearer expired-token'
      }
    };

    const result = await lambda.handler(event);
    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Unauthorized');
  });
});
