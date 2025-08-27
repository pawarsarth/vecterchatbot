import { useState } from "react";
import axios from "axios";

export default function ChatBox() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const handleAsk = async () => {
  if (!question.trim()) return;
  try {
    const res = await axios.post(`${API_BASE}/ask`, { question });
    setAnswer(res.data.answer);
  } catch {
    setAnswer("Error fetching answer");
  }
};

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-3">Ask Questions from PDF</h2>
      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask your question..."
        className="w-full p-2 rounded mb-4 text-black"
      />
      <button
        onClick={handleAsk}
        className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700"
      >
        Ask
      </button>
      {answer && (
        <div className="mt-4 bg-gray-700 p-4 rounded-lg">
          <strong>Answer:</strong>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}
