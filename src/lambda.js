const { signInUser, signUpUser, confirmUser } = require("./utils/cognito");

// ✅ Signup (Lambda)
exports.signupHandler = async (event) => {
  try {
    const { email, password, name } = JSON.parse(event.body);
    const result = await signUpUser(email, password, name);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "✅ Signup successful. Please confirm your email.",
        result,
      }),
    };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
};

// ✅ Confirm (Lambda)
exports.confirmHandler = async (event) => {
  try {
    const { email, code } = JSON.parse(event.body);
    const result = await confirmUser(email, code);

    return {
      statusCode: 200,
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
      body: JSON.stringify({
        message: "✅ Sign in successful",
        token,
      }),
    };
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: err.message }) };
  }
};
