import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './engops-theme.css';
import { AdminReviewForms } from './pages/AdminReviewForms';
import { Home } from './pages/Home';
import { LoginPage } from './pages/LoginPage';
import { ManagerReview } from './pages/ManagerReview';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<Navigate to="/admin/review-forms" replace />} />
        <Route path="/admin/review-forms" element={<AdminReviewForms />} />
        <Route path="/review/:code" element={<ManagerReview />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
