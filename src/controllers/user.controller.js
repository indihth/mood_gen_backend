const FirebaseService = require("../services/firebase.services");
const UserService = require("../services/user.services");

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
      const sessions = await UserService.getUserSessions(userId);

      if (!sessions || sessions.length === 0) {
        console.log("No sessions found for this user");

        // not an error but no sessions found
        return res
          .status(201)
          .json({ message: "No sessions found for this user", sessions: [] });
      }

      const sessionData = sessions.map((session) => {
        return {
          id: session.id,
          description: session.data.description,
          hostId: session.data.hostId,
          sessionName: session.data.sessionName,
          status: session.data.status,
          users: session.data.users,
          playlistId: session.data.playlistId,
          updatedAt: session.data.updatedAt,
          createdAt: session.data.createdAt,
        };
      });

      //   console.log("Sessions found for this user:", sessionData);

      return res.status(200).json({
        message: "User's sessions retrieved successfully",
        sessions: sessionData,
      });
    } catch (error) {
      // throw error
      console.error("Error getting user's sessions:", error);
      res.json({ message: error.message });
    }
  }

  //TODO: get saved Spotify playlists from Firebase
}

module.exports = UserController;
