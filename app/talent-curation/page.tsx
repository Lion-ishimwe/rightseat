'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Search, Star, Award, TrendingUp, Filter, UserPlus, Eye, MessageSquare } from 'lucide-react';

export default function TalentCurationPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('candidates');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'candidates', label: 'Candidates', icon: Users },
    { id: 'pipeline', label: 'Pipeline', icon: TrendingUp },
    { id: 'interviews', label: 'Interviews', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: Award },
  ];

  const candidates = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Senior Software Engineer',
      skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
      experience: '5 years',
      rating: 4.8,
      status: 'Shortlisted',
      avatar: 'SJ'
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Product Manager',
      skills: ['Agile', 'Scrum', 'Analytics', 'Leadership'],
      experience: '7 years',
      rating: 4.9,
      status: 'Interviewing',
      avatar: 'MC'
    },
    {
      id: 3,
      name: 'Emily Davis',
      role: 'UX Designer',
      skills: ['Figma', 'Sketch', 'User Research', 'Prototyping'],
      experience: '4 years',
      rating: 4.7,
      status: 'New',
      avatar: 'ED'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Shortlisted': return 'bg-yellow-100 text-yellow-800';
      case 'Interviewing': return 'bg-blue-100 text-blue-800';
      case 'New': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Talent Curation</h1>
              <p className="text-slate-600">Discover and manage top talent</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-slate-700 placeholder-slate-400"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
              <UserPlus className="w-4 h-4" />
              <span>Add Candidate</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200/50">
        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="p-6">
        {activeTab === 'candidates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Candidate Pool</h2>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-600" />
                <span className="text-sm text-slate-600">Filter by skills, experience</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {candidates.map((candidate) => (
                <div key={candidate.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold">
                        {candidate.avatar}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{candidate.name}</h3>
                        <p className="text-sm text-slate-600">{candidate.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-slate-700">{candidate.rating}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Experience</p>
                      <p className="text-sm font-medium text-slate-800">{candidate.experience}</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500 mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {candidate.skills.map((skill, index) => (
                          <span key={index} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-lg">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(candidate.status)}`}>
                        {candidate.status}
                      </span>
                      <div className="flex space-x-2">
                        <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Recruitment Pipeline</h2>
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">Pipeline visualization coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'interviews' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Interview Schedule</h2>
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">Interview management coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Talent Analytics</h2>
            <div className="text-center py-12">
              <Award className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">Analytics dashboard coming soon</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}