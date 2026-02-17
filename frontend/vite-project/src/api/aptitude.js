// frontend/vite-project/src/api/aptitude.js
import config from '../config';
const API_BASE = config.API_URL;

import api from "../utils/api.js";

// Get AI-generated questions for practice session
export const startAIPracticeSession = async (
  category,
  difficulty = "medium",
  questionCount = 10,
) => {
  try {
    console.log('🎯 startAIPracticeSession called with:', { category, difficulty, questionCount });
    
    const backendCategories = {
      "Logical Reasoning": "Logical",
      "Quantitative Aptitude": "Quantitative",
      "Verbal Ability": "Verbal",
      "Coding Challenge": "Coding",
      Logical: "Logical",
      Quantitative: "Quantitative",
      Verbal: "Verbal",
      Coding: "Coding",
    };

    const backendCategory = backendCategories[category] || category;
    console.log('🔧 Mapped category:', backendCategory);

    const response = await api.post("/api/aptitude/practice/start", {
      category: backendCategory,
      difficulty,
      question_count: questionCount
    });
    
    console.log('✅ API response:', response);
    
    // Check if response exists
    if (!response) {
      console.error('❌ API returned null/undefined response');
      throw new Error('Server returned empty response');
    }
    
    // If response has a data property (axios wraps data), return that
    if (response.data) {
      console.log('📦 Response has data property:', response.data);
      return response.data;
    }
    
    // Otherwise return response itself
    return response;
  } catch (error) {
    console.error("❌ Error starting AI practice session:", error);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    throw error;
  }
};
// Get AI question statistics
export const getAIQuestionStats = async () => {
  try {
    const response = await api.get("/api/aptitude/ai/question-stats");
    return response.data;
  } catch (error) {
    console.error("Error fetching AI question stats:", error);
    throw error;
  }
};

// Generate new AI questions (Admin only)
export const generateAIQuestions = async (
  domains = ["Logical", "Quantitative"],
  difficulties = ["medium", "hard"],
) => {
  try {
    const response = await api.post("/api/aptitude/ai/generate-questions", {
      domains,
      difficulties,
      questions_per_combination: 3,
    });
    return response.data;
  } catch (error) {
    console.error("Error generating AI questions:", error);
    throw error;
  }
};

// Get available AI domains
export const getAIDomains = async () => {
  try {
    const response = await api.get("/api/aptitude/ai/domains");
    return response.data;
  } catch (error) {
    console.error("Error fetching AI domains:", error);
    throw error;
  }
};

// Reset question usage (Admin only)
export const resetQuestionUsage = async () => {
  try {
    const response = await api.post("/api/aptitude/ai/reset-usage");
    return response.data;
  } catch (error) {
    console.error("Error resetting question usage:", error);
    throw error;
  }
};