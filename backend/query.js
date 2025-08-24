import * as dotenv from 'dotenv';
dotenv.config();
import readlineSync from 'readline-sync';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});
const History = [];

// ----------------------
// STEP 1: Transform Query
// ----------------------
async function transformQuery(question) {
  History.push({
    role: 'user',
    parts: [{ text: question }],
  });

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: History,
    config: {
      systemInstruction: `You are a query rewriting expert. 
      Based on the provided chat history, rephrase the "Follow Up user Question" 
      into a complete, standalone question that can be understood without the chat history.
      Only output the rewritten question and nothing else.`,
    },
  });

  // Remove temporary query from history
  History.pop();

  return response.text.trim();
}

// ----------------------
// STEP 2: Chat Function
// ----------------------
export async function chatting(question) {
  // FIXED: Add await here ✅
  const queries = await transformQuery(question);

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'text-embedding-004',
  });

  // Create vector from the rewritten query
  const queryVector = await embeddings.embedQuery(queries);

  // Pinecone Vector Search
  const pinecone = new Pinecone();
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
  const searchResults = await pineconeIndex.query({
    topK: 10,
    vector: queryVector,
    includeMetadata: true,
  });

  // Build context from Pinecone search
  const context = searchResults.matches
    .map((match) => match.metadata.text)
    .join('\n\n---\n\n');

  // Add user's rewritten query to history
  History.push({
    role: 'user',
    parts: [{ text: queries }],
  });

  // Generate response from Gemini
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: History,
    config: {
      systemInstruction: `You have to behave like a Data Structure and Algorithm Expert.
      You will be given a context of relevant information and a user question.
      Your task is to answer the user's question based ONLY on the provided context.
      If the answer is not in the context, you must say 
      "I could not find the answer in the provided document."
      Keep your answers clear, concise, and educational.
      
      Context: ${context}`,
    },
  });

  // Save model's answer to history
  History.push({
    role: 'model',
    parts: [{ text: response.text }],
  });

  console.log('\n');
  console.log(response.text);
}

// ----------------------
// STEP 3: Main Loop
// ----------------------
async function main() {
  while (true) {
    const userProblem = readlineSync.question('Ask me anything --> ');
    await chatting(userProblem);
  }
}

main();
