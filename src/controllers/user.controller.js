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
}

module.exports = UserController;
