const { spotifyApi } = require("../config/spotify.config");
const FirebaseService = require("../services/firebase.service");

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

module.exports = {
  getTopTracks,
};
