'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, User, Users, FileText, Calendar, Briefcase, Award, BarChart3 } from 'lucide-react';
import { getAuthUser, clearAuthData, canAccessModule, hasPermission } from '../lib/auth';

export default function AdminDashboard() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<any>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    const user = getAuthUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Only admin can access this dashboard
    if (user.role !== 'admin') {
      // Redirect to appropriate dashboard
      switch (user.role) {
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
          router.push('/login');
      }
      return;
    }

    setAuthUser(user);
  }, [router]);

  const handleLogout = () => {
    clearAuthData();
    router.push('/login');
  };

  const handlePasswordChange = () => {
    if (passwordData.new !== passwordData.confirm) {
      alert('New passwords do not match');
      return;
    }

    // In a real app, this would call an API
    alert('Password change functionality would be implemented here');
    setShowPasswordChange(false);
    setPasswordData({ current: '', new: '', confirm: '' });
  };

  const modules = [
    {
      id: 'hr-outsourcing',
      title: 'HR Outsourcing',
      description: 'Manage employees, leave, and HR operations',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      href: '/hr-outsourcing',
      permission: 'hr_module_access'
    },
    {
      id: 'finance',
      title: 'Finance',
      description: 'Financial management and reporting',
      icon: BarChart3,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      href: '/finance',
      permission: 'finance_module_access'
    },
    {
      id: 'business-operation',
      title: 'Business Operation',
      description: 'Business operations and document management',
      icon: Briefcase,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      href: '/business-operation',
      permission: 'business_module_access'
    },
    {
      id: 'talent-curation',
      title: 'Talent Curation',
      description: 'Talent acquisition and management',
      icon: Award,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600',
      href: '/talent-curation',
      permission: 'talent_module_access'
    },
    {
      id: 'comms',
      title: 'Communications',
      description: 'Event management, media library, and calendar',
      icon: Calendar,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-100',
      textColor: 'text-pink-600',
      href: '/comms',
      permission: 'comms_module_access'
    }
  ];

  if (!authUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse" />
          </div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-2xl font-bold text-slate-800 truncate">Admin Dashboard</h1>
              <p className="text-sm md:text-base text-slate-600 truncate">Welcome back, {authUser.user.email.split('@')[0]}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <button
              onClick={() => setShowPasswordChange(true)}
              className="flex items-center space-x-1 md:space-x-2 px-3 py-2 md:px-4 md:py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 md:space-x-2 px-3 py-2 md:px-4 md:py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 md:p-8 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">System Administration</h2>
            <p className="text-blue-100 text-base md:text-lg">Manage all modules and oversee system operations</p>
          </div>

          {/* Module Access Grid */}
          <div>
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-4 md:mb-6">Module Access</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <div
                    key={module.id}
                    onClick={() => router.push(module.href)}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-4 md:p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  >
                    <div className={`w-10 h-10 md:w-12 md:h-12 ${module.bgColor} rounded-xl flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 md:w-6 md:h-6 ${module.textColor}`} />
                    </div>
                    <h4 className="text-base md:text-lg font-semibold text-slate-800 mb-2">{module.title}</h4>
                    <p className="text-slate-500 text-xs md:text-sm">{module.description}</p>
                    <div className="mt-3 md:mt-4 flex items-center text-xs md:text-sm text-blue-600 font-medium">
                      <span>Access Module</span>
                      <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* System Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs md:text-sm">Total Users</p>
                  <p className="text-xl md:text-2xl font-bold text-slate-800">6</p>
                </div>
                <Users className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs md:text-sm">Active Modules</p>
                  <p className="text-xl md:text-2xl font-bold text-slate-800">5</p>
                </div>
                <FileText className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-4 md:p-6 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs md:text-sm">System Status</p>
                  <p className="text-xl md:text-2xl font-bold text-green-600">Online</p>
                </div>
                <div className="w-6 h-6 md:w-8 md:h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-green-600 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-xl border border-slate-200/50 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-800">Change Password</h3>
              <button
                onClick={() => setShowPasswordChange(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPasswordChange(false)}
                className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
