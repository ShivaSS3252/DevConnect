const express = require("express");
const requestRouter = express.Router();
const { userauth } = require("../middlewares/auth");

requestRouter.post("/sendConnectionRequest", userauth, async (req, res) => {
  const user = req.user;
  res.send(user.firstName + " sent connection request");
});
module.exports = requestRouter;
