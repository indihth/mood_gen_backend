// src/middleware/auth.middleware.js
const admin = require("firebase-admin");

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const firebaseToken = authHeader?.split("Bearer ")[1];

    if (!firebaseToken) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { verifyFirebaseToken };
