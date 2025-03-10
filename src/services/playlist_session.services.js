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
  static async _getAllListeningHistory(sessionId) {
    const listeningHistoryDocs = await FirebaseService.getSubcollection(
      "sessions",
      sessionId,
      "listeningHistory"
    );

    if (!listeningHistoryDocs || listeningHistoryDocs.length === 0) {
      return [];
    }

    // Flatten all listening histories into a single array
    let allTracks = [];

    allTracks = listeningHistoryDocs.map((user) => ({
      id: user.id,
      tracks: Object.values(user.tracks).slice(0, 10), // Get the first 10 tracks, convert object to array
    }));

    // Combine all tracks from each user into a single array
    const justTracks = allTracks.reduce((acc, user) => {
      return acc.concat(user.tracks).splice(0, 20);
    }, []);

    // listeningHistoryDocs.forEach((doc) => {
    //   allTracks = allTracks.concat(doc.tracks.slice(0, 10));
    // });

    // TODO: filter out duplicates
    // TODO: evenly distribute songs

    return justTracks;
  }

  // Get listening history from session by user ID
  static async getListeningHistoryByUser(sessionId, userId, range = 10) {
    const sessionDoc = await FirebaseService.getSubcollectionDocument(
      "sessions",
      sessionId,
      "listeningHistory",
      userId
    );
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
  static async createBasePlaylist(res, req) {
    // try {
    const sessionId = "eM4zvPgXFi0goK1XNnvq";
    const userId = req.session.uid;
    // Get the existing session data
    const sessionDoc = await FirebaseService.getDocument("sessions", sessionId);
    if (!sessionDoc) {
      return res.status(404).json({ error: "Session not found" });
    }

    const listeningHistory = await this._getAllListeningHistory(sessionId);
    // console.log("listeningHistory1 : ", listeningHistory);

    const playlistData = {
      sessionName: sessionDoc.sessionName,
      tracks: listeningHistory,
    };
    // console.log("listeningHistory: ", listeningHistory);
    return playlistData;
    // } catch (error) {
    //   console.error("Error getting playlist from db:", error);
    //   res.status(500).json({ error: error.message });
    // }

    // Create a base playlist from the listening history
    // Return the base playlist ID
  }

  static async getSessionUsers(sessionId) {
    const sessionDoc = await FirebaseService.getDocument("sessions", sessionId);
    if (!sessionDoc) {
      return null;
    }

    return sessionDoc.users;
  }

  // Set user Listening History in session
  // static async setUserListeningHistory(sessionId, userId, listeningHistory) {
  //   // Getting data
  //   const listeningHistory = await SpotifyService.getRecentHistory();
  //   const userProfile = await SpotifyService.getUserProfile();

  //   // Store listening history using user id as key
  //   const historyData = {
  //     [req.session.uid]: listeningHistory,
  //   };
  // }

  // Add a song to a playlist session

  // Remove a song from a playlist session

  // Handle voting on a song in a playlist session
}

module.exports = PlaylistSessionService;
