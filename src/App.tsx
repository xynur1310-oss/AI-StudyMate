import React, { useState, useEffect } from 'react';
import { PanelLeftOpen } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { MaterialUpload } from './components/MaterialUpload';
import { MaterialSummary } from './components/MaterialSummary';
import { QuizView } from './components/QuizView';
import { FlashcardView } from './components/FlashcardView';
import { SelfPracticeView } from './components/SelfPracticeView';
import { ProblemSolverView } from './components/ProblemSolverView';
import { BenchmarkView } from './components/BenchmarkView';
import { HistoryView } from './components/HistoryView';
import { MaterialAnalysis } from './types';
import { Storage } from './utils/storage';

const STUDY_TABS = ['quiz', 'flashcards', 'practice', 'solver'];

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [materials, setMaterials] = useState<MaterialAnalysis[]>([]);
  const [activeMaterial, setActiveMaterial] = useState<MaterialAnalysis | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const isStudyActivity = STUDY_TABS.includes(currentTab);

  // Cross-view context parameters
  const [targetChapter, setTargetChapter] = useState<string | undefined>(undefined);
  const [targetProblem, setTargetProblem] = useState<string>('');

  // Auto-hide sidebar when entering any learning activity (Quiz, Flashcard, Latihan Mandiri, Pembahasan Soal)
  // Auto-restore docked sidebar when returning to overview/management tabs
  useEffect(() => {
    if (STUDY_TABS.includes(currentTab)) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [currentTab]);

  useEffect(() => {
    const loaded = Storage.getMaterials();
    setMaterials(loaded);
    const active = Storage.getActiveMaterial();
    setActiveMaterial(active);
  }, []);

  const handleMaterialProcessed = (newMat: MaterialAnalysis) => {
    Storage.saveMaterial(newMat);
    const updated = Storage.getMaterials();
    setMaterials(updated);
    setActiveMaterial(newMat);
    setCurrentTab('summary');
  };

  const handleDeleteMaterial = (id: string) => {
    Storage.deleteMaterial(id);
    const updated = Storage.getMaterials();
    setMaterials(updated);
    if (activeMaterial?.id === id) {
      setActiveMaterial(updated.length > 0 ? updated[0] : null);
    }
  };

  const handleSelectMaterial = (mat: MaterialAnalysis) => {
    setActiveMaterial(mat);
    Storage.setActiveMaterialId(mat.id);
  };

  const handleNavigateTab = (tab: string, chapterTitle?: string) => {
    setTargetChapter(chapterTitle);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenProblemSolver = (problemText: string) => {
    setTargetProblem(problemText);
    setCurrentTab('solver');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setTargetChapter(undefined);
          setCurrentTab(tab);
        }}
        activeMaterial={activeMaterial}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isStudyActivity={isStudyActivity}
      />

      {/* Main Content Area - Expands to full screen width when sidebar is hidden */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          !isStudyActivity && isSidebarOpen ? 'lg:pl-72' : 'pl-0'
        }`}
      >
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
          isStudyActivity={isStudyActivity}
          activeMaterial={activeMaterial}
          materials={materials}
          onSelectMaterial={handleSelectMaterial}
          onNavigateUpload={() => setCurrentTab('materials')}
          currentTab={currentTab}
        />

        <main
          className={`flex-1 p-4 sm:p-6 lg:p-8 w-full mx-auto transition-all duration-300 ${
            isStudyActivity ? 'max-w-6xl' : 'max-w-7xl'
          }`}
        >
          {currentTab === 'dashboard' && (
            <Dashboard
              activeMaterial={activeMaterial}
              materials={materials}
              onNavigateTab={handleNavigateTab}
              onNavigateUpload={() => setCurrentTab('materials')}
            />
          )}

          {currentTab === 'materials' && (
            <MaterialUpload
              onMaterialProcessed={handleMaterialProcessed}
              onNavigateTab={handleNavigateTab}
              materials={materials}
              onDeleteMaterial={handleDeleteMaterial}
              onSelectMaterial={handleSelectMaterial}
              activeMaterial={activeMaterial}
            />
          )}

          {currentTab === 'summary' && (
            <MaterialSummary
              material={activeMaterial}
              onNavigateTab={handleNavigateTab}
              onNavigateUpload={() => setCurrentTab('materials')}
            />
          )}

          {currentTab === 'quiz' && (
            <QuizView
              material={activeMaterial}
              onNavigateUpload={() => setCurrentTab('materials')}
              onOpenProblemSolver={handleOpenProblemSolver}
              preselectedChapter={targetChapter}
            />
          )}

          {currentTab === 'flashcards' && (
            <FlashcardView
              material={activeMaterial}
              onNavigateUpload={() => setCurrentTab('materials')}
              preselectedChapter={targetChapter}
            />
          )}

          {currentTab === 'practice' && (
            <SelfPracticeView
              material={activeMaterial}
              onNavigateUpload={() => setCurrentTab('materials')}
              preselectedChapter={targetChapter}
            />
          )}

          {currentTab === 'solver' && (
            <ProblemSolverView
              material={activeMaterial}
              initialProblem={targetProblem}
              onNavigateUpload={() => setCurrentTab('materials')}
            />
          )}

          {currentTab === 'benchmark' && (
            <BenchmarkView />
          )}

          {currentTab === 'history' && (
            <HistoryView
              materials={materials}
              onNavigateTab={handleNavigateTab}
            />
          )}
        </main>
      </div>

      {/* Floating Quick Navigation Button during Focus Study Mode */}
      {isStudyActivity && !isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed left-4 bottom-6 z-30 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/95 text-slate-800 hover:text-indigo-600 font-bold text-xs shadow-lg border border-slate-200 hover:border-indigo-300 backdrop-blur-md transition-all cursor-pointer group"
          title="Buka Menu Navigasi"
          aria-label="Buka Menu Navigasi"
        >
          <PanelLeftOpen className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Menu Navigasi</span>
        </button>
      )}
    </div>
  );
}
