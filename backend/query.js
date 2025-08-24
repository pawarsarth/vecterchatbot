import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { indexdocument } from "./indexDocument.js";
import { chatting } from "./query.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ----------------------
// File Upload Directory
// ----------------------
const uploadDir = "/tmp/uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// ----------------------
// Upload PDF + Index in Pinecone
// ----------------------
app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("Uploaded file:", req.file);

    const pdfPath = req.file.path;

    // Index the PDF into Pinecone
    await indexdocument(pdfPath);

    res.status(200).json({
      message: "PDF uploaded and indexed successfully",
      fileName: req.file.originalname,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload or index PDF" });
  }
});

// ----------------------
// Ask Question API
// ----------------------
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

// ----------------------
// Health Check Route
// ----------------------
app.get("/", (req, res) => {
  res.send("✅ API is running fine!");
});

// ----------------------
// Start Server
// ----------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
