import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Landing from './pages/Landing';
import Diagnose from './pages/Diagnose';
import CaseHistory from './pages/CaseHistory';

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/diagnose" element={<Diagnose />} />
          <Route path="/history" element={<CaseHistory />} />
          {/* Catch-all: redirect unknown routes to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
