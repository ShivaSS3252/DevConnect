const express = require("express");
const profileRouter = express.Router();
const { userauth } = require("../middlewares/auth");
const { validateEditProfileData } = require("../utils/validation");

profileRouter.get("/profile/view", userauth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    res.status(400).send(err.message);
  }
});

profileRouter.post("/profile/edit", userauth, async (req, res) => {
  try {
    if (!validateEditProfileData(req)) {
      throw new Error("Invalid Edit Request");
    }
    const Loggedinuser = req.user;
    Object.keys(req.body).forEach((key) => (Loggedinuser[key] = req.body[key]));

    await Loggedinuser.save();

    res.json({
      message: `${Loggedinuser.firstName}, your profile updated successfuly`,
      data: Loggedinuser,
    });
  } catch (err) {
    res.status(400).send(err.message);
  }
});
module.exports = profileRouter;
