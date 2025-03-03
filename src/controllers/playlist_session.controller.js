class PlaylistSessionController {
  static async getUserData(req, res) {
    try {
      res.json({
        userId: req.session.uid,
        message: "Playlist session user data",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getSessions(req, res) {
    try {
      // Add your session fetching logic here
      res.json({ message: "Get playlist sessions" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getRecentHistory(req, res) {
    try {
      const data = await spotifyApi.getMyRecentlyPlayedTracks({
        limit: 20,
      });

      const mappedData = data.body.items.map((track) => {
        return {
          id: track.track.id,
          artistName: track.track.artists[0].name,
          songName: track.track.name,
          albumName: track.track.album.name,
          albumArtworkUrl: track.track.album.images[0].url,
        };
      });

      res.json([...mappedData]);
    } catch (err) {
      console.error("Error fetching recent history:", err);
      res.status(500).send(`Error fetching recent history: ${err.message}`);
    }
  }
}

module.exports = PlaylistSessionController;
