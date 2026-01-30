const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const REGION = process.env.AWS_REGION || process.env.REGION;
const USER_POOL_ID = process.env.USER_POOL_ID;        // e.g.: us-east-1_XXXXXXXXX
const APP_CLIENT_ID = process.env.APP_CLIENT_ID;      // expected aud (Client ID)
const JWKS_URI = `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`;

// jwks-rsa client with cache and rate limiting
const client = jwksClient({
  jwksUri: JWKS_URI,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 10 * 60 * 1000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

exports.handler = async (event) => {
  try {
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Missing or invalid Authorization header' })
      };
    }

    const token = authHeader.split(' ')[1];

    // Verify token using jwks-rsa to obtain the public key
    const verifyOptions = {
      algorithms: ['RS256'],
      issuer: `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`,
      audience: APP_CLIENT_ID
    };

    const verified = await new Promise((resolve, reject) => {
      jwt.verify(token, getKey, verifyOptions, (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      });
    });

    // Here you have the decoded payload in `verified`
    // Example: check scopes or custom claims
    // if (!verified['cognito:groups'] || !verified['cognito:groups'].includes('admin')) { ... }

    // Return success and the payload (or proceed with business logic)
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Valid token', claims: verified })
    };

  } catch (err) {
    console.error('JWT validation error', err);
    const status = err.name === 'TokenExpiredError' ? 401 : 401;
    return {
      statusCode: status,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }
};
