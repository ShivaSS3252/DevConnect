const express = require("express");
const connectDB = require("./config/database");
const app = express();
const User = require("./models/user");
app.post("/signup", async (req, res) => {
  const userObj = {
    firstName: "Sharanya",
    lastName: "shiva",
    emailId: "shiva@gmail.com",
    password: "shiva@123",
  };
  //Creating a new instance of user model
  const user = new User(userObj);
  try {
    await user.save();
    res.send("User Added Successfully");
  } catch (err) {
    res.status(400).send("errro saving the user" + err.message);
  }
});
connectDB()
  .then(() => {
    console.log("Database connection successful");
    app.listen(3000, () => {
      console.log("server is succefully listening");
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected");
  });
