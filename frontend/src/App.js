import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './pages/SignIn';
import Survey from './pages/Survey';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import './App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SignIn />} />
          <Route path="/survey" element={<Survey />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/dashboard/:docId" element={<Dashboard />} />
          <Route path="/chat/:docId" element={<Chat />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;