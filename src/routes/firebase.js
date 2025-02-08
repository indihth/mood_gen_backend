const express = require("express");
const router = express.Router();
require("dotenv").config();
const { uploadData } = require("../services/firebaseServices");

// spotify redirects user back to this endpoint after auth, with access token
router.get("/test", async (req, res) => {
  try {
    await uploadData();
    res.send("Data uploaded to Firestore");
  } catch (error) {
    console.error("Error uploading data to Firestore:", error);
    res.status(500).send("Error uploading data to Firestore");
  }
});

module.exports = router;
