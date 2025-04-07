const { spotifyApi } = require("../config/spotify.config");
const FirebaseService = require("./firebase.services");

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

      await FirebaseService.updateDocument("users", userId, newTokenData);
      spotifyApi.setAccessToken(data.body["access_token"]);

      return newTokenData;
    } catch (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
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
}

module.exports = TokenService;
