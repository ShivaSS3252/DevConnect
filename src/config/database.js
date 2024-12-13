const mongoose = require("mongoose");
const connectDB = async () => {
  await mongoose.connect(
    "mongodb+srv://shivasharanya5:GkwsjybxBBws9rKo@cluster0.r0rbr.mongodb.net/devTinder"
  );
};
module.exports = connectDB;
