// src/services/user.service.js
const FirebaseService = require("./firebase.service");
const SpotifyService = require("./spotify.service");

class UserService {
  // High-level business operations
  static async saveSpotifyToken(userId, accessTokenData) {
    const tokenData = await {
      ...accessTokenData, // accessToken, refreshToken, expiresIn
      createdAt: new Date(),
      lastUpdated: new Date(),
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

    // Additional business logic after saving
    await this.updateUserLastActivity(userId);
  }

  static async updateSpotifyToken(userId, accessTokenData) {
    const tokenData = await {
      ...accessTokenData, // accessToken, refreshToken, expiresIn
      lastUpdated: new Date(),
    };
    // Use FirebaseService for the actual database operation
    await FirebaseService.setDocument("users", userId, {
      spotify: tokenData,
    });

    // Additional business logic after saving
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
      lastActivity: new Date(),
    });
  }
}

module.exports = UserService;
