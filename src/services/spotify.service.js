const { spotifyApi } = require("../config/spotify.config");

class SpotifyService {
  static async getAccessToken(code) {
    // Implement Spotify token exchange logic
    spotifyApi.authorizationCodeGrant(code).then((data) => {
      const tokenData = {
        access_token: data.body["access_token"],
        refresh_token: data.body["refresh_token"],
        expires_in: data.body["expires_in"],
      };

      // set access tokens to the api object
      spotifyApi.setAccessToken(tokenData.access_token);
      spotifyApi.setRefreshToken(tokenData.refresh_token);

      return tokenData;
    });
    // return response.data.access_token;
  }

  static generateAuthUrl() {
    // Generate Spotify authorization URL
    return "https://accounts.spotify.com/authorize?...";
  }
}

module.exports = SpotifyService;
