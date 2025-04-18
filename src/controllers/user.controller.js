const FirebaseService = require("../services/firebase.services");

class UserController {
  static async getSpotifyConnectStatus(req, res) {
    try {
      const userId = req.session.uid;

      // get user document from Firebase
      const userDoc = await FirebaseService.getDocument("users", userId);
      if (!userDoc) {
        return res.status(404).json({ message: "User not found" });
      }

      const userInfo = {
        id: userDoc.id,
        spotifyConnected: userDoc.spotifyConnected,
        //TODO: add more user info as needed
      };

      res.status(200).json(userInfo);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  //TODO: get user sessions from Firebase
  static async getUserSessions(req, res) {
    try {
      const userId = req.session.uid;

      // Firebase query to get all sessions for the user from session collection
      const sessions = await FirebaseService.queryNestedField(
        "sessions",
        "users.${userId}.userId",
        userId
      );

      if (!sessions || sessions.length === 0) {
        return res
          .status(404)
          .json({ message: "No sessions found for this user" });
      }

      return (sessionData = sessions.map((session) => {
        return {
          id: session.id,
          description: session.description,
          hostId: session.hostId,
          sessionName: session.sessionName,
          status: session.status,
          users: session.users,
          playlistId: session.playlistId,
          updatedAt: session.updatedAt,
          createdAt: session.createdAt,
        };
      }));
    } catch (error) {
      // throw error
      console.error("Error getting user's sessions:", error);
      res.json({ message: error.message });
    }
  }

  //TODO: get saved Spotify playlists from Firebase
}

module.exports = UserController;
