import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // serve HTML/CSS/JS

app.post("/api/contact", async (req, res) => {
  const { firstName, lastName, contact, address, message } = req.body;
  if (!firstName || !lastName || !contact || !address || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const discordPayload = {
    embeds: [{
      title: "📩 New Contact Form Submission",
      color: 0x38bdf8,
      fields: [
        { name: "First Name", value: firstName, inline: true },
        { name: "Last Name", value: lastName, inline: true },
        { name: "Email / Phone", value: contact, inline: false },
        { name: "Address", value: address, inline: false },
        { name: "Message", value: message }
      ],
      timestamp: new Date().toISOString()
    }]
  };

  try {
    const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload)
    });
    if (!response.ok) throw new Error("Discord webhook failed");
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
