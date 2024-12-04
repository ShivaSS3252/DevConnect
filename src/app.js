const express = require("express");
const app = express();
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

app.listen(3000, () => {
  console.log("server is succefully listening");
});
