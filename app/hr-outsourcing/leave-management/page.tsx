'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Settings,
  User,
  Calendar,
  Clock,
  PlusCircle,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  X,
  AlertCircle,
  Users,
  FileText,
  BarChart3,
  Award,
  TrendingUp,
  CalendarDays,
  UserCheck,
  UserX,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw
} from "lucide-react";
import { LeaveAccrualService, type LeaveBalance } from "../../../utils/leaveAccrualService";
import { DailyAccrualTracker } from "../../../utils/dailyAccrualTracker";

interface LeaveRequest {
  id: number;
  employeeName: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: "Pending" | "Approved" | "Rejected";
  requestedDate: string;
  reason: string;
  approver: string;
  department: string;
  rejectionReason?: string;
}

interface Employee {
  id: number | string;
  name: string;
  gender: string | null;
  department: string;
  email?: string;
  status?: string;
}

export default function LeaveManagementPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showAllBalances, setShowAllBalances] = useState(false);

  // Navigation items for the sidebar
  const navigationItems = [
    { id: 1, title: "Dashboard", icon: BarChart3, href: "/hr-outsourcing" },
    { id: 2, title: "My Info", icon: User, href: "/hr-outsourcing/my-info" },
    { id: 3, title: "People", icon: Users, href: "/hr-outsourcing/people" },
    { id: 4, title: "Leave Management", icon: Calendar, active: true },
    { id: 5, title: "Report", icon: FileText },
    { id: 6, title: "E-Signature", icon: Award, href: "/hr-outsourcing/e-signature" },
  ];

  // Handle navigation clicks
  const handleNavClick = (item: any) => {
    if (item.href) {
      router.push(item.href);
    }
  };

  // Default employee data with gender information
  const defaultEmployeeData = [
    { id: 1, name: "Sarah Johnson", gender: "female", department: "Operations", email: "sarah@company.com", status: "Active" },
    { id: 2, name: "Lionel Ishimwe", gender: "male", department: "Technology", email: "lionel@company.com", status: "Active" },
    { id: 3, name: "Mike Chen", gender: "male", department: "Design", email: "mike@company.com", status: "Active" },
    { id: 4, name: "Emma Davis", gender: "female", department: "Human Resources", email: "emma@company.com", status: "Active" },
    { id: 5, name: "James Brown", gender: "male", department: "Marketing", email: "james@company.com", status: "Active" }
  ];

  // Get employee data from localStorage (from People page)
  const [employeeData, setEmployeeData] = useState(defaultEmployeeData);

  // Load staff data from localStorage on client-side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStaff = localStorage.getItem("staff_list");
      if (savedStaff) {
        try {
          const staffList = JSON.parse(savedStaff);
          // Map staff data to include gender information
          const mappedData = staffList.map((staff: any) => ({
            id: staff.id,
            name: staff.name,
            gender: staff.gender ? staff.gender.toLowerCase() : null,
            department: staff.department,
            email: staff.email,
            status: staff.status
          }));
          setEmployeeData(mappedData);
        } catch (error) {
          console.error("Error parsing staff data:", error);
          // Keep default data if parsing fails
        }
      }
    }
  }, []);

  // Initialize daily accrual tracking on component mount
  useEffect(() => {
    // Check and run daily accrual
    DailyAccrualTracker.checkAndRunDailyAccrual();
    
    // Initialize any missing balances for existing staff
    DailyAccrualTracker.initializeMissingBalances();
  }, []);

  // Sample leave data - in real app would come from API
  // Updated to match exact staff names and use smaller request amounts to test validation
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("leave_requests");
      if (saved) {
        try { return JSON.parse(saved); } catch { /* fall through */ }
      }
    }
    const defaultRequests: LeaveRequest[] = [
      {
        id: 1,
        employeeName: "Sarah Johnson",
        employeeId: "EMP002",
        leaveType: "Annual Leave",
        startDate: "2024-12-20",
        endDate: "2024-12-22", // Reduced to 3 days to test with accrued balance
        days: 3,
        status: "Pending",
        requestedDate: "2024-12-10",
        reason: "Christmas holiday with family",
        approver: "Mike Chen",
        department: "Operations"
      },
      {
        id: 2,
        employeeName: "Lionel Ishimwe",
        employeeId: "EMP001",
        leaveType: "Sick Leave",
        startDate: "2024-12-15",
        endDate: "2024-12-16",
        days: 2,
        status: "Approved",
        requestedDate: "2024-12-14",
        reason: "Medical appointment and recovery",
        approver: "Emma Davis",
        department: "Technology"
      },
      {
        id: 3,
        employeeName: "Mike Chen",
        employeeId: "EMP003",
        leaveType: "Personal Leave",
        startDate: "2024-12-18",
        endDate: "2024-12-18",
        days: 1,
        status: "Rejected",
        requestedDate: "2024-12-12",
        reason: "Personal matters",
        approver: "Emma Davis",
        department: "Design",
        rejectionReason: "Conflicting project deadline"
      },
      {
        id: 4,
        employeeName: "Emma Davis",
        employeeId: "EMP004",
        leaveType: "Annual Leave", // Changed from Maternity to Annual for testing
        startDate: "2025-01-15",
        endDate: "2025-01-17", // Reduced to 3 days to test
        days: 3,
        status: "Pending", // Changed to Pending to test approval
        requestedDate: "2024-11-20",
        reason: "Personal time off",
        approver: "CEO",
        department: "Human Resources"
      },
      {
        id: 5,
        employeeName: "James Brown",
        employeeId: "EMP005",
        leaveType: "Study Leave",
        startDate: "2024-12-22",
        endDate: "2024-12-24", // Reduced to 3 days
        days: 3,
        status: "Pending",
        requestedDate: "2024-12-08",
        reason: "Professional certification exam preparation",
        approver: "Sarah Johnson",
        department: "Marketing"
      }
    ];

    // Save default requests to localStorage if it doesn't exist
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("leave_requests");
      if (!saved) {
        localStorage.setItem("leave_requests", JSON.stringify(defaultRequests));
      }
    }

    return defaultRequests;
  });

  // Employee leave balances - now loaded from LeaveAccrualService
  const [employeeBalances, setEmployeeBalances] = useState<any[]>([]);

  // Load and update employee leave balances
  useEffect(() => {
    const loadEmployeeBalances = () => {
      // Get leave balances from the accrual service
      const leaveBalances = LeaveAccrualService.loadLeaveBalances();
      
      // Transform to the format expected by the UI
      const transformedBalances = leaveBalances.map((balance: LeaveBalance) => {
        const transformed: any = {
          employeeId: `EMP${String(balance.employeeId).padStart(3, '0')}`,
          employeeName: balance.employeeName,
          lastUpdated: balance.lastAccrualDate,
          annualLeave: {
            total: balance.leaveEntitlements.annualLeave.totalEntitled,
            accrued: Math.floor(balance.leaveEntitlements.annualLeave.accruedToDate * 100) / 100,
            used: balance.leaveEntitlements.annualLeave.used,
            remaining: Math.floor(balance.leaveEntitlements.annualLeave.remaining * 100) / 100
          },
          sickLeave: {
            total: balance.leaveEntitlements.sickLeave.totalEntitled,
            accrued: Math.floor(balance.leaveEntitlements.sickLeave.accruedToDate * 100) / 100,
            used: balance.leaveEntitlements.sickLeave.used,
            remaining: Math.floor(balance.leaveEntitlements.sickLeave.remaining * 100) / 100
          },
          personalLeave: {
            total: balance.leaveEntitlements.personalLeave.totalEntitled,
            accrued: Math.floor(balance.leaveEntitlements.personalLeave.accruedToDate * 100) / 100,
            used: balance.leaveEntitlements.personalLeave.used,
            remaining: Math.floor(balance.leaveEntitlements.personalLeave.remaining * 100) / 100
          },
          studyLeave: {
            total: balance.leaveEntitlements.studyLeave.totalEntitled,
            accrued: Math.floor(balance.leaveEntitlements.studyLeave.accruedToDate * 100) / 100,
            used: balance.leaveEntitlements.studyLeave.used,
            remaining: Math.floor(balance.leaveEntitlements.studyLeave.remaining * 100) / 100
          }
        };

        // Add gender-specific leave types if available
        if (balance.leaveEntitlements.maternityLeave) {
          transformed.maternityLeave = {
            total: balance.leaveEntitlements.maternityLeave.totalEntitled,
            accrued: Math.floor(balance.leaveEntitlements.maternityLeave.accruedToDate * 100) / 100,
            used: balance.leaveEntitlements.maternityLeave.used,
            remaining: Math.floor(balance.leaveEntitlements.maternityLeave.remaining * 100) / 100
          };
        }

        if (balance.leaveEntitlements.paternityLeave) {
          transformed.paternityLeave = {
            total: balance.leaveEntitlements.paternityLeave.totalEntitled,
            accrued: Math.floor(balance.leaveEntitlements.paternityLeave.accruedToDate * 100) / 100,
            used: balance.leaveEntitlements.paternityLeave.used,
            remaining: Math.floor(balance.leaveEntitlements.paternityLeave.remaining * 100) / 100
          };
        }

        return transformed;
      });

      setEmployeeBalances(transformedBalances);
    };

    loadEmployeeBalances();
    
    // Set up interval to refresh balances periodically
    const interval = setInterval(loadEmployeeBalances, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);

  // New leave request form
  const [newRequest, setNewRequest] = useState({
    employeeName: "",
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
    days: 0
  });

  // Filter leave requests based on search and filters
  const filteredRequests = leaveRequests.filter((request: LeaveRequest) => {
    const matchesSearch = request.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          request.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          request.reason.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEmployee = selectedEmployee === "all" || request.employeeId === selectedEmployee;
    const matchesStatus = selectedStatus === "all" || request.status === selectedStatus;
    const matchesType = selectedLeaveType === "all" || request.leaveType === selectedLeaveType;

    return matchesSearch && matchesEmployee && matchesStatus && matchesType;
  });

  // Calculate dashboard statistics
  const stats = {
    totalRequests: leaveRequests.length,
    pendingRequests: leaveRequests.filter((r: LeaveRequest) => r.status === "Pending").length,
    approvedRequests: leaveRequests.filter((r: LeaveRequest) => r.status === "Approved").length,
    rejectedRequests: leaveRequests.filter((r: LeaveRequest) => r.status === "Rejected").length,
    employeesOnLeave: leaveRequests.filter((r: LeaveRequest) => {
      const today = new Date();
      const startDate = new Date(r.startDate);
      const endDate = new Date(r.endDate);
      return r.status === "Approved" && today >= startDate && today <= endDate;
    }).length
  };

  // Handle leave request approval/rejection
  const handleRequestAction = (requestId: number, action: "approve" | "reject", reason?: string) => {
    const request = leaveRequests.find((r: LeaveRequest) => r.id === requestId);
    if (!request) return;
    
    if (action === "approve") {
      // Find the employee and process leave usage
      const staffData = JSON.parse(localStorage.getItem('staff_list') || '[]');
      const employee = staffData.find((staff: any) => staff.name === request.employeeName);
      
      if (employee) {
        // Check if employee has a leave balance first
        const leaveBalance = LeaveAccrualService.getEmployeeLeaveBalance(employee.id);
        
        if (!leaveBalance) {
          alert(`No leave balance found for ${employee.name}. Please ensure leave balances are initialized.`);
          return;
        }

        console.log(`Processing leave for ${employee.name} (ID: ${employee.id})`);
        console.log(`Leave type: ${request.leaveType}, Days: ${request.days}`);
        console.log('Current balance:', leaveBalance);

        const success = LeaveAccrualService.processLeaveUsage(
          employee.id,
          request.leaveType,
          request.days
        );
        
        if (!success) {
          // Get available balance for better error message
          let availableDays = 0;
          switch (request.leaveType) {
            case 'Annual Leave':
              availableDays = leaveBalance.leaveEntitlements.annualLeave.remaining;
              break;
            case 'Sick Leave':
              availableDays = leaveBalance.leaveEntitlements.sickLeave.remaining;
              break;
            case 'Personal Leave':
              availableDays = leaveBalance.leaveEntitlements.personalLeave.remaining;
              break;
            case 'Maternity Leave':
              availableDays = leaveBalance.leaveEntitlements.maternityLeave?.remaining || 0;
              break;
            case 'Paternity Leave':
              availableDays = leaveBalance.leaveEntitlements.paternityLeave?.remaining || 0;
              break;
            case 'Study Leave':
              availableDays = leaveBalance.leaveEntitlements.studyLeave.remaining;
              break;
          }
          
          alert(`Unable to approve: Insufficient leave balance. Available: ${availableDays} days, Requested: ${request.days} days`);
          return;
        }
        
        console.log('Leave usage processed successfully');
      } else {
        alert(`Employee ${request.employeeName} not found in staff data`);
        return;
      }
    }
    
    setLeaveRequests((prev: LeaveRequest[]) => {
      const updated = prev.map((req: LeaveRequest) =>
        req.id === requestId
          ? {
              ...req,
              status: (action === "approve" ? "Approved" : "Rejected") as LeaveRequest["status"],
              rejectionReason: action === "reject" ? reason : undefined
            }
          : req
      );
      // Save to localStorage
      localStorage.setItem("leave_requests", JSON.stringify(updated));
      return updated;
    });
    
    setShowApprovalModal(false);
    setSelectedRequest(null);
    setRejectionReason("");
    
    if (action === "approve") {
      // Refresh employee balances to show updated amounts
      setTimeout(() => {
        const balances = LeaveAccrualService.loadLeaveBalances();
        const transformedBalances = balances.map((balance: LeaveBalance) => {
          // Transform logic same as in useEffect above
          const transformed: any = {
            employeeId: `EMP${String(balance.employeeId).padStart(3, '0')}`,
            employeeName: balance.employeeName,
            lastUpdated: balance.lastAccrualDate,
            annualLeave: {
              total: balance.leaveEntitlements.annualLeave.totalEntitled,
              accrued: Math.floor(balance.leaveEntitlements.annualLeave.accruedToDate * 100) / 100,
              used: balance.leaveEntitlements.annualLeave.used,
              remaining: Math.floor(balance.leaveEntitlements.annualLeave.remaining * 100) / 100
            },
            sickLeave: {
              total: balance.leaveEntitlements.sickLeave.totalEntitled,
              accrued: Math.floor(balance.leaveEntitlements.sickLeave.accruedToDate * 100) / 100,
              used: balance.leaveEntitlements.sickLeave.used,
              remaining: Math.floor(balance.leaveEntitlements.sickLeave.remaining * 100) / 100
            },
            personalLeave: {
              total: balance.leaveEntitlements.personalLeave.totalEntitled,
              accrued: Math.floor(balance.leaveEntitlements.personalLeave.accruedToDate * 100) / 100,
              used: balance.leaveEntitlements.personalLeave.used,
              remaining: Math.floor(balance.leaveEntitlements.personalLeave.remaining * 100) / 100
            },
            studyLeave: {
              total: balance.leaveEntitlements.studyLeave.totalEntitled,
              accrued: Math.floor(balance.leaveEntitlements.studyLeave.accruedToDate * 100) / 100,
              used: balance.leaveEntitlements.studyLeave.used,
              remaining: Math.floor(balance.leaveEntitlements.studyLeave.remaining * 100) / 100
            }
          };

          // Add gender-specific leave types if available
          if (balance.leaveEntitlements.maternityLeave) {
            transformed.maternityLeave = {
              total: balance.leaveEntitlements.maternityLeave.totalEntitled,
              accrued: Math.floor(balance.leaveEntitlements.maternityLeave.accruedToDate * 100) / 100,
              used: balance.leaveEntitlements.maternityLeave.used,
              remaining: Math.floor(balance.leaveEntitlements.maternityLeave.remaining * 100) / 100
            };
          }

          if (balance.leaveEntitlements.paternityLeave) {
            transformed.paternityLeave = {
              total: balance.leaveEntitlements.paternityLeave.totalEntitled,
              accrued: Math.floor(balance.leaveEntitlements.paternityLeave.accruedToDate * 100) / 100,
              used: balance.leaveEntitlements.paternityLeave.used,
              remaining: Math.floor(balance.leaveEntitlements.paternityLeave.remaining * 100) / 100
            };
          }

          return transformed;
        });
        setEmployeeBalances(transformedBalances);
      }, 500);
    }
  };

  // Calculate business days between dates (excluding weekends)
  const calculateDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Ensure start date is not after end date
    if (start > end) return 0;
    
    let businessDays = 0;
    const currentDate = new Date(start);
    
    // Iterate through each day from start to end (inclusive)
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      // Check if it's a weekday (Monday=1 to Friday=5, excluding Saturday=6 and Sunday=0)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        businessDays++;
      }
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return businessDays;
  };

  // Define employee type
  interface Employee {
    id: number | string;
    name: string;
    gender: string | null;
    department: string;
    email?: string;
    status?: string;
  }

  // Function to get employee gender by name
  const getEmployeeGender = (employeeName: string): string | null => {
    const employee = employeeData.find((emp: Employee) => emp.name === employeeName);
    return employee?.gender || null;
  };

  // Function to get gender-based leave types
  const getGenderBasedLeaveTypes = (gender: string | null): string[] => {
    const baseTypes = [
      "Annual Leave",
      "Sick Leave",
      "Personal Leave",
      "Study Leave"
    ];

    if (gender === "female") {
      return [...baseTypes, "Maternity Leave"];
    } else if (gender === "male") {
      return [...baseTypes, "Paternity Leave"];
    }

    return [...baseTypes, "Maternity Leave", "Paternity Leave"];
  };

  // Function to get default leave type based on gender (for automatic selection)
  const getDefaultLeaveType = (gender: string | null, currentLeaveType: string): string => {
    // Only auto-select if no leave type is currently selected
    if (currentLeaveType) return currentLeaveType;

    if (gender === "female") {
      return "Maternity Leave";
    } else if (gender === "male") {
      return "Paternity Leave";
    }

    return "";
  };

  // Handle new request form changes
  const handleNewRequestChange = (field: string, value: string) => {
    setNewRequest(prev => {
      const updated = { ...prev, [field]: value };
      
      // If employee name changes, auto-select appropriate leave type
      if (field === 'employeeName' && value) {
        const gender = getEmployeeGender(value);
        // Reset leave type when employee changes, then auto-select if gender specific
        updated.leaveType = "";
        if (gender === 'female') {
          updated.leaveType = 'Maternity Leave';
        } else if (gender === 'male') {
          updated.leaveType = 'Paternity Leave';
        }
      }
      
      if (field === 'startDate' || field === 'endDate') {
        updated.days = calculateDays(updated.startDate, updated.endDate);
      }
      return updated;
    });
  };

  // Submit new leave request
  const submitNewRequest = () => {
    if (!newRequest.employeeName || !newRequest.leaveType || !newRequest.startDate || !newRequest.endDate) {
      alert('Please fill in all required fields');
      return;
    }

    // Find the employee ID from staff data
    const staffData = JSON.parse(localStorage.getItem('staff_list') || '[]');
    const employee = staffData.find((staff: any) => staff.name === newRequest.employeeName);
    
    if (!employee) {
      alert('Employee not found in system');
      return;
    }

    // Check leave balance before submitting
    const leaveBalance = LeaveAccrualService.getEmployeeLeaveBalance(employee.id);
    if (leaveBalance) {
      let availableDays = 0;
      
      switch (newRequest.leaveType) {
        case 'Annual Leave':
          availableDays = leaveBalance.leaveEntitlements.annualLeave.remaining;
          break;
        case 'Sick Leave':
          availableDays = leaveBalance.leaveEntitlements.sickLeave.remaining;
          break;
        case 'Personal Leave':
          availableDays = leaveBalance.leaveEntitlements.personalLeave.remaining;
          break;
        case 'Maternity Leave':
          availableDays = leaveBalance.leaveEntitlements.maternityLeave?.remaining || 0;
          break;
        case 'Paternity Leave':
          availableDays = leaveBalance.leaveEntitlements.paternityLeave?.remaining || 0;
          break;
        case 'Study Leave':
          availableDays = leaveBalance.leaveEntitlements.studyLeave.remaining;
          break;
      }
      
      if (newRequest.days > availableDays) {
        alert(`Insufficient leave balance. Available: ${availableDays} days, Requested: ${newRequest.days} days`);
        return;
      }
    }

    const newId = Math.max(...leaveRequests.map((r: LeaveRequest) => r.id)) + 1;
    const request = {
      id: newId,
      employeeName: newRequest.employeeName,
      employeeId: `EMP${String(employee.id).padStart(3, '0')}`,
      leaveType: newRequest.leaveType,
      startDate: newRequest.startDate,
      endDate: newRequest.endDate,
      days: newRequest.days,
      status: "Pending" as const,
      requestedDate: new Date().toISOString().split('T')[0],
      reason: newRequest.reason,
      approver: "HR Manager",
      department: employee.department || "Various"
    };

    setLeaveRequests((prev: LeaveRequest[]) => {
      const updated = [...prev, request];
      // Save to localStorage
      localStorage.setItem("leave_requests", JSON.stringify(updated));
      return updated;
    });
    setNewRequest({
      employeeName: "",
      leaveType: "",
      startDate: "",
      endDate: "",
      reason: "",
      days: 0
    });
    setShowRequestModal(false);
    alert('Leave request submitted successfully!');
  };

  // Get unique employees for filter dropdown
  const uniqueEmployees = Array.from(new Set(leaveRequests.map((r: LeaveRequest) => ({ id: r.employeeId, name: r.employeeName }))))
    .sort((a: { id: string; name: string }, b: { id: string; name: string }) => a.name.localeCompare(b.name));

  // Get current selected employee's gender for form
  const selectedEmployeeGender: string | null = getEmployeeGender(newRequest.employeeName);
  const availableLeaveTypes: string[] = getGenderBasedLeaveTypes(selectedEmployeeGender);

  // Calendar view helpers
  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getLeaveForDate = (date: Date): LeaveRequest[] => {
    const dateStr = date.toISOString().split('T')[0];
    return leaveRequests.filter((request: LeaveRequest) => {
      if (request.status !== "Approved") return false;
      return dateStr >= request.startDate && dateStr <= request.endDate;
    });
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string): React.ReactElement => {
    switch (status) {
      case "Approved":
        return <CheckCircle2 className="w-4 h-4" />;
      case "Pending":
        return <Clock className="w-4 h-4" />;
      case "Rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
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
              <button 
                onClick={() => setShowRequestModal(true)}
                className="w-full flex items-center space-x-3 px-4 py-2 text-slate-300 hover:bg-slate-700/50 hover:text-white rounded-lg transition-all duration-200"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="text-sm">New Leave Request</span>
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
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">{stats.pendingRequests}</span>
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
                {/* Search Bar and View Toggle */}
                <div className="flex items-center space-x-4 flex-1 max-w-3xl">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="search"
                      placeholder="Search leave requests..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-slate-700 placeholder-slate-400"
                    />
                  </div>
                  
                  {/* View Toggle */}
                  <div className="flex items-center bg-slate-100 rounded-xl p-1">
                    <button
                      onClick={() => setActiveView("dashboard")}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                        activeView === "dashboard"
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-sm font-medium">Dashboard</span>
                    </button>
                    <button
                      onClick={() => setActiveView("calendar")}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                        activeView === "calendar"
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">Calendar</span>
                    </button>
                    <button
                      onClick={() => setActiveView("requests")}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                        activeView === "requests"
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span className="text-sm font-medium">Requests</span>
                    </button>
                  </div>

                  <button 
                    onClick={() => setShowRequestModal(true)}
                    className="flex items-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span className="font-medium">New Request</span>
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
                      <p className="text-xs text-slate-500">HR Manager</p>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* Content Area */}
            <div className="p-6 space-y-6">
              {/* Dashboard View */}
              {activeView === "dashboard" && (
                <>
                  {/* Page Title */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-800">Leave Management</h1>
                      <p className="text-slate-600 mt-1">Manage employee leave requests and balances</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Last updated</p>
                      <p className="text-sm font-medium text-slate-700">{new Date().toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-800">{stats.totalRequests}</h3>
                          <p className="text-sm text-slate-600">Total Requests</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-yellow-100 rounded-xl">
                          <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-800">{stats.pendingRequests}</h3>
                          <p className="text-sm text-slate-600">Pending Approval</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-800">{stats.approvedRequests}</h3>
                          <p className="text-sm text-slate-600">Approved</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-red-100 rounded-xl">
                          <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-800">{stats.rejectedRequests}</h3>
                          <p className="text-sm text-slate-600">Rejected</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-purple-100 rounded-xl">
                          <UserX className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-800">{stats.employeesOnLeave}</h3>
                          <p className="text-sm text-slate-600">Currently on Leave</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Requests and Leave Balances */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Recent Requests */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-blue-100 rounded-xl">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-slate-800">Recent Requests</h3>
                            <p className="text-slate-500">Latest leave requests requiring attention</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setActiveView("requests")}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View All
                        </button>
                      </div>

                      <div className="space-y-4">
                        {leaveRequests.slice(0, 5).map((request: LeaveRequest) => (
                          <div key={request.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">{request.employeeName.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="font-medium text-slate-800">{request.employeeName}</p>
                                <p className="text-sm text-slate-600">{request.leaveType} • {formatDate(request.startDate)}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                                {getStatusIcon(request.status)}
                                <span className="ml-1">{request.status}</span>
                              </span>
                              {request.status === "Pending" && (
                                <button
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setShowApprovalModal(true);
                                  }}
                                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Leave Balances */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-green-100 rounded-xl">
                            <BarChart3 className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-slate-800">Leave Balance Overview</h3>
                            <p className="text-slate-500">Employee leave allocations and usage</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {employeeBalances.slice(0, 3).map((employee) => (
                          <div key={employee.employeeId} className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-slate-800">{employee.employeeName}</h4>
                              <div className="text-right">
                                <span className="text-xs text-slate-500">{employee.employeeId}</span>
                                {employee.lastUpdated && (
                                  <p className="text-xs text-green-600">
                                    ✓ Updated: {employee.lastUpdated}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-slate-600">Annual Leave</p>
                                <p className="font-semibold text-blue-600">
                                  {employee.annualLeave.remaining}/{employee.annualLeave.total} days
                                </p>
                                <p className="text-xs text-blue-500">
                                  Accrued: {employee.annualLeave.accrued}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-600">Sick Leave</p>
                                <p className="font-semibold text-green-600">
                                  {employee.sickLeave.remaining}/{employee.sickLeave.total} days
                                </p>
                                <p className="text-xs text-green-500">
                                  Accrued: {employee.sickLeave.accrued}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => setShowAllBalances(true)}
                          className="w-full py-2 text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-50 rounded-lg transition-all duration-200"
                        >
                          View All Balances
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Calendar View */}
              {activeView === "calendar" && (
                <div className="space-y-6">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-800">Leave Calendar</h1>
                      <p className="text-slate-600 mt-1">View employee leaves by month</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                        className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <h2 className="text-xl font-semibold text-slate-800 min-w-[200px] text-center">
                        {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h2>
                      <button
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                        className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="grid grid-cols-7 gap-4 mb-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center font-semibold text-slate-600 py-2">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    <div className="grid grid-cols-7 gap-4">
                      {/* Empty cells for days before month starts */}
                      {Array.from({ length: getFirstDayOfMonth(currentDate) }, (_, i) => (
                        <div key={`empty-${i}`} className="h-24"></div>
                      ))}
                      
                      {/* Calendar days */}
                      {Array.from({ length: getDaysInMonth(currentDate) }, (_, i) => {
                        const day = i + 1;
                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const leavesForDay = getLeaveForDate(date);
                        const isToday = new Date().toDateString() === date.toDateString();
                        
                        return (
                          <div
                            key={day}
                            className={`h-24 border rounded-lg p-2 ${
                              isToday ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'
                            } hover:bg-slate-100 transition-colors`}
                          >
                            <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-slate-800'}`}>
                              {day}
                            </div>
                            <div className="space-y-1 mt-1">
                              {leavesForDay.slice(0, 2).map((leave: LeaveRequest, idx: number) => (
                                <div
                                  key={idx}
                                  className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 truncate"
                                  title={`${leave.employeeName} - ${leave.leaveType}`}
                                >
                                  {leave.employeeName.split(' ')[0]}
                                </div>
                              ))}
                              {leavesForDay.length > 2 && (
                                <div className="text-xs text-slate-500">
                                  +{leavesForDay.length - 2} more
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Requests View */}
              {activeView === "requests" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-800">Leave Requests</h1>
                      <p className="text-slate-600 mt-1">Manage all employee leave requests</p>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Employee</label>
                        <select
                          value={selectedEmployee}
                          onChange={(e) => setSelectedEmployee(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          <option value="all">All Employees</option>
                          {uniqueEmployees.map((emp: { id: string; name: string }) => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                        <select
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          <option value="all">All Status</option>
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
                        <select
                          value={selectedLeaveType}
                          onChange={(e) => setSelectedLeaveType(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        >
                          <option value="all">All Types</option>
                          <option value="Annual Leave">Annual Leave</option>
                          <option value="Sick Leave">Sick Leave</option>
                          <option value="Personal Leave">Personal Leave</option>
                          <option value="Maternity Leave">Maternity Leave</option>
                          <option value="Study Leave">Study Leave</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Actions</label>
                        <div className="flex items-center space-x-2">
                          <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors">
                            <Download className="w-4 h-4" />
                            <span className="text-sm">Export</span>
                          </button>
                          <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors">
                            <RotateCcw className="w-4 h-4" />
                            <span className="text-sm">Reset</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Requests Table */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="text-left py-4 px-6 font-semibold text-slate-700">Employee</th>
                            <th className="text-left py-4 px-6 font-semibold text-slate-700">Leave Type</th>
                            <th className="text-left py-4 px-6 font-semibold text-slate-700">Duration</th>
                            <th className="text-left py-4 px-6 font-semibold text-slate-700">Requested Date</th>
                            <th className="text-left py-4 px-6 font-semibold text-slate-700">Status</th>
                            <th className="text-left py-4 px-6 font-semibold text-slate-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRequests.map((request: LeaveRequest) => {
                            // Calculate business days dynamically for display
                            const businessDays = calculateDays(request.startDate, request.endDate);
                            return (
                            <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                              <td className="py-4 px-6">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">{request.employeeName.charAt(0)}</span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-slate-800">{request.employeeName}</p>
                                    <p className="text-sm text-slate-600">{request.department}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className="text-slate-800">{request.leaveType}</span>
                              </td>
                              <td className="py-4 px-6">
                                <div>
                                  <p className="text-slate-800">{formatDate(request.startDate)} - {formatDate(request.endDate)}</p>
                                  <p className="text-sm text-slate-600">{businessDays} day{businessDays > 1 ? 's' : ''}</p>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className="text-slate-600">{formatDate(request.requestedDate)}</span>
                              </td>
                              <td className="py-4 px-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-flex items-center space-x-1 ${getStatusColor(request.status)}`}>
                                  {getStatusIcon(request.status)}
                                  <span>{request.status}</span>
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setShowApprovalModal(true);
                                    }}
                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="View Details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  {request.status === "Pending" && (
                                    <>
                                      <button
                                        onClick={() => handleRequestAction(request.id, "approve")}
                                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                                        title="Approve"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedRequest(request);
                                          setShowApprovalModal(true);
                                        }}
                                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Reject"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {filteredRequests.length === 0 && (
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No requests found</h3>
                        <p className="text-slate-500">No leave requests match your current filters.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* New Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">New Leave Request</h2>
                  <p className="text-slate-600 mt-1">Submit a new leave request for approval</p>
                </div>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Employee Name *</label>
                  <select
                    value={newRequest.employeeName}
                    onChange={(e) => handleNewRequestChange('employeeName', e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="">Select employee</option>
                    {employeeData.map((employee: Employee) => (
                      <option key={employee.id} value={employee.name}>
                        {employee.name} - {employee.department}
                      </option>
                    ))}
                  </select>
                  {selectedEmployeeGender && (
                    <p className="text-xs text-blue-600 mt-1 font-medium">
                      👤 Gender: {selectedEmployeeGender === 'male' ? '♂ Male' : '♀ Female'}
                      {selectedEmployeeGender === 'male' ? ' (Paternity leave auto-selected)' : ' (Maternity leave auto-selected)'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type *</label>
                  <select
                    value={newRequest.leaveType}
                    onChange={(e) => handleNewRequestChange('leaveType', e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    disabled={!newRequest.employeeName}
                  >
                    <option value="">Select leave type</option>
                    {availableLeaveTypes.map((leaveType) => (
                      <option key={leaveType} value={leaveType}>
                        {leaveType}
                        {((leaveType === 'Maternity Leave' && selectedEmployeeGender === 'female') ||
                          (leaveType === 'Paternity Leave' && selectedEmployeeGender === 'male')) &&
                          ' ⭐ (Auto-selected)'}
                      </option>
                    ))}
                  </select>
                  {/* Gender-based selection notification removed as requested */}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={newRequest.startDate}
                    onChange={(e) => handleNewRequestChange('startDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">End Date *</label>
                  <input
                    type="date"
                    value={newRequest.endDate}
                    onChange={(e) => handleNewRequestChange('endDate', e.target.value)}
                    min={newRequest.startDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              {newRequest.days > 0 && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-blue-800 font-medium">Total Days: {newRequest.days}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
                <textarea
                  value={newRequest.reason}
                  onChange={(e) => handleNewRequestChange('reason', e.target.value)}
                  placeholder="Please provide a reason for your leave request..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="px-6 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitNewRequest}
                  disabled={!newRequest.employeeName || !newRequest.leaveType || !newRequest.startDate || !newRequest.endDate}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Leave Request Details</h2>
                  <p className="text-slate-600 mt-1">Review and approve or reject this request</p>
                </div>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Request Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Employee</label>
                  <p className="text-slate-800 font-semibold">{selectedRequest.employeeName}</p>
                  <p className="text-sm text-slate-600">{selectedRequest.department}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Leave Type</label>
                  <p className="text-slate-800 font-semibold">{selectedRequest.leaveType}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                  <p className="text-slate-800 font-semibold">
                    {formatDate(selectedRequest.startDate)} - {formatDate(selectedRequest.endDate)}
                  </p>
                  <p className="text-sm text-slate-600">{calculateDays(selectedRequest.startDate, selectedRequest.endDate)} day{calculateDays(selectedRequest.startDate, selectedRequest.endDate) > 1 ? 's' : ''}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Requested Date</label>
                  <p className="text-slate-800 font-semibold">{formatDate(selectedRequest.requestedDate)}</p>
                </div>
              </div>

              {selectedRequest.reason && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                  <p className="text-slate-800 bg-slate-50 p-4 rounded-xl">{selectedRequest.reason}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Status</label>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border inline-flex items-center space-x-1 ${getStatusColor(selectedRequest.status)}`}>
                  {getStatusIcon(selectedRequest.status)}
                  <span>{selectedRequest.status}</span>
                </span>
              </div>

              {selectedRequest.status === "Rejected" && selectedRequest.rejectionReason && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rejection Reason</label>
                  <p className="text-red-800 bg-red-50 p-4 rounded-xl border border-red-200">{selectedRequest.rejectionReason}</p>
                </div>
              )}

              {selectedRequest.status === "Pending" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Rejection Reason (if rejecting)</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Provide a reason if rejecting this request..."
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200">
                    <button
                      onClick={() => setShowApprovalModal(false)}
                      className="px-6 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => handleRequestAction(selectedRequest.id, "reject", rejectionReason)}
                      className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                    >
                      Reject Request
                    </button>
                    <button
                      onClick={() => handleRequestAction(selectedRequest.id, "approve")}
                      className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                    >
                      Approve Request
                    </button>
                  </div>
                </>
              )}

              {selectedRequest.status !== "Pending" && (
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => setShowApprovalModal(false)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All Balances Modal */}
      {showAllBalances && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">All Employee Leave Balances</h2>
                  <p className="text-slate-600 mt-1">Complete overview of all employee leave allocations and usage</p>
                </div>
                <button
                  onClick={() => setShowAllBalances(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {employeeBalances.map((employee) => (
                  <div key={employee.employeeId} className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">{employee.employeeName.charAt(0)}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800">{employee.employeeName}</h3>
                          <p className="text-sm text-slate-600">{employee.employeeId}</p>
                          {employee.lastUpdated && (
                            <p className="text-xs text-green-600">
                              ✓ Last accrual: {employee.lastUpdated}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Annual Leave */}
                      <div className="bg-white rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Annual Leave</span>
                          <div className="text-right">
                            <span className="text-sm font-bold text-blue-600">
                              {employee.annualLeave.remaining}/{employee.annualLeave.total} days
                            </span>
                            <p className="text-xs text-blue-500">
                              Accrued: {employee.annualLeave.accrued} days
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${(employee.annualLeave.accrued / employee.annualLeave.total) * 100}%`
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Used: {employee.annualLeave.used} days</p>
                      </div>

                      {/* Sick Leave */}
                      <div className="bg-white rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Sick Leave</span>
                          <div className="text-right">
                            <span className="text-sm font-bold text-green-600">
                              {employee.sickLeave.remaining}/{employee.sickLeave.total} days
                            </span>
                            <p className="text-xs text-green-500">
                              Accrued: {employee.sickLeave.accrued} days
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${(employee.sickLeave.accrued / employee.sickLeave.total) * 100}%`
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Used: {employee.sickLeave.used} days</p>
                      </div>

                      {/* Personal Leave */}
                      <div className="bg-white rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Personal Leave</span>
                          <div className="text-right">
                            <span className="text-sm font-bold text-purple-600">
                              {employee.personalLeave.remaining}/{employee.personalLeave.total} days
                            </span>
                            <p className="text-xs text-purple-500">
                              Accrued: {employee.personalLeave.accrued} days
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${(employee.personalLeave.accrued / employee.personalLeave.total) * 100}%`
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Used: {employee.personalLeave.used} days</p>
                      </div>

                      {/* Maternity Leave (if applicable) */}
                      {employee.maternityLeave && (
                        <div className="bg-white rounded-xl p-4 border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">Maternity Leave</span>
                            <div className="text-right">
                              <span className="text-sm font-bold text-pink-600">
                                {employee.maternityLeave.remaining}/{employee.maternityLeave.total} days
                              </span>
                              <p className="text-xs text-pink-500">
                                Available: {employee.maternityLeave.accrued} days
                              </p>
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(employee.maternityLeave.accrued / employee.maternityLeave.total) * 100}%`
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">Used: {employee.maternityLeave.used} days</p>
                        </div>
                      )}

                      {/* Paternity Leave (if applicable) */}
                      {employee.paternityLeave && (
                        <div className="bg-white rounded-xl p-4 border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">Paternity Leave</span>
                            <div className="text-right">
                              <span className="text-sm font-bold text-indigo-600">
                                {employee.paternityLeave.remaining}/{employee.paternityLeave.total} days
                              </span>
                              <p className="text-xs text-indigo-500">
                                Available: {employee.paternityLeave.accrued} days
                              </p>
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(employee.paternityLeave.accrued / employee.paternityLeave.total) * 100}%`
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">Used: {employee.paternityLeave.used} days</p>
                        </div>
                      )}

                      {/* Study Leave (if applicable) */}
                      {employee.studyLeave && (
                        <div className="bg-white rounded-xl p-4 border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">Study Leave</span>
                            <div className="text-right">
                              <span className="text-sm font-bold text-orange-600">
                                {employee.studyLeave.remaining}/{employee.studyLeave.total} days
                              </span>
                              <p className="text-xs text-orange-500">
                                Accrued: {employee.studyLeave.accrued} days
                              </p>
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${(employee.studyLeave.accrued / employee.studyLeave.total) * 100}%`
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">Used: {employee.studyLeave.used} days</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6 mt-6 border-t border-slate-200">
                <button
                  onClick={() => setShowAllBalances(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}