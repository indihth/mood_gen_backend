// src/services/user.service.js
const FirebaseService = require("./firebase.services");

// CIRCULAR DEPENDENCY WARNING: Importing SpotifyService while it imports UserService
const SpotifyService = require("./spotify.services");

class UserService {
  static async getListeningHistoryByUserId(sessionId, userId) {
    const listeningHistory = await FirebaseService.getSubcollectionDocument(
      "sessions",
      sessionId,
      "listeningHistory",
      userId
    );
    if (!listeningHistory) {
      throw new Error("Listening history document not found for user");
    }

    // convert the listening history object to an array of tracks
    const tracks = Object.values(listeningHistory).slice(0, 10); // Get the first 10 tracks
    // const tracks = Object.values(listeningHistory); // Get all tracks

    // flatten the tracks array
    const flattenedTracks = tracks.reduce((acc, track) => {
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
    try {
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
    } catch (error) {
      console.error("Error getting user data and history:", error);
      throw new Error("Failed to get user data and history");
    }
  }

  static async updateUserLastActivity(userId) {
    await FirebaseService.updateDocument("users", userId, {
      "spotify.last_updated": new Date(),
    });
  }

  static async getUserData(userId) {
    const userData = await FirebaseService.getDocument("users", userId);
    try {
      if (!userData) {
        throw new Error("User not found");
      }
    } catch (error) {
      console.error("Error getting user data:", error);
      throw new Error("Failed to get user data");
    }
    return userData;
  }

  //TODO!
  static async getUserSessions(userId) {
    const userDocument = await FirebaseService.getDocument("users", userId);
    if (!userDocument) {
      throw new Error("No document found for user");
    }

    const sessionIds = userDocument.sessionIds || []; // gets the sessionIds array from the user document

    if (!sessionIds || sessionIds.length === 0) {
      console.log("No sessions found for this user");
      return []; // return empty array if no sessions found
    }

    // retrieving all sessions for the user
    const sessions = await FirebaseService.getDocumentsByInQuery(
      "sessions",
      sessionIds
    );

    console.log("Services - Sessions found for this user:", sessions);

    return sessions;
  }

  // create new user document on registration
  static async createNewUser(userId, username) {
    try {
      console.log("Creating new user inservices");
      const newUser = await FirebaseService.setDocument("users", userId, {
        username,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return newUser;
    } catch (error) {
      console.error("Error creating new user in Firebase:", error);
      throw new Error("Failed to create new user in Firebase");
    }
  }
}

module.exports = UserService;
