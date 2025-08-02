const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

function signToken(user) {
  return jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken };
