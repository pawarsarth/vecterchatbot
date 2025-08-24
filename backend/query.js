import * as dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});
const History = [];

// STEP 1: Transform user query for better context
async function transformQuery(question) {
  History.push({
    role: "user",
    parts: [{ text: question }],
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: History,
    config: {
      systemInstruction: `You are a query rewriting expert.
      Rephrase the user's follow-up question into a standalone, context-independent question.
      Only return the rewritten question.`,
    },
  });

  History.pop();
  return response.response.candidates[0].content.parts[0].text.trim();
}

// STEP 2: Chatting function (used in /ask API)
export async function chatting(question) {
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

  History.push({
    role: "user",
    parts: [{ text: queries }],
  });

  // Generate AI response
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: History,
    config: {
      systemInstruction: `You are a DSA expert.
      Answer the user's question **only** based on the context below.
      If no relevant answer is found, reply:
      "I could not find the answer in the provided document."

      Context: ${context}`,
    },
  });

  const finalAnswer = response.response.candidates[0].content.parts[0].text;

  History.push({
    role: "model",
    parts: [{ text: finalAnswer }],
  });

  return finalAnswer;
}
