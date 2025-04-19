const { spotifyApi } = require("../config/spotify.config");
const FirebaseService = require("./firebase.services");
const UserService = require("./user.services");

/**
 * Service class handling Spotify authentication token operations.
 * @class
 */
class TokenService {
  /**
   * Retrieves access token from Spotify and saves it to Firestore.
   * @static
   * @async
   * @param {string} code - The authorization code received from Spotify
   * @returns {Promise<Object>} Token data containing access_token, refresh_token, and expires_in
   * @throws {Error} When access token retrieval fails
   */
  static async getAccessToken(req) {
    try {
      const code = req.query.code;
      const userId = req.session.uid;

      const data = await spotifyApi.authorizationCodeGrant(code);
      const tokenData = {
        access_token: data.body["access_token"],
        refresh_token: data.body["refresh_token"],
        expires_in: data.body["expires_in"],
        created_at: new Date(),
        last_updated: new Date(),
      };

      spotifyApi.setAccessToken(tokenData.access_token);
      spotifyApi.setRefreshToken(tokenData.refresh_token);
      console.log("access and refresh tokens set");

      // save user email to Firestore - can remove later if not needed
      // const userEmail = await FirebaseService.getUserEmail(userId);

      // // Use FirebaseService for the actual database operation
      // await FirebaseService.setDocument("users", userId, {
      //   spotify: tokenData,
      //   spotifyConnected: true,
      //   // email: userEmail,
      // });

      return tokenData;
    } catch (error) {
      console.error("Error getting access token:", error);
      throw new Error("Failed to get access token");
    }
  }

  static async saveSpotifyToken(userId, accessTokenData) {
    // Use FirebaseService for the actual database operation
    // changed to 'updateDocument' to avoid overwriting existing data
    await FirebaseService.updateDocument("users", userId, {
      spotify: accessTokenData,
      spotifyConnected: true,
      // email: userEmail,
    });
  }

  /**
   * Refreshes the Spotify access token using stored refresh token and updates Firestore.
   * @static
   * @async
   * @param {string} userId - User identifier for token refresh
   * @returns {Promise<Object>} Updated token data
   * @throws {Error} When refresh token is not available or refresh operation fails
   */
  static async refreshSpotifyToken(userId) {
    try {
      const tokenData = await FirebaseService.getDocument("users", userId);
      if (!tokenData?.spotify?.refresh_token) {
        throw new Error("No refresh token available");
      }

      spotifyApi.setRefreshToken(tokenData.spotify.refresh_token);
      const data = await spotifyApi.refreshAccessToken();

      const newTokenData = {
        "spotify.access_token": data.body["access_token"],
        "spotify.expires_in": data.body["expires_in"],
        "spotify.last_updated": new Date(),
      };

      const dbUpdate = await FirebaseService.updateDocument(
        "users",
        userId,
        newTokenData
      );

      // To test if db update was successful - TODO
      // if (dbUpdate.error?.message) {
      //   throw new Error("Failed to update Firestore with new token data");
      // }

      spotifyApi.setAccessToken(data.body["access_token"]);

      return newTokenData;
    } catch (error) {
      // Handle specific Spotify Web API errors
      if (error.statusCode) {
        throw new Error(
          `Token refresh failed - Spotify API Error (${error.statusCode}): ${error.message}`
        );
      }
      throw new Error(`Token refresh failed - ${error.message}`);
    }
  }

  /**
   * Retrieves Spotify token data from Firestore for a specific user.
   * @static
   * @async
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} User's Spotify token data from Firestore
   */
  // static async getSpotifyTokenData(userId) {
  //   return await FirebaseService.getDocument("users", userId);
  // }

  static async getSpotifyTokenData(userId) {
    try {
      const userData = await FirebaseService.getDocument("users", userId);

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

  static async updateSpotifyToken(req) {
    // CIRCULAR DEPENDENCY: This calls back to SpotifyService
    const tokenData = await SpotifyService.refreshAccessToken(req);

    // Use FirebaseService for the actual database operation
    await FirebaseService.updateDocument("users", userId, {
      ...tokenData,
    });

    // update 'last_updated' field to reflect time of changes
    await UserService.updateUserLastActivity(userId);
  }
}

module.exports = TokenService;
