const FirebaseService = require("../services/firebase.services");
const SpotifyService = require("../services/spotify.services");
const PlaylistSessionServices = require("../services/playlist_session.services");
const session = require("express-session");
const UserService = require("../services/user.services");

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

  // Create a new session
  static async createSession(req, res) {
    try {
      const { title, description } = req.body;
      const userId = req.session.uid;

      // first create the session document
      const sessionData = {
        status: "waiting", // starts as 'waiting', can be 'active' or 'ended'
        sessionName: title,
        description,
        hostId: userId,
        users: {}, // empty initially, filled when a user is added
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // create the session document
      const sessionRef = await FirebaseService.setDocument(
        "sessions",
        "",
        sessionData
      );

      const sessionId = sessionRef.id;

      // add user to playlist session - extract user and updatedSession data from response
      const { userData } = await PlaylistSessionServices.addUserToSession(
        sessionId,
        userId,
        true // set user as host
      );

      const newSessionData = {
        sessionId,
        status: "waiting",
        sessionName: title,
        description,
        hostDisplayName: userData[userId].displayName,
      };

      return res.json({
        message: "Successfully created session",
        session: newSessionData,
      });
    } catch (error) {
      console.log("Error creating session:", error);
      res.status(500).json({ error: error.message });
      throw new Error("Failed to create session", error);
    }
  }

  // Join an existing session
  static async joinSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.session.uid;

      // Check if session exists
      const sessionDoc = await FirebaseService.getDocument(
        "sessions",
        sessionId
      );

      if (!sessionDoc) {
        return res.status(404).json({ error: "Session not found" });
      }

      // add user to playlist session
      const { sessionData } = await PlaylistSessionServices.addUserToSession(
        sessionId,
        userId,
        false // User is not host
      );

      return res.json({
        message: "Successfully joined session",
        session: sessionData,
      });
    } catch (error) {
      console.error("Error joining session:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Update session status (waiting, active, ended)
  static async updateSessionStatus(req, res) {
    try {
      const { sessionId } = req.params;
      const { status } = req.body; // status: waiting, active, ended

      const sessionDoc = await FirebaseService.getDocument(
        "sessions",
        sessionId
      );

      if (!sessionDoc) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Update status in session document
      const updatedSessionDoc = await FirebaseService.updateDocument(
        "sessions",
        sessionId,
        { status }
      );

      // if ending session, save top track image to playlist document
      if (status === "ended") {
        const playlistDoc = await FirebaseService.getDocument(
          "playlists",
          sessionDoc.playlistId
        );

        const topTrackImageUrl = await UserService.getTopTrackImageUrl(
          playlistDoc.tracks
        );

        // store playlist image in sesson document
        const updatedPlaylistDoc = await FirebaseService.updateDocument(
          "sessions",
          sessionId,
          { topTrackImageUrl }
        );
      }

      return res.json({
        message: "Successfully updated session status",
        sessionId,
        status,
      });
    } catch (error) {
      console.error("Error updating session status:", error);
      res.status(500).json({ error: error.message });
    }
  }

  // Create a new playlist for the session or load an existing one
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

      if (!sessionDoc.playlistId || sessionDoc.playlistId === undefined) {
        // if none, create new playlist and save to db
        console.log("Creating new playlist... didn't exist");
        playlistData = await PlaylistSessionServices.createNewPlaylist(
          sessionId
        );
      } else {
        // get from db
        playlistData = await FirebaseService.getDocument(
          "playlists",
          sessionDoc.playlistId
        );
      }
      console.log("playlistData: ", playlistData.id);

      return res.json({
        message: "Successfully loaded playlist",
        data: { playlistId: playlistData.id }, // frontend getting data from db, only needs id
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

  // Update playlist with new listening history
  static async joinSessionLate(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.session.uid; // Get user ID from session

      // update session document with new user data
      const sessionDoc = await FirebaseService.getDocument(
        "sessions",
        sessionId
      );

      if (!sessionDoc) {
        return res.status(404).json({ error: "Session not found" });
      }

      // add user to session
      const { sessionData } = await PlaylistSessionServices.addUserToSession(
        sessionId,
        userId,
        false
      );

      // update the playlist
      await PlaylistSessionServices.updatePlaylistWithUserHistory(
        sessionId,
        userId
      );

      const updatedSessionData = {
        ...sessionData,
        playlistId: sessionDoc.playlistId, // include playlistId for frontend
      };
      console.log("updatedSessionData: ", updatedSessionData);
      return res.json({
        message: "Successfully updated session playlist with new user data",
        session: updatedSessionData,
      });
    } catch (error) {
      console.error("Error updating playlist:", error);

      // Handle specific error types
      if (error.message.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }

      return res.status(500).json({ error: error.message });
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

      if (!sessionDoc.sessionName || !sessionDoc.description) {
        return res
          .status(400)
          .json({ error: "Session name and description are required" });
      }

      console.log("sessionDoc.playlistId: ", sessionDoc.playlistId);

      // Get playlist data from playlist collection
      const playlistDoc = await FirebaseService.getDocument(
        "playlists",
        sessionDoc.playlistId
      );

      // Remove downvoted tracks from the playlist
      const votedTracks = await PlaylistSessionServices.removeDownvotedTracks(
        playlistDoc
      );

      console.log("votedTracks: ", votedTracks);

      // Get tracks from playlist data - convert object to array and use only the keys (ids)
      const trackIds = Object.keys(votedTracks).map(
        (trackId) => `spotify:track:${trackId}`
      );
      console.log("trackIds: ", trackIds);

      console.log("sessionDoc.sessionName: ", sessionDoc.sessionName);
      console.log("sessionDoc.description: ", sessionDoc.description);

      // Create playlist on Spotify
      const playlist = await SpotifyService.createPlaylist(
        sessionDoc.sessionName,
        sessionDoc.description,
        true
      );

      const playlistId = playlist.id;

      // Remove tracks voted off by users (2 more downvotes than upvotes)
      // const votedTracks

      // Save playlist to Spotify
      const tracksAdded = await SpotifyService.addTracksToPlaylist(
        playlistId,
        trackIds
      );
      console.log("tracksAdded: ", tracksAdded);

      return res.json({
        message: "Successfully saved playlist",
        // data: playlistDoc,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
      return console.error(
        "Error saving playlist - controller:",
        error.message
      );
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
