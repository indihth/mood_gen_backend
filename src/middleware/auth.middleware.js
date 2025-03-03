// src/middleware/auth.middleware.js
const admin = require("firebase-admin");

const verifyFirebaseToken = async (req, res, next) => {
  if (process.env.TESTING_MODE === "true") {
    console.log(
      "Testing mode enabled, skipping Firebase auth and setting test uid"
    );
    // setting a test user id from env
    req.session.uid = process.env.TEST_USER_ID;
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    const firebaseToken = authHeader?.split("Bearer ")[1];

    // if (!req.query.token) {
    //   const authHeader = req.headers.authorization;
    //   const firebaseToken = authHeader?.split("Bearer ")[1];
    // }

    // const firebaseToken = req.query.token; // Get token from query string

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

// Option 1: Export the function directly as the default export
module.exports = verifyFirebaseToken;

// Option 2: Keep both approaches for backward compatibility
// module.exports = verifyFirebaseToken;
// module.exports.verifyFirebaseToken = verifyFirebaseToken;
