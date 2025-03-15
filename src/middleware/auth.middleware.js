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
    let firebaseToken;
    if (req.headers.authorization) {
      firebaseToken = req.headers.authorization.split("Bearer ")[1];
    } else if (req.query.token) {
      firebaseToken = req.query.token;
    }
    // } else if (req.query.token) {
    //   firebaseToken = req.query.token;
    // }

    if (!firebaseToken) {
      console.log("No token provided - auth middleware");
      return res.status(401).json({ error: "No token provided" });
    }

    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);

    if (req.session) {
      // store UID in session
      req.session.uid = decodedToken.uid;
    } else {
      console.error(
        "Session not available on request object - auth middleware"
      );
      return res.status(500).json({ error: "Session not available" });
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
