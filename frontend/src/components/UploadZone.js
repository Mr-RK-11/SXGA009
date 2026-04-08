import React, { useState, useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';

const UploadZone = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      onFileUpload(files[0]);
    }
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e) => {
    const files = e.target.files;
    if (files.length > 0) {
      onFileUpload(files[0]);
    }
  }, [onFileUpload]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-xl py-20 px-8
        bg-white/[0.02] backdrop-blur-xl
        transition-all duration-300
        ${isDragging ? 'border-white/50 bg-white/10 scale-105' : 'border-white/20'}
        hover:border-white/40 hover:bg-white/[0.04]
        cursor-pointer
      `}
      data-testid="upload-pdf-zone"
    >
      <label className="cursor-pointer">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
          data-testid="file-input"
        />
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            {isDragging ? (
              <FileText className="w-10 h-10 text-indigo-400" strokeWidth={1.5} />
            ) : (
              <Upload className="w-10 h-10 text-slate-400" strokeWidth={1.5} />
            )}
          </div>
          <h3 className="text-2xl font-medium mb-2 text-white" style={{ fontFamily: '"Outfit", sans-serif' }}>
            Upload Legal Document
          </h3>
          <p className="text-slate-400 mb-4" style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>
            Drag and drop your PDF here, or click to browse
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-300">
            <FileText className="w-4 h-4" strokeWidth={1.5} />
            PDF files only
          </div>
        </div>
      </label>
    </div>
  );
};

export default UploadZone;
