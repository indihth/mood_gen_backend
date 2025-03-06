const FirebaseService = require("../services/firebase.service");
const SpotifyService = require("../services/spotify.service");

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

  static async createSession(req, res) {
    try {
      const listeningHistory = await SpotifyService.getRecentHistory();

      const sessionData = {
        users: {
          [req.session.uid]: {
            listeningHistory: [...listeningHistory],
            isAdmin: true,
            joinedAt: new Date(),
          },
        },
      };

      // Get playlist sessions data from Firestore
      const session = await FirebaseService.setDocument(
        "sessions",
        "",
        sessionData
      );

      res.json({ data: session, message: "New playlist session created" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // add user to session
  static async joinSession(req, res) {
    const sessionId = "M4Lh2v3rwexpoWBVU5Bd"; // hardcoded for now

    try {
      const listeningHistory = await SpotifyService.getRecentHistory();

      const sessionData = {
        users: {
          [req.session.uid]: {
            listeningHistory: [...listeningHistory],
            isAdmin: false,
            joinedAt: new Date(),
          },
        },
      };

      // Get playlist sessions data from Firestore
      const session = await FirebaseService.updateDocument(
        "sessions",
        sessionId,
        sessionData
      );

      res.json({ data: session, message: "Get playlist sessions" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getSessions(req, res) {
    try {
      // Get playlist sessions data from Firestore
      const sessionData = await FirebaseService.getCollection("sessions");

      console.log("sessionData", sessionData);
      res.json({ data: sessionData, message: "Get playlist sessions" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getRecentHistory(req, res) {
    try {
      // const data = await spotifyApi.getMyRecentlyPlayedTracks({
      const data = await spotifyApi.getMyTopTracks({
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
