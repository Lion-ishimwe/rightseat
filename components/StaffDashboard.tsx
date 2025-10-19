import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Users,
  Award,
  Clock,
  CheckCircle2,
  User,
  Briefcase,
  FileText,
  Target,
  UserCheck,
  Bell,
  BarChart3,
  TrendingUp,
  CalendarDays,
  Gift,
  PartyPopper
} from "lucide-react";

interface StaffDashboardProps {
  staffId: number;
  onClose: () => void;
  currentUser?: any;
}

export default function StaffDashboard({ staffId, onClose, currentUser }: StaffDashboardProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [divisionColleagues, setDivisionColleagues] = useState<any[]>([]);
  const [relevantLeaveRequests, setRelevantLeaveRequests] = useState<any[]>([]);

  // Load staff information and colleagues
  useEffect(() => {
    const staffData = JSON.parse(localStorage.getItem('staff_list') || '[]');
    const selectedStaff = staffData.find((staff: any) => staff.id === staffId);
    
    if (selectedStaff) {
      setStaffInfo(selectedStaff);
      
      // Get colleagues in the same division
      const colleagues = staffData.filter((staff: any) => 
        staff.department === selectedStaff.department && staff.id !== staffId
      );
      setDivisionColleagues(colleagues);
    }

    // Load leave requests (sample data - in real app would filter by department/team)
    const leaveData = [
      {
        id: 1,
        employeeName: "Sarah Johnson",
        leaveType: "Annual Leave",
        startDate: "2024-12-20",
        endDate: "2024-12-22",
        days: 3,
        status: "Pending"
      },
      {
        id: 2,
        employeeName: "Mike Chen",
        leaveType: "Sick Leave",
        startDate: "2024-12-15",
        endDate: "2024-12-16",
        days: 2,
        status: "Approved"
      }
    ];
    setRelevantLeaveRequests(leaveData);
  }, [staffId]);

  // Get upcoming birthdays in the division
  const getUpcomingBirthdays = () => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    
    const birthdays = divisionColleagues.map(colleague => {
      // Mock birthday data - in real app would come from employee records
      const mockBirthday = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
      return {
        name: colleague.name,
        date: mockBirthday.toLocaleDateString(),
        department: colleague.department
      };
    }).slice(0, 3); // Show only next 3 birthdays

    return birthdays;
  };

  const upcomingBirthdays = getUpcomingBirthdays();

  // Dashboard tabs
  const dashboardTabs = [
    { id: "dashboard", name: "Dashboard", icon: BarChart3 },
    { id: "myinfo", name: "My Info", icon: User }
  ];

  // Check if current user is admin (can create/edit tasks)
  const isAdmin = currentUser?.role === "Admin" || currentUser?.name === "Lionel Ishimwe";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {staffInfo?.name?.charAt(0) || ""}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{staffInfo?.name}</h2>
              <p className="text-slate-600">{staffInfo?.position} • {staffInfo?.department}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 p-2 border-b border-slate-200">
          {dashboardTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Division Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Division Stats */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-blue-500 rounded-xl">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-blue-800">Your Division</h4>
                      <p className="text-sm text-blue-600">{staffInfo?.department}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-blue-800">{divisionColleagues.length + 1}</span>
                    <span className="px-3 py-1 bg-blue-200 text-blue-700 rounded-full text-sm font-medium">Team Members</span>
                  </div>
                </div>

                {/* Pending Leave Requests */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-yellow-500 rounded-xl">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-yellow-800">Pending Requests</h4>
                      <p className="text-sm text-yellow-600">Team leave requests</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-yellow-800">
                      {relevantLeaveRequests.filter(r => r.status === "Pending").length}
                    </span>
                    <span className="px-3 py-1 bg-yellow-200 text-yellow-700 rounded-full text-sm font-medium">Awaiting</span>
                  </div>
                </div>

                {/* Celebrations */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-purple-500 rounded-xl">
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-purple-800">Celebrations</h4>
                      <p className="text-sm text-purple-600">Upcoming events</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-purple-800">{upcomingBirthdays.length}</span>
                    <span className="px-3 py-1 bg-purple-200 text-purple-700 rounded-full text-sm font-medium">This Month</span>
                  </div>
                </div>
              </div>

              {/* Upcoming Birthdays */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-pink-100 rounded-xl">
                    <PartyPopper className="w-6 h-6 text-pink-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">Upcoming Birthdays in {staffInfo?.department}</h3>
                    <p className="text-slate-500">Celebrate with your division colleagues</p>
                  </div>
                </div>

                {upcomingBirthdays.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingBirthdays.map((birthday, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-xl">
                        <span className="text-2xl">🎂</span>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{birthday.name}</p>
                          <p className="text-sm text-slate-600">{birthday.department}</p>
                        </div>
                        <span className="text-sm font-medium text-orange-600">{birthday.date}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PartyPopper className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No upcoming birthdays in your division this month</p>
                  </div>
                )}
              </div>

              {/* Leave Requests */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">Recent Leave Requests</h3>
                    <p className="text-slate-500">Team leave activity</p>
                  </div>
                </div>

                {relevantLeaveRequests.length > 0 ? (
                  <div className="space-y-4">
                    {relevantLeaveRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">{request.employeeName.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{request.employeeName}</p>
                            <p className="text-sm text-slate-600">{request.leaveType} • {request.days} day{request.days > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No recent leave requests</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* My Info Tab */}
          {activeTab === "myinfo" && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">Personal Information</h3>
                    <p className="text-slate-500">View your employment details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                      <p className="text-slate-800 font-semibold">{staffInfo?.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <p className="text-slate-800">{staffInfo?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                      <p className="text-slate-800">{staffInfo?.position}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                      <p className="text-slate-800">{staffInfo?.department}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Hire Date</label>
                      <p className="text-slate-800">{staffInfo?.hireDate}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        staffInfo?.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {staffInfo?.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned Tasks */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <UserCheck className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800">My Onboarding Tasks</h3>
                      <p className="text-slate-500">
                        {isAdmin ? "Create and manage tasks" : "View tasks assigned to you"}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <button className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm font-medium">Create Task</span>
                    </button>
                  )}
                </div>

                {/* Sample tasks for demonstration */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-medium text-slate-800">Complete employment forms</p>
                        <p className="text-sm text-slate-600">Assigned by HR • Due: Dec 24, 2024</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      Completed
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <Clock className="w-6 h-6 text-yellow-600" />
                      <div>
                        <p className="font-medium text-slate-800">Upload ID documents</p>
                        <p className="text-sm text-slate-600">Assigned by HR • Due: Dec 20, 2024</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      Pending
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <Clock className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="font-medium text-slate-800">Attend orientation session</p>
                        <p className="text-sm text-slate-600">Assigned by Manager • Due: Dec 18, 2024</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      In Progress
                    </span>
                  </div>
                </div>

                {!isAdmin && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-800 font-medium">
                      📋 You can view and complete tasks assigned to you, but cannot create new tasks.
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Only administrators can create and assign tasks to team members.
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Actions for the Staff Member */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">Quick Actions</h3>
                    <p className="text-slate-500">Common tasks and shortcuts</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button className="flex items-center space-x-3 p-4 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">Request Leave</span>
                  </button>
                  <button className="flex items-center space-x-3 p-4 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors">
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">View Payslips</span>
                  </button>
                  <button className="flex items-center space-x-3 p-4 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors">
                    <Award className="w-5 h-5" />
                    <span className="font-medium">Performance Goals</span>
                  </button>
                  <button className="flex items-center space-x-3 p-4 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 transition-colors">
                    <UserCheck className="w-5 h-5" />
                    <span className="font-medium">Update Profile</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* My Info Tab */}
          {activeTab === "myinfo" && (
            <div className="space-y-6">
              {/* Task Permissions Notice */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <UserCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">Task Management Permissions</h3>
                    <p className="text-slate-500">Your role-based access levels</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-slate-800">View Assigned Tasks</span>
                      </div>
                      <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs font-medium">Enabled</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-slate-800">Complete Tasks</span>
                      </div>
                      <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs font-medium">Enabled</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-slate-800">Upload Documents</span>
                      </div>
                      <span className="px-2 py-1 bg-green-200 text-green-800 rounded-full text-xs font-medium">Enabled</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className={`flex items-center justify-between p-4 rounded-xl ${
                      isAdmin ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <div className="flex items-center space-x-3">
                        {isAdmin ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <X className="w-5 h-5 text-red-600" />
                        )}
                        <span className="font-medium text-slate-800">Create Tasks</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isAdmin ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {isAdmin ? 'Admin Only' : 'Restricted'}
                      </span>
                    </div>

                    <div className={`flex items-center justify-between p-4 rounded-xl ${
                      isAdmin ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <div className="flex items-center space-x-3">
                        {isAdmin ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <X className="w-5 h-5 text-red-600" />
                        )}
                        <span className="font-medium text-slate-800">Assign Tasks to Others</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isAdmin ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {isAdmin ? 'Admin Only' : 'Restricted'}
                      </span>
                    </div>

                    <div className={`flex items-center justify-between p-4 rounded-xl ${
                      isAdmin ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      <div className="flex items-center space-x-3">
                        {isAdmin ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <X className="w-5 h-5 text-red-600" />
                        )}
                        <span className="font-medium text-slate-800">Manage Templates</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isAdmin ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {isAdmin ? 'Admin Only' : 'Restricted'}
                      </span>
                    </div>
                  </div>
                </div>

                {!isAdmin && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-800 font-medium">
                      🔒 Limited Access: You can receive and complete tasks assigned to you, but cannot create tasks for others.
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Contact your administrator if you need to create or assign tasks to team members.
                    </p>
                  </div>
                )}
              </div>

              {/* Role Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Briefcase className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800">Role & Responsibilities</h3>
                    <p className="text-slate-500">Your current role and access level</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Current Role:</span>
                    <span className="font-semibold text-slate-800">
                      {isAdmin ? "Administrator" : "Employee"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Access Level:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isAdmin ? "Full Access" : "Standard User"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">Can Create Tasks:</span>
                    <span className={`font-medium ${isAdmin ? 'text-green-600' : 'text-red-600'}`}>
                      {isAdmin ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}