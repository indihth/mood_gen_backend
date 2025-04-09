const { getFirestoreDb } = require("../services/firebaseServices");
const { spotifyApi, scopes } = require("../config/spotify.config");
const TokenService = require("../services/token.services");

const isTokenExpired = (tokenData) => {
  if (!tokenData?.last_updated || !tokenData?.expires_in) {
    console.log("Token data missing last_updated or expires_in");
    return true;
  }

  // convert Firestore timestamp to milliseconds
  const lastUpdated = tokenData.last_updated._seconds * 1000;
  const now = Date.now();
  const expiryTime = lastUpdated + tokenData.expires_in * 1000;

  // if token expires in less than 5 minutes, refresh early to avoid bad requests
  return now >= expiryTime - 300000; // 5 minutes buffer
};

const spotifyAuthMiddleware = async (req, res, next) => {
  const userId = req.session.uid;

  try {
    const db = getFirestoreDb(); // ensure Firebase is initialized first

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

    if (!result || result.error) {
      if (result.requiresAuth) {
        // if the error is because user has no token, redirect to Spotify auth?
        // no, user shouldn't get this far without an access token, show error
        console.log(
          "User has no Spotify token, user needs to authorise Spotify..."
        );
        return res.status(401).json({
          error: "User needs to authorise Spotify",
          requiresAuth: true,
        });
      }
      return res.status(401).json({ error: result.message });
    }

    const tokenData = result.data;

    // set token data on each request to ensure consistency
    spotifyApi.setAccessToken(tokenData.access_token);
    spotifyApi.setRefreshToken(tokenData.refresh_token);

    // if token is or nearly expired, refresh it
    if (isTokenExpired(tokenData)) {
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
