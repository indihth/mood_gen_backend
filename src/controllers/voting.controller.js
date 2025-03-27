const { spotifyApi, scopes } = require("../config/spotify.config");
const SpotifyService = require("../services/spotify.services");
const TokenService = require("../services/token.services");
const UserService = require("../services/user.services");
const PlaylistSessionServices = require("../services/playlist_session.services");

class VotingController {
  // up/down vote on track
  static async updateVote(req, res) {
    // Get vote data
    const { playlistId, trackId, userId, voteType } = req.body; // req.body.voteType = "up" or "down"

    // Get playlist document
    const playlist = await FirebaseService.getDocument("playlists", playlistId);

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    // check if user has already voted on track - need to make each track key the trackId
    const userVote = playlist.tracks[trackId].find(
      (vote) => vote.userId === userId
    );

    // get vote type (up or down)
    // get user id
    // update vote
  }

  // check if user has already voted on track
  // get votes on track
  // remove track from playlist
  // adjust position of track in playlist?
  // replace removed track with new track?
}

module.exports = VotingController;
