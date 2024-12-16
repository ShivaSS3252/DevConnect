const express = require("express");
const connectDB = require("./config/database");
const app = express();
const User = require("./models/user");
app.use(express.json());
app.post("/signup", async (req, res) => {
  const userObj = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    emailId: req.body.emailId,
    password: req.body.password,
  };
  //Creating a new instance of user model
  const user = new User(req.body);
  try {
    await user.save();
    res.send("User Added Successfully");
  } catch (err) {
    res.status(400).send("error saving the user" + err.message);
  }
});

//Feed API-get all the users from database
app.get("/feed", async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (err) {
    res.status(400).send("error saving the user" + err.message);
  }
});
//Delete the user
app.delete("/user", async (req, res) => {
  const userId = req.body.userId;
  console.log("userId", req.body.userId);
  try {
    const user = await User.findByIdAndDelete(userId);

    res.send("User deleted successfully");
  } catch (err) {
    res.status(400).send("error saving the user" + err.message);
  }
});

//update the user
app.patch("/user", async (req, res) => {
  const data = req.body;
  const userId = req.body.userId;
  try {
    await User.findByIdAndUpdate({ _id: userId }, data, {
      runValidators: true,
    });
    res.send("User updated successfully");
  } catch (err) {
    res.status(400).send("update failed" + err.message);
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
