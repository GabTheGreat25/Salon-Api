const express = require("express");
const router = express.Router();
const path = require("path");

router.get(/^\/(?:$|index\.html?$)/, (req, res) => {
  const filePath = path.join(__dirname, "..", "views", "index.html");
  res.sendFile(filePath);
});

router.get(/^\/(?:$|logo\.jpg?$)/, (req, res) => {
  const imagePath = path.join(__dirname, "..", "views", "logo.jpg");
  res.sendFile(imagePath);
});

module.exports = router;
