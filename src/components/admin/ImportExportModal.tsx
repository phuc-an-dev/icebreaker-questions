'use client';

import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertCircle,
  FileUp,
} from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';
import { hapticFeedback } from '@/lib/haptics';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = (format: 'json' | 'csv') => {
    hapticFeedback.medium();
    window.open(`/api/admin/export?format=${format}`, '_blank');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportText(content);
        setImportResult(null);
        hapticFeedback.light();
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!importText.trim()) {
      hapticFeedback.warning();
      setImportResult({
        success: false,
        message: 'Please paste JSON/CSV text or select a file to import.',
      });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      let isJson = false;
      let parsedJson: unknown = null;
      try {
        parsedJson = JSON.parse(importText);
        isJson = true;
      } catch {
        isJson = false;
      }

      let res: Response;
      if (isJson) {
        res = await fetch('/api/admin/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsedJson),
        });
      } else {
        res = await fetch('/api/admin/import', {
          method: 'POST',
          headers: { 'Content-Type': 'text/csv' },
          body: importText,
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      hapticFeedback.success();
      setImportResult({
        success: true,
        message: `Successfully processed ${data.importedCount} questions! (Upserted: ${data.upsertedCount}, Modified: ${data.modifiedCount})`,
      });
      onImportSuccess();
    } catch (err: unknown) {
      hapticFeedback.warning();
      setImportResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to import data',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const subHeader = (
    <div className="flex border-b border-edge bg-surface-elevated/40 px-6 pt-3 gap-2 shrink-0">
      <button
        onClick={() => {
          setActiveTab('export');
          setImportResult(null);
          hapticFeedback.light();
        }}
        className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition ${
          activeTab === 'export'
            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
            : 'border-transparent text-content-muted hover:text-content'
        }`}
      >
        <Download className="w-4 h-4" /> Export Dataset
      </button>
      <button
        onClick={() => {
          setActiveTab('import');
          setImportResult(null);
          hapticFeedback.light();
        }}
        className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition ${
          activeTab === 'import'
            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
            : 'border-transparent text-content-muted hover:text-content'
        }`}
      >
        <Upload className="w-4 h-4" /> Import Dataset
      </button>
    </div>
  );

  const footer = (
    <div className="flex items-center justify-end gap-3 w-full">
      <button
        type="button"
        onClick={onClose}
        disabled={isImporting}
        className="px-4 py-2.5 text-sm font-medium text-content-secondary hover:text-content hover:bg-surface-elevated rounded-xl transition disabled:opacity-50 min-h-[44px]"
      >
        {activeTab === 'export' ? 'Close' : 'Cancel'}
      </button>
      {activeTab === 'import' && (
        <button
          type="button"
          onClick={handleExecuteImport}
          disabled={isImporting || !importText.trim()}
          className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px]"
        >
          {isImporting && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          Execute Import
        </button>
      )}
    </div>
  );

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Import & Export Portal"
      subtitle="Backup, migrate, and bulk load question datasets"
      icon={<Download className="w-5 h-5 text-blue-500 dark:text-blue-400" />}
      maxWidth="xl"
      isSubmitting={isImporting}
      subHeader={subHeader}
      footer={footer}
      contentClassName="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar"
    >
      {activeTab === 'export' ? (
        <div className="space-y-4">
          <p className="text-sm text-content-secondary leading-relaxed">
            Export all questions currently stored in MongoDB Atlas. Select your preferred file format:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="flex flex-col items-center justify-center p-6 bg-surface-elevated/40 hover:bg-surface-elevated/80 border border-edge hover:border-blue-500/60 rounded-2xl transition group text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 mb-3 group-hover:scale-110 transition">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span className="font-semibold text-content text-base mb-1">Export as CSV</span>
              <span className="text-xs text-content-muted">
                Compatible with Excel, Google Sheets, and Numbers
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleExport('json')}
              className="flex flex-col items-center justify-center p-6 bg-surface-elevated/40 hover:bg-surface-elevated/80 border border-edge hover:border-blue-500/60 rounded-2xl transition group text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500 dark:text-blue-400 mb-3 group-hover:scale-110 transition">
                <FileCode className="w-6 h-6" />
              </div>
              <span className="font-semibold text-content text-base mb-1">Export as JSON</span>
              <span className="text-xs text-content-muted">
                Full programmatic backup format with raw schema
              </span>
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            <span className="font-semibold block mb-1">Dataset Schema Information</span>
            Columns included: <code className="font-mono">id</code>, <code className="font-mono">text</code>, <code className="font-mono">category</code>, <code className="font-mono">type</code>, <code className="font-mono">tags</code>.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-content-secondary leading-relaxed">
            Bulk upload questions via CSV or JSON. Questions with matching IDs will be updated; new IDs will be inserted.
          </p>

          {/* Drag and Drop / Choose File button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.json,text/csv,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-3 p-4 bg-surface-elevated/40 hover:bg-surface-elevated/80 border-2 border-dashed border-edge-strong hover:border-blue-500/60 rounded-2xl transition text-content-secondary hover:text-content"
            >
              <FileUp className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <span className="text-sm font-semibold">Choose CSV or JSON file to upload</span>
            </button>
          </div>

          {/* Textarea Paste */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-content-muted">
                Or Paste Raw Data (CSV or JSON Array)
              </label>
              {importText && (
                <button
                  type="button"
                  onClick={() => setImportText('')}
                  className="text-xs text-red-500 dark:text-red-400 hover:underline"
                >
                  Clear
                </button>
              )}
            </div>
            <textarea
              rows={6}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='[{"id": 1, "text": "Question...", "category": "group", "type": "open", "tags": []}]'
              className="w-full px-3.5 py-2.5 bg-surface-input border border-edge-strong rounded-xl text-content placeholder-content-muted font-mono text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Result Alert */}
          {importResult && (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 text-sm ${
                importResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'
              }`}
            >
              {importResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{importResult.message}</p>
                {importResult.details && (
                  <p className="text-xs mt-1 opacity-90">{importResult.details}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
};
