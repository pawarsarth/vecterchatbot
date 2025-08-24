import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { indexdocument } from "./index.js";
import { chatting } from "./query.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// File upload directory
app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("Uploaded file:", req.file);

    const pdfPath = req.file.path;

    try {
      await indexdocument(pdfPath);
    } catch (err) {
      console.error("❌ Error during PDF indexing:", err.message);
      return res.status(500).json({
        error: "Failed to index PDF",
        details: err.message,
      });
    }

    res.status(200).json({
      message: "✅ PDF uploaded and indexed successfully",
      fileName: req.file.originalname,
    });
  } catch (err) {
    console.error("❌ Upload error:", err.message);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
});


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// Upload + Index PDF
app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("Uploaded file:", req.file);

    const pdfPath = req.file.path;
    await indexdocument(pdfPath);

    res.status(200).json({
      message: "✅ PDF uploaded and indexed successfully",
      fileName: req.file.originalname,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload or index PDF" });
  }
});

// Ask Question API
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || question.trim() === "") {
      return res.status(400).json({ error: "Question is required" });
    }

    console.log("User asked:", question);

    const answer = await chatting(question);

    res.status(200).json({ answer });
  } catch (err) {
    console.error("Error in /ask:", err);
    res.status(500).json({ error: "Failed to fetch answer" });
  }
});

// Health Check
app.get("/", (req, res) => {
  res.send("✅ API is running fine!");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
