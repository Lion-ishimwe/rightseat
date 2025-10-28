'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import {
  Upload,
  FileText,
  PenTool,
  Stamp,
  Download,
  Save,
  X,
  ZoomIn,
  ZoomOut,
  CheckCircle,
  AlertCircle,
  BarChart3,
  User,
  Users,
  Calendar,
  Briefcase,
  Edit,
  Trash2,
  FileDown,
  LogOut,
} from 'lucide-react';
import { clearAuthData } from '../../lib/auth';
import jsPDF from 'jspdf';
// @ts-ignore
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Dynamic imports for client-side only components
const Document = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Document })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
});

const Page = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Page })), {
  ssr: false
});

const DynamicSignatureCanvas = dynamic(() => import('react-signature-canvas'), {
  ssr: false
});

const Draggable = dynamic(() => import('react-draggable'), {
  ssr: false
});

// Lazy load PDF libraries
let PDFDocument: any;
let rgb: any;
let pdfjs: any;

if (typeof window !== 'undefined') {
  import('pdf-lib').then(module => {
    PDFDocument = module.PDFDocument;
    rgb = module.rgb;
  });
  
  import('react-pdf').then(module => {
    pdfjs = module.pdfjs;
    // Set up worker
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
    } catch {
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    }
  });
}

// -------- Types ----------
type Tool = 'signature' | 'stamp' | null;

type SigItem = {
  id: string;
  type: 'signature' | 'stamp';
  // Normalized position/size within rendered page (0..1)
  xN: number;
  yN: number;
  wN: number;
  hN: number;
  // For stamps: text; for drawn sig: dataUrl
  content: string;
  dataUrl?: string;
  page: number; // 1-based
};

type SavedDoc = {
  name: string;
  dataUrl: string; // persistent across reloads
  date: string;
};

type Tender = {
  id: string;
  name: string;
  client: string;
  department: string;
  deadline: string;
  status: 'Pending' | 'Negotiation' | 'Proposal Sent' | 'Closed Won' | 'Closed Lost';
  amount: string;
  comments: string;
  createdAt: string;
};

