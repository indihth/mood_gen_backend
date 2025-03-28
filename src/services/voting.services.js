const admin = require("firebase-admin");
const FirebaseService = require("./firebase.services");

class VotingServices {
  // Check if user has already voted on track - takes playlist object directly
  static checkUserVote(playlist, trackId, userId) {
    const track = playlist.tracks[trackId];
    if (!track) {
      throw new Error("Track not found");
    }

    const userVote = track.votedBy[userId];
    return {
      hasVoted: userVote.upVoted || userVote.downVoted, // true if user has voted up or down
      voteType: userVote.upVoted ? "up" : userVote.downVoted ? "down" : null, // returns what votetype, up or down
      track,
    };
  }

  static async castUpvote(playlist, playlistId, trackId, userId) {
    const { hasVoted, voteType } = this.checkUserVote(
      playlist,
      trackId,
      userId
    );

    // Check if user has already voted
    if (hasVoted) {
      if (voteType === "up") {
        // If already upvoted, throw error because no need to write to db again
        throw new Error("Already upvoted");
      }
      // If downvoted, remove downvote first to avoid up and down votes both being true
      if (voteType === "down") {
        await this.removeDownvote(playlistId, trackId, userId);
      }
    }

    console.log("playlistId: ", playlist);

    // Update track votes - dot notation to update nested fields
    return await FirebaseService.updateDocument("playlists", playlistId, {
      [`tracks.${trackId}.upVotes`]: admin.firestore.FieldValue.increment(1), // Increment general upvote count
      [`tracks.${trackId}.votedBy.${userId}.upVoted`]: true, // Set user upvote to true
      [`tracks.${trackId}.votedBy.${userId}.downVoted`]: false, // Set user downvote to false
    });
  }

  static async castDownvote(playlist, playlistId, trackId, userId) {
    const { hasVoted, voteType } = this.checkUserVote(
      playlist,
      trackId,
      userId
    );

    if (hasVoted) {
      if (voteType === "down") {
        throw new Error("Already downvoted");
      }
      // If upvoted, remove upvote first
      if (voteType === "up") {
        await this.removeUpvote(playlistId, trackId, userId);
      }
    }

    return await FirebaseService.updateDocument("playlists", playlistId, {
      [`tracks.${trackId}.downVotes`]: admin.firestore.FieldValue.increment(1),
      [`tracks.${trackId}.votedBy.${userId}.downVoted`]: true,
      [`tracks.${trackId}.votedBy.${userId}.upVoted`]: false,
    });
  }

  // Deals with removing only upvote
  static async removeUpvote(playlistId, trackId, userId) {
    await FirebaseService.updateDocument("playlists", playlistId, {
      [`tracks.${trackId}.upVotes`]: admin.firestore.FieldValue.increment(-1),
      [`tracks.${trackId}.votedBy.${userId}.upVoted`]: false,
    });
  }

  // Deals with removing only downvote
  static async removeDownvote(playlistId, trackId, userId) {
    await FirebaseService.updateDocument("playlists", playlistId, {
      [`tracks.${trackId}.downVotes`]: admin.firestore.FieldValue.increment(-1),
      [`tracks.${trackId}.votedBy.${userId}.downVoted`]: false,
    });
  }

  // Remove track from playlist
}

module.exports = VotingServices;
