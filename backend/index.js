import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import dotenv from "dotenv";

dotenv.config();

export async function indexdocument(pdfPath) {
  try {
    console.log(`📄 Loading PDF from: ${pdfPath}`);
    const pdfLoader = new PDFLoader(pdfPath);
    const rawDocs = await pdfLoader.load();

    console.log(`✅ PDF loaded. Total pages: ${rawDocs.length}`);

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunkedDocs = await textSplitter.splitDocuments(rawDocs);

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: "text-embedding-004",
    });

    const pinecone = new Pinecone();
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

    await PineconeStore.fromDocuments(chunkedDocs, embeddings, {
      pineconeIndex,
      maxConcurrency: 5,
    });

    console.log("✅ PDF successfully indexed!");
  } catch (err) {
    console.error("❌ Error in indexdocument:", err);
    throw new Error("Failed to process PDF: " + err.message);
  }
}

