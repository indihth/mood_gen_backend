const admin = require("firebase-admin");
const FirebaseService = require("./firebase.services");
const SpotifyService = require("./spotify.services");
const PlaylistSessionServices = require("./playlist_session.services");
const UserService = require("./user.services");

class PlaylistSessionService {
  // Get playlist session userIds
  static async _getPlaylistSessionUsers(sessionId) {
    // Get the playlist session document
    const sessionDoc = await FirebaseService.getDocument("sessions", sessionId);
    if (!sessionDoc) {
      throw new Error("Session not found");
    }

    // Extracts the values from the users object and returns an array of userIds
    const userIds = Object.values(sessionDoc.users).map((user) => user.userId);

    return userIds;
  }

  static _shuffleTracks(tracks) {
    // TODO: evenly distribute songs
    // mix up the songs
    const shuffledTracks = tracks.sort(() => Math.random() - 0.5);

    // Fisher-Yates shuffle - impliment later
    // for (let i = shuffledTracks.length - 1; i > 0; i--) {
    //   const j = Math.floor(Math.random() * (i + 1));
    //   [shuffledTracks[i], shuffledTracks[j]] = [shuffledTracks[j], shuffledTracks[i]];
    // }
    return shuffledTracks;
  }

  static _addVotingToTracks(tracks, userIds) {
    // iterate over userIds array and adds fields with userId as key to track votes
    const votedBy = userIds.reduce((acc, userId) => {
      acc[userId] = {
        upVoted: false,
        downVoted: false,
      };
      return acc;
    }, {});

    // add voting fields to each track
    return tracks.map((track) => {
      return {
        ...track,
        upVotes: 0,
        downVotes: 0,
        votedBy,
      };
    });
  }

  // Create base playlist
  static async _createTrackList(sessionId) {
    const sessionDoc = await FirebaseService.getDocument("sessions", sessionId);
    if (!sessionDoc) {
      throw new Error("Session not found");
    }
    const tracks = await UserService.getAllListeningHistory(sessionId);

    // shuffle the tracks
    const shuffledTracks = PlaylistSessionService._shuffleTracks(tracks);

    const userIds = await this._getPlaylistSessionUsers(sessionId);

    // add voting to tracks
    const tracksWithVoting = this._addVotingToTracks(shuffledTracks, userIds);

    // create flattened array of objects, .reduce instead of .map
    const flattenedTracks = tracksWithVoting.reduce((acc, track) => {
      acc[track.id] = {
        ...track,
      };
      return acc;
    }, {});

    const trackListData = {
      title: sessionDoc.sessionName,
      description: sessionDoc.description,
      tracks: flattenedTracks,
    };

    return trackListData;
  }

  static async _addPlaylistToSessionDoc(sessionId, playlistId) {
    const sessionDoc = await FirebaseService.getDocument("sessions", sessionId);
    if (!sessionDoc) {
      throw new Error("Session not found");
    }

    const updatedSessionDoc = await FirebaseService.updateDocument(
      "sessions",
      sessionId,
      { playlistId } // Store as top-level field
    );

    return updatedSessionDoc;
  }

  static async createNewPlaylist(sessionId) {
    // Create the playlist
    const playlistData = await this._createTrackList(sessionId);

    // Store playlist data in the playlist collection
    const addedPlaylistDoc = await FirebaseService.setDocument(
      "playlists",
      "",
      playlistData
    );

    // Add playlist ID to the session document
    await this._addPlaylistToSessionDoc(sessionId, addedPlaylistDoc.id);

    return addedPlaylistDoc;
  }

  // Remove downvoted tracks from the playlist
  static async removeDownvotedTracks(playlistDoc) {
    if (playlistDoc === null) {
      throw new Error("Playlist not found");
    }
    // Store remaining songs
    let votedTracks = {};

    // Remove downvoted tracks from the playlist
    Object.entries(playlistDoc.tracks).forEach(([trackId, track]) => {
      // Calculate overall votes (upvotes - downvotes)
      const totalVotes = track.upVotes - track.downVotes;

      // If the track has more upvotes or equal votes, keep it in the playlist
      if (totalVotes >= 0) {
        votedTracks[trackId] = track;
      }
    });

    return votedTracks;
  }

  static async getSessionUsers(sessionId) {
    const sessionDoc = await FirebaseService.getDocument("sessions", sessionId);
    if (!sessionDoc) {
      return null;
    }

    return sessionDoc;
  }

  // add user (host or guest) to session with their listening history
  static async addUserToSession(sessionId, userId, isHost = false) {
    try {
      // get user data and listening history
      const { userData, historyData } = await UserService.getUserDataAndHistory(
        userId,
        isHost
      );

      // update the session document
      await FirebaseService.addToDocument(
        "sessions",
        sessionId,
        userData,
        "users"
      );

      // add listening history to the session subcollection
      await FirebaseService.setDocumentInSubcollection(
        "sessions",
        sessionId,
        "listeningHistory",
        userId,
        historyData
      );

      // get updated session data
      const sessionDoc = await FirebaseService.getDocument(
        "sessions",
        sessionId
      );

      return {
        userData,
        sessionData: {
          sessionName: sessionDoc.sessionName,
          description: sessionDoc.description,
          hostDisplayName:
            sessionDoc.users[sessionDoc.hostId]?.displayName || "Unknown Host",
        },
      };
    } catch (error) {
      console.error("Error adding user to session:", error);
      throw new Error(`Failed to add user to session: ${error.message}`);
    }
  }
}

module.exports = PlaylistSessionService;
