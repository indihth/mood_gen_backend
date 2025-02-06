const express = require("express");
const router = express.Router(); // create a new router object

// route router - when you visit homepage
router.get("/", (req, res) => {
  // get request to the root route
  res.send("Hello World!");
});

// get route with param
router.get("/hellow/:name", (req, res) => {
  const name = req.params.name;
  let message;
  if (name.length > 10) {
    message = `Hello ${name}, your name is long`;
  } else if (name === "bob") {
    message = "Hello Bobby!";
  }
  res.send(message || `Hello ${name}`);
});

// post route
router.post("/message", (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).send("No message provided");
  }

  res.json({
    received: message,
    length: message.length,
  });
});

router.get("/now", (req, res) => {
  now = new Date();
  res.send("Current time is " + now);
});

router.get("/mathsy/:num1/:num2", (req, res) => {
  const num1 = parseInt(req.params.num1);
  const num2 = parseInt(req.params.num2);

  const message = `The sum of ${num1} and ${num2} is ${num1 + num2}`;
  res.send(message);
});

module.exports = router; // export the router object
