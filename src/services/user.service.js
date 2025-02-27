// src/services/user.service.js
const FirebaseService = require("./firebase.service");
const SpotifyService = require("./spotify.service");

class UserService {
  // High-level business operations
  static async saveSpotifyToken(userId, accessTokenData) {
    const tokenData = await {
      ...accessTokenData, // accessToken, refreshToken, expiresIn
      createdAt: new Date(),
      last_updated: new Date(),
    };
    // console.log("accessTokenData UserService: ", accessTokenData);

    // Validate token format
    // if (!this.isValidSpotifyToken(tokenData)) {
    //   throw new Error("Invalid token format");
    // }

    // Use FirebaseService for the actual database operation
    await FirebaseService.setDocument("users", userId, {
      spotify: tokenData,
    });
  }

  static async updateSpotifyToken(userId, accessTokenData) {
    const tokenData = await {
      ...accessTokenData, // accessToken, expiresIn
    };
    // Use FirebaseService for the actual database operation
    await FirebaseService.updateDocument("users", userId, {
      ...tokenData,
    });

    // update 'last_updated' field to reflect time of changes
    await this.updateUserLastActivity(userId);
  }

  //   static async getUserProfile(userId) {
  //     // Fetch user data
  //     const userData = await FirebaseService.getDocument('users', userId);

  //     // Enrich with additional data if needed
  //     if (userData?.spotify?.accessToken) {
  //       const spotifyProfile = await SpotifyService.getProfile(userData.spotify.accessToken);
  //       userData.spotifyProfile = spotifyProfile;
  //     }

  //     return userData;
  //   }

  //   private static isValidSpotifyToken(tokenData) {
  //     return tokenData.accessToken &&
  //            tokenData.createdAt &&
  //            tokenData.lastUpdated;
  //   }

  static async getUserSpotifyTokenData(userId) {
    try {
      const userDoc = await FirebaseService.getDocument("users", userId);
      // const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc) {
        console.log(`No document found for user ${userId}`);

        // must return an object and not res.status() directly, helper function doens't have access to res
        return {
          error: true,
          message: `No document found for user ${userId}`,
        };
      }

      const userData = userDoc;

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
  }

  static async updateUserLastActivity(userId) {
    await FirebaseService.updateDocument("users", userId, {
      "spotify.last_updated": new Date(),
    });
  }
}

module.exports = UserService;
