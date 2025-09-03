const express = require("express");
const axios = require("axios"); 
const router = express.Router();
const { signInUser, signUpUser, confirmUser,forgotPassword,confirmNewPassword,signOutUser } = require("../utils/cognito.js");

// ✅ Signup
router.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const result = await signUpUser(email, password, name);
    res.json({ message: "✅ Signup successful. Please confirm your email.", result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Confirm
router.post("/confirm", async (req, res) => {
  const { email, code } = req.body;
  try {
    const result = await confirmUser(email, code);
    res.json({ message: "✅ User confirmed successfully", result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Signin
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const token = await signInUser(email, password);
    res.json({ message: "✅ Sign in successful", token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body; 
  try {
    const result = await forgotPassword(email);
    res.json({ message: "✅ If a user with that email exists, a password reset code has been sent.", result });
  }
  catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/confirm-new-password", async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const result = await confirmNewPassword(email, code, newPassword);
    res.json({ message: "✅ Password has been reset successfully.", result });
  } catch (err) {   
    res.status(400).json({ error: err.message });
  }
});

router.post("/signout", async (req, res) => {
  const {email} = req.body;
  const accessToken = req.headers.authorization?.split(" ")[1]; // Extract token from "Bearer <
  try {
    if (!accessToken) {
      return res.status(401).json({ error: "Access token is required" });
    }
    const result = await signOutUser(email);
    res.json({ message: "✅ User successfully signed out of all devices.", result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
module.exports = router;
