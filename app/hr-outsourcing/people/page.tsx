'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  PlusCircle,
  UserCheck,
  User as UserIcon,
  X,
  Search,
  Bell,
  Settings,
  BarChart3,
  Briefcase,
  Calendar,
  FileText,
  Award,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Filter,
  Edit
} from "lucide-react";
import EmployeeInfoForm from "../../../components/EmployeeInfoForm";
import { LeaveAccrualService, type Client, type Staff } from "../../../utils/leaveAccrualService";
import { DailyAccrualTracker } from "../../../utils/dailyAccrualTracker";
import { initializeExistingStaffBalances, showLeaveBalanceSummary } from "../../../utils/initializeExistingStaff";

export default function PeoplePage() {
  const router = useRouter();
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupBy, setGroupBy] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"People">("People");

  // Initialize daily accrual tracking when component mounts
  React.useEffect(() => {
    // Initialize existing staff balances first
    initializeExistingStaffBalances();
    
    // Check and run daily accrual
    DailyAccrualTracker.checkAndRunDailyAccrual();
    
    // Initialize missing balances for existing staff
    DailyAccrualTracker.initializeMissingBalances();
    
    // Show summary in console for verification
    setTimeout(() => {
      showLeaveBalanceSummary();
    }, 1000);
  }, []);

  // Client management states
  const [clients, setClients] = useState<any[]>(() => {
    const defaultClients = [
      {
        id: 1,
        name: "TechCorp Ltd",
        annualLeave: 25,
        sickLeave: 12,
        personalLeave: 5,
        maternityLeave: 90,
        paternityLeave: 15,
        studyLeave: 10,
        createdAt: "2024-01-01"
      },
      {
        id: 2,
        name: "StartupXYZ Inc",
        annualLeave: 18,
        sickLeave: 10,
        personalLeave: 3,
        maternityLeave: 84,
        paternityLeave: 14,
        studyLeave: 5,
        createdAt: "2024-02-15"
      }
    ];

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("leave_management_clients");
      if (saved) {
        try { return JSON.parse(saved); } catch { /* fall through */ }
      } else {
        // Save default clients to localStorage if it doesn't exist
        localStorage.setItem("leave_management_clients", JSON.stringify(defaultClients));
      }
    }
    
    return defaultClients;
  });

  // Form data state
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    gender: "",
    nationality: "",
    idNumber: "",
    birthDate: "",
    rssbNumber: "",
    maritalStatus: "",

    // Address Information
    country: "",
    province: "",
    city: "",
    postalCode: "",
    street: "",

    // Contact Information
    mobilePhone: "",
    workPhone: "",
    workEmail: "",
    homeEmail: "",

    // Job Information
    hireDate: "",
    employmentStatus: "",
    location: "",
    department: "",
    division: "",
    
    // Client Assignment
    clientId: ""
  });

  // Navigation items for the sidebar
  const navigationItems = [
    { id: 1, title: "Dashboard", icon: BarChart3, href: "/hr-outsourcing" },
    { id: 2, title: "My Info", icon: UserIcon, href: "/hr-outsourcing/my-info" },
    { id: 3, title: "People", icon: Users, active: true },
    { id: 4, title: "Leave Management", icon: Calendar, href: "/hr-outsourcing/leave-management" },
    { id: 5, title: "Report", icon: FileText },
    { id: 6, title: "E-Signature", icon: Award, href: "/hr-outsourcing/e-signature" },
  ];

  // Handle navigation clicks
  const handleNavClick = (item: any) => {
    if (item.href) {
      router.push(item.href);
    }
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      return newData;
    });
  };

  // Handle staff status update
  const updateStaffStatus = (staffId: number, newStatus: string): void => {
    setStaffList((prev: any) => {
      const updated = prev.map((staff: any) =>
        staff.id === staffId ? { ...staff, status: newStatus } : staff
      );
      // Save to localStorage immediately
      localStorage.setItem("staff_list", JSON.stringify(updated));
      return updated;
    });
  };

  // Handle edit staff
  const handleEditStaff = (staff: any) => {
    setEditingStaff(staff);
    setFormData({
      firstName: staff.name.split(' ')[0],
      lastName: staff.name.split(' ').slice(1).join(' '),
      gender: "",
      nationality: "",
      idNumber: "",
      birthDate: "",
      rssbNumber: "",
      maritalStatus: "",
      country: "",
      province: "",
      city: "",
      postalCode: "",
      street: "",
      mobilePhone: "",
      workPhone: "",
      workEmail: staff.email,
      homeEmail: "",
      hireDate: staff.hireDate,
      employmentStatus: staff.status,
      location: "",
      department: staff.department,
      division: "",
      clientId: staff.clientId || ""
    });
    setShowEditStaffModal(true);
  };

  // Handle update staff
  const handleUpdateStaff = () => {
    if (!editingStaff) return;

    const updatedStaff = {
      ...editingStaff,
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.workEmail,
      department: formData.department,
      status: formData.employmentStatus,
      hireDate: formData.hireDate,
      clientId: formData.clientId,
      clientName: clients.find(c => c.id.toString() === formData.clientId)?.name || ""
    };

    setStaffList((prev: any) => prev.map((staff: any) =>
      staff.id === editingStaff.id ? updatedStaff : staff
    ));

    // Save to localStorage
    const updatedStaffList = staffList.map((staff: any) =>
      staff.id === editingStaff.id ? updatedStaff : staff
    );
    localStorage.setItem("staff_list", JSON.stringify(updatedStaffList));

    // Reset form
    setFormData({
      firstName: "",
      lastName: "",
      gender: "",
      nationality: "",
      idNumber: "",
      birthDate: "",
      rssbNumber: "",
      maritalStatus: "",
      country: "",
      province: "",
      city: "",
      postalCode: "",
      street: "",
      mobilePhone: "",
      workPhone: "",
      workEmail: "",
      homeEmail: "",
      hireDate: "",
      employmentStatus: "",
      location: "",
      department: "",
      division: "",
      clientId: ""
    });

    setShowEditStaffModal(false);
    setEditingStaff(null);
    alert("Staff information updated successfully!");
  };

  // Handle delete staff
  const handleDeleteStaff = (staffId: number) => {
    if (window.confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
      setStaffList((prev: any) => prev.filter((staff: any) => staff.id !== staffId));

      // Save to localStorage
      const updatedStaffList = staffList.filter((staff: any) => staff.id !== staffId);
      localStorage.setItem("staff_list", JSON.stringify(updatedStaffList));
    }
  };

  // Sample staff data - in a real app, this would come from your backend
  const [staffList, setStaffList] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("staff_list");
      if (saved) {
        try { return JSON.parse(saved); } catch { /* fall through */ }
      }
    }
    const defaultStaff = [
      {
        id: 1,
        name: "Lionel Ishimwe",
        email: "lionel.ishimwe@company.com",
        position: "Senior Developer",
        department: "Technology",
        reportsTo: "CTO",
        status: "Active",
        hireDate: "2021-01-15",
        clientId: "1",
        clientName: "TechCorp Ltd",
        gender: "Male"
      },
      {
        id: 2,
        name: "Sarah Johnson",
        email: "sarah.johnson@company.com",
        position: "Project Manager",
        department: "Operations",
        reportsTo: "CEO",
        status: "Active",
        hireDate: "2020-03-10",
        clientId: "1",
        clientName: "TechCorp Ltd",
        gender: "Female"
      },
      {
        id: 3,
        name: "Mike Chen",
        email: "mike.chen@company.com",
        position: "UI/UX Designer",
        department: "Design",
        reportsTo: "Creative Director",
        status: "Active",
        hireDate: "2021-06-22",
        clientId: "2",
        clientName: "StartupXYZ Inc",
        gender: "Male"
      },
      {
        id: 4,
        name: "Emma Davis",
        email: "emma.davis@company.com",
        position: "HR Specialist",
        department: "Human Resources",
        reportsTo: "HR Director",
        status: "Active",
        hireDate: "2019-11-05",
        clientId: "1",
        clientName: "TechCorp Ltd",
        gender: "Female"
      },
      {
        id: 5,
        name: "James Brown",
        email: "james.brown@company.com",
        position: "Marketing Coordinator",
        department: "Marketing",
        reportsTo: "Marketing Manager",
        status: "Active",
        hireDate: "2022-01-18",
        clientId: "2",
        clientName: "StartupXYZ Inc",
        gender: "Male"
      }
    ];
    
    // Save default staff to localStorage if it doesn't exist
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("staff_list");
      if (!saved) {
        localStorage.setItem("staff_list", JSON.stringify(defaultStaff));
      }
    }
    
    return defaultStaff;
  });

  // Filter staff list based on status
  const filteredStaffList = staffList.filter((staff: any) => {
    if (statusFilter === "all") return true;
    return staff.status === statusFilter;
  });

  // Handle form submission
  const handleSubmit = () => {
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.workEmail ||
        !formData.hireDate || !formData.clientId || !formData.gender) {
      alert("Please fill in all required fields including gender for leave calculation.");
      return;
    }

    // Create new staff member with all necessary information
    const newStaff: Staff = {
      id: Date.now(),
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.workEmail,
      hireDate: formData.hireDate,
      status: "Active", // Always set to Active when creating new staff
      clientId: formData.clientId,
      gender: formData.gender
    };

    // Find the client to get leave policies
    const selectedClient = clients.find(c => c.id.toString() === formData.clientId);
    
    if (!selectedClient) {
      alert("Selected client not found. Please select a valid client.");
      return;
    }

    // Initialize leave balance for the new staff member
    const initialLeaveBalance = LeaveAccrualService.initializeLeaveBalance(newStaff, selectedClient);
    
    // Load existing leave balances and add the new one
    const existingBalances = LeaveAccrualService.loadLeaveBalances();
    const updatedBalances = [...existingBalances, initialLeaveBalance];
    LeaveAccrualService.saveLeaveBalances(updatedBalances);

    // Create staff object for display (includes additional display fields)
    const newStaffForDisplay = {
      ...newStaff,
      position: "New Employee", // Default position, can be updated later
      department: formData.department,
      reportsTo: "Manager", // Default, can be updated later
      clientName: selectedClient.name,
      createdAt: new Date().toISOString() // Add creation timestamp for persistence
    };

    // Add to staff list
    setStaffList((prev: any) => [...prev, newStaffForDisplay]);

    // Save to localStorage for persistence
    const updatedStaffList = [...staffList, newStaffForDisplay];
    localStorage.setItem("staff_list", JSON.stringify(updatedStaffList));

    // Reset form
    setFormData({
      firstName: "",
      lastName: "",
      gender: "",
      nationality: "",
      idNumber: "",
      birthDate: "",
      rssbNumber: "",
      maritalStatus: "",
      country: "",
      province: "",
      city: "",
      postalCode: "",
      street: "",
      mobilePhone: "",
      workPhone: "",
      workEmail: "",
      homeEmail: "",
      hireDate: "",
      employmentStatus: "",
      location: "",
      department: "",
      division: "",
      clientId: ""
    });

    setShowCreateStaffModal(false);
    
    // Show detailed success message with leave information
    const leaveInfo = LeaveAccrualService.getLeaveDisplaySummary(newStaff.id);
    let leaveMessage = "";
    if (leaveInfo) {
      const annualLeave = leaveInfo.leaveTypes.find((lt: any) => lt.type === 'Annual Leave');
      leaveMessage = `\n\nLeave Balance Initialized:\n• Annual Leave: ${annualLeave?.accrued || 0} days accrued (of ${selectedClient.annualLeave} total)\n• Based on ${selectedClient.name} policies\n• Daily accrual will continue automatically`;
    }
    
    alert(`Staff account created successfully and is now ACTIVE! Leave entitlements have been calculated based on hire date and will accrue daily.${leaveMessage}`);
  };

  // Form field component
  const FormField = ({ label, field, type = "text", options = [], required = false }: any) => {
    const currentValue = formData[field as keyof typeof formData] || "";

    return (
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {type === "select" ? (
          <select
            value={currentValue}
            onChange={(e) => {
              const newValue = e.target.value;
              setFormData(prev => ({ ...prev, [field]: newValue }));
            }}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
          >
            <option value="">Select {label.toLowerCase()}</option>
            {options.map((option: any) => {
              // Handle both string arrays and object arrays with value/label
              if (typeof option === 'string') {
                return <option key={option} value={option}>{option}</option>;
              } else {
                return <option key={option.value} value={option.value}>{option.label}</option>;
              }
            })}
          </select>
        ) : (
          <input
            type={type}
            value={currentValue}
            onChange={(e) => {
              const newValue = e.target.value;
              setFormData(prev => ({ ...prev, [field]: newValue }));
            }}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
            placeholder={`Enter ${label.toLowerCase()}`}
            maxLength={type === "text" ? undefined : undefined}
          />
        )}
      </div>
    );
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
                      onClick={() => handleNavClick(item)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                        item.active
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
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 h-screen overflow-y-auto">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 p-6">
              <div className="flex items-center justify-between">
                {/* Search Bar */}
                <div className="flex items-center space-x-4 flex-1 max-w-3xl">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="search"
                      placeholder="Search employees..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-slate-700 placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* User Profile */}
                <div className="flex items-center space-x-4">
                  <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                  </button>
                  <div className="flex items-center space-x-3 bg-slate-100 rounded-2xl p-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-white" />
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
                  <h1 className="text-3xl font-bold text-slate-800">
                    People Management
                  </h1>
                  <p className="text-slate-600 mt-1">
                    Manage employee information and access
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Last updated</p>
                  <p className="text-sm font-medium text-slate-700">{new Date().toLocaleString()}</p>
                </div>
              </div>


              {/* Content based on active tab */}
              {activeTab === "People" && (
                <div className="space-y-6">
                  {/* Create New Staff Button */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">Create New Staff</h3>
                          <p className="text-slate-500">Add a new employee to the system</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowCreateStaffModal(true)}
                        className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <PlusCircle className="w-5 h-5" />
                        <span className="font-medium">Create a new Staff</span>
                      </button>
                    </div>
                  </div>

                  {/* Staff List */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-indigo-100 rounded-xl">
                          <Users className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">All Staff</h3>
                          <p className="text-slate-500">Complete employee directory</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Filter className="w-4 h-4 text-slate-600" />
                          <select
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value)}
                            className="px-4 py-2 bg-slate-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-slate-700 text-sm"
                          >
                            <option value="all">All</option>
                            <option value="location">Location</option>
                            <option value="department">Department</option>
                            <option value="division">Division</option>
                          </select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-600">Status:</span>
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 bg-slate-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-slate-700 text-sm"
                          >
                            <option value="all">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                        <div className="text-sm text-slate-500">
                          Total: {filteredStaffList.length} employees
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Name</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Email</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Gender</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Position</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Department</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Client</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Reports To</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Hire Date</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStaffList.map((staff: any) => (
                            <tr key={staff.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-4">
                                <span className="font-medium text-slate-800">{staff.name}</span>
                              </td>
                              <td className="py-4 px-4 text-slate-700">{staff.email}</td>
                              <td className="py-4 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  staff.gender === 'Male'
                                    ? 'bg-blue-100 text-blue-800'
                                    : staff.gender === 'Female'
                                    ? 'bg-pink-100 text-pink-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {staff.gender || 'Not Specified'}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-slate-700">{staff.position}</td>
                              <td className="py-4 px-4 text-slate-700">{staff.department}</td>
                              <td className="py-4 px-4">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                  {staff.clientName || "No Client"}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-slate-700">{staff.reportsTo}</td>
                              <td className="py-4 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  staff.status === 'Active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {staff.status}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-slate-500">{staff.hireDate}</td>
                              <td className="py-4 px-4">
                                <div className="flex items-center space-x-2">
                                  <select
                                    value={staff.status}
                                    onChange={(e) => updateStaffStatus(staff.id, e.target.value)}
                                    className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700 text-sm"
                                  >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                  </select>
                                  <button
                                    onClick={() => handleEditStaff(staff)}
                                    className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                    title="Edit"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStaff(staff.id)}
                                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                    title="Delete"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {filteredStaffList.length === 0 && (
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No staff found</h3>
                        <p className="text-slate-500">Create your first staff member to get started.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>

      {/* Edit Staff Modal */}
      {showEditStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Edit Staff</h2>
                <p className="text-slate-600 mt-1">Update employee information</p>
              </div>
              <button
                onClick={() => {
                  setShowEditStaffModal(false);
                  setEditingStaff(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <UserIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800">Basic Information</h3>
                      <p className="text-slate-500">Update employee details</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="First Name" field="firstName" required />
                    <FormField label="Last Name" field="lastName" required />
                    <FormField label="Work Email" field="workEmail" type="email" required />
                    <FormField label="Department" field="department" required />
                    <FormField label="Hire Date" field="hireDate" type="date" required />
                    <FormField
                      label="Employment Status"
                      field="employmentStatus"
                      type="select"
                      options={["Active", "Inactive", "Terminated", "On Leave"]}
                      required
                    />
                    <div className="md:col-span-2">
                      <FormField
                        label="Assign to Client"
                        field="clientId"
                        type="select"
                        options={clients.map(client => ({ value: client.id.toString(), label: client.name }))}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setShowEditStaffModal(false);
                      setEditingStaff(null);
                    }}
                    className="px-6 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateStaff}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Update Staff
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Staff Modal */}
      {showCreateStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Create New Staff</h2>
                <p className="text-slate-600 mt-1">Register all employee details</p>
              </div>
              <button
                onClick={() => setShowCreateStaffModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
              <div className="space-y-8">
                {/* Personal Information Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <UserIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800">Personal Information</h3>
                      <p className="text-slate-500">Basic employee details</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="First Name" field="firstName" required />
                    <FormField label="Last Name" field="lastName" required />
                    <FormField
                      label="Gender"
                      field="gender"
                      type="select"
                      options={["Male", "Female", "Other"]}
                      required
                    />
                    <FormField label="Nationality" field="nationality" required />
                    <FormField label="ID Number" field="idNumber" required />
                    <FormField label="Birth Date" field="birthDate" type="date" required />
                    <FormField label="RSSB Number" field="rssbNumber" />
                    <FormField
                      label="Marital Status"
                      field="maritalStatus"
                      type="select"
                      options={["Single", "Married", "Divorced", "Widow"]}
                    />
                  </div>
                </div>

                {/* Address Information Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <MapPin className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800">Address</h3>
                      <p className="text-slate-500">Location and contact address</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <FormField label="Country" field="country" required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Province" field="province" required />
                      <FormField label="City" field="city" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Postal Code" field="postalCode" />
                      <FormField label="Street" field="street" required />
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      <Phone className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800">Contact</h3>
                      <p className="text-slate-500">Phone numbers and email addresses</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Mobile Phone" field="mobilePhone" type="tel" required />
                      <FormField label="Work Phone" field="workPhone" type="tel" />
                    </div>
                    <FormField label="Work Email" field="workEmail" type="email" required />
                    <FormField label="Home Email" field="homeEmail" type="email" />
                  </div>
                </div>

                {/* Job Information Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <Briefcase className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-800">Job Information</h3>
                      <p className="text-slate-500">Employment details and status</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Hire Date" field="hireDate" type="date" required />
                    <FormField
                      label="Employment Status"
                      field="employmentStatus"
                      type="select"
                      options={["Active", "Inactive", "Terminated", "On Leave"]}
                      required
                    />
                    <FormField label="Location" field="location" required />
                    <FormField label="Department" field="department" required />
                    <FormField label="Division" field="division" required />
                    <div className="md:col-span-2">
                      <FormField
                        label="Assign to Client"
                        field="clientId"
                        type="select"
                        options={clients.map(client => ({ value: client.id.toString(), label: client.name }))}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => setShowCreateStaffModal(false)}
                    className="px-6 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Create Staff Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}