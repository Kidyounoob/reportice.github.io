import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

app.post("/api/contact", async (req, res) => {
  const { firstName, lastName, contact, address, message } = req.body;

  if (!firstName || !lastName || !contact || !address || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("❌ DISCORD_WEBHOOK_URL not set in .env");
    return res.status(500).json({ error: "Webhook URL not configured" });
  }

  const discordPayload = {
    embeds: [
      {
        title: "📩 New Contact Form Submission",
        color: 0x38bdf8,
        fields: [
          { name: "First Name", value: firstName, inline: true },
          { name: "Last Name", value: lastName, inline: true },
          { name: "Email / Phone", value: contact, inline: false },
          { name: "Address", value: address, inline: false },
          { name: "Message", value: message, inline: false },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Discord webhook failed:", response.status, text);
      throw new Error("Discord webhook failed");
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
