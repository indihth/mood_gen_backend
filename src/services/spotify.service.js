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
      console.log("access and refresh tokens set");

      return tokenData; // This will now be the resolved value of the Promise
    } catch (error) {
      console.error("Error getting access token:", error);
      throw new Error("Failed to get access token");
    }
  }

  static async refreshAccessToken() {
    const userId = "90"; // Hardcoded for now, will be dynamic later
    try {
      if (!spotifyApi.getRefreshToken()) {
        const tokenData = await UserService.getUserSpotifyTokenData(userId);
        const refreshToken = tokenData.data.refresh_token;
        spotifyApi.setRefreshToken(refreshToken);
        console.log("refresh token set in spotifyApi");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }
        // throw new Error("No refresh token available");
      }
      const data = await spotifyApi.refreshAccessToken();
      console.log(`refreshAccessToken data: ${data.body["access_token"]}`);

      const tokenData = {
        "spotify.access_token": data.body["access_token"],
        // 'spotify.refresh_token': data.body["refresh_token"],
        "spotify.expires_in": data.body["expires_in"],
      };

      // Set the new access token on the Spotify API instance
      // spotifyApi.setAccessToken(data.body["access_token"]);
      console.log("spotifyApi.getAccessToken: ", spotifyApi.getAccessToken());

      // Save new access token to db
      await UserService.updateSpotifyToken(userId, tokenData);

      // Verify the new access token saved in db
      const newTokenData = await UserService.getUserSpotifyTokenData(userId);
      console.log("newTokenData: ", newTokenData);

      return;
    } catch (error) {
      console.error("Error refreshing access token:", error);
      throw new Error("Failed to refresh access token");
    }
  }
}

module.exports = SpotifyService;
