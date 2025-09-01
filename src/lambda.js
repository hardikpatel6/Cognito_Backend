const app = require("./app");
const AWS = require("aws-sdk");
const Cognito = new AWS.CognitoIdentityServiceProvider();

const USER_POOL_ID = process.env.USER_POOL_ID;
const CLIENT_ID = process.env.CLIENT_ID;

exports.handler = async (event) => {
    const { httpMethod, path } = event;

    switch (httpMethod) {
        case 'POST':
            if (path === '/signup') {
                return await signup(event);
            } else if (path === '/signin') {
                return await signin(event);
            } else if (path === '/confirm') {
                return await confirm(event);
            } else {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ message: 'Not Found' }),
                };
            }
        default:
            return {
                statusCode: 405,
                body: JSON.stringify({ message: 'Method Not Allowed' }),
            };
    }
};

const signup = async (event) => {
    const body = JSON.parse(event.body);

    try {
        const params = {
            ClientId: CLIENT_ID,
            Username: body.email,
            Password: body.password,
            UserAttributes: [
                { Name: "email", Value: body.email }
            ]
        };
        await Cognito.signUp(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Signup successful! Check email for confirmation code." }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
        };
    }
};

const signin = async (event) => {
    const body = JSON.parse(event.body);

    try {
        const params = {
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: CLIENT_ID,
            AuthParameters: {
                USERNAME: body.email,
                PASSWORD: body.password
            }
        };
        const data = await Cognito.initiateAuth(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Signin successful!", token: data.AuthenticationResult.IdToken }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
        };
    }
};

const confirm = async (event) => {
    const body = JSON.parse(event.body);

    try {
        const params = {
            ClientId: CLIENT_ID,
            Username: body.email,
            ConfirmationCode: body.code
        };
        await Cognito.confirmSignUp(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "User confirmed successfully!" }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
        };
    }
};

