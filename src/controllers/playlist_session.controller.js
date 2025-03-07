const FirebaseService = require("../services/firebase.service");
const SpotifyService = require("../services/spotify.service");
const PlaylistSessionServices = require("../services/playlist_session.services");

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

  static async createPlaylist(req, res) {
    try {
      const sessionId = "JzIwwJr5UybGpWeK9aU5";
      const userId = req.session.uid;

      // Get the existing session data
      const sessionDoc = await FirebaseService.getDocument(
        "sessions",
        sessionId
      );
      if (!sessionDoc) {
        return res.status(404).json({ error: "Session not found" });
      }

      const listeningHistory =
        await PlaylistSessionServices.getAllListeningHistory(sessionId);

      return res.json({
        message: "Successfully get user listening history",
        listeningHistory: listeningHistory,
      });
    } catch (error) {
      console.error("Error getting user listening history from db:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // // add user to session
  static async joinSession(req, res) {
    try {
      const sessionId = "JzIwwJr5UybGpWeK9aU5";
      const userId = req.session.uid;

      // Get the existing session data
      const sessionDoc = await FirebaseService.getDocument(
        "sessions",
        sessionId
      );
      if (!sessionDoc) {
        return res.status(404).json({ error: "Session not found" });
      }

      const listeningHistory = await SpotifyService.getRecentHistory();

      // Create update object with the new user data
      const newUserData = {
        [`${userId}`]: {
          listeningHistory: listeningHistory,
          isAdmin: false,
          joinedAt: new Date(),
        },
      };

      // Update the session document
      await FirebaseService.addToDocument(
        "sessions",
        sessionId,
        newUserData,
        "users"
      );

      res.json({
        message: "Successfully joined session",
        sessionId: sessionId,
      });

      return;
    } catch (error) {
      console.error("Error joining session:", error);
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
}

module.exports = PlaylistSessionController;
