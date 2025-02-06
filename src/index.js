require("dotenv").config();
const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");

const app = express();
const port = process.env.PORT || 3000;
