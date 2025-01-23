const { fal } = require("@fal-ai/client");
const cors = require("cors");
const debug = require("debug")("app");

const corsHandler = cors({
  origin: "https://image-creation.netlify.app", // Allow only the frontend URL
  methods: ["GET", "POST"], // Specify allowed methods
  allowedHeaders: ["Content-Type"], // Specify allowed headers
});

module.exports = async (req, res) => {
  return new Promise((resolve, reject) => {
    corsHandler(req, res, async () => {
      if (req.method !== "POST") {
        return res.status(405).json({ message: "Method Not Allowed" });
      }

      const { prompt } = req.body;

      debug("Request received on /generate-image with prompt:", prompt);

      if (!prompt || typeof prompt !== "string") {
        debug("Invalid prompt received");
        return res.status(400).json({
          message: "Prompt is required and must be a string.",
        });
      }

      try {
        const apiKey = process.env.FAL_KEY;
        if (!apiKey) {
          debug("API Key is missing");
          return res.status(500).json({ message: "API Key is missing. Set the FAL_KEY environment variable." });
        }

        debug("API Key found, calling FLUX.1 model");

        const result = await fal.subscribe("fal-ai/flux/dev", {
          input: {
            prompt: prompt,
          },
          apiKey: apiKey,
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              debug("Queue update in progress:", update);
              update.logs.map((log) => log.message).forEach(console.log);
            }
          },
        });

        debug("Image generation result:", result);

        res.status(200).json({
          message: "Image generation in progress",
          data: result.data,
          requestId: result.requestId,
        });
        resolve();
      } catch (error) {
        console.error("Error generating image:", error);
        debug("Error details:", error);

        res.status(500).json({ message: "Error generating image", error: error.message });
        reject();
      }
    });
  });
};

