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

    // Has user already voted?
    if (hasVoted) {
      if (voteType === "up") {
        // if already upvoted, remove downvote
        return await this.removeUpvote(playlistId, trackId, userId);
      }
      // if downvoted, remove downvote first to avoid up and down votes both being true
      if (voteType === "down") {
        await this.removeDownvote(playlistId, trackId, userId);
      }
    }

    // Update track votes in db, dot notation to update nested fields
    return await FirebaseService.updateDocument("playlists", playlistId, {
      [`tracks.${trackId}.upVotes`]: admin.firestore.FieldValue.increment(1), // increment upvote count
      [`tracks.${trackId}.votedBy.${userId}.upVoted`]: true, // set user upvote to true
      [`tracks.${trackId}.votedBy.${userId}.downVoted`]: false, // set user downvote to false
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
        // throw new Error("Already downvoted");
        // If already downvoted, remove downvote
        return await this.removeDownvote(playlistId, trackId, userId);
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

  // Remove up/down votes from tracks

  static async removeUpvote(playlistId, trackId, userId) {
    await FirebaseService.updateDocument("playlists", playlistId, {
      [`tracks.${trackId}.upVotes`]: admin.firestore.FieldValue.increment(-1),
      [`tracks.${trackId}.votedBy.${userId}.upVoted`]: false,
    });
  }

  static async removeDownvote(playlistId, trackId, userId) {
    await FirebaseService.updateDocument("playlists", playlistId, {
      [`tracks.${trackId}.downVotes`]: admin.firestore.FieldValue.increment(-1),
      [`tracks.${trackId}.votedBy.${userId}.downVoted`]: false,
    });
  }
}

module.exports = VotingServices;
