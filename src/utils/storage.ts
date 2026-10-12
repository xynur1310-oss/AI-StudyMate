import { MaterialAnalysis, QuizResult, StudyActivity } from '../types';

const STORAGE_KEYS = {
  MATERIALS: 'aistudymate_materials',
  ACTIVE_MATERIAL_ID: 'aistudymate_active_mat_id',
  QUIZ_RESULTS: 'aistudymate_quiz_results',
  FLASHCARD_PROGRESS: 'aistudymate_fc_progress',
  PRACTICE_HISTORY: 'aistudymate_practice_history',
  ACTIVITIES: 'aistudymate_activities',
};

export const Storage = {
  getMaterials(): MaterialAnalysis[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MATERIALS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveMaterial(mat: MaterialAnalysis): void {
    const list = this.getMaterials();
    const existingIndex = list.findIndex((m) => m.id === mat.id);
    if (existingIndex >= 0) {
      list[existingIndex] = mat;
    } else {
      list.unshift(mat);
    }
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(list));
    this.setActiveMaterialId(mat.id);
  },

  deleteMaterial(id: string): void {
    const list = this.getMaterials().filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(list));
    if (this.getActiveMaterialId() === id) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_MATERIAL_ID);
    }
  },

  getActiveMaterialId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_MATERIAL_ID);
  },

  setActiveMaterialId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_MATERIAL_ID, id);
  },

  getActiveMaterial(): MaterialAnalysis | null {
    const activeId = this.getActiveMaterialId();
    const materials = this.getMaterials();
    if (activeId) {
      const found = materials.find((m) => m.id === activeId);
      if (found) return found;
    }
    return materials.length > 0 ? materials[0] : null;
  },

  getQuizResults(): QuizResult[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUIZ_RESULTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveQuizResult(result: QuizResult): void {
    const list = this.getQuizResults();
    list.unshift(result);
    localStorage.setItem(STORAGE_KEYS.QUIZ_RESULTS, JSON.stringify(list));

    // Save activity
    this.addActivity({
      id: 'act-' + Date.now(),
      type: 'quiz',
      title: `Quiz: ${result.materialTitle}`,
      materialTitle: result.materialTitle,
      score: result.score,
      date: new Date().toISOString(),
      details: `${result.correctCount}/${result.totalQuestions} Soal Benar (${result.score}%)`,
    });
  },

  getFlashcardProgress(materialId: string): Record<string, string> {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.FLASHCARD_PROGRESS}_${materialId}`);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  saveFlashcardMastery(materialId: string, cardId: string, status: string): void {
    const current = this.getFlashcardProgress(materialId);
    current[cardId] = status;
    localStorage.setItem(`${STORAGE_KEYS.FLASHCARD_PROGRESS}_${materialId}`, JSON.stringify(current));
  },

  getActivities(): StudyActivity[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addActivity(activity: StudyActivity): void {
    const list = this.getActivities();
    list.unshift(activity);
    // keep max 50
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(list.slice(0, 50)));
  },
};
