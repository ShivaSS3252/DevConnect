const express = require("express");
const authRouter = express.Router();
const { validateSignUpData } = require("../utils/validation");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

authRouter.post("/signup", async (req, res) => {
  const userObj = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    emailId: req.body.emailId,
    password: req.body.password,
  };
  try {
    //validation of data
    validateSignUpData(req);
    const existingUser = await User.findOne({ emailId: req.body.emailId });
    if (existingUser) {
      return res.status(400).json("Email already registered!");
    }

    //Encrypt the password
    const { firstName, lastName, emailId, password } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);

    //Creating a new instance of user model
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
    });

    const savedUser = await user.save();
    const token = await savedUser.getJWT();
    //Add the token to cookie and send the response back to user
    res.cookie("token", token, {
      expires: new Date(Date.now() + 8 * 3600000),
    });
    res.json({ message: "User Added Successfully", data: savedUser });
  } catch (err) {
    res.status(400).send(err.message);
  }
});
authRouter.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;
    const user = await User.findOne({ emailId: emailId });
    if (!user) {
      throw new Error("Invalid Credentials");
    }

    const ispasswordValid = await user.validatePassword(password);
    if (ispasswordValid) {
      //create a JWT Token
      const token = await user.getJWT();
      //Add the token to cookie and send the response back to user
      res.cookie("token", token, {
        expires: new Date(Date.now() + 8 * 3600000),
      });
      res.send(user);
    } else {
      throw new Error("Invalid Credentials");
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
});
authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
  });
  res.send("Logout Successful");
});
module.exports = authRouter;
