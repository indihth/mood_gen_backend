// src/services/user.service.js
const FirebaseService = require("./firebase.services");
// CIRCULAR DEPENDENCY WARNING: Importing SpotifyService while it imports UserService
const SpotifyService = require("./spotify.services");

class UserService {
  // High-level business operations
  static async saveSpotifyToken(userId, accessTokenData) {
    // const userEmail = await FirebaseService.getUserEmail(userId);

    // Use FirebaseService for the actual database operation
    await FirebaseService.setDocument("users", userId, {
      spotify: accessTokenData,
      spotifyConnected: true,
      // email: userEmail,
    });
  }

  // const tokenData = await {
  //   ...accessTokenData, // accessToken, refreshToken, expiresIn
  //   created_at: new Date(),
  //   last_updated: new Date(),
  // };

  // Validate token format
  // if (!this.isValidSpotifyToken(tokenData)) {
  //   throw new Error("Invalid token format");
  // }

  static async updateSpotifyToken(req) {
    // CIRCULAR DEPENDENCY: This calls back to SpotifyService
    const tokenData = await SpotifyService.refreshAccessToken(req);
    // const tokenData = await {
    //   ...accessTokenData, // accessToken, expiresIn
    // };

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

  static async updateUserLastActivity(userId) {
    await FirebaseService.updateDocument("users", userId, {
      "spotify.last_updated": new Date(),
    });
  }
}

module.exports = UserService;
