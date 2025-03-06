const { spotifyApi } = require("../config/spotify.config");
const FirebaseService = require("../services/firebase.service");
const SpotifyService = require("../services/spotify.service");

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
  // Example tracks to add to playlist - dynamic data can be passed in
  const tracks = [
    "spotify:track:51eSHglvG1RJXtL3qI5trr",
    "spotify:track:4ZuIZH78dteLeq4KAApART",
    "spotify:track:3xkHsmpQCBMytMJNiDf3Ii",
  ];

  try {
    // create new empty playlist
    const playlist = await SpotifyService.createPlaylist(
      "Alexandra's playlist",
      "Schuff"
    );

    // add tracks to playlist
    await SpotifyService.addTracksToPlaylist(playlist.id, tracks);

    // get the playlist data
    const playlistData = await SpotifyService.getPlaylist(playlist.id);
    console.log("Playlist data:", playlistData);

    res.json({ data: playlistData });
  } catch (error) {
    console.error("Error creating playlist:", error);
    res.status(500).send(`Error creating playlist: ${error.message}`);
  }
};

// get playlist by query id
const getPlaylist = async (req, res) => {
  try {
    const playlistId = req.query.id;
    const playlistData = await SpotifyService.getPlaylist(playlistId);
    res.json({ data: playlistData });
  } catch (error) {
    console.error("Error getting playlist:", error);
    res.status(500).send(`Error getting playlist: ${error.message}`);
  }
};

module.exports = {
  getTopTracks,
  createPlaylist,
  getPlaylist,
};