// -------- Component ----------
export default function BusinessOperationPage() {
    const router = useRouter();
    const [activeSubTab, setActiveSubTab] = useState<'e-signature' | 'project' | 'report'>('e-signature');

    const handleLogout = useCallback(() => {
        clearAuthData();
        router.push('/login');
    }, [router]);
    const [tenders, setTenders] = useState<Tender[]>([]);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
   const [documentUrl, setDocumentUrl] = useState<string | null>(null);
   const [numPages, setNumPages] = useState<number | null>(null);
   const [pageNumber, setPageNumber] = useState(1);

  const [signatures, setSignatures] = useState<SigItem[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool>(null);

  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const sigPadRef = useRef<any>(null);

  const [isUploadingStamp, setIsUploadingStamp] = useState(false);
  const [stampData, setStampData] = useState<string | null>(null);

  const [isUploadingSignature, setIsUploadingSignature] = useState(false);

  const [zoom, setZoom] = useState(1); // 0.5 .. 2
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Tender state
  const [newTenderName, setNewTenderName] = useState('');
  const [newTenderClient, setNewTenderClient] = useState('');
  const [newTenderDepartment, setNewTenderDepartment] = useState('');
  const [newTenderDeadline, setNewTenderDeadline] = useState('');
  const [newTenderStatus, setNewTenderStatus] = useState<Tender['status']>('Pending');
  const [newTenderAmount, setNewTenderAmount] = useState('');
  const [newTenderComments, setNewTenderComments] = useState('');
  const [editingTender, setEditingTender] = useState<Tender | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [showAddForm, setShowAddForm] = useState(false);
  const [closedFilter, setClosedFilter] = useState<'won' | 'lost'>('won');

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Tender totals for overview chart
  const tenderTotals = useMemo(() => {
    const totals: Record<string, number> = {
      'Proposal Sent': 0,
      'Negotiation': 0,
      'Closed Won': 0,
    };
    tenders.forEach(tender => {
      if (totals.hasOwnProperty(tender.status)) {
        const amount = parseFloat(tender.amount.replace(/R\s*|\s|,|R/g, '')) || 0;
        totals[tender.status] += amount;
      }
    });
    return totals;
  }, [tenders]);

  // Calculate adaptive funnel proportions based on amounts
  const adaptiveFunnel = useMemo(() => {
    const proposal = tenderTotals['Proposal Sent'];
    const negotiation = tenderTotals['Negotiation'];
    const won = tenderTotals['Closed Won'];

    const maxAmount = Math.max(proposal, negotiation, won);
    if (maxAmount === 0) return { proposal: 100, negotiation: 70, won: 40 };

    // Calculate widths as percentages (minimum 20%, maximum 100%)
    const proposalWidth = 100;
    const negotiationWidth = Math.max(20, Math.min(100, (negotiation / maxAmount) * 100));
    const wonWidth = Math.max(20, Math.min(100, (won / maxAmount) * 100));

    return {
      proposal: proposalWidth,
      negotiation: negotiationWidth,
      won: wonWidth,
    };
  }, [tenderTotals]);

  // Client frequency data for chart
  const clientFrequencyData = useMemo(() => {
    const clientCounts: Record<string, number> = {};
    tenders.forEach(tender => {
      clientCounts[tender.client] = (clientCounts[tender.client] || 0) + 1;
    });
    return Object.entries(clientCounts).map(([client, count]) => ({
      client,
      count,
    })).sort((a, b) => b.count - a.count);
  }, [tenders]);


  // Load tenders from localStorage on mount
  useEffect(() => {
    const savedTenders = localStorage.getItem('tenders');
    if (savedTenders) {
      setTenders(JSON.parse(savedTenders));
    } else {
      // Add sample data if no tenders exist
      const sampleTenders: Tender[] = [
        {
          id: 'sample-1',
          name: 'IT Infrastructure Upgrade',
          client: 'TechCorp Solutions',
          department: 'IT',
          deadline: '2025-11-15',
          status: 'Negotiation',
          amount: 'R 2,500,000',
          comments: 'Server room modernization and network upgrade',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'sample-2',
          name: 'Office Renovation Project',
          client: 'Global Enterprises',
          department: 'Facilities',
          deadline: '2025-10-30',
          status: 'Proposal Sent',
          amount: 'R 1,800,000',
          comments: 'Complete office space redesign and furniture',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'sample-3',
          name: 'Security System Implementation',
          client: 'SecureBank Ltd',
          department: 'Security',
          deadline: '2025-12-01',
          status: 'Pending',
          amount: 'R 950,000',
          comments: 'Advanced surveillance and access control system',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'sample-4',
          name: 'HR Management Software',
          client: 'PeopleFirst Corp',
          department: 'HR',
          deadline: '2025-10-20',
          status: 'Closed Won',
          amount: 'R 750,000',
          comments: 'Comprehensive HRMS with payroll integration',
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'sample-5',
          name: 'Data Center Migration',
          client: 'TechSolutions Inc',
          department: 'IT',
          deadline: '2025-09-15',
          status: 'Closed Lost',
          amount: 'R 1,200,000',
          comments: 'Cloud migration project - lost to competitor',
          createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      setTenders(sampleTenders);
      localStorage.setItem('tenders', JSON.stringify(sampleTenders));
    }
  }, []);

  // Check for deadline reminders on mount and when tenders change
  useEffect(() => {
    const checkDeadlineReminders = () => {
      const urgentTenders = tenders.filter(tender => {
        const now = new Date();
        const deadlineDate = new Date(tender.deadline);
        const diffTime = deadlineDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 5 && diffDays >= 0; // Only upcoming deadlines within 5 days
      });

      if (urgentTenders.length > 0) {
        const message = `You have ${urgentTenders.length} tender${urgentTenders.length > 1 ? 's' : ''} due within 5 days:\n\n${urgentTenders.map(t => `- ${t.name} (${new Date(t.deadline).toLocaleDateString()})`).join('\n')}`;
        alert(message);
      }
    };

    // Check reminders after tenders are loaded
    if (tenders.length > 0) {
      checkDeadlineReminders();
    }
  }, [tenders]);

  // Refs to measure the currently rendered page size
  const pageWrapperRef = useRef<HTMLDivElement | null>(null);

  // ---------- Tender Helpers ----------
  const addTender = useCallback(() => {
    if (!newTenderName.trim()) return;
    const newTender: Tender = {
      id: String(Date.now()),
      name: newTenderName.trim(),
      client: newTenderClient.trim(),
      department: newTenderDepartment.trim(),
      deadline: newTenderDeadline,
      status: newTenderStatus,
      amount: newTenderAmount.trim(),
      comments: newTenderComments.trim(),
      createdAt: new Date().toISOString(),
    };
    const updatedTenders = [...tenders, newTender];
    setTenders(updatedTenders);
    localStorage.setItem('tenders', JSON.stringify(updatedTenders));
    resetTenderForm();
  }, [newTenderName, newTenderClient, newTenderDepartment, newTenderDeadline, newTenderStatus, newTenderAmount, newTenderComments, tenders]);

  const resetTenderForm = useCallback(() => {
    setNewTenderName('');
    setNewTenderClient('');
    setNewTenderDepartment('');
    setNewTenderDeadline('');
    setNewTenderStatus('Pending');
    setNewTenderAmount('');
    setNewTenderComments('');
    setEditingTender(null);
  }, []);

  const editTender = useCallback((tender: Tender) => {
    setEditingTender(tender);
    setNewTenderName(tender.name);
    setNewTenderClient(tender.client);
    setNewTenderDepartment(tender.department);
    setNewTenderDeadline(tender.deadline);
    setNewTenderStatus(tender.status);
    setNewTenderAmount(tender.amount);
    setNewTenderComments(tender.comments);
  }, []);

  const updateTender = useCallback(() => {
    if (!editingTender || !newTenderName.trim()) return;
    const updatedTender: Tender = {
      ...editingTender,
      name: newTenderName.trim(),
      client: newTenderClient.trim(),
      department: newTenderDepartment.trim(),
      deadline: newTenderDeadline,
      status: newTenderStatus,
      amount: newTenderAmount.trim(),
      comments: newTenderComments.trim(),
    };
    const updatedTenders = tenders.map(t => t.id === editingTender.id ? updatedTender : t);
    setTenders(updatedTenders);
    localStorage.setItem('tenders', JSON.stringify(updatedTenders));
    resetTenderForm();
  }, [editingTender, newTenderName, newTenderClient, newTenderDepartment, newTenderDeadline, newTenderStatus, newTenderAmount, newTenderComments, tenders, resetTenderForm]);

  const deleteTender = useCallback((id: string) => {
    if (!confirm('Are you sure you want to delete this tender?')) return;
    const updatedTenders = tenders.filter(t => t.id !== id);
    setTenders(updatedTenders);
    localStorage.setItem('tenders', JSON.stringify(updatedTenders));
  }, [tenders]);

  const updateTenderStatus = useCallback((id: string, newStatus: Tender['status']) => {
    const updatedTenders = tenders.map(t => t.id === id ? { ...t, status: newStatus } : t);
    setTenders(updatedTenders);
    localStorage.setItem('tenders', JSON.stringify(updatedTenders));
  }, [tenders]);

  const getDeadlineStatus = useCallback((deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { status: 'overdue', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (diffDays <= 5) return { status: 'urgent', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    return { status: 'normal', color: 'text-slate-800', bgColor: '' };
  }, []);

  // ---------- Helpers ----------
  const getRenderedPageSize = useCallback(() => {
    // The Page renders a canvas inside; canvas.width/height are the real rendered pixel size
    const canvas = pageWrapperRef.current?.querySelector('canvas') as HTMLCanvasElement | null;
    if (canvas?.width && canvas?.height) {
      return { w: canvas.width, h: canvas.height };
    }
    // Fallback to clientWidth/Height if canvas isn't ready yet
    const el = pageWrapperRef.current;
    return { w: el?.clientWidth || 1, h: el?.clientHeight || 1 };
  }, []);

  const handleFileUpload = useCallback((file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a PDF file');
      return;
    }
    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setDocumentUrl(url);
    setSignatures([]);
    setZoom(1);
    setPageNumber(1);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) handleFileUpload(files[0]);
    },
    [handleFileUpload]
  );

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const handleStampImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setStampData(dataUrl);
      setSelectedTool('stamp');
      setIsUploadingStamp(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSignatureImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setSignatureData(dataUrl);
      setSelectedTool('signature');
      setIsUploadingSignature(false);
    };
    reader.readAsDataURL(file);
  }, []);

  // Add a signature/stamp at a click position, storing normalized coords
  const addSignatureAt = useCallback(
    (type: 'signature' | 'stamp', clientX: number, clientY: number, dataUrl?: string) => {
      const wrap = pageWrapperRef.current;
      if (!wrap) return;

      const rect = wrap.getBoundingClientRect();
      const { w: renderedW, h: renderedH } = getRenderedPageSize();

      // Initial pixel size (before normalization)
      const initW = type === 'signature' ? 200 : 150;
      const initH = type === 'signature' ? 60 : 60;

      // Position so that the block centers (ish) under the cursor
      const xPx = Math.max(0, Math.min(clientX - rect.left - initW / 2, renderedW - initW));
      const yPx = Math.max(0, Math.min(clientY - rect.top - initH / 2, renderedH - initH));

      const newItem: SigItem = {
        id: String(Date.now()),
        type,
        xN: xPx / renderedW,
        yN: yPx / renderedH,
        wN: initW / renderedW,
        hN: initH / renderedH,
        content: type === 'signature' ? '' : '',
        dataUrl: type === 'signature' ? dataUrl : (type === 'stamp' ? stampData || undefined : undefined),
        page: pageNumber,
      };

      setSignatures((prev) => [...prev, newItem]);
      // Keep the tool selected so user can place multiple signatures/stamps
      // Only clear the drawing modal state
      setIsDrawingSignature(false);
    },
    [getRenderedPageSize, pageNumber]
  );

  // Remove
  const removeSignature = useCallback((id: string) => {
    setSignatures((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Filter for current page (memoized)
  const currentPageSigs = useMemo(
    () => signatures.filter((s) => s.page === pageNumber),
    [signatures, pageNumber]
  );

  // Update pos after drag (normalize)
  const updateSigPos = useCallback(
    (id: string, newXpx: number, newYpx: number) => {
      const { w, h } = getRenderedPageSize();
      setSignatures((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, xN: newXpx / w, yN: newYpx / h } : s
        )
      );
    },
    [getRenderedPageSize]
  );

  // ---------- Save PDF ----------
  const saveSignedDocument = useCallback(async () => {
    if (!uploadedFile) return;
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const existingPdfBytes = await uploadedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();

      // Group signatures by page for efficiency
      const byPage = new Map<number, SigItem[]>();
      for (const s of signatures) {
        if (!byPage.has(s.page)) byPage.set(s.page, []);
        byPage.get(s.page)!.push(s);
      }

      // For each page, compute based on the page's own size
      for (let pIndex = 0; pIndex < pages.length; pIndex++) {
        const list = byPage.get(pIndex + 1);
        if (!list?.length) continue;

        const page = pages[pIndex];
        const { width: pw, height: ph } = page.getSize();

        for (const s of list) {
          if (s.dataUrl) {
            // embed the signature image
            const pngBytes = await fetch(s.dataUrl).then((r) => r.arrayBuffer());
            const img = await pdfDoc.embedPng(pngBytes);

            const wPdf = s.wN * pw;
            const hPdf = s.hN * ph;
            const xPdf = s.xN * pw;
            const yPdf = ph - (s.yN * ph + hPdf); // invert Y

            page.drawImage(img, {
              x: xPdf,
              y: yPdf,
              width: wPdf,
              height: hPdf,
            });
          } else {
            // Stamp as text
            const fontSize = Math.max(10, s.hN * ph * 0.5);
            const xPdf = s.xN * pw;
            const yPdf = ph - s.yN * ph - fontSize - 4;

            page.drawText(s.content, {
              x: xPdf,
              y: yPdf,
              size: fontSize,
              color: rgb(0, 0, 0),
            });
          }
        }
      }

      const outBytes = await pdfDoc.save();
      const blob = new Blob([outBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' });

      // Download immediately
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `signed_${uploadedFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(dlUrl);

      // Persist for "My Info" as DataURL (survives reloads)
      const dataUrl = await new Promise<string>((resolve) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result as string);
        fr.readAsDataURL(blob);
      });

      const signedDocs: SavedDoc[] = JSON.parse(localStorage.getItem('signedDocuments') || '[]');
      signedDocs.push({
        name: `signed_${uploadedFile.name}`,
        dataUrl,
        date: new Date().toISOString(),
      });
      localStorage.setItem('signedDocuments', JSON.stringify(signedDocs));

      setSaveStatus('success');
      alert(
        `Document "signed_${uploadedFile.name}" has been saved and downloaded! It has also been added to the Signed Documents folder in My Info.`
      );
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
      alert('Failed to save the signed document. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [uploadedFile, signatures]);

  // ---------- Export Functions ----------
  // Removed unused exportToCSV function

  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text('Tender Report', 20, 20);

    // Summary
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 35);
    doc.text(`Total Projects: ${tenders.length}`, 20, 45);
    doc.text(`Total Value: R ${tenders.reduce((sum, t) => sum + parseFloat(t.amount.replace(/R\s*|\s|,|R/g, '')), 0).toLocaleString()}`, 20, 55);

    // Table
    const tableData = tenders.map(tender => [
      tender.name,
      tender.client,
      tender.department,
      new Date(tender.deadline).toLocaleDateString(),
      tender.status,
      tender.amount,
      tender.comments
    ]);

    // @ts-ignore
    doc.autoTable({
      head: [['Project Name', 'Client', 'Department', 'Deadline', 'Status', 'Amount', 'Comments']],
      body: tableData,
      startY: 70,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`tender_report_${new Date().toISOString().split('T')[0]}.pdf`);
  }, [tenders]);

  // New export functions
  const exportProposalSentWithYear = useCallback(() => {
    if (!selectedYear) return;
    const filteredTenders = tenders.filter(t => t.status === 'Proposal Sent' && new Date(t.deadline).getFullYear() === selectedYear);
    const csvContent = [
      ['Project Name', 'Client Name', 'Department', 'Deadline', 'Status', 'Amount', 'Comments'].join(','),
      ...filteredTenders.map(tender => [
        `"${tender.name}"`,
        `"${tender.client}"`,
        `"${tender.department}"`,
        `"${new Date(tender.deadline).toLocaleDateString()}"`,
        `"${tender.status}"`,
        `"${tender.amount}"`,
        `"${tender.comments}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `proposal_sent_${selectedYear}.csv`;
    link.click();
    setShowExportModal(false);
  }, [tenders, selectedYear]);

  const exportExcelWithClientFrequency = useCallback(() => {
    const clientCounts: Record<string, number> = {};
    tenders.forEach(tender => {
      clientCounts[tender.client] = (clientCounts[tender.client] || 0) + 1;
    });

    const data = Object.entries(clientCounts).map(([client, count]) => ({
      'Client Name': client,
      'Project Count': count,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Client Frequency');
    XLSX.writeFile(wb, `client_frequency_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportModal(false);
  }, [tenders]);

  const exportOverallProjectsWithYear = useCallback(() => {
    if (!selectedYear) return;
    const filteredTenders = tenders.filter(t => new Date(t.deadline).getFullYear() === selectedYear);
    const csvContent = [
      ['Project Name', 'Client Name', 'Department', 'Deadline', 'Status', 'Amount', 'Comments'].join(','),
      ...filteredTenders.map(tender => [
        `"${tender.name}"`,
        `"${tender.client}"`,
        `"${tender.department}"`,
        `"${new Date(tender.deadline).toLocaleDateString()}"`,
        `"${tender.status}"`,
        `"${tender.amount}"`,
        `"${tender.comments}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `overall_projects_${selectedYear}.csv`;
    link.click();
    setShowExportModal(false);
  }, [tenders, selectedYear]);

  const exportClosedWonWithYear = useCallback(() => {
    if (!selectedYear) return;
    const filteredTenders = tenders.filter(t => t.status === 'Closed Won' && new Date(t.deadline).getFullYear() === selectedYear);
    const csvContent = [
      ['Project Name', 'Client Name', 'Department', 'Deadline', 'Status', 'Amount', 'Comments'].join(','),
      ...filteredTenders.map(tender => [
        `"${tender.name}"`,
        `"${tender.client}"`,
        `"${tender.department}"`,
        `"${new Date(tender.deadline).toLocaleDateString()}"`,
        `"${tender.status}"`,
        `"${tender.amount}"`,
        `"${tender.comments}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `closed_won_${selectedYear}.csv`;
    link.click();
    setShowExportModal(false);
  }, [tenders, selectedYear]);

  const exportClosedLostWithYear = useCallback(() => {
    if (!selectedYear) return;
    const filteredTenders = tenders.filter(t => t.status === 'Closed Lost' && new Date(t.deadline).getFullYear() === selectedYear);
    const csvContent = [
      ['Project Name', 'Client Name', 'Department', 'Deadline', 'Status', 'Amount', 'Comments'].join(','),
      ...filteredTenders.map(tender => [
        `"${tender.name}"`,
        `"${tender.client}"`,
        `"${tender.department}"`,
        `"${new Date(tender.deadline).toLocaleDateString()}"`,
        `"${tender.status}"`,
        `"${tender.amount}"`,
        `"${tender.comments}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `closed_lost_${selectedYear}.csv`;
    link.click();
    setShowExportModal(false);
  }, [tenders, selectedYear]);

  const exportNegotiationWithYear = useCallback(() => {
    if (!selectedYear) return;
    const filteredTenders = tenders.filter(t => t.status === 'Negotiation' && new Date(t.deadline).getFullYear() === selectedYear);
    const csvContent = [
      ['Project Name', 'Client Name', 'Department', 'Deadline', 'Status', 'Amount', 'Comments'].join(','),
      ...filteredTenders.map(tender => [
        `"${tender.name}"`,
        `"${tender.client}"`,
        `"${tender.department}"`,
        `"${new Date(tender.deadline).toLocaleDateString()}"`,
        `"${tender.status}"`,
        `"${tender.amount}"`,
        `"${tender.comments}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `negotiation_${selectedYear}.csv`;
    link.click();
    setShowExportModal(false);
  }, [tenders, selectedYear]);


  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <nav className="w-80 h-screen bg-slate-800/50 backdrop-blur-xl border-r border-slate-700/50 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Briefcase className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Right Seat</h1>
                <p className="text-sm text-slate-400">Business Operation</p>
              </div>
            </div>

            <ul className="space-y-2 mb-8">
              {[
                { title: 'Dashboard', icon: BarChart3, href: '/' },
                { title: 'HR Outsourcing', icon: Users, href: '/hr-outsourcing' },
                { title: 'Finance', icon: User },
                { title: 'Business Operation', icon: Briefcase, active: true },
                { title: 'Talent Curation', icon: Calendar },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.title}>
                    <button
                      onClick={() => {
                        if (item.href) {
                          router.push(item.href);
                        }
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                        item.active
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                      }`}
                      aria-label={item.title}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Logout Button */}
            <div className="mt-auto">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group text-slate-300 hover:bg-red-600/50 hover:text-white"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>

            {/* Sub-navigation for Business Operation */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">Operations</h3>
              <button
                onClick={() => setActiveSubTab('e-signature')}
                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeSubTab === 'e-signature' ? 'bg-slate-700/50 text-white' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <PenTool className="w-4 h-4" />
                <span className="text-sm font-medium">E-Signature</span>
              </button>
              <button
                onClick={() => setActiveSubTab('project')}
                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeSubTab === 'project' ? 'bg-slate-700/50 text-white' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Project</span>
              </button>
              <button
                onClick={() => setActiveSubTab('report')}
                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeSubTab === 'report' ? 'bg-slate-700/50 text-white' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm font-medium">Report</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Main */}
        <main className="flex-1 h-screen overflow-y-auto">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">Business Operation</h1>
                  <p className="text-slate-600 mt-1">
                    {activeSubTab === 'e-signature' ? 'E-Signature - Document signing and business operations' : activeSubTab === 'project' ? 'Project - Manage business projects' : 'Report - Project analytics and insights'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Last updated</p>
                  <p className="text-sm font-medium text-slate-700">{new Date().toLocaleString()}</p>
                </div>
              </div>
            </header>

            {/* Content */}
            <div className="p-6 space-y-6">
              {activeSubTab === 'e-signature' ? (
                <>
                  {/* Upload */}
                  {!uploadedFile ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-12">
                  <div
                    className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => document.getElementById('file-input')?.click()}
                    aria-label="Upload PDF Document"
                  >
                    <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Upload Business Document</h3>
                    <p className="text-slate-500 mb-4">Drag and drop your PDF file here, or click to browse</p>
                    <p className="text-sm text-slate-400">Supported format: PDF only</p>
                    <input
                      id="file-input"
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      className="hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Viewer */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-6 h-6 text-blue-600" />
                        <div>
                          <h3 className="text-xl font-semibold text-slate-800">{uploadedFile.name}</h3>
                          <p className="text-slate-500">Business document ready for signing</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setPageNumber((n) => Math.max(1, n - 1))}
                          disabled={pageNumber <= 1}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                          aria-label="Previous page"
                        >
                          ‹
                        </button>
                        <span className="text-sm text-slate-600">
                          {pageNumber} of {numPages}
                        </span>
                        <button
                          onClick={() => setPageNumber((n) => Math.min((numPages || 1), n + 1))}
                          disabled={pageNumber >= (numPages || 1)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                          aria-label="Next page"
                        >
                          ›
                        </button>
                        <div className="w-px h-6 bg-slate-300 mx-2" />
                        <button
                          onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                          aria-label="Zoom in"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                          aria-label="Zoom out"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (signatures.length > 0 && !confirm('Clear current document and signatures?')) return;
                            setUploadedFile(null);
                            setDocumentUrl(null);
                            setSignatures([]);
                            setNumPages(null);
                            setPageNumber(1);
                          }}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                          aria-label="Close document"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Page + Overlays */}
                    <div
                      className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50"
                      onClick={(e) => {
                        if (!selectedTool) return;
                        addSignatureAt(
                          selectedTool,
                          e.clientX,
                          e.clientY,
                          selectedTool === 'signature' ? signatureData || undefined : undefined
                        );
                      }}
                    >
                      <div ref={pageWrapperRef} className="relative flex justify-center p-6">
                        {documentUrl && (
                          <Document file={documentUrl} onLoadSuccess={onDocumentLoadSuccess}>
                            <Page
                              pageNumber={pageNumber}
                              scale={zoom}
                              renderAnnotationLayer={false}
                              renderTextLayer={false}
                            />
                          </Document>
                        )}

                        {/* Absolutely positioned overlay plane, sized to the canvas */}
                        <OverlayPlane
                          pageWrapperRef={pageWrapperRef}
                          items={currentPageSigs}
                          zoom={zoom}
                          onPosChange={updateSigPos}
                          onRemove={removeSignature}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tools / Info / Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Signature Tools */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">Signature Tools</h3>
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            if (selectedTool === 'signature') {
                              // If signature is already selected, clear it
                              setSelectedTool(null);
                              setSignatureData(null);
                            } else {
                              // Otherwise, start drawing a new signature
                              setIsDrawingSignature(true);
                              setSelectedTool(null);
                              setStampData(null);
                            }
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            selectedTool === 'signature'
                              ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <PenTool className="w-5 h-5" />
                          <span>{selectedTool === 'signature' ? 'Clear Signature' : 'Draw Signature'}</span>
                        </button>
                        <button
                          onClick={() => {
                            if (selectedTool === 'signature') {
                              // If signature is already selected, clear it
                              setSelectedTool(null);
                              setSignatureData(null);
                            } else {
                              // Otherwise, start uploading a signature image
                              setIsUploadingSignature(true);
                              document.getElementById('signature-image-input')?.click();
                              setStampData(null);
                            }
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            selectedTool === 'signature' && signatureData && !isDrawingSignature
                              ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Upload className="w-5 h-5" />
                          <span>{selectedTool === 'signature' && signatureData && !isDrawingSignature ? 'Clear Signature Image' : 'Upload Signature Image'}</span>
                        </button>
                        <button
                          onClick={() => {
                            if (selectedTool === 'stamp') {
                              // If stamp is already selected, clear it
                              setSelectedTool(null);
                              setStampData(null);
                            } else {
                              // Otherwise, start uploading a stamp
                              setIsUploadingStamp(true);
                              document.getElementById('stamp-input')?.click();
                              setSignatureData(null);
                            }
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            selectedTool === 'stamp'
                              ? 'bg-green-100 text-green-700 border-2 border-green-500'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Stamp className="w-5 h-5" />
                          <span>{selectedTool === 'stamp' ? 'Clear Stamp' : 'Upload Stamp Image'}</span>
                        </button>
                        <input
                          id="signature-image-input"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleSignatureImageUpload(file);
                          }}
                          className="hidden"
                        />
                        <input
                          id="stamp-input"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleStampImageUpload(file);
                          }}
                          className="hidden"
                        />
                      </div>
                      <p className="text-sm text-slate-500 mt-4">
                        Draw your signature, upload a signature image, or upload a stamp image, then click on the document to place it. Click the same button again to clear the selection.
                      </p>
                    </div>

                    {/* Document Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">Document Info</h3>
                      <div className="space-y-3">
                        <Row label="File Name" value={uploadedFile.name} />
                        <Row
                          label="Size"
                          value={`${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB`}
                        />
                        <Row label="Signatures" value={`${signatures.length}`} />
                        <Row label="Zoom" value={`${Math.round(zoom * 100)}%`} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">Actions</h3>
                      <div className="space-y-3">
                        <button
                          onClick={saveSignedDocument}
                          disabled={isSaving || signatures.length === 0}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {isSaving ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5" />
                              <span>Save Signed Document</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            const arr: SavedDoc[] = JSON.parse(
                              localStorage.getItem('signedDocuments') || '[]'
                            );
                            const latest = arr[arr.length - 1];
                            if (!latest) {
                              alert('No signed document available. Please save the document first.');
                              return;
                            }
                            const a = document.createElement('a');
                            a.href = latest.dataUrl;
                            a.download = latest.name;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all duration-200"
                        >
                          <Download className="w-5 h-5" />
                          <span>Download Signed</span>
                        </button>
                      </div>

                      {saveStatus === 'success' && (
                        <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-800">Document saved successfully!</span>
                          </div>
                        </div>
                      )}

                      {saveStatus === 'error' && (
                        <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-800">Failed to save document.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
                </>
              ) : activeSubTab === 'report' ? (
                /* Report Tab */
                <div className="space-y-6">
                  {/* Export Options */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-slate-800">Export Report</h3>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setShowExportModal(true)}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <FileDown className="w-4 h-4" />
                          <span>Export Options</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">Download the complete tender report in your preferred format</p>
                  </div>

                  {/* Tender Statistics Overview */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Tender Statistics Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-600 font-medium">Total Tenders</p>
                            <p className="text-2xl font-bold text-slate-800">{tenders.length}</p>
                          </div>
                          <div className="w-12 h-12 bg-slate-500 rounded-full flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-600 font-medium">Proposal Sent</p>
                            <p className="text-2xl font-bold text-blue-800">{tenders.filter(t => t.status === 'Proposal Sent').length}</p>
                          </div>
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-yellow-600 font-medium">In Negotiation</p>
                            <p className="text-2xl font-bold text-yellow-800">{tenders.filter(t => t.status === 'Negotiation').length}</p>
                          </div>
                          <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-600 font-medium">Closed Won</p>
                            <p className="text-2xl font-bold text-green-800">{tenders.filter(t => t.status === 'Closed Won').length}</p>
                          </div>
                          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Overview */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Financial Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-600 font-medium">Total Won Value</p>
                            <p className="text-2xl font-bold text-green-800">R {tenderTotals['Closed Won'].toLocaleString()}</p>
                          </div>
                          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-600 font-medium">Total Proposal Value</p>
                            <p className="text-2xl font-bold text-blue-800">R {tenderTotals['Proposal Sent'].toLocaleString()}</p>
                          </div>
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-yellow-600 font-medium">Negotiation Value</p>
                            <p className="text-2xl font-bold text-yellow-800">R {tenderTotals['Negotiation'].toLocaleString()}</p>
                          </div>
                          <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tender Status Breakdown */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Tender Status Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Proposal Sent Column */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-blue-600 border-b border-blue-200 pb-2">Proposal Sent</h4>
                        {tenders.filter(t => t.status === 'Proposal Sent').map((tender) => (
                          <div key={tender.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <h5 className="font-medium text-slate-800">{tender.name}</h5>
                            <p className="text-sm text-slate-600">{tender.client}</p>
                            <p className="text-sm font-bold text-blue-800">{tender.amount}</p>
                          </div>
                        ))}
                      </div>

                      {/* Negotiation Column */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-yellow-600 border-b border-yellow-200 pb-2">Negotiation</h4>
                        {tenders.filter(t => t.status === 'Negotiation').map((tender) => (
                          <div key={tender.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                            <h5 className="font-medium text-slate-800">{tender.name}</h5>
                            <p className="text-sm text-slate-600">{tender.client}</p>
                            <p className="text-sm font-bold text-yellow-800">{tender.amount}</p>
                          </div>
                        ))}
                      </div>

                      {/* Closed Won/Closed Lost Column */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <h4 className="font-medium text-slate-600">Closed</h4>
                          <select
                            value={closedFilter}
                            onChange={(e) => setClosedFilter(e.target.value as 'won' | 'lost')}
                            className="text-sm border border-slate-300 rounded px-2 py-1"
                          >
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                          </select>
                        </div>
                        {tenders.filter(t => t.status === (closedFilter === 'won' ? 'Closed Won' : 'Closed Lost')).map((tender) => (
                          <div key={tender.id} className={`p-3 rounded-lg border ${
                            tender.status === 'Closed Won'
                              ? 'bg-green-50 border-green-200'
                              : 'bg-red-50 border-red-200'
                          }`}>
                            <h5 className="font-medium text-slate-800">{tender.name}</h5>
                            <p className="text-sm text-slate-600">{tender.client}</p>
                            <p className={`text-sm font-bold ${
                              tender.status === 'Closed Won' ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {tender.amount}
                            </p>
                            <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                              tender.status === 'Closed Won'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {tender.status === 'Closed Won' ? 'Won' : 'Lost'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Overall Projects */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Overall Projects</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200">
                            <th className="text-left p-3 font-semibold text-slate-800">Project Name</th>
                            <th className="text-left p-3 font-semibold text-slate-800">Client Name</th>
                            <th className="text-left p-3 font-semibold text-slate-800">Amount</th>
                            <th className="text-left p-3 font-semibold text-slate-800">Dates</th>
                            <th className="text-left p-3 font-semibold text-slate-800">Year</th>
                            <th className="text-left p-3 font-semibold text-slate-800">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tenders.map((tender) => (
                            <tr key={tender.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="p-3 font-medium text-slate-800">{tender.name}</td>
                              <td className="p-3 text-slate-600">{tender.client}</td>
                              <td className="p-3 text-slate-800 font-medium">{tender.amount}</td>
                              <td className="p-3 text-slate-600">{new Date(tender.deadline).toLocaleDateString()}</td>
                              <td className="p-3 text-slate-600">{new Date(tender.deadline).getFullYear()}</td>
                              <td className="p-3">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => deleteTender(tender.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete tender"
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

                  {/* Client Frequency Chart */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Client Frequency</h3>
                    <div className="w-full h-64">
                      <BarChart
                        width={800}
                        height={250}
                        data={clientFrequencyData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="client" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#8884d8" />
                      </BarChart>
                    </div>
                  </div>

                  {/* Department Performance */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Department Performance</h3>
                    <div className="space-y-4">
                      {Object.entries(
                        tenders.reduce((acc, tender) => {
                          acc[tender.department] = (acc[tender.department] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([dept, count]) => (
                        <div key={dept} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <span className="font-medium text-slate-800">{dept}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-600">{count} tender{count !== 1 ? 's' : ''}</span>
                            <div className="w-20 bg-slate-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${(count / tenders.length) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Project Tab */
                <div className="space-y-6">

                  {/* Project Management */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/50 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">Tender Management</h3>
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => setViewMode('table')}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                              viewMode === 'table'
                                ? 'bg-blue-500 text-white shadow'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Table View
                          </button>
                          <button
                            onClick={() => setViewMode('cards')}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                              viewMode === 'cards'
                                ? 'bg-blue-500 text-white shadow'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Card View
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          resetTenderForm();
                          setEditingTender(null);
                          setShowAddForm(true);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200"
                      >
                        Add Project
                      </button>
                    </div>

                    {viewMode === 'table' ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="text-left p-3 font-semibold text-slate-800">Project Name</th>
                              <th className="text-left p-3 font-semibold text-slate-800">Client</th>
                              <th className="text-left p-3 font-semibold text-slate-800">Department</th>
                              <th className="text-left p-3 font-semibold text-slate-800">Deadline</th>
                              <th className="text-left p-3 font-semibold text-slate-800">Status</th>
                              <th className="text-left p-3 font-semibold text-slate-800">Amount</th>
                              <th className="text-left p-3 font-semibold text-slate-800">Comments</th>
                              <th className="text-left p-3 font-semibold text-slate-800">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tenders.map((tender) => {
                              const deadlineStatus = getDeadlineStatus(tender.deadline);
                              return (
                                <tr key={tender.id} className="border-b border-slate-100 hover:bg-slate-50">
                                  <td className="p-3 font-medium text-slate-800">{tender.name}</td>
                                  <td className="p-3 text-slate-600">{tender.client}</td>
                                  <td className="p-3 text-slate-600">{tender.department}</td>
                                  <td className={`p-3 font-medium ${deadlineStatus.color}`}>
                                    {new Date(tender.deadline).toLocaleDateString()}
                                    {deadlineStatus.status !== 'normal' && (
                                      <span className={`ml-2 text-xs px-2 py-1 rounded ${deadlineStatus.bgColor} ${deadlineStatus.color}`}>
                                        {deadlineStatus.status === 'overdue' ? 'Overdue' : 'Due Soon'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3">
                                    <select
                                      value={tender.status}
                                      onChange={(e) => updateTenderStatus(tender.id, e.target.value as Tender['status'])}
                                      className="px-2 py-1 text-sm border border-slate-300 rounded"
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="Negotiation">Negotiation</option>
                                      <option value="Proposal Sent">Proposal Sent</option>
                                      <option value="Closed Won">Closed Won</option>
                                      <option value="Closed Lost">Closed Lost</option>
                                    </select>
                                  </td>
                                  <td className="p-3 text-slate-800 font-medium">{tender.amount}</td>
                                  <td className="p-3 text-slate-600 text-sm max-w-xs truncate" title={tender.comments}>
                                    {tender.comments}
                                  </td>
                                  <td className="p-3">
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => editTender(tender)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit tender"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => deleteTender(tender.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete tender"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tenders.map((tender) => {
                          const deadlineStatus = getDeadlineStatus(tender.deadline);
                          return (
                            <div key={tender.id} className="bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-sm border border-slate-200/50 p-6 hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <h4 className="text-lg font-semibold text-slate-800 mb-1">{tender.name}</h4>
                                  <p className="text-sm text-slate-600">{tender.client}</p>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => editTender(tender)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit tender"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteTender(tender.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete tender"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-3 mb-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-slate-600">Department:</span>
                                  <span className="text-sm font-medium text-slate-800">{tender.department}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-slate-600">Deadline:</span>
                                  <span className={`text-sm font-medium ${deadlineStatus.color}`}>
                                    {new Date(tender.deadline).toLocaleDateString()}
                                    {deadlineStatus.status !== 'normal' && (
                                      <span className={`ml-2 text-xs px-2 py-1 rounded ${deadlineStatus.bgColor} ${deadlineStatus.color}`}>
                                        {deadlineStatus.status === 'overdue' ? 'Overdue' : 'Due Soon'}
                                      </span>
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-slate-600">Amount:</span>
                                  <span className="text-sm font-bold text-slate-800">{tender.amount}</span>
                                </div>
                              </div>

                              <div className="mb-4">
                                <select
                                  value={tender.status}
                                  onChange={(e) => updateTenderStatus(tender.id, e.target.value as Tender['status'])}
                                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Negotiation">Negotiation</option>
                                  <option value="Proposal Sent">Proposal Sent</option>
                                  <option value="Closed Won">Closed Won</option>
                                  <option value="Closed Lost">Closed Lost</option>
                                </select>
                              </div>

                              {tender.comments && (
                                <div className="pt-3 border-t border-slate-200">
                                  <p className="text-sm text-slate-600 line-clamp-2" title={tender.comments}>
                                    {tender.comments}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Export Modal */}
                  {showExportModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                          <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-slate-800">Export Options</h3>
                            <button
                              onClick={() => setShowExportModal(false)}
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <X className="w-6 h-6" />
                            </button>
                          </div>

                          <div className="space-y-4">
                            {/* Year selector for year-based exports */}
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Select Year (for year-specific exports)</label>
                              <select
                                value={selectedYear || ''}
                                onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Select Year</option>
                                {Array.from(new Set(tenders.map(t => new Date(t.deadline).getFullYear()))).sort().map(year => (
                                  <option key={year} value={year}>{year}</option>
                                ))}
                              </select>
                            </div>

                            {/* Export options */}
                            <div className="space-y-3">
                              <button
                                onClick={exportProposalSentWithYear}
                                disabled={!selectedYear}
                                className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                              >
                                <div className="flex items-center space-x-3">
                                  <FileDown className="w-5 h-5" />
                                  <span>Proposal Sent (CSV) - {selectedYear || 'Select Year'}</span>
                                </div>
                              </button>

                              <button
                                onClick={exportNegotiationWithYear}
                                disabled={!selectedYear}
                                className="w-full flex items-center justify-between px-4 py-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                              >
                                <div className="flex items-center space-x-3">
                                  <FileDown className="w-5 h-5" />
                                  <span>Negotiation (CSV) - {selectedYear || 'Select Year'}</span>
                                </div>
                              </button>

                              <button
                                onClick={exportClosedWonWithYear}
                                disabled={!selectedYear}
                                className="w-full flex items-center justify-between px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                              >
                                <div className="flex items-center space-x-3">
                                  <FileDown className="w-5 h-5" />
                                  <span>Closed Won (CSV) - {selectedYear || 'Select Year'}</span>
                                </div>
                              </button>

                              <button
                                onClick={exportClosedLostWithYear}
                                disabled={!selectedYear}
                                className="w-full flex items-center justify-between px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                              >
                                <div className="flex items-center space-x-3">
                                  <FileDown className="w-5 h-5" />
                                  <span>Closed Lost (CSV) - {selectedYear || 'Select Year'}</span>
                                </div>
                              </button>

                              <button
                                onClick={exportExcelWithClientFrequency}
                                className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all duration-200"
                              >
                                <div className="flex items-center space-x-3">
                                  <FileDown className="w-5 h-5" />
                                  <span>Client Frequency (Excel)</span>
                                </div>
                              </button>

                              <button
                                onClick={exportOverallProjectsWithYear}
                                disabled={!selectedYear}
                                className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                              >
                                <div className="flex items-center space-x-3">
                                  <FileDown className="w-5 h-5" />
                                  <span>Overall Projects (CSV) - {selectedYear || 'Select Year'}</span>
                                </div>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modal Backdrop */}
                  {(showAddForm || editingTender) && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                          <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-slate-800">
                              {editingTender ? `Edit Project: ${editingTender.name}` : 'Add New Project'}
                            </h3>
                            <button
                              onClick={() => {
                                setShowAddForm(false);
                                resetTenderForm();
                              }}
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              <X className="w-6 h-6" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <input
                              type="text"
                              placeholder="Project Name"
                              value={newTenderName}
                              onChange={(e) => setNewTenderName(e.target.value)}
                              required
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <input
                              type="text"
                              placeholder="Client Name"
                              value={newTenderClient}
                              onChange={(e) => setNewTenderClient(e.target.value)}
                              required
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <input
                              type="text"
                              placeholder="Department"
                              value={newTenderDepartment}
                              onChange={(e) => setNewTenderDepartment(e.target.value)}
                              required
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <input
                              type="date"
                              placeholder="Deadline Date"
                              value={newTenderDeadline}
                              onChange={(e) => setNewTenderDeadline(e.target.value)}
                              required
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <select
                              value={newTenderStatus}
                              onChange={(e) => setNewTenderStatus(e.target.value as Tender['status'])}
                              required
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Negotiation">Negotiation</option>
                              <option value="Proposal Sent">Proposal Sent</option>
                              <option value="Closed Won">Closed Won</option>
                              <option value="Closed Lost">Closed Lost</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Project Amount"
                              value={newTenderAmount}
                              onChange={(e) => setNewTenderAmount(e.target.value)}
                              required
                              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <textarea
                            placeholder="Comments"
                            value={newTenderComments}
                            onChange={(e) => setNewTenderComments(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                          />
                          <div className="flex space-x-3 justify-end">
                            <button
                              onClick={() => {
                                setShowAddForm(false);
                                resetTenderForm();
                              }}
                              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all duration-200"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                if (editingTender) {
                                  updateTender();
                                } else {
                                  addTender();
                                  setShowAddForm(false);
                                }
                              }}
                              disabled={!newTenderName.trim() || !newTenderClient.trim() || !newTenderDepartment.trim() || !newTenderDeadline || !newTenderAmount.trim()}
                              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                              {editingTender ? 'Update Project' : 'Add Project'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}


// -------- Small subcomponents --------
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-600">{label}:</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

function OverlayPlane({
  pageWrapperRef,
  items,
  zoom,
  onPosChange,
  onRemove,
}: {
  pageWrapperRef: React.RefObject<HTMLDivElement | null>;
  items: SigItem[];
  zoom: number;
  onPosChange: (id: string, xPx: number, yPx: number) => void;
  onRemove: (id: string) => void;
}) {
  // Size the overlay plane to the current canvas
  const [planeSize, setPlaneSize] = useState<{ w: number; h: number }>({ w: 1, h: 1 });

  useEffect(() => {
    const update = () => {
      const canvas = pageWrapperRef.current?.querySelector('canvas') as HTMLCanvasElement | null;
      if (canvas?.width && canvas?.height) {
        setPlaneSize({ w: canvas.width, h: canvas.height });
      }
    };
    update();
    const interval = setInterval(update, 200); // lightweight polling; replace with ResizeObserver if preferred
    return () => clearInterval(interval);
  }, [pageWrapperRef, zoom]);

  return (
    <div
      className="absolute top-0 left-0"
      style={{
        width: planeSize.w,
        height: planeSize.h,
        pointerEvents: 'none', // let clicks pass; Draggable children will re-enable
      }}
    >
      {items.map((s) => {
        const xPx = s.xN * planeSize.w;
        const yPx = s.yN * planeSize.h;
        const wPx = s.wN * planeSize.w;
        const hPx = s.hN * planeSize.h;

        return (
          <Draggable
            key={s.id}
            bounds="parent"
            position={{ x: xPx, y: yPx }}
            onStop={(_, data) => onPosChange(s.id, data.x, data.y)}
          >
            <div
              className="absolute border-2 border-blue-500 bg-white rounded-lg shadow-lg"
              style={{ width: wPx, height: hPx, pointerEvents: 'auto', userSelect: 'none' }}
            >
              <div className="flex items-center justify-between p-2 bg-blue-500 text-white rounded-t-lg">
                <span className="text-xs font-medium">
                  {s.type === 'signature' ? 'Signature' : 'Stamp'}
                </span>
                <button
                  onClick={() => onRemove(s.id)}
                  className="text-white hover:text-red-300"
                  aria-label="Remove"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="p-2 w-full h-[calc(100%-28px)] flex items-center justify-center">
                {s.dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.dataUrl}
                    alt="Signature"
                    className="max-w-full max-h-full object-contain"
                    draggable={false}
                  />
                ) : (
                  <span className="text-sm font-medium text-slate-800 select-none">{s.content}</span>
                )}
              </div>
            </div>
          </Draggable>
        );
      })}
    </div>
  );
}
