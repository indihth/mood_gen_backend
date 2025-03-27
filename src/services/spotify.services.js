const { spotifyApi } = require("../config/spotify.config");
// CIRCULAR DEPENDENCY WARNING: Importing UserService while it imports SpotifyService
const UserService = require("./user.services");

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

  // get user profile
  static async getUserProfile() {
    try {
      const data = await spotifyApi.getMe();

      if (!data) {
        throw new Error("No user profile found");
      }

      const userProfile = {
        display_name: data.body.display_name,
        product: data.body.product, // premium or free account
      };
      console.log("User profile: ", userProfile);

      return userProfile;
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw new Error("Failed to get user profile");
    }
  }

  static async getRecentHistory(time_range = "short_term") {
    // NEED TO FETCH ALL PAGINATED DATA
    console.log("in createSession");
    try {
      // const data = await spotifyApi.getMyRecentlyPlayedTracks({
      const data = await spotifyApi.getMyTopTracks({
        time_range: time_range,
      });

      if (!data) {
        throw new Error("No recent history found");
      }

      const mappedData = data.body.items.map((track) => {
        return {
          trackId: track.id,
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
      throw new Error("Failed to fetch recent history");
    }
  }

  // throwing error: Route.get() requires a callback function but got a [object Undefined]
  static async getPlaylist(playlistId) {
    try {
      const playlist = await spotifyApi.getPlaylist(playlistId);

      const mappedData = {
        id: playlist.body.id,
        name: playlist.body.name,
        description: playlist.body.description,
        external_urls: playlist.body.external_urls,
        images: playlist.body.images,
        owner: {
          id: playlist.body.owner.id,
          display_name: playlist.body.owner.display_name,
        },
        tracks: {
          total: playlist.body.tracks.total,
          items: playlist.body.tracks.items,
        },
      };
      return mappedData;
    } catch (error) {
      console.error("Error getting playlist:", error.message);
      throw new Error("Failed to get playlist");
    }
  }

  static async createPlaylist(name, description, isPublic = true) {
    try {
      const playlist = await spotifyApi.createPlaylist(name, {
        description,
        public: isPublic,
      });
      return playlist.body;
    } catch (error) {
      console.error("Error creating playlist:", error.body.message);
      throw new Error("Failed to create playlist");
    }
  }

  static async addTracksToPlaylist(playlistId, tracks) {
    try {
      const result = await spotifyApi.addTracksToPlaylist(playlistId, tracks);
      return result.body;
    } catch (error) {
      console.error("Error adding tracks to playlist:", error);
      throw new Error("Failed to add tracks to playlist");
    }
  }
}

module.exports = SpotifyService;
