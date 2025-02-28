const { getFirestoreDb } = require("../services/firebaseServices");
const { spotifyApi, scopes } = require("../config/spotify.config");
const SpotifyService = require("../services/spotify.service");
const UserService = require("../services/user.service");

const expireTesting = false;

const isTokenExpired = (tokenData) => {
  if (!tokenData?.created_at || !tokenData?.expires_in) {
    return true;
  }
  const now = Date.now();
  const expiryTime = tokenData.created_at + tokenData.expires_in * 1000;

  // if token is or is about to expire (buffer of 5 minutes), return true
  return now >= expiryTime - 300000;
};

const spotifyAuthMiddleware = async (req, res, next) => {
  // const userId = req.session.userId;

  const userId = req.session.uid; // temp hardcoded for testing - update with firestore auth id later

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

    const result = await UserService.getSpotifyTokenData(userId); // get the token data from Firestore

    if (result.error) {
      if (result.requiresAuth) {
        // if the error is because user has no token, redirect to Spotify auth?
        // No, user shouldn't get this far without an access token, show error
        return res.redirect(spotifyApi.createAuthorizeURL(scopes));
      }
      return res.status(401).json({ error: result.message });
    }

    const tokenData = result.data;

    // set token data on each request to ensure consistency
    spotifyApi.setAccessToken(tokenData.access_token);
    spotifyApi.setRefreshToken(tokenData.refresh_token);

    // if token is or nearly expired, refresh it
    if (isTokenExpired(tokenData)) {
      console.log("Token expired, refreshing...");

      await SpotifyService.refreshAccessToken(); // refresh the token
    }

    console.log(`Completed spotify middleware!`);

    next();
  } catch (error) {
    console.error("Spotify Auth Middleware Error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
};

module.exports = spotifyAuthMiddleware;
