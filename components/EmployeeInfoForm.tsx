import React, { useState, useEffect, useMemo } from "react";
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
  Camera,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  AlertTriangle,
  Folder,
  FolderOpen,
  Upload,
  X,
  File,
  List,
  Grid3X3,
  Plus,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  Copy,
  CheckCircle2,
  Circle,
  Link as LinkIcon,
  ClipboardList,
  Sparkles
} from "lucide-react";
import StaffDashboard from "./StaffDashboard";

export default function EmployeeInfoForm({ isModal = false }: { isModal?: boolean }) {
   const [activeTab, setActiveTab] = useState("Personal");
   const [activeSettingsTab, setActiveSettingsTab] = useState("Account");
   const [searchQuery, setSearchQuery] = useState("");

  // Individual edit states for each section
  const [editingSections, setEditingSections] = useState({
    personal: false,
    address: false,
    contact: false,
    education: false,
    emergency: false,
    job: false,
    employmentStatus: false,
    jobInformation: false,
    bankDetails: false
  });

  // My Info navigation tabs
  const myInfoTabs = [
    { id: 1, name: "Personal", icon: User },
    { id: 2, name: "Job Details", icon: Briefcase },
    { id: 3, name: "Documents", icon: FileText },
    { id: 4, name: "Time Off", icon: Calendar },
    { id: 5, name: "Performance", icon: Target },
    { id: 6, name: "Onboarding", icon: UserCheck },
    { id: 7, name: "Settings", icon: Settings },
  ];

  // Settings navigation tabs
  const settingsTabs = [
    { id: 1, name: "Account", icon: User },
    { id: 2, name: "Notifications", icon: Bell },
    { id: 3, name: "Security", icon: AlertTriangle },
    { id: 4, name: "Onboarding", icon: UserCheck },
    { id: 5, name: "Leave Management", icon: Calendar },
    { id: 6, name: "People", icon: Users },
  ];

  // Sidebar navigation
  const sidebarItems = [
    { id: 1, title: "Dashboard", icon: BarChart3 },
    { id: 2, title: "My Info", icon: User, active: true },
    { id: 3, title: "People", icon: Users },
    { id: 4, title: "Leave Management", icon: Calendar },
    { id: 5, title: "Report", icon: FileText },
    { id: 6, title: "E-Signature", icon: Award },
  ];

  // Form data states
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "Lionel",
    lastName: "Ishimwe",
    gender: "Male",
    nationality: "Rwandan",
    idNumber: "1199800123456789",
    birthDate: "1998-03-15",
    rssbNumber: "RS123456789",
    maritalStatus: "Single",
    status: "Active"
  });

  const [addressInfo, setAddressInfo] = useState({
    country: "Rwanda",
    province: "Kigali",
    city: "Kigali",
    postalCode: "00000",
    street: "KG 123 St"
  });

  const [contactInfo, setContactInfo] = useState({
    mobilePhone: "+250788123456",
    workPhone: "+250252123456",
    workEmail: "lionel.ishimwe@company.com",
    homeEmail: "lionel.personal@gmail.com"
  });

  const [educationInfo, setEducationInfo] = useState({
    institution: "University of Rwanda",
    degree: "Bachelor's Degree",
    specialization: "Computer Science",
    startDate: "2016-09",
    endDate: "2020-06"
  });

  const [emergencyContact, setEmergencyContact] = useState({
    firstName: "Jane",
    lastName: "Ishimwe",
    contact: "+250788987654",
    email: "jane.ishimwe@gmail.com",
    address: "Kigali, Rwanda"
  });

  // Job Details states
  const [jobInfo, setJobInfo] = useState({
    hireDate: "2021-01-15",
    contractEndDate: "2024-12-31",
    probationEndDate: "2021-04-15"
  });

  const [employmentStatus, setEmploymentStatus] = useState([
    {
      id: 1,
      effectiveDate: "2021-01-15",
      status: "Active",
      comment: "Initial employment"
    }
  ]);

  const [jobInformation, setJobInformation] = useState([
    {
      id: 1,
      jobTitle: "Senior Developer",
      location: "Kigali",
      division: "Technology",
      department: "Software Development",
      reportTo: "CTO"
    }
  ]);

  const [bankDetails, setBankDetails] = useState([
    {
      id: 1,
      bankName: "Bank of Kigali",
      nameOnAccount: "Lionel Ishimwe",
      accountNumber: "123456789012"
    }
  ]);

  // Document management states
  const [folders, setFolders] = useState([
    {
      id: 1,
      name: "Personal Documents",
      files: [
        { id: 1, name: "ID_Card.pdf", size: "2.5 MB", type: "pdf", uploadedAt: "2024-01-15" },
        { id: 2, name: "Resume.pdf", size: "1.2 MB", type: "pdf", uploadedAt: "2024-01-10" }
      ],
      isOpen: false
    },
    {
      id: 2,
      name: "Work Documents",
      files: [
        { id: 3, name: "Contract.pdf", size: "3.1 MB", type: "pdf", uploadedAt: "2024-01-05" },
        { id: 4, name: "Performance_Review.docx", size: "850 KB", type: "docx", uploadedAt: "2024-01-01" }
      ],
      isOpen: false
    },
    {
      id: 3,
      name: "Signed Documents",
      files: [],
      isOpen: false
    },
  ]);

  const [documentSearchQuery, setDocumentSearchQuery] = useState("");
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Load signed documents from localStorage on component mount
  useEffect(() => {
    const loadSignedDocuments = () => {
      try {
        const signedDocs = JSON.parse(localStorage.getItem('signedDocuments') || '[]');
        const signedFiles = signedDocs.map((doc: any, index: number) => ({
          id: 1000 + index, // Use high IDs to avoid conflicts
          name: doc.name,
          size: "Estimated 1-5 MB", // We don't have actual size from dataUrl
          type: "pdf",
          uploadedAt: new Date(doc.date).toISOString().split('T')[0],
          dataUrl: doc.dataUrl // Store the dataUrl for downloading
        }));

        setFolders(prev => prev.map(folder =>
          folder.id === 3 // Signed Documents folder
            ? { ...folder, files: signedFiles }
            : folder
        ));
      } catch (error) {
        console.error('Error loading signed documents:', error);
      }
    };

    loadSignedDocuments();
  }, []);


  // Time Off states - annual leave is automatically assigned during employee creation
  const [assignedLeaves, setAssignedLeaves] = useState([
    { id: 1, type: "Annual Leave", days: 25, used: 5, balance: 20 }
    // Other leave types (maternity, paternity, sick leave, study leave) are assigned separately
  ]);

  const [leaveHistory, setLeaveHistory] = useState([
    {
      id: 1,
      date: "2024-01-15",
      description: "Annual Leave",
      usedDays: 5,
      earnedDays: 2.5,
      balance: 20,
      status: "Approved"
    },
    {
      id: 2,
      date: "2024-03-10",
      description: "Sick Leave",
      usedDays: 2,
      earnedDays: 2.5,
      balance: 18,
      status: "Approved"
    },
    {
      id: 3,
      date: "2024-06-01",
      description: "Annual Leave",
      usedDays: 3,
      earnedDays: 2.5,
      balance: 17.5,
      status: "Approved"
    },
    {
      id: 4,
      date: "2024-09-15",
      description: "Annual Leave",
      usedDays: 4,
      earnedDays: 2.5,
      balance: 16,
      status: "Approved"
    }
  ]);

  const [leaveSearchType, setLeaveSearchType] = useState("");
  const [leaveSearchYear, setLeaveSearchYear] = useState("2024");

  // Leave request form state
  const [leaveRequest, setLeaveRequest] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    days: 0,
    reason: ""
  });
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Performance - Goals states
  const [goals, setGoals] = useState<{
    id: number;
    objective: string;
    dueDate: string;
    description: string;
    milestones: { id: number; title: string; completed: boolean; comment?: string }[];
    files: File[];
    status: string;
  }[]>([
    {
      id: 1,
      objective: "Complete Q4 project deliverables",
      dueDate: "2024-12-31",
      description: "Ensure all project milestones are met and deliverables are submitted on time.",
      milestones: [
        { id: 1, title: "Phase 1 completion", completed: true, comment: "Completed ahead of schedule" },
        { id: 2, title: "Phase 2 completion", completed: false }
      ],
      files: [],
      status: "In Progress"
    }
  ]);

  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [editingGoal, setEditingGoal] = useState<number | null>(null);

  // ...existing code...

// Insert after: const [editingGoal, setEditingGoal] = useState<number | null>(null);
// and before: const [showGoalModal, setShowGoalModal] = useState(false);


