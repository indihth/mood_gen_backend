const FirebaseService = require("../services/firebase.services");
const UserService = require("../services/user.services");

class UserController {
  static async getSpotifyConnectStatus(req, res) {
    try {
      const userId = req.session.uid;

      // get user document from Firebase
      const userDoc = await FirebaseService.getDocument("users", userId);
      if (!userDoc) {
        return res.status(204).json({ message: "User not found" }); // no content - not an error
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
  static async populateDashboard(req, res) {
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

      return res.status(200).json({
        message: "User's sessions retrieved successfully",
        sessions: sessions,
      });
    } catch (error) {
      // throw error
      console.error("Error getting user's sessions:", error);
      res.json({ message: error.message });
    }
  }

  static async createNewUser(req, res) {
    console.log("Creating new user in controller");
    try {
      const userId = req.session.uid;
      const { username } = req.body;

      if (!username) {
        return res
          .status(400)
          .json({ message: "Username and email are required" });
      }

      console.log(
        `Creating new user with: ${userId} and username: ${username}`
      );

      // create new user document in Firebase
      const newUser = await UserService.createNewUser(userId, username);

      res.status(200).json({
        message: "New user created successfully",
        user: newUser,
      });
    } catch (error) {
      console.error("Error creating new user:", error);
      res.status(500).json({ message: error.message });
    }
  }

  static async getDashboardData(userId) {
    // Get users part sessions - name, description, users
    const sessions = UserService.getUserSessions(userId); // returns all session for a user

    // Get users current/most recent session - name, description, users and image for the playlist (top voted track?)
    // Get
  }

  //TODO: get saved Spotify playlists from Firebase
}

module.exports = UserController;
