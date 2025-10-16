import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors"; // for cross-origin requests validation
import { body, validationResult } from "express-validator"; // for better validation

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(cors()); // Allow cross-origin requests
app.use(express.static(path.join(__dirname, "public"))); // serve HTML/CSS/JS

// Contact Form API with Validation
app.post(
  "/api/contact",
  [
    body("firstName").notEmpty().withMessage("First Name is required"),
    body("lastName").notEmpty().withMessage("Last Name is required"),
    body("contact").isEmail().withMessage("Contact must be a valid email").optional(),
    body("message").notEmpty().withMessage("Message is required")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, contact, address, message } = req.body;

    const discordPayload = {
      embeds: [
        {
          title: "📩 New Contact Form Submission",
          color: 0x38bdf8,
          fields: [
            { name: "First Name", value: firstName, inline: true },
            { name: "Last Name", value: lastName, inline: true },
            { name: "Email / Phone", value: contact || "N/A", inline: false },
            { name: "Address", value: address || "N/A", inline: false },
            { name: "Message", value: message }
          ],
          timestamp: new Date().toISOString()
        }
      ]
    };

    try {
      const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordPayload)
      });

      if (!response.ok) {
        throw new Error(`Discord webhook failed with status: ${response.status}`);
      }

      res.status(200).json({
        success: true,
        message: "Your message has been sent successfully!"
      });
    } catch (err) {
      console.error("Error sending message to Discord:", err);
      res.status(500).json({ error: "Failed to send message to Discord" });
    }
  }
);

// Server Listening
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
