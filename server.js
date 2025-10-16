// server.js
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve index.html

// Test route
app.get("/test", (req, res) => {
  res.send("✅ Server is running!");
});

// Contact form route
app.post("/api/contact", async (req, res) => {
  const { firstName, lastName, contact, address, message } = req.body;

  // Check for missing fields
  if ([firstName, lastName, contact, address, message].some(f => !f || !f.trim())) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const discordPayload = {
    content: `📩 **New Contact Form Submission**`,
    embeds: [
      {
        title: "Contact Form Details",
        color: 0x38bdf8,
        fields: [
          { name: "First Name", value: firstName.trim(), inline: true },
          { name: "Last Name", value: lastName.trim(), inline: true },
          { name: "Email / Phone", value: contact.trim(), inline: false },
          { name: "Address", value: address.trim(), inline: false },
          { name: "Message", value: message.trim(), inline: false },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("❌ Discord webhook URL not set in .env");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload),
    });

    const text = await response.text();
    if (!response.ok) {
      console.error("Discord webhook failed:", text);
      return res.status(500).json({ error: "Failed to send message", discordResponse: text });
    }

    console.log("✅ Message sent to Discord:", text);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error sending to Discord:", err);
    res.status(500).json({ error: "Failed to send message", details: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
