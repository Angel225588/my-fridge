'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { fr } from '@/lib/i18n/fr';
import Button from '@/components/ui/Button';

interface ScannedItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  location?: string;
  expiration_date?: string | null;
  estimated_expiry_days?: number | null;
  brand?: string;
  price?: number | null;
}

interface ScanJob {
  id: string;
  file: File;
  previewUrl: string;
  status: 'processing' | 'review' | 'confirmed' | 'error';
  items: ScannedItem[];
  selectedItems: boolean[];
  error?: string;
  addedCount?: number;
  type?: 'receipt' | 'product';
}

interface CameraCaptureProps {
  onItemsAdded: (items: ScannedItem[], imageFile: File, scanType: string) => Promise<void>;
  onClose: () => void;
  existingProducts?: string[];
  autoOpenCamera?: boolean;
  autoOpenGallery?: boolean;
}

export default function CameraCapture({ onItemsAdded, onClose, existingProducts = [], autoOpenCamera, autoOpenGallery }: CameraCaptureProps) {
  const [jobs, setJobs] = useState<ScanJob[]>([]);
  const [totalAdded, setTotalAdded] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Normalize name for comparison
  const normalizeName = (name: string) =>
    name.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const isDuplicate = (name: string) => {
    const normalized = normalizeName(name);
    return existingProducts.some((existing) => {
      const ne = normalizeName(existing);
      return ne === normalized || ne.includes(normalized) || normalized.includes(ne);
    });
  };

  const processImage = useCallback(async (file: File) => {
    const jobId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const previewUrl = URL.createObjectURL(file);

    const newJob: ScanJob = {
      id: jobId, file, previewUrl, status: 'processing',
      items: [], selectedItems: [],
    };
    setJobs((prev) => [newJob, ...prev]);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/ai/scan', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');

      const items: ScannedItem[] = data.items || [];
      const selected = items.map(() => true);

      const scanType = data.type || 'product';
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, status: 'review', items, selectedItems: selected, type: scanType } : j
        )
      );
    } catch (err) {
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? { ...j, status: 'error', error: err instanceof Error ? err.message : fr.scan.error }
            : j
        )
      );
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => processImage(file));
    e.target.value = '';
  };

  const toggleJobItem = (jobId: string, index: number) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        const selected = [...j.selectedItems];
        selected[index] = !selected[index];
        return { ...j, selectedItems: selected };
      })
    );
  };

  const confirmJob = async (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    const selectedItems = job.items.filter((_, i) => job.selectedItems[i]);
    if (selectedItems.length === 0) {
      // Just dismiss if nothing selected
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      return;
    }

    // Mark as confirmed immediately
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, status: 'confirmed', addedCount: selectedItems.length } : j
      )
    );

    await onItemsAdded(selectedItems, job.file, job.type || 'product');
    setTotalAdded((prev) => prev + selectedItems.length);
  };

  const retryJob = (job: ScanJob) => {
    setJobs((prev) => prev.filter((j) => j.id !== job.id));
    processImage(job.file);
  };

  const dismissJob = (jobId: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  };

  const openCamera = () => fileInputRef.current?.click();
  const openGallery = () => galleryInputRef.current?.click();

  // Auto-open camera or gallery on mount
  const autoOpened = useRef(false);
  useEffect(() => {
    if (autoOpened.current) return;
    autoOpened.current = true;
    if (autoOpenCamera) {
      setTimeout(() => openCamera(), 100);
    } else if (autoOpenGallery) {
      setTimeout(() => openGallery(), 100);
    }
  }, [autoOpenCamera, autoOpenGallery]);

  const processingCount = jobs.filter((j) => j.status === 'processing').length;
  const reviewCount = jobs.filter((j) => j.status === 'review').length;

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Camera + Gallery buttons */}
      <div className="flex items-center gap-4 justify-center py-3">
        <button
          onClick={openCamera}
          className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
          aria-label={fr.scan.takePhoto}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
        <button
          onClick={openGallery}
          className="w-14 h-14 rounded-full bg-card border-2 border-border flex items-center justify-center text-muted shadow active:scale-95 transition-transform"
          aria-label={fr.scan.gallery}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Hint */}
      <p className="text-xs text-muted text-center">
        {processingCount > 0 ? fr.scan.continueScan : fr.scan.hint}
      </p>

      {/* Counter bar */}
      {(totalAdded > 0 || processingCount > 0) && (
        <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
          <div className="flex items-center gap-3 text-sm">
            {totalAdded > 0 && (
              <span className="text-emerald-600 font-medium">
                {fr.scan.itemsAdded.replace('{count}', String(totalAdded))}
              </span>
            )}
            {processingCount > 0 && (
              <span className="text-primary flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                {processingCount} {fr.scan.processing}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Job list */}
      {jobs.length > 0 && (
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto min-h-0">
          {jobs.map((job) => (
            <div
              key={job.id}
              className={`rounded-xl border overflow-hidden transition-colors ${
                job.status === 'confirmed'
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950'
                  : job.status === 'error'
                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                    : 'border-border bg-card'
              }`}
            >
              {/* Job header with thumbnail */}
              <div className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-border flex-shrink-0 relative">
                  <img src={job.previewUrl} alt="" className="w-full h-full object-cover" />
                  {job.status === 'processing' && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {job.status === 'confirmed' && (
                    <div className="absolute inset-0 bg-emerald-500/30 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l3.5 3.5 6.5-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {job.status === 'processing' && (
                    <p className="text-xs text-muted">{fr.scan.analyzing}</p>
                  )}
                  {job.status === 'review' && (
                    <p className="text-xs font-medium text-foreground">
                      {job.items.length} {job.items.length > 1 ? fr.products.itemsPlural : fr.products.items} {fr.scan.detected.toLowerCase()}
                    </p>
                  )}
                  {job.status === 'confirmed' && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      {job.addedCount} {fr.scan.added}
                    </p>
                  )}
                  {job.status === 'error' && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-red-600 dark:text-red-400 truncate">{job.error}</p>
                      <button onClick={() => retryJob(job)} className="text-xs text-primary hover:underline flex-shrink-0">
                        {fr.scan.retry}
                      </button>
                    </div>
                  )}
                </div>

                {job.status === 'review' && (
                  <button onClick={() => dismissJob(job.id)} className="text-muted p-1">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Review items - selectable checklist */}
              {job.status === 'review' && (
                <div className="border-t border-border">
                  <div className="flex flex-col divide-y divide-border/50">
                    {job.items.map((item, i) => {
                      const dup = isDuplicate(item.name);
                      return (
                        <button
                          key={i}
                          onClick={() => toggleJobItem(job.id, i)}
                          className={`flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                            job.selectedItems[i]
                              ? 'bg-primary-light/20'
                              : 'opacity-40'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border ${
                            job.selectedItems[i] ? 'bg-primary border-primary text-white' : 'border-border'
                          }`}>
                            {job.selectedItems[i] && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                              {dup && (
                                <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                  +qté
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted">
                              {item.quantity} {item.unit}
                              {item.price ? ` · ${item.price.toFixed(2)}€` : ''}
                              {item.expiration_date && ` · Exp: ${item.expiration_date}`}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {/* Confirm button */}
                  <div className="p-3 border-t border-border">
                    <Button
                      onClick={() => confirmJob(job.id)}
                      size="sm"
                      className="w-full"
                      disabled={!job.selectedItems.some(Boolean)}
                    >
                      {fr.scanReview.confirm} ({job.selectedItems.filter(Boolean).length})
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Done button — only when everything is processed and confirmed */}
      {jobs.length > 0 && processingCount === 0 && reviewCount === 0 && (
        <Button onClick={onClose} className="w-full">
          {fr.scan.done} ({totalAdded} {totalAdded > 1 ? fr.products.itemsPlural : fr.products.items})
        </Button>
      )}
    </div>
  );
}
