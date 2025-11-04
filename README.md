# Cognito Backend

Backend API for user authentication using AWS Cognito (User Pool + App Client + Identity Pool), built with Express and designed to run either as a local Express server or as AWS Lambda functions via AWS SAM.

This repository contains convenience lambdas and an AWS SAM template to deploy a Cognito-backed authentication API that also integrates with SES (welcome emails) and DynamoDB (Users table).

## Contents

- `src/` — Express app and Lambda handlers
	- `app.js` — Express application (local dev) and serverless export
	- `lambda.js` — Lambda handlers used by SAM (signup, confirm, signin, forgot-password, confirm-password, signout, PostAuth, update user pool)
	- `routes/auth.js` — Express routes mounted at `/auth`
	- `utils/cognito.js` — Cognito helpers (signup, confirm, signin, forgot password, confirm password, sign out)
- `layers/` — Layer package used for Lambda dependencies (bundled for nodejs22.x in `template.yaml`)
- `template.yaml` — AWS SAM template wiring Cognito, Lambda functions, DynamoDB, SES and an Amplify App
- `amplify.yml`, `buildspec.yml` — CI/deploy hints used by Amplify/CI

## Quick start (local)

Prerequisites:
- Node.js (recommended LTS)
- npm
- (Optional) AWS CLI configured if you want to use SAM deploy later

1. Copy environment file

Create a `.env` file at the repository root (the Express app `src/app.js` loads `../.env`) and add the variables below. Example:

```
USER_POOL_ID=us-east-1_xxxxxxxx
USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=you@example.com
USER_TABLE=Users
PORT=5000
```

2. Install dependencies

```
npm install
```

3. Run locally

```
npm start
```

The API will listen on `http://localhost:5000` by default. Routes are mounted under `/auth`.

## API endpoints (Express / Lambda)

All endpoints are POST and accept JSON; CORS is enabled in Express and SAM template.

- POST /auth/signup
	- Body: { email, password, name }
	- Description: Create a Cognito user. On success the code will also write a user entry to DynamoDB and send a welcome email via SES (when deployed with proper IAM/SES permissions).

- POST /auth/confirm
	- Body: { email, code }
	- Description: Confirm a new user's signup using the code sent to email.

- POST /auth/signin
	- Body: { email, password }
	- Description: Sign in and receive a JWT access token.

- POST /auth/forgot-password
	- Body: { email }
	- Description: Initiates Cognito forgot-password flow and sends a code to the user's email.

- POST /auth/confirm-password
	- Body: { email, code, newPassword }
	- Description: Confirm the password reset using the code and new password.

- POST /auth/signout
	- Body: { email }
	- Headers: Authorization: Bearer <token>
	- Description: Global sign out (invalidates sessions).

These same handlers are exported in `src/lambda.js` and wired into API Gateway via `template.yaml`.

## AWS SAM / Deployment

This project includes a `template.yaml` that provisions:
- Cognito User Pool, App Client and Identity Pool (with Google OIDC provider wiring)
- DynamoDB table (Users)
- Lambda functions (nodejs22.x) for signup/confirm/signin/etc
- An Amplify App resource for connecting to a GitHub repo (optional) and building

Deployment scripts (in `package.json`):
- `npm run build` — runs `sam build`
- `npm run deploy` — runs `sam deploy --guided`

Before deploying with SAM make sure:
- Your AWS credentials are configured locally (AWS CLI)
- Required template parameters are provided (GoogleClientId/Secret, GitHubToken if using Amplify resources)
- SES is verified or in production in the region you deploy if you want to send emails

## Environment variables

Place these in the root `.env` (or pass via Lambda environment in SAM):
- USER_POOL_ID — Cognito User Pool ID
- USER_POOL_CLIENT_ID — Cognito App Client ID
- FROM_EMAIL — SES-verified email address used to send welcome emails
- USER_TABLE — DynamoDB table name (default in template: `Users`)
- PORT — optional for local (default 5000)

Also ensure AWS credentials are available when deploying or when Lambdas run in AWS.

## Notes about implementation

- `src/utils/cognito.js` uses `amazon-cognito-identity-js` and relies on `node-fetch` global fetch shim. It expects `USER_POOL_ID` and `USER_POOL_CLIENT_ID` to be set.
- `src/app.js` loads `../.env` (so `.env` should live at project root). It also exports `lambdaHandler` (serverless-http wrapper) for Lambda usage.
- `src/lambda.js` contains the Lambda handler functions referenced by SAM (`signupHandler`, `confirmHandler`, `signinHandler`, etc.). These functions also send emails with SES and operate against DynamoDB; in SAM these permissions are configured in `template.yaml`.

## Example requests (curl)

Signup:

```bash
curl -X POST http://localhost:5000/auth/signup \
	-H 'Content-Type: application/json' \
	-d '{"email":"user@example.com","password":"P@ssw0rd123","name":"User"}'
```

Signin:

```bash
curl -X POST http://localhost:5000/auth/signin \
	-H 'Content-Type: application/json' \
	-d '{"email":"user@example.com","password":"P@ssw0rd123"}'
```

## Troubleshooting & next steps

- If you see errors about missing USER_POOL_ID or CLIENT_ID, verify your `.env` and ensure `src/utils/cognito.js` logs show the expected values.
- SES: if your account is in the SES sandbox you'll only be able to send to verified addresses; consider moving out of sandbox or verify target addresses.
- Add unit/integration tests for the helpers in `src/utils` (e.g., mock Cognito responses).
- Add CI pipeline steps to run linting and tests before SAM deployment.

## Security

- Never commit `.env` or any secrets. Use Secrets Manager, Parameter Store or CI environment variables for deployments.
- `template.yaml` uses `NoEcho: true` for secrets where applicable, but keep real secret material out of source control.

## License

This project is provided as-is. Add a LICENSE file as needed.

---
If you'd like, I can also:
- add a `.env.example` file with the variables
- add basic unit tests for `utils/cognito.js`
- create a GitHub Actions workflow to run `npm test` and `sam build` before deploy

Tell me which follow-up you'd like next.
