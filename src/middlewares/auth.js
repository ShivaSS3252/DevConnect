const jwt = require("jsonwebtoken");
const User = require("../models/user");
const userauth = async (req, res, next) => {
  //Read the token from the req cookies
  try {
    const cookies = req.cookies;
    const { token } = cookies;
    if (!token) {
      return res.status(401).send("Please Login");
    }
    const decodedObj = await jwt.verify(token, process.env.JWT_SECRET);
    //validate the token
    const { _id } = decodedObj;
    const user = await User.findById(_id);
    //Find the user
    if (!user) {
      throw new Error("User not found");
    }

    await user.save();
    req.user = user;
    next();
  } catch (err) {
    res.status(400).send("error: " + err.message);
  }
};
module.exports = { userauth };
