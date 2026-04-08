import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UploadSimple, FilePdf, CheckCircle } from '@phosphor-icons/react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LOADING_STEPS = [
  { text: 'Reading document...', duration: 2000 },
  { text: 'Detecting clauses...', duration: 3000 },
  { text: 'Analyzing risks...', duration: 3000 },
  { text: 'Simplifying content...', duration: 2000 }
];

export default function Upload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    if (uploading && currentStep < LOADING_STEPS.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, LOADING_STEPS[currentStep].duration);
      return () => clearTimeout(timer);
    }
  }, [uploading, currentStep]);

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
    setCurrentStep(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('user_id', user.id);
      formData.append('user_level', user.user_level || 'beginner');

      const response = await axios.post(`${API}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Wait for all loading animations to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      navigate(`/dashboard/${response.data.document_id}`);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
      setUploading(false);
      setCurrentStep(0);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
            Upload Legal Document
          </h1>
          <p className="text-lg text-gray-600">
            Upload your PDF for AI-powered analysis
          </p>
        </div>

        {!uploading ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 transform transition-all duration-300 hover:shadow-xl">
            <label
              htmlFor="file-upload"
              className="block cursor-pointer"
            >
              <div className={`border-3 border-dashed rounded-2xl p-16 text-center transition-all duration-300 ${ 
                file 
                  ? 'border-[#2563EB] bg-blue-50' 
                  : 'border-gray-300 hover:border-[#2563EB] hover:bg-gray-50'
              }`}>
                {!file ? (
                  <>
                    <UploadSimple size={64} weight="bold" className="mx-auto text-gray-400 mb-6" />
                    <p className="text-xl text-gray-700 font-medium mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-base text-gray-500">
                      PDF files only • Max 10MB
                    </p>
                  </>
                ) : (
                  <>
                    <FilePdf size={64} weight="fill" className="mx-auto text-[#2563EB] mb-6" />
                    <p className="text-xl text-gray-900 font-semibold mb-2">
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
                  className="flex-1 bg-[#2563EB] text-white font-semibold text-lg px-8 py-4 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 focus:outline-none transition-all duration-200 shadow-lg transform hover:scale-[1.02]"
                >
                  Analyze Document
                </button>
                <button
                  data-testid="upload-cancel-button"
                  onClick={() => setFile(null)}
                  className="bg-gray-100 text-gray-700 font-semibold text-lg px-8 py-4 rounded-xl hover:bg-gray-200 focus:ring-4 focus:ring-gray-200 focus:outline-none transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center animate-fade-in">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-[#2563EB] rounded-full mb-6 animate-pulse-custom">
                <FilePdf size={40} weight="fill" className="text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                Analyzing Your Document
              </h3>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              {LOADING_STEPS.map((step, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-500 ${
                    index <= currentStep 
                      ? 'bg-blue-50 border-2 border-[#2563EB]' 
                      : 'bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle size={24} weight="fill" className="text-[#2563EB] flex-shrink-0" />
                  ) : (
                    <div className={`w-6 h-6 rounded-full border-3 flex-shrink-0 ${
                      index === currentStep 
                        ? 'border-[#2563EB] border-t-transparent animate-spin' 
                        : 'border-gray-300'
                    }`} />
                  )}
                  <span className={`text-base font-medium ${
                    index <= currentStep ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.text}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-500 mt-8">
              This may take a few moments...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
