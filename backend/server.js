import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import { indexdocument } from "./index.js";
import { chatting } from "./query.js";

dotenv.config();

const app = express();
const PORT = 5000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Multer for PDF uploads
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// Upload and Index PDF
app.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    const pdfPath = `./uploads/${req.file.filename}`;
    await indexdocument(pdfPath);
    res.json({ success: true, message: "PDF indexed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error processing PDF" });
  }
});

// Ask questions
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    const answer = await chatting(question);
    res.json({ success: true, answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error answering question" });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
