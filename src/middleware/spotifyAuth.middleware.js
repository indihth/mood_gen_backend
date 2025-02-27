const { getFirestoreDb } = require("../services/firebaseServices");
const { spotifyApi, scopes } = require("../config/spotify.config");
const SpotifyService = require("../services/spotify.service");

// Helper function to get token from database
const getSpotifyToken = async (userId, db) => {
  try {
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      console.log(`No document found for user ${userId}`);

      // must return an object and not res.status() directly, helper function doens't have access to res
      return {
        error: true,
        message: `No document found for user ${userId}`,
      };
    }

    const userData = userDoc.data();

    if (!userData.spotify || !userData.spotify.access_token) {
      console.log(`User ${userId} has no Spotify token stored`);
      return {
        error: true,
        message: `No Spotify token found for user ${userId}`,
        requiresAuth: true, // indicates if the user needs to authenticate - no token exists
      };
    }

    // return the token data
    return {
      error: false,
      data: userData.spotify,
    };
  } catch (error) {
    console.error(`Error fetching Spotify token for user ${userId}:`, error);
    return {
      error: true,
      message: `Error fetching Spotify token for user ${userId}: ${error.message}`,
    };
  }
};

const isTokenExpired = (tokenData) => {
  const now = new Date();
  const expiryDate = new Date(tokenData.expires_at);

  return now >= expiryDate;
};

const spotifyAuthMiddleware = async (req, res, next) => {
  // If access token is already set, move to next middleware
  if (spotifyApi.getAccessToken()) {
    console.log("spotify middleware skipped!");
    return next();
  }
  // temp hardcoded for testing - update with firestore auth id later
  const userId = "50";

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
    const result = await getSpotifyToken(userId, db);

    if (result.error) {
      if (result.requiresAuth) {
        // if the error is because user has no token, redirect to Spotify auth
        return res.redirect(spotifyApi.createAuthorizeURL(scopes));
      }
      return res.status(401).json({ error: result.message });
    }

    const tokenData = result.data;

    // if token is expired, refresh it
    if (isTokenExpired(tokenData)) {
      console.log("Token expired, refreshing...");

      // refreshes token and set to instance
      await SpotifyService.refreshAccessToken();

      // update the token in Firestore
      await db.collection("users").doc(userId).update({
        spotify: tokenData,
      });
    }

    // sets the data to spotifyApi instance
    spotifyApi.setAccessToken(tokenData.access_token);
    spotifyApi.setRefreshToken(tokenData.refresh_token);
    console.log(
      `Completed spotify middleware!, access_token: ${spotifyApi.getAccessToken()}`
    );

    next();
  } catch (error) {
    console.error("Spotify Auth Middleware Error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
};

module.exports = spotifyAuthMiddleware;
