import { useState, useCallback, useEffect } from 'react';
import EmailVerifier from './components/EmailVerifier';
import Toast from './components/Toast';

let toastId = 0;

export default function App() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const addToast = useCallback((toast) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="bg-spotlight pointer-events-none" />
      <Toast toasts={toasts} removeToast={removeToast} />
      
      {/* Decorative top gradient bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 absolute top-0 left-0 z-10"></div>
      
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-12 md:py-24 flex flex-col z-10">
        
        {/* Premium Header */}
        <div className="text-center mb-12 animate-[slideUp_0.5s_ease-out]">
          <div className="mx-auto w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-6">
            <svg className="w-7 h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">Email Verifier</h1>
          <p className="text-gray-500 max-w-md mx-auto text-base">
            Instantly validate syntax, detect common typos, and verify active SMTP mailboxes in real-time.
          </p>
        </div>
        
        <EmailVerifier addToast={addToast} />
        
      </main>

      <footer className="py-8 z-10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm font-medium text-gray-400">
            Crafted with precision by <span className="text-gray-600 font-semibold border-b border-gray-300 pb-0.5">Ansh</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
