const { spotifyApi } = require("../config/spotify.config");
const UserService = require("./user.service");

class SpotifyService {
  static async getAccessToken(code) {
    try {
      const data = await spotifyApi.authorizationCodeGrant(code);
      const tokenData = {
        access_token: data.body["access_token"],
        refresh_token: data.body["refresh_token"],
        expires_in: data.body["expires_in"],
      };

      spotifyApi.setAccessToken(tokenData.access_token);
      spotifyApi.setRefreshToken(tokenData.refresh_token);

      return tokenData; // This will now be the resolved value of the Promise
    } catch (error) {
      console.error("Error getting access token:", error);
      throw new Error("Failed to get access token");
    }
  }

  static async refreshAccessToken() {
    try {
      const data = await spotifyApi.refreshAccessToken();
      const tokenData = {
        access_token: data.body["access_token"],
        refresh_token: data.body["refresh_token"],
        expires_in: data.body["expires_in"],
      };

      // Save new access token to db
      await UserService.updateSpotifyToken(tokenData);

      // Set the new access token on the Spotify API instance
      spotifyApi.setAccessToken(tokenData.access_token);
      spotifyApi.setRefreshToken(tokenData.refresh);

      return tokenData;
    } catch (error) {
      console.error("Error refreshing access token:", error);
      throw new Error("Failed to refresh access token");
    }
  }
}

module.exports = SpotifyService;
