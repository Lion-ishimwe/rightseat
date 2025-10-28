'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Image, Video, Plus, Edit, Trash2, Search, Upload, FolderOpen, Bell, Clock, Users, MapPin, FileText, Settings, LogOut, Folder, Download, Copy, Scissors, Clipboard } from 'lucide-react';
import { getAuthUser, clearAuthData } from '../../lib/auth';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location?: string;
  attendees?: string;
  reminder: boolean;
  reminderDate?: string;
  category: 'meeting' | 'conference' | 'training' | 'social' | 'other';
}

interface MediaFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  children?: MediaFolder[];
}

interface MediaItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  url: string;
  size: number;
  uploadedAt: string;
  folderId: string;
}

export default function CommsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('events');
  const [authUser, setAuthUser] = useState<any>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  // Events state
  const [events, setEvents] = useState<Event[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('commsEvents');
      return saved ? JSON.parse(saved) : [
        {
          id: 1,
          title: 'Team Building Workshop',
          description: 'Quarterly team building session for all departments',
          date: '2024-12-20',
          time: '10:00 AM',
          location: 'Conference Room A',
          attendees: 'All Staff',
          reminder: true,
          reminderDate: '2024-12-19',
          category: 'training'
        },
        {
          id: 2,
          title: 'Company Holiday Party',
          description: 'Annual holiday celebration and awards ceremony',
          date: '2024-12-22',
          time: '6:00 PM',
          location: 'Grand Ballroom',
          attendees: 'All Staff & Families',
          reminder: true,
          reminderDate: '2024-12-15',
          category: 'social'
        }
      ];
    }
    return [];
  });

  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    attendees: '',
    reminder: false,
    reminderDate: '',
    category: 'meeting' as Event['category']
  });

  // Media state
  const [mediaFolders, setMediaFolders] = useState<MediaFolder[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('commsMediaFolders');
      return saved ? JSON.parse(saved) : [
        {
          id: 'root',
          name: 'Media Library',
          parentId: null,
          createdAt: new Date().toISOString(),
          children: []
        }
      ];
    }
    return [{
      id: 'root',
      name: 'Media Library',
      parentId: null,
      createdAt: new Date().toISOString(),
      children: []
    }];
  });

  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('commsMedia');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteItemToConfirm, setDeleteItemToConfirm] = useState<MediaItem | MediaFolder | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedItems, setSelectedItems] = useState<(MediaItem | MediaFolder)[]>([]);
  const [draggedItem, setDraggedItem] = useState<MediaItem | MediaFolder | null>(null);
  const [clipboard, setClipboard] = useState<{
    items: (MediaItem | MediaFolder)[];
    operation: 'copy' | 'cut' | null;
  }>({ items: [], operation: null });
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: MediaItem | MediaFolder | null;
    type: 'file' | 'folder' | 'background';
  } | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [itemToRename, setItemToRename] = useState<MediaItem | MediaFolder | null>(null);
  const [newItemName, setNewItemName] = useState('');

  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');

  // Settings state
  interface Settings {
    defaultEventReminder: boolean;
    autoSaveDrafts: boolean;
    defaultUploadFolder: string;
    showFilePreviews: boolean;
    emailNotifications: boolean;
    browserNotifications: boolean;
  }

  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('commsSettings');
      return saved ? JSON.parse(saved) : {
        defaultEventReminder: false,
        autoSaveDrafts: true,
        defaultUploadFolder: 'root',
        showFilePreviews: true,
        emailNotifications: true,
        browserNotifications: false
      };
    }
    return {
      defaultEventReminder: false,
      autoSaveDrafts: true,
      defaultUploadFolder: 'root',
      showFilePreviews: true,
      emailNotifications: true,
      browserNotifications: false
    };
  });

  const tabs = [
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'media', label: 'Media Library', icon: Image },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Authentication check
  useEffect(() => {
    const user = getAuthUser();
    if (!user || !user.permissions.includes('comms_module_access')) {
      router.push('/login');
      return;
    }
    setAuthUser(user);
  }, [router]);

  // Save events to localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('commsEvents', JSON.stringify(events));
    }
  }, [events]);

  // Save media folders to localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('commsMediaFolders', JSON.stringify(mediaFolders));
    }
  }, [mediaFolders]);

  // Save media to localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('commsMedia', JSON.stringify(mediaItems));
    }
  }, [mediaItems]);

  // Save settings to localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('commsSettings', JSON.stringify(settings));
    }
  }, [settings]);

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

  // Event management functions
  const addEvent = () => {
    if (!newEvent.title.trim() || !newEvent.date || !newEvent.time) {
      alert('Please fill in all required fields: Title, Date, and Time');
      return;
    }

    const event: Event = {
      id: Date.now(),
      title: newEvent.title,
      description: newEvent.description,
      date: newEvent.date,
      time: newEvent.time,
      location: newEvent.location || undefined,
      attendees: newEvent.attendees || undefined,
      reminder: newEvent.reminder,
      reminderDate: newEvent.reminder ? newEvent.reminderDate : undefined,
      category: newEvent.category
    };

    setEvents(prev => [event, ...prev]);
    setNewEvent({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      attendees: '',
      reminder: false,
      reminderDate: '',
      category: 'meeting'
    });
    setShowEventModal(false);
  };

  const editEvent = (event: Event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location || '',
      attendees: event.attendees || '',
      reminder: event.reminder,
      reminderDate: event.reminderDate || '',
      category: event.category
    });
    setShowEventModal(true);
  };

  const updateEvent = () => {
    if (!editingEvent || !newEvent.title.trim() || !newEvent.date || !newEvent.time) {
      alert('Please fill in all required fields');
      return;
    }

    const updatedEvent: Event = {
      ...editingEvent,
      title: newEvent.title,
      description: newEvent.description,
      date: newEvent.date,
      time: newEvent.time,
      location: newEvent.location || undefined,
      attendees: newEvent.attendees || undefined,
      reminder: newEvent.reminder,
      reminderDate: newEvent.reminder ? newEvent.reminderDate : undefined,
      category: newEvent.category
    };

    setEvents(prev => prev.map(e => e.id === editingEvent.id ? updatedEvent : e));
    setNewEvent({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      attendees: '',
      reminder: false,
      reminderDate: '',
      category: 'meeting'
    });
    setEditingEvent(null);
    setShowEventModal(false);
  };

  const deleteEvent = (id: number) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  // Media management functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const newMediaItems: MediaItem[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document',
      url: URL.createObjectURL(file), // In a real app, this would be uploaded to a server
      size: file.size,
      uploadedAt: new Date().toISOString(),
      folderId: currentFolderId
    }));

    setMediaItems(prev => [...prev, ...newMediaItems]);
    setSelectedFiles([]);
    setShowUploadModal(false);
  };


  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(eventSearchQuery.toLowerCase())
  );

  const filteredMedia = mediaItems.filter(item =>
    item.name.toLowerCase().includes(mediaSearchQuery.toLowerCase()) &&
    item.folderId === currentFolderId
  );

  const getCurrentFolder = (): MediaFolder | null => {
    const findFolder = (folders: MediaFolder[], id: string): MediaFolder | null => {
      for (const folder of folders) {
        if (folder.id === id) return folder;
        if (folder.children) {
          const found = findFolder(folder.children, id);
          if (found) return found;
        }
      }
      return null;
    };
    return findFolder(mediaFolders, currentFolderId);
  };

  const getFolderPath = (): MediaFolder[] => {
    const path: MediaFolder[] = [];
    let current = getCurrentFolder();
    while (current) {
      path.unshift(current);
      if (current.parentId) {
        const findParent = (folders: MediaFolder[], id: string): MediaFolder | null => {
          for (const folder of folders) {
            if (folder.id === id) return folder;
            if (folder.children) {
              const found = findParent(folder.children, id);
              if (found) return found;
            }
          }
          return null;
        };
        current = findParent(mediaFolders, current.parentId);
      } else {
        break;
      }
    }
    return path;
  };

  const createFolder = () => {
    if (!newFolderName.trim()) return;

    const newFolder: MediaFolder = {
      id: Math.random().toString(36).substr(2, 9),
      name: newFolderName.trim(),
      parentId: currentFolderId,
      createdAt: new Date().toISOString(),
      children: []
    };

    const addFolderToParent = (folders: MediaFolder[], parentId: string, newFolder: MediaFolder): MediaFolder[] => {
      return folders.map(folder => {
        if (folder.id === parentId) {
          return {
            ...folder,
            children: [...(folder.children || []), newFolder]
          };
        } else if (folder.children) {
          return {
            ...folder,
            children: addFolderToParent(folder.children, parentId, newFolder)
          };
        }
        return folder;
      });
    };

    setMediaFolders(prev => addFolderToParent(prev, currentFolderId, newFolder));
    setNewFolderName('');
    setShowCreateFolderModal(false);
  };

  const findFolderById = (folders: MediaFolder[], id: string): MediaFolder | null => {
    for (const folder of folders) {
      if (folder.id === id) return folder;
      if (folder.children) {
        const found = findFolderById(folder.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const deleteFolder = (folderId: string) => {
    const folder = findFolderById(mediaFolders, folderId);
    if (folder) {
      setDeleteItemToConfirm(folder);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDeleteFolder = () => {
    if (!deleteItemToConfirm || deleteConfirmText !== 'delete') return;

    const folderId = (deleteItemToConfirm as MediaFolder).id;

    const deleteRecursive = (folders: MediaFolder[]): MediaFolder[] => {
      return folders.filter(folder => {
        if (folder.id === folderId) return false;
        if (folder.children) {
          folder.children = deleteRecursive(folder.children);
        }
        return true;
      });
    };

    // Also delete all media items in this folder and subfolders
    const deleteMediaRecursive = (folderId: string): void => {
      const folder = getCurrentFolder();
      if (folder) {
        // Delete media in current folder
        setMediaItems(prev => prev.filter(item => item.folderId !== folderId));

        // Delete media in subfolders
        if (folder.children) {
          folder.children.forEach(child => deleteMediaRecursive(child.id));
        }
      }
    };

    deleteMediaRecursive(folderId);
    setMediaFolders(prev => deleteRecursive(prev));

    // If we're deleting the current folder, go back to root
    if (currentFolderId === folderId) {
      setCurrentFolderId('root');
    }

    setShowDeleteConfirm(false);
    setDeleteItemToConfirm(null);
    setDeleteConfirmText('');
  };

  const deleteMediaItem = (id: string) => {
    const item = mediaItems.find(item => item.id === id);
    if (item) {
      setDeleteItemToConfirm(item);
      setShowDeleteConfirm(true);
    }
  };

  const openRenameModal = (item: MediaItem | MediaFolder) => {
    setItemToRename(item);
    setNewItemName('name' in item ? item.name : '');
    setShowRenameModal(true);
  };

  const confirmRename = () => {
    if (!itemToRename || !newItemName.trim()) return;

    if ('folderId' in itemToRename) {
      // It's a file
      setMediaItems(prev => prev.map(item =>
        item.id === itemToRename.id ? { ...item, name: newItemName.trim() } : item
      ));
    } else {
      // It's a folder
      const updateFolderName = (folders: MediaFolder[], folderId: string, newName: string): MediaFolder[] => {
        return folders.map(folder => {
          if (folder.id === folderId) {
            return { ...folder, name: newName };
          } else if (folder.children) {
            return {
              ...folder,
              children: updateFolderName(folder.children, folderId, newName)
            };
          }
          return folder;
        });
      };
      setMediaFolders(prev => updateFolderName(prev, itemToRename.id, newItemName.trim()));
    }

    setShowRenameModal(false);
    setItemToRename(null);
    setNewItemName('');
  };

  const confirmDeleteMediaItem = () => {
    if (!deleteItemToConfirm || deleteConfirmText !== 'delete') return;

    const itemId = (deleteItemToConfirm as MediaItem).id;
    setMediaItems(prev => prev.filter(item => item.id !== itemId));

    setShowDeleteConfirm(false);
    setDeleteItemToConfirm(null);
    setDeleteConfirmText('');
  };

  const getCurrentFolderContents = () => {
    const currentFolder = getCurrentFolder();
    if (!currentFolder) return { folders: [], files: [] };

    const childFolders = currentFolder.children || [];
    const files = filteredMedia;

    return { folders: childFolders, files };
  };

  // Clipboard operations
  const copyItems = (items: (MediaItem | MediaFolder)[]) => {
    setClipboard({ items: [...items], operation: 'copy' });
  };

  const cutItems = (items: (MediaItem | MediaFolder)[]) => {
    setClipboard({ items: [...items], operation: 'cut' });
  };

  const pasteItems = () => {
    if (!clipboard.items.length || !clipboard.operation) return;

    if (clipboard.operation === 'copy') {
      // Copy operation
      clipboard.items.forEach(item => {
        if ('folderId' in item) {
          // It's a file
          const newFile: MediaItem = {
            ...item,
            id: Math.random().toString(36).substr(2, 9),
            folderId: currentFolderId
          };
          setMediaItems(prev => [...prev, newFile]);
        } else {
          // It's a folder
          const newFolder: MediaFolder = {
            ...item,
            id: Math.random().toString(36).substr(2, 9),
            parentId: currentFolderId,
            name: `${item.name} (Copy)`,
            createdAt: new Date().toISOString(),
            children: []
          };
          const addFolderToParent = (folders: MediaFolder[], parentId: string, newFolder: MediaFolder): MediaFolder[] => {
            return folders.map(folder => {
              if (folder.id === parentId) {
                return {
                  ...folder,
                  children: [...(folder.children || []), newFolder]
                };
              } else if (folder.children) {
                return {
                  ...folder,
                  children: addFolderToParent(folder.children, parentId, newFolder)
                };
              }
              return folder;
            });
          };
          setMediaFolders(prev => addFolderToParent(prev, currentFolderId, newFolder));
        }
      });
    } else if (clipboard.operation === 'cut') {
      // Move operation
      clipboard.items.forEach(item => {
        if ('folderId' in item) {
          // Move file
          setMediaItems(prev => prev.map(file =>
            file.id === item.id ? { ...file, folderId: currentFolderId } : file
          ));
        } else {
          // Move folder
          const updateFolderParent = (folders: MediaFolder[], folderId: string, newParentId: string): MediaFolder[] => {
            return folders.map(folder => {
              if (folder.id === folderId) {
                return { ...folder, parentId: newParentId };
              } else if (folder.children) {
                return {
                  ...folder,
                  children: updateFolderParent(folder.children, folderId, newParentId)
                };
              }
              return folder;
            });
          };
          setMediaFolders(prev => updateFolderParent(prev, item.id, currentFolderId));
        }
      });
      setClipboard({ items: [], operation: null });
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, item: MediaItem | MediaFolder) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    if (!draggedItem) return;

    if ('folderId' in draggedItem) {
      // Moving a file
      if (draggedItem.folderId !== targetFolderId) {
        setMediaItems(prev => prev.map(file =>
          file.id === draggedItem.id ? { ...file, folderId: targetFolderId } : file
        ));
      }
    } else {
      // Moving a folder
      if (draggedItem.id !== targetFolderId && draggedItem.parentId !== targetFolderId) {
        const updateFolderParent = (folders: MediaFolder[], folderId: string, newParentId: string): MediaFolder[] => {
          return folders.map(folder => {
            if (folder.id === folderId) {
              return { ...folder, parentId: newParentId };
            } else if (folder.children) {
              return {
                ...folder,
                children: updateFolderParent(folder.children, folderId, newParentId)
              };
            }
            return folder;
          });
        };
        setMediaFolders(prev => updateFolderParent(prev, draggedItem.id, targetFolderId));
      }
    }

    setDraggedItem(null);
  };

  const handleContextMenu = (e: React.MouseEvent, item: MediaItem | MediaFolder | null, type: 'file' | 'folder' | 'background') => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
      type
    });
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    if (contextMenu) {
      setContextMenu(null);
    }
    setSelectedItems([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-2xl font-bold text-slate-800 truncate">Communications Management</h1>
              <p className="text-sm md:text-base text-slate-600 truncate">Manage events, media, and communications</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 md:space-x-2 px-3 py-2 md:px-4 md:py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200/50">
        <div className="px-4 md:px-6">
          <nav className="flex space-x-4 md:space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1 md:space-x-2 py-3 md:py-4 px-2 border-b-2 font-medium text-xs md:text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-3 h-3 md:w-4 md:h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="p-4 md:p-6">
        {activeTab === 'events' && (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200/50">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-6 gap-4">
                <h2 className="text-base md:text-lg font-semibold text-slate-800">Event Management</h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-initial">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search events..."
                      value={eventSearchQuery}
                      onChange={(e) => setEventSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-slate-700 placeholder-slate-400 text-sm md:text-base"
                    />
                  </div>
                  <button
                    onClick={() => setShowEventModal(true)}
                    className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm md:text-base"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add Event</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <div key={event.id.toString()} className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold text-slate-800">{event.title}</h3>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            event.category === 'meeting' ? 'bg-blue-100 text-blue-800' :
                            event.category === 'conference' ? 'bg-purple-100 text-purple-800' :
                            event.category === 'training' ? 'bg-green-100 text-green-800' :
                            event.category === 'social' ? 'bg-pink-100 text-pink-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {event.category}
                          </span>
                          {event.reminder && (
                            <Bell className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                        <p className="text-slate-600 text-sm mb-2">{event.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{event.time}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.attendees && (
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{event.attendees}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => editEvent(event)}
                          className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                          title="Edit event"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="p-2 text-red-400 hover:text-red-600 transition-colors"
                          title="Delete event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredEvents.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No events found</p>
                    <p className="text-slate-400 text-sm">Create your first event to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'media' && (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200/50">
              {/* Breadcrumb Navigation */}
              <div className="flex items-center space-x-2 mb-4 overflow-x-auto">
                {getFolderPath().map((folder, index) => (
                  <React.Fragment key={folder.id}>
                    {index > 0 && <span className="text-slate-400">/</span>}
                    <button
                      onClick={() => setCurrentFolderId(folder.id)}
                      className={`text-sm whitespace-nowrap ${
                        folder.id === currentFolderId
                          ? 'text-blue-600 font-medium'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      {folder.name}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-6 gap-4">
                <h2 className="text-base md:text-lg font-semibold text-slate-800">
                  {getCurrentFolder()?.name || 'Media Library'}
                </h2>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-initial">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search media..."
                      value={mediaSearchQuery}
                      onChange={(e) => setMediaSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 text-slate-700 placeholder-slate-400 text-sm md:text-base"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowCreateFolderModal(true)}
                      className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-colors text-sm md:text-base"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">New Folder</span>
                    </button>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm md:text-base"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="hidden sm:inline">Upload Media</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* New Folder Input */}
              {showCreateFolderModal && (
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
                      setShowCreateFolderModal(false);
                      setNewFolderName('');
                    }}
                    className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4"
                onContextMenu={(e) => handleContextMenu(e, null, 'background')}
                onDrop={(e) => handleDrop(e, currentFolderId)}
                onDragOver={handleDragOver}
              >
                {/* Folders */}
                {getCurrentFolderContents().folders.map((folder) => (
                  <div
                    key={folder.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, folder)}
                    onDrop={(e) => handleDrop(e, folder.id)}
                    onDragOver={handleDragOver}
                    className={`bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors cursor-pointer group ${
                      selectedItems.includes(folder) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onDoubleClick={() => setCurrentFolderId(folder.id)}
                    onContextMenu={(e) => handleContextMenu(e, folder, 'folder')}
                    onClick={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        setSelectedItems(prev =>
                          prev.includes(folder)
                            ? prev.filter(item => item !== folder)
                            : [...prev, folder]
                        );
                      } else {
                        setSelectedItems([folder]);
                      }
                    }}
                  >
                    <div className="aspect-square bg-blue-100 rounded-lg mb-3 flex items-center justify-center relative">
                      <Folder className="w-8 h-8 text-blue-600" />
                      <div className="absolute top-2 right-2 opacity-100 transition-opacity flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openRenameModal(folder);
                          }}
                          className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                          title="Rename folder"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFolder(folder.id);
                          }}
                          className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          title="Delete folder"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-800 truncate">{folder.name}</p>
                      <p className="text-xs text-slate-500">
                        {folder.children?.length || 0} folders, {filteredMedia.filter(item => item.folderId === folder.id).length} files
                      </p>
                    </div>
                  </div>
                ))}

                {/* Files */}
                {getCurrentFolderContents().files.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    className={`bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors group ${
                      selectedItems.includes(item) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onContextMenu={(e) => handleContextMenu(e, item, 'file')}
                    onClick={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        setSelectedItems(prev =>
                          prev.includes(item)
                            ? prev.filter(i => i !== item)
                            : [...prev, item]
                        );
                      } else {
                        setSelectedItems([item]);
                      }
                    }}
                  >
                    <div className="aspect-square bg-slate-200 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                      {item.type === 'image' && (
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                      )}
                      {item.type === 'video' && (
                        <Video className="w-8 h-8 text-slate-600" />
                      )}
                      {item.type === 'document' && (
                        <FileText className="w-8 h-8 text-slate-600" />
                      )}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openRenameModal(item);
                          }}
                          className="p-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                          title="Rename file"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Download functionality
                            const link = document.createElement('a');
                            link.href = item.url;
                            link.download = item.name;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                          title="Download"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMediaItem(item.id);
                          }}
                          className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          title="Delete file"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                      <p className="text-xs text-slate-500">{(item.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                ))}

                {getCurrentFolderContents().folders.length === 0 && getCurrentFolderContents().files.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <FolderOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">This folder is empty</p>
                    <p className="text-slate-400 text-sm">Create folders or upload files to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-800">Calendar View</h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setCalendarView('month')}
                    className={`px-3 py-1 rounded ${calendarView === 'month' ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setCalendarView('week')}
                    className={`px-3 py-1 rounded ${calendarView === 'week' ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setCalendarView('day')}
                    className={`px-3 py-1 rounded ${calendarView === 'day' ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    Day
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                    className="p-2 hover:bg-slate-200 rounded"
                  >
                    ‹
                  </button>
                  <h3 className="text-lg font-semibold text-slate-800">
                    {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                    className="p-2 hover:bg-slate-200 rounded"
                  >
                    ›
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-slate-600">
                      {day}
                    </div>
                  ))}

                  {getDaysInMonth(currentDate).map((date, index) => (
                    <div
                      key={index}
                      className={`min-h-24 p-2 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors ${
                        date ? 'bg-white' : 'bg-slate-100'
                      }`}
                      onClick={() => date && setSelectedDate(date)}
                    >
                      {date && (
                        <>
                          <div className="text-sm font-medium text-slate-800 mb-1">
                            {date.getDate()}
                          </div>
                          <div className="space-y-1">
                            {getEventsForDate(date).slice(0, 2).map(event => (
                              <div
                                key={event.id}
                                className={`text-xs p-1 rounded truncate ${
                                  event.category === 'meeting' ? 'bg-blue-100 text-blue-800' :
                                  event.category === 'conference' ? 'bg-purple-100 text-purple-800' :
                                  event.category === 'training' ? 'bg-green-100 text-green-800' :
                                  event.category === 'social' ? 'bg-pink-100 text-pink-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}
                                title={event.title}
                              >
                                {event.title}
                              </div>
                            ))}
                            {getEventsForDate(date).length > 2 && (
                              <div className="text-xs text-slate-500">
                                +{getEventsForDate(date).length - 2} more
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedDate && (
                <div className="mt-6 bg-slate-50 rounded-lg p-4">
                  <h4 className="font-semibold text-slate-800 mb-4">
                    Events for {selectedDate.toLocaleDateString()}
                  </h4>
                  <div className="space-y-2">
                    {getEventsForDate(selectedDate).map(event => (
                      <div key={event.id} className="bg-white rounded p-3 border border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-slate-800">{event.title}</h5>
                            <p className="text-sm text-slate-600">{event.time} • {event.location}</p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            event.category === 'meeting' ? 'bg-blue-100 text-blue-800' :
                            event.category === 'conference' ? 'bg-purple-100 text-purple-800' :
                            event.category === 'training' ? 'bg-green-100 text-green-800' :
                            event.category === 'social' ? 'bg-pink-100 text-pink-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {event.category}
                          </span>
                        </div>
                      </div>
                    ))}
                    {getEventsForDate(selectedDate).length === 0 && (
                      <p className="text-slate-500 text-sm">No events scheduled for this date</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4 md:space-y-6">
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200/50">
              <h2 className="text-lg font-semibold text-slate-800 mb-6">Communications Settings</h2>
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-6">
                  <h3 className="text-md font-medium text-slate-800 mb-4">General Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Default Event Reminder</label>
                        <p className="text-xs text-slate-500">Automatically set reminders for new events</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.defaultEventReminder}
                        onChange={(e) => setSettings(prev => ({ ...prev, defaultEventReminder: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Auto-save Drafts</label>
                        <p className="text-xs text-slate-500">Automatically save event drafts</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.autoSaveDrafts}
                        onChange={(e) => setSettings(prev => ({ ...prev, autoSaveDrafts: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-b border-slate-200 pb-6">
                  <h3 className="text-md font-medium text-slate-800 mb-4">Media Library Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Default Upload Folder</label>
                      <select
                        value={settings.defaultUploadFolder}
                        onChange={(e) => setSettings(prev => ({ ...prev, defaultUploadFolder: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="root">Media Library Root</option>
                        <option value="current">Current Folder</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Show File Previews</label>
                        <p className="text-xs text-slate-500">Display image and video previews in the library</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.showFilePreviews}
                        onChange={(e) => setSettings(prev => ({ ...prev, showFilePreviews: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-b border-slate-200 pb-6">
                  <h3 className="text-md font-medium text-slate-800 mb-4">Notification Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Email Notifications</label>
                        <p className="text-xs text-slate-500">Receive email notifications for events</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-slate-700">Browser Notifications</label>
                        <p className="text-xs text-slate-500">Show browser notifications for reminders</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.browserNotifications}
                        onChange={(e) => setSettings(prev => ({ ...prev, browserNotifications: e.target.checked }))}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-b border-slate-200 pb-6">
                  <h3 className="text-md font-medium text-slate-800 mb-4">Account Settings</h3>
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowPasswordChange(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Change Password
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-medium text-slate-800 mb-4">Data Management</h3>
                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        const data = {
                          events,
                          mediaFolders,
                          mediaItems,
                          settings
                        };
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `comms-backup-${new Date().toISOString().split('T')[0]}.json`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Export All Data
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
                          setEvents([]);
                          setMediaFolders([{
                            id: 'root',
                            name: 'Media Library',
                            parentId: null,
                            createdAt: new Date().toISOString(),
                            children: []
                          }]);
                          setMediaItems([]);
                          setSettings({
                            defaultEventReminder: false,
                            autoSaveDrafts: true,
                            defaultUploadFolder: 'root',
                            showFilePreviews: true,
                            emailNotifications: true,
                            browserNotifications: false
                          });
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ml-4"
                    >
                      Clear All Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {editingEvent ? 'Edit Event' : 'Add New Event'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Event title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Event description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time *</label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Event location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Attendees</label>
                <input
                  type="text"
                  value={newEvent.attendees}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, attendees: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Who should attend"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={newEvent.category}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, category: e.target.value as Event['category'] }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="meeting">Meeting</option>
                  <option value="conference">Conference</option>
                  <option value="training">Training</option>
                  <option value="social">Social</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="reminder"
                  checked={newEvent.reminder}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, reminder: e.target.checked }))}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="reminder" className="text-sm text-slate-700">Set reminder</label>
              </div>
              {newEvent.reminder && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reminder Date</label>
                  <input
                    type="date"
                    value={newEvent.reminderDate}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, reminderDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={editingEvent ? updateEvent : addEvent}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingEvent ? 'Update Event' : 'Add Event'}
              </button>
              <button
                onClick={() => {
                  setShowEventModal(false);
                  setEditingEvent(null);
                  setNewEvent({
                    title: '',
                    description: '',
                    date: '',
                    time: '',
                    location: '',
                    attendees: '',
                    reminder: false,
                    reminderDate: '',
                    category: 'meeting'
                  });
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
                Are you sure you want to delete "{('name' in deleteItemToConfirm) ? deleteItemToConfirm.name : (deleteItemToConfirm as any).title}"?
                {('children' in deleteItemToConfirm) && deleteItemToConfirm.children && deleteItemToConfirm.children.length > 0 && (
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
                onClick={() => {
                  if ('folderId' in deleteItemToConfirm) {
                    confirmDeleteMediaItem();
                  } else {
                    confirmDeleteFolder();
                  }
                }}
                disabled={deleteConfirmText.toLowerCase() !== 'delete'}
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Upload Media Files</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Files</label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">Supported formats: Images, Videos, PDF, Word documents</p>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 bg-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && itemToRename && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Rename {('folderId' in itemToRename) ? 'File' : 'Folder'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Name</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new name"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={confirmRename}
                disabled={!newItemName.trim()}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                Rename
              </button>
              <button
                onClick={() => {
                  setShowRenameModal(false);
                  setItemToRename(null);
                  setNewItemName('');
                }}
                className="flex-1 bg-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handlePasswordChange}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Change Password
              </button>
              <button
                onClick={() => {
                  setShowPasswordChange(false);
                  setPasswordData({ current: '', new: '', confirm: '' });
                }}
                className="flex-1 bg-slate-300 text-slate-700 py-2 rounded-lg hover:bg-slate-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}