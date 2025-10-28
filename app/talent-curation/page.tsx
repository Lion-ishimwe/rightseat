'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Search, Star, Award, TrendingUp, Filter, UserPlus, Eye, MessageSquare, Edit, Trash2, ChevronUp, ChevronDown, Upload, FileText, FolderOpen, Folder, Plus, Download, Grid, List, ChevronRight, Settings, Lock, LogOut } from 'lucide-react';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { changePassword, clearAuthData } from '../../lib/auth';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  parentId?: string;
  children?: FileItem[];
}

interface Transaction {
  id: number;
  type: 'income' | 'expense';
  title: string;
  description: string;
  amount: number;
  date: string;
  client?: string;
  service?: string;
  quarter?: string;
}

export default function TalentCurationPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('hiredStaff');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [showDeleteStaffConfirm, setShowDeleteStaffConfirm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<any>(null);
  const [deleteStaffConfirmText, setDeleteStaffConfirmText] = useState('');
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [dateFilter, setDateFilter] = useState('all');
  const [newStaff, setNewStaff] = useState({
    clientName: '',
    name: '',
    birthdate: '',
    gender: '',
    salary: '',
    status: 'Active',
    reason: '',
    placementDate: ''
  });
  const [hiredStaff, setHiredStaff] = useState<any[]>([]);
  const [fileStructure, setFileStructure] = useState<FileItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('talentFileStructure');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [currentFolder, setCurrentFolder] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('talentCurrentFolder') || null;
    }
    return null;
  });
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('talentViewMode') as 'grid' | 'list') || 'grid';
    }
    return 'grid';
  });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: FileItem | null } | null>(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [reportType, setReportType] = useState('placement');
  const [dateRange, setDateRange] = useState('lastMonth');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredReportData, setFilteredReportData] = useState<any[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>(['clientName', 'name', 'status', 'salary', 'placementDate']);
  const [includeCreationTime, setIncludeCreationTime] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState('all');
  const [selectedClient, setSelectedClient] = useState('all');
  const [peopleData, setPeopleData] = useState<any[]>([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addItemToFolder = (items: FileItem[], folderId: string, newItem: FileItem): FileItem[] => {
    return items.map(item => {
      if (item.id === folderId && item.type === 'folder') {
        return { ...item, children: [...(item.children || []), newItem] };
      } else if (item.children) {
        return { ...item, children: addItemToFolder(item.children, folderId, newItem) };
      }
      return item;
    });
  };

  // Save to localStorage whenever state changes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('talentFileStructure', JSON.stringify(fileStructure));
    }
  }, [fileStructure]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentFolder) {
        localStorage.setItem('talentCurrentFolder', currentFolder);
      } else {
        localStorage.removeItem('talentCurrentFolder');
      }
    }
  }, [currentFolder]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('talentViewMode', viewMode);
    }
  }, [viewMode]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const newFiles: FileItem[] = files.map(file => ({
      id: generateId(),
      name: file.name,
      type: 'file',
      size: file.size,
      parentId: currentFolder || undefined
    }));

    setFileStructure(prev => {
      if (currentFolder) {
        return newFiles.reduce((acc, file) => addItemToFolder(acc, currentFolder, file), prev);
      } else {
        return [...prev, ...newFiles];
      }
    });

    // Reset the input
    event.target.value = '';
    setUploadKey(prev => prev + 1);
  };

  const createFolder = () => {
    if (!newFolderName.trim()) return;

    const newFolder: FileItem = {
      id: generateId(),
      name: newFolderName,
      type: 'folder',
      children: [],
      parentId: currentFolder || undefined
    };

    setFileStructure(prev => {
      if (currentFolder) {
        return addItemToFolder(prev, currentFolder, newFolder);
      } else {
        return [...prev, newFolder];
      }
    });

    setNewFolderName('');
    setShowNewFolderInput(false);
  };

  const startEditing = (item: FileItem) => {
    setEditingItem(item.id);
    setEditName(item.name);
  };

  const saveEdit = () => {
    if (!editName.trim()) return;

    setFileStructure(prev => prev.map(item => {
      if (item.id === editingItem) {
        return { ...item, name: editName };
      }
      if (item.children) {
        return {
          ...item,
          children: item.children.map(child =>
            child.id === editingItem ? { ...child, name: editName } : child
          )
        };
      }
      return item;
    }));

    setEditingItem(null);
    setEditName('');
  };

  const deleteItem = (itemId: string) => {
    setFileStructure(prev => {
      const deleteRecursive = (items: FileItem[]): FileItem[] => {
        return items.filter(item => {
          if (item.id === itemId) return false;
          if (item.children) {
            item.children = deleteRecursive(item.children);
          }
          return true;
        });
      };
      return deleteRecursive(prev);
    });

    // If we're deleting the current folder, go back to root
    if (currentFolder === itemId) {
      setCurrentFolder(null);
    }
  };


  const getCurrentItems = (): FileItem[] => {
    let items = currentFolder ? (findItemById(fileStructure, currentFolder)?.children || []) : fileStructure;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query)
      );
    }

    return items;
  };

  const findItemById = (items: FileItem[], id: string): FileItem | undefined => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findItemById(item.children, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const getBreadcrumbs = (): { name: string; id: string | null }[] => {
    const breadcrumbs: { name: string; id: string | null }[] = [{ name: 'Root', id: null }];
    if (currentFolder) {
      let current = findItemById(fileStructure, currentFolder);
      const path: { name: string; id: string }[] = [];
      while (current) {
        path.unshift({ name: current.name, id: current.id });
        current = current.parentId ? findItemById(fileStructure, current.parentId) : undefined;
      }
      breadcrumbs.push(...path);
    }
    return breadcrumbs;
  };

  const handleDownload = async (item: FileItem) => {
    if (item.type === 'file') {
      // In a real application, this would download the actual file
      // For now, we'll create a simple text file as a placeholder
      const element = document.createElement('a');
      const file = new Blob([`This is a placeholder for ${item.name}`], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = item.name;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else if (item.type === 'folder') {
      // Download folder as ZIP
      await downloadFolderAsZip(item);
    }
  };

  const downloadFolderAsZip = async (folder: FileItem) => {
    const zip = new JSZip();

    const addItemsToZip = (items: FileItem[], currentPath = '') => {
      items.forEach(item => {
        if (item.type === 'file') {
          // Add placeholder file content
          zip.file(`${currentPath}${item.name}`, `This is a placeholder for ${item.name}`);
        } else if (item.type === 'folder' && item.children) {
          const folderPath = `${currentPath}${item.name}/`;
          addItemsToZip(item.children, folderPath);
        }
      });
    };

    addItemsToZip([folder]);

    const content = await zip.generateAsync({ type: 'blob' });
    const element = document.createElement('a');
    element.href = URL.createObjectURL(content);
    element.download = `${folder.name}.zip`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const renderGridItem = (item: FileItem) => (
    <div
      key={item.id}
      className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors cursor-pointer group"
      onDoubleClick={() => item.type === 'folder' && setCurrentFolder(item.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, item });
      }}
    >
      <div className="flex flex-col items-center space-y-3">
        <div className="relative">
          {item.type === 'folder' ? (
            <Folder className="w-12 h-12 text-blue-600" />
          ) : (
            <FileText className="w-12 h-12 text-slate-600" />
          )}
          <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-1">
              {item.type === 'file' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(item);
                  }}
                  className="p-1 bg-white rounded shadow-sm hover:bg-slate-50 transition-colors"
                >
                  <Download className="w-3 h-3 text-slate-600" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing(item);
                }}
                className="p-1 bg-white rounded shadow-sm hover:bg-slate-50 transition-colors"
              >
                <Edit className="w-3 h-3 text-slate-600" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteItem(item.id);
                }}
                className="p-1 bg-white rounded shadow-sm hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3 h-3 text-red-600" />
              </button>
            </div>
          </div>
        </div>
        {editingItem === item.id ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={saveEdit}
            onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
            className="w-full text-center px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <span className="text-sm font-medium text-slate-800 text-center truncate w-full">{item.name}</span>
        )}
        {item.type === 'file' && item.size && (
          <span className="text-xs text-slate-500">{(item.size / 1024 / 1024).toFixed(2)} MB</span>
        )}
      </div>
    </div>
  );

  const renderFileItem = (item: FileItem) => (
    <div
      key={item.id}
      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
      onDoubleClick={() => item.type === 'folder' && setCurrentFolder(item.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, item });
      }}
    >
      <div className="flex items-center space-x-3">
        {item.type === 'folder' ? (
          <Folder className="w-5 h-5 text-blue-600" />
        ) : (
          <FileText className="w-5 h-5 text-slate-600" />
        )}
        {editingItem === item.id ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={saveEdit}
            onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
            className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        ) : (
          <span className="font-medium text-slate-800">{item.name}</span>
        )}
        {item.type === 'file' && item.size && (
          <span className="text-sm text-slate-500">({(item.size / 1024 / 1024).toFixed(2)} MB)</span>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {item.type === 'folder' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrentFolder(item.id);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        {item.type === 'file' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(item);
            }}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            startEditing(item);
          }}
          className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteItem(item.id);
          }}
          className="p-1 text-red-400 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const handleClickOutside = (e: React.MouseEvent) => {
    if (contextMenu) {
      setContextMenu(null);
    }
  };

  useEffect(() => {
    const savedStaff = localStorage.getItem('hiredStaff');
    if (savedStaff) {
      setHiredStaff(JSON.parse(savedStaff));
    } else {
      // Set default data if no saved data exists
      const defaultStaff = [
        {
          id: 1,
          clientName: 'TechCorp Inc.',
          name: 'Sarah Johnson',
          birthdate: '1990-05-15',
          gender: 'Female',
          salary: '$120,000',
          status: 'Active',
          reason: '',
          lastUpdated: new Date().toISOString()
        },
        {
          id: 2,
          clientName: 'DataSys Ltd.',
          name: 'Michael Chen',
          birthdate: '1988-03-22',
          gender: 'Male',
          salary: '$110,000',
          status: 'Active',
          reason: '',
          lastUpdated: new Date().toISOString()
        },
        {
          id: 3,
          clientName: 'Innovate Solutions',
          name: 'Emily Davis',
          birthdate: '1992-11-08',
          gender: 'Female',
          salary: '$105,000',
          status: 'Inactive',
          reason: 'Resigned',
          lastUpdated: new Date().toISOString()
        },
      ];
      setHiredStaff(defaultStaff);
      localStorage.setItem('hiredStaff', JSON.stringify(defaultStaff));
    }
  }, []);

  useEffect(() => {
    if (hiredStaff.length > 0) {
      localStorage.setItem('hiredStaff', JSON.stringify(hiredStaff));
    }
  }, [hiredStaff]);

  // Load people data from HR Outsourcing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPeople = localStorage.getItem("staff_list");
      if (savedPeople) {
        try {
          const people = JSON.parse(savedPeople);
          setPeopleData(people);
        } catch (error) {
          console.error('Error loading people data:', error);
        }
      }
    }
  }, []);

  const tabs = [
    { id: 'hiredStaff', label: 'Hired Staff', icon: Users },
    { id: 'documents', label: 'Documents', icon: TrendingUp },
    { id: 'report', label: 'Report', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const updateStaffStatus = (id: number, status: string) => {
    setHiredStaff(prev => prev.map(staff =>
      staff.id === id ? { ...staff, status, reason: status === 'Active' ? '' : staff.reason } : staff
    ));
  };

  const updateStaffReason = (id: number, reason: string) => {
    setHiredStaff(prev => prev.map(staff =>
      staff.id === id ? { ...staff, reason } : staff
    ));
  };

  const filteredStaff = hiredStaff.filter(staff =>
    staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedStaff = [...filteredStaff].sort((a, b) => {
    if (!sortConfig) return 0;

    const aValue = a[sortConfig.key as keyof typeof a];
    const bValue = b[sortConfig.key as keyof typeof b];

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getDateRange = (filter: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDate = now.getDate();

    switch (filter) {
      case 'thisWeek': {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return { start: startOfWeek, end: now };
      }
      case 'lastWeek': {
        const startOfLastWeek = new Date(now);
        startOfLastWeek.setDate(now.getDate() - now.getDay() - 7);
        startOfLastWeek.setHours(0, 0, 0, 0);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        endOfLastWeek.setHours(23, 59, 59, 999);
        return { start: startOfLastWeek, end: endOfLastWeek };
      }
      case 'lastMonth': {
        const startOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
        const endOfLastMonth = new Date(currentYear, currentMonth, 0);
        endOfLastMonth.setHours(23, 59, 59, 999);
        return { start: startOfLastMonth, end: endOfLastMonth };
      }
      case 'Q1': {
        const startOfQ1 = new Date(currentYear, 0, 1); // January 1st
        const endOfQ1 = new Date(currentYear, 2, 31); // March 31st
        endOfQ1.setHours(23, 59, 59, 999);
        return { start: startOfQ1, end: endOfQ1 };
      }
      case 'Q2': {
        const startOfQ2 = new Date(currentYear, 3, 1); // April 1st
        const endOfQ2 = new Date(currentYear, 5, 30); // June 30th
        endOfQ2.setHours(23, 59, 59, 999);
        return { start: startOfQ2, end: endOfQ2 };
      }
      case 'Q3': {
        const startOfQ3 = new Date(currentYear, 6, 1); // July 1st
        const endOfQ3 = new Date(currentYear, 8, 30); // September 30th
        endOfQ3.setHours(23, 59, 59, 999);
        return { start: startOfQ3, end: endOfQ3 };
      }
      case 'Q4': {
        const startOfQ4 = new Date(currentYear, 9, 1); // October 1st
        const endOfQ4 = new Date(currentYear, 11, 31); // December 31st
        endOfQ4.setHours(23, 59, 59, 999);
        return { start: startOfQ4, end: endOfQ4 };
      }
      case 'lastYear': {
        const startOfLastYear = new Date(currentYear - 1, 0, 1);
        const endOfLastYear = new Date(currentYear - 1, 11, 31);
        endOfLastYear.setHours(23, 59, 59, 999);
        return { start: startOfLastYear, end: endOfLastYear };
      }
      default:
        return null; // 'all' returns null to show all records
    }
  };

  const filteredByDateStaff = sortedStaff.filter(staff => {
    if (dateFilter === 'all') return true;

    const dateRange = getDateRange(dateFilter);
    if (!dateRange) return true;

    // Filter by placement date, fallback to last updated if not available
    const staffDate = new Date(staff.placementDate || staff.lastUpdated);
    return staffDate >= dateRange.start && staffDate <= dateRange.end;
  });

  const addNewStaff = () => {
    if (newStaff.name && newStaff.clientName) {
      const staff = {
        ...newStaff,
        id: hiredStaff.length + 1,
        lastUpdated: new Date().toISOString()
      };
      setHiredStaff(prev => [...prev, staff]);
      setNewStaff({
        clientName: '',
        name: '',
        birthdate: '',
        gender: '',
        salary: '',
        status: 'Active',
        reason: '',
        placementDate: ''
      });
      setShowAddForm(false);
    }
  };

  const editStaff = (staff: any) => {
    setEditingStaff(staff);
    setNewStaff({ ...staff });
    setShowAddForm(true);
  };

  const updateStaff = () => {
    if (newStaff.name && newStaff.clientName && editingStaff) {
      setHiredStaff(prev => prev.map(staff =>
        staff.id === editingStaff.id ? { ...newStaff, id: editingStaff.id, lastUpdated: new Date().toISOString() } : staff
      ));
      setNewStaff({
        clientName: '',
        name: '',
        birthdate: '',
        gender: '',
        salary: '',
        status: 'Active',
        reason: '',
        placementDate: ''
      });
      setEditingStaff(null);
      setShowAddForm(false);
    }
  };

  const deleteStaff = (staff: any) => {
    setStaffToDelete(staff);
    setShowDeleteStaffConfirm(true);
    setDeleteStaffConfirmText('');
  };

  const confirmDeleteStaff = () => {
    if (deleteStaffConfirmText === 'DELETE' && staffToDelete) {
      setHiredStaff(prev => prev.filter(staff => staff.id !== staffToDelete.id));
      setShowDeleteStaffConfirm(false);
      setStaffToDelete(null);
      setDeleteStaffConfirmText('');
    }
  };


  const exportToExcel = () => {
    setShowExportModal(true);
  };

  const handleFieldToggle = (field: string) => {
    setSelectedFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const confirmExport = () => {
    let dataToExport: any[] = [];

    // Choose data source based on report type
    if (reportType === 'placement') {
      dataToExport = [...hiredStaff];
    } else if (reportType === 'performance' || reportType === 'demographics') {
      dataToExport = [...peopleData];
    } else {
      dataToExport = [...hiredStaff]; // Default to hired staff
    }

    // Apply client filter first
    if (selectedClient !== 'all') {
      if (reportType === 'placement') {
        dataToExport = dataToExport.filter(staff => staff.clientName === selectedClient);
      } else {
        // For people data, filter by clientId
        dataToExport = dataToExport.filter(staff => staff.clientId === selectedClient);
      }
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      dataToExport = dataToExport.filter(staff => staff.status.toLowerCase() === statusFilter);
    }

    // Apply date range filter
    if (dateRange !== 'all') {
      const dateRangeObj = getDateRange(dateRange);
      if (dateRangeObj) {
        dataToExport = dataToExport.filter(staff => {
          const staffDate = new Date(staff.placementDate || staff.hireDate || staff.lastUpdated);
          return staffDate >= dateRangeObj.start && staffDate <= dateRangeObj.end;
        });
      }
    }

    // Apply quarter filter (only for demographics)
    if (reportType === 'demographics' && selectedQuarter !== 'all') {
      const currentYear = new Date().getFullYear();
      const quarterRanges = {
        Q1: { start: new Date(currentYear, 0, 1), end: new Date(currentYear, 2, 31) },
        Q2: { start: new Date(currentYear, 3, 1), end: new Date(currentYear, 5, 30) },
        Q3: { start: new Date(currentYear, 6, 1), end: new Date(currentYear, 8, 30) },
        Q4: { start: new Date(currentYear, 9, 1), end: new Date(currentYear, 11, 31) }
      };
      const quarterRange = quarterRanges[selectedQuarter as keyof typeof quarterRanges];
      if (quarterRange) {
        dataToExport = dataToExport.filter(staff => {
          const staffDate = new Date(staff.placementDate || staff.hireDate || staff.lastUpdated);
          return staffDate >= quarterRange.start && staffDate <= quarterRange.end;
        });
      }
    }

    // Transform data based on selected fields
    const transformedData = dataToExport.map(staff => {
      const row: any = {};
      selectedFields.forEach(field => {
        if (field === 'placementDate') {
          row['Placement Date'] = staff.placementDate ? new Date(staff.placementDate).toLocaleDateString() : 'N/A';
        } else if (field === 'lastUpdated' && includeCreationTime) {
          row['Creation Time'] = new Date(staff.lastUpdated).toLocaleString();
        } else if (field !== 'lastUpdated') {
          const displayName = field === 'clientName' ? 'Client Name' :
                              field === 'name' ? 'Staff Name' :
                              field.charAt(0).toUpperCase() + field.slice(1);
          row[displayName] = staff[field];
        }
      });
      return row;
    });

    // Create Excel workbook
    const ws = XLSX.utils.json_to_sheet(transformedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`);

    // Generate filename with timestamp and report type
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `talent_${reportType}_report_${timestamp}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
    setShowExportModal(false);
  };

  const handleChangePassword = () => {
    // Clear previous messages
    setPasswordChangeMessage('');
    setPasswordChangeError('');

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordChangeError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordChangeError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordChangeError('New password must be at least 6 characters long');
      return;
    }

    const success = changePassword(currentPassword, newPassword);
    if (success) {
      setPasswordChangeMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordChangeError('Current password is incorrect');
    }
  };

  const handleLogout = () => {
    clearAuthData();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" onClick={handleClickOutside}>
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
                placeholder="Search hired staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-slate-700 placeholder-slate-400"
              />
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Placed</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
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
        {activeTab === 'hiredStaff' && (
          <div className="space-y-6">
            {showAddForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200/50 max-w-2xl w-full mx-4">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-800">
                      {editingStaff ? 'Edit Staff Member' : 'Add New Placed Staff'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingStaff(null);
                        setNewStaff({
                          clientName: '',
                          name: '',
                          birthdate: '',
                          gender: '',
                          salary: '',
                          status: 'Active',
                          reason: '',
                          placementDate: ''
                        });
                      }}
                      className="text-slate-400 hover:text-slate-600 text-2xl"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Client Name</label>
                      <input
                        type="text"
                        placeholder="Client Name"
                        value={newStaff.clientName}
                        onChange={(e) => setNewStaff(prev => ({ ...prev, clientName: e.target.value }))}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Staff Name</label>
                      <input
                        type="text"
                        placeholder="Staff Name"
                        value={newStaff.name}
                        onChange={(e) => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Birthdate</label>
                      <input
                        type="date"
                        value={newStaff.birthdate}
                        onChange={(e) => setNewStaff(prev => ({ ...prev, birthdate: e.target.value }))}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                      <select
                        value={newStaff.gender}
                        onChange={(e) => setNewStaff(prev => ({ ...prev, gender: e.target.value }))}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Salary</label>
                      <input
                        type="text"
                        placeholder="Salary"
                        value={newStaff.salary}
                        onChange={(e) => setNewStaff(prev => ({ ...prev, salary: e.target.value }))}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Placement Date</label>
                      <input
                        type="date"
                        value={newStaff.placementDate}
                        onChange={(e) => setNewStaff(prev => ({ ...prev, placementDate: e.target.value }))}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                      <select
                        value={newStaff.status}
                        onChange={(e) => setNewStaff(prev => ({ ...prev, status: e.target.value }))}
                        className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    {newStaff.status === 'Inactive' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Inactivity</label>
                        <input
                          type="text"
                          placeholder="Reason for inactivity"
                          value={newStaff.reason}
                          onChange={(e) => setNewStaff(prev => ({ ...prev, reason: e.target.value }))}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={editingStaff ? updateStaff : addNewStaff}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingStaff ? 'Update Staff' : 'Add Staff'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showDeleteStaffConfirm && staffToDelete && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200/50 max-w-md w-full mx-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Confirm Delete</h3>
                    <button
                      onClick={() => {
                        setShowDeleteStaffConfirm(false);
                        setStaffToDelete(null);
                        setDeleteStaffConfirmText('');
                      }}
                      className="text-slate-400 hover:text-slate-600 text-2xl"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mb-4">
                    <p className="text-slate-600 mb-4">
                      Are you sure you want to delete <strong>{staffToDelete.name}</strong> from <strong>{staffToDelete.clientName}</strong>?
                    </p>
                    <p className="text-sm text-slate-500 mb-4">
                      This action cannot be undone. Type <strong>DELETE</strong> to confirm.
                    </p>
                    <input
                      type="text"
                      value={deleteStaffConfirmText}
                      onChange={(e) => setDeleteStaffConfirmText(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowDeleteStaffConfirm(false);
                        setStaffToDelete(null);
                        setDeleteStaffConfirmText('');
                      }}
                      className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteStaff}
                      disabled={deleteStaffConfirmText !== 'DELETE'}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Delete Staff
                    </button>
                  </div>
                </div>
              </div>
            )}


            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Hired Staff Pool</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-slate-600" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Time</option>
                    <option value="thisWeek">This Week</option>
                    <option value="lastWeek">Last Week</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="Q1">Q1 (Jan-Mar)</option>
                    <option value="Q2">Q2 (Apr-Jun)</option>
                    <option value="Q3">Q3 (Jul-Sep)</option>
                    <option value="Q4">Q4 (Oct-Dec)</option>
                    <option value="lastYear">Last Year</option>
                  </select>
                </div>
                <span className="text-sm text-slate-600">Filter by date range</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('clientName')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Client Name</span>
                          {sortConfig?.key === 'clientName' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Staff Name</span>
                          {sortConfig?.key === 'name' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('birthdate')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Birthdate</span>
                          {sortConfig?.key === 'birthdate' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('gender')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Gender</span>
                          {sortConfig?.key === 'gender' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('salary')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Salary</span>
                          {sortConfig?.key === 'salary' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Status</span>
                          {sortConfig?.key === 'status' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reason (if Inactive)</th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort('lastUpdated')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Date</span>
                          {sortConfig?.key === 'lastUpdated' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredByDateStaff.map((staff) => (
                      <tr key={staff.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{staff.clientName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{staff.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{staff.birthdate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{staff.gender}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{staff.salary}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={staff.status}
                            onChange={(e) => updateStaffStatus(staff.id, e.target.value)}
                            className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${getStatusColor(staff.status)}`}
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {staff.status === 'Inactive' && (
                            <input
                              type="text"
                              value={staff.reason}
                              onChange={(e) => updateStaffReason(staff.id, e.target.value)}
                              placeholder="Reason for inactivity"
                              className="px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {staff.placementDate ? new Date(staff.placementDate).toLocaleDateString() : new Date(staff.lastUpdated).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => editStaff(staff)}
                              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteStaff(staff)}
                              className="p-1 text-red-600 hover:text-red-800 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
              {/* Breadcrumbs */}
              <div className="flex items-center space-x-2 mb-6">
                {getBreadcrumbs().map((crumb, index) => (
                  <React.Fragment key={crumb.id || 'root'}>
                    {index > 0 && <ChevronRight className="w-4 h-4 text-slate-400" />}
                    <button
                      onClick={() => setCurrentFolder(crumb.id)}
                      className={`text-sm ${crumb.id === currentFolder ? 'text-blue-600 font-medium' : 'text-slate-600 hover:text-slate-800'}`}
                    >
                      {crumb.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-800">Document Management</h2>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search files and folders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-slate-700 placeholder-slate-400"
                    />
                  </div>
                  <button
                    onClick={() => setShowNewFolderInput(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Folder</span>
                  </button>
                  <label className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Upload Files</span>
                    <input
                      key={uploadKey}
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    />
                  </label>
                </div>
              </div>

              {/* New Folder Input */}
              {showNewFolderInput && (
                <div className="mb-4 flex items-center space-x-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && createFolder()}
                    autoFocus
                  />
                  <button
                    onClick={createFolder}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowNewFolderInput(false);
                      setNewFolderName('');
                    }}
                    className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4" : "space-y-4"}>
                {getCurrentItems().length > 0 ? (
                  getCurrentItems().map(item => viewMode === 'grid' ? renderGridItem(item) : renderFileItem(item))
                ) : (
                  <div className={viewMode === 'grid' ? "col-span-full text-center py-12" : "text-center py-12"}>
                    <FolderOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No documents in this folder</p>
                    <p className="text-slate-400 text-sm">Upload files or create folders to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Advanced Report</h2>
            <div className="space-y-6">
              {/* Report Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Report Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="placement">Placement Report</option>
                    <option value="performance">Performance Report</option>
                    <option value="demographics">Demographics Report</option>
                    <option value="financial">Financial Report</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Client</label>
                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Clients</option>
                    {reportType === 'placement'
                      ? [...new Set(hiredStaff.map(staff => staff.clientName))].map(client => (
                          <option key={client} value={client}>{client}</option>
                        ))
                      : [...new Set(peopleData.map(staff => staff.clientId))].map(clientId => {
                          const client = peopleData.find(staff => staff.clientId === clientId);
                          return (
                            <option key={clientId} value={clientId}>
                              {client?.clientName || `Client ${clientId}`}
                            </option>
                          );
                        })
                    }
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="lastMonth">Last Month</option>
                    <option value="lastQuarter">Last Quarter</option>
                    <option value="lastYear">Last Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              {/* Report Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">
                        {reportType === 'placement' ? 'Total Placements' : 'Total Staff'}
                      </p>
                      <p className="text-2xl font-bold">
                        {(() => {
                          const data = reportType === 'placement' ? hiredStaff : peopleData;
                          return selectedClient === 'all'
                            ? data.length
                            : data.filter(s => (reportType === 'placement' ? s.clientName : s.clientId) === selectedClient).length;
                        })()}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-200" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Active Staff</p>
                      <p className="text-2xl font-bold">
                        {(() => {
                          const data = reportType === 'placement' ? hiredStaff : peopleData;
                          const filteredData = selectedClient === 'all'
                            ? data
                            : data.filter(s => (reportType === 'placement' ? s.clientName : s.clientId) === selectedClient);
                          return filteredData.filter(s => s.status === 'Active').length;
                        })()}
                      </p>
                    </div>
                    <Award className="w-8 h-8 text-green-200" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Avg Salary</p>
                      <p className="text-2xl font-bold">
                        ${(() => {
                          const data = reportType === 'placement' ? hiredStaff : peopleData;
                          const filteredData = selectedClient === 'all'
                            ? data
                            : data.filter(s => (reportType === 'placement' ? s.clientName : s.clientId) === selectedClient);
                          const salaries = filteredData.filter(s => s.salary).map(s => parseFloat(s.salary.replace(/[$,]/g, '')));
                          return Math.round(salaries.reduce((sum, s) => sum + s, 0) / salaries.length || 0);
                        })()}K
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-200" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Success Rate</p>
                      <p className="text-2xl font-bold">
                        {(() => {
                          const data = reportType === 'placement' ? hiredStaff : peopleData;
                          const filteredData = selectedClient === 'all'
                            ? data
                            : data.filter(s => (reportType === 'placement' ? s.clientName : s.clientId) === selectedClient);
                          const activeCount = filteredData.filter(s => s.status === 'Active').length;
                          return Math.round((activeCount / filteredData.length) * 100) || 0;
                        })()}%
                      </p>
                    </div>
                    <Star className="w-8 h-8 text-orange-200" />
                  </div>
                </div>
              </div>

              {/* Detailed Report Table */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Detailed Report</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Client</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Staff</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Salary</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-600 uppercase">Placement Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(() => {
                        const data = reportType === 'placement' ? hiredStaff : peopleData;
                        const filteredData = selectedClient === 'all'
                          ? data
                          : data.filter(s => (reportType === 'placement' ? s.clientName : s.clientId) === selectedClient);
                        return filteredData.map((staff) => (
                          <tr key={staff.id} className="hover:bg-slate-100">
                            <td className="px-4 py-2 text-sm text-slate-900">
                              {reportType === 'placement' ? staff.clientName : staff.clientName || `Client ${staff.clientId}`}
                            </td>
                            <td className="px-4 py-2 text-sm text-slate-900">{staff.name}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(staff.status)}`}>
                                {staff.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-slate-900">{staff.salary || 'N/A'}</td>
                            <td className="px-4 py-2 text-sm text-slate-900">
                              {staff.placementDate
                                ? new Date(staff.placementDate).toLocaleDateString()
                                : staff.hireDate
                                ? new Date(staff.hireDate).toLocaleDateString()
                                : 'N/A'
                              }
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Export Options */}
              <div className="flex justify-end">
                <button
                  onClick={exportToExcel}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Excel</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
            <h2 className="text-lg font-semibold text-slate-800 mb-6">Settings</h2>
            <div className="max-w-md">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm new password"
                  />
                </div>
                {passwordChangeMessage && (
                  <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                    {passwordChangeMessage}
                  </div>
                )}
                {passwordChangeError && (
                  <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {passwordChangeError}
                  </div>
                )}
                <button
                  onClick={handleChangePassword}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  <span>Change Password</span>
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200/50 max-w-2xl w-full mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-800">Advanced Report Export</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-slate-700 mb-3">Select Fields to Include</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'clientName', label: 'Client Name' },
                      { key: 'name', label: 'Staff Name' },
                      { key: 'birthdate', label: 'Birthdate' },
                      { key: 'gender', label: 'Gender' },
                      { key: 'salary', label: 'Salary' },
                      { key: 'status', label: 'Status' },
                      { key: 'reason', label: 'Reason (if Inactive)' },
                      { key: 'placementDate', label: 'Placement Date' }
                    ].map(field => (
                      <label key={field.key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedFields.includes(field.key)}
                          onChange={() => handleFieldToggle(field.key)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {reportType === 'demographics' && (
                  <div>
                    <h4 className="text-lg font-medium text-slate-700 mb-3">Demographics Options</h4>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={includeCreationTime}
                          onChange={(e) => setIncludeCreationTime(e.target.checked)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">Include Creation Time</span>
                      </label>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Quarter Selection</label>
                        <select
                          value={selectedQuarter}
                          onChange={(e) => setSelectedQuarter(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Quarters</option>
                          <option value="Q1">Q1 (Jan-Mar)</option>
                          <option value="Q2">Q2 (Apr-Jun)</option>
                          <option value="Q3">Q3 (Jul-Sep)</option>
                          <option value="Q4">Q4 (Oct-Dec)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmExport}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Export to Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Context Menu */}
      {contextMenu && contextMenu.item && (
        <div
          className="fixed z-50 bg-white border border-slate-300 rounded-lg shadow-lg py-2 min-w-32"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              deleteItem(contextMenu.item!.id);
              setContextMenu(null);
            }}
            className="w-full text-left px-4 py-2 hover:bg-slate-100 text-red-600 flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}