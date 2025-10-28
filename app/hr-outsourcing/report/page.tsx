'use client';

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
  PieChart,
  BarChart,
  LineChart,
  Calendar as CalendarIcon,
  Building,
  FileSpreadsheet,
  FileText as FilePdf,
  RefreshCw
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function ReportPage() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState("HR Outsourcing");
  const [activeSubNav, setActiveSubNav] = useState("Report");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [staffList, setStaffList] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  // Report filters
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [reportType, setReportType] = useState('staff');

  // Load data from localStorage
  useEffect(() => {
    const savedStaff = localStorage.getItem("staff_list");
    if (savedStaff) {
      try {
        setStaffList(JSON.parse(savedStaff));
      } catch (error) {
        console.error("Error parsing staff data:", error);
      }
    }

    const savedLeaves = localStorage.getItem("leave_requests");
    if (savedLeaves) {
      try {
        setLeaveRequests(JSON.parse(savedLeaves));
      } catch (error) {
        console.error("Error parsing leave requests:", error);
      }
    }

    const savedClients = localStorage.getItem("clients");
    if (savedClients) {
      try {
        setClients(JSON.parse(savedClients));
      } catch (error) {
        console.error("Error parsing clients:", error);
      }
    }
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

  // Filtered data based on current filters
  const filteredStaff = useMemo(() => {
    return staffList.filter(staff => {
      const matchesSearch = !searchQuery ||
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.department?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDepartment = departmentFilter === 'all' || staff.department === departmentFilter;
      const matchesStatus = statusFilter === 'all' || staff.status === statusFilter;

      // Filter by creation date range (when staff was created)
      const matchesDateRange = (!dateRange.start || !dateRange.end) ||
        (staff.createdAt && new Date(staff.createdAt) >= new Date(dateRange.start) &&
         new Date(staff.createdAt) <= new Date(dateRange.end));

      return matchesSearch && matchesDepartment && matchesStatus && matchesDateRange;
    });
  }, [staffList, searchQuery, departmentFilter, statusFilter, dateRange]);

  const filteredLeaves = useMemo(() => {
    return leaveRequests.filter(leave => {
      const matchesSearch = !searchQuery ||
        leave.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.leaveType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || leave.status === statusFilter;

      const matchesDateRange = (!dateRange.start || !dateRange.end) ||
        (new Date(leave.startDate) >= new Date(dateRange.start) &&
         new Date(leave.endDate) <= new Date(dateRange.end));

      // Filter by client - find staff member and check their client assignment
      const matchesClient = clientFilter === 'all' ||
        (staffList.find(staff => staff.name === leave.employeeName)?.clientId === clientFilter);

      return matchesSearch && matchesStatus && matchesDateRange && matchesClient;
    });
  }, [leaveRequests, searchQuery, statusFilter, dateRange, clientFilter, staffList]);

  // Calculate statistics
  const staffStats = useMemo(() => {
    const total = filteredStaff.length;
    const active = filteredStaff.filter(s => s.status === 'Active').length;
    const inactive = total - active;
    const male = filteredStaff.filter(s => s.gender === 'Male').length;
    const female = filteredStaff.filter(s => s.gender === 'Female').length;

    const departments: { [key: string]: number } = {};
    filteredStaff.forEach(staff => {
      const dept = staff.department || 'Unassigned';
      departments[dept] = (departments[dept] || 0) + 1;
    });

    return { total, active, inactive, male, female, departments };
  }, [filteredStaff]);

  const leaveStats = useMemo(() => {
    const total = filteredLeaves.length;
    const approved = filteredLeaves.filter(l => l.status === 'Approved').length;
    const pending = filteredLeaves.filter(l => l.status === 'Pending').length;
    const rejected = filteredLeaves.filter(l => l.status === 'Rejected').length;

    const leaveTypes: { [key: string]: number } = {};
    filteredLeaves.forEach(leave => {
      leaveTypes[leave.leaveType] = (leaveTypes[leave.leaveType] || 0) + 1;
    });

    return { total, approved, pending, rejected, leaveTypes };
  }, [filteredLeaves]);

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

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Get selected client name for title
    const selectedClientName = clientFilter !== 'all' ?
      Array.from(new Set(staffList.map(staff => staff.clientName).filter(Boolean)))
        .find(clientName => {
          const client = clients.find(c => c.name === clientName);
          return client?.id.toString() === clientFilter || clientName === clientFilter;
        }) : null;

    // Add title
    doc.setFontSize(20);
    const title = selectedClientName ? `${selectedClientName} HR Report` : 'HR Report';
    doc.text(title, 20, 20);

    // Add report type
    doc.setFontSize(14);
    doc.text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, 20, 35);

    // Add generation date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 45);

    let yPosition = 60;

    if (reportType === 'staff') {
      // Staff Statistics
      doc.setFontSize(16);
      doc.text('Staff Statistics', 20, yPosition);
      yPosition += 15;

      const staffData = [
        ['Total Staff', staffStats.total.toString()],
        ['Active Staff', staffStats.active.toString()],
        ['Inactive Staff', staffStats.inactive.toString()],
        ['Male', staffStats.male.toString()],
        ['Female', staffStats.female.toString()],
        ['Departments', Object.keys(staffStats.departments).length.toString()],
      ];

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: staffData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;

      // Staff Details Table
      doc.setFontSize(16);
      doc.text('Staff Details', 20, yPosition);
      yPosition += 15;

      const staffTableData = filteredStaff.map(staff => [
        staff.name,
        staff.department || 'N/A',
        staff.clientName || 'No Client',
        staff.status,
        staff.gender || 'N/A',
        staff.email || 'N/A'
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Name', 'Department', 'Client', 'Status', 'Gender', 'Email']],
        body: staffTableData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
      });

    } else if (reportType === 'leave') {
      // Leave Statistics
      doc.setFontSize(16);
      doc.text('Leave Statistics', 20, yPosition);
      yPosition += 15;

      const leaveData = [
        ['Total Requests', leaveStats.total.toString()],
        ['Approved', leaveStats.approved.toString()],
        ['Pending', leaveStats.pending.toString()],
        ['Rejected', leaveStats.rejected.toString()],
      ];

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: leaveData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 20;

      // Leave Details Table
      doc.setFontSize(16);
      doc.text('Leave Details', 20, yPosition);
      yPosition += 15;

      const leaveTableData = filteredLeaves.map(leave => [
        leave.employeeName,
        leave.leaveType,
        new Date(leave.startDate).toLocaleDateString(),
        new Date(leave.endDate).toLocaleDateString(),
        leave.status
      ]);

      (doc as any).autoTable({
        startY: yPosition,
        head: [['Employee', 'Leave Type', 'Start Date', 'End Date', 'Status']],
        body: leaveTableData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
      });
    }

    // Save the PDF with client-specific filename
    const clientSuffix = selectedClientName ? `-${selectedClientName.replace(/\s+/g, '-').toLowerCase()}` : '';
    doc.save(`${reportType}-report${clientSuffix}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = () => {
    // Get selected client name for title and filename
    const selectedClientName = clientFilter !== 'all' ?
      Array.from(new Set(staffList.map(staff => staff.clientName).filter(Boolean)))
        .find(clientName => {
          const client = clients.find(c => c.name === clientName);
          return client?.id.toString() === clientFilter || clientName === clientFilter;
        }) : null;

    let worksheetData: any[] = [];
    let worksheetName = '';

    if (reportType === 'staff') {
      worksheetName = selectedClientName ? `${selectedClientName} Staff Report` : 'Staff Report';

      // Add summary data
      worksheetData.push([selectedClientName ? `${selectedClientName} HR Staff Report` : 'HR Staff Report']);
      worksheetData.push(['Generated on:', new Date().toLocaleString()]);
      worksheetData.push([]);
      worksheetData.push(['Summary Statistics']);
      worksheetData.push(['Total Staff', staffStats.total]);
      worksheetData.push(['Active Staff', staffStats.active]);
      worksheetData.push(['Inactive Staff', staffStats.inactive]);
      worksheetData.push(['Male', staffStats.male]);
      worksheetData.push(['Female', staffStats.female]);
      worksheetData.push([]);
      worksheetData.push(['Staff Details']);
      worksheetData.push(['Name', 'Department', 'Client', 'Status', 'Gender', 'Email']);

      // Add staff data
      filteredStaff.forEach(staff => {
        worksheetData.push([
          staff.name,
          staff.department || 'N/A',
          staff.clientName || 'No Client',
          staff.status,
          staff.gender || 'N/A',
          staff.email || 'N/A'
        ]);
      });

    } else if (reportType === 'leave') {
      worksheetName = selectedClientName ? `${selectedClientName} Leave Report` : 'Leave Report';

      // Add summary data
      worksheetData.push([selectedClientName ? `${selectedClientName} HR Leave Report` : 'HR Leave Report']);
      worksheetData.push(['Generated on:', new Date().toLocaleString()]);
      worksheetData.push([]);
      worksheetData.push(['Summary Statistics']);
      worksheetData.push(['Total Requests', leaveStats.total]);
      worksheetData.push(['Approved', leaveStats.approved]);
      worksheetData.push(['Pending', leaveStats.pending]);
      worksheetData.push(['Rejected', leaveStats.rejected]);
      worksheetData.push([]);
      worksheetData.push(['Leave Details']);
      worksheetData.push(['Employee', 'Leave Type', 'Start Date', 'End Date', 'Status']);

      // Add leave data
      filteredLeaves.forEach(leave => {
        worksheetData.push([
          leave.employeeName,
          leave.leaveType,
          new Date(leave.startDate).toLocaleDateString(),
          new Date(leave.endDate).toLocaleDateString(),
          leave.status
        ]);
      });
    }

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths
    const colWidths = [
      { wch: 20 }, // Name/Employee
      { wch: 15 }, // Department/Leave Type
      { wch: 15 }, // Client/Start Date
      { wch: 12 }, // Status/End Date
      { wch: 12 }, // Gender/Status
      { wch: 25 }, // Email
    ];
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName);

    // Client-specific filename
    const clientSuffix = selectedClientName ? `-${selectedClientName.replace(/\s+/g, '-').toLowerCase()}` : '';
    XLSX.writeFile(workbook, `${reportType}-report${clientSuffix}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const refreshData = () => {
    // Reload data from localStorage
    const savedStaff = localStorage.getItem("staff_list");
    if (savedStaff) {
      try {
        setStaffList(JSON.parse(savedStaff));
      } catch (error) {
        console.error("Error parsing staff data:", error);
      }
    }

    const savedLeaves = localStorage.getItem("leave_requests");
    if (savedLeaves) {
      try {
        setLeaveRequests(JSON.parse(savedLeaves));
      } catch (error) {
        console.error("Error parsing leave requests:", error);
      }
    }

    const savedClients = localStorage.getItem("clients");
    if (savedClients) {
      try {
        setClients(JSON.parse(savedClients));
      } catch (error) {
        console.error("Error parsing clients:", error);
      }
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
                <div className="flex items-center space-x-4 flex-1 max-w-4xl">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="search"
                      placeholder="Search reports, employees, leaves..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-slate-700 placeholder-slate-400"
                    />
                  </div>
                  <button className="flex items-center space-x-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                    <Filter className="w-4 h-4 text-slate-600" />
                    <span className="text-slate-700 font-medium">Filter</span>
                  </button>
                  <button
                    onClick={refreshData}
                    className="flex items-center space-x-2 px-4 py-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="font-medium">Refresh</span>
                  </button>
                  <button
                    onClick={exportToPDF}
                    className="flex items-center space-x-2 px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-colors"
                  >
                    <FilePdf className="w-4 h-4" />
                    <span className="font-medium">PDF</span>
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="flex items-center space-x-2 px-4 py-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="font-medium">Excel</span>
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
                  <h1 className="text-3xl font-bold text-slate-800">Advanced Reports</h1>
                  <p className="text-slate-600 mt-1">Interactive reports with charts and downloadable documents</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Last updated</p>
                  <p className="text-sm font-medium text-slate-700">{new Date().toLocaleString()}</p>
                </div>
              </div>

              {/* Report Type Selector */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-slate-800">Report Type</h3>
                  <div className="flex space-x-2">
                    {[
                      { id: 'staff', label: 'Staff Reports', icon: Users },
                      { id: 'leave', label: 'Leave Reports', icon: Calendar },
                      { id: 'client', label: 'Client Reports', icon: Building }
                    ].map(type => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.id}
                          onClick={() => setReportType(type.id)}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                            reportType === type.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="font-medium">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Date Range</label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Start date"
                      />
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="End date"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Department</label>
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Departments</option>
                      <option value="Technology">Technology</option>
                      <option value="Operations">Operations</option>
                      <option value="Design">Design</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Finance">Finance</option>
                      <option value="Sales">Sales</option>
                      <option value="Legal">Legal</option>
                      <option value="Unassigned">Unassigned</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Client</label>
                    <select
                      value={clientFilter}
                      onChange={(e) => setClientFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Clients</option>
                      {Array.from(new Set(staffList.map(staff => staff.clientName).filter(Boolean))).map(clientName => {
                        const client = clients.find(c => c.name === clientName);
                        return (
                          <option key={client?.id || clientName} value={client?.id.toString() || clientName}>
                            {clientName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      {reportType === 'leave' && (
                        <>
                          <option value="Approved">Approved</option>
                          <option value="Pending">Pending</option>
                          <option value="Rejected">Rejected</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 opacity-0">Actions</label>
                    <button
                      onClick={() => {
                        setDateRange({ start: '', end: '' });
                        setDepartmentFilter('all');
                        setClientFilter('all');
                        setStatusFilter('all');
                        setSearchQuery('');
                      }}
                      className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </section>

              {/* Staff Reports */}
              {reportType === 'staff' && (
                <>
                  {/* Staff Statistics Cards */}
                  <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-white/50 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-white/50 text-blue-900">
                          <Users className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-600">Total Staff</h3>
                        <p className="text-3xl font-bold text-blue-900">{staffStats.total}</p>
                        <p className="text-xs text-slate-500">All employees</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-white/50 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-white/50 text-green-900">
                          <UserCheck className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-600">Active Staff</h3>
                        <p className="text-3xl font-bold text-green-900">{staffStats.active}</p>
                        <p className="text-xs text-slate-500">Currently active</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-white/50 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-white/50 text-purple-900">
                          <UserX className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-600">Inactive Staff</h3>
                        <p className="text-3xl font-bold text-purple-900">{staffStats.inactive}</p>
                        <p className="text-xs text-slate-500">Currently inactive</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-white/50 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-white/50 text-orange-900">
                          <Building className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-600">Departments</h3>
                        <p className="text-3xl font-bold text-orange-900">{Object.keys(staffStats.departments).length}</p>
                        <p className="text-xs text-slate-500">Total departments</p>
                      </div>
                    </div>
                  </section>

                  {/* Staff Charts */}
                  <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Gender Distribution Chart */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">Gender Distribution</h3>
                          <p className="text-sm text-slate-500">Workforce demographics</p>
                        </div>
                        <PieChart className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="h-64">
                        <Pie
                          data={{
                            labels: ['Male', 'Female'],
                            datasets: [{
                              data: [staffStats.male, staffStats.female],
                              backgroundColor: ['#3b82f6', '#ec4899'],
                              borderColor: ['#2563eb', '#db2777'],
                              borderWidth: 2,
                            }],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'bottom' as const,
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                                    return `${context.label}: ${context.parsed} (${percentage}%)`;
                                  }
                                }
                              }
                            },
                          }}
                        />
                      </div>
                    </div>

                    {/* Department Distribution Chart */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">Department Distribution</h3>
                          <p className="text-sm text-slate-500">Staff by department</p>
                        </div>
                        <BarChart className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="h-64">
                        <Bar
                          data={{
                            labels: Object.keys(staffStats.departments),
                            datasets: [{
                              label: 'Number of Staff',
                              data: Object.values(staffStats.departments),
                              backgroundColor: 'rgba(99, 102, 241, 0.8)',
                              borderColor: 'rgba(99, 102, 241, 1)',
                              borderWidth: 1,
                            }],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'top' as const,
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  stepSize: 1,
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Staff Data Table */}
                  <section className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-slate-800">Staff Details</h3>
                      <span className="text-sm text-slate-500">{filteredStaff.length} employees</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-4 font-medium text-slate-700">Name</th>
                            <th className="text-left py-3 px-4 font-medium text-slate-700">Department</th>
                            <th className="text-left py-3 px-4 font-medium text-slate-700">Client</th>
                            <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                            <th className="text-left py-3 px-4 font-medium text-slate-700">Gender</th>
                            <th className="text-left py-3 px-4 font-medium text-slate-700">Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStaff.map((staff, index) => (
                            <tr key={staff.id || index} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4 text-slate-800">{staff.name}</td>
                              <td className="py-3 px-4 text-slate-600">{staff.department || 'N/A'}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                  {staff.clientName || "No Client"}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  staff.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {staff.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-600">{staff.gender || 'N/A'}</td>
                              <td className="py-3 px-4 text-slate-600">{staff.email || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}

              {/* Leave Reports */}
              {reportType === 'leave' && (
                <>
                  {/* Leave Statistics Cards */}
                  <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-white/50 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-white/50 text-blue-900">
                          <Calendar className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-600">Total Requests</h3>
                        <p className="text-3xl font-bold text-blue-900">{leaveStats.total}</p>
                        <p className="text-xs text-slate-500">All leave requests</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-white/50 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-white/50 text-green-900">
                          <UserCheck className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-600">Approved</h3>
                        <p className="text-3xl font-bold text-green-900">{leaveStats.approved}</p>
                        <p className="text-xs text-slate-500">Approved requests</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border border-white/50 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-white/50 text-yellow-900">
                          <Clock className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-600">Pending</h3>
                        <p className="text-3xl font-bold text-yellow-900">{leaveStats.pending}</p>
                        <p className="text-xs text-slate-500">Awaiting approval</p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-white/50 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-white/50 text-red-900">
                          <UserX className="w-6 h-6" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-slate-600">Rejected</h3>
                        <p className="text-3xl font-bold text-red-900">{leaveStats.rejected}</p>
                        <p className="text-xs text-slate-500">Rejected requests</p>
                      </div>
                    </div>
                  </section>

                  {/* Leave Charts */}
                  <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Leave Status Distribution */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">Leave Status Distribution</h3>
                          <p className="text-sm text-slate-500">Request approval status</p>
                        </div>
                        <PieChart className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="h-64">
                        <Pie
                          data={{
                            labels: ['Approved', 'Pending', 'Rejected'],
                            datasets: [{
                              data: [leaveStats.approved, leaveStats.pending, leaveStats.rejected],
                              backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                              borderColor: ['#059669', '#d97706', '#dc2626'],
                              borderWidth: 2,
                            }],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'bottom' as const,
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((context.parsed / total) * 100) : 0;
                                    return `${context.label}: ${context.parsed} (${percentage}%)`;
                                  }
                                }
                              }
                            },
                          }}
                        />
                      </div>
                    </div>

                    {/* Leave Types Distribution */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-800">Leave Types Distribution</h3>
                          <p className="text-sm text-slate-500">Requests by leave type</p>
                        </div>
                        <BarChart className="w-6 h-6 text-slate-400" />
                      </div>
                      <div className="h-64">
                        <Bar
                          data={{
                            labels: Object.keys(leaveStats.leaveTypes),
                            datasets: [{
                              label: 'Number of Requests',
                              data: Object.values(leaveStats.leaveTypes),
                              backgroundColor: 'rgba(147, 51, 234, 0.8)',
                              borderColor: 'rgba(147, 51, 234, 1)',
                              borderWidth: 1,
                            }],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'top' as const,
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                ticks: {
                                  stepSize: 1,
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Leave Data Table */}
                  <section className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4 flex-1">
                        <h3 className="text-lg font-semibold text-slate-800">Leave Requests Details</h3>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            placeholder="Search employee, leave type, or year..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-64"
                          />
                          <input
                            type="number"
                            placeholder="Filter by year"
                            min="2000"
                            max={new Date().getFullYear() + 1}
                            onChange={(e) => {
                              const year = e.target.value;
                              if (year) {
                                const startDate = `${year}-01-01`;
                                const endDate = `${year}-12-31`;
                                setDateRange({ start: startDate, end: endDate });
                              } else {
                                setDateRange({ start: '', end: '' });
                              }
                            }}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-32"
                          />
                          {clientFilter !== 'all' && (
                            <div className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                              Client: {clients.find(c => c.id.toString() === clientFilter)?.name}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-slate-500">{filteredLeaves.length} requests</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-4 font-medium text-slate-700">Employee</th>
                            <th className="text-left py-3 px-4 font-medium text-slate-700">Leave Type</th>
                            <th className="text-left py-3 px-4 font-medium text-slate-700">Start Date</th>
                            <th className="text-left py-3 px-4 font-medium text-slate-700">End Date</th>
                            <th className="text-left py-3 px-4 font-medium text-slate-700">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLeaves.map((leave, index) => (
                            <tr key={leave.id || index} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="py-3 px-4 text-slate-800">{leave.employeeName}</td>
                              <td className="py-3 px-4 text-slate-600">{leave.leaveType}</td>
                              <td className="py-3 px-4 text-slate-600">{new Date(leave.startDate).toLocaleDateString()}</td>
                              <td className="py-3 px-4 text-slate-600">{new Date(leave.endDate).toLocaleDateString()}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  leave.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                  leave.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {leave.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}

              {/* Client Reports */}
              {reportType === 'client' && (
                <section className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                  <div className="text-center py-12">
                    <Building className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Client Reports</h3>
                    <p className="text-slate-600">Client reporting functionality will be implemented here</p>
                    <p className="text-sm text-slate-500 mt-2">Currently showing {clients.length} clients in the system</p>
                  </div>
                </section>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}