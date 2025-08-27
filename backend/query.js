import * as dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const chatHistory = [];

// STEP 1: Transform user query for better context
async function transformQuery(question) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: "You are a query rewriting expert. Rephrase the user's follow-up question into a standalone, context-independent question. Only return the rewritten question."
  });

  const result = await model.generateContent(question);
  const response = await result.response;
  return response.text().trim();
}

// STEP 2: Chatting function (used in /ask API)
export async function chatting(question) {
  try {
    const queries = await transformQuery(question);

    // Generate embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: "text-embedding-004",
    });

    const queryVector = await embeddings.embedQuery(queries);

    // Query Pinecone
    const pinecone = new Pinecone();
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

    const searchResults = await pineconeIndex.query({
      topK: 10,
      vector: queryVector,
      includeMetadata: true,
    });

    const context = searchResults.matches
      .map((match) => match.metadata.text)
      .join("\n\n---\n\n");

    // Add to chat history
    chatHistory.push({
      role: "user",
      parts: [{ text: queries }],
    });

    // Generate AI response
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: `You are a DSA expert. Answer the user's question **only** based on the context below. If no relevant answer is found, reply: "I could not find the answer in the provided document." Context: ${context}`
    });

    const result = await model.generateContent(queries);
    const response = await result.response;
    const finalAnswer = response.text();

    // Add model response to history
    chatHistory.push({
      role: "model",
      parts: [{ text: finalAnswer }],
    });

    return finalAnswer;
  } catch (error) {
    console.error("Error in chatting function:", error);
    throw new Error("Failed to process question: " + error.message);
  }
}