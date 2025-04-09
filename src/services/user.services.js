// src/services/user.service.js
const FirebaseService = require("./firebase.services");

// CIRCULAR DEPENDENCY WARNING: Importing SpotifyService while it imports UserService
const SpotifyService = require("./spotify.services");

class UserService {
  // High-level business operations

  static async getListeningHistoryByUserId(sessionId, userId) {
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

    // add voting fields to tracks
    const tracksWithVoting = this._addVotingToTracks([tracks], [userId]);

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
  static async getAllListeningHistory(sessionId) {
    const listeningHistoryDocs = await FirebaseService.getSubcollection(
      "sessions",
      sessionId,
      "listeningHistory"
    );

    if (!listeningHistoryDocs || listeningHistoryDocs.length === 0) {
      throw new Error("No listening history found");
    }

    let allTracks = [];

    allTracks = listeningHistoryDocs.map((user) => ({
      id: user.id,
      // tracks: user.tracks.slice(0, 10), // should work bc no longer object?
      // tracks: user.tracks, // include all for now
      tracks: Object.values(user.tracks).slice(0, 10), // convert object to array, get first 10 tracks
    }));

    // combine all tracks from each user into a single array
    const tracks = allTracks.reduce((acc, user) => {
      return acc.concat(user.tracks).splice(0, 20);
    }, []);

    return tracks;
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

  static async updateUserLastActivity(userId) {
    await FirebaseService.updateDocument("users", userId, {
      "spotify.last_updated": new Date(),
    });
  }
}

module.exports = UserService;
