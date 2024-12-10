const adminauth = (req, res, next) => {
  const authtoken = "xyz";
  const isauthorised = authtoken === "xyz";
  if (!isauthorised) {
    res.status(401).send("unauthorised code");
  } else {
    next();
  }
};
const userauth = (req, res, next) => {
  const authtoken = "xyz";
  const isauthorised = authtoken === "xyz";
  if (!isauthorised) {
    res.status(401).send("unauthorised code");
  } else {
    next();
  }
};
module.exports = { adminauth, userauth };
