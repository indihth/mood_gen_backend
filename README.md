# MoodGen Backend

This is the backend for the MoodGen application, which integrates with the Spotify API to provide various functionalities such as creating playlists and fetching user data.

## Prerequisites

- Node.js
- npm
- Spotify Developer Account

## Setup

1. Clone the repository:

   ```sh
   git clone https://github.com/yourusername/mood_gen_backend.git
   cd mood_gen_backend
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file in the root directory and add your Spotify API credentials:

   ```env
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REDIRECT_URI=your_spotify_redirect_uri
   ```

4. Start the server:
   ```sh
   npm start
   ```

## API Endpoints

### Authentication

- `GET /auth/login` - Redirects users to Spotify for authentication.
- `GET /auth/callback` - Spotify redirects users back to this endpoint after authentication.

### Spotify

- `GET /spotify` - Base route for Spotify-related endpoints.
- `GET /spotify/elvis` - Fetches albums of the artist Elvis Presley.
- `GET /spotify/playlists` - Fetches the user's playlists.

## Project Structure

```
mood_gen_backend/
├── src/
│   ├── routes/
│   │   ├── auth.js
│   │   └── spotify.js
│   ├── config/
│   │   └── spotifyClient.js
│   └── app.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

## License

This project is licensed under the MIT License.
