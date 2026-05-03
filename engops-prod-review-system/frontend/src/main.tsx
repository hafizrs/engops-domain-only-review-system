import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './engops-theme.css';
import { AdminLayout } from './pages/AdminLayout';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminReviewForms } from './pages/AdminReviewForms';
import { AdminSubmissions } from './pages/AdminSubmissions';
import { AdminSubmissionDetail } from './pages/AdminSubmissionDetail';
import { AdminUsers } from './pages/AdminUsers';
import { Home } from './pages/Home';
import { LoginPage } from './pages/LoginPage';
import { ManagerReview } from './pages/ManagerReview';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="create" element={<AdminReviewForms />} />
          <Route path="review-forms" element={<Navigate to="/admin/create" replace />} />
          <Route path="submissions" element={<AdminSubmissions />} />
          <Route path="submissions/:code" element={<AdminSubmissionDetail />} />
          <Route path="submissions/:code/:submissionId" element={<AdminSubmissionDetail />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>
        <Route path="/review/:code" element={<ManagerReview />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
