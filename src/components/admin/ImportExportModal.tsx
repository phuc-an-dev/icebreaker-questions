'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertCircle,
  FileUp,
} from 'lucide-react';

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

  if (!isOpen) return null;

  const handleExport = (format: 'json' | 'csv') => {
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
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!importText.trim()) {
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

      setImportResult({
        success: true,
        message: `Successfully processed ${data.importedCount} questions! (Upserted: ${data.upsertedCount}, Modified: ${data.modifiedCount})`,
      });
      onImportSuccess();
    } catch (err: unknown) {
      setImportResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to import data',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Import & Export Portal</h2>
              <p className="text-xs text-slate-400">
                Backup, migrate, and bulk load question datasets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-3 gap-2">
          <button
            onClick={() => {
              setActiveTab('export');
              setImportResult(null);
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" /> Export Dataset
          </button>
          <button
            onClick={() => {
              setActiveTab('import');
              setImportResult(null);
            }}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" /> Import Dataset
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-300 leading-relaxed">
                Export all questions currently stored in MongoDB Atlas. Select your preferred file format:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => handleExport('csv')}
                  className="flex flex-col items-center justify-center p-6 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-700/80 hover:border-blue-500/60 rounded-2xl transition group text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-white text-base mb-1">Export as CSV</span>
                  <span className="text-xs text-slate-400">
                    Compatible with Excel, Google Sheets, and Numbers
                  </span>
                </button>

                <button
                  onClick={() => handleExport('json')}
                  className="flex flex-col items-center justify-center p-6 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-700/80 hover:border-blue-500/60 rounded-2xl transition group text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-110 transition">
                    <FileCode className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-white text-base mb-1">Export as JSON</span>
                  <span className="text-xs text-slate-400">
                    Full programmatic backup format with raw schema
                  </span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/30 text-xs text-blue-300/90 leading-relaxed">
                <span className="font-semibold block mb-1">Dataset Schema Information</span>
                Columns included: <code className="text-blue-200">id</code>, <code className="text-blue-200">text</code>, <code className="text-blue-200">category</code>, <code className="text-blue-200">type</code>, <code className="text-blue-200">tags</code>.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-300 leading-relaxed">
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
                  className="w-full flex items-center justify-center gap-3 p-4 bg-slate-950/60 hover:bg-slate-800/60 border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-2xl transition text-slate-300 hover:text-white"
                >
                  <FileUp className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium">Select a CSV or JSON file from your computer</span>
                </button>
              </div>

              {/* Paste Textarea */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Or paste CSV / JSON content directly
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => {
                    setImportText(e.target.value);
                    setImportResult(null);
                  }}
                  rows={6}
                  placeholder={`Example CSV:\nid,text,category,type,tags\n1,"Bạn thích đi du lịch ở đâu?",fun,open,travel;places`}
                  className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Status Alert */}
              {importResult && (
                <div
                  className={`p-3 rounded-xl flex items-start gap-2.5 text-xs ${
                    importResult.success
                      ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-300'
                      : 'bg-red-950/40 border border-red-800/40 text-red-300'
                  }`}
                >
                  {importResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  )}
                  <span>{importResult.message}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={isImporting || !importText.trim()}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isImporting && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  Execute Import
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
