const express = require("express");
const app = express();
const { adminauth, userauth } = require("./middlewares/auth");

//this will only handle GET call to /user

app.get("/user/:userid", (req, res) => {
  console.log(req.params);
  res.send({ firstName: "Shiva", lastName: "Sharanya" });
});
app.use(
  "/userdata",
  (req, res, next) => {
    res.send("first routehandler");
    next();
    console.log("first routehandler");
  },
  (req, res, next) => {
    console.log("second routehandler");
    next();
    // res.send("second routehandler");
  },
  (req, res, next) => {
    console.log("third routehandler");
    next();
    // res.send("third routehandler");
  }
);
//this will match all the http method API calls to /test
app.use("/test", (req, res) => {
  //This callback function is known as Route handler
  res.send("Hello from the test");
});

//middlewares main code
app.use("/admin", adminauth);
app.get("/user", userauth, (req, res) => {
  res.send("user data sent");
});
app.get("/admin/getdata", (req, res) => {
  res.send("all data sent");
});
app.get("/admin/deletedata", (req, res) => {
  res.send("Deleted data ");
});
//Error handling

app.get("/getuser", (req, res) => {
  //we can handle using try and catch
  throw new Error("sdhjdsf");
  res.send("user data sent");
});
app.use("/", (err, req, res, next) => {
  if (err) {
    res.status(500).send("something went wrong");
  }
});

app.listen(3000, () => {
  console.log("server is succefully listening");
});
