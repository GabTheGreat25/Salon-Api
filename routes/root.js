const express = require("express");
const router = express.Router();
const path = require("path");

router.get(/^\/(?:$|index\.html?$)/, (req, res) => {
  const filePath = path.join(__dirname, "..", "views", "index.html");
  res.sendFile(filePath);
});

module.exports = router;
