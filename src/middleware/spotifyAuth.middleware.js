const { getFirestoreDb } = require("../services/firebaseServices");
const { spotifyApi, scopes } = require("../config/spotify.config");
const SpotifyService = require("../services/spotify.service");
const UserService = require("../services/user.service");

const expireTesting = true;

const isTokenExpired = (tokenData) => {
  const testExpiry = 120;
  const expiryTime = tokenData.createdAt + testExpiry * 1000;
  // const expiryTime = tokenData.createdAt + tokenData.expires_in * 1000;

  console.log(`expiryDate: ${expiryTime}`);
  return Date.now() > testExpiry; // 3 minutes expiry for testing
  // return Date.now() > expiryTime;
};

const spotifyAuthMiddleware = async (req, res, next) => {
  // If access token is already set, move to next middleware
  if (spotifyApi.getAccessToken()) {
    console.log(
      `spotify middleware skipped!, access_token: ${spotifyApi.getAccessToken()}`
    );
    return next();
  }
  // temp hardcoded for testing - update with firestore auth id later
  const userId = "90";

  try {
    // Ensures Firebase is initialized first
    const db = getFirestoreDb();

    // if Firebase db isn't initialized yet, initialize it
    if (!db) {
      console.log("Firestore DB not initialized, initializing now...");
      await initializeFirebaseApp(); // Re-initialize if needed
      db = getFirestoreDb();

      // if it fails to initialize, return an error
      if (!db) {
        return res
          .status(500)
          .json({ error: "Failed to initialize Firestore DB" });
      }
    }
    // get the token data from Firestore
    const result = await UserService.getUserSpotifyTokenData(userId);

    if (result.error) {
      if (result.requiresAuth) {
        // if the error is because user has no token, redirect to Spotify auth
        return res.redirect(spotifyApi.createAuthorizeURL(scopes));
      }
      return res.status(401).json({ error: result.message });
    }

    const tokenData = result.data;

    // if token is expired, refresh it
    if (expireTesting) {
      // if (isTokenExpired(tokenData)) {
      console.log("Token expired, refreshing...");
      // refreshes token and set to instance
      await SpotifyService.refreshAccessToken();
      console.log("Token refreshed and saved to Firestore");
    }

    // sets the data to spotifyApi instance
    spotifyApi.setAccessToken(tokenData.access_token);
    console.log(
      `Completed spotify middleware!`
      // `Completed spotify middleware!, access_token: ${spotifyApi.getAccessToken()}`
    );

    next();
  } catch (error) {
    console.error("Spotify Auth Middleware Error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
};

module.exports = spotifyAuthMiddleware;
