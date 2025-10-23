'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, FileText, DollarSign, TrendingUp, PieChart, Receipt, FolderOpen, Folder, Plus, Edit, Trash2, ChevronRight, ChevronDown, Grid, List, Search, Download, CreditCard, PlusCircle, MinusCircle, ChevronUp, ChevronDown as ChevronDownIcon } from 'lucide-react';

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

export default function FinancePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [fileStructure, setFileStructure] = useState<FileItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('financeFileStructure');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [currentFolder, setCurrentFolder] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('financeCurrentFolder') || null;
    }
    return null;
  });
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('financeViewMode') as 'grid' | 'list') || 'grid';
    }
    return 'grid';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [transactionSearchQuery, setTransactionSearchQuery] = useState('');
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('financeTransactions');
      return saved ? JSON.parse(saved) : [
        {
          id: 1,
          type: 'income',
          title: 'Client Payment - Project Alpha',
          description: 'Received from ABC Corp',
          amount: 15000,
          date: 'Dec 15, 2024'
        },
        {
          id: 2,
          type: 'expense',
          title: 'Office Supplies',
          description: 'Stationery and equipment',
          amount: 2450,
          date: 'Dec 14, 2024'
        },
        {
          id: 3,
          type: 'income',
          title: 'Consulting Services',
          description: 'Freelance project payment',
          amount: 8750,
          date: 'Dec 12, 2024'
        },
        {
          id: 4,
          type: 'expense',
          title: 'Software Licenses',
          description: 'Annual subscription renewal',
          amount: 4200,
          date: 'Dec 10, 2024'
        }
      ];
    }
    return [];
  });
  const [newTransaction, setNewTransaction] = useState({
    title: '',
    description: '',
    amount: '',
    client: '',
    service: '',
    quarter: '',
    year: new Date().getFullYear().toString()
  });
  const [services, setServices] = useState<string[]>([
    'Talent Curation',
    'HR Outsourcing',
    'HR Strategy',
    'Rent',
    'Programs',
    'Reimbursement'
  ]);
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteItemToConfirm, setDeleteItemToConfirm] = useState<FileItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteTransactionConfirm, setShowDeleteTransactionConfirm] = useState(false);
  const [deleteTransactionToConfirm, setDeleteTransactionToConfirm] = useState<Transaction | null>(null);
  const [deleteTransactionConfirmText, setDeleteTransactionConfirmText] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Transaction | null;
    direction: 'asc' | 'desc' | 'week' | 'month' | 'today' | 'this_week' | 'last_week' | 'last_month';
  }>({ key: null, direction: 'asc' });
  const [reportFilter, setReportFilter] = useState('All Time');
  const [showAdvancedReport, setShowAdvancedReport] = useState(false);
  const [reportOptions, setReportOptions] = useState({
    includeOverview: true,
    includeTransactions: true,
    includeCharts: true,
    includeServiceAnalysis: true,
    includeClientAnalysis: true,
    includeQuarterly: true,
    format: 'pdf' as 'pdf' | 'excel' | 'csv',
    dateRange: 'current_filter'
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: DollarSign },
    { id: 'documents', label: 'Documents/Invoices', icon: Receipt },
    { id: 'transactions', label: 'Transactions', icon: CreditCard },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
  ];

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
      localStorage.setItem('financeFileStructure', JSON.stringify(fileStructure));
    }
  }, [fileStructure]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentFolder) {
        localStorage.setItem('financeCurrentFolder', currentFolder);
      } else {
        localStorage.removeItem('financeCurrentFolder');
      }
    }
  }, [currentFolder]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('financeViewMode', viewMode);
    }
  }, [viewMode]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('financeTransactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  const [uploadKey, setUploadKey] = useState(0);

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
    const item = findItemById(fileStructure, itemId);
    if (item) {
      setDeleteItemToConfirm(item);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDeleteItem = () => {
    if (!deleteItemToConfirm || deleteConfirmText !== 'delete') return;

    setFileStructure(prev => {
      const deleteRecursive = (items: FileItem[]): FileItem[] => {
        return items.filter(item => {
          if (item.id === deleteItemToConfirm.id) return false;
          if (item.children) {
            item.children = deleteRecursive(item.children);
          }
          return true;
        });
      };
      return deleteRecursive(prev);
    });

    // If we're deleting the current folder, go back to root
    if (currentFolder === deleteItemToConfirm.id) {
      setCurrentFolder(null);
    }

    setShowDeleteConfirm(false);
    setDeleteItemToConfirm(null);
    setDeleteConfirmText('');
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

  const handleDownload = (item: FileItem) => {
    // In a real application, this would download the actual file
    // For now, we'll create a simple text file as a placeholder
    const element = document.createElement('a');
    const file = new Blob([`This is a placeholder for ${item.name}`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = item.name;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const addTransaction = (type: 'income' | 'expense') => {
    if (type === 'income') {
      if (!newTransaction.client.trim() || !newTransaction.service.trim() || !newTransaction.amount.trim()) {
        alert('Please fill in all required fields: Client, Service, and Amount');
        return;
      }
    } else {
      if (!newTransaction.title.trim() || !newTransaction.amount.trim()) {
        alert('Please fill in all required fields: Title and Amount');
        return;
      }
    }

    const transaction: Transaction = {
      id: Date.now(),
      type,
      title: type === 'income' ? `${newTransaction.client} - ${newTransaction.service}` : newTransaction.title,
      description: newTransaction.description,
      amount: parseFloat(newTransaction.amount),
      date: new Date(parseInt(newTransaction.year), new Date().getMonth(), new Date().getDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      client: newTransaction.client || undefined,
      service: newTransaction.service || undefined,
      quarter: newTransaction.quarter || undefined
    };

    setTransactions(prev => [transaction, ...prev]);
    setNewTransaction({ title: '', description: '', amount: '', client: '', service: '', quarter: '', year: new Date().getFullYear().toString() });
    setShowIncomeModal(false);
    setShowExpenseModal(false);
  };

  const editTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setNewTransaction({
      title: transaction.type === 'expense' ? transaction.title : '',
      description: transaction.description,
      amount: transaction.amount.toString(),
      client: transaction.client || '',
      service: transaction.service || '',
      quarter: transaction.quarter || '',
      year: new Date(transaction.date).getFullYear().toString()
    });
    setShowEditModal(true);
  };

  const updateTransaction = () => {
    if (!editingTransaction) return;

    if (editingTransaction.type === 'income') {
      if (!newTransaction.client.trim() || !newTransaction.service.trim() || !newTransaction.amount.trim()) {
        alert('Please fill in all required fields: Client, Service, and Amount');
        return;
      }
    } else {
      if (!newTransaction.title.trim() || !newTransaction.amount.trim()) {
        alert('Please fill in all required fields: Title and Amount');
        return;
      }
    }

    const updatedTransaction: Transaction = {
      ...editingTransaction,
      title: editingTransaction.type === 'income' ? `${newTransaction.client} - ${newTransaction.service}` : newTransaction.title,
      description: newTransaction.description,
      amount: parseFloat(newTransaction.amount),
      date: new Date(parseInt(newTransaction.year), new Date().getMonth(), new Date().getDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      client: newTransaction.client || undefined,
      service: newTransaction.service || undefined,
      quarter: newTransaction.quarter || undefined
    };

    setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? updatedTransaction : t));
    setNewTransaction({ title: '', description: '', amount: '', client: '', service: '', quarter: '', year: new Date().getFullYear().toString() });
    setEditingTransaction(null);
    setShowEditModal(false);
  };

  const deleteTransaction = (id: number) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      setDeleteTransactionToConfirm(transaction);
      setShowDeleteTransactionConfirm(true);
    }
  };

  const confirmDeleteTransaction = () => {
    if (!deleteTransactionToConfirm || deleteTransactionConfirmText !== 'delete') return;

    setTransactions(prev => prev.filter(t => t.id !== deleteTransactionToConfirm.id));
    setShowDeleteTransactionConfirm(false);
    setDeleteTransactionToConfirm(null);
    setDeleteTransactionConfirmText('');
  };

  const generateAdvancedReport = () => {
    // Create report data based on selected options
    const reportData: any = {
      title: `Financial Report - ${reportFilter}`,
      generatedAt: new Date().toLocaleString(),
      filters: reportOptions,
      data: {}
    };

    // Add selected sections to report data
    if (reportOptions.includeOverview) {
      reportData.data.overview = {
        totalRevenue: getFilteredTransactionsForReports.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        totalExpenses: getFilteredTransactionsForReports.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
        netProfit: getFilteredTransactionsForReports.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) -
                  getFilteredTransactionsForReports.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
        totalTransactions: getFilteredTransactionsForReports.length
      };
    }

    if (reportOptions.includeTransactions) {
      reportData.data.transactions = getFilteredTransactionsForReports;
    }

    if (reportOptions.includeServiceAnalysis) {
      reportData.data.serviceAnalysis = getFilteredTransactionsForReports
        .filter(t => t.type === 'income' && t.service)
        .reduce((acc, t) => {
          acc[t.service!] = (acc[t.service!] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);
    }

    if (reportOptions.includeClientAnalysis) {
      reportData.data.clientAnalysis = getFilteredTransactionsForReports
        .filter(t => t.type === 'income' && t.client)
        .reduce((acc, t) => {
          acc[t.client!] = (acc[t.client!] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);
    }

    if (reportOptions.includeQuarterly) {
      reportData.data.quarterly = ['Q1', 'Q2', 'Q3', 'Q4'].map(quarter => ({
        quarter,
        revenue: getFilteredTransactionsForReports
          .filter(t => t.type === 'income' && t.quarter === quarter)
          .reduce((sum, t) => sum + t.amount, 0)
      }));
    }

    // Generate file based on format
    let content = '';
    let filename = '';
    let mimeType = '';

    switch (reportOptions.format) {
      case 'csv':
        content = generateCSVReport(reportData);
        filename = `financial-report-${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;
      case 'excel':
        content = generateExcelReport(reportData);
        filename = `financial-report-${Date.now()}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      default: // pdf
        content = generatePDFReport(reportData);
        filename = `financial-report-${Date.now()}.pdf`;
        mimeType = 'application/pdf';
        break;
    }

    // Download the file
    const element = document.createElement('a');
    const file = new Blob([content], { type: mimeType });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generateCSVReport = (data: any): string => {
    let csv = 'Financial Report\n';
    csv += `Generated: ${data.generatedAt}\n`;
    csv += `Period: ${data.filters.dateRange}\n\n`;

    if (data.data.overview) {
      csv += 'Financial Overview\n';
      csv += `Total Revenue,${data.data.overview.totalRevenue}\n`;
      csv += `Total Expenses,${data.data.overview.totalExpenses}\n`;
      csv += `Net Profit,${data.data.overview.netProfit}\n`;
      csv += `Total Transactions,${data.data.overview.totalTransactions}\n\n`;
    }

    if (data.data.transactions) {
      csv += 'Transactions\n';
      csv += 'Type,Title,Description,Client,Service,Quarter,Amount,Date\n';
      data.data.transactions.forEach((t: any) => {
        csv += `${t.type},${t.title},${t.description},${t.client || ''},${t.service || ''},${t.quarter || ''},${t.amount},${t.date}\n`;
      });
      csv += '\n';
    }

    return csv;
  };

  const generateExcelReport = (data: any): string => {
    // For demo purposes, return CSV-like content
    // In a real app, you'd use a library like xlsx
    return generateCSVReport(data);
  };

  const generatePDFReport = (data: any): string => {
    // For demo purposes, return text content with pie chart representation
    // In a real app, you'd use a library like jsPDF
    let pdf = `FINANCIAL REPORT\n\n`;
    pdf += `Generated: ${data.generatedAt}\n`;
    pdf += `Period: ${data.filters.dateRange}\n\n`;

    if (data.data.overview) {
      pdf += `FINANCIAL OVERVIEW\n`;
      pdf += `Total Revenue: $${data.data.overview.totalRevenue.toLocaleString()}\n`;
      pdf += `Total Expenses: $${data.data.overview.totalExpenses.toLocaleString()}\n`;
      pdf += `Net Profit: $${data.data.overview.netProfit.toLocaleString()}\n`;
      pdf += `Total Transactions: ${data.data.overview.totalTransactions}\n\n`;
    }

    if (data.filters.includeCharts && data.data.serviceAnalysis) {
      pdf += `REVENUE CHART (Pie Chart Representation)\n`;
      pdf += `Total Revenue Breakdown by Service:\n\n`;

      const serviceData = data.data.serviceAnalysis as Record<string, number>;
      const total = Object.values(serviceData).reduce((sum: number, val: number) => sum + val, 0);
      Object.entries(serviceData).forEach(([service, amount]: [string, number]) => {
        const percentage = ((amount / total) * 100).toFixed(1);
        pdf += `${service}: $${amount.toLocaleString()} (${percentage}%)\n`;
      });
      pdf += `\nTotal Revenue: $${total.toLocaleString()}\n\n`;
    }

    if (data.data.transactions) {
      pdf += `TRANSACTION DETAILS\n`;
      pdf += `Type,Title,Amount,Date\n`;
      data.data.transactions.forEach((t: any) => {
        pdf += `${t.type},${t.title}$${t.amount},${t.date}\n`;
      });
    }

    return pdf;
  };

  const handleSort = (key: keyof Transaction) => {
    let direction: 'asc' | 'desc' | 'week' | 'month' = 'asc';

    if (key === 'date') {
      // Special handling for date sorting
      if (sortConfig.key === key) {
        if (sortConfig.direction === 'asc') direction = 'desc';
        else if (sortConfig.direction === 'desc') direction = 'week';
        else if (sortConfig.direction === 'week') direction = 'month';
        else direction = 'asc';
      }
    } else {
      // Regular sorting for other columns
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
      }
    }

    setSortConfig({ key, direction });
  };

  const getFilteredTransactionsForReports = React.useMemo(() => {
    let filteredItems = [...transactions];
    const now = new Date();

    switch (reportFilter) {
      case 'This Year':
        const thisYear = now.getFullYear();
        filteredItems = filteredItems.filter(t => new Date(t.date).getFullYear() === thisYear);
        break;
      case 'Last Year':
        const lastYear = now.getFullYear() - 1;
        filteredItems = filteredItems.filter(t => new Date(t.date).getFullYear() === lastYear);
        break;
      case 'This Quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
        const currentYear = now.getFullYear();
        filteredItems = filteredItems.filter(t => {
          const date = new Date(t.date);
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          return quarter === currentQuarter && date.getFullYear() === currentYear;
        });
        break;
      case 'Last Quarter':
        const lastQuarterDate = new Date(now);
        lastQuarterDate.setMonth(now.getMonth() - 3);
        const lastQuarter = Math.floor(lastQuarterDate.getMonth() / 3) + 1;
        const lastQuarterYear = lastQuarterDate.getFullYear();
        filteredItems = filteredItems.filter(t => {
          const date = new Date(t.date);
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          return quarter === lastQuarter && date.getFullYear() === lastQuarterYear;
        });
        break;
      default: // All Time
        break;
    }

    return filteredItems;
  }, [transactions, reportFilter]);

  const sortedTransactions = React.useMemo(() => {
    let sortableItems = [...transactions];

    // First filter by date ranges if selected
    if (sortConfig.key === 'date' && ['today', 'this_week', 'last_week', 'last_month'].includes(sortConfig.direction)) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      sortableItems = sortableItems.filter(transaction => {
        const transactionDate = new Date(transaction.date);

        switch (sortConfig.direction) {
          case 'today':
            return transactionDate >= today;
          case 'this_week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            return transactionDate >= weekStart;
          case 'last_week':
            const lastWeekStart = new Date(today);
            lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
            const lastWeekEnd = new Date(today);
            lastWeekEnd.setDate(today.getDate() - today.getDay() - 1);
            return transactionDate >= lastWeekStart && transactionDate <= lastWeekEnd;
          case 'last_month':
            const lastMonth = new Date(today);
            lastMonth.setMonth(today.getMonth() - 1);
            return transactionDate >= lastMonth;
          default:
            return true;
        }
      });
    }

    // Then sort the filtered results
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (sortConfig.key === 'date' && typeof aValue === 'string' && typeof bValue === 'string') {
          const dateA = new Date(aValue);
          const dateB = new Date(bValue);

          if (sortConfig.direction === 'week') {
            // Group by week (Monday to Sunday)
            const getWeekStart = (date: Date) => {
              const d = new Date(date);
              const day = d.getDay();
              const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
              return new Date(d.setDate(diff));
            };
            const weekA = getWeekStart(dateA).getTime();
            const weekB = getWeekStart(dateB).getTime();
            return weekA - weekB;
          } else if (sortConfig.direction === 'month') {
            // Group by month
            const monthA = dateA.getFullYear() * 12 + dateA.getMonth();
            const monthB = dateB.getFullYear() * 12 + dateB.getMonth();
            return monthA - monthB;
          } else {
            // Regular date sorting
            return sortConfig.direction === 'asc'
              ? dateA.getTime() - dateB.getTime()
              : dateB.getTime() - dateA.getTime();
          }
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc'
            ? aValue - bValue
            : bValue - aValue;
        }

        return 0;
      });
    }
    return sortableItems;
  }, [transactions, sortConfig]);

  const SortableHeader = ({ columnKey, children }: { columnKey: keyof Transaction; children: React.ReactNode }) => (
    <th
      className="px-4 py-3 text-left text-sm font-medium text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors"
      onClick={() => handleSort(columnKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortConfig.key === columnKey && (
          <>
            {sortConfig.direction === 'asc' && <ChevronUp className="w-4 h-4" />}
            {sortConfig.direction === 'desc' && <ChevronDownIcon className="w-4 h-4" />}
            {sortConfig.direction === 'week' && <span className="text-xs font-bold">WK</span>}
            {sortConfig.direction === 'month' && <span className="text-xs font-bold">MO</span>}
          </>
        )}
      </div>
    </th>
  );

  const renderGridItem = (item: FileItem) => (
    <div
      key={item.id}
      className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors cursor-pointer group"
      onDoubleClick={() => item.type === 'folder' && setCurrentFolder(item.id)}
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
              <h1 className="text-2xl font-bold text-slate-800">Finance Management</h1>
              <p className="text-slate-600">Manage financial operations and documents</p>
            </div>
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
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold text-slate-800">
                      ${transactions
                        .filter(t => t.type === 'income')
                        .reduce((sum, t) => sum + t.amount, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Expenses</p>
                    <p className="text-2xl font-bold text-slate-800">
                      ${transactions
                        .filter(t => t.type === 'expense')
                        .reduce((sum, t) => sum + t.amount, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm">Profit Margin</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {(() => {
                        const totalRevenue = transactions
                          .filter(t => t.type === 'income')
                          .reduce((sum, t) => sum + t.amount, 0);
                        const totalExpenses = transactions
                          .filter(t => t.type === 'expense')
                          .reduce((sum, t) => sum + t.amount, 0);
                        const profit = totalRevenue - totalExpenses;
                        const margin = totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(1) : '0.0';
                        return `${margin}%`;
                      })()}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <PieChart className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
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

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
              <h2 className="text-lg font-semibold text-slate-800 mb-6">Financial Reports</h2>

              {/* Report Filters */}
              <div className="flex items-center space-x-4 mb-6">
                <select
                  value={reportFilter}
                  onChange={(e) => setReportFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>All Time</option>
                  <option>This Year</option>
                  <option>Last Year</option>
                  <option>This Quarter</option>
                  <option>Last Quarter</option>
                </select>
                <button
                  onClick={() => setShowAdvancedReport(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Generate Report
                </button>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Revenue Chart */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-800 mb-4">Monthly Revenue</h3>
                  <div className="h-64 bg-white rounded flex items-center justify-center relative">
                    <div className="relative w-48 h-48">
                      {(() => {
                        const monthlyData = getFilteredTransactionsForReports
                          .filter(t => t.type === 'income')
                          .reduce((acc, t) => {
                            const month = new Date(t.date).toLocaleDateString('en-US', { month: 'short' });
                            acc[month] = (acc[month] || 0) + t.amount;
                            return acc;
                          }, {} as Record<string, number>);

                        const total = Object.values(monthlyData).reduce((sum, val) => sum + val, 0);
                        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
                        let currentAngle = 0;

                        return (
                          <svg viewBox="0 0 200 200" className="w-full h-full">
                            {Object.entries(monthlyData).map(([month, amount], index) => {
                              const percentage = (amount / total) * 100;
                              const angle = (percentage / 100) * 360;
                              const startAngle = currentAngle;
                              const endAngle = currentAngle + angle;

                              const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
                              const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
                              const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
                              const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);

                              const largeArcFlag = angle > 180 ? 1 : 0;

                              currentAngle = endAngle;

                              return (
                                <path
                                  key={month}
                                  d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                                  fill={colors[index % colors.length]}
                                  stroke="white"
                                  strokeWidth="2"
                                />
                              );
                            })}
                            <circle cx="100" cy="100" r="40" fill="white" />
                            <text x="100" y="95" textAnchor="middle" className="text-sm font-semibold fill-slate-800">
                              ${total.toLocaleString()}
                            </text>
                            <text x="100" y="110" textAnchor="middle" className="text-xs fill-slate-600">
                              Total Revenue
                            </text>
                          </svg>
                        );
                      })()}
                    </div>
                    {/* Legend */}
                    <div className="absolute top-4 right-4 space-y-2">
                      {(() => {
                        const monthlyData = transactions
                          .filter(t => t.type === 'income')
                          .reduce((acc, t) => {
                            const month = new Date(t.date).toLocaleDateString('en-US', { month: 'short' });
                            acc[month] = (acc[month] || 0) + t.amount;
                            return acc;
                          }, {} as Record<string, number>);

                        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

                        return Object.entries(monthlyData).map(([month, amount], index) => (
                          <div key={month} className="flex items-center space-x-2 text-xs">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: colors[index % colors.length] }}
                            ></div>
                            <span className="text-slate-600">{month}: ${amount.toLocaleString()}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>

                {/* Service Performance */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-800 mb-4">Service Performance</h3>
                  <div className="space-y-3">
                    {(() => {
                      const serviceStats = getFilteredTransactionsForReports
                        .filter(t => t.type === 'income' && t.service)
                        .reduce((acc, t) => {
                          acc[t.service!] = (acc[t.service!] || 0) + t.amount;
                          return acc;
                        }, {} as Record<string, number>);

                      return Object.entries(serviceStats)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 5)
                        .map(([service, amount]) => (
                          <div key={service} className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">{service}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-slate-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{
                                    width: `${(amount / Math.max(...Object.values(serviceStats))) * 100}%`
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-slate-800">${amount.toLocaleString()}</span>
                            </div>
                          </div>
                        ));
                    })()}
                  </div>
                </div>

                {/* Quarterly Performance */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-800 mb-4">Quarterly Performance</h3>
                  <div className="space-y-3">
                    {['Q1', 'Q2', 'Q3', 'Q4'].map(quarter => {
                      const quarterAmount = getFilteredTransactionsForReports
                        .filter(t => t.type === 'income' && t.quarter === quarter)
                        .reduce((sum, t) => sum + t.amount, 0);

                      return (
                        <div key={quarter} className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">{quarter}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-slate-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{
                                  width: `${quarterAmount > 0 ? Math.min((quarterAmount / 50000) * 100, 100) : 0}%`
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-slate-800">${quarterAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Clients */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-slate-800 mb-4">Top Clients</h3>
                  <div className="space-y-3">
                    {(() => {
                      const clientStats = getFilteredTransactionsForReports
                        .filter(t => t.type === 'income' && t.client && t.service)
                        .reduce((acc, t) => {
                          const key = `${t.client}-${t.service}`;
                          if (!acc[key]) {
                            acc[key] = { client: t.client!, service: t.service!, amount: 0, count: 0 };
                          }
                          acc[key].amount += t.amount;
                          acc[key].count += 1;
                          return acc;
                        }, {} as Record<string, { client: string; service: string; amount: number; count: number }>);

                      return Object.entries(clientStats)
                        .sort(([,a], [,b]) => b.amount - a.amount)
                        .slice(0, 5)
                        .map(([key, data]) => {
                          const rate = data.count > 0 ? (data.amount / data.count).toFixed(0) : '0';
                          return (
                            <div key={key} className="flex items-center justify-between">
                              <div className="flex-1">
                                <span className="text-sm font-medium text-slate-800">{data.client}</span>
                                <div className="text-xs text-slate-500">{data.service} • Avg: ${rate}</div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-24 bg-slate-200 rounded-full h-2">
                                  <div
                                    className="bg-purple-600 h-2 rounded-full"
                                    style={{
                                      width: `${(data.amount / Math.max(...Object.values(clientStats).map(d => d.amount))) * 100}%`
                                    }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-slate-800">${data.amount.toLocaleString()}</span>
                              </div>
                            </div>
                          );
                        });
                    })()}
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-blue-600 font-medium">Total Transactions</p>
                  <p className="text-2xl font-bold text-blue-800">{getFilteredTransactionsForReports.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-green-600 font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-800">
                    ${getFilteredTransactionsForReports.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-red-600 font-medium">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-800">
                    ${getFilteredTransactionsForReports.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-purple-600 font-medium">Net Profit</p>
                  <p className="text-2xl font-bold text-purple-800">
                    ${(() => {
                      const revenue = getFilteredTransactionsForReports.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
                      const expenses = getFilteredTransactionsForReports.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
                      return (revenue - expenses).toLocaleString();
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-800">Transaction History</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        value={transactionSearchQuery}
                        onChange={(e) => setTransactionSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-slate-700 placeholder-slate-400"
                      />
                    </div>
                    <button
                      onClick={() => setShowIncomeModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Add Income</span>
                    </button>
                    <button
                      onClick={() => setShowExpenseModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                    >
                      <MinusCircle className="w-4 h-4" />
                      <span>Add Expense</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <SortableHeader columnKey="type">Type</SortableHeader>
                      <SortableHeader columnKey="client">Client</SortableHeader>
                      <SortableHeader columnKey="description">Description</SortableHeader>
                      <SortableHeader columnKey="service">Service</SortableHeader>
                      <SortableHeader columnKey="quarter">Quarter</SortableHeader>
                      <SortableHeader columnKey="amount">Amount</SortableHeader>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
                        <select
                          value={sortConfig.key === 'date' ? sortConfig.direction : ''}
                          onChange={(e) => {
                            const value = e.target.value as 'asc' | 'desc' | 'week' | 'month' | '';
                            if (value) {
                              setSortConfig({ key: 'date', direction: value });
                            } else {
                              setSortConfig({ key: null, direction: 'asc' });
                            }
                          }}
                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Date</option>
                          <option value="today">Today</option>
                          <option value="this_week">This Week</option>
                          <option value="last_week">Last Week</option>
                          <option value="last_month">Last Month</option>
                        </select>
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTransactions.filter(transaction =>
                      transaction.title.toLowerCase().includes(transactionSearchQuery.toLowerCase()) ||
                      transaction.description.toLowerCase().includes(transactionSearchQuery.toLowerCase()) ||
                      (transaction.client && transaction.client.toLowerCase().includes(transactionSearchQuery.toLowerCase())) ||
                      (transaction.service && transaction.service.toLowerCase().includes(transactionSearchQuery.toLowerCase()))
                    ).map((transaction) => (
                      <tr key={transaction.id} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.type === 'income'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type === 'income' ? (
                              <PlusCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <MinusCircle className="w-3 h-3 mr-1" />
                            )}
                            {transaction.type}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{transaction.client || '-'}</td>
                        <td className="px-4 py-3 text-slate-600">{transaction.description}</td>
                        <td className="px-4 py-3 text-slate-600">{transaction.service || '-'}</td>
                        <td className="px-4 py-3 text-slate-600">{transaction.quarter || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{transaction.date}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={() => editTransaction(transaction)}
                              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                              title="Edit transaction"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteTransaction(transaction.id)}
                              className="p-1 text-red-400 hover:text-red-600 transition-colors"
                              title="Delete transaction"
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

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/50">
              <h2 className="text-lg font-semibold text-slate-800 mb-6">Financial Analytics</h2>

              {/* Analytics Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Year-over-Year Trends */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Year-over-Year Company Performance</h3>
                  <div className="h-80 bg-white rounded flex items-center justify-center relative">
                    <div className="w-full h-full p-4">
                      {(() => {
                        const yearData = transactions.reduce((acc, t) => {
                          const year = new Date(t.date).getFullYear();
                          if (!acc[year]) acc[year] = { revenue: 0, expenses: 0 };
                          if (t.type === 'income') acc[year].revenue += t.amount;
                          else acc[year].expenses += t.amount;
                          return acc;
                        }, {} as Record<number, { revenue: number; expenses: number }>);

                        const years = Object.keys(yearData).map(Number).sort();
                        if (years.length === 0) return <p className="text-slate-500">No data available</p>;

                        const maxValue = Math.max(...years.flatMap(y => [yearData[y].revenue, yearData[y].expenses]));
                        const chartHeight = 250;
                        const chartWidth = 600;
                        const padding = 60;

                        return (
                          <svg viewBox={`0 0 ${chartWidth + padding * 2} ${chartHeight + padding * 2}`} className="w-full h-full">
                            {/* Grid lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                              <line
                                key={ratio}
                                x1={padding}
                                y1={padding + chartHeight - (chartHeight * ratio)}
                                x2={padding + chartWidth}
                                y2={padding + chartHeight - (chartHeight * ratio)}
                                stroke="#e2e8f0"
                                strokeWidth="1"
                              />
                            ))}

                            {/* Y-axis labels */}
                            {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                              <text
                                key={ratio}
                                x={padding - 10}
                                y={padding + chartHeight - (chartHeight * ratio) + 4}
                                textAnchor="end"
                                className="text-xs fill-slate-600"
                              >
                                ${(maxValue * ratio / 1000).toFixed(0)}k
                              </text>
                            ))}

                            {/* Revenue line */}
                            {years.map((year, index) => {
                              const x = padding + (index * chartWidth) / (years.length - 1);
                              const y = padding + chartHeight - (yearData[year].revenue / maxValue * chartHeight);
                              const nextIndex = index + 1;
                              if (nextIndex < years.length) {
                                const nextX = padding + (nextIndex * chartWidth) / (years.length - 1);
                                const nextY = padding + chartHeight - (yearData[years[nextIndex]].revenue / maxValue * chartHeight);
                                return (
                                  <line
                                    key={`revenue-${year}`}
                                    x1={x}
                                    y1={y}
                                    x2={nextX}
                                    y2={nextY}
                                    stroke="#10b981"
                                    strokeWidth="3"
                                  />
                                );
                              }
                              return null;
                            })}

                            {/* Expense line */}
                            {years.map((year, index) => {
                              const x = padding + (index * chartWidth) / (years.length - 1);
                              const y = padding + chartHeight - (yearData[year].expenses / maxValue * chartHeight);
                              const nextIndex = index + 1;
                              if (nextIndex < years.length) {
                                const nextX = padding + (nextIndex * chartWidth) / (years.length - 1);
                                const nextY = padding + chartHeight - (yearData[years[nextIndex]].expenses / maxValue * chartHeight);
                                return (
                                  <line
                                    key={`expense-${year}`}
                                    x1={x}
                                    y1={y}
                                    x2={nextX}
                                    y2={nextY}
                                    stroke="#ef4444"
                                    strokeWidth="3"
                                  />
                                );
                              }
                              return null;
                            })}

                            {/* Data points */}
                            {years.map((year, index) => {
                              const x = padding + (index * chartWidth) / (years.length - 1);
                              const revenueY = padding + chartHeight - (yearData[year].revenue / maxValue * chartHeight);
                              const expenseY = padding + chartHeight - (yearData[year].expenses / maxValue * chartHeight);

                              return (
                                <g key={`points-${year}`}>
                                  <circle cx={x} cy={revenueY} r="4" fill="#10b981" />
                                  <circle cx={x} cy={expenseY} r="4" fill="#ef4444" />
                                  <text x={x} y={padding + chartHeight + 20} textAnchor="middle" className="text-xs fill-slate-600">
                                    {year}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Legend */}
                            <g transform={`translate(${padding + chartWidth - 150}, ${padding})`}>
                              <line x1="0" y1="0" x2="20" y2="0" stroke="#10b981" strokeWidth="3" />
                              <text x="25" y="4" className="text-sm fill-slate-700">Revenue</text>
                              <line x1="0" y1="20" x2="20" y2="20" stroke="#ef4444" strokeWidth="3" />
                              <text x="25" y="24" className="text-sm fill-slate-700">Expenses</text>
                            </g>
                          </svg>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Quarterly Performance */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Quarterly Performance</h3>
                  <div className="h-64 bg-white rounded flex items-center justify-center relative">
                    <div className="w-full h-full p-4">
                      {(() => {
                        const quarterlyData = ['Q1', 'Q2', 'Q3', 'Q4'].map(quarter => ({
                          quarter,
                          revenue: transactions
                            .filter(t => t.type === 'income' && t.quarter === quarter)
                            .reduce((sum, t) => sum + t.amount, 0),
                          expenses: transactions
                            .filter(t => t.type === 'expense' && t.quarter === quarter)
                            .reduce((sum, t) => sum + t.amount, 0)
                        }));

                        const maxValue = Math.max(...quarterlyData.flatMap(q => [q.revenue, q.expenses]));
                        if (maxValue === 0) return <p className="text-slate-500">No quarterly data available</p>;

                        const barWidth = 40;
                        const gap = 20;
                        const groupWidth = (barWidth * 2) + gap;
                        const chartHeight = 200;
                        const chartWidth = groupWidth * 4;
                        const padding = 60;

                        return (
                          <svg viewBox={`0 0 ${chartWidth + padding * 2} ${chartHeight + padding * 2}`} className="w-full h-full">
                            {/* Grid lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                              <line
                                key={ratio}
                                x1={padding}
                                y1={padding + chartHeight - (chartHeight * ratio)}
                                x2={padding + chartWidth}
                                y2={padding + chartHeight - (chartHeight * ratio)}
                                stroke="#e2e8f0"
                                strokeWidth="1"
                              />
                            ))}

                            {/* Y-axis labels */}
                            {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                              <text
                                key={ratio}
                                x={padding - 10}
                                y={padding + chartHeight - (chartHeight * ratio) + 4}
                                textAnchor="end"
                                className="text-xs fill-slate-600"
                              >
                                ${(maxValue * ratio / 1000).toFixed(0)}k
                              </text>
                            ))}

                            {/* Bars */}
                            {quarterlyData.map((data, index) => {
                              const groupX = padding + index * groupWidth;
                              const revenueHeight = (data.revenue / maxValue) * chartHeight;
                              const expenseHeight = (data.expenses / maxValue) * chartHeight;

                              return (
                                <g key={data.quarter}>
                                  {/* Revenue bar */}
                                  <rect
                                    x={groupX}
                                    y={padding + chartHeight - revenueHeight}
                                    width={barWidth}
                                    height={revenueHeight}
                                    fill="#10b981"
                                    className="hover:opacity-80 transition-opacity"
                                  />
                                  {/* Expense bar */}
                                  <rect
                                    x={groupX + barWidth}
                                    y={padding + chartHeight - expenseHeight}
                                    width={barWidth}
                                    height={expenseHeight}
                                    fill="#ef4444"
                                    className="hover:opacity-80 transition-opacity"
                                  />
                                  {/* Quarter label */}
                                  <text
                                    x={groupX + barWidth}
                                    y={padding + chartHeight + 20}
                                    textAnchor="middle"
                                    className="text-xs fill-slate-600"
                                  >
                                    {data.quarter}
                                  </text>
                                  {/* Revenue value */}
                                  {data.revenue > 0 && (
                                    <text
                                      x={groupX + barWidth / 2}
                                      y={padding + chartHeight - revenueHeight - 5}
                                      textAnchor="middle"
                                      className="text-xs fill-slate-700 font-medium"
                                    >
                                      ${(data.revenue / 1000).toFixed(1)}k
                                    </text>
                                  )}
                                  {/* Expense value */}
                                  {data.expenses > 0 && (
                                    <text
                                      x={groupX + barWidth + barWidth / 2}
                                      y={padding + chartHeight - expenseHeight - 5}
                                      textAnchor="middle"
                                      className="text-xs fill-slate-700 font-medium"
                                    >
                                      ${(data.expenses / 1000).toFixed(1)}k
                                    </text>
                                  )}
                                </g>
                              );
                            })}

                            {/* Legend */}
                            <g transform={`translate(${padding + chartWidth - 120}, ${padding})`}>
                              <rect x="0" y="0" width="12" height="12" fill="#10b981" />
                              <text x="18" y="10" className="text-sm fill-slate-700">Revenue</text>
                              <rect x="0" y="18" width="12" height="12" fill="#ef4444" />
                              <text x="18" y="28" className="text-sm fill-slate-700">Expenses</text>
                            </g>
                          </svg>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Client Revenue Rates */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Client Revenue Rates</h3>
                  <div className="h-80 bg-white rounded flex items-center justify-center relative">
                    <div className="w-full h-full p-4">
                      {(() => {
                        const clientStats = transactions
                          .filter(t => t.type === 'income' && t.client && t.service)
                          .reduce((acc, t) => {
                            const key = `${t.client}-${t.service}`;
                            if (!acc[key]) {
                              acc[key] = { client: t.client!, service: t.service!, amount: 0, count: 0 };
                            }
                            acc[key].amount += t.amount;
                            acc[key].count += 1;
                            return acc;
                          }, {} as Record<string, { client: string; service: string; amount: number; count: number }>);

                        const clientRates = Object.entries(clientStats)
                          .map(([key, data]) => ({
                            client: data.client,
                            service: data.service,
                            rate: data.count > 0 ? data.amount / data.count : 0,
                            total: data.amount
                          }))
                          .sort((a, b) => b.rate - a.rate)
                          .slice(0, 8);

                        if (clientRates.length === 0) return <p className="text-slate-500">No client data available</p>;

                        const maxRate = Math.max(...clientRates.map(c => c.rate));
                        const chartHeight = 280;
                        const chartWidth = 600;
                        const barHeight = 25;
                        const gap = 8;
                        const padding = 120;

                        return (
                          <svg viewBox={`0 0 ${chartWidth + padding * 2} ${chartHeight + 40}`} className="w-full h-full">
                            {/* Grid lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                              <line
                                key={ratio}
                                x1={padding}
                                y1={20 + chartHeight - (chartHeight * ratio)}
                                x2={padding + chartWidth}
                                y2={20 + chartHeight - (chartHeight * ratio)}
                                stroke="#e2e8f0"
                                strokeWidth="1"
                              />
                            ))}

                            {/* X-axis labels */}
                            {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                              <text
                                key={ratio}
                                x={padding + (chartWidth * ratio)}
                                y={chartHeight + 35}
                                textAnchor="middle"
                                className="text-xs fill-slate-600"
                              >
                                ${(maxRate * ratio / 1000).toFixed(0)}k
                              </text>
                            ))}

                            {/* Bars */}
                            {clientRates.map((client, index) => {
                              const y = 20 + index * (barHeight + gap);
                              const barWidth = (client.rate / maxRate) * chartWidth;

                              return (
                                <g key={`${client.client}-${client.service}`}>
                                  {/* Background bar */}
                                  <rect
                                    x={padding}
                                    y={y}
                                    width={chartWidth}
                                    height={barHeight}
                                    fill="#f1f5f9"
                                    rx="2"
                                  />
                                  {/* Data bar */}
                                  <rect
                                    x={padding}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
                                    fill="#3b82f6"
                                    rx="2"
                                    className="hover:opacity-80 transition-opacity"
                                  />
                                  {/* Client label */}
                                  <text
                                    x={padding - 10}
                                    y={y + barHeight / 2 + 4}
                                    textAnchor="end"
                                    className="text-sm fill-slate-700 font-medium"
                                  >
                                    {client.client.length > 15 ? `${client.client.substring(0, 15)}...` : client.client}
                                  </text>
                                  {/* Service label */}
                                  <text
                                    x={padding - 10}
                                    y={y + barHeight / 2 + 16}
                                    textAnchor="end"
                                    className="text-xs fill-slate-500"
                                  >
                                    {client.service}
                                  </text>
                                  {/* Rate value */}
                                  <text
                                    x={padding + barWidth + 8}
                                    y={y + barHeight / 2 + 4}
                                    className="text-sm fill-slate-700 font-semibold"
                                  >
                                    ${client.rate.toLocaleString()}
                                  </text>
                                </g>
                              );
                            })}
                          </svg>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Top Expenses */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Expenses</h3>
                  <div className="h-80 bg-white rounded flex items-center justify-center relative">
                    <div className="w-full h-full p-4">
                      {(() => {
                        const expenseStats = transactions
                          .filter(t => t.type === 'expense')
                          .reduce((acc, t) => {
                            const category = t.title || 'Other';
                            acc[category] = (acc[category] || 0) + t.amount;
                            return acc;
                          }, {} as Record<string, number>);

                        const topExpenses = Object.entries(expenseStats)
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 8);

                        if (topExpenses.length === 0) return <p className="text-slate-500">No expense data available</p>;

                        const maxAmount = Math.max(...topExpenses.map(([, amount]) => amount));
                        const chartHeight = 280;
                        const chartWidth = 600;
                        const barHeight = 25;
                        const gap = 8;
                        const padding = 120;

                        return (
                          <svg viewBox={`0 0 ${chartWidth + padding * 2} ${chartHeight + 40}`} className="w-full h-full">
                            {/* Grid lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                              <line
                                key={ratio}
                                x1={padding}
                                y1={20 + chartHeight - (chartHeight * ratio)}
                                x2={padding + chartWidth}
                                y2={20 + chartHeight - (chartHeight * ratio)}
                                stroke="#e2e8f0"
                                strokeWidth="1"
                              />
                            ))}

                            {/* X-axis labels */}
                            {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                              <text
                                key={ratio}
                                x={padding + (chartWidth * ratio)}
                                y={chartHeight + 35}
                                textAnchor="middle"
                                className="text-xs fill-slate-600"
                              >
                                ${(maxAmount * ratio / 1000).toFixed(0)}k
                              </text>
                            ))}

                            {/* Bars */}
                            {topExpenses.map(([category, amount], index) => {
                              const y = 20 + index * (barHeight + gap);
                              const barWidth = (amount / maxAmount) * chartWidth;

                              return (
                                <g key={category}>
                                  {/* Background bar */}
                                  <rect
                                    x={padding}
                                    y={y}
                                    width={chartWidth}
                                    height={barHeight}
                                    fill="#fef2f2"
                                    rx="2"
                                  />
                                  {/* Data bar */}
                                  <rect
                                    x={padding}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
                                    fill="#ef4444"
                                    rx="2"
                                    className="hover:opacity-80 transition-opacity"
                                  />
                                  {/* Category label */}
                                  <text
                                    x={padding - 10}
                                    y={y + barHeight / 2 + 4}
                                    textAnchor="end"
                                    className="text-sm fill-slate-700 font-medium"
                                  >
                                    {category.length > 20 ? `${category.substring(0, 20)}...` : category}
                                  </text>
                                  {/* Amount value */}
                                  <text
                                    x={padding + barWidth + 8}
                                    y={y + barHeight / 2 + 4}
                                    className="text-sm fill-slate-700 font-semibold"
                                  >
                                    ${amount.toLocaleString()}
                                  </text>
                                </g>
                              );
                            })}
                          </svg>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Income Modal */}
        {showIncomeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Add Income</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
                  <input
                    type="text"
                    value={newTransaction.client}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, client: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Service</label>
                  <div className="flex space-x-2">
                    <select
                      value={newTransaction.service}
                      onChange={(e) => setNewTransaction(prev => ({ ...prev, service: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select service</option>
                      {services.map(service => (
                        <option key={service} value={service}>{service}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowAddService(true)}
                      className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                      title="Add new service"
                    >
                      +
                    </button>
                    <button
                      onClick={() => {
                        if (newTransaction.service && services.includes(newTransaction.service)) {
                          setServices(prev => prev.filter(s => s !== newTransaction.service));
                          setNewTransaction(prev => ({ ...prev, service: '' }));
                        }
                      }}
                      className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete selected service"
                      disabled={!newTransaction.service || !services.includes(newTransaction.service)}
                    >
                      -
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={newTransaction.year}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter year"
                    min="2000"
                    max="2050"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quarter</label>
                  <select
                    value={newTransaction.quarter}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, quarter: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select quarter</option>
                    <option value="Q1">Q1</option>
                    <option value="Q2">Q2</option>
                    <option value="Q3">Q3</option>
                    <option value="Q4">Q4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={newTransaction.year}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter year"
                    min="2000"
                    max="2050"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => addTransaction('income')}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowIncomeModal(false);
                    setNewTransaction({ title: '', description: '', amount: '', client: '', service: '', quarter: '', year: new Date().getFullYear().toString() });
                  }}
                  className="flex-1 bg-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expense Modal */}
        {showExpenseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Add Expense</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newTransaction.title}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter expense title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={newTransaction.year}
                    onChange={(e) => setNewTransaction(prev => ({ ...prev, year: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter year"
                    min="2000"
                    max="2050"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => addTransaction('expense')}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Add Expense
                </button>
                <button
                  onClick={() => {
                    setShowExpenseModal(false);
                    setNewTransaction({ title: '', description: '', amount: '', client: '', service: '', quarter: '', year: new Date().getFullYear().toString() });
                  }}
                  className="flex-1 bg-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Transaction Modal */}
        {showEditModal && editingTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Edit Transaction</h3>
              <div className="space-y-4">
                {editingTransaction.type === 'income' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
                      <input
                        type="text"
                        value={newTransaction.client}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, client: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter client name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Service</label>
                      <div className="flex space-x-2">
                        <select
                          value={newTransaction.service}
                          onChange={(e) => setNewTransaction(prev => ({ ...prev, service: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select service</option>
                          {services.map(service => (
                            <option key={service} value={service}>{service}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => setShowAddService(true)}
                          className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                          title="Add new service"
                        >
                          +
                        </button>
                        <button
                          onClick={() => {
                            if (newTransaction.service && services.includes(newTransaction.service)) {
                              setServices(prev => prev.filter(s => s !== newTransaction.service));
                              setNewTransaction(prev => ({ ...prev, service: '' }));
                            }
                          }}
                          className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="Delete selected service"
                          disabled={!newTransaction.service || !services.includes(newTransaction.service)}
                        >
                          -
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={newTransaction.description}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                      <input
                        type="number"
                        value={newTransaction.amount}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter amount"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Quarter</label>
                      <select
                        value={newTransaction.quarter}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, quarter: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select quarter</option>
                        <option value="Q1">Q1</option>
                        <option value="Q2">Q2</option>
                        <option value="Q3">Q3</option>
                        <option value="Q4">Q4</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                      <input
                        type="number"
                        value={newTransaction.year}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, year: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter year"
                        min="2000"
                        max="2050"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={newTransaction.title}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter expense title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={newTransaction.description}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                      <input
                        type="number"
                        value={newTransaction.amount}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter amount"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                      <input
                        type="number"
                        value={newTransaction.year}
                        onChange={(e) => setNewTransaction(prev => ({ ...prev, year: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter year"
                        min="2000"
                        max="2050"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={updateTransaction}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Update
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTransaction(null);
                    setNewTransaction({ title: '', description: '', amount: '', client: '', service: '', quarter: '', year: new Date().getFullYear().toString() });
                  }}
                  className="flex-1 bg-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Report Modal */}
        {showAdvancedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-slate-800 mb-6">Advanced Report Generator</h3>

              <div className="space-y-6">
                {/* Quick Report Templates */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Quick Report Templates</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => setReportOptions({
                        includeOverview: false,
                        includeTransactions: false,
                        includeCharts: false,
                        includeServiceAnalysis: false,
                        includeClientAnalysis: false,
                        includeQuarterly: true,
                        format: 'pdf',
                        dateRange: 'current_filter'
                      })}
                      className="text-left p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="font-medium text-slate-800">Quarterly Performance Report</div>
                      <div className="text-sm text-slate-600">Revenue breakdown by quarters</div>
                    </button>
                    <button
                      onClick={() => setReportOptions({
                        includeOverview: false,
                        includeTransactions: false,
                        includeCharts: false,
                        includeServiceAnalysis: true,
                        includeClientAnalysis: false,
                        includeQuarterly: false,
                        format: 'excel',
                        dateRange: 'current_filter'
                      })}
                      className="text-left p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="font-medium text-slate-800">Service Performance Analysis</div>
                      <div className="text-sm text-slate-600">Top performing services and revenue</div>
                    </button>
                    <button
                      onClick={() => setReportOptions({
                        includeOverview: false,
                        includeTransactions: true,
                        includeCharts: false,
                        includeServiceAnalysis: false,
                        includeClientAnalysis: false,
                        includeQuarterly: false,
                        format: 'csv',
                        dateRange: 'current_filter'
                      })}
                      className="text-left p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="font-medium text-slate-800">Transaction History Export</div>
                      <div className="text-sm text-slate-600">Complete list of all transactions</div>
                    </button>
                    <button
                      onClick={() => setReportOptions({
                        includeOverview: false,
                        includeTransactions: false,
                        includeCharts: true,
                        includeServiceAnalysis: false,
                        includeClientAnalysis: false,
                        includeQuarterly: false,
                        format: 'pdf',
                        dateRange: 'this_year'
                      })}
                      className="text-left p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="font-medium text-slate-800">Monthly Revenue Since Year Start</div>
                      <div className="text-sm text-slate-600">Revenue charts from January to current month</div>
                    </button>
                  </div>
                </div>

                {/* Report Sections */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Custom Report Sections</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={reportOptions.includeOverview}
                        onChange={(e) => setReportOptions(prev => ({ ...prev, includeOverview: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600">Financial Overview</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={reportOptions.includeTransactions}
                        onChange={(e) => setReportOptions(prev => ({ ...prev, includeTransactions: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600">Transaction Details</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={reportOptions.includeCharts}
                        onChange={(e) => setReportOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600">Revenue Charts</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={reportOptions.includeServiceAnalysis}
                        onChange={(e) => setReportOptions(prev => ({ ...prev, includeServiceAnalysis: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600">Service Analysis</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={reportOptions.includeClientAnalysis}
                        onChange={(e) => setReportOptions(prev => ({ ...prev, includeClientAnalysis: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600">Client Analysis</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={reportOptions.includeQuarterly}
                        onChange={(e) => setReportOptions(prev => ({ ...prev, includeQuarterly: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600">Quarterly Breakdown</span>
                    </label>
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Date Range</h4>
                  <select
                    value={reportOptions.dateRange}
                    onChange={(e) => setReportOptions(prev => ({ ...prev, dateRange: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="current_filter">Use Current Filter ({reportFilter})</option>
                    <option value="all_time">All Time</option>
                    <option value="this_year">This Year</option>
                    <option value="last_year">Last Year</option>
                    <option value="this_quarter">This Quarter</option>
                    <option value="last_quarter">Last Quarter</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {/* Export Format */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Export Format</h4>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="format"
                        value="pdf"
                        checked={reportOptions.format === 'pdf'}
                        onChange={(e) => setReportOptions(prev => ({ ...prev, format: e.target.value as 'pdf' | 'excel' | 'csv' }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600">PDF Report</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="format"
                        value="excel"
                        checked={reportOptions.format === 'excel'}
                        onChange={(e) => setReportOptions(prev => ({ ...prev, format: e.target.value as 'pdf' | 'excel' | 'csv' }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600">Excel Spreadsheet</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="format"
                        value="csv"
                        checked={reportOptions.format === 'csv'}
                        onChange={(e) => setReportOptions(prev => ({ ...prev, format: e.target.value as 'pdf' | 'excel' | 'csv' }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600">CSV Data</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <button
                  onClick={() => {
                    // Generate report based on selected options
                    generateAdvancedReport();
                    setShowAdvancedReport(false);
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Generate & Download
                </button>
                <button
                  onClick={() => setShowAdvancedReport(false)}
                  className="flex-1 bg-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Service Modal */}
        {showAddService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Add New Service</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Service Name</label>
                  <input
                    type="text"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter service name"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    if (newService.trim()) {
                      setServices(prev => [...prev, newService.trim()]);
                      setNewService('');
                      setShowAddService(false);
                    }
                  }}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Service
                </button>
                <button
                  onClick={() => {
                    setShowAddService(false);
                    setNewService('');
                  }}
                  className="flex-1 bg-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && deleteItemToConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Confirm Delete</h3>
              <div className="space-y-4">
                <p className="text-slate-600">
                  Are you sure you want to delete "{deleteItemToConfirm.name}"?
                  {deleteItemToConfirm.type === 'folder' && deleteItemToConfirm.children && deleteItemToConfirm.children.length > 0 && (
                    <span className="text-red-600 font-medium"> This will also delete all contents inside the folder.</span>
                  )}
                </p>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Type "delete" to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Type delete to confirm"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={confirmDeleteItem}
                  disabled={deleteConfirmText !== 'delete'}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteItemToConfirm(null);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 bg-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Transaction Confirmation Modal */}
        {showDeleteTransactionConfirm && deleteTransactionToConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Confirm Delete Transaction</h3>
              <div className="space-y-4">
                <p className="text-slate-600">
                  Are you sure you want to delete this transaction?
                </p>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="font-medium text-slate-800">{deleteTransactionToConfirm.title}</p>
                  <p className="text-sm text-slate-600">{deleteTransactionToConfirm.description}</p>
                  <p className="text-sm text-slate-500">
                    {deleteTransactionToConfirm.type === 'income' ? '+' : '-'}${deleteTransactionToConfirm.amount.toLocaleString()} • {deleteTransactionToConfirm.date}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Type "delete" to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteTransactionConfirmText}
                    onChange={(e) => setDeleteTransactionConfirmText(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Type delete to confirm"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={confirmDeleteTransaction}
                  disabled={deleteTransactionConfirmText !== 'delete'}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
                >
                  Delete Transaction
                </button>
                <button
                  onClick={() => {
                    setShowDeleteTransactionConfirm(false);
                    setDeleteTransactionToConfirm(null);
                    setDeleteTransactionConfirmText('');
                  }}
                  className="flex-1 bg-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}