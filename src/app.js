const express = require("express");
const app = express();
//this will only handle GET call to /user

app.get("/user/:userid", (req, res) => {
  console.log(req.params);
  res.send({ firstName: "Shiva", lastName: "Sharanya" });
});

//this will match all the http method API calls to /test
app.use("/test", (req, res) => {
  res.send("Hello from the test");
});

app.listen(3000, () => {
  console.log("server is succefully listening");
});
