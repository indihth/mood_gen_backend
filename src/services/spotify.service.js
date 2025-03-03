const { spotifyApi } = require("../config/spotify.config");
// CIRCULAR DEPENDENCY WARNING: Importing UserService while it imports SpotifyService
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

  static async refreshAccessToken(req) {
    const userId = req.session.uid; // Hardcoded for now, will be dynamic later
    try {
      if (!spotifyApi.getRefreshToken()) {
        // CIRCULAR DEPENDENCY: This calls back to UserService
        const tokenData = await UserService.getSpotifyTokenData(userId);
        const refreshToken = tokenData.data.refresh_token;
        spotifyApi.setRefreshToken(refreshToken);
        console.log("refresh token set in spotifyApi");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }
        // throw new Error("No refresh token available");
      }
      const data = await spotifyApi.refreshAccessToken();

      const tokenData = {
        "spotify.access_token": data.body["access_token"],
        "spotify.expires_in": data.body["expires_in"],
      };

      // Set the new access token on the Spotify API instance
      spotifyApi.setAccessToken(data.body["access_token"]);
      console.log("spotifyApi.getAccessToken: ", spotifyApi.getAccessToken());

      // Save new access token to db - move to middleware?
      // await UserService.updateSpotifyToken(userId, tokenData);

      return tokenData;
    } catch (error) {
      console.error("Error refreshing access token:", error);
      throw new Error("Failed to refresh access token");
    }
  }

  static async getRecentHistory() {
    try {
      // const data = await spotifyApi.getMyRecentlyPlayedTracks({
      const data = await spotifyApi.getMyTopTracks({
        limit: 20,
      });

      const mappedData = data.body.items.map((track) => {
        return {
          id: track.id,
          artistName: track.artists[0].name,
          songName: track.name,
          albumName: track.album.name,
          albumArtworkUrl: track.album.images[0].url,
        };
      });

      return mappedData;
      // res.json([...mappedData]);
    } catch (err) {
      console.error("Error fetching recent history:", err);
      res.status(500).send(`Error fetching recent history: ${err.message}`);
    }
  }
}

module.exports = SpotifyService;
