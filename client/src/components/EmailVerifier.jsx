import { useState } from 'react';

export default function EmailVerifier({ addToast }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showJson, setShowJson] = useState(false);

  const handleVerify = async (emailToVerify) => {
    const target = emailToVerify || email;
    if (!target.trim()) {
      addToast({ type: 'warning', title: 'Action Required', message: 'Please enter a valid email address first.' });
      return;
    }

    setLoading(true);
    setResult(null);
    setShowJson(false); 

    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Server error ${response.status}`);
      }

      const data = await response.json();
      setResult(data);

      if (data.result === 'valid') {
        addToast({ type: 'success', title: 'Verified Successfully', message: 'The mailbox exists and is reachable.' });
      } else if (data.result === 'invalid') {
        if (data.subresult === 'typo_detected') {
          addToast({ type: 'warning', title: 'Possible Typo Detected', message: `Did you mean ${data.didyoumean}?` });
        } else {
          addToast({ type: 'error', title: 'Verification Failed', message: data.error || 'The email address is invalid.' });
        }
      } else {
        addToast({ type: 'info', title: 'Unable to Verify', message: 'The server response was inconclusive.' });
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Connection Error', message: 'Could not reach the verification API.' });
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleVerify();
    }
  };

  const StatusIcon = ({ type }) => {
    if (type === 'valid') {
      return (
        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    }
    if (type === 'invalid') {
      return (
        <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
  };

  const getBadgeColors = (resultType) => {
    switch (resultType) {
      case 'valid': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'invalid': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  return (
    <div className="w-full">
      {/* Input Module */}
      <div className="saas-card p-2 sm:p-3 mb-8 w-full">
        <div className="flex flex-col sm:flex-row gap-2 relative">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="name@domain.com"
              className="saas-input pl-11"
              disabled={loading}
              spellCheck="false"
              autoComplete="email"
            />
          </div>
          <button
            onClick={() => handleVerify()}
            disabled={loading}
            className="saas-button"
          >
            {loading ? <div className="spinner-sm" /> : null}
            <span>{loading ? 'Verifying...' : 'Verify Now'}</span>
          </button>
        </div>
      </div>

      {/* Result Card */}
      {result && (
        <div className={`saas-card overflow-hidden w-full transition-all duration-500 animate-[slideUp_0.4s_ease-out]`}>
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white/50">
            <h3 className="text-base font-semibold text-gray-900">Verification Report</h3>
            <div className={`badge ${getBadgeColors(result.result)}`}>
              <StatusIcon type={result.result} />
              {result.result.charAt(0).toUpperCase() + result.result.slice(1)}
            </div>
          </div>

          <div className="p-0">
            <dl className="divide-y divide-gray-100">
              
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                <dt className="text-sm font-medium text-gray-500 w-1/3 mb-1 sm:mb-0">Target Address</dt>
                <dd className="text-sm text-gray-900 font-medium sm:w-2/3 break-all">{result.email}</dd>
              </div>
              
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                <dt className="text-sm font-medium text-gray-500 w-1/3 mb-1 sm:mb-0">Diagnostic Detail</dt>
                <dd className="text-sm text-gray-700 sm:w-2/3 capitalize">
                  {result.subresult.replace(/_/g, ' ')}
                </dd>
              </div>

              {result.domain && (
                <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                  <dt className="text-sm font-medium text-gray-500 w-1/3 mb-1 sm:mb-0">Parsed Domain</dt>
                  <dd className="text-sm text-gray-700 sm:w-2/3">{result.domain}</dd>
                </div>
              )}

              {result.didyoumean && (
                <div className="px-6 py-4 flex flex-col sm:flex-row justify-between bg-amber-50/50">
                  <dt className="text-sm font-medium text-amber-800 w-1/3 mb-1 sm:mb-0 pt-0.5">Suggestion</dt>
                  <dd className="text-sm text-amber-900 sm:w-2/3 flex items-start gap-2">
                    <svg className="w-5 h-5 text-amber-500 shrink-0 mt-[-2px]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                    </svg>
                    <span>
                      Did you mean to type{' '}
                      <button 
                        onClick={() => { setEmail(result.didyoumean); handleVerify(result.didyoumean); }} 
                        className="font-semibold underline decoration-amber-300 hover:decoration-amber-500 hover:text-amber-700 transition-colors"
                      >
                        {result.didyoumean}
                      </button>
                      ?
                    </span>
                  </dd>
                </div>
              )}

              {result.mxRecords && result.mxRecords.length > 0 && (
                <div className="px-6 py-4 flex flex-col sm:flex-row justify-between">
                  <dt className="text-sm font-medium text-gray-500 w-1/3 mb-2 sm:mb-0 pt-1">MX Records</dt>
                  <dd className="text-sm text-gray-700 sm:w-2/3">
                    <div className="flex flex-wrap gap-2">
                      {result.mxRecords.map((mx, idx) => (
                        <span key={idx} className="bg-gray-50 text-gray-600 text-xs px-2.5 py-1 rounded-md border border-gray-200 font-mono tracking-tight">
                          {mx}
                        </span>
                      ))}
                    </div>
                  </dd>
                </div>
              )}

              {result.error && (
                <div className="px-6 py-4 flex flex-col sm:flex-row justify-between bg-red-50/50">
                  <dt className="text-sm font-medium text-red-800 w-1/3 mb-1 sm:mb-0">Error Details</dt>
                  <dd className="text-sm text-red-700 sm:w-2/3">{result.error}</dd>
                </div>
              )}
              
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between">
                <dt className="text-sm font-medium text-gray-500 w-1/3 mb-1 sm:mb-0">Speed</dt>
                <dd className="text-sm text-gray-500 sm:w-2/3 flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {result.executiontime}s
                </dd>
              </div>

            </dl>

            {/* Developer Mode Toggle */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex flex-col items-center">
              <button 
                onClick={() => setShowJson(!showJson)}
                className="text-xs text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1.5 transition-colors"
              >
                <svg className={`w-4 h-4 transition-transform duration-200 ${showJson ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {showJson ? 'Hide developer data' : 'View raw API response'}
              </button>
              
              {showJson && (
                <div className="w-full mt-4 overflow-hidden rounded-xl border border-gray-200 animate-[slideUp_0.3s_ease-out]">
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 text-xs font-medium text-gray-500 flex justify-between">
                    <span>JSON Payload</span>
                    <span>application/json</span>
                  </div>
                  <pre className="bg-[#1e1e2e] text-[#cdd6f4] p-4 overflow-x-auto text-[13px] font-mono leading-relaxed">
                    <code>{JSON.stringify(result, null, 2)}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
