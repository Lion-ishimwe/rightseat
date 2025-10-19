import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Settings,
  User,
  ChevronRight,
  BarChart3,
  Users,
  Briefcase,
  Target,
  TrendingUp,
  FileText,
  Calendar,
  Clock,
  Award,
  Home,
  UserCheck,
  PlusCircle,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  User as UserIcon,
  X
} from "lucide-react";

export default function HROutsourcingDashboard() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("HR Outsourcing");
  const [activeSubNav, setActiveSubNav] = useState("Dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [staffList, setStaffList] = useState([]);

  // Load staff data from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("staff_list");
    if (saved) {
      try {
        setStaffList(JSON.parse(saved));
      } catch (error) {
        console.error("Error parsing staff data:", error);
      }
    }
  }, []);

  // Check for birthdays today and send automatic message
  useEffect(() => {
    const checkBirthdays = () => {
      const today = new Date();
      const todayString = `${today.getMonth() + 1}-${today.getDate()}`;

      staffList.forEach((staff: any) => {
        if (staff.dateOfBirth) {
          const birthDate = new Date(staff.dateOfBirth);
          const birthString = `${birthDate.getMonth() + 1}-${birthDate.getDate()}`;

          if (birthString === todayString) {
            // Send automatic birthday message
            console.log(`Dear ${staff.name}, Right Seat is wishing you Happy Birthday! 🎂`);
            // In a real implementation, this would send an email or notification
            // For now, we'll log it as a placeholder
          }
        }
      });
    };

    // Check immediately on mount
    checkBirthdays();

    // Set up daily check at midnight
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const timeUntilMidnight = midnight.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      checkBirthdays();
      // Then check every 24 hours
      const interval = setInterval(checkBirthdays, 24 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }, timeUntilMidnight);

    return () => clearTimeout(timeout);
  }, [staffList]);

  // Calculate staff statistics
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((staff: any) => staff.status === "Active").length;
  const inactiveStaff = totalStaff - activeStaff;

  // Navigation menu items
  const navigationItems = [
    { id: 1, title: "Dashboard", icon: BarChart3, href: "/" },
    { id: 2, title: "My Info", icon: User },
    { id: 3, title: "People", icon: Users },
    { id: 4, title: "Leave Management", icon: Calendar },
    { id: 5, title: "Report", icon: FileText },
    { id: 6, title: "E-Signature", icon: Award },
  ];

  // HR Statistics data type
  interface HRStat {
    id: number;
    title: string;
    value: string;
    change: string;
    changeType: string;
    bgGradient: string;
    textColor: string;
    icon: any;
    description: string;
  }

  // HR Statistics data
  const hrStats: HRStat[] = [
    {
      id: 1,
      title: "Total Staff",
      value: totalStaff.toString(),
      change: "+12",
      changeType: "positive",
      bgGradient: "from-blue-50 to-blue-100",
      textColor: "text-blue-900",
      icon: Users,
      description: "All employees"
    },
    {
      id: 2,
      title: "Active Staff",
      value: activeStaff.toString(),
      change: "+8",
      changeType: "positive",
      bgGradient: "from-green-50 to-green-100",
      textColor: "text-green-900",
      icon: UserCheck,
      description: "Currently active"
    },
  ];

  // Dashboard widgets data
  const timeOffData = [
    { name: "Sarah Johnson", type: "Annual Leave", dates: "Dec 18-22", status: "Pending" },
    { name: "Mike Chen", type: "Sick Leave", dates: "Dec 15", status: "Approved" },
    { name: "Emma Davis", type: "Personal", dates: "Dec 20", status: "Pending" }
  ];

  // Rwanda public holidays
  const rwandaHolidays = [
    { name: "New Year's Day", month: 0, day: 1 },
    { name: "Liberation Day", month: 1, day: 1 },
    { name: "International Women's Day", month: 2, day: 8 },
    { name: "Independence Day", month: 6, day: 1 },
    { name: "Assumption Day", month: 7, day: 15 },
    { name: "Patriots' Day", month: 9, day: 1 },
    { name: "Christmas Day", month: 11, day: 25 },
    { name: "Boxing Day", month: 11, day: 26 }
  ];

  // Calculate upcoming celebrations (birthdays in the next month)
  const getUpcomingCelebrations = () => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);

    const celebrations: Array<{ name: string; event: string; date: string; icon: string }> = [];

    // Add staff birthdays
    staffList.forEach((staff: any) => {
      if (staff.dateOfBirth) {
        const birthDate = new Date(staff.dateOfBirth);
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        if (thisYearBirthday >= today && thisYearBirthday <= nextMonth) {
          celebrations.push({
            name: staff.name,
            event: "Birthday",
            date: thisYearBirthday.toLocaleDateString(),
            icon: "🎂"
          });
        }
      }
    });

    return celebrations.slice(0, 3); // Limit to 3 items
  };

  const celebrationsData = getUpcomingCelebrations();

  const [holidaysData, setHolidaysData] = useState([
    { id: 1, name: "Christmas Day", date: "Dec 25, 2024", type: "Public Holiday", message: "" },
    { id: 2, name: "New Year's Day", date: "Jan 1, 2025", type: "Public Holiday", message: "" },
    { id: 3, name: "Team Building", date: "Jan 15, 2025", type: "Company Event", message: "" }
  ]);

  const [showHolidayMessageModal, setShowHolidayMessageModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<any>(null);
  const [holidayMessage, setHolidayMessage] = useState("");
  const [showAllActivities, setShowAllActivities] = useState(false);

  const openHolidayMessageModal = (holiday: any) => {
    setSelectedHoliday(holiday);
    setHolidayMessage(holiday.message || "");
    setShowHolidayMessageModal(true);
  };

  const sendHolidayMessage = () => {
    if (!selectedHoliday || !holidayMessage.trim()) return;

    // Update the holiday with the message
    setHolidaysData(prev => prev.map(holiday =>
      holiday.id === selectedHoliday.id
        ? { ...holiday, message: holidayMessage }
        : holiday
    ));

    // Send personalized message to each staff member
    staffList.forEach((staff: any) => {
      const personalizedMessage = `Dear ${staff.name},\n\n${holidayMessage}\n\nBest regards,\nHR Team`;
      console.log(`Message sent to ${staff.name}: "${personalizedMessage}" for ${selectedHoliday.name}`);
      // In a real implementation, this would send an email/notification to each staff member
    });

    // Close modal and reset
    setShowHolidayMessageModal(false);
    setSelectedHoliday(null);
    setHolidayMessage("");

    // Show success message
    alert(`Personalized messages sent to all ${staffList.length} staff members for ${selectedHoliday.name}!`);
  };

  const genderData = {
    male: staffList.filter((staff: any) => staff.gender === "Male").length,
    female: staffList.filter((staff: any) => staff.gender === "Female").length,
    total: totalStaff,
    malePercent: totalStaff > 0 ? Math.round((staffList.filter((staff: any) => staff.gender === "Male").length / totalStaff) * 100) : 0,
    femalePercent: totalStaff > 0 ? Math.round((staffList.filter((staff: any) => staff.gender === "Female").length / totalStaff) * 100) : 0
  };

  // Debug: Log gender data to console
  console.log('Gender Data:', genderData);

  // Recent activities data - dynamically generated
  const recentActivities = useMemo(() => {
    const activities: Array<{ id: string; action: string; user: string; time: string; type: string }> = [];
    const now = new Date();

    // Add new employees (created within last 7 days)
    staffList.forEach((staff: any) => {
      if (staff.createdAt) {
        const createdDate = new Date(staff.createdAt);
        const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceCreated <= 7) {
          activities.push({
            id: `new-employee-${staff.id}`,
            action: "New employee onboarded",
            user: staff.name,
            time: daysSinceCreated === 0 ? "Today" : `${daysSinceCreated} day${daysSinceCreated > 1 ? 's' : ''} ago`,
            type: "success"
          });
        }
      }
    });

    // Add pending leave requests (mock data for now - in real app would come from leave system)
    const pendingLeaves = [
      { id: 1, user: "Mike Chen", time: "4 hours ago" },
      { id: 2, user: "Sarah Johnson", time: "1 day ago" }
    ];

    pendingLeaves.forEach(leave => {
      activities.push({
        id: `leave-${leave.id}`,
        action: "Leave request needs approval",
        user: leave.user,
        time: leave.time,
        type: "warning"
      });
    });

    // Add pending onboarding tasks
    const pendingOnboardingTasks = [
      { id: 1, title: "Complete employment forms", assignedTo: "Lionel Ishimwe", time: "2 days ago" },
      { id: 2, title: "Upload ID documents", assignedTo: "Sarah Johnson", time: "1 day ago" },
      { id: 3, title: "Attend orientation", assignedTo: "Mike Chen", time: "3 hours ago" }
    ];

    pendingOnboardingTasks.forEach(task => {
      activities.push({
        id: `onboarding-${task.id}`,
        action: `Onboarding task pending: ${task.title}`,
        user: task.assignedTo,
        time: task.time,
        type: "info"
      });
    });

    // Note: Project deadlines removed from recent activities as requested

    // Sort by time (most recent first)
    const sortedActivities = activities
      .sort((a, b) => {
        // Simple sorting - in real app would parse time strings properly
        const timeOrder = { "urgent": 0, "warning": 1, "info": 2, "success": 3 };
        return timeOrder[a.type as keyof typeof timeOrder] - timeOrder[b.type as keyof typeof timeOrder];
      });

    // Return only 5 items initially, or all if showAllActivities is true
    return showAllActivities ? sortedActivities : sortedActivities.slice(0, 5);
  }, [staffList, showAllActivities]);

  const handleNavClick = (title: string) => {
    if (title === "My Info") {
      router.push('/hr-outsourcing/my-info');
    } else if (title === "People") {
      router.push('/hr-outsourcing/people');
    } else if (title === "Leave Management") {
      router.push('/hr-outsourcing/leave-management');
    } else if (title === "E-Signature") {
      router.push('/hr-outsourcing/e-signature');
    } else {
      setActiveSubNav(title);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex h-screen">
        {/* Left Navigation Sidebar */}
        <nav className="w-80 h-screen bg-slate-800/50 backdrop-blur-xl border-r border-slate-700/50 overflow-y-auto">
          <div className="p-6">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">HR Outsourcing</h1>
                <p className="text-sm text-slate-400">Management System</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <ul className="space-y-2 mb-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavClick(item.title)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                        activeSubNav === item.title
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

            {/* Quick Actions */}
            <div className="space-y-3 mb-8">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Quick Actions</h3>
              <button className="w-full flex items-center space-x-3 px-4 py-2 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-lg transition-all duration-200">
                <PlusCircle className="w-4 h-4" />
                <span className="text-sm">Add Employee</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-4 py-2 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-lg transition-all duration-200">
                <FileText className="w-4 h-4" />
                <span className="text-sm">Generate Report</span>
              </button>
            </div>

            {/* Bottom Navigation */}
            <div className="pt-6 border-t border-slate-700/50 space-y-2">
              <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200">
                <Bell className="w-5 h-5" />
                <span className="font-medium">Alerts</span>
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">3</span>
              </button>
              <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200">
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
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
                {/* Search Bar and Filters */}
                <div className="flex items-center space-x-4 flex-1 max-w-3xl">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="search"
                      placeholder="Search employees, projects, reports..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-slate-700 placeholder-slate-400"
                    />
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                    <Filter className="w-4 h-4 text-slate-600" />
                    <span className="text-slate-700 font-medium">Filter</span>
                  </button>
                  <button className="flex items-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
                    <Download className="w-4 h-4" />
                    <span className="font-medium">Export</span>
                  </button>
                </div>

                {/* User Profile */}
                <div className="flex items-center space-x-4">
                  <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                  </button>
                  <div className="flex items-center space-x-3 bg-slate-100 rounded-2xl p-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Lionel Ishimwe</p>
                      <p className="text-xs text-slate-500">Admin</p>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* Content Area */}
            <div className="p-6 space-y-6">
              {/* Page Title */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">HR Dashboard</h1>
                  <p className="text-slate-600 mt-1">Manage your workforce and HR operations</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Last updated</p>
                  <p className="text-sm font-medium text-slate-700">{new Date().toLocaleString()}</p>
                </div>
              </div>


              {/* Statistics Cards */}
              <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {hrStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.id} className={`bg-gradient-to-br ${stat.bgGradient} rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-md transition-all duration-200`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-white/50 ${stat.textColor}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                          stat.changeType === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {stat.changeType === 'positive' ? '+' : ''}{stat.change}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-600">{stat.title}</h3>
                        <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                        <p className="text-xs text-slate-500">{stat.description}</p>
                      </div>
                    </div>
                  );
                })}
              </section>

              {/* Staff Access Cards */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                      <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800">Staff Access Overview</h3>
                      <p className="text-slate-500">System access statistics and permissions</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* All Staff Access Card */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-3 bg-green-500 rounded-xl">
                        <UserCheck className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-green-800">All staff access the HR System</h4>
                        <p className="text-sm text-green-600">Grant full access to all employees</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-green-800">{activeStaff}</span>
                      <span className="px-3 py-1 bg-green-200 text-green-700 rounded-full text-sm font-medium">Active Staff</span>
                    </div>
                  </div>

                  {/* No Access Granted Card */}
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-3 bg-red-500 rounded-xl">
                        <UserIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-red-800">No access granted</h4>
                        <p className="text-sm text-red-600">Employees without system access</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-red-800">{inactiveStaff}</span>
                      <span className="px-3 py-1 bg-red-200 text-red-700 rounded-full text-sm font-medium">Inactive Staff</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Dashboard Widgets Grid */}
              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Time Off Widget */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">Time Off</h3>
                      <p className="text-sm text-slate-500">Pending requests and upcoming leaves</p>
                    </div>
                    <Clock className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="space-y-4">
                    {timeOffData.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">{item.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{item.name}</p>
                            <p className="text-sm text-slate-500">{item.type} • {item.dates}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Celebrations Widget */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">Celebrations</h3>
                      <p className="text-sm text-slate-500">Birthdays</p>
                    </div>
                    <Award className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="space-y-4">
                    {celebrationsData.map((item: any, index: number) => (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl">
                        <span className="text-2xl">{item.icon}</span>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{item.name}</p>
                          <p className="text-sm text-slate-600">{item.event}</p>
                        </div>
                        <span className="text-sm font-medium text-orange-600">{item.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Company Holidays Widget */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">Company Holidays</h3>
                      <p className="text-sm text-slate-500">Upcoming holidays and events</p>
                    </div>
                    <Calendar className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="space-y-4">
                    {holidaysData.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{item.name}</p>
                          <p className="text-sm text-slate-500">{item.type}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-blue-600">{item.date}</span>
                          <button
                            onClick={() => openHolidayMessageModal(item)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                          >
                            Message
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gender Distribution Widget */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">Gender Distribution</h3>
                      <p className="text-sm text-slate-500">Workforce demographics</p>
                    </div>
                    <Users className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="space-y-4">
                    {/* Bar Chart */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                          <span className="text-sm text-slate-700">Male</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-slate-200 rounded-full h-3">
                            <div
                              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${genderData.malePercent}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-slate-800 w-12 text-right">{genderData.male}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-pink-500 rounded"></div>
                          <span className="text-sm text-slate-700">Female</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-slate-200 rounded-full h-3">
                            <div
                              className="bg-pink-500 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${genderData.femalePercent}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-slate-800 w-12 text-right">{genderData.female}</span>
                        </div>
                      </div>
                    </div>
                    {/* Percentage Labels */}
                    <div className="flex justify-center space-x-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{genderData.malePercent}%</div>
                        <div className="text-xs text-slate-500">Male</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-pink-600">{genderData.femalePercent}%</div>
                        <div className="text-xs text-slate-500">Female</div>
                      </div>
                    </div>
                    <div className="text-center pt-2 border-t border-slate-200">
                      <span className="text-2xl font-bold text-slate-800">{genderData.total}</span>
                      <p className="text-sm text-slate-500">Total Employees</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Recent Activity */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-slate-800">Recent Activity</h3>
                  <div className="flex items-center space-x-2">
                    {recentActivities.length > 5 && !showAllActivities && (
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                    <button
                      onClick={() => setShowAllActivities(!showAllActivities)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {showAllActivities ? 'Show Less' : 'View All'}
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.type === 'success' ? 'bg-green-500' :
                        activity.type === 'warning' ? 'bg-yellow-500' :
                        activity.type === 'urgent' ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-slate-800">{activity.action}</p>
                        <p className="text-sm text-slate-500">by {activity.user}</p>
                      </div>
                      <span className="text-sm text-slate-400">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </section>
              </div>
            </div>
          </main>
        </div>

        {/* Holiday Message Modal */}
        {showHolidayMessageModal && selectedHoliday && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Send Message for {selectedHoliday.name}</h3>
                <button
                  onClick={() => setShowHolidayMessageModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Message to All Staff
                  </label>
                  <textarea
                    value={holidayMessage}
                    onChange={(e) => setHolidayMessage(e.target.value)}
                    placeholder="Write your holiday message here..."
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowHolidayMessageModal(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendHolidayMessage}
                    disabled={!holidayMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Send to All Staff
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }