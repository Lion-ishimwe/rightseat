'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { resetSessionTimeout, getRemainingTime } from '@/lib/auth';
import { AlertTriangle, Clock, X } from 'lucide-react';

export default function SessionManager() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    // Activity tracking - reset timeout on user interactions
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const resetTimeout = () => {
      resetSessionTimeout();
    };

    // Add event listeners for activity tracking
    events.forEach(event => {
      document.addEventListener(event, resetTimeout, true);
    });

    // Session warning handler
    const handleSessionWarning = () => {
      setShowWarning(true);
      setRemainingTime(Math.floor(getRemainingTime() / 1000 / 60)); // minutes
    };

    // Session expired handler
    const handleSessionExpired = () => {
      setShowWarning(false);
      router.push('/login');
    };

    // Listen for session events
    window.addEventListener('sessionWarning', handleSessionWarning);
    window.addEventListener('sessionExpired', handleSessionExpired);

    // Update remaining time every minute when warning is shown
    const interval = setInterval(() => {
      if (showWarning) {
        const timeLeft = Math.floor(getRemainingTime() / 1000 / 60);
        setRemainingTime(timeLeft);
        if (timeLeft <= 0) {
          setShowWarning(false);
        }
      }
    }, 60000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout, true);
      });
      window.removeEventListener('sessionWarning', handleSessionWarning);
      window.removeEventListener('sessionExpired', handleSessionExpired);
      clearInterval(interval);
    };
  }, [router, showWarning]);

  const extendSession = () => {
    resetSessionTimeout();
    setShowWarning(false);
  };

  const logoutNow = () => {
    setShowWarning(false);
    router.push('/login');
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Session Timeout Warning</h3>
            <p className="text-sm text-gray-600">Your session will expire soon</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-700">
              Time remaining: <span className="font-semibold text-red-600">{remainingTime} minutes</span>
            </span>
          </div>
          <p className="text-sm text-gray-600">
            For security reasons, your session will automatically expire after 1 hour of inactivity.
            Click "Stay Logged In" to extend your session.
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={extendSession}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Stay Logged In
          </button>
          <button
            onClick={logoutNow}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
}