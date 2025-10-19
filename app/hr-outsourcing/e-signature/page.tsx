'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
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
  Award
} from 'lucide-react';

// Dynamic imports for client-side only components
const Document = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Document })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
});

const Page = dynamic(() => import('react-pdf').then(mod => ({ default: mod.Page })), {
  ssr: false
});

const DynamicSignatureCanvas = dynamic(() => import('react-signature-canvas').then(mod => {
  const Comp = mod.default;
  return React.forwardRef<any, any>((props, ref) => <Comp {...props} ref={ref} />);
}), {
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

// -------- Component ----------
export default function ESignaturePage() {
  const router = useRouter();
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

  // Refs to measure the currently rendered page size
  const pageWrapperRef = useRef<HTMLDivElement | null>(null);

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

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex h-screen">
        {/* Sidebar */}
        <nav className="w-80 h-screen bg-slate-800/50 backdrop-blur-xl border-r border-slate-700/50 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <PenTool className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">HR Outsourcing</h1>
                <p className="text-sm text-slate-400">E-Signature</p>
              </div>
            </div>

            <ul className="space-y-2 mb-8">
              {[
                { title: 'Dashboard', icon: BarChart3, href: '/hr-outsourcing' },
                { title: 'My Info', icon: User, href: '/hr-outsourcing/my-info' },
                { title: 'People', icon: Users, href: '/hr-outsourcing/people' },
                { title: 'Leave Management', icon: Calendar, href: '/hr-outsourcing/leave-management' },
                { title: 'Report', icon: FileText },
                { title: 'E-Signature', icon: Award, active: true },
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
                        (item as any).active
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
          </div>
        </nav>

        {/* Main */}
        <main className="flex-1 h-screen overflow-y-auto">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-slate-800">E-Signature</h1>
                  <p className="text-slate-600 mt-1">Upload, sign, and manage digital documents</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Last updated</p>
                  <p className="text-sm font-medium text-slate-700">{new Date().toLocaleString()}</p>
                </div>
              </div>
            </header>

            {/* Content */}
            <div className="p-6 space-y-6">
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
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Upload PDF Document</h3>
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
                          <p className="text-slate-500">Document ready for signing</p>
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
            </div>
          </div>
        </main>
      </div>

      {/* Signature Modal */}
      {isDrawingSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Draw Your Signature</h3>
              <button
                onClick={() => {
                  setIsDrawingSignature(false);
                  setSignatureData(null);
                }}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="border border-slate-200 rounded-lg p-4 mb-4">
              {typeof window !== 'undefined' && (
                <DynamicSignatureCanvas
                  ref={(r: any) => { sigPadRef.current = r; }}
                  canvasProps={{
                    width: 400,
                    height: 200,
                    className: 'border border-slate-200 rounded w-full h-auto',
                  }}
                  backgroundColor="rgba(0,0,0,0)"
                />
              )}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  const dataUrl = sigPadRef.current?.toDataURL();
                  if (dataUrl) {
                    setSignatureData(dataUrl);
                    setSelectedTool('signature');
                    setIsDrawingSignature(false);
                  }
                }}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Use This Signature
              </button>
              <button
                onClick={() => {
                  sigPadRef.current?.clear();
                  setSignatureData(null);
                }}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
            {selectedTool === 'signature' && signatureData && (
              <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  {isDrawingSignature ? 'Signature captured!' : 'Signature image uploaded!'} Click on the document to place it. You can place multiple copies.
                </p>
              </div>
            )}
            {selectedTool === 'stamp' && stampData && (
              <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  Stamp image uploaded! Click on the document to place it. You can place multiple copies.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
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