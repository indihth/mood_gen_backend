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
      // Get user's listening history and profile data - Promise.all to run in parallel
      const [listeningHistory, userProfile] = await Promise.all([
        SpotifyService.getRecentHistory(),
        SpotifyService.getUserProfile(),
      ]);

      const sessionData = {
        sessionName: "Test Session",
        users: {
          [req.session.uid]: {
            displayName: userProfile.display_name,
            product: userProfile.product,
            // listeningHistory: [...listeningHistory],
            isAdmin: true,
            joinedAt: new Date(),
          },
        },
      };

      // Create main session document first and save a reference to it
      const sessionRef = await FirebaseService.setDocument(
        "sessions",
        "",
        sessionData
      );

      // Store listening history using user id as key
      const historyData = {
        ...listeningHistory,
      };

      // Add listening history to the session subcollection
      await FirebaseService.setDocumentInSubcollection(
        "sessions",
        sessionRef.id,
        "listeningHistory",
        req.session.uid,
        historyData
      );

      return res.json({
        message: "Successfully created session",
        session: sessionRef,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // // add user to session
  static async joinSession(req, res) {
    try {
      const sessionId = "eM4zvPgXFi0goK1XNnvq";
      const userId = req.session.uid;

      // Get the existing session data
      const sessionDoc = await FirebaseService.getDocument(
        "sessions",
        sessionId
      );
      if (!sessionDoc) {
        return res.status(404).json({ error: "Session not found" });
      }

      const [listeningHistory, userProfile] = await Promise.all([
        SpotifyService.getRecentHistory(),
        SpotifyService.getUserProfile(),
      ]);

      // Create update object with the new user data
      const newUserData = {
        [userId]: {
          // listeningHistory: listeningHistory,
          displayName: userProfile.display_name,
          product: userProfile.product,
          isAdmin: false,
          joinedAt: new Date(),
        },
      };

      // Store listening history using user id as key
      const historyData = {
        ...listeningHistory,
      };

      // Update the session document
      const updatedSessionDoc = await FirebaseService.addToDocument(
        "sessions",
        sessionId,
        newUserData,
        "users"
      );
      console.log("controller: session doc updated");

      // Add listening history to the session subcollection
      await FirebaseService.setDocumentInSubcollection(
        "sessions",
        sessionId,
        "listeningHistory",
        userId,
        historyData
      );

      return res.json({
        message: "Successfully joined session",
        session: updatedSessionDoc,
      });
    } catch (error) {
      console.error("Error joining session:", error);
      res.status(500).json({ error: error.message });
    }
  }

  static async createPlaylist(req, res) {
    try {
      const sessionId = "eM4zvPgXFi0goK1XNnvq";

      // Create the playlist
      const playlistData = await PlaylistSessionServices.createBasePlaylist(
        res,
        req
      );
      console.log("playlistData: ", playlistData);

      // Store the playlist data in Firestore session subcollection
      const playlistRef = await FirebaseService.setDocumentInSubcollection(
        "sesssions",
        sessionId,
        "shadow_playlist",
        "",
        playlistData
      );

      // console.log("playlistRef: ", playlistRef);

      return res.json({
        message: "Successfully created playlist",
        data: playlistData,
      });
    } catch (error) {
      console.error("Error creating playlist:", error.message);
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

  // Get session by Id
  static async getSession(req, res) {
    try {
      const { id } = req.params;
      const sessionData = await FirebaseService.getDocument("sessions", id);

      if (!sessionData) {
        return res.status(404).json({ error: "Session not found" });
      }

      return res.json({
        data: sessionData,
        message: "Get playlist session by ID",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getSessionUsers(req, res) {
    try {
      const { sessionId } = req.params;
      const sessionUsers = await PlaylistSessionServices.getSessionUsers(
        sessionId
      );

      if (!sessionUsers) {
        return res.status(404).json({ error: "Session not found" });
      }
      console.log("sessionUsers: ", sessionUsers);
      return res.json({
        data: sessionUsers,
        message: "Get session users",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = PlaylistSessionController;
