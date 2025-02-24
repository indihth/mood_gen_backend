const { spotifyApi } = require("../config/spotify.config");

class SpotifyService {
  static async getAccessToken(code) {
    // Return the promise chain
    return spotifyApi.authorizationCodeGrant(code).then((data) => {
      const tokenData = {
        access_token: data.body["access_token"],
        refresh_token: data.body["refresh_token"],
        expires_in: data.body["expires_in"],
      };

      spotifyApi.setAccessToken(tokenData.access_token);
      spotifyApi.setRefreshToken(tokenData.refresh_token);

      return tokenData; // This will now be the resolved value of the Promise
    });
  }

  static generateAuthUrl() {
    // Generate Spotify authorization URL
    return "https://accounts.spotify.com/authorize?...";
  }
}

module.exports = SpotifyService;
