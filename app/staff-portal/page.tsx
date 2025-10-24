'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, FileText, Calendar, Settings, LogOut, Eye, Edit, Download } from 'lucide-react';
import { getAuthUser, clearAuthData, canAccessModule, hasPermission } from '../../lib/auth';

export default function StaffPortalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [staffData, setStaffData] = useState<any>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    const authUser = getAuthUser();
    if (!authUser || !canAccessModule('staff')) {
      router.push('/login');
      return;
    }

    // Load staff data from HR records
    loadStaffData(authUser.user.email);
  }, [router]);

  const loadStaffData = (email: string) => {
    const staffListStr = localStorage.getItem('staff_list');
    if (staffListStr) {
      try {
        const staffList = JSON.parse(staffListStr);
        const staff = staffList.find((s: any) => s.email === email);
        if (staff) {
          setStaffData(staff);
        }
      } catch (error) {
        console.error('Error loading staff data:', error);
      }
    }
  };

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

  const navigationItems = [
    { id: 'dashboard', title: 'Dashboard', icon: User },
    { id: 'documents', title: 'My Documents', icon: FileText },
    { id: 'leave', title: 'Leave Requests', icon: Calendar },
    { id: 'settings', title: 'Settings', icon: Settings },
  ];

  if (!staffData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-slate-600">Loading your information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex h-screen">
        {/* Left Navigation Sidebar */}
        <nav className="w-80 h-screen bg-slate-800/50 backdrop-blur-xl border-r border-slate-700/50 overflow-y-auto">
          <div className="p-6">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <User className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Staff Portal</h1>
                <p className="text-sm text-slate-400">Employee Dashboard</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <ul className="space-y-2 mb-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                        activeTab === item.id
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                          : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* User Profile Section */}
            <div className="bg-slate-700/30 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{staffData.name}</p>
                  <p className="text-xs text-slate-400 truncate">{staffData.position || 'Employee'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-3 py-2 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-lg transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 h-screen overflow-y-auto">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">
                    Welcome back, {staffData.name.split(' ')[0]}
                  </h1>
                  <p className="text-slate-600 mt-1">
                    Access your personal information and manage your account
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Last login</p>
                  <p className="text-sm font-medium text-slate-700">{new Date().toLocaleString()}</p>
                </div>
              </div>
            </header>

            {/* Content Area */}
            <div className="p-6 space-y-6">
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Personal Information Card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-800">Personal Information</h3>
                        <p className="text-slate-500">Your basic employee details</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-600">Full Name</label>
                          <p className="text-lg text-slate-800">{staffData.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600">Email</label>
                          <p className="text-lg text-slate-800">{staffData.email}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600">Position</label>
                          <p className="text-lg text-slate-800">{staffData.position || 'Not specified'}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-600">Department</label>
                          <p className="text-lg text-slate-800">{staffData.department || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600">Status</label>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            staffData.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {staffData.status}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600">Hire Date</label>
                          <p className="text-lg text-slate-800">{staffData.hireDate || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6 text-center">
                      <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">My Documents</h3>
                      <p className="text-slate-500 mb-4">View and download your documents</p>
                      <button
                        onClick={() => setActiveTab('documents')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Documents
                      </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6 text-center">
                      <Calendar className="w-12 h-12 text-green-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Leave Requests</h3>
                      <p className="text-slate-500 mb-4">Request time off and view history</p>
                      <button
                        onClick={() => setActiveTab('leave')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Manage Leave
                      </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6 text-center">
                      <Settings className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">Account Settings</h3>
                      <p className="text-slate-500 mb-4">Update your account preferences</p>
                      <button
                        onClick={() => setActiveTab('settings')}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Open Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800">My Documents</h3>
                      <p className="text-slate-500">Access your personal documents and files</p>
                    </div>
                  </div>

                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">No documents available</h3>
                    <p className="text-slate-500">Your documents will appear here when uploaded by HR.</p>
                  </div>
                </div>
              )}

              {activeTab === 'leave' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <Calendar className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800">Leave Requests</h3>
                      <p className="text-slate-500">Manage your time off requests</p>
                    </div>
                  </div>

                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Leave management coming soon</h3>
                    <p className="text-slate-500">You'll be able to request and track your leave here.</p>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6">
                  {/* Password Change */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-3 bg-purple-100 rounded-xl">
                        <Settings className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-800">Account Settings</h3>
                        <p className="text-slate-500">Manage your account preferences</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-medium text-slate-800 mb-4">Change Password</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <div className="flex justify-end mt-4">
                          <button
                            onClick={handlePasswordChange}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Change Password
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}