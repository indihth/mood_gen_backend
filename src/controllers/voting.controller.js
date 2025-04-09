const VotingServices = require("../services/voting.services");
const FirebaseService = require("../services/firebase.services");

class VotingController {
  // up/down vote on track
  static async handleVote(req, res) {
    try {
      // Get vote data
      const { playlistId, trackId, voteType } = req.body; // req.body.voteType = "up" or "down"

      if (!req.session || !req.session.uid) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const userId = req.session.uid;

      if (!playlistId || !trackId || !voteType) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const playlist = await FirebaseService.getDocument(
        "playlists",
        playlistId
      );

      if (!playlist) {
        return res.status(404).json({ error: "Playlist not found" });
      }

      // check what vote type
      if (voteType === "up") {
        // Upvote track
        const vote = await VotingServices.castUpvote(
          playlist,
          playlistId,
          trackId,
          userId
        );
        return res
          .status(200)
          .json({ message: "Upvote successful", data: vote });
      } else if (voteType === "down") {
        // Downvote track
        const vote = await VotingServices.castDownvote(
          playlist,
          playlistId,
          trackId,
          userId
        );
        return res
          .status(200)
          .json({ message: "Downvote successful", data: vote });
      } else {
        return res.status(400).json({ error: "Invalid vote type" });
      }
    } catch (error) {
      console.error("Error handling vote:", error);
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = VotingController;
