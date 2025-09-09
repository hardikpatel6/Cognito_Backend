const { signInUser, signUpUser, confirmUser, forgotPassword, confirmNewPassword, signOutUser } = require("./utils/cognito");
const AWS = require("aws-sdk");
require("dotenv").config({ path: '../.env' });
const ses = new AWS.SES({ apiVersion: '2010-12-01' });
const dynamo = new AWS.DynamoDB.DocumentClient();

// ✅ Signup (Lambda)
exports.signupHandler = async (event) => {
  try {
    const { email, password, name } = JSON.parse(event.body);
    const result = await signUpUser(email, password, name);

    const params = {
      Source: process.env.FROM_EMAIL,
      Destination: {
         ToAddresses: [email],
      },
      Message: {
        Subject: { Data: "Welcome to Our App!" },
        Body: {
          Html: {
            Data: `
              <h1 style="color:#4CAF50;">Welcome, ${name}!</h1>
              <p>Thank you for signing up with MyApp 🚀.</p>
              <p>Please check your inbox for a confirmation code to verify your account.</p>
              <hr/>
              <small>Team MyApp</small>
            `,
          },
        },
      },
    };
    try{
      await ses.sendEmail(params).promise();
      console.log("Welcome email sent to:", email);
    }catch(sesErr){
      console.error("Error sending welcome email:", sesErr);
    }
    return {
      statusCode: 200,
      headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "OPTIONS,POST",
    },
      body: JSON.stringify({
        message: "✅ Signup successful. Please confirm your email.",
        result,
      }),
    };
  } catch (err) {
    console
    return { statusCode: 400, body: JSON.stringify({ error: err.message }), };
  }
};

// ✅ Confirm (Lambda)
exports.confirmHandler = async (event) => {
  try {
    const { email, code } = JSON.parse(event.body);
    const result = await confirmUser(email, code);

    return {
      statusCode: 200,
      headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "OPTIONS,POST",
    },
      body: JSON.stringify({
        message: "✅ User confirmed successfully",
        result,
      }),
    };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
};

// ✅ Signin (Lambda)
exports.signinHandler = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body);
    const token = await signInUser(email, password);

    const params = {
      Source: process.env.FROM_EMAIL,
      Destination: {
          ToAddresses: [email],
      },
      Message: {
        Subject: { Data: "Welcome Back" },
        Body: {
          Text: {
            Data: `Hi ${email},\n\nYou have successfully signed in. We're happy to see you again!`,
          },
        },
      },
    };
    try{
      await ses.sendEmail(params).promise();
      console.log(`✅ Welcome email sent to ${email}`);
    }catch(sesErr){
      console.error("Error sending welcome email:", sesErr);
    }
    return {
      statusCode: 200,
      headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "OPTIONS,POST",
    },
      body: JSON.stringify({
        message: "✅ Sign in successful",
        token,
      }),
    };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
};

// ✅ Post Authentication (Lambda)
exports.PostAuthLambda = async (event) => {
  // event.userName for federated users is usually their email
  const email = event.userName;
  const name = event.request.userAttributes?.name || email;
  const provider = event.userName.startsWith("Google_") ? "Google" : "Cognito";
  
  const dbParams = {
    TableName: process.env.USER_TABLE,
    Key: { userId: event.userName },
    UpdateExpression: "SET email = :email, #nm = :name, provider = :provider, lastLogin = :lastLogin",
    ExpressionAttributeNames: { "#nm": "name" },
    ExpressionAttributeValues: {
      ":email": email,
      ":name": name,
      ":provider": provider,
      ":lastLogin": new Date().toISOString(),
    },
    ReturnValues: "ALL_NEW",
  };

  const emailParams = {
    Source: process.env.FROM_EMAIL,
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: "👋 Welcome Back!" },
      Body: {
        Html: {
          Data: `
            <h2>Welcome back, ${name}!</h2>
            <p>We’re happy to see you again 🚀</p>
            <hr/>
            <small>Team MyApp</small>
          `,
        },
      },
    },
  };

  try {
    await Promise.all([
      dynamo.update(dbParams).promise(),
      ses.sendEmail(emailParams).promise()
    ]);
    console.log(`✅ User ${email} data updated and welcome back email sent.`);
  } catch (err) {
    console.error("Error in PostAuthLambda:", err);
  }

  return event; // Must always return the event for PostAuthentication Lambda
};

// ✅ Forgot Password (Lambda)
exports.forgotPasswordHandler = async (event) => {
  try {
    const { email } = JSON.parse(event.body);
    const result = await forgotPassword(email);
    return {
      statusCode: 200,
      headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "OPTIONS,POST",
    },
      body: JSON.stringify({
        message: "✅ If a user with that email exists, a password reset code has been sent.",
        result,
      }),
    };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
};

// ✅ Confirm New Password (Lambda)
exports.confirmNewPasswordHandler = async (event) => {
  try {
    const { email, password, code } = JSON.parse(event.body);

    const result = await confirmNewPassword(email, password, code);

    return {
      statusCode: 200,
      headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "OPTIONS,POST",
    },
      body: JSON.stringify({
        message: "✅ Password successfully changed",
      }),
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: err.message
      }),
    };
  }
};

// ✅ Signout (Lambda)
exports.signoutHandler = async (event) => {
  try {
    const accessToken = event.headers.Authorization.split(' ')[1];
    const { email } = JSON.parse(event.body);

    if (!accessToken) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Authorization header with token is required." }),
      };
    }

    const message = await signOutUser(email);

    return {
      statusCode: 200,
      headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Methods": "OPTIONS,POST",
    },
      body: JSON.stringify({
        message,
      }),
    };
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: err.message }),
    };
  }
};