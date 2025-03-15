const FirebaseService = require("../services/firebase.service");
const SpotifyService = require("../services/spotify.service");
const PlaylistSessionServices = require("../services/playlist_session.services");

class PlaylistSessionController {
  static async _mapTracksIds(tracks) {
    // "spotify:track:51eSHglvG1RJXtL3qI5trr",
    const trackIds = tracks.map((track) => `spotify:track:${track.id}`);

    return trackIds;
  }

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
      const { sessionId } = req.params;
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

  static async loadPlaylist(req, res) {
    const { sessionId } = req.params;
    let playlistData;

    try {
      // check if session already has a playlist
      const sessionDoc = await FirebaseService.getDocument(
        "sessions",
        sessionId
      );

      if (!sessionDoc) {
        return res.status(404).json({ error: "Session not found" });
      }

      if (sessionDoc.playlist.playlistId) {
        playlistData = await FirebaseService.getDocument(
          // fetch playlist data from db
          "playlist",
          sessionDoc.playlist.playlistId
        );
      } else {
        playlistData = await PlaylistSessionServices.createNewPlaylist(
          // create new playlist and save to db
          sessionId
        );
      }

      return res.json({
        message: "Successfully loaded playlist",
        data: playlistData,
      });
    } catch (error) {
      // Handle specific error types
      if (error.message === "No listening history found") {
        return res.status(404).json({
          error: "Cannot create playlist: No listening history found",
        });
      }

      if (error.message === "Session not found") {
        return res.status(404).json({ error: error.message });
      }

      console.error("Error creating playlist:", error);
      return res.status(500).json({
        error: "Failed to create playlist",
        details: error.message,
      });
    }
  }
  static async savePlaylistToSpotify(req, res) {
    try {
      const { sessionId } = req.params;

      // Get playlist id from session document
      const sessionDoc = await FirebaseService.getDocument(
        "sessions",
        sessionId
      );
      if (!sessionDoc) {
        return res.status(404).json({ error: "Session not found" });
      }

      console.log("sessionDoc.playlistId: ", sessionDoc.playlist.playlistId);

      // Get playlist data from playlist collection
      const playlistDoc = await FirebaseService.getDocument(
        "playlist",
        sessionDoc.playlist.playlistId
      );

      // Get tracks from playlist data - map to Spotify track id format
      const trackIds = playlistDoc.tracks.map(
        (track) => `spotify:track:${track.trackId}`
      );
      // console.log("trackIds: ", trackIds);

      // Create playlist on Spotify
      const playlist = await SpotifyService.createPlaylist(
        "West coast trip",
        "Our music for the 2025 Galway trip",
        true
      );

      const playlistId = playlist.id;

      // Save playlist to Spotify
      const tracksAdded = await SpotifyService.addTracksToPlaylist(
        playlistId,
        trackIds
      );
      console.log("tracksAdded: ", tracksAdded);

      return res.json({
        message: "Successfully saved playlist",
        data: playlistDoc,
      });
    } catch (error) {
      console.error("Error saving playlist - controller:", error.message);
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
