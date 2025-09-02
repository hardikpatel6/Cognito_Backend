const AmazonCognitoIdentity = require("amazon-cognito-identity-js");
global.fetch = require("node-fetch");

const userPoolId =`ap-south-1_3dcWs4KFM`;
const clientId = `5qse1piq58gpp1afnr2u8443ck`;

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

module.exports = { signUpUser, confirmUser, signInUser };
