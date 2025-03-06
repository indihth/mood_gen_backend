const { getFirestoreDb } = require("../services/firebaseServices");
const { spotifyApi, scopes } = require("../config/spotify.config");
const TokenService = require("../services/token.service");

const isTokenExpired = (tokenData) => {
  if (!tokenData?.last_updated || !tokenData?.expires_in) {
    console.log("Token data missing last_updated or expires_in");
    return true;
  }

  // Convert Firestore timestamp to milliseconds
  const lastUpdated = tokenData.last_updated._seconds * 1000;
  const now = Date.now();
  const expiryTime = lastUpdated + tokenData.expires_in * 1000;

  console.log({
    lastUpdated,
    now,
    expiryTime,
    expires_in: tokenData.expires_in,
    timeUntilExpiry: expiryTime - now,
  });

  // If token expires in less than 5 minutes, refresh early to avoid bad requests
  return now >= expiryTime - 300000; // 5 minutes buffer
};

const spotifyAuthMiddleware = async (req, res, next) => {
  // const userId = req.session.userId;

  // if (process.env.TESTING_MODE === "true") {
  //   console.log(
  //     "Testing mode enabled, skipping Firebase auth and setting test uid"
  //   );
  //   // setting a test user id from env
  //   req.session.uid = process.env.TEST_USER_ID;
  //   return next();
  // }
  const userId = req.session.uid;

  try {
    const db = getFirestoreDb(); // Ensures Firebase is initialized first

    if (!db) {
      // if Firebase db isn't initialized yet, initialize it
      console.log("Firestore DB not initialized, initializing now...");
      await initializeFirebaseApp(); // Re-initialize if needed
      db = getFirestoreDb();

      if (!db) {
        return res
          .status(500)
          .json({ error: "Failed to initialize Firestore DB" });
      }
    }

    const result = await TokenService.getSpotifyTokenData(userId); // get the token data from Firestore

    if (result.error) {
      if (result.requiresAuth) {
        // if the error is because user has no token, redirect to Spotify auth?
        // No, user shouldn't get this far without an access token, show error
        return res.redirect(spotifyApi.createAuthorizeURL(scopes));
      }
      return res.status(401).json({ error: result.message });
    }

    const tokenData = result;
    // console.log("Spotify Token Data:", tokenData);

    // set token data on each request to ensure consistency
    spotifyApi.setAccessToken(tokenData.spotify.access_token);
    spotifyApi.setRefreshToken(tokenData.spotify.refresh_token);

    // if token is or nearly expired, refresh it
    if (isTokenExpired(tokenData.spotify)) {
      console.log("Token expired, needs refreshing...");
      await TokenService.refreshSpotifyToken(userId);
    }

    console.log(`Completed spotify middleware!`);

    next();
  } catch (error) {
    console.error("Spotify Auth Middleware Error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
};

module.exports = spotifyAuthMiddleware;
