const cors = require("cors");
const express = require("express");
const connectDB = require("./config/database");
require("dotenv").config();
const app = express();
const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", // Explicitly allow frontend URL
    credentials: true, // Allow sending cookies
    methods: ["GET", "POST", "PUT", "DELETE"], // Explicitly allow methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allow specific headers
  })
);

app.use(express.json());

const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/request");
const userRouter = require("./routes/user");
app.get("/hello", (req, res) => {
  res.send("Hello from the backend!");
});

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);

const path = require("path");
app.use(express.static(path.join(__dirname, "dist")));

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
