'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginRequest } from '@/lib/models/types';
import { setAuthData } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        } as LoginRequest),
      });

      const data = await response.json();

      if (data.success) {
        const loginData = data.data;

        // Store auth data using the auth utility
        setAuthData({
          user: loginData.user,
          employee: loginData.employee,
          token: loginData.token,
        });

        // Redirect to dashboard
        router.push('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch {
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div
      className="min-h-screen flex items-center justify-end py-12 px-4 sm:px-6 lg:px-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/RS27new.jpg')" }}
    >
      <div className="max-w-md w-full space-y-8 bg-black bg-opacity-50 p-8 rounded-lg shadow-lg mr-8 lg:mr-16">
        <div>
          <h3 className="mt-6 text-center text-3xl font-extrabold text-white">
              Right Seat Ltd
          </h3>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 bg-white placeholder-gray-500 text-black rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 bg-white placeholder-gray-500 text-black rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-500 bg-opacity-20 p-4 border border-red-400">
              <div className="text-sm text-red-200">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-200">
              Default admin credentials: admin@company.com / admin123
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}