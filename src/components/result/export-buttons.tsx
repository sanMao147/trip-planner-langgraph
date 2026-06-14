"use client";

import { Download, Image, FileText } from "lucide-react";

interface ExportButtonsProps {
  onExportImage: () => void;
  onExportPDF: () => void;
  exporting: boolean;
}

export function ExportButtons({
  onExportImage,
  onExportPDF,
  exporting,
}: ExportButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onExportImage}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E3050]/50 border border-white/10 text-[#CBD5E1] hover:text-white hover:border-white/20 transition-all text-sm disabled:opacity-50"
      >
        <Image className="w-4 h-4" />
        <span className="hidden sm:inline">导出图片</span>
      </button>
      <button
        onClick={onExportPDF}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E3050]/50 border border-white/10 text-[#CBD5E1] hover:text-white hover:border-white/20 transition-all text-sm disabled:opacity-50"
      >
        <FileText className="w-4 h-4" />
        <span className="hidden sm:inline">导出 PDF</span>
      </button>
      {exporting && (
        <span className="flex items-center gap-1.5 text-[#FF8C42] text-sm">
          <Download className="w-4 h-4 animate-bounce" />
          导出中...
        </span>
      )}
    </div>
  );
}
