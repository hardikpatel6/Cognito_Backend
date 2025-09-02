const express = require("express");
const axios = require("axios"); 
const router = express.Router();
const { signInUser, signUpUser, confirmUser } = require("../utils/cognito.js");

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

module.exports = router;
