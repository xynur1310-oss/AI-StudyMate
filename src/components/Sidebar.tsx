import React from 'react';
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  HelpCircle,
  Layers,
  Edit3,
  Calculator,
  History,
  GraduationCap,
  Sparkles,
  ChevronRight,
  X,
  Zap,
} from 'lucide-react';
import { MaterialAnalysis } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  activeMaterial: MaterialAnalysis | null;
  isOpen: boolean;
  onClose: () => void;
  isStudyActivity: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeMaterial,
  isOpen,
  onClose,
  isStudyActivity,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'materials', label: 'Materi Saya', icon: FileText },
    { id: 'summary', label: 'Ringkasan & Konsep', icon: BookOpen, requiresMaterial: true },
    { id: 'quiz', label: 'AI Quiz Generator', icon: HelpCircle, badge: 'Cepat ~1s' },
    { id: 'flashcards', label: 'AI Flashcard', icon: Layers, badge: 'Smart' },
    { id: 'practice', label: 'AI Latihan Mandiri', icon: Edit3, badge: 'Review AI' },
    { id: 'solver', label: 'AI Pembahasan Soal', icon: Calculator },
    { id: 'benchmark', label: 'Uji Performa & Benchmark', icon: Zap, badge: 'Speed ⚡' },
    { id: 'history', label: 'Riwayat Belajar', icon: History },
  ];

  const handleNav = (id: string) => {
    onSelectTab(id);
    // If we're in study activity or on mobile, close the drawer after picking a tab
    if (isStudyActivity || (typeof window !== 'undefined' && window.innerWidth < 1024)) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop: Always shown when open in study activities or on mobile screen */}
      {isOpen && (
        <div
          className={`fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 transition-opacity duration-300 ${
            isStudyActivity ? 'block' : 'lg:hidden'
          }`}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen
            ? 'translate-x-0 shadow-2xl lg:shadow-none'
            : '-translate-x-full'
        } ${
          !isStudyActivity && isOpen ? 'lg:translate-x-0' : ''
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-slate-900 tracking-tight">AI StudyMate</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">FAST</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Asisten Belajar Cerdas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="Tutup Menu"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Material Pill */}
        <div className="px-4 py-3 bg-slate-50/70 border-b border-slate-100">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Materi Aktif</span>
            {activeMaterial && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Siap Dipelajari
              </span>
            )}
          </div>
          {activeMaterial ? (
            <div
              onClick={() => handleNav('summary')}
              className="group cursor-pointer p-2.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all"
            >
              <div className="font-semibold text-xs text-slate-800 truncate group-hover:text-indigo-600">
                {activeMaterial.title}
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center justify-between">
                <span>{activeMaterial.subject}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ) : (
            <button
              onClick={() => handleNav('materials')}
              className="w-full text-left p-2.5 rounded-lg border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-xs text-slate-500 flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Belum ada materi dipilih</span>
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Pembelajaran
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-white' : 'text-slate-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.badge.includes('Speed')
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-slate-700">Optimasi Performa Aktif</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Ekstraksi teks lokal PDF/DOCX & cache SHA-256 memangkas waktu hingga 86%.
          </p>
        </div>
      </aside>
    </>
  );
};
