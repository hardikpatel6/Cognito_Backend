const dotenv = require("dotenv");
dotenv.config();
const AmazonCognitoIdentity = require("amazon-cognito-identity-js");
global.fetch = require("node-fetch");

const userPoolId = process.env.USER_POOL_ID;
const clientId = process.env.USER_POOL_CLIENT_ID;

console.log(userPoolId, clientId);
// Optional: Add a check to see if the values were loaded
if (!userPoolId || !clientId) {
  console.error('Error: USER_POOL_ID or CLIENT_ID is not defined in the .env file.');
  // Handle the error gracefully
}

// 3. Create the Cognito User Pool instance
const poolData = {
  UserPoolId: userPoolId,
  ClientId: clientId,
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

// ✅ Sign up user
async function signUpUser(email, password, name) {
  return new Promise((resolve, reject) => {
    const attributeList = [
      new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "email", Value: email }),
      new AmazonCognitoIdentity.CognitoUserAttribute({ Name: "name", Value: name }),
    ];

    userPool.signUp(email, password, attributeList, null, (err, result) => {
      if (err) return reject(err);
      resolve(result.user);
    });
  });
}

// ✅ Confirm user signup
async function confirmUser(email, code) {
  return new Promise((resolve, reject) => {
    const userData = { Username: email, Pool: userPool };
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

// ✅ Sign in user
async function signInUser(email, password) {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const userData = { Username: email, Pool: userPool };
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        resolve(result.getIdToken().getJwtToken());
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
}

/**
 * Initiates the forgot password process for a user.
 * @param {string} email - The email of the user to reset the password for.
 * @returns {Promise<string>} A promise that resolves with a success message or rejects with an error.
 */
async function forgotPassword(email) {
  return new Promise((resolve, reject) => {
    const userData = {
      Username: email,
      Pool: userPool
    };
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.forgotPassword({
      onSuccess: function (data) {
        console.log('CodeDeliveryData: ' + data);
        resolve('A password reset code has been sent to your email.');
      },
      onFailure: function (err) {
        console.error(err);
        reject(err);
      }
    });
  });
}

async function confirmNewPassword(email, newPassword, verificationCode) {
  return new Promise((resolve, reject) => {
    const userData = {
      Username: email,
      Pool: userPool
    };
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

    cognitoUser.confirmPassword(verificationCode, newPassword, {
      onSuccess: () => {
        resolve("Password successfully changed.");
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
}
async function signOutUser(accessToken,email) {
  return new Promise((resolve, reject) => {
    const userData = {
      Username: email,
      Pool: userPool
    };
    const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
    cognitoUser.globalSignOut(accessToken,{
      onSuccess: () => {
        resolve("Password successfully changed.");
      },
      onFailure: (err) => {
        reject(err);
      },
    })
  });
}
module.exports = { signUpUser, confirmUser, signInUser ,forgotPassword,confirmNewPassword,signOutUser};
