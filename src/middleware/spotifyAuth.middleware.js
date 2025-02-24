const { getFirestoreDb } = require("../services/firebaseServices");
const { spotifyApi } = require("../config/spotify.config");

// Helper function to get token from database
const getSpotifyToken = async (userId, db) => {
  try {
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      console.log(`No document found for user ${userId}`);
      return res
        .status(401)
        .json({ error: `No document found for user ${userId}` });
    }

    const userData = userDoc.data();

    if (!userData.spotify || !userData.spotify.access_token) {
      console.log(`User ${userId} has no Spotify token stored`);
      return res
        .status(401)
        .json({ error: `No Spotify foken found for user ${userId}` });
    }

    return userData.spotify;
  } catch (error) {
    console.error(`Error fetching Spotify token for user ${userId}:`, error);
    return res
      .status(401)
      .json({ error: `Error fetching Spotify token for user ${userId}:` });
  }
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
    // Ensure Firebase is initialized first
    const db = getFirestoreDb();

    // if Firebase db isn't initialized yet, initialize it
    if (!db) {
      console.log("Firestore DB not initialized, initializing now...");
      await initializeFirebaseApp(); // Re-initialize if needed
      db = getFirestoreDb();

      //  If it fails to initialize, return an error
      if (!db) {
        return res
          .status(500)
          .json({ error: "Failed to initialize Firestore DB" });
      }
    }
    // get the token data from Firestore
    const tokenData = await getSpotifyToken(userId, db);

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

// const spotifyAuthMiddleware = async (req, res, next) => {
//   try {
//     const db = getFirestoreDb();
//     if (!db) {
//       throw new Error("Firestore DB not initialized");
//     }

//     // Using hardcoded userId for testing
//     const userId = "50"; // Replace with actual user ID from session later

//     const userDoc = await db.collection("users").doc(userId).get();
//     if (!userDoc.exists) {
//       return res.status(401).json({ error: "No Spotify tokens found" });
//     }

//     const tokenData = userDoc.data();
//     spotifyApi.setAccessToken(tokenData.access_token);
//     spotifyApi.setRefreshToken(tokenData.refresh_token);

//     next();
//   } catch (error) {
//     console.error("Spotify Auth Middleware Error:", error);
//     res.status(500).json({ error: "Authentication failed" });
//   }
// };

module.exports = spotifyAuthMiddleware;
