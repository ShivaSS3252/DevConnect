const validator = require("validator");
const validateSignUpData = (req) => {
  const { firstName, lastName, emailId, password } = req.body;
  if (!firstName || !lastName) {
    throw new Error("Name is not valid");
  } else if (!validator.isEmail(emailId)) {
    throw new Error("Email is not valid");
  } else if (!validator.isStrongPassword(password)) {
    throw new Error(
      "Password must be at least 8 characters long and can include lowercase, uppercase letters, numbers or special characters."
    );
  }
};
const validateEditProfileData = (req) => {
  const allowedEditFields = [
    "firstName",
    "lastName",
    "emailId",
    "photoUrl",
    "gender",
    "age",
    "about",
    "skills",
  ];

  const isEditAllowed = Object.keys(req.body).every((field) =>
    allowedEditFields.includes(field)
  );
  if (
    req.body.gender &&
    !["male", "female", "others"].includes(req.body.gender.toLowerCase())
  ) {
    throw new Error("Gender should be either 'male', 'female', or 'others'");
  }
  return isEditAllowed;
};
module.exports = {
  validateSignUpData,
  validateEditProfileData,
};
