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


// ✅ Dynamic allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://pdf-ai-frontend-4gqx.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// ✅ Ensure uploads folder exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ✅ Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// ✅ Upload PDF and index it
app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "❌ No file uploaded" });
    }

    const pdfPath = req.file.path;
    await indexdocument(pdfPath);

    return res.status(200).json({
      message: "✅ PDF uploaded & indexed successfully",
      fileName: req.file.originalname,
      filePath: pdfPath,
    });
  } catch (err) {
    console.error("❌ Upload Error:", err);
    return res.status(500).json({ error: "Failed to upload or index PDF" });
  }
});

// ✅ Ask question from indexed PDF
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    console.log("📩 Received Question:", question);

    const answer = await chatting(question);

    if (!answer) {
      throw new Error("No response from chatting()");
    }

    res.json({ answer });
  } catch (err) {
    console.error("❌ /ask Route Error:", err.message);
    res.status(500).json({ error: "Failed to fetch answer", details: err.message });
  }
});

// ✅ Health check endpoint
app.get("/", (req, res) => {
  res.send("🚀 API is running successfully!");
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
