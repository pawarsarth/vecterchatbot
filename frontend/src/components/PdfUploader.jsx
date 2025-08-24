import { useState } from "react";
import axios from "axios";

export default function PdfUploader({ onUploadSuccess }) {
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    if (!file) return alert("Please select a PDF");
    const formData = new FormData();
    formData.append("pdf", file);

    try {
      await axios.post("http://localhost:5000/upload", formData);
      alert("PDF uploaded successfully!");
      onUploadSuccess();
    } catch (err) {
      alert("Failed to upload PDF");
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md w-full max-w-md mx-auto mb-6">
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-3"
      />
      <button
        onClick={handleUpload}
        className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        Upload PDF
      </button>
    </div>
  );
}
