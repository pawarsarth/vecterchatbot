import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({});
const History = [];

export async function transformQuery(question) {
  History.push({ role: "user", parts: [{ text: question }] });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: History,
    config: {
      systemInstruction: `You are a query rewriting expert. 
      Based on the provided chat history, rephrase the "Follow Up user Question" 
      into a complete, standalone question that can be understood without the chat history.
      Only output the rewritten question and nothing else.`,
    },
  });

  History.pop();
  return response.text.trim();
}

export async function chatting(question) {
  const queries = await transformQuery(question);

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: "text-embedding-004",
  });

  const queryVector = await embeddings.embedQuery(queries);

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

  History.push({ role: "user", parts: [{ text: queries }] });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: History,
    config: {
      systemInstruction: `You are a DSA expert. Answer based only on the given context.
      If you don't find the answer, reply with:
      "I could not find the answer in the provided document."
      
      Context: ${context}`,
    },
  });

  History.push({ role: "model", parts: [{ text: response.text }] });

  return response.text;
}
