const admin = require("firebase-admin");
const FirebaseService = require("./firebase.services");
const SpotifyService = require("./spotify.services");
const PlaylistSessionServices = require("./playlist_session.services");

class PlaylistSessionService {
  // Create a new playlist session
  static async createPlaylistSession() {
    // Create a new playlist session
    // Return the playlist session ID
  }

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

  static async _getListeningHistoryByUserId(sessionId, userId) {
    const listeningHistoryDoc = await FirebaseService.getSubcollectionDocument(
      "sessions",
      sessionId,
      "listeningHistory",
      userId
    );
    if (!listeningHistoryDoc) {
      throw new Error("Listening history document not found for user");
    }
    // get the listening history for the user
    const listeningHistory = listeningHistoryDoc.tracks;
    if (!listeningHistory) {
      throw new Error("No listening history tracks found for user");
    }

    // convert the listening history object to an array of tracks
    const tracks = Object.values(listeningHistory).slice(0, 10); // Get the first 10 tracks
    // const tracks = Object.values(listeningHistory); // Get all tracks

    // shuffle the tracks
    const shuffledTracks = this._shuffleTracks(tracks);

    // add voting fields to tracks
    const tracksWithVoting = this._addVotingToTracks(
      [shuffledTracks],
      [userId]
    );

    // flatten the tracks array
    const flattenedTracks = tracksWithVoting.reduce((acc, track) => {
      acc[track.id] = {
        ...track,
      };
      return acc;
    }, {});

    return flattenedTracks;
  }

  // get all users listening history from a playlist session
  static async _getAllListeningHistory(sessionId) {
    const listeningHistoryDocs = await FirebaseService.getSubcollection(
      "sessions",
      sessionId,
      "listeningHistory"
    );

    if (!listeningHistoryDocs || listeningHistoryDocs.length === 0) {
      throw new Error("No listening history found");
    }

    let allTracks = [];

    const combinedTracks = {};
    const combinedTrackOrder = [];

    allTracks = listeningHistoryDocs.map((user) => ({
      id: user.id,
      // tracks: user.tracks.slice(0, 10), // should work bc no longer object?
      // tracks: user.tracks, // include all for now
      tracks: Object.values(user.tracks).slice(0, 10), // convert object to array, get first 10 tracks
    }));

    // combine all tracks from each user into a single array
    const justTracks = allTracks.reduce((acc, user) => {
      return acc.concat(user.tracks).splice(0, 20);
    }, []);

    const shuffledTracks = this._shuffleTracks(justTracks);

    return shuffledTracks;
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
    const listeningHistory = await this._getAllListeningHistory(sessionId);

    const userIds = await this._getPlaylistSessionUsers(sessionId);

    // add voting to tracks
    const tracksWithVoting = this._addVotingToTracks(listeningHistory, userIds);

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

  static async getUserDataAndHistory(userId, isAdmin = false) {
    const [listeningHistory, userProfile] = await Promise.all([
      SpotifyService.getRecentHistory(),
      SpotifyService.getUserProfile(),
    ]);

    const userData = {
      [userId]: {
        userId,
        displayName: userProfile.display_name,
        product: userProfile.product,
        isAdmin,
        joinedAt: new Date(),
      },
    };

    const historyData = {
      ...listeningHistory,
    };

    return { userData, historyData };
  }
}

module.exports = PlaylistSessionService;
