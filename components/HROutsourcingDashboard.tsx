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
  X,
  UserX,
  LogOut,
  Menu
} from "lucide-react";
import { getAuthUser, clearAuthData } from "../lib/auth";

export default function HROutsourcingDashboard() {
   const router = useRouter();
   const [activeNav, setActiveNav] = useState("HR Outsourcing");
   const [activeSubNav, setActiveSubNav] = useState("Dashboard");
   const [searchQuery, setSearchQuery] = useState("");
   const [selectedFilter, setSelectedFilter] = useState("all");
   const [staffList, setStaffList] = useState([]);
   const [authUser, setAuthUser] = useState<any>(null);
   const [showPasswordChange, setShowPasswordChange] = useState(false);
   const [showMobileMenu, setShowMobileMenu] = useState(false);
   const [passwordData, setPasswordData] = useState({
     current: '',
     new: '',
     confirm: ''
   });

  // Load staff data and check authentication on component mount
  useEffect(() => {
    const user = getAuthUser();
    if (!user || !user.permissions.includes('hr_module_access')) {
      router.push('/login');
      return;
    }
    setAuthUser(user);

    const saved = localStorage.getItem("staff_list");
    if (saved) {
      try {
        setStaffList(JSON.parse(saved));
      } catch (error) {
        console.error("Error parsing staff data:", error);
      }
    }
  }, [router]);

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

  // Calculate leave statistics from localStorage
  const leaveStats = useMemo(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("leave_requests");
      if (saved) {
        try {
          const leaveRequests = JSON.parse(saved);
          return {
            pendingRequests: leaveRequests.filter((req: any) => req.status === "Pending").length,
            approvedRequests: leaveRequests.filter((req: any) => req.status === "Approved").length,
            rejectedRequests: leaveRequests.filter((req: any) => req.status === "Rejected").length,
            employeesOnLeave: leaveRequests.filter((req: any) => {
              const today = new Date();
              const startDate = new Date(req.startDate);
              const endDate = new Date(req.endDate);
              return req.status === "Approved" && today >= startDate && today <= endDate;
            }).length
          };
        } catch (error) {
          console.error("Error parsing leave requests for stats:", error);
        }
      }
    }
    return {
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      employeesOnLeave: 0
    };
  }, []);

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
    {
      id: 3,
      title: "Pending Leave",
      value: leaveStats.pendingRequests.toString(),
      change: leaveStats.pendingRequests > 0 ? `${leaveStats.pendingRequests}` : "0",
      changeType: leaveStats.pendingRequests > 0 ? "neutral" : "positive",
      bgGradient: "from-yellow-50 to-yellow-100",
      textColor: "text-yellow-900",
      icon: Clock,
      description: "Awaiting approval"
    },
    {
      id: 4,
      title: "On Leave",
      value: leaveStats.employeesOnLeave.toString(),
      change: leaveStats.employeesOnLeave > 0 ? `${leaveStats.employeesOnLeave}` : "0",
      changeType: "neutral",
      bgGradient: "from-purple-50 to-purple-100",
      textColor: "text-purple-900",
      icon: UserX,
      description: "Currently on leave"
    },
  ];

  // Dashboard widgets data - load from localStorage
  const timeOffData = useMemo(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("leave_requests");
      if (saved) {
        try {
          const leaveRequests = JSON.parse(saved);
          // Get only pending and approved requests for dashboard display
          const relevantRequests = leaveRequests.filter((req: any) =>
            req.status === "Pending" || req.status === "Approved"
          ).slice(0, 3); // Limit to 3 items

          return relevantRequests.map((req: any) => ({
            name: req.employeeName,
            type: req.leaveType,
            dates: `${new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${req.startDate !== req.endDate ? '-' + new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}`,
            status: req.status
          }));
        } catch (error) {
          console.error("Error parsing leave requests:", error);
        }
      }
    }
    // Fallback data
    return [
      { name: "Sarah Johnson", type: "Annual Leave", dates: "Dec 18-22", status: "Pending" },
      { name: "Mike Chen", type: "Sick Leave", dates: "Dec 15", status: "Approved" },
      { name: "Emma Davis", type: "Personal", dates: "Dec 20", status: "Pending" }
    ];
  }, []);

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

    // Add pending leave requests from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("leave_requests");
      if (saved) {
        try {
          const leaveRequests = JSON.parse(saved);
          const pendingLeaves = leaveRequests.filter((req: any) => req.status === "Pending").slice(0, 3);

          pendingLeaves.forEach((leave: any) => {
            const requestedDate = new Date(leave.requestedDate);
            const hoursSinceRequested = Math.floor((now.getTime() - requestedDate.getTime()) / (1000 * 60 * 60));

            let timeString = "";
            if (hoursSinceRequested < 24) {
              timeString = `${hoursSinceRequested} hour${hoursSinceRequested > 1 ? 's' : ''} ago`;
            } else {
              const daysSinceRequested = Math.floor(hoursSinceRequested / 24);
              timeString = `${daysSinceRequested} day${daysSinceRequested > 1 ? 's' : ''} ago`;
            }

            activities.push({
              id: `leave-${leave.id}`,
              action: "Leave request needs approval",
              user: leave.employeeName,
              time: timeString,
              type: "warning"
            });
          });
        } catch (error) {
          console.error("Error parsing leave requests for activities:", error);
        }
      }
    }

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
    } else if (title === "Report") {
      router.push('/hr-outsourcing/report');
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
      <div className="flex flex-col md:flex-row h-screen">
        {/* Mobile Menu Button */}
        <div className="md:hidden bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">HR Outsourcing</h1>
                <p className="text-xs text-slate-400">Management System</p>
              </div>
            </div>
            <button
              onClick={() => setShowMobileMenu(true)}
              className="p-2 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Left Navigation Sidebar - Hidden on mobile, shown on md+ */}
        <nav className="hidden md:block w-80 h-screen bg-slate-800/50 backdrop-blur-xl border-r border-slate-700/50 overflow-y-auto sticky top-0">
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
            <ul className="space-y-1 md:space-y-2 mb-6 md:mb-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavClick(item.title)}
                      className={`w-full flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-2 md:py-3 rounded-xl transition-all duration-200 group ${
                        activeSubNav === item.title
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                          : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4 md:w-5 md:h-5" />
                      <span className="font-medium text-sm md:text-base">{item.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Quick Actions */}
            <div className="space-y-2 md:space-y-3 mb-6 md:mb-8">
              <h3 className="text-xs md:text-sm font-semibold text-slate-400 uppercase tracking-wide">Quick Actions</h3>
              <button className="w-full flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-2 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-lg transition-all duration-200">
                <PlusCircle className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">Add Employee</span>
              </button>
              <button className="w-full flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-2 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-lg transition-all duration-200">
                <FileText className="w-3 h-3 md:w-4 md:h-4" />
                <span className="text-xs md:text-sm">Generate Report</span>
              </button>
            </div>

            {/* Bottom Navigation */}
            <div className="pt-4 md:pt-6 border-t border-slate-700/50 space-y-1 md:space-y-2">
              <button className="w-full flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-2 md:py-3 rounded-xl text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200">
                <Bell className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-medium text-sm md:text-base">Alerts</span>
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">3</span>
              </button>
              <button className="w-full flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-2 md:py-3 rounded-xl text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200">
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
                <span className="font-medium text-sm md:text-base">Settings</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 h-screen overflow-y-auto">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Search Bar and Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 flex-1 max-w-3xl w-full md:w-auto">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                    <input
                      type="search"
                      placeholder="Search employees, projects, reports..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 md:pl-12 pr-4 py-2 md:py-3 bg-slate-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-slate-700 placeholder-slate-400 text-sm md:text-base"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="flex items-center space-x-2 px-3 md:px-4 py-2 md:py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                      <Filter className="w-4 h-4 text-slate-600" />
                      <span className="text-slate-700 font-medium text-sm md:text-base">Filter</span>
                    </button>
                    <button className="flex items-center space-x-2 px-3 md:px-4 py-2 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
                      <Download className="w-4 h-4" />
                      <span className="font-medium text-sm md:text-base">Export</span>
                    </button>
                  </div>
                </div>

                {/* User Profile */}
                <div className="flex items-center space-x-2 md:space-x-4 w-full md:w-auto justify-end">
                  <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                    <Bell className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                  </button>
                  <button
                    onClick={() => setShowPasswordChange(true)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <div className="flex items-center space-x-2 md:space-x-3 bg-slate-100 rounded-2xl p-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-semibold text-slate-800">{authUser?.user.email.split('@')[0] || 'User'}</p>
                      <p className="text-xs text-slate-500">{authUser?.role === 'hr_manager' ? 'HR Manager' : 'Admin'}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Logout"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </header>

            {/* Content Area */}
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Page Title */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-800">HR Dashboard</h1>
                  <p className="text-slate-600 mt-1 text-sm md:text-base">Manage your workforce and HR operations</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs md:text-sm text-slate-500">Last updated</p>
                  <p className="text-xs md:text-sm font-medium text-slate-700">{new Date().toLocaleString()}</p>
                </div>
              </div>


              {/* Statistics Cards */}
              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                {hrStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.id} className={`bg-gradient-to-br ${stat.bgGradient} rounded-2xl p-4 md:p-6 border border-white/50 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}>
                      <div className="flex items-center justify-between mb-3 md:mb-4">
                        <div className={`p-2 md:p-3 rounded-xl bg-white/50 ${stat.textColor} flex-shrink-0`}>
                          <Icon className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div className={`text-xs md:text-sm font-medium px-2 md:px-3 py-1 rounded-full flex-shrink-0 ${
                          stat.changeType === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {stat.changeType === 'positive' ? '+' : ''}{stat.change}
                        </div>
                      </div>
                      <div className="space-y-1 md:space-y-2 min-w-0">
                        <h3 className="text-xs md:text-sm font-medium text-slate-600 truncate">{stat.title}</h3>
                        <p className={`text-2xl md:text-3xl font-bold ${stat.textColor} truncate`}>{stat.value}</p>
                        <p className="text-xs text-slate-500 truncate">{stat.description}</p>
                      </div>
                    </div>
                  );
                })}
              </section>

              {/* Staff Access Cards */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-4 md:p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                    <div className="p-2 md:p-3 bg-indigo-100 rounded-xl flex-shrink-0">
                      <Users className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg md:text-xl font-semibold text-slate-800 truncate">Staff Access Overview</h3>
                      <p className="text-slate-500 text-sm md:text-base truncate">System access statistics and permissions</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* All Staff Access Card */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 md:p-6 border border-green-200 overflow-hidden">
                    <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4 min-w-0">
                      <div className="p-2 md:p-3 bg-green-500 rounded-xl flex-shrink-0">
                        <UserCheck className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base md:text-lg font-semibold text-green-800 truncate">All staff access the HR System</h4>
                        <p className="text-xs md:text-sm text-green-600 truncate">Grant full access to all employees</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl md:text-2xl font-bold text-green-800 truncate">{activeStaff}</span>
                      <span className="px-2 md:px-3 py-1 bg-green-200 text-green-700 rounded-full text-xs md:text-sm font-medium flex-shrink-0">Active Staff</span>
                    </div>
                  </div>

                  {/* No Access Granted Card */}
                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 md:p-6 border border-red-200 overflow-hidden">
                    <div className="flex items-center space-x-2 md:space-x-3 mb-3 md:mb-4 min-w-0">
                      <div className="p-2 md:p-3 bg-red-500 rounded-xl flex-shrink-0">
                        <UserIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base md:text-lg font-semibold text-red-800 truncate">No access granted</h4>
                        <p className="text-xs md:text-sm text-red-600 truncate">Employees without system access</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl md:text-2xl font-bold text-red-800 truncate">{inactiveStaff}</span>
                      <span className="px-2 md:px-3 py-1 bg-red-200 text-red-700 rounded-full text-xs md:text-sm font-medium flex-shrink-0">Inactive Staff</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Dashboard Widgets Grid */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Time Off Widget */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-4 md:p-6 hover:shadow-md transition-all duration-200 overflow-hidden">
                  <div className="flex items-center justify-between mb-4 md:mb-6 min-w-0">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base md:text-lg font-semibold text-slate-800 truncate">Time Off</h3>
                      <p className="text-xs md:text-sm text-slate-500 truncate">Pending requests and upcoming leaves</p>
                    </div>
                    <Clock className="w-5 h-5 md:w-6 md:h-6 text-slate-400 flex-shrink-0 ml-2" />
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    {timeOffData.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl overflow-hidden">
                        <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs md:text-sm font-medium">{item.name.charAt(0)}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-800 text-sm md:text-base truncate">{item.name}</p>
                            <p className="text-xs md:text-sm text-slate-500 truncate">{item.type} • {item.dates}</p>
                          </div>
                        </div>
                        <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Celebrations Widget */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-4 md:p-6 hover:shadow-md transition-all duration-200 overflow-hidden">
                  <div className="flex items-center justify-between mb-4 md:mb-6 min-w-0">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base md:text-lg font-semibold text-slate-800 truncate">Celebrations</h3>
                      <p className="text-xs md:text-sm text-slate-500 truncate">Birthdays</p>
                    </div>
                    <Award className="w-5 h-5 md:w-6 md:h-6 text-slate-400 flex-shrink-0 ml-2" />
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    {celebrationsData.map((item: any, index: number) => (
                      <div key={index} className="flex items-center space-x-3 md:space-x-4 p-3 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl overflow-hidden">
                        <span className="text-xl md:text-2xl flex-shrink-0">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 text-sm md:text-base truncate">{item.name}</p>
                          <p className="text-xs md:text-sm text-slate-600 truncate">{item.event}</p>
                        </div>
                        <span className="text-xs md:text-sm font-medium text-orange-600 flex-shrink-0 ml-2">{item.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Company Holidays Widget */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-4 md:p-6 hover:shadow-md transition-all duration-200 overflow-hidden">
                  <div className="flex items-center justify-between mb-4 md:mb-6 min-w-0">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base md:text-lg font-semibold text-slate-800 truncate">Company Holidays</h3>
                      <p className="text-xs md:text-sm text-slate-500 truncate">Upcoming holidays and events</p>
                    </div>
                    <Calendar className="w-5 h-5 md:w-6 md:h-6 text-slate-400 flex-shrink-0 ml-2" />
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    {holidaysData.map((item: any, index: number) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded-xl gap-2 overflow-hidden">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 text-sm md:text-base truncate">{item.name}</p>
                          <p className="text-xs md:text-sm text-slate-500 truncate">{item.type}</p>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span className="text-xs md:text-sm font-medium text-blue-600 truncate">{item.date}</span>
                          <button
                            onClick={() => openHolidayMessageModal(item)}
                            className="px-2 md:px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs md:text-sm font-medium flex-shrink-0"
                          >
                            Message
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gender Distribution Widget */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-4 md:p-6 hover:shadow-md transition-all duration-200 overflow-hidden">
                  <div className="flex items-center justify-between mb-4 md:mb-6 min-w-0">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base md:text-lg font-semibold text-slate-800 truncate">Gender Distribution</h3>
                      <p className="text-xs md:text-sm text-slate-500 truncate">Workforce demographics</p>
                    </div>
                    <Users className="w-5 h-5 md:w-6 md:h-6 text-slate-400 flex-shrink-0 ml-2" />
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    {/* Bar Chart */}
                    <div className="space-y-2 md:space-y-3">
                      <div className="flex items-center justify-between min-w-0">
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-500 rounded"></div>
                          <span className="text-xs md:text-sm text-slate-700">Male</span>
                        </div>
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <div className="w-16 md:w-20 bg-slate-200 rounded-full h-2 md:h-3 flex-1">
                            <div
                              className="bg-blue-500 h-2 md:h-3 rounded-full transition-all duration-500"
                              style={{ width: `${genderData.malePercent}%` }}
                            ></div>
                          </div>
                          <span className="text-xs md:text-sm font-semibold text-slate-800 w-8 md:w-12 text-right flex-shrink-0">{genderData.male}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between min-w-0">
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <div className="w-3 h-3 md:w-4 md:h-4 bg-pink-500 rounded"></div>
                          <span className="text-xs md:text-sm text-slate-700">Female</span>
                        </div>
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <div className="w-16 md:w-20 bg-slate-200 rounded-full h-2 md:h-3 flex-1">
                            <div
                              className="bg-pink-500 h-2 md:h-3 rounded-full transition-all duration-500"
                              style={{ width: `${genderData.femalePercent}%` }}
                            ></div>
                          </div>
                          <span className="text-xs md:text-sm font-semibold text-slate-800 w-8 md:w-12 text-right flex-shrink-0">{genderData.female}</span>
                        </div>
                      </div>
                    </div>
                    {/* Percentage Labels */}
                    <div className="flex justify-center space-x-4 md:space-x-6">
                      <div className="text-center">
                        <div className="text-xl md:text-2xl font-bold text-blue-600 truncate">{genderData.malePercent}%</div>
                        <div className="text-xs text-slate-500 truncate">Male</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl md:text-2xl font-bold text-pink-600 truncate">{genderData.femalePercent}%</div>
                        <div className="text-xs text-slate-500 truncate">Female</div>
                      </div>
                    </div>
                    <div className="text-center pt-2 border-t border-slate-200">
                      <span className="text-xl md:text-2xl font-bold text-slate-800 truncate">{genderData.total}</span>
                      <p className="text-xs md:text-sm text-slate-500 truncate">Total Employees</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Recent Activity */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-4 md:p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-4 md:mb-6 min-w-0">
                  <h3 className="text-base md:text-lg font-semibold text-slate-800 truncate">Recent Activity</h3>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {recentActivities.length > 5 && !showAllActivities && (
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                    <button
                      onClick={() => setShowAllActivities(!showAllActivities)}
                      className="text-blue-600 hover:text-blue-700 text-xs md:text-sm font-medium"
                    >
                      {showAllActivities ? 'Show Less' : 'View All'}
                    </button>
                  </div>
                </div>
                <div className="space-y-3 md:space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 md:space-x-4 p-3 hover:bg-slate-50 rounded-xl transition-colors overflow-hidden">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        activity.type === 'success' ? 'bg-green-500' :
                        activity.type === 'warning' ? 'bg-yellow-500' :
                        activity.type === 'urgent' ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 text-sm md:text-base truncate">{activity.action}</p>
                        <p className="text-xs md:text-sm text-slate-500 truncate">by {activity.user}</p>
                      </div>
                      <span className="text-xs md:text-sm text-slate-400 flex-shrink-0">{activity.time}</span>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-4 md:p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base md:text-lg font-semibold text-slate-800">Send Message for {selectedHoliday.name}</h3>
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700 resize-none text-sm md:text-base"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => setShowHolidayMessageModal(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendHolidayMessage}
                    disabled={!holidayMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
                  >
                    Send to All Staff
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Navigation Modal */}
        {showMobileMenu && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
            <div className="fixed inset-y-0 left-0 w-80 bg-slate-800/95 backdrop-blur-xl border-r border-slate-700/50 overflow-y-auto">
              <div className="p-6">
                {/* Close button */}
                <div className="flex justify-end mb-6">
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

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
                      <li key={item.title}>
                        <button
                          onClick={() => {
                            handleNavClick(item.title);
                            setShowMobileMenu(false);
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                            activeSubNav === item.title
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                              : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
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
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordChange && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-xl border border-slate-200/50 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-semibold text-slate-800">Change Password</h3>
                <button
                  onClick={() => setShowPasswordChange(false)}
                  className="text-slate-400 hover:text-slate-600 text-xl md:text-2xl"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.new}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={passwordData.confirm}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                <button
                  onClick={() => setShowPasswordChange(false)}
                  className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 order-1 sm:order-2"
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