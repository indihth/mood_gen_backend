const admin = require("firebase-admin");
const FirebaseService = require("./firebase.service");
const SpotifyService = require("./spotify.service");
const PlaylistSessionServices = require("./playlist_session.services");

class PlaylistSessionService {
  // Create a new playlist session
  static async createPlaylistSession() {
    // Create a new playlist session
    // Return the playlist session ID
  }

  // Get all users listening history in a playlist session
  static async _getAllListeningHistory(sessionId) {
    const listeningHistoryDocs = await FirebaseService.getSubcollection(
      "sessions",
      sessionId,
      "listeningHistory"
    );

    if (!listeningHistoryDocs || listeningHistoryDocs.length === 0) {
      throw new Error("No listening history found");
    }

    // Flatten all listening histories into a single array
    let allTracks = [];

    // Get the first 10 tracks from each user
    allTracks = listeningHistoryDocs.map((user) => ({
      id: user.id,
      tracks: Object.values(user.tracks).slice(0, 10), // convert object to array
    }));

    // Combine all tracks from each user into a single array
    const justTracks = allTracks.reduce((acc, user) => {
      return acc.concat(user.tracks).splice(0, 20);
    }, []);

    // Shuffle the tracks
    const shuffledTracks = this._shuffleTracks(justTracks);
    // TODO: filter out duplicates

    return shuffledTracks;
  }

  static _shuffleTracks(tracks) {
    // TODO: evenly distribute songs
    // mix up the songs
    const shuffledTracks = justTracks.sort(() => Math.random() - 0.5);

    // Fisher-Yates shuffle - impliment later
    // for (let i = shuffledTracks.length - 1; i > 0; i--) {
    //   const j = Math.floor(Math.random() * (i + 1));
    //   [shuffledTracks[i], shuffledTracks[j]] = [shuffledTracks[j], shuffledTracks[i]];
    // }
    return shuffledTracks;
  }

  // Create base playlist
  static async _createTrackList(sessionId) {
    // Get the existing session data
    const sessionDoc = await FirebaseService.getDocument("sessions", sessionId);
    if (!sessionDoc) {
      throw new Error("Session not found");
    }
    const listeningHistory = await this._getAllListeningHistory(sessionId);
    // console.log("listeningHistory1 : ", listeningHistory);

    const trackListData = {
      sessionName: sessionDoc.sessionName,
      tracks: listeningHistory,
    };
    console.log("trackListData: ", trackListData);

    return trackListData;
  }

  static async _addPlaylistToSessionDoc(sessionId, playlistId) {
    const sessionDoc = await FirebaseService.getDocument("sessions", sessionId);
    if (!sessionDoc) {
      throw new Error("Session not found");
    }

    const updatedSessionDoc = await FirebaseService.addToDocument(
      "sessions",
      sessionId,
      { playlistId }, // Add playlist ID to session - make not nested in playlist object
      "playlist"
    );

    return updatedSessionDoc;
  }

  static async createNewPlaylist(sessionId) {
    // Create the playlist
    const playlistData = await this._createTrackList(sessionId);

    // Store playlist data in the playlist collection
    const addedPlaylistDoc = await FirebaseService.setDocument(
      "playlist",
      "",
      playlistData
    );

    // Add playlist ID to the session document
    await this._addPlaylistToSessionDoc(sessionId, addedPlaylistDoc.id);

    return playlistData;
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

  // Add a song to a playlist session

  // Remove a song from a playlist session

  // Handle voting on a song in a playlist session
}

module.exports = PlaylistSessionService;
