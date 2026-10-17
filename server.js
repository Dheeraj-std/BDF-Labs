// BDF Lab 01: Node.js and Express server
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// Replace these placeholders with your own details before submission.
const studentDetails = {
  name: "S DHEERAJ KUMAR",
  section: "CSE(GAI)-2C",
  regdNumber: "252U1R9140"
};

// Log each request after Express has finished sending its response.
// This records the HTTP status code for each route.
app.use((request, response, next) => {
  response.on("finish", () => {
    console.log(`${request.method} ${request.originalUrl} -> ${response.statusCode}`);
  });
  next();
});

// GET / - welcome text
app.get("/", (request, response) => {
  response.status(200).type("text").send("Welcome to my Node.js and Express server!");
});

// GET /about - student name and section as JSON
app.get("/about", (request, response) => {
  response.status(200).json(studentDetails);
});

// GET /time - current server date and time
app.get("/time", (request, response) => {
  response.status(200).json({
    currentDateTime: new Date().toString(),
    isoDateTime: new Date().toISOString()
  });
});

// 404 handler for every unknown path
app.use((request, response) => {
  response.status(404).type("text").send("404 - Page not found");
});

app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}`);
  console.log("Try /, /about, and /time in your browser.");
});
