'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, Users } from 'lucide-react';
import { authenticateUser, authenticateStaff, setAuthData, initializeDefaultAccounts, isAuthenticated } from '../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginType, setLoginType] = useState<'admin' | 'staff'>('admin');

  useEffect(() => {
    // Initialize default accounts on first load
    initializeDefaultAccounts();

    // Redirect if already authenticated
    if (isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let authUser;

      if (loginType === 'admin') {
        authUser = authenticateUser(email, password);
      } else {
        authUser = authenticateStaff(email, password);
      }

      if (authUser) {
        setAuthData(authUser);

        // Redirect based on role
        switch (authUser.role) {
          case 'admin':
            router.push('/');
            break;
          case 'hr_manager':
            router.push('/hr-outsourcing');
            break;
          case 'finance_manager':
            router.push('/finance');
            break;
          case 'business_manager':
            router.push('/business-operation');
            break;
          case 'talent_manager':
            router.push('/talent-curation');
            break;
          case 'comms_manager':
            router.push('/comms');
            break;
          case 'staff':
            router.push('/staff-portal');
            break;
          default:
            router.push('/');
        }
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">HR Management System</h1>
          <p className="text-slate-400">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
          {/* Login Type Toggle */}
          <div className="flex rounded-lg bg-slate-700/50 p-1 mb-6">
            <button
              type="button"
              onClick={() => setLoginType('admin')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                loginType === 'admin'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Admin/Manager
            </button>
            <button
              type="button"
              onClick={() => setLoginType('staff')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                loginType === 'staff'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Staff Portal
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white placeholder-slate-400"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-white placeholder-slate-400"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span className="font-medium">Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Default Credentials Info */}
          <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Default Credentials:</h3>
            <div className="space-y-1 text-xs text-slate-400">
              {loginType === 'admin' ? (
                <>
                  <p><strong>Admin:</strong> admin@company.com / admin123</p>
                  <p><strong>HR Manager:</strong> hr@company.com / hr123</p>
                  <p><strong>Finance Manager:</strong> finance@company.com / finance123</p>
                  <p><strong>Business Manager:</strong> business@company.com / business123</p>
                  <p><strong>Talent Manager:</strong> talent@company.com / talent123</p>
                  <p><strong>Comms Manager:</strong> comms@company.com / comms123</p>
                </>
              ) : (
                <>
                  <p><strong>John Doe:</strong> john.doe@company.com / staff1</p>
                  <p><strong>Jane Smith:</strong> jane.smith@company.com / staff2</p>
                  <p><strong>Bob Johnson:</strong> bob.johnson@company.com / staff3</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}