const { signInUser, signUpUser, confirmUser, forgotPassword, confirmNewPassword, signOutUser } = require("./utils/cognito");

// ✅ Signup (Lambda)
exports.signupHandler = async (event) => {
  try {
    const { email, password, name } = JSON.parse(event.body);
    const result = await signUpUser(email, password, name);

    return {
      statusCode: 200,
      headers: {
      "Access-Control-Allow-Origin": "http://localhost:4000",
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
      "Access-Control-Allow-Origin": "http://localhost:4000",
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

    return {
      statusCode: 200,
      headers: {
      "Access-Control-Allow-Origin": "http://localhost:4000",
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

exports.forgotPasswordHandler = async (event) => {
  try {
    const { email } = JSON.parse(event.body);
    const result = await forgotPassword(email);
    return {
      statusCode: 200,
      headers: {
      "Access-Control-Allow-Origin": "http://localhost:4000",
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

exports.confirmNewPasswordHandler = async (event) => {
  try {
    const { email, password, code } = JSON.parse(event.body);

    const result = await confirmNewPassword(email, password, code);

    return {
      statusCode: 200,
      headers: {
      "Access-Control-Allow-Origin": "http://localhost:4000",
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
      "Access-Control-Allow-Origin": "http://localhost:4000",
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