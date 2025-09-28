import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from "cors";

dotenv.config();
const router = express.Router();

// Enable CORS
router.use(cors());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

router.post("/", async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "No image provided" });

    // 1️⃣ Plant.id API call
    const plantRes = await axios.post(
      "https://api.plant.id/v3/identification",
      {
        images: [image],
        modifiers: ["crops_fast", "similar_images"],
        plant_details: ["common_names", "scientific_name"],
      },
      { headers: { "Api-Key": process.env.PLANT_ID_API_KEY } }
    );

    const suggestion = plantRes.data.result?.classification?.suggestions?.[0];
    if (!suggestion) return res.status(404).json({ error: "No plant identified" });

    const scientific_name = suggestion.name;
    const englishNames = suggestion.details?.common_names || ["Unknown"];

    // 2️⃣ Wikipedia description
    let description = "No description available";
    try {
      const wikiName = scientific_name.replace(/ /g, "_");
      const wikiRes = await axios.get(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${wikiName}`
      );
      description = wikiRes.data.extract || description;
    } catch {
      try {
        // fallback to first English common name
        const fallbackName = englishNames[0].replace(/ /g, "_");
        const fallbackRes = await axios.get(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${fallbackName}`
        );
        description = fallbackRes.data.extract || description;
      } catch (err) {
        console.error("Wikipedia fetch failed:", err.message);
      }
    }

    // 3️⃣ Gemini translations
    let translations = { Hindi: "N/A", Tamil: "N/A", Kannada: "N/A" };
    try {
      const prompt = `Translate the plant name "${englishNames[0]}" into Hindi, Tamil, and Kannada. Respond ONLY in JSON format like {"Hindi":"...","Tamil":"...","Kannada":"..."}`;
      const result = await model.generateContent(prompt);
      translations = JSON.parse(result.response.text());
    } catch (err) {
      console.error("Gemini translation failed:", err.message);
    }

    // 4️⃣ Send final JSON to frontend
    res.json({
      scientific_name,
      description,
      common_names: {
        English: englishNames,
        ...translations,
      },
    });

  } catch (error) {
    console.error("Error in /identify:", error.response?.data || error.message);
    res.status(500).json({ error: "Identification failed. Please try again." });
  }
});

export default router;