// ...existing code...

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    objective: "",
    dueDate: "",
    description: ""
  });
  const [milestonesEnabled, setMilestonesEnabled] = useState(false);
  const [milestones, setMilestones] = useState([{ id: 1, title: "" }]);
  const [goalFiles, setGoalFiles] = useState<File[]>([]);


  // Get staff list from localStorage or use default
  const getStaffList = (): any[] => {
    const saved = localStorage.getItem("staff_list");
    if (saved) {
      try { return JSON.parse(saved); } catch { /* fall through */ }
    }
    return [
      {
        id: 1,
        name: "Lionel Ishimwe",
        email: "lionel.ishimwe@company.com",
        position: "Senior Developer",
        department: "Technology",
        reportsTo: "CTO",
        status: "Active",
        hireDate: "2021-01-15"
      },
      {
        id: 2,
        name: "Sarah Johnson",
        email: "sarah.johnson@company.com",
        position: "Project Manager",
        department: "Operations",
        reportsTo: "CEO",
        status: "Active",
        hireDate: "2020-03-10"
      },
      {
        id: 3,
        name: "Mike Chen",
        email: "mike.chen@company.com",
        position: "UI/UX Designer",
        department: "Design",
        reportsTo: "Creative Director",
        status: "Active",
        hireDate: "2021-06-22"
      },
      {
        id: 4,
        name: "Emma Davis",
        email: "emma.davis@company.com",
        position: "HR Specialist",
        department: "Human Resources",
        reportsTo: "HR Director",
        status: "Active",
        hireDate: "2019-11-05"
      },
      {
        id: 5,
        name: "James Brown",
        email: "james.brown@company.com",
        position: "Marketing Coordinator",
        department: "Marketing",
        reportsTo: "Marketing Manager",
        status: "Active",
        hireDate: "2022-01-18"
      }
    ];
  };

  // Onboarding states
  const [onboardingTasks, setOnboardingTasks] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("onboarding_tasks_v1");
      if (saved) {
        try { return JSON.parse(saved); } catch { /* fall through */ }
      }
    }
    return [
      {
        id: 1,
        title: "Complete employment forms",
        assignedTo: "Lionel Ishimwe",
        startDate: "2024-01-15",
        dueDate: "2024-01-24",
        location: "Kigali, Rwanda",
        contacts: [
          { name: "Sarah Johnson", role: "HR Manager", phone: "+250788123456", email: "hr@bamboo-hr.com" }
        ],
        files: [],
        checklist: [
          { id: "w4", label: "Submit W-4 / Tax form", done: false },
          { id: "id", label: "Upload ID (Passport/National ID)", done: false },
          { id: "bank", label: "Add bank details", done: false },
        ],
        welcomeMessage: "",
        comments: [],
        status: "pending"
      }
    ];
  });

  // Custom templates state
  const [customTemplates, setCustomTemplates] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("custom_onboarding_templates");
      if (saved) {
        try { return JSON.parse(saved); } catch { /* fall through */ }
      }
    }
    return [];
  });

  const [showAddTemplateModal, setShowAddTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    label: "",
    title: "",
    checklist: [{ id: "item1", label: "", done: false }],
    files: []
  });

  // Onboarding settings state
  const [onboardingSettings, setOnboardingSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("onboarding_settings");
      if (saved) {
        try { return JSON.parse(saved); } catch { /* fall through */ }
      }
    }
    return {
      autoAssignWelcomeMessage: true,
      autoAssignHRContact: true,
      taskCompletionAlerts: true,
      overdueTaskReminders: true
    };
  });

  const [showAddTask, setShowAddTask] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [activeCommentTask, setActiveCommentTask] = useState<number | null>(null);
  const [commentText, setCommentText] = useState<string>("");

  // Client management states for Leave Management
  const [clients, setClients] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("leave_management_clients");
      if (saved) {
        try { return JSON.parse(saved); } catch { /* fall through */ }
      }
    }
    return [
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
  });

  const [selectedClientId, setSelectedClientId] = useState<number>(1);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [newClient, setNewClient] = useState({
    name: "",
    annualLeave: 25,
    sickLeave: 12,
    personalLeave: 5,
    maternityLeave: 90,
    paternityLeave: 15,
    studyLeave: 10
  });

  // People tab states
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [showStaffDashboard, setShowStaffDashboard] = useState(false);
  const [staffDashboardTab, setStaffDashboardTab] = useState("dashboard");

  // New Task form model
  const [newTask, setNewTask] = useState<any>({
    title: "",
    assignedTo: "",
    startDate: "",
    dueDate: "",
    location: "",
    contacts: [{ name: "", role: "", phone: "", email: "" }],
    files: [],
    checklist: [
      { id: "welcome", label: "Read welcome message", done: false },
      { id: "equipment", label: "Collect equipment (if applicable)", done: false },
    ],
    welcomeMessage: "",
    comments: [],
    status: "pending"
  });

  // Profile info for sidebar
  const profileInfo = {
    name: "Lionel Ishimwe",
    role: "Admin",
    details: "Software Developer",
    contact: "+250788123456",
    email: "lionel.ishimwe@company.com",
    jobTitle: "Senior Developer",
    hireDate: "January 15, 2021"
  };

  const handleInputChange = (section: string, field: string, value: string) => {
    switch (section) {
      case 'personal':
        setPersonalInfo(prev => ({ ...prev, [field]: value }));
        break;
      case 'address':
        setAddressInfo(prev => ({ ...prev, [field]: value }));
        break;
      case 'contact':
        setContactInfo(prev => ({ ...prev, [field]: value }));
        break;
      case 'education':
        setEducationInfo(prev => ({ ...prev, [field]: value }));
        break;
      case 'emergency':
        setEmergencyContact(prev => ({ ...prev, [field]: value }));
        break;
      case 'job':
        setJobInfo(prev => ({ ...prev, [field]: value }));
        break;
    }
  };

  const toggleSectionEdit = (section: keyof typeof editingSections) => {
    setEditingSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Functions for managing table data
  const addEmploymentStatus = () => {
    const newEntry = {
      id: Date.now(),
      effectiveDate: "",
      status: "",
      comment: ""
    };
    setEmploymentStatus(prev => [...prev, newEntry]);
  };

  const updateEmploymentStatus = (id: number, field: string, value: string) => {
    setEmploymentStatus(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const deleteEmploymentStatus = (id: number) => {
    setEmploymentStatus(prev => prev.filter(item => item.id !== id));
  };

  const addJobInformation = () => {
    const newEntry = {
      id: Date.now(),
      jobTitle: "",
      location: "",
      division: "",
      department: "",
      reportTo: ""
    };
    setJobInformation(prev => [...prev, newEntry]);
  };

  const updateJobInformation = (id: number, field: string, value: string) => {
    setJobInformation(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const deleteJobInformation = (id: number) => {
    setJobInformation(prev => prev.filter(item => item.id !== id));
  };

  const addBankDetails = () => {
    const newEntry = {
      id: Date.now(),
      bankName: "",
      nameOnAccount: "",
      accountNumber: ""
    };
    setBankDetails(prev => [...prev, newEntry]);
  };

  const updateBankDetails = (id: number, field: string, value: string) => {
    setBankDetails(prev =>
      prev.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const deleteBankDetails = (id: number) => {
    setBankDetails(prev => prev.filter(item => item.id !== id));
  };

  // Document management functions
  const toggleFolder = (folderId: number) => {
    setFolders(prev => prev.map(folder =>
      folder.id === folderId
        ? { ...folder, isOpen: !folder.isOpen }
        : folder
    ));
  };

  const createFolder = () => {
    if (newFolderName.trim()) {
      const newFolder = {
        id: Date.now(),
        name: newFolderName.trim(),
        files: [],
        isOpen: false
      };
      setFolders(prev => [...prev, newFolder]);
      setNewFolderName("");
      setShowCreateFolderModal(false);
    }
  };

  const uploadFile = (folderId: number, file: File) => {
    const newFile = {
      id: Date.now() + Math.random(), // Ensure unique IDs for multiple files
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: file.name.split('.').pop() || 'file',
      uploadedAt: new Date().toISOString().split('T')[0]
    };

    setFolders(prev => prev.map(folder =>
      folder.id === folderId
        ? { ...folder, files: [...folder.files, newFile] }
        : folder
    ));
  };

  const handleMultipleFileUpload = (folderId: number, files: FileList) => {
    const fileArray = Array.from(files);
    fileArray.forEach(file => uploadFile(folderId, file));

    const folderName = folders.find(f => f.id === folderId)?.name || 'folder';
    setUploadStatus(`Successfully uploaded ${fileArray.length} file${fileArray.length > 1 ? 's' : ''} to ${folderName}`);

    // Clear status after 3 seconds
    setTimeout(() => setUploadStatus(''), 3000);
  };

  const deleteFile = (folderId: number, fileId: number) => {
    setFolders(prev => prev.map(folder =>
      folder.id === folderId
        ? { ...folder, files: folder.files.filter(file => file.id !== fileId) }
        : folder
    ));
  };

  const downloadFile = (fileName: string) => {
    // Find the file in folders to check if it's a signed document
    const allFiles = folders.flatMap(folder => folder.files);
    const file = allFiles.find(f => f.name === fileName);

    if (file && (file as any).dataUrl) {
      // This is a signed document with dataUrl
      const a = document.createElement('a');
      a.href = (file as any).dataUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Simulate download for other files
      alert(`Downloading ${fileName}`);
    }
  };

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(documentSearchQuery.toLowerCase()) ||
    folder.files.some(file => file.name.toLowerCase().includes(documentSearchQuery.toLowerCase()))
  );

  // Leave request functions
  const calculateDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    return diffDays;
  };

  const handleLeaveRequestChange = (field: string, value: string) => {
    setLeaveRequest(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-calculate days when dates change (but don't override manual input)
      if (field === 'startDate' || field === 'endDate') {
        const calculatedDays = calculateDays(updated.startDate, updated.endDate);
        // Only auto-calculate if days field is empty or was previously auto-calculated
        if (!updated.days || updated.days === calculateDays(prev.startDate, prev.endDate)) {
          updated.days = calculatedDays;
        }
      }

      return updated;
    });
  };

  const submitLeaveRequest = () => {
    if (!leaveRequest.leaveType || !leaveRequest.startDate || !leaveRequest.endDate || !leaveRequest.days) {
      alert('Please fill in all required fields');
      return;
    }

    // Check if employee has enough balance (only for assigned leaves)
    const selectedLeave = assignedLeaves.find(leave => leave.type === leaveRequest.leaveType);
    if (selectedLeave && leaveRequest.days > selectedLeave.balance) {
      alert(`Insufficient leave balance. You have ${selectedLeave.balance} days remaining.`);
      return;
    }

    // Add to leave history
    const newHistoryEntry = {
      id: Date.now(),
      date: leaveRequest.startDate,
      description: leaveRequest.leaveType,
      usedDays: leaveRequest.days,
      earnedDays: 0, // No earning on request
      balance: selectedLeave ? selectedLeave.balance - leaveRequest.days : 0,
      status: "Approved" // Leave requests are automatically approved when submitted
    };

    setLeaveHistory(prev => [...prev, newHistoryEntry]);

    // Update assigned leave balance (only if leave is assigned)
    if (selectedLeave) {
      setAssignedLeaves(prev =>
        prev.map(leave =>
          leave.type === leaveRequest.leaveType
            ? { ...leave, used: leave.used + leaveRequest.days, balance: leave.balance - leaveRequest.days }
            : leave
        )
      );
    }

    // Reset form
    setLeaveRequest({
      leaveType: "",
      startDate: "",
      endDate: "",
      days: 0,
      reason: ""
    });
    setShowRequestForm(false);

    alert('Leave request submitted successfully!');
  };

  // Goal management functions
  const addMilestone = () => {
    setMilestones(prev => [...prev, { id: Date.now(), title: "" }]);
  };

  const updateMilestone = (id: number, title: string) => {
    setMilestones(prev => prev.map(milestone =>
      milestone.id === id ? { ...milestone, title } : milestone
    ));
  };

  const removeMilestone = (id: number) => {
    setMilestones(prev => prev.filter(milestone => milestone.id !== id));
  };

  const handleGoalFileUpload = (files: FileList) => {
    const fileArray = Array.from(files);
    setGoalFiles(prev => [...prev, ...fileArray]);
  };

  const removeGoalFile = (index: number) => {
    setGoalFiles(prev => prev.filter((_, i) => i !== index));
  };

  const submitGoal = () => {
    if (!goalForm.objective || !goalForm.dueDate) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingGoal) {
      // Update existing goal
      setGoals(prev => prev.map(goal =>
        goal.id === editingGoal
          ? {
              ...goal,
              objective: goalForm.objective,
              dueDate: goalForm.dueDate,
              description: goalForm.description,
              milestones: milestonesEnabled ? milestones.filter(m => m.title.trim()).map(m => {
                const existingMilestone = goal.milestones.find(em => em.id === m.id);
                return {
                  ...m,
                  completed: existingMilestone?.completed || false,
                  comment: existingMilestone?.comment || ""
                };
              }) : [],
              files: goalFiles
            }
          : goal
      ));
      alert('Goal updated successfully!');
    } else {
      // Create new goal
      const newGoal = {
        id: Date.now(),
        objective: goalForm.objective,
        dueDate: goalForm.dueDate,
        description: goalForm.description,
        milestones: milestonesEnabled ? milestones.filter(m => m.title.trim()).map(m => ({ ...m, completed: false, comment: "" })) : [],
        files: goalFiles,
        status: "Not Started"
      };

      setGoals(prev => [...prev, newGoal]);
      alert('Goal created successfully!');
    }

    // Reset form
    setGoalForm({ objective: "", dueDate: "", description: "" });
    setMilestonesEnabled(false);
    setMilestones([{ id: 1, title: "" }]);
    setGoalFiles([]);
    setShowGoalModal(false);
    setEditingGoal(null);
  };

  // Goal progress and interaction functions
  const calculateProgress = (goal: typeof goals[0]) => {
    if (goal.milestones.length === 0) return 0;
    const completed = goal.milestones.filter(m => m.completed).length;
    return Math.round((completed / goal.milestones.length) * 100);
  };

  const toggleMilestone = (goalId: number, milestoneId: number) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id === goalId) {
        const updatedMilestones = goal.milestones.map(milestone =>
          milestone.id === milestoneId
            ? { ...milestone, completed: !milestone.completed }
            : milestone
        );
        const progress = calculateProgress({ ...goal, milestones: updatedMilestones });
        const newStatus = progress === 100 ? "Completed" : progress > 0 ? "In Progress" : "Not Started";
        return { ...goal, milestones: updatedMilestones, status: newStatus };
      }
      return goal;
    }));
  };

  const updateMilestoneComment = (goalId: number, milestoneId: number, comment: string) => {
    setGoals(prev => prev.map(goal =>
      goal.id === goalId
        ? {
            ...goal,
            milestones: goal.milestones.map(milestone =>
              milestone.id === milestoneId
                ? { ...milestone, comment }
                : milestone
            )
          }
        : goal
    ));
  };

  const deleteGoal = (goalId: number) => {
    if (window.confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      if (selectedGoal === goalId) {
        setSelectedGoal(null);
      }
    }
  };

  const editGoal = (goalId: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      setGoalForm({
        objective: goal.objective,
        dueDate: goal.dueDate,
        description: goal.description
      });
      setMilestonesEnabled(goal.milestones.length > 0);
      setMilestones(goal.milestones.map(m => ({ id: m.id, title: m.title })));
      setGoalFiles(goal.files);
      setEditingGoal(goalId);
      setShowGoalModal(true);
    }
  };

  // Onboarding functions
  const formatBytes = (bytes: number): string => {
    if (!bytes && bytes !== 0) return "";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const mapsHref = (address: string): string =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  const computeProgress = (task: any): number => {
    const checklistTotal = task.checklist?.length || 0;
    const checklistDone = task.checklist?.filter((c: any) => c.done)?.length || 0;
    const filesTotal = task.files?.length || 0;
    const filesSigned = task.files?.filter((f: any) => f.signed)?.length || 0;

    const total = checklistTotal + filesTotal;
    const done = checklistDone + filesSigned;

    if (total === 0) return 0;
    return Math.round((done / total) * 100);
  };

  const completedCount = onboardingTasks.filter((t: any) => t.status === "completed").length;
  const pendingCount = onboardingTasks.filter((t: any) => t.status === "pending").length;

  // Available templates state - combine default and custom templates
  const [availableTemplates, setAvailableTemplates] = useState<any[]>(() => {
    const defaultTemplates = [
      {
        id: "default-employment",
        label: "Employment Forms",
        title: "Employment forms & payroll setup",
        checklist: [
          { id: "id", label: "Upload ID", done: false },
          { id: "pension", label: "Register for pension/social security", done: false },
          { id: "tax", label: "Complete tax form", done: false },
        ],
        files: [
          { name: "Employment_Agreement.pdf", size: 281000, type: "application/pdf", uploadedAt: new Date().toISOString(), signed: false }
        ],
        isDefault: true
      },
      {
        id: "default-equipment",
        label: "Equipment Pickup",
        title: "Laptop & tools pickup",
        checklist: [
          { id: "laptop", label: "Receive laptop", done: false },
          { id: "vpn", label: "Set up VPN", done: false },
          { id: "accounts", label: "Activate work accounts", done: false },
        ],
        files: [
          { name: "Equipment_Receipt.pdf", size: 92000, type: "application/pdf", uploadedAt: new Date().toISOString(), signed: false }
        ],
        isDefault: true
      },
      {
        id: "default-agenda",
        label: "First Week Agenda",
        title: "First-week onboarding agenda",
        checklist: [
          { id: "orientation", label: "Attend orientation", done: false },
          { id: "meet-team", label: "Meet your team", done: false },
          { id: "policies", label: "Review key policies", done: false },
        ],
        files: [],
        isDefault: true
      }
    ];

    const custom = customTemplates.map(template => ({
      ...template,
      isDefault: false,
      build: () => ({
        title: template.title,
        checklist: template.checklist.map((item: any) => ({ ...item, done: false })),
        files: template.files.map((file: any) => ({ ...file, signed: false }))
      })
    }));

    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("available_onboarding_templates");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [...defaultTemplates, ...custom];
        }
      }
    }
    return [...defaultTemplates, ...custom];
  });

  // Save available templates to localStorage when changed
  useEffect(() => {
    localStorage.setItem("available_onboarding_templates", JSON.stringify(availableTemplates));
  }, [availableTemplates]);

  // Save onboarding settings to localStorage when changed
  useEffect(() => {
    localStorage.setItem("onboarding_settings", JSON.stringify(onboardingSettings));
  }, [onboardingSettings]);

  // Templates for onboarding tab - only enabled ones
  const templates = availableTemplates
    .filter(template => template.enabled !== false)
    .map(template => ({
      label: template.label,
      build: () => ({
        title: template.title,
        checklist: template.checklist.map((item: any) => ({ ...item, done: false })),
        files: template.files.map((file: any) => ({ ...file, signed: false }))
      })
    }));

  // Handlers
  const handleAddTask = (): void => {
    if (!newTask.title.trim() || !newTask.assignedTo.trim()) return;
    const id = Date.now();

    let welcomeMessage = newTask.welcomeMessage?.trim() || "";
    if (!welcomeMessage && onboardingSettings.autoAssignWelcomeMessage) {
      welcomeMessage = `Welcome aboard, ${newTask.assignedTo}! 🎉
We're excited to have you join us${newTask.startDate ? ` on ${newTask.startDate}` : ""}.
Location: ${newTask.location || "TBA"}
Key contacts: ${
        (newTask.contacts || [])
          .filter((c: any) => c.name)
          .map((c: any) => `${c.name}${c.role ? ` (${c.role})` : ""}`)
          .join(", ") || "TBA"
      }

If you need anything before Day 1, reply here and we'll help you get set up.`;
    } else if (!welcomeMessage && !onboardingSettings.autoAssignWelcomeMessage) {
      welcomeMessage = undefined;
    }

    const taskToAdd = {
      ...newTask,
      id,
      welcomeMessage
    };
    setOnboardingTasks((prev: any) => [...prev, taskToAdd]);
    setNewTask({
      title: "",
      assignedTo: "",
      startDate: "",
      dueDate: "",
      location: "",
      contacts: [{ name: "", role: "", phone: "", email: "" }],
      files: [],
      checklist: [
        { id: "welcome", label: "Read welcome message", done: false },
        { id: "equipment", label: "Collect equipment (if applicable)", done: false },
      ],
      welcomeMessage: "",
      comments: [],
      status: "pending"
    });
    setShowAddTask(false);
  };

  const handleUpdateTask = (): void => {
    if (!editingTask) return;
    setOnboardingTasks(onboardingTasks.map((t: any) => (t.id === editingTask.id ? editingTask : t)));
    setEditingTask(null);
  };

  const handleDeleteTask = (id: number): void => {
    setOnboardingTasks(onboardingTasks.filter((t: any) => t.id !== id));
  };

  const handleAddComment = (taskId: number): void => {
    if (!commentText.trim()) return;
    setOnboardingTasks(onboardingTasks.map((t: any) =>
      t.id === taskId
        ? { ...t, comments: [...t.comments, { text: commentText, date: new Date().toLocaleString() }] }
        : t
    ));
    setCommentText("");
    setActiveCommentTask(null);
  };

  const handleFileUpload = (taskId: number, e: any): void => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const mapped = selected.map((f: any) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      uploadedAt: new Date().toISOString(),
      signed: false
    }));

    setOnboardingTasks(onboardingTasks.map((t: any) => (t.id === taskId ? { ...t, files: [...t.files, ...mapped] } : t)));
    e.target.value = ""; // reset input
  };

  const handleChecklistFileUpload = (taskId: number, itemId: string, file: File): void => {
    const newFile = {
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      signed: false
    };

    setOnboardingTasks(onboardingTasks.map((t: any) => {
      if (t.id === taskId) {
        const updatedChecklist = (t.checklist || []).map((c: any) =>
          c.id === itemId ? { ...c, done: true, file: newFile } : c
        );
        const checklistTotal = updatedChecklist.length;
        const checklistDone = updatedChecklist.filter((c: any) => c.done).length;
        const filesTotal = t.files?.length || 0;
        const filesSigned = t.files?.filter((f: any) => f.signed)?.length || 0;
        const total = checklistTotal + filesTotal;
        const done = checklistDone + filesSigned;
        const progress = total === 0 ? 0 : Math.round((done / total) * 100);
        return {
          ...t,
          checklist: updatedChecklist,
          status: progress === 100 ? "completed" : t.status
        };
      }
      return t;
    }));
  };

  const replaceChecklistFile = (taskId: number, itemId: string, file: File): void => {
    const newFile = {
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
      signed: false
    };

    setOnboardingTasks(onboardingTasks.map((t: any) =>
      t.id === taskId
        ? {
            ...t,
            checklist: (t.checklist || []).map((c: any) =>
              c.id === itemId ? { ...c, file: newFile } : c
            )
          }
        : t
    ));
  };

  const toggleStatus = (taskId: number): void => {
    setOnboardingTasks(onboardingTasks.map((t: any) =>
      t.id === taskId
        ? { ...t, status: t.status === "pending" ? "completed" : "pending" }
        : t
    ));
  };

  const toggleChecklist = (taskId: number, itemId: string): void => {
    setOnboardingTasks(onboardingTasks.map((t: any) => {
      if (t.id === taskId) {
        const updatedChecklist = (t.checklist || []).map((c: any) =>
          c.id === itemId ? { ...c, done: !c.done } : c
        );
        const checklistTotal = updatedChecklist.length;
        const checklistDone = updatedChecklist.filter((c: any) => c.done).length;
        const filesTotal = t.files?.length || 0;
        const filesSigned = t.files?.filter((f: any) => f.signed)?.length || 0;
        const total = checklistTotal + filesTotal;
        const done = checklistDone + filesSigned;
        const progress = total === 0 ? 0 : Math.round((done / total) * 100);
        return {
          ...t,
          checklist: updatedChecklist,
          status: progress === 100 ? "completed" : t.status
        };
      }
      return t;
    }));
  };

  const toggleSignFile = (taskId: number, fileIndex: number): void => {
    setOnboardingTasks(onboardingTasks.map((t: any) => {
      if (t.id === taskId) {
        const updatedFiles = t.files.map((f: any, idx: number) =>
          idx === fileIndex ? { ...f, signed: !f.signed, signedAt: !f.signed ? new Date().toISOString() : undefined } : f
        );
        const checklistTotal = t.checklist?.length || 0;
        const checklistDone = t.checklist?.filter((c: any) => c.done)?.length || 0;
        const filesTotal = updatedFiles.length;
        const filesSigned = updatedFiles.filter((f: any) => f.signed).length;
        const total = checklistTotal + filesTotal;
        const done = checklistDone + filesSigned;
        const progress = total === 0 ? 0 : Math.round((done / total) * 100);
        return {
          ...t,
          files: updatedFiles,
          status: progress === 100 ? "completed" : t.status
        };
      }
      return t;
    }));
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text || "");
      return true;
    } catch {
      return false;
    }
  };

  // Template management functions
  const addTemplate = () => {
    if (!newTemplate.label.trim() || !newTemplate.title.trim()) {
      alert('Please fill in template label and title');
      return;
    }

    const template = {
      id: Date.now(),
      label: newTemplate.label.trim(),
      title: newTemplate.title.trim(),
      checklist: newTemplate.checklist.filter(item => item.label.trim()),
      files: newTemplate.files,
      isDefault: false
    };

    const updatedTemplates = [...availableTemplates, template];
    setAvailableTemplates(updatedTemplates);

    // Reset form
    setNewTemplate({
      label: "",
      title: "",
      checklist: [{ id: "item1", label: "", done: false }],
      files: []
    });
    setShowAddTemplateModal(false);
  };

  const deleteTemplate = (templateId: number | string) => {
    if (window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      const updatedTemplates = availableTemplates.filter(t => t.id !== templateId);
      setAvailableTemplates(updatedTemplates);
    }
  };

  const toggleTemplateEnabled = (templateId: number | string) => {
    setAvailableTemplates(prev => prev.map(template =>
      template.id === templateId
        ? { ...template, enabled: !template.enabled }
        : template
    ));
  };

  const toggleOnboardingSetting = (setting: keyof typeof onboardingSettings) => {
    setOnboardingSettings((prev: typeof onboardingSettings) => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const addTemplateChecklistItem = () => {
    const newId = `item${Date.now()}`;
    setNewTemplate(prev => ({
      ...prev,
      checklist: [...prev.checklist, { id: newId, label: "", done: false }]
    }));
  };

  const updateTemplateChecklistItem = (index: number, label: string) => {
    setNewTemplate(prev => ({
      ...prev,
      checklist: prev.checklist.map((item, i) =>
        i === index ? { ...item, label } : item
      )
    }));
  };

  const removeTemplateChecklistItem = (index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== index)
    }));
  };

  // Client management functions
  const addClient = () => {
    if (!newClient.name.trim()) {
      alert('Please enter a client name');
      return;
    }

    const client = {
      id: Date.now(),
      ...newClient,
      name: newClient.name.trim(),
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updatedClients = [...clients, client];
    setClients(updatedClients);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem("leave_management_clients", JSON.stringify(updatedClients));
    }

    // Reset form
    setNewClient({
      name: "",
      annualLeave: 25,
      sickLeave: 12,
      personalLeave: 5,
      maternityLeave: 90,
      paternityLeave: 15,
      studyLeave: 10
    });
    setShowAddClientModal(false);
  };

  const updateClient = (clientId: number, field: string, value: string | number) => {
    const updatedClients = clients.map(client =>
      client.id === clientId ? { ...client, [field]: value } : client
    );
    setClients(updatedClients);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem("leave_management_clients", JSON.stringify(updatedClients));
    }
  };

  const deleteClient = (clientId: number) => {
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      const updatedClients = clients.filter(client => client.id !== clientId);
      setClients(updatedClients);
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem("leave_management_clients", JSON.stringify(updatedClients));
      }

      // If deleted client was selected, select the first available client
      if (selectedClientId === clientId && updatedClients.length > 0) {
        setSelectedClientId(updatedClients[0].id);
      }
    }
  };

  const getSelectedClient = () => {
    return clients.find(client => client.id === selectedClientId) || clients[0];
  };

  // Save clients to localStorage when changed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("leave_management_clients", JSON.stringify(clients));
    }
  }, [clients]);

  // Onboarding Components
  const StatPill = ({ label, value, tone = "green" }: { label: string; value: number; tone?: string }) => (
    <div className={`text-center px-6 py-3 rounded-lg bg-${tone}-50`}>
      <div className={`text-2xl font-bold text-${tone}-600`}>{value}</div>
      <div className={`text-sm text-${tone}-700`}>{label}</div>
    </div>
  );

  const ProgressBar = ({ value }: { value: number }) => (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div
        className="h-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );

  const FileBadge = ({ file, onToggleSign }: { file: any; onToggleSign: () => void }) => (
    <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-sm">
      <FileText size={16} />
      <span className="truncate max-w-[180px]" title={file.name}>{file.name}</span>
      {file.size ? <span className="text-xs text-indigo-500">· {formatBytes(file.size)}</span> : null}
      <button
        onClick={onToggleSign}
        className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${
          file.signed ? "bg-green-100 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"
        }`}
        title={file.signed ? `Signed${file.signedAt ? ` on ${new Date(file.signedAt).toLocaleString()}` : ""}` : "Mark as signed"}
      >
        {file.signed ? "Signed" : "E-sign"}
      </button>
    </div>
  );

  const ContactRow = ({ c }: { c: any }) => (
    <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-2">
      <User size={16} className="text-blue-500" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-800 truncate">
          {c.name || "Unnamed"}{c.role ? ` • ${c.role}` : ""}
        </div>
        <div className="flex gap-3 text-sm text-slate-500">
          {c.phone ? (
            <span className="inline-flex items-center gap-1">
              <Phone size={14} /> <a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a>
            </span>
          ) : null}
          {c.email ? (
            <span className="inline-flex items-center gap-1">
              <Mail size={14} /> <a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );

  const TaskCard = ({ task }: { task: any }) => {
    const progress = computeProgress(task);
    return (
      <div
        className={`bg-white rounded-xl shadow-lg p-6 mb-4 border-l-4 transition-all hover:shadow-xl ${
          task.status === "completed" ? "border-green-500 opacity-85" : "border-blue-500"
        }`}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-800">{task.title}</h3>
              <button
                onClick={() => toggleStatus(task.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  task.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {task.status === "completed" ? "Completed" : "Pending"}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-56">
                <ProgressBar value={progress} />
              </div>
              <span className="text-sm text-slate-600">{progress}%</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setEditingTask(task)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit2 size={18} />
            </button>
            <button
              onClick={() => handleDeleteTask(task.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-gray-700">
            <User size={18} className="text-blue-500" />
            <span className="font-medium">Assigned to:</span>
            <span>{task.assignedTo}</span>
          </div>

          {task.startDate && (
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar size={18} className="text-green-500" />
              <span className="font-medium">Start:</span>
              <span>{task.startDate}</span>
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-center gap-2 text-gray-700">
              <Clock size={18} className="text-orange-500" />
              <span className="font-medium">Due:</span>
              <span>{task.dueDate}</span>
            </div>
          )}

          {task.location && (
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin size={18} className="text-red-500" />
              <span className="font-medium">Location:</span>
              <a
                href={mapsHref(task.location)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                title="Open in Maps"
              >
                {task.location}
                <LinkIcon size={14} />
              </a>
            </div>
          )}
        </div>

        {/* Contacts */}
        {(task.contacts?.length || 0) > 0 && task.contacts.some((c: any) => c.name || c.email || c.phone) && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 text-gray-700 font-medium">
              <Briefcase size={18} className="text-purple-500" />
              <span>People to contact:</span>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              {task.contacts.map((c: any, idx: number) =>
                (c.name || c.email || c.phone) ? <ContactRow key={idx} c={c} /> : null
              )}
            </div>
          </div>
        )}

        {/* Files with e-sign */}
        {task.files.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 text-gray-700 font-medium">
              <FileText size={18} className="text-indigo-500" />
              <span>Files (e-sign ready):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {task.files.map((file: any, idx: number) => (
                <FileBadge
                  key={`${file.name}-${idx}`}
                  file={file}
                  onToggleSign={() => toggleSignFile(task.id, idx)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Checklist */}
        {(task.checklist?.length || 0) > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 text-gray-700 font-medium">
              <ClipboardList size={18} className="text-teal-600" />
              <span>Checklist:</span>
            </div>
            <div className="flex flex-col gap-2">
              {task.checklist.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 text-left bg-slate-50 hover:bg-slate-100 rounded-lg p-2 transition">
                  {item.done ? (
                    <CheckCircle2 size={18} className="text-green-600" />
                  ) : (
                    <Circle size={18} className="text-slate-400" />
                  )}
                  <span className={`${item.done ? "line-through text-slate-500" : "text-slate-700"} flex-1`}>{item.label}</span>
                  <div className="flex items-center gap-1">
                    {item.done && item.file && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 text-xs text-green-600">
                          <FileText size={14} />
                          <span>{item.file.name}</span>
                        </div>
                        <label>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                replaceChecklistFile(task.id, item.id, file);
                              }
                            }}
                          />
                          <button
                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                            title="Replace file"
                            onClick={(e) => {
                              // Reset the input value to allow selecting the same file again
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                              input.value = '';
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                        </label>
                      </div>
                    )}
                    {!item.done && (
                      <label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleChecklistFileUpload(task.id, item.id, file);
                            }
                          }}
                        />
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs cursor-pointer hover:bg-blue-200">
                          <Upload size={12} />
                          <span>Upload</span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Welcome message */}
        {task.welcomeMessage ? (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 text-gray-700 font-medium">
              <Sparkles size={18} className="text-pink-500" />
              <span>Welcome message:</span>
              <button
                onClick={async () => {
                  const ok = await copyToClipboard(task.welcomeMessage);
                  if (ok) alert("Welcome message copied!");
                }}
                className="ml-2 text-sm inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200"
                title="Copy"
              >
                <Copy size={14} /> Copy
              </button>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg text-slate-800 whitespace-pre-wrap">
              {task.welcomeMessage}
            </div>
          </div>
        ) : null}

        {/* Comments */}
        {task.comments.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 text-gray-700 font-medium">
              <MessageSquare size={18} className="text-orange-500" />
              <span>Comments:</span>
            </div>
            <div className="space-y-2">
              {task.comments.map((comment: any, idx: number) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-700">{comment.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{comment.date}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
          <label className="flex-1 md:flex-none">
            <input
              type="file"
              multiple
              onChange={(e) => handleFileUpload(task.id, e)}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
              <Upload size={18} />
              <span className="font-medium">Upload Files</span>
            </div>
          </label>

          <button
            onClick={() => setActiveCommentTask(task.id)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
          >
            <MessageSquare size={18} />
            <span className="font-medium">Add Comment</span>
          </button>
        </div>

        {activeCommentTask === task.id && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleAddComment(task.id)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Check size={18} />
                Post Comment
              </button>
              <button
                onClick={() => {
                  setActiveCommentTask(null);
                  setCommentText("");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const TaskForm = ({ task, onChange, onSave, onCancel, isEdit = false }: { task: any; onChange: (task: any) => void; onSave: () => void; onCancel: () => void; isEdit?: boolean }) => {
    const setField = (k: string, v: any) => onChange({ ...task, [k]: v });

    const staffList = getStaffList();
    const [assignedToSearch, setAssignedToSearch] = useState<string>(task.assignedTo || "");
    const [showAssignedToDropdown, setShowAssignedToDropdown] = useState<boolean>(false);

    const filteredStaffList = staffList.filter((staff: any) =>
      staff.status === "Active" && (
        staff.name.toLowerCase().includes(assignedToSearch.toLowerCase()) ||
        staff.position.toLowerCase().includes(assignedToSearch.toLowerCase()) ||
        staff.email.toLowerCase().includes(assignedToSearch.toLowerCase()) ||
        staff.department.toLowerCase().includes(assignedToSearch.toLowerCase())
      )
    );

    const generatedWelcome = useMemo(() => {
      if (task.welcomeMessage?.trim()) return task.welcomeMessage;
      if (!task.assignedTo && !task.location && !task.startDate) return "";
      return `Welcome aboard, ${task.assignedTo || "new teammate"}! 🎉
We're excited to have you join us${task.startDate ? ` on ${task.startDate}` : ""}.
Location: ${task.location || "TBA"}
Key contacts: ${
        (task.contacts || [])
          .filter((c: any) => c.name)
          .map((c: any) => `${c.name}${c.role ? ` (${c.role})` : ""}`)
          .join(", ") || "TBA"
      }

If you need anything before Day 1, reply here and we'll help you get set up.`;
    }, [task.assignedTo, task.location, task.startDate, task.contacts, task.welcomeMessage]);

    const updateContact = (idx: number, field: string, value: string) => {
      const next = [...(task.contacts || [])];
      next[idx] = { ...next[idx], [field]: value };
      setField("contacts", next);
    };

    const addContact = () => {
      setField("contacts", [...(task.contacts || []), { name: "", role: "", phone: "", email: "" }]);
    };

    const removeContact = (idx: number) => {
      const next = [...(task.contacts || [])];
      next.splice(idx, 1);
      setField("contacts", next.length ? next : [{ name: "", role: "", phone: "", email: "" }]);
    };

    const addChecklistItem = () => {
      const id = Math.random().toString(36).slice(2, 8);
      setField("checklist", [...(task.checklist || []), { id, label: "", done: false }]);
    };

    const updateChecklistItem = (idx: number, value: string) => {
      const next = [...(task.checklist || [])];
      next[idx] = { ...next[idx], label: value };
      setField("checklist", next);
    };

    const removeChecklistItem = (idx: number) => {
      const next = [...(task.checklist || [])];
      next.splice(idx, 1);
      setField("checklist", next);
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">
          {isEdit ? "Edit Task" : "Add New Onboarding Task"}
        </h3>

        {/* Quick templates */}
        {!isEdit && (
          <div className="flex flex-wrap gap-2 mb-6">
            {templates.map(t => (
              <button
                key={t.label}
                onClick={() => {
                  const pre = t.build();
                  onChange({
                    ...task,
                    title: pre.title,
                    checklist: pre.checklist,
                    files: pre.files
                  });
                }}
                className="text-sm px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200"
              >
                Use template: {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
            <input
              type="text"
              value={task.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="e.g., Complete employment forms"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To *</label>
              <div className="relative">
                <input
                  type="text"
                  value={assignedToSearch}
                  onChange={(e) => {
                    setAssignedToSearch(e.target.value);
                    setShowAssignedToDropdown(true);
                  }}
                  onFocus={() => setShowAssignedToDropdown(true)}
                  onBlur={() => setTimeout(() => setShowAssignedToDropdown(false), 200)}
                  placeholder="Search employees..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {showAssignedToDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredStaffList.length > 0 ? (
                      filteredStaffList.map((staff: any) => (
                        <div
                          key={staff.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => {
                            setField("assignedTo", staff.name);
                            setAssignedToSearch(staff.name);
                            setShowAssignedToDropdown(false);
                          }}
                        >
                          <div className="font-medium text-gray-800">{staff.name}</div>
                          <div className="text-sm text-gray-600">{staff.position} • {staff.department}</div>
                          <div className="text-xs text-gray-500">{staff.email}</div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-gray-500 text-sm">No employees found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={task.startDate}
                onChange={(e) => setField("startDate", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
              <input
                type="date"
                value={task.dueDate || ""}
                onChange={(e) => setField("dueDate", e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location / Address</label>
              <input
                type="text"
                value={task.location}
                onChange={(e) => setField("location", e.target.value)}
                placeholder="Office location"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Contacts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">People to Contact</label>
              <button onClick={addContact} className="text-sm px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200">Add contact</button>
            </div>
            <div className="space-y-2">
              {(task.contacts || []).map((c: any, idx: number) => (
                <div key={idx} className="grid md:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => updateContact(idx, "name", e.target.value)}
                    placeholder="Name"
                    className="p-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    value={c.role}
                    onChange={(e) => updateContact(idx, "role", e.target.value)}
                    placeholder="Role"
                    className="p-2 border rounded-lg"
                  />
                  <input
                    type="text"
                    value={c.phone}
                    onChange={(e) => updateContact(idx, "phone", e.target.value)}
                    placeholder="Phone"
                    className="p-2 border rounded-lg"
                  />
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={c.email}
                      onChange={(e) => updateContact(idx, "email", e.target.value)}
                      placeholder="Email"
                      className="p-2 border rounded-lg flex-1"
                    />
                    <button
                      onClick={() => removeContact(idx)}
                      className="px-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checklist editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Checklist</label>
              <button onClick={addChecklistItem} className="text-sm px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200">Add item</button>
            </div>
            <div className="space-y-2">
              {(task.checklist || []).map((c: any, idx: number) => (
                <div key={c.id} className="flex gap-2">
                  <input
                    type="text"
                    value={c.label}
                    onChange={(e) => updateChecklistItem(idx, e.target.value)}
                    placeholder="Checklist item"
                    className="p-2 border rounded-lg flex-1"
                  />
                  <button
                    onClick={() => removeChecklistItem(idx)}
                    className="px-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Welcome message */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium text-gray-700">Welcome message</label>
              <button
                onClick={() => setField("welcomeMessage", generatedWelcome)}
                className="text-xs px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200"
              >
                Auto-generate
              </button>
            </div>
            <textarea
              value={task.welcomeMessage || ""}
              onChange={(e) => setField("welcomeMessage", e.target.value)}
              placeholder="A short welcome note to the new employee…"
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md"
          >
            <Check size={20} />
            {isEdit ? "Update Task" : "Add Task"}
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <X size={20} />
            Cancel
          </button>
        </div>
      </div>
    );
  };

  const FormField = ({ label, value, field, section, type = "text", options = [] }: any) => {
    const isSectionEditing = editingSections[section as keyof typeof editingSections];
    return (
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">{label}</label>
        {type === "select" ? (
          <select
            value={value}
            onChange={(e) => handleInputChange(section, field, e.target.value)}
            disabled={!isSectionEditing}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-60 text-slate-700"
          >
            {options.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => handleInputChange(section, field, e.target.value)}
            disabled={!isSectionEditing}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 disabled:opacity-60 text-slate-700"
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex">
        {/* Fixed Left Sidebar */}
        <aside className="fixed left-0 top-0 w-80 h-screen bg-slate-800/50 backdrop-blur-xl border-r border-slate-700/50 z-50 overflow-y-auto">
          <div className="h-screen overflow-y-auto">
            <div className="p-6">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">HR System</h1>
                <p className="text-sm text-slate-400">Employee Portal</p>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-2 mb-8">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      item.active
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                        : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                  </button>
                );
              })}
            </nav>

            {/* Profile Info Card */}
            <div className="bg-slate-700/30 rounded-2xl p-4 mb-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-800 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{profileInfo.name}</h3>
                  <p className="text-sm text-slate-300">{profileInfo.role}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-slate-300">
                  <Briefcase className="w-4 h-4" />
                  <span>{profileInfo.details}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <Phone className="w-4 h-4" />
                  <span>{profileInfo.contact}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <Mail className="w-4 h-4" />
                  <span>{profileInfo.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <Calendar className="w-4 h-4" />
                  <span>Hired: {profileInfo.hireDate}</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2">
              <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200">
                <Bell className="w-5 h-5" />
                <span className="font-medium">Alerts</span>
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">3</span>
              </button>
              <button
                onClick={() => setActiveTab("Settings")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === "Settings"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </button>
            </div>
          </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen ml-80">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1 max-w-2xl">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="search"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-slate-700 placeholder-slate-400"
                    />
                  </div>
                </div>

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
                      <p className="text-sm font-semibold text-slate-800">{profileInfo.name}</p>
                      <p className="text-xs text-slate-500">{profileInfo.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            {/* Content Area */}
            <div className="p-6">
              {/* Page Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">
                    {activeTab === "Settings" ? "Settings" : "My Info"}
                  </h1>
                  <p className="text-slate-600 mt-1">
                    {activeTab === "Settings"
                      ? "Manage your account preferences and system settings"
                      : "Manage your personal information and profile"
                    }
                  </p>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 mb-6">
                <div className="flex items-center space-x-1 p-2">
                  {activeTab === "Settings" ? (
                    // Settings tabs
                    settingsTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveSettingsTab(tab.name)}
                          className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                            activeSettingsTab === tab.name
                              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="font-medium">{tab.name}</span>
                        </button>
                      );
                    })
                  ) : (
                    // My Info tabs
                    myInfoTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.name)}
                          className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                            activeTab === tab.name
                              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="font-medium">{tab.name}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === "Personal" && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">Basic Information</h3>
                          <p className="text-slate-500">Personal details and identification</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSectionEdit('personal')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                          editingSections.personal
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                      >
                        <Edit className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {editingSections.personal ? "Save" : "Edit"}
                        </span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="First Name"
                        value={personalInfo.firstName}
                        field="firstName"
                        section="personal"
                      />
                      <FormField
                        label="Last Name"
                        value={personalInfo.lastName}
                        field="lastName"
                        section="personal"
                      />
                      <FormField
                        label="Gender"
                        value={personalInfo.gender}
                        field="gender"
                        section="personal"
                        type="select"
                        options={["Male", "Female", "Other"]}
                      />
                      <FormField
                        label="Nationality"
                        value={personalInfo.nationality}
                        field="nationality"
                        section="personal"
                      />
                      <FormField
                        label="ID Number"
                        value={personalInfo.idNumber}
                        field="idNumber"
                        section="personal"
                      />
                      <FormField
                        label="Birth Date"
                        value={personalInfo.birthDate}
                        field="birthDate"
                        section="personal"
                        type="date"
                      />
                      <FormField
                        label="RSSB Number"
                        value={personalInfo.rssbNumber}
                        field="rssbNumber"
                        section="personal"
                      />
                      <FormField
                        label="Marital Status"
                        value={personalInfo.maritalStatus}
                        field="maritalStatus"
                        section="personal"
                        type="select"
                        options={["Single", "Married", "Divorced", "Widow"]}
                      />
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-green-100 rounded-xl">
                          <MapPin className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">Address</h3>
                          <p className="text-slate-500">Location and contact address</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSectionEdit('address')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                          editingSections.address
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                      >
                        <Edit className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {editingSections.address ? "Save" : "Edit"}
                        </span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      <FormField
                        label="Country"
                        value={addressInfo.country}
                        field="country"
                        section="address"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          label="Province"
                          value={addressInfo.province}
                          field="province"
                          section="address"
                        />
                        <FormField
                          label="City"
                          value={addressInfo.city}
                          field="city"
                          section="address"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          label="Postal Code"
                          value={addressInfo.postalCode}
                          field="postalCode"
                          section="address"
                        />
                        <FormField
                          label="Street"
                          value={addressInfo.street}
                          field="street"
                          section="address"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-purple-100 rounded-xl">
                          <Phone className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">Contact</h3>
                          <p className="text-slate-500">Phone numbers and email addresses</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSectionEdit('contact')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                          editingSections.contact
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                      >
                        <Edit className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {editingSections.contact ? "Save" : "Edit"}
                        </span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          label="Mobile Phone"
                          value={contactInfo.mobilePhone}
                          field="mobilePhone"
                          section="contact"
                          type="tel"
                        />
                        <FormField
                          label="Work Phone"
                          value={contactInfo.workPhone}
                          field="workPhone"
                          section="contact"
                          type="tel"
                        />
                      </div>
                      <FormField
                        label="Work Email"
                        value={contactInfo.workEmail}
                        field="workEmail"
                        section="contact"
                        type="email"
                      />
                      <FormField
                        label="Home Email"
                        value={contactInfo.homeEmail}
                        field="homeEmail"
                        section="contact"
                        type="email"
                      />
                    </div>
                  </div>

                  {/* Education Information */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-orange-100 rounded-xl">
                          <GraduationCap className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">Education</h3>
                          <p className="text-slate-500">Academic background and qualifications</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSectionEdit('education')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                          editingSections.education
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                      >
                        <Edit className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {editingSections.education ? "Save" : "Edit"}
                        </span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      <FormField
                        label="College/Institution"
                        value={educationInfo.institution}
                        field="institution"
                        section="education"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          label="Degree"
                          value={educationInfo.degree}
                          field="degree"
                          section="education"
                        />
                        <FormField
                          label="Specialization"
                          value={educationInfo.specialization}
                          field="specialization"
                          section="education"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          label="Start Date"
                          value={educationInfo.startDate}
                          field="startDate"
                          section="education"
                          type="month"
                        />
                        <FormField
                          label="End Date"
                          value={educationInfo.endDate}
                          field="endDate"
                          section="education"
                          type="month"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6 xl:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-red-100 rounded-xl">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">Emergency Contact</h3>
                          <p className="text-slate-500">Person to contact in case of emergency</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSectionEdit('emergency')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                          editingSections.emergency
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                      >
                        <Edit className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {editingSections.emergency ? "Save" : "Edit"}
                        </span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      <FormField
                        label="First Name"
                        value={emergencyContact.firstName}
                        field="firstName"
                        section="emergency"
                      />
                      <FormField
                        label="Last Name"
                        value={emergencyContact.lastName}
                        field="lastName"
                        section="emergency"
                      />
                      <FormField
                        label="Contact"
                        value={emergencyContact.contact}
                        field="contact"
                        section="emergency"
                        type="tel"
                      />
                      <FormField
                        label="Email"
                        value={emergencyContact.email}
                        field="email"
                        section="emergency"
                        type="email"
                      />
                      <div className="md:col-span-2">
                        <FormField
                          label="Address"
                          value={emergencyContact.address}
                          field="address"
                          section="emergency"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Job Details Tab */}
              {activeTab === "Job Details" && (
                <div className="space-y-6">
                  {/* Job Card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <Briefcase className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">Job</h3>
                          <p className="text-slate-500">Employment dates and contract information</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSectionEdit('job')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                          editingSections.job
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                      >
                        <Edit className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {editingSections.job ? "Save" : "Edit"}
                        </span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      <FormField
                        label="Hire Date"
                        value={jobInfo.hireDate}
                        field="hireDate"
                        section="job"
                        type="date"
                      />
                      <FormField
                        label="Contract End Date"
                        value={jobInfo.contractEndDate}
                        field="contractEndDate"
                        section="job"
                        type="date"
                      />
                      <FormField
                        label="Probation End Date"
                        value={jobInfo.probationEndDate}
                        field="probationEndDate"
                        section="job"
                        type="date"
                      />
                    </div>
                  </div>

                  {/* Employment Status Card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-green-100 rounded-xl">
                          <UserCheck className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">Employment Status</h3>
                          <p className="text-slate-500">Status history and changes</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={addEmploymentStatus}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-200"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Add</span>
                        </button>
                        <button
                          onClick={() => toggleSectionEdit('employmentStatus')}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                            editingSections.employmentStatus
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          }`}
                        >
                          <Edit className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {editingSections.employmentStatus ? "Save" : "Edit"}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-2 font-semibold text-slate-700">Effective Date</th>
                            <th className="text-left py-3 px-2 font-semibold text-slate-700">Status</th>
                            <th className="text-left py-3 px-2 font-semibold text-slate-700">Comment</th>
                            <th className="text-left py-3 px-2 font-semibold text-slate-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employmentStatus.map((item) => (
                            <tr key={item.id} className="border-b border-slate-100">
                              <td className="py-3 px-2">
                                <input
                                  type="date"
                                  value={item.effectiveDate}
                                  onChange={(e) => updateEmploymentStatus(item.id, 'effectiveDate', e.target.value)}
                                  disabled={!editingSections.employmentStatus}
                                  className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                                />
                              </td>
                              <td className="py-3 px-2">
                                <input
                                  type="text"
                                  value={item.status}
                                  onChange={(e) => updateEmploymentStatus(item.id, 'status', e.target.value)}
                                  disabled={!editingSections.employmentStatus}
                                  className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                                />
                              </td>
                              <td className="py-3 px-2">
                                <input
                                  type="text"
                                  value={item.comment}
                                  onChange={(e) => updateEmploymentStatus(item.id, 'comment', e.target.value)}
                                  disabled={!editingSections.employmentStatus}
                                  className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                                />
                              </td>
                              <td className="py-3 px-2">
                                {editingSections.employmentStatus && (
                                  <button
                                    onClick={() => deleteEmploymentStatus(item.id)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <span className="text-xs">Delete</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Job Information Card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-purple-100 rounded-xl">
                          <Briefcase className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">Job Information</h3>
                          <p className="text-slate-500">Position details and reporting structure</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={addJobInformation}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-200"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Add</span>
                        </button>
                        <button
                          onClick={() => toggleSectionEdit('jobInformation')}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                            editingSections.jobInformation
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          }`}
                        >
                          <Edit className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {editingSections.jobInformation ? "Save" : "Edit"}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-2 font-semibold text-slate-700">Job Title</th>
                            <th className="text-left py-3 px-2 font-semibold text-slate-700">Location</th>
                            <th className="text-left py-3 px-2 font-semibold text-slate-700">Division</th>
                            <th className="text-left py-3 px-2 font-semibold text-slate-700">Department</th>
                            <th className="text-left py-3 px-2 font-semibold text-slate-700">Report To</th>
                            <th className="text-left py-3 px-2 font-semibold text-slate-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobInformation.map((item) => (
                            <tr key={item.id} className="border-b border-slate-100">
                              <td className="py-3 px-2">
                                <input
                                  type="text"
                                  value={item.jobTitle}
                                  onChange={(e) => updateJobInformation(item.id, 'jobTitle', e.target.value)}
                                  disabled={!editingSections.jobInformation}
                                  className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                                />
                              </td>
                              <td className="py-3 px-2">
                                <input
                                  type="text"
                                  value={item.location}
                                  onChange={(e) => updateJobInformation(item.id, 'location', e.target.value)}
                                  disabled={!editingSections.jobInformation}
                                  className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                                />
                              </td>
                              <td className="py-3 px-2">
                                <input
                                  type="text"
                                  value={item.division}
                                  onChange={(e) => updateJobInformation(item.id, 'division', e.target.value)}
                                  disabled={!editingSections.jobInformation}
                                  className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                                />
                              </td>
                              <td className="py-3 px-2">
                                <input
                                  type="text"
                                  value={item.department}
                                  onChange={(e) => updateJobInformation(item.id, 'department', e.target.value)}
                                  disabled={!editingSections.jobInformation}
                                  className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                                />
                              </td>
                              <td className="py-3 px-2">
                                <input
                                  type="text"
                                  value={item.reportTo}
                                  onChange={(e) => updateJobInformation(item.id, 'reportTo', e.target.value)}
                                  disabled={!editingSections.jobInformation}
                                  className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                                />
                              </td>
                              <td className="py-3 px-2">
                                {editingSections.jobInformation && (
                                  <button
                                    onClick={() => deleteJobInformation(item.id)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <span className="text-xs">Delete</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bank Details Card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-orange-100 rounded-xl">
                          <Home className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">Bank Details</h3>
                          <p className="text-slate-500">Banking information for payroll</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={addBankDetails}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-200"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Add</span>
                        </button>
                        <button
                          onClick={() => toggleSectionEdit('bankDetails')}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                            editingSections.bankDetails
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          }`}
                        >
                          <Edit className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {editingSections.bankDetails ? "Save" : "Edit"}
                          </span>
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-2 font-semibold text-slate-700">Bank Name</th>
                            <th className="text-left py-3 px-2 font-semibold text-slate-700">Name on Account</th>
                            <th className="text-left py-3 px-2 font-semibold text-slate-700">Account Number</th>
                            <th className="text-left py-3 px-2 font-semibold text-slate-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bankDetails.map((item) => (
                            <tr key={item.id} className="border-b border-slate-100">
                              <td className="py-3 px-2">
                                <input
                                  type="text"
                                  value={item.bankName}
                                  onChange={(e) => updateBankDetails(item.id, 'bankName', e.target.value)}
                                  disabled={!editingSections.bankDetails}
                                  className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                                />
                              </td>
                              <td className="py-3 px-2">
                                <input
                                  type="text"
                                  value={item.nameOnAccount}
                                  onChange={(e) => updateBankDetails(item.id, 'nameOnAccount', e.target.value)}
                                  disabled={!editingSections.bankDetails}
                                  className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                                />
                              </td>
                              <td className="py-3 px-2">
                                <input
                                  type="text"
                                  value={item.accountNumber}
                                  onChange={(e) => updateBankDetails(item.id, 'accountNumber', e.target.value)}
                                  disabled={!editingSections.bankDetails}
                                  className="w-full px-2 py-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
                                />
                              </td>
                              <td className="py-3 px-2">
                                {editingSections.bankDetails && (
                                  <button
                                    onClick={() => deleteBankDetails(item.id)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <span className="text-xs">Delete</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === "Documents" && (
                <div className="space-y-6">
                  {/* Toolbar */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">Document Management</h3>
                          <p className="text-slate-500">Organize and manage your documents</p>
                        </div>
                      </div>
                    </div>

                    {/* Upload Status */}
                    {uploadStatus && (
                      <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-lg text-green-800 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                          <span>{uploadStatus}</span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons and Search */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setShowCreateFolderModal(true)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-200"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Create Folder</span>
                        </button>

                        <label className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-all duration-200 cursor-pointer">
                          <Upload className="w-4 h-4" />
                          <span className="text-sm font-medium">Upload File</span>
                          <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = e.target.files;
                              if (files && files.length > 0) {
                                // Upload to the first available folder
                                const targetFolderId = folders[0]?.id;
                                if (targetFolderId) {
                                  handleMultipleFileUpload(targetFolderId, files);
                                } else {
                                  alert('Please create a folder first to upload files.');
                                }
                              }
                            }}
                          />
                        </label>

                        <button className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-all duration-200">
                          <Download className="w-4 h-4" />
                          <span className="text-sm font-medium">Download All</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-4 ml-4">
                        {/* View Toggle */}
                        <div className="flex items-center bg-slate-100 rounded-xl p-1">
                          <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                              viewMode === 'list'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-800'
                            }`}
                          >
                            <List className="w-4 h-4" />
                            <span className="text-sm font-medium">List</span>
                          </button>
                          <button
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                              viewMode === 'grid'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-800'
                            }`}
                          >
                            <Grid3X3 className="w-4 h-4" />
                            <span className="text-sm font-medium">Grid</span>
                          </button>
                        </div>

                        {/* Search */}
                        <div className="flex-1 max-w-md">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search documents..."
                              value={documentSearchQuery}
                              onChange={(e) => setDocumentSearchQuery(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-slate-700 placeholder-slate-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Folders Card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    {viewMode === 'list' ? (
                      /* List View */
                      <div className="space-y-4">
                        {filteredFolders.map((folder) => (
                          <div key={folder.id} className="border border-slate-200 rounded-xl overflow-hidden">
                            {/* Folder Header */}
                            <div
                              className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                              onClick={() => toggleFolder(folder.id)}
                            >
                              <div className="flex items-center space-x-3">
                                {folder.isOpen ? (
                                  <FolderOpen className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <Folder className="w-5 h-5 text-blue-600" />
                                )}
                                <span className="font-medium text-slate-800">{folder.name}</span>
                                <span className="text-sm text-slate-500">({folder.files.length} files)</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <label className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 cursor-pointer text-xs transition-colors">
                                  <Upload className="w-3 h-3" />
                                  <span>Add Files</span>
                                  <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                      const files = e.target.files;
                                      if (files && files.length > 0) {
                                        handleMultipleFileUpload(folder.id, files);
                                      }
                                    }}
                                  />
                                </label>
                                <ChevronRight
                                  className={`w-4 h-4 text-slate-400 transition-transform ${
                                    folder.isOpen ? 'rotate-90' : ''
                                  }`}
                                />
                              </div>
                            </div>

                            {/* Folder Contents */}
                            {folder.isOpen && (
                              <div className="border-t border-slate-200">
                                {folder.files.length === 0 ? (
                                  <div className="p-6 text-center text-slate-500">
                                    <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm mb-3">No files in this folder yet</p>
                                    <div className="flex items-center justify-center space-x-2">
                                      <label className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 cursor-pointer text-sm transition-colors">
                                        <Upload className="w-4 h-4" />
                                        <span>Upload Files</span>
                                        <input
                                          type="file"
                                          multiple
                                          className="hidden"
                                          onChange={(e) => {
                                            const files = e.target.files;
                                            if (files && files.length > 0) {
                                              handleMultipleFileUpload(folder.id, files);
                                            }
                                          }}
                                        />
                                      </label>
                                      <span className="text-xs text-slate-400">or drag & drop</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="divide-y divide-slate-100">
                                    {folder.files.map((file) => (
                                      <div key={file.id} className="flex items-center justify-between p-3 hover:bg-slate-50">
                                        <div className="flex items-center space-x-3">
                                          <File className="w-4 h-4 text-slate-400" />
                                          <div>
                                            <p className="text-sm font-medium text-slate-800">{file.name}</p>
                                            <p className="text-xs text-slate-500">
                                              {file.size} • Uploaded {file.uploadedAt}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <button
                                            onClick={() => downloadFile(file.name)}
                                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                          >
                                            <Download className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => deleteFile(folder.id, file.id)}
                                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* Grid View */
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredFolders.map((folder) => (
                          <div key={folder.id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                            {/* Folder Header */}
                            <div
                              className="p-4 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                              onClick={() => toggleFolder(folder.id)}
                            >
                              <div className="flex flex-col items-center text-center space-y-3">
                                {folder.isOpen ? (
                                  <FolderOpen className="w-12 h-12 text-blue-600" />
                                ) : (
                                  <Folder className="w-12 h-12 text-blue-600" />
                                )}
                                <div>
                                  <h3 className="font-medium text-slate-800 text-sm">{folder.name}</h3>
                                  <p className="text-xs text-slate-500">{folder.files.length} files</p>
                                </div>
                              </div>
                            </div>

                            {/* Grid Actions */}
                            <div className="p-3 bg-white border-t border-slate-100">
                              <div className="flex items-center justify-center space-x-2">
                                <label className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 cursor-pointer text-xs transition-colors">
                                  <Upload className="w-3 h-3" />
                                  <span>Add Files</span>
                                  <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                      const files = e.target.files;
                                      if (files && files.length > 0) {
                                        handleMultipleFileUpload(folder.id, files);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            </div>

                            {/* Folder Contents in Grid */}
                            {folder.isOpen && folder.files.length > 0 && (
                              <div className="border-t border-slate-200 max-h-48 overflow-y-auto">
                                <div className="p-2 space-y-1">
                                  {folder.files.slice(0, 3).map((file) => (
                                    <div key={file.id} className="flex items-center justify-between p-2 bg-slate-50 rounded text-xs">
                                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                                        <File className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                        <span className="truncate text-slate-700">{file.name}</span>
                                      </div>
                                      <div className="flex items-center space-x-1 ml-2">
                                        <button
                                          onClick={() => downloadFile(file.name)}
                                          className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                        >
                                          <Download className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => deleteFile(folder.id, file.id)}
                                          className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  {folder.files.length > 3 && (
                                    <p className="text-xs text-slate-500 text-center py-1">
                                      +{folder.files.length - 3} more files
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Empty Folder in Grid */}
                            {folder.isOpen && folder.files.length === 0 && (
                              <div className="border-t border-slate-200 p-4 text-center text-slate-500">
                                <Upload className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                                <p className="text-xs mb-2">Empty folder</p>
                                <label className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded cursor-pointer text-xs transition-colors">
                                  <Upload className="w-3 h-3" />
                                  <span>Upload</span>
                                  <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                      const files = e.target.files;
                                      if (files && files.length > 0) {
                                        handleMultipleFileUpload(folder.id, files);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {filteredFolders.length === 0 && (
                      <div className="text-center py-12">
                        <Folder className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No folders found</h3>
                        <p className="text-slate-500 mb-4">
                          {documentSearchQuery ? 'Try adjusting your search terms' : 'Create your first folder to get started'}
                        </p>
                        {!documentSearchQuery && (
                          <button
                            onClick={() => setShowCreateFolderModal(true)}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>Create Folder</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Time Off Tab */}
              {activeTab === "Time Off" && (
                <div className="space-y-6">
                  {/* Assigned Leaves Card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-800">Assigned Leaves</h3>
                        <p className="text-slate-500">Your allocated leave entitlements</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {assignedLeaves.map((leave) => (
                        <div key={leave.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-slate-800">{leave.type}</h4>
                            <div className="text-right">
                              <p className="text-sm text-slate-500">Balance</p>
                              <p className="text-lg font-bold text-blue-600">{leave.balance} days</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Total:</span>
                              <span className="font-medium">{leave.days} days</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-600">Used:</span>
                              <span className="font-medium text-red-600">{leave.used} days</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leave History Card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-green-100 rounded-xl">
                          <Clock className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">Leave History</h3>
                          <p className="text-slate-500">Track your leave usage and balances</p>
                        </div>
                      </div>
                    </div>

                    {/* Search and Filter */}
                    <div className="flex items-center space-x-4 mb-6">
                      <div className="flex-1 max-w-xs">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
                        <select
                          value={leaveSearchType}
                          onChange={(e) => setLeaveSearchType(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                        >
                          <option value="">All Types</option>
                          <option value="Annual Leave">Annual Leave</option>
                          <option value="Maternity Leave">Maternity Leave</option>
                          <option value="Paternity Leave">Paternity Leave</option>
                          <option value="Short-term Sick Leave">Short-term Sick Leave</option>
                          <option value="Long-term Sick Leave">Long-term Sick Leave</option>
                          <option value="Study Leave">Study Leave</option>
                        </select>
                      </div>
                      <div className="flex-1 max-w-xs">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
                        <select
                          value={leaveSearchYear}
                          onChange={(e) => setLeaveSearchYear(e.target.value)}
                          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                        >
                          <option value="2024">2024</option>
                          <option value="2023">2023</option>
                          <option value="2022">2022</option>
                        </select>
                      </div>
                    </div>

                    {/* Leave History Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Description</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Used Days</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Earned Days</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Balance</th>
                            <th className="text-left py-3 px-4 font-semibold text-slate-700">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaveHistory
                            .filter(item => {
                              const matchesType = !leaveSearchType || item.description === leaveSearchType;
                              const matchesYear = !leaveSearchYear || item.date.startsWith(leaveSearchYear);
                              return matchesType && matchesYear;
                            })
                            .map((item) => (
                              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                                  <td className="py-3 px-4 text-slate-800">{item.date}</td>
                                  <td className="py-3 px-4 text-slate-800">{item.description}</td>
                                  <td className="py-3 px-4 text-red-600 font-medium">{item.usedDays}</td>
                                  <td className="py-3 px-4 text-green-600 font-medium">{item.earnedDays}</td>
                                  <td className="py-3 px-4 text-blue-600 font-medium">{item.balance}</td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      item.status === 'Approved'
                                        ? 'bg-green-100 text-green-800'
                                        : item.status === 'Pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {item.status}
                                    </span>
                                  </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-slate-300 bg-slate-50">
                            <td colSpan={5} className="py-3 px-4 font-semibold text-slate-800 text-right">
                              Total Balance:
                            </td>
                            <td className="py-3 px-4 font-bold text-blue-600">
                              {leaveHistory.length > 0 ? leaveHistory[leaveHistory.length - 1].balance : 0} days
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {leaveHistory.filter(item => {
                      const matchesType = !leaveSearchType || item.description === leaveSearchType;
                      const matchesYear = !leaveSearchYear || item.date.startsWith(leaveSearchYear);
                      return matchesType && matchesYear;
                    }).length === 0 && (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No leave records found for the selected filters.</p>
                      </div>
                    )}
                  </div>

                  {/* Request Leave Card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-orange-100 rounded-xl">
                          <PlusCircle className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">Request Leave</h3>
                          <p className="text-slate-500">Submit a new leave request</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowRequestForm(!showRequestForm)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-200"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {showRequestForm ? "Cancel" : "New Request"}
                        </span>
                      </button>
                    </div>

                    {showRequestForm && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Leave Type *
                            </label>
                            <select
                              value={leaveRequest.leaveType}
                              onChange={(e) => handleLeaveRequestChange('leaveType', e.target.value)}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                            >
                              <option value="">Select leave type</option>
                              <option value="Annual Leave">Annual Leave</option>
                              <option value="Maternity Leave">Maternity Leave</option>
                              <option value="Paternity Leave">Paternity Leave</option>
                              <option value="Short-term Sick Leave">Short-term Sick Leave</option>
                              <option value="Long-term Sick Leave">Long-term Sick Leave</option>
                              <option value="Study Leave">Study Leave</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Number of Days *
                            </label>
                            <input
                              type="number"
                              value={leaveRequest.days}
                              onChange={(e) => handleLeaveRequestChange('days', e.target.value)}
                              min="1"
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                              placeholder="Enter number of days"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Start Date *
                            </label>
                            <input
                              type="date"
                              value={leaveRequest.startDate}
                              onChange={(e) => handleLeaveRequestChange('startDate', e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              End Date *
                            </label>
                            <input
                              type="date"
                              value={leaveRequest.endDate}
                              onChange={(e) => handleLeaveRequestChange('endDate', e.target.value)}
                              min={leaveRequest.startDate || new Date().toISOString().split('T')[0]}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Reason
                          </label>
                          <textarea
                            value={leaveRequest.reason}
                            onChange={(e) => handleLeaveRequestChange('reason', e.target.value)}
                            placeholder="Please provide a reason for your leave request..."
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700 resize-none"
                          />
                        </div>

                        <div className="flex items-center justify-end space-x-3 pt-4">
                          <button
                            onClick={() => setShowRequestForm(false)}
                            className="px-6 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={submitLeaveRequest}
                            disabled={!leaveRequest.leaveType || !leaveRequest.startDate || !leaveRequest.endDate}
                            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Submit Request
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Performance Tab */}
              {activeTab === "Performance" && (
                <div className="space-y-6">
                  {/* Goals Card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <Target className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">Goals</h3>
                          <p className="text-slate-500">Track your performance goals and objectives</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowGoalModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-200"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Create a new goal</span>
                      </button>
                    </div>


                    {/* Goals Grid */}
                    {selectedGoal === null ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {goals.map((goal) => {
                          const progress = calculateProgress(goal);
                          return (
                            <div
                              key={goal.id}
                              className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300 relative group"
                            >
                              {/* Action Menu */}
                              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex space-x-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      editGoal(goal.id);
                                    }}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit goal"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteGoal(goal.id);
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete goal"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="mb-4 cursor-pointer" onClick={() => setSelectedGoal(goal.id)}>
                                <h4 className="font-semibold text-slate-800 mb-2 line-clamp-2">{goal.objective}</h4>
                                <div className="flex items-center space-x-2 text-sm text-slate-500 mb-3">
                                  <Calendar className="w-4 h-4" />
                                  <span>Due: {goal.dueDate}</span>
                                </div>
                              </div>

                              {/* Progress Bar */}
                              <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-slate-700">Progress</span>
                                  <span className="text-sm font-bold text-slate-800">
                                    {progress === 100 ? 'Complete' : `${progress}%`}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Status Badge */}
                              <div className="flex items-center justify-between">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  goal.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                  goal.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {goal.status}
                                </span>
                                <div className="text-xs text-slate-500">
                                  {goal.milestones.length} milestone{goal.milestones.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {goals.length === 0 && (
                          <div className="col-span-full text-center py-12">
                            <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-800 mb-2">No goals yet</h3>
                            <p className="text-slate-500 mb-4">Create your first performance goal to get started.</p>
                            <button
                              onClick={() => setShowGoalModal(true)}
                              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                            >
                              <PlusCircle className="w-4 h-4" />
                              <span>Create Goal</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Milestone Detail View */
                      (() => {
                        const goal = goals.find(g => g.id === selectedGoal);
                        if (!goal) return null;

                        return (
                          <div className="space-y-6">
                            {/* Back Button and Goal Header */}
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => setSelectedGoal(null)}
                                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <ChevronRight className="w-4 h-4 rotate-180" />
                                <span className="text-sm font-medium">Back to Goals</span>
                              </button>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                              <div className="mb-6">
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">{goal.objective}</h3>
                                <p className="text-slate-600 mb-4">{goal.description}</p>
                                <div className="flex items-center space-x-6 text-sm text-slate-500">
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Due: {goal.dueDate}</span>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    goal.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                    goal.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {goal.status}
                                  </span>
                                </div>
                              </div>

                              {/* Progress Overview */}
                              <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-slate-800">Overall Progress</h4>
                                  <span className="text-lg font-bold text-slate-800">
                                    {calculateProgress(goal) === 100 ? 'Complete' : `${calculateProgress(goal)}%`}
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-3">
                                  <div
                                    className={`h-3 rounded-full transition-all duration-300 ${
                                      calculateProgress(goal) === 100 ? 'bg-green-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${calculateProgress(goal)}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Milestones */}
                              <div>
                                <h4 className="font-semibold text-slate-800 mb-4">Milestones</h4>
                                <div className="space-y-4">
                                  {goal.milestones.map((milestone) => (
                                    <div key={milestone.id} className="border border-slate-200 rounded-xl p-4">
                                      <div className="flex items-start space-x-3">
                                        <input
                                          type="checkbox"
                                          checked={milestone.completed}
                                          onChange={() => toggleMilestone(goal.id, milestone.id)}
                                          className="mt-1 w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                                        />
                                        <div className="flex-1">
                                          <h5 className={`font-medium ${milestone.completed ? 'line-through text-slate-500' : 'text-slate-800'}`}>
                                            {milestone.title}
                                          </h5>
                                          {milestone.comment && (
                                            <p className="text-sm text-slate-600 mt-1">{milestone.comment}</p>
                                          )}
                                          <div className="mt-3">
                                            <textarea
                                              placeholder="Add a comment..."
                                              value={milestone.comment || ''}
                                              onChange={(e) => updateMilestoneComment(goal.id, milestone.id, e.target.value)}
                                              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                              rows={2}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Files */}
                              {goal.files.length > 0 && (
                                <div className="mt-6">
                                  <h4 className="font-semibold text-slate-800 mb-4">Attachments</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {goal.files.map((file, index) => (
                                      <div key={index} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                                        <File className="w-5 h-5 text-slate-600" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
                                          <p className="text-xs text-slate-500">
                                            {(file.size / (1024 * 1024)).toFixed(1)} MB
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
              )}


              {/* Onboarding Tab */}
              {activeTab === "Onboarding" && (
                <div className="space-y-6">
                  {/* Header with Stats */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <UserCheck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">Onboarding Management</h3>
                          <p className="text-slate-500">Manage employee onboarding tasks efficiently</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center px-6 py-3 rounded-lg bg-green-50">
                          <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                          <div className="text-sm text-green-700">Completed</div>
                        </div>
                        <div className="text-center px-6 py-3 rounded-lg bg-yellow-50">
                          <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                          <div className="text-sm text-yellow-700">Pending</div>
                        </div>
                      </div>
                    </div>

                    {!showAddTask && !editingTask && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setShowAddTask(true)}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md"
                        >
                          <Plus size={20} />
                          Add New Task
                        </button>
                        {/* Quick add from templates */}
                        {templates.map(t => (
                          <button
                            key={`quick-${t.label}`}
                            onClick={() => {
                              const pre = t.build();
                              const base = {
                                title: "",
                                assignedTo: "",
                                startDate: "",
                                dueDate: "",
                                location: "",
                                contacts: [{ name: "", role: "", phone: "", email: "" }],
                                files: [],
                                checklist: [],
                                welcomeMessage: "",
                                comments: [],
                                status: "pending"
                              };
                              setShowAddTask(true);
                              setNewTask({
                                ...base,
                                title: pre.title,
                                checklist: pre.checklist,
                                files: pre.files
                              });
                            }}
                            className="text-sm px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200"
                          >
                            Quick add: {t.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {showAddTask && (
                    <TaskForm
                      task={newTask}
                      onChange={setNewTask}
                      onSave={handleAddTask}
                      onCancel={() => setShowAddTask(false)}
                    />
                  )}

                  {editingTask && (
                    <TaskForm
                      task={editingTask}
                      onChange={setEditingTask}
                      onSave={handleUpdateTask}
                      onCancel={() => setEditingTask(null)}
                      isEdit={true}
                    />
                  )}

                  <div className="space-y-4">
                    {onboardingTasks.length === 0 ? (
                      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                        <div className="text-gray-400 mb-4">
                          <Briefcase size={64} className="mx-auto" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No tasks yet</h3>
                        <p className="text-gray-500">Create your first onboarding task to get started</p>
                      </div>
                    ) : (
                      onboardingTasks.map((task: any) => <TaskCard key={task.id} task={task} />)
                    )}
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === "Settings" && (
                <div className="space-y-6">
                  {/* Settings Header */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Settings className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-slate-800">Settings</h3>
                        <p className="text-slate-500">Manage your account preferences and system settings</p>
                      </div>
                    </div>
                  </div>

                  {/* Account Settings */}
                  {activeSettingsTab === "Account" && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-3 bg-green-100 rounded-xl">
                          <User className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">Account Settings</h3>
                          <p className="text-slate-500">Update your profile and account information</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Display Name</label>
                            <input
                              type="text"
                              defaultValue="Lionel Ishimwe"
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                            <input
                              type="email"
                              defaultValue="lionel.ishimwe@company.com"
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
                          <textarea
                            rows={3}
                            placeholder="Tell us about yourself..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700 resize-none"
                          />
                        </div>

                        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                          <button className="px-6 py-2 text-slate-600 hover:text-slate-800 transition-colors">
                            Cancel
                          </button>
                          <button className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notification Settings */}
                  {activeSettingsTab === "Notifications" && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-3 bg-purple-100 rounded-xl">
                          <Bell className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">Notification Preferences</h3>
                          <p className="text-slate-500">Choose how you want to be notified</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <div>
                            <h4 className="font-medium text-slate-800">Email Notifications</h4>
                            <p className="text-sm text-slate-600">Receive notifications via email</p>
                          </div>
                          <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6"></span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <div>
                            <h4 className="font-medium text-slate-800">Push Notifications</h4>
                            <p className="text-sm text-slate-600">Receive push notifications in browser</p>
                          </div>
                          <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-300">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1"></span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                          <div>
                            <h4 className="font-medium text-slate-800">Leave Request Updates</h4>
                            <p className="text-sm text-slate-600">Get notified about leave request status changes</p>
                          </div>
                          <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                            <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6"></span>
                          </button>
                        </div>

                        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                          <button className="px-6 py-2 text-slate-600 hover:text-slate-800 transition-colors">
                            Cancel
                          </button>
                          <button className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Security Settings */}
                  {activeSettingsTab === "Security" && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-3 bg-red-100 rounded-xl">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">Security</h3>
                          <p className="text-slate-500">Manage your password and security settings</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                          <input
                            type="password"
                            placeholder="Enter current password"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                            <input
                              type="password"
                              placeholder="Enter new password"
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                            <input
                              type="password"
                              placeholder="Confirm new password"
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                          <button className="px-6 py-2 text-slate-600 hover:text-slate-800 transition-colors">
                            Cancel
                          </button>
                          <button className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                            Update Password
                          </button>
                        </div>

                        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                          <button className="px-6 py-2 text-slate-600 hover:text-slate-800 transition-colors">
                            Cancel
                          </button>
                          <button className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Onboarding Settings */}
                  {activeSettingsTab === "Onboarding" && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-3 bg-blue-100 rounded-xl">
                          <UserCheck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">Onboarding Settings</h3>
                          <p className="text-slate-500">Configure onboarding preferences and templates</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* All Templates */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-slate-800">Onboarding Templates</h4>
                            <button
                              onClick={() => setShowAddTemplateModal(true)}
                              className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-200"
                            >
                              <PlusCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">Add Template</span>
                            </button>
                          </div>
                          <div className="space-y-3">
                            {availableTemplates.map((template) => (
                              <div key={template.id} className={`flex items-center justify-between p-4 rounded-xl border ${
                                template.isDefault ? 'bg-slate-50 border-slate-200' : 'bg-blue-50 border-blue-200'
                              }`}>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h5 className="font-medium text-slate-800">{template.label}</h5>
                                    {template.isDefault && (
                                      <span className="px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded-full">Default</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-slate-600">{template.title}</p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    {template.checklist.length} checklist item{template.checklist.length !== 1 ? 's' : ''}
                                    {template.files.length > 0 && ` • ${template.files.length} file${template.files.length !== 1 ? 's' : ''}`}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => deleteTemplate(template.id)}
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete template"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => toggleTemplateEnabled(template.id)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                      template.enabled !== false ? 'bg-blue-600' : 'bg-slate-300'
                                    }`}
                                    title={template.enabled !== false ? 'Enabled' : 'Disabled'}
                                  >
                                    <span
                                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        template.enabled !== false ? 'translate-x-6' : 'translate-x-1'
                                      }`}
                                    />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Auto-assignment Settings */}
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-4">Auto-assignment</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                              <div>
                                <h5 className="font-medium text-slate-800">Auto-assign Welcome Message</h5>
                                <p className="text-sm text-slate-600">Automatically generate welcome messages for new tasks</p>
                              </div>
                              <button
                                onClick={() => toggleOnboardingSetting('autoAssignWelcomeMessage')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  onboardingSettings.autoAssignWelcomeMessage ? 'bg-blue-600' : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    onboardingSettings.autoAssignWelcomeMessage ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                              <div>
                                <h5 className="font-medium text-slate-800">Auto-assign HR Contact</h5>
                                <p className="text-sm text-slate-600">Automatically add HR manager as contact for new tasks</p>
                              </div>
                              <button
                                onClick={() => toggleOnboardingSetting('autoAssignHRContact')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  onboardingSettings.autoAssignHRContact ? 'bg-blue-600' : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    onboardingSettings.autoAssignHRContact ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Notification Settings */}
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-4">Notifications</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                              <div>
                                <h5 className="font-medium text-slate-800">Task Completion Alerts</h5>
                                <p className="text-sm text-slate-600">Get notified when onboarding tasks are completed</p>
                              </div>
                              <button
                                onClick={() => toggleOnboardingSetting('taskCompletionAlerts')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  onboardingSettings.taskCompletionAlerts ? 'bg-blue-600' : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    onboardingSettings.taskCompletionAlerts ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                              <div>
                                <h5 className="font-medium text-slate-800">Overdue Task Reminders</h5>
                                <p className="text-sm text-slate-600">Receive reminders for overdue onboarding tasks</p>
                              </div>
                              <button
                                onClick={() => toggleOnboardingSetting('overdueTaskReminders')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  onboardingSettings.overdueTaskReminders ? 'bg-blue-600' : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    onboardingSettings.overdueTaskReminders ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Leave Management Settings */}
                  {activeSettingsTab === "Leave Management" && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-green-100 rounded-xl">
                            <Calendar className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-slate-800">Leave Management Settings</h3>
                            <p className="text-slate-500">Configure client-specific leave policies and approval workflows</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowAddClientModal(true)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-200"
                        >
                          <PlusCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Add Client</span>
                        </button>
                      </div>

                      <div className="space-y-6">
                        {/* Client Selection */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-slate-800">Client Management</h4>
                            <span className="text-sm text-slate-500">{clients.length} client{clients.length !== 1 ? 's' : ''} configured</span>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Select Client</label>
                              <select
                                value={selectedClientId}
                                onChange={(e) => setSelectedClientId(Number(e.target.value))}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                              >
                                {clients.map(client => (
                                  <option key={client.id} value={client.id}>
                                    {client.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-end space-x-2">
                              <button
                                onClick={() => setEditingClientId(editingClientId === selectedClientId ? null : selectedClientId)}
                                className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 ${
                                  editingClientId === selectedClientId
                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                }`}
                              >
                                <Edit className="w-4 h-4" />
                                <span className="text-sm font-medium">
                                  {editingClientId === selectedClientId ? "Save Changes" : "Edit Policies"}
                                </span>
                              </button>
                              <button
                                onClick={() => deleteClient(selectedClientId)}
                                disabled={clients.length <= 1}
                                className="flex items-center space-x-2 px-4 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-sm font-medium">Delete Client</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Client-specific Leave Policies */}
                        {(() => {
                          const selectedClient = getSelectedClient();
                          if (!selectedClient) return null;
                          
                          return (
                            <div>
                              <h4 className="font-semibold text-slate-800 mb-4">
                                Leave Policies for {selectedClient.name}
                              </h4>
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Annual Leave Days</label>
                                    <input
                                      type="number"
                                      value={selectedClient.annualLeave}
                                      onChange={(e) => updateClient(selectedClient.id, 'annualLeave', Number(e.target.value))}
                                      disabled={editingClientId !== selectedClient.id}
                                      min="0"
                                      max="50"
                                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700 disabled:opacity-60"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Sick Leave Days</label>
                                    <input
                                      type="number"
                                      value={selectedClient.sickLeave}
                                      onChange={(e) => updateClient(selectedClient.id, 'sickLeave', Number(e.target.value))}
                                      disabled={editingClientId !== selectedClient.id}
                                      min="0"
                                      max="30"
                                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700 disabled:opacity-60"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Personal Leave Days</label>
                                    <input
                                      type="number"
                                      value={selectedClient.personalLeave}
                                      onChange={(e) => updateClient(selectedClient.id, 'personalLeave', Number(e.target.value))}
                                      disabled={editingClientId !== selectedClient.id}
                                      min="0"
                                      max="15"
                                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700 disabled:opacity-60"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Maternity Leave Days</label>
                                    <input
                                      type="number"
                                      value={selectedClient.maternityLeave}
                                      onChange={(e) => updateClient(selectedClient.id, 'maternityLeave', Number(e.target.value))}
                                      disabled={editingClientId !== selectedClient.id}
                                      min="0"
                                      max="180"
                                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700 disabled:opacity-60"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Paternity Leave Days</label>
                                    <input
                                      type="number"
                                      value={selectedClient.paternityLeave}
                                      onChange={(e) => updateClient(selectedClient.id, 'paternityLeave', Number(e.target.value))}
                                      disabled={editingClientId !== selectedClient.id}
                                      min="0"
                                      max="30"
                                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700 disabled:opacity-60"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Study Leave Days</label>
                                    <input
                                      type="number"
                                      value={selectedClient.studyLeave}
                                      onChange={(e) => updateClient(selectedClient.id, 'studyLeave', Number(e.target.value))}
                                      disabled={editingClientId !== selectedClient.id}
                                      min="0"
                                      max="20"
                                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700 disabled:opacity-60"
                                    />
                                  </div>
                                </div>
                                {editingClientId !== selectedClient.id && (
                                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                    <p className="text-sm text-blue-800 font-medium">
                                      🔒 Policies are locked. Click "Edit Policies" to make changes.
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">
                                      Client created on: {new Date(selectedClient.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Approval Workflow */}
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-4">Approval Workflow</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                              <div>
                                <h5 className="font-medium text-slate-800">Require Manager Approval</h5>
                                <p className="text-sm text-slate-600">All leave requests must be approved by direct manager</p>
                              </div>
                              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6"></span>
                              </button>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                              <div>
                                <h5 className="font-medium text-slate-800">HR Review for Extended Leave</h5>
                                <p className="text-sm text-slate-600">Leave requests over 5 days require HR review</p>
                              </div>
                              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6"></span>
                              </button>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                              <div>
                                <h5 className="font-medium text-slate-800">Auto-approve Annual Leave</h5>
                                <p className="text-sm text-slate-600">Automatically approve annual leave if sufficient balance</p>
                              </div>
                              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-300">
                                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1"></span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Notification Settings */}
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-4">Notifications</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                              <div>
                                <h5 className="font-medium text-slate-800">Email Notifications</h5>
                                <p className="text-sm text-slate-600">Send email notifications for leave requests and approvals</p>
                              </div>
                              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6"></span>
                              </button>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                              <div>
                                <h5 className="font-medium text-slate-800">Manager Notifications</h5>
                                <p className="text-sm text-slate-600">Notify managers of pending leave requests</p>
                              </div>
                              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6"></span>
                              </button>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                              <div>
                                <h5 className="font-medium text-slate-800">Reminder Notifications</h5>
                                <p className="text-sm text-slate-600">Send reminders for upcoming leave and pending approvals</p>
                              </div>
                              <button className="relative inline-flex h-6 w-11 items-centers rounded-full bg-blue-600">
                                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6"></span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                          <button className="px-6 py-2 text-slate-600 hover:text-slate-800 transition-colors">
                            Reset to Defaults
                          </button>
                          <button className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                            Save Settings
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* People Settings */}
                  {activeSettingsTab === "People" && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-blue-100 rounded-xl">
                            <Users className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-slate-800">People Directory</h3>
                            <p className="text-slate-500">View and access employee profiles and dashboards</p>
                          </div>
                        </div>
                        <div className="text-sm text-slate-500">
                          {getStaffList().length} employees
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getStaffList().map((staff: any) => (
                          <div
                            key={staff.id}
                            className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer hover:border-blue-300"
                            onClick={() => {
                              setSelectedStaffId(staff.id);
                              setShowStaffDashboard(true);
                              setStaffDashboardTab("dashboard");
                            }}
                          >
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-lg">
                                  {staff.name.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-800">{staff.name}</h4>
                                <p className="text-sm text-slate-600">{staff.position}</p>
                              </div>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-600">Department:</span>
                                <span className="text-slate-800 font-medium">{staff.department}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Status:</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  staff.status === 'Active'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {staff.status}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Hire Date:</span>
                                <span className="text-slate-800">{staff.hireDate}</span>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <button className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium">
                                <Eye className="w-4 h-4" />
                                <span>View Dashboard</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {getStaffList().length === 0 && (
                        <div className="text-center py-12">
                          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-slate-800 mb-2">No employees found</h3>
                          <p className="text-slate-500">Create employees in the People section to view them here.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Placeholder for other tabs */}
              {activeTab !== "Personal" && activeTab !== "Job Details" && activeTab !== "Documents" && activeTab !== "Time Off" && activeTab !== "Performance" && activeTab !== "Onboarding" && activeTab !== "Settings" && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">{activeTab} Section</h3>
                    <p className="text-slate-500">This section is under development. Content for {activeTab.toLowerCase()} will be available soon.</p>
                  </div>
                </div>
              )}

              {/* Placeholder for other settings tabs */}
              {activeTab === "Settings" && activeSettingsTab !== "Account" && activeSettingsTab !== "Notifications" && activeSettingsTab !== "Security" && activeSettingsTab !== "Onboarding" && activeSettingsTab !== "Leave Management" && activeSettingsTab !== "People" && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Settings className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">{activeSettingsTab} Settings</h3>
                    <p className="text-slate-500">This settings section is under development. Content for {activeSettingsTab.toLowerCase()} settings will be available soon.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Create New Folder</h3>
              <button
                onClick={() => setShowCreateFolderModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      createFolder();
                    }
                  }}
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowCreateFolderModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createFolder}
                  disabled={!newFolderName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Folder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-800">
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </h3>
              <button
                onClick={() => {
                  setShowGoalModal(false);
                  setEditingGoal(null);
                  // Reset form when canceling edit
                  setGoalForm({ objective: "", dueDate: "", description: "" });
                  setMilestonesEnabled(false);
                  setMilestones([{ id: 1, title: "" }]);
                  setGoalFiles([]);
                }}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Goal Objective */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Goal Objective *
                </label>
                <input
                  type="text"
                  value={goalForm.objective}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, objective: e.target.value }))}
                  placeholder="Enter your goal objective"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={goalForm.dueDate}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={goalForm.description}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your goal in detail..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700 resize-none"
                />
              </div>

              {/* Milestones Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <h4 className="font-medium text-slate-800">Use Milestones</h4>
                  <p className="text-sm text-slate-600">Break down your goal into smaller, trackable milestones</p>
                </div>
                <button
                  onClick={() => setMilestonesEnabled(!milestonesEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    milestonesEnabled ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      milestonesEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Milestones Fields */}
              {milestonesEnabled && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-800">Milestones</h4>
                    <button
                      onClick={addMilestone}
                      className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add Milestone</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {milestones.map((milestone, index) => (
                      <div key={milestone.id} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={milestone.title}
                          onChange={(e) => updateMilestone(milestone.id, e.target.value)}
                          placeholder={`Milestone ${index + 1}`}
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                        />
                        {milestones.length > 1 && (
                          <button
                            onClick={() => removeMilestone(milestone.id)}
                            className="p-2 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Attach Files
                </label>
                <div className="space-y-3">
                  <label className="flex items-center justify-center w-full h-32 px-4 transition bg-slate-50 border-2 border-slate-300 border-dashed rounded-xl hover:border-blue-400 hover:bg-blue-50 cursor-pointer">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600">
                        <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-slate-500">PDF, DOC, DOCX, XLS, XLSX up to 10MB each</p>
                    </div>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files) {
                          handleGoalFileUpload(files);
                        }
                      }}
                    />
                  </label>

                  {/* Uploaded Files */}
                  {goalFiles.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-slate-700">Uploaded Files ({goalFiles.length})</h5>
                      <div className="space-y-2">
                        {goalFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-slate-100 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <File className="w-4 h-4 text-slate-600" />
                              <span className="text-sm text-slate-700">{file.name}</span>
                              <span className="text-xs text-slate-500">
                                ({(file.size / (1024 * 1024)).toFixed(1)} MB)
                              </span>
                            </div>
                            <button
                              onClick={() => removeGoalFile(index)}
                              className="p-1 text-red-500 hover:text-red-700 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="px-6 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitGoal}
                  disabled={!goalForm.objective || !goalForm.dueDate}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Template Modal */}
      {showAddTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-800">Create Custom Template</h3>
              <button
                onClick={() => setShowAddTemplateModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Template Label */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Template Label *
                </label>
                <input
                  type="text"
                  value={newTemplate.label}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g., IT Setup, Security Training"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                />
              </div>

              {/* Template Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Complete IT setup and security training"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                />
              </div>

              {/* Checklist Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Checklist Items</label>
                  <button onClick={addTemplateChecklistItem} className="text-sm px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200">Add item</button>
                </div>
                <div className="space-y-2">
                  {newTemplate.checklist.map((item, index) => (
                    <div key={item.id} className="flex gap-2">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => updateTemplateChecklistItem(index, e.target.value)}
                        placeholder="Checklist item"
                        className="p-2 border rounded-lg flex-1"
                      />
                      {newTemplate.checklist.length > 1 && (
                        <button
                          onClick={() => removeTemplateChecklistItem(index)}
                          className="px-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowAddTemplateModal(false)}
                  className="px-6 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addTemplate}
                  disabled={!newTemplate.label.trim() || !newTemplate.title.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-800">Add New Client</h3>
              <button
                onClick={() => setShowAddClientModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Client Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={newClient.name}
                  onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter client company name"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                />
              </div>

              {/* Leave Policies */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-4">Leave Policies</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Annual Leave Days</label>
                    <input
                      type="number"
                      value={newClient.annualLeave}
                      onChange={(e) => setNewClient(prev => ({ ...prev, annualLeave: Number(e.target.value) }))}
                      min="0"
                      max="50"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Sick Leave Days</label>
                    <input
                      type="number"
                      value={newClient.sickLeave}
                      onChange={(e) => setNewClient(prev => ({ ...prev, sickLeave: Number(e.target.value) }))}
                      min="0"
                      max="30"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Personal Leave Days</label>
                    <input
                      type="number"
                      value={newClient.personalLeave}
                      onChange={(e) => setNewClient(prev => ({ ...prev, personalLeave: Number(e.target.value) }))}
                      min="0"
                      max="15"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Maternity Leave Days</label>
                    <input
                      type="number"
                      value={newClient.maternityLeave}
                      onChange={(e) => setNewClient(prev => ({ ...prev, maternityLeave: Number(e.target.value) }))}
                      min="0"
                      max="180"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Paternity Leave Days</label>
                    <input
                      type="number"
                      value={newClient.paternityLeave}
                      onChange={(e) => setNewClient(prev => ({ ...prev, paternityLeave: Number(e.target.value) }))}
                      min="0"
                      max="30"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Study Leave Days</label>
                    <input
                      type="number"
                      value={newClient.studyLeave}
                      onChange={(e) => setNewClient(prev => ({ ...prev, studyLeave: Number(e.target.value) }))}
                      min="0"
                      max="20"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowAddClientModal(false)}
                  className="px-6 py-2 text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addClient}
                  disabled={!newClient.name.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Dashboard Modal */}
      {showStaffDashboard && selectedStaffId && (
        <StaffDashboard
          staffId={selectedStaffId}
          onClose={() => {
            setShowStaffDashboard(false);
            setSelectedStaffId(null);
          }}
          currentUser={{
            name: profileInfo.name,
            role: profileInfo.role
          }}
        />
      )}
    </div>
  );
}