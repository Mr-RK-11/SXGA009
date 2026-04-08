import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UploadSimple, FilePdf } from '@phosphor-icons/react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Upload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
    }
  }, [navigate]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      alert('Please select a PDF file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const user = JSON.parse(localStorage.getItem('user'));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user.id);
      formData.append('user_level', user.user_level || 'beginner');

      const response = await axios.post(`${API}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      navigate(`/dashboard/${response.data.document_id}`);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-black leading-tight mb-4">
            Upload Legal Document
          </h1>
          <p className="text-lg text-gray-800 leading-relaxed">
            Upload your PDF document for AI-powered analysis.
          </p>
        </div>

        <div className="bg-gray-50 border-2 border-gray-200 rounded-md p-8 md:p-12">
          <label
            htmlFor="file-upload"
            className="block cursor-pointer"
          >
            <div className="border-2 border-dashed border-gray-300 rounded-md p-12 text-center hover:border-[#0052CC] hover:bg-gray-100 transition-colors duration-200">
              {!file ? (
                <>
                  <UploadSimple size={64} weight="bold" className="mx-auto text-gray-400 mb-4" />
                  <p className="text-lg text-gray-800 font-medium mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-base text-gray-600">
                    PDF files only
                  </p>
                </>
              ) : (
                <>
                  <FilePdf size={64} weight="bold" className="mx-auto text-[#0052CC] mb-4" />
                  <p className="text-lg text-gray-900 font-semibold mb-2">
                    {file.name}
                  </p>
                  <p className="text-base text-gray-600">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              )}
            </div>
          </label>
          
          <input
            id="file-upload"
            type="file"
            data-testid="upload-file-input"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          {file && (
            <div className="mt-8 flex gap-4">
              <button
                data-testid="upload-submit-button"
                onClick={handleUpload}
                disabled={uploading}
                className="bg-[#0052CC] text-white font-semibold text-lg px-6 py-3 rounded-md border-2 border-transparent hover:bg-[#003D99] focus:ring-4 focus:ring-blue-300 focus:outline-none transition-all disabled:opacity-50"
              >
                {uploading ? 'Analyzing Document...' : 'Analyze Document'}
              </button>
              <button
                data-testid="upload-cancel-button"
                onClick={() => setFile(null)}
                disabled={uploading}
                className="bg-white text-gray-900 font-semibold text-lg px-6 py-3 rounded-md border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}