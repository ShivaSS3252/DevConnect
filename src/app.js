const cors = require("cors");
const express = require("express");
const connectDB = require("./config/database");
require("dotenv").config();
const PORT = process.env.PORT || 3000;
const app = express();
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Check if we are in production or development
const allowedOrigins = [
  "http://localhost:5173", // For local development
  "https://devconnect-web-as4r.onrender.com", // For deployed frontend
];

// Use dynamic CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        // Allow requests with no origin (like mobile apps)
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
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
    app.listen(PORT, () => {
      console.log("server is successfully listening");
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected");
  });
