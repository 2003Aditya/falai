const express = require("express");
const cors = require("cors");
const { fal } = require("@fal-ai/client");
require("dotenv").config(); // To load environment variables from .env file
const debug = require("debug")("app"); // Add debug module

const app = express();
const port = process.env.PORT || 3000; // Default port 3000, or use PORT from .env

// Enable CORS for all routes
app.use(
  cors({
    origin: "https://image-creation.netlify.app", // Allow only the frontend URL
    methods: ["GET", "POST"], // Specify allowed methods
    allowedHeaders: ["Content-Type"], // Specify allowed headers
  })
);

// Middleware to parse JSON
app.use(express.json());

// Route to generate an image from a prompt
app.post("/api/generate-image", async (req, res) => {
  const { prompt } = req.body;

  debug("Request received on /generate-image with prompt:", prompt);

  // Validate the prompt
  if (!prompt || typeof prompt !== "string") {
    debug("Invalid prompt received");
    return res.status(400).json({
      message: "Prompt is required and must be a string.",
    });
  }

  try {
    // Check if the API Key is set in environment variables
    const apiKey = process.env.FAL_KEY;
    if (!apiKey) {
      debug("API Key is missing");
      return res.status(500).json({ message: "API Key is missing. Set the FAL_KEY environment variable." });
    }

    debug("API Key found, calling FLUX.1 model");

    // Call the FLUX.1 model directly with the API key passed as part of the options
    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt: prompt, // Use the provided prompt
      },
      apiKey: apiKey, // Directly include the API key here
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          debug("Queue update in progress:", update);
          update.logs.map((log) => log.message).forEach(console.log);
        }
      },
    });

    debug("Image generation result:", result);

    // Return the result from the image generation
    res.status(200).json({
      message: "Image generation in progress",
      data: result.data,
      requestId: result.requestId,
    });
  } catch (error) {
    // Log the error for debugging purposes
    console.error("Error generating image:", error);
    debug("Error details:", error);

    // Respond with an error message
    res.status(500).json({ message: "Error generating image", error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  debug(`Server is running on http://localhost:${port}`);
  console.log(`Server is running on http://localhost:${port}`);
});

