// src/middleware/auth.middleware.js
const admin = require("firebase-admin");

const verifyFirebaseToken = async (req, res, next) => {
  console.log(`TESTING_MODE value: ${process.env.TESTING_MODE}`);
  if (process.env.TESTING_MODE === "true") {
    console.log(
      "Testing mode enabled, skipping Firebase auth and setting test uid"
    );
    // setting a test user id from env
    req.session.uid = process.env.TEST_USER_ID;
    return next();
  }

  try {
    // const authHeader = req.headers.authorization;
    // const firebaseToken = authHeader?.split("Bearer ")[1];

    const firebaseToken = req.query.token; // Get token from query string

    if (!firebaseToken) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);

    if (req.session) {
      // store UID in session
      req.session.uid = decodedToken.uid;
      console.log(`Session UID: ${req.session.uid}`);
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { verifyFirebaseToken };
