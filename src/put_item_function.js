const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.TABLE_NAME || 'Items';

const isValidId = (id) => typeof id === 'string' && id.trim().length > 0;
const isValidPrice = (p) => typeof p === 'number' && Number.isFinite(p) && p >= 0;

exports.handler = async (event) => {
  const now = new Date().toISOString();
  console.info({ msg: 'invocation', timestamp: now, eventSource: event.requestContext?.identity || null });

  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (err) {
    console.warn({ msg: 'invalid_json', error: err.message });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON in request body' }),
    };
  }

  const { id, price } = body;

  // Input validation
  if (!isValidId(id) || !isValidPrice(price)) {
    const details = {
      id: typeof id,
      price: typeof price,
    };
    console.warn({ msg: 'validation_failed', details });
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Validation failed', details }),
    };
  }

  // Idempotency: optional, use client-generated id or dedupe logic
  const params = {
    TableName: TABLE_NAME,
    Item: {
      id: id,
      price: price,
      createdAt: now
    },
    // ConditionExpression to avoid overwriting existing item (uncomment if desired)
    // ConditionExpression: 'attribute_not_exists(id)'
  };

  try {
    await dynamodb.put(params).promise();
    console.info({ msg: 'item_put_success', id });
    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Item inserido com sucesso!', id }),
    };
  } catch (err) {
    console.error({ msg: 'dynamodb_put_error', error: err.message, stack: err.stack });
    // Distinguish conditional check failures vs internal errors if using ConditionExpression
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
