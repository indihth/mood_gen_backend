const admin = require("firebase-admin");
const FirebaseService = require("./firebase.service");

class PlaylistSessionService {
  // Create a new playlist session
  static async createPlaylistSession() {
    // Create a new playlist session
    // Return the playlist session ID
  }

  // Get a playlist session by ID

  // Add user to a playlist session

  // Remove user from a playlist session

  // Get all users listening history in a playlist session
  static async getAllListeningHistory(sessionId) {
    // Get all users listening history in a playlist session
    // map over all users and return their listening history
    const sessionDoc = await FirebaseService.getDocument("sessions", sessionId);
    if (!sessionDoc) {
      return null;
    }

    const users = sessionDoc.users;
    let listeningHistory = [];

    // Flatten all listening histories into a single array
    Object.values(users).forEach((user) => {
      if (user.listeningHistory) {
        listeningHistory = listeningHistory.concat(
          // merges all listening histories into a single array
          user.listeningHistory.slice(0, 10)
        );
      }
    });

    // TODO: filter out duplicates

    // TODO: evenly distribute songs

    console.log("All listening history: ", listeningHistory);
    return listeningHistory;
  }

  // Get listening history from session by user ID
  static async getListeningHistoryByUser(sessionId, userId, range = 10) {
    const sessionDoc = await FirebaseService.getDocument("sessions", sessionId);
    if (!sessionDoc) {
      return null;
    }

    // const limitedHistory = [];
    const listeningHistory = sessionDoc.users[userId].listeningHistory.slice(
      0,
      range
    );
    console.log("Listening history: ", listeningHistory);
    return listeningHistory;
  }

  // Create base playlist
  static async createBasePlaylist(sessionId) {
    // Get all users listening history
    const listeningHistory = await this.getAllListeningHistory(sessionId);

    // Create a base playlist from the listening history
    // Return the base playlist ID
  }

  // Add a song to a playlist session

  // Remove a song from a playlist session

  // Handle voting on a song in a playlist session
}

module.exports = PlaylistSessionService;
