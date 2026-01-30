Daily learning

# Adding Security to APIs on AWS with Amazon Cognito

Project developed at Bootcamp AWS - Cloud Amazon Web Services with guidance from specialist [Cassiano Peres](https://github.com/cassianobrexbit "Cassiano Peres").

Learning how to offer authentication, authorization, and user management for web and mobile applications with Amazon Cognito. A service, fully managed by AWS, that supports the main security mechanisms on the market, in addition to integration with third parties such as Facebook, Google, Apple, or Amazon itself. Reviewing the steps presented by the expert to make APIs more secure through this solution.

[LICENSE](/LICENSE)

See [original repository](https://github.com/cassianobrexbit/dio-live-cognito).

```Markdown

---

## AWS Services Used

- Amazon Cognito
- Amazon DynamoDB
- Amazon API Gateway
- AWS Lambda

## Development Steps

### Creating a REST API in Amazon API Gateway

- API Gateway Dashboard -> Create API -> REST API -> Build  
- Protocol - REST -> Create new API -> API name `dio_live_api` -> Endpoint Type - Regional -> Create API  
- Resources -> Actions -> Create Resource -> Resource Name `Items` -> Create Resource

### In Amazon DynamoDB

- DynamoDB Dashboard -> Tables -> Create table -> Table name `Items` -> Partition key `id` -> Create table

### In AWS Lambda

#### Function to insert item

- Lambda Dashboard -> Create function -> Name `put_item_function` -> Create function  
- Insert function code `put_item_function.js` available in the `/src` folder -> Deploy  
- Configuration -> Execution role -> Open the Role in the IAM console  
- IAM -> Roles -> Role created in the previous step -> Permissions -> Add inline policy  
- Service - DynamoDB -> Manual actions -> add actions -> `putItem`  
- Resources -> Add arn -> Select the ARN of the table created in DynamoDB -> Add  
- Review policy -> Name `lambda_dynamodb_putItem_policy` -> Create policy

### Integrating API Gateway with the Lambda backend

- API Gateway Dashboard -> Select the created API -> Resources -> Select the created resource -> Action -> Create method - POST  
- Integration type -> Lambda function -> Use Lambda Proxy Integration -> Lambda function -> Select the created Lambda function -> Save  
- Actions -> Deploy API -> Deployment Stage -> New Stage `dev` -> Deploy

### In POSTMAN

- Add Request -> Method POST -> Copy the endpoint generated in API Gateway  
- Body -> Raw -> JSON -> Add the following body  

```

---

```json
{
  "id": "003",
  "price": 600
}
```

```Markdown

- Send

## Amazon Cognito

- Cognito Dashboard -> Manage User Pools -> Create a User Pool -> Pool name [TestPool]
- How do you want your end users to sign in? - Email address or phone number -> Next Step
- What password strength do you want to require?
- Do you want to enable Multi-Factor Authentication (MFA)? Off -> Next Step
- Do you want to customize your email verification messages? -> Verification type - Link -> Next Step
- Which app clients will have access to this user pool? -> App client name [TestClient] -> Create App Client -> Next Step
- Create Pool

- App integration -> App client settings -> Enabled Identity Providers - Cognito User Pool
- Callback URL(s) [https://example.com/logout]
- OAuth 2.0 -> Allowed OAuth Flows - Authorization code grant; Implicit grant
- Allowed OAuth Scopes - email; openid
- Save Changes

- Domain name -> Domain prefix [diolive] -> Save

Creating an Amazon Cognito authorizer for a REST API in Amazon API Gateway

- API Gateway Dashboard -> Select the created API -> Authorizers -> Create New Authorizer
- Name [CognitoAuth] -> Type - Cognito -> Cognito User Pool [the pool created earlier] -> Token Source [Authorization]

- Resources -> select the created resource -> select the created method -> Method Request -> Authorization - select the authorizer created

Postman

- Add request -> Authorization
- Type - OAuth 2.0
- Callback URL [https://example.com/logout]
- Auth URL [https://diolive.auth.sa-east-1.amazoncognito.com/login]
- Client ID - obtain the Client ID from Cognito App clients
- Scope [email openid]
- Client Authentication [Send client credentials in body]
- Get New Access Token
- Copy the generated token

- Select the request created to insert an item -> Authorization -> Type - Bearer Token -> Paste the copied token
- Send

---
