const FirebaseService = require("./firebase.services");
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

  static async _addVotingStructureToTracks(sessionId, tracks) {
    try {
      // Get all userIds in the session
      const userIds = await this._getPlaylistSessionUsers(sessionId);

      // Add voting fields to each track
      return Object.entries(tracks).reduce((acc, [trackId, track]) => {
        // if they don't already exist, set vote fiels to 0
        const existingUpVotes = track.upVotes || 0;
        const existingDownVotes = track.downVotes || 0;

        // preserve existing votedBy structure if it exists, otherwise create a new one
        let votedBy = track.votedBy || {};

        // add voteBy fields for each userId
        userIds.forEach((userId) => {
          if (!votedBy[userId]) {
            // exclude existing users - don't overwrite their votes
            votedBy[userId] = {
              upVoted: false,
              downVoted: false,
            };
          }
        });

        // add other track fields and voting structure together and return
        acc[trackId] = {
          ...track,
          upVotes: existingUpVotes,
          downVotes: existingDownVotes,
          votedBy,
        };
        return acc;
      }, {});
    } catch (error) {
      console.error("Error adding voting structure to tracks:", error);
      throw new Error(`Failed to add voting structure: ${error.message}`);
    }
  }

  static async _createTrackList(sessionId) {
    const sessionDoc = await FirebaseService.getDocument("sessions", sessionId);
    if (!sessionDoc) {
      throw new Error("Session not found");
    }
    const tracks = await UserService.getAllListeningHistory(sessionId);

    // shuffle the tracks
    const shuffledTracks = this._shuffleTracks(tracks);

    // add the voting structure to the tracks
    const tracksWithVoting = await this._addVotingStructureToTracks(
      sessionId,
      shuffledTracks
    );

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

  static _filterUniqueNewTracks(newTracks, existingTracks) {
    // filter out tracks that already exist in the existingTracks object
    const uniqueNewTracks = Object.entries(newTracks).reduce(
      (acc, [trackId, track]) => {
        if (!existingTracks[trackId]) {
          // if the track doesn't exist in existingTracks, add it
          acc[trackId] = track;
        }
        return acc;
      },
      {}
    );

    // console.log("uniqueNewTracks:", uniqueNewTracks);

    return uniqueNewTracks;
  }

  static async _processUserTracks(sessionId, userId, skipVoting = false) {
    // get listening history of user
    const listeningHistory = await UserService.getListeningHistoryByUserId(
      sessionId,
      userId
    );

    if (!listeningHistory) {
      throw new Error("No listening history found for user");
    }

    // process the listening history
    const tracks = Object.values(listeningHistory);
    const shuffledTracks = this._shuffleTracks(tracks);

    // convert to flat object structure with track ID as key
    const tracksMap = shuffledTracks.reduce((acc, track) => {
      acc[track.id] = track;
      return acc;
    }, {});

    // Skip adding voting structure if flag is set
    if (skipVoting) {
      return tracksMap;
    }

    // Add voting structure if needed
    return await this._addVotingStructureToTracks(sessionId, tracksMap);
  }

  static async createNewPlaylist(sessionId) {
    // Create the playlist
    // const playlistData = await this._createTrackList(sessionId);

    const sessionDoc = await FirebaseService.getDocument("sessions", sessionId);
    if (!sessionDoc) {
      throw new Error("Session not found");
    }

    // get tracks from all users
    const userIds = await this._getPlaylistSessionUsers(sessionId);

    const allTracks = await Promise.all(
      userIds.map((userId) => this._processUserTracks(sessionId, userId))
    );

    // merge all user tracks
    const mergedTracks = allTracks.reduce(
      (acc, userTracks) => ({
        ...acc,
        ...userTracks,
      }),
      {}
    );

    const playlistData = {
      title: sessionDoc.sessionName,
      description: sessionDoc.description,
      tracks: mergedTracks,
    };

    // store playlist data
    const addedPlaylistDoc = await FirebaseService.setDocument(
      "playlists",
      "",
      playlistData
    );

    // add playlist ID to the session document
    await this._addPlaylistToSessionDoc(sessionId, addedPlaylistDoc.id);

    return addedPlaylistDoc;
  }

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

      // update user document with sessionId
      await FirebaseService.updateArrayField(
        "users",
        userId,
        "sessionIds",
        sessionId
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

  // Update playlist with new tracks from a user's listening history
  static async updatePlaylistWithUserHistory(sessionId, userId) {
    try {
      const sessionDoc = await FirebaseService.getDocument(
        "sessions",
        sessionId
      );

      // Check if the session has a playlistId
      if (!sessionDoc.playlistId) {
        throw new Error("PlaylistId not found");
      }

      // Get the playlist data
      const playlistData = await FirebaseService.getDocument(
        "playlists",
        sessionDoc.playlistId
      );

      if (!playlistData) {
        throw new Error("Playlist document not found");
      }

      // process new user's tracks without voting structure
      const newTracksMap = await this._processUserTracks(
        sessionId,
        userId,
        true
      );

      // remove tracks from newTracksMap if they already exist in playlistData.tracks
      const newUniqueTracks = this._filterUniqueNewTracks(
        newTracksMap,
        playlistData.tracks
      );

      // Merge with existing tracks, new tracks will overwrite if same ID
      const updatedTracks = {
        ...playlistData.tracks,
        ...newUniqueTracks,
      };

      // add voting structure to tracks, updating existing tracks with new user voteBy fields
      const tracksWithVoting = await this._addVotingStructureToTracks(
        sessionId,
        updatedTracks
      );

      // Update the playlist document in Firestore and return the updated document
      const updatedPlaylist = await FirebaseService.updateDocument(
        "playlists",
        sessionDoc.playlistId,
        { tracks: tracksWithVoting }
      );

      return updatedPlaylist;
    } catch (error) {
      console.error("Error updating playlist:", error);
      throw new Error(`Failed to update playlist: ${error.message}`);
    }
  }
}

module.exports = PlaylistSessionService;
