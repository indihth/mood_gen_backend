const { spotifyApi, scopes } = require("../config/spotify.config");
const SpotifyService = require("../services/spotify.services");
const TokenService = require("../services/token.services");
const UserService = require("../services/user.services");

const login = (req, res) => {
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
};

const callback = async (req, res) => {
  // Check if user is logged in
  let userId = req.session.uid;
  console.log("User ID:", userId);

  const error = req.query.error;

  if (error) {
    console.error("Callback Error:", error);
    res.send(`Callback Error: ${error}`);
    return;
  }

  try {
    // Get the access token from Spotify
    const accessTokenData = await TokenService.getAccessToken(req);

    // Save the token to Firestore
    await TokenService.saveSpotifyToken(userId, accessTokenData);

    // get Spotify displayName
    const spotifyUserProfile = await SpotifyService.getUserProfile();

    // store Spotify UserProfile in Firestore?
    await UserService.updateUsername(userId, spotifyUserProfile.display_name);
    console.log("Spotify User Profile:", spotifyUserProfile);

    // Redirects to mobile app with success message
    res.redirect(`spotifyauth://callback?success=true`);
  } catch (error) {
    console.error("Error getting Tokens:", error);

    // Redirects to mobile app with error message
    res.redirect(
      `spotifyauth://callback?error=${encodeURIComponent(error.toString())}`
    );
  }
};

/**
 * Get the user's top tracks from Spotify
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTopTracks = async (req, res) => {
  try {
    const data = await spotifyApi.getMyTopTracks({
      time_range: "short_term",
      limit: 20,
      offset: 0,
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

    res.json([...mappedData]);
  } catch (err) {
    console.error("Error fetching top tracks:", err);
    res.status(500).send(`Error fetching top tracks: ${err.message}`);
  }
};

const createPlaylist = async (req, res) => {
  try {
    const tracks = [
      "spotify:track:51eSHglvG1RJXtL3qI5trr",
      "spotify:track:4ZuIZH78dteLeq4KAApART",
      "spotify:track:3xkHsmpQCBMytMJNiDf3Ii",
    ];

    // collabroative playlist?
    // create empty playlist, returns snapshot id for playlist (needs userId)
    const playlist = await spotifyApi.createPlaylist("My playlist", {
      description: "My description",
      public: true,
    });
    const playlistId = playlist.body.id;
    console.log("Created playlist with id:", playlist);

    // add tracks to playlist, returns snapshot id for playlist
    const addedTracks = await spotifyApi.addTracksToPlaylist(
      playlistId,
      tracks
    );
    console.log("Added tracks to playlist:", addedTracks);

    // res.json({ playlistId, addedTracks });
  } catch (error) {
    console.error("Error creating playlist:", error);
    res.status(500).send(`Error creating playlist: ${error.message}`);
  }
};

const getPlaylist = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Playlist ID is required" });
    }
    const data = await SpotifyService.getPlaylist(id);

    if (!data) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    res.json(data.body);
  } catch (error) {
    console.error("Error fetching playlist:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  login,
  callback,
  getTopTracks,
  createPlaylist,
  getPlaylist,
};
