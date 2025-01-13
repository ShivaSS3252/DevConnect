const cors = require("cors");
const express = require("express");
const connectDB = require("./config/database");
const app = express();
const cookieParser = require("cookie-parser");
app.use(
  cors({
    origin: "http://localhost:5173", // Your front-end URL
    credentials: true, // Allow cookies and credentials
  })
);
app.use(express.json());

app.use(cookieParser());
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);

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
