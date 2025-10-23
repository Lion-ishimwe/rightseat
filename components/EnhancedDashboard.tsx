'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Menu, Bell, Settings, User, ChevronRight, BarChart3, Users, Briefcase, Target, TrendingUp, DollarSign, LogOut, ChevronDown } from "lucide-react";
import { clearAuthData } from "@/lib/auth";

export default function EnhancedDashboard() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Navigation menu items with icons
  const navigationItems = [
    { id: 1, title: "Dashboard", icon: BarChart3 },
    { id: 2, title: "HR Outsourcing", icon: Users },
    { id: 3, title: "Finance", icon: DollarSign },
    { id: 4, title: "Business Operation", icon: Briefcase },
    { id: 5, title: "Talent Curation", icon: TrendingUp },
  ];

  // News/announcements data
  const newsItems = [
    {
      id: 1,
      type: "News",
      content: "Agricultural and Commercial Banks actively carry out promotional activities for National Science and Technology Week 2021.",
      dotColor: "#ef4444",
      priority: "high",
    },
    {
      id: 2,
      type: "Notice",
      content: "Notice on issuing the 'Methods for Identifying Illegal Collection and Use of Personal Information by Apps'.",
      dotColor: "#f59e0b",
      priority: "medium",
    },
  ];

  // Statistics data
  const statsData = [
    {
      id: 1,
      title: "Total Employees",
      value: "1,234",
      change: "+12%",
      bgGradient: "from-blue-50 to-blue-100",
      textColor: "text-blue-900",
      icon: Users,
    },
    {
      id: 2,
      title: "Active Projects",
      value: "96",
      change: "+5%",
      bgGradient: "from-green-50 to-green-100",
      textColor: "text-green-900",
      icon: Briefcase,
    },
    {
      id: 3,
      title: "Completed Tasks",
      value: "28",
      change: "-2%",
      bgGradient: "from-purple-50 to-purple-100",
      textColor: "text-purple-900",
      icon: Target,
    },
    {
      id: 4,
      title: "Revenue Growth",
      value: "20%",
      change: "+8%",
      bgGradient: "from-orange-50 to-orange-100",
      textColor: "text-orange-900",
      icon: TrendingUp,
    },
  ];

  // Dashboard widgets data
  const dashboardWidgets = [
    { id: 1, title: "Performance Analytics", type: "chart" },
    { id: 2, title: "Recent Activity", type: "activity" },
    { id: 3, title: "Team Overview", type: "team" },
    { id: 4, title: "Project Status", type: "status" },
  ];

  const handleNavClick = (title: string) => {
    if (title === "HR Outsourcing") {
      router.push('/hr-outsourcing');
    } else if (title === "Business Operation") {
      router.push('/business-operation');
    } else if (title === "Finance") {
      router.push('/finance');
    } else if (title === "Talent Curation") {
      router.push('/talent-curation');
    } else {
      setActiveNav(title);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleLogout = () => {
    clearAuthData();
    router.push('/login');
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex">
        {/* Left Navigation Sidebar */}
        <nav className="w-80 min-h-screen bg-slate-800/50 backdrop-blur-xl border-r border-slate-700/50 sticky top-0">
          <div className="p-6">
            {/* Logo/Brand */}
            <button
              onClick={() => setActiveNav("Dashboard")}
              className="flex items-center space-x-3 mb-12 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Right Seat</span>
            </button>

            {/* Navigation Menu */}
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavClick(item.title)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                        activeNav === item.title
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

            {/* Bottom Navigation */}
            <div className="mt-12 pt-6 border-t border-slate-700/50 space-y-2">
              <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200">
                <Bell className="w-5 h-5" />
                <span className="font-medium">Alerts</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200">
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 p-6">
              <div className="flex items-center justify-between">
                {/* Search Bar */}
                <div className="flex-1 max-w-2xl relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="search"
                    placeholder="Search anything..."
                    value={searchQuery}
                    onChange={handleSearch}
                    className="w-full pl-12 pr-4 py-3 bg-slate-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-slate-700 placeholder-slate-400"
                  />
                </div>

                {/* User Profile */}
                <div className="flex items-center space-x-4">
                  <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                    <Bell className="w-5 h-5" />
                  </button>
                  <div className="relative user-menu-container">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-3 bg-slate-100 rounded-2xl p-2 hover:bg-slate-200 transition-colors"
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Lionel Ishimwe</p>
                        <p className="text-xs text-slate-500">Super Admin</p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm font-medium">Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </header>

            {/* Content Area */}
            <div className="p-6 space-y-6">
              {/* News/Announcements */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Latest Updates</h2>
                <div className="space-y-4">
                  {newsItems.map((item) => (
                    <article key={item.id} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer">
                      <div
                        className="w-3 h-3 rounded-full mt-2 flex-shrink-0"
                        style={{ backgroundColor: item.dotColor }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                            {item.type}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-slate-700 text-sm leading-relaxed">{item.content}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </article>
                  ))}
                </div>
              </section>

              {/* Statistics Cards */}
              <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {statsData.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.id} className={`bg-gradient-to-br ${stat.bgGradient} rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-md transition-all duration-200`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-white/50 ${stat.textColor}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className={`text-sm font-medium px-2 py-1 rounded-full ${
                          stat.change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {stat.change}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-600">{stat.title}</h3>
                        <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                      </div>
                    </div>
                  );
                })}
              </section>

              {/* Dashboard Widgets */}
              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {dashboardWidgets.map((widget) => (
                  <div key={widget.id} className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-slate-800">{widget.title}</h3>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                        <Menu className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="h-64 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex items-center justify-center">
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                          <BarChart3 className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-slate-500 font-medium">{widget.type} widget content</p>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
              </div>
          </div>
        </main>
      </div>
    </div>
  );
}