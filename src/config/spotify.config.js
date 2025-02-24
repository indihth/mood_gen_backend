const SpotifyWebApi = require("spotify-web-api-node");
require("dotenv").config();

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

const scopes = [
  "playlist-modify-public", // Allow creating public playlists
  "playlist-modify-private", // Allow creating private playlists
  "user-read-private", // Read user profile
  "user-read-email",
  "user-top-read", // Read user email
];

// Export the single instance to be used across the application, to set and get access tokens
module.exports = { spotifyApi, scopes };
