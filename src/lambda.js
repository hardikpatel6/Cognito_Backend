import { CognitoIdentityProviderClient, SignUpCommand, ConfirmSignUpCommand, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION });

export const handler = async (event) => {
  console.log("Event:", event);

  const body = event.body ? JSON.parse(event.body) : {};
  const path = event.resource || event.path; // works for SAM proxy integration

  try {
    if (path.includes("signup")) {
      const command = new SignUpCommand({
        ClientId: process.env.USER_POOL_CLIENT_ID,
        Username: body.username,
        Password: body.password,
        UserAttributes: [{ Name: "email", Value: body.email }]
      });
      const response = await client.send(command);
      return success(response);
    }

    if (path.includes("confirm")) {
      const command = new ConfirmSignUpCommand({
        ClientId: process.env.USER_POOL_CLIENT_ID,
        Username: body.username,
        ConfirmationCode: body.code
      });
      const response = await client.send(command);
      return success(response);
    }

    if (path.includes("signin")) {
      const command = new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: process.env.USER_POOL_CLIENT_ID,
        AuthParameters: {
          USERNAME: body.username,
          PASSWORD: body.password
        }
      });
      const response = await client.send(command);
      return success(response);
    }

    return error("Unknown route");
  } catch (err) {
    console.error("Error:", err);
    return error(err.message || "Something went wrong");
  }
};

function success(data) {
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, data })
  };
}

function error(msg) {
  return {
    statusCode: 400,
    body: JSON.stringify({ success: false, message: msg })
  };
}
