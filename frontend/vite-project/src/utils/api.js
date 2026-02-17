// src/utils/api.js
// Complete API configuration for SkillBridge - All Modules

// Use environment variable for API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

console.log('🌐 API Base URL:', API_BASE_URL);

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

// ============================================================
// AUTH APIs
// ============================================================

export async function signup(name, email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Signup failed");
  }

  return res.json();
}

// In your login function in api.js
export async function login(email, password) {
  console.log('🔐 Login attempt for:', email);
  
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    console.error('❌ Login failed:', errorData);
    throw new Error(errorData.detail || "Login failed");
  }

  const data = await res.json();
  console.log('✅ Login response:', data);
  console.log('🔑 Token received:', data.access_token ? data.access_token.substring(0, 20) + '...' : 'No token');
  console.log('🔑 Token length:', data.access_token?.length);
  
  // Store token
  if (data.access_token) {
    localStorage.setItem('token', data.access_token);
    console.log('💾 Token stored in localStorage');
  }
  
  return data;
}

export async function getMe() {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch user info");
  return res.json();
}

export async function forgotPassword(email) {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to send reset email");
  }

  return res.json();
}

export async function resetPassword(token, newPassword) {
  const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, new_password: newPassword }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to reset password");
  }

  return res.json();
}

export async function verifyResetToken(token) {
  const res = await fetch(`${API_BASE_URL}/auth/verify-reset-token/${token}`);

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Invalid or expired token");
  }

  return res.json();
}

// ============================================================
// INTERVIEW IQ APIs
// ============================================================

export async function fetchDomains() {
  const res = await fetch(`${API_BASE_URL}/api/domains`);
  if (!res.ok) throw new Error("Failed to fetch domains");
  return res.json();
}

export async function fetchQuestion(domain) {
  const res = await fetch(`${API_BASE_URL}/api/question/${domain}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch question");
  return res.json();
}

export async function submitInterview(domain, audioBlob, videoBlob = null) {
  console.log("📤 Submitting interview:", { domain, audioBlob, videoBlob });
  
  const formData = new FormData();
  formData.append("audio_file", audioBlob, "response.wav");
  
  if (videoBlob) {
    formData.append("video_file", videoBlob, "response.webm");
  }

  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/api/interview/${domain}`, {
    method: "POST",
    headers: headers,
    body: formData,
  });

  console.log("📥 Response status:", res.status, res.statusText);

  if (!res.ok) {
    const msg = await res.text();
    console.error("❌ Error response:", msg);
    throw new Error(`Submission failed: ${msg}`);
  }

  const jsonData = await res.json();
  console.log("📥 Response JSON:", jsonData);
  return jsonData;
}

export async function downloadReport(interviewId) {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/api/download_report/${interviewId}`, {
    headers: headers,
  });
  
  if (!res.ok) throw new Error("Failed to download report");

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `MockInterview_${interviewId}.pdf`;
  link.click();
  window.URL.revokeObjectURL(url);
}

// ============================================================
// DASHBOARD APIs
// ============================================================

export async function getDashboard() {
  const res = await fetch(`${API_BASE_URL}/api/dashboard`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch dashboard");
  return res.json();
}

export async function getMasterStats() {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/master-stats`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch master stats");
  return res.json();
}

export async function getDashboardStats() {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch dashboard stats");
  return res.json();
}

// ============================================================
// INTERVIEW HISTORY & ANALYTICS
// ============================================================

export async function getHistory(limit = 10, offset = 0) {
  const res = await fetch(`${API_BASE_URL}/api/history?limit=${limit}&offset=${offset}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

export async function getUserStats() {
  const res = await fetch(`${API_BASE_URL}/api/user/stats`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch user stats");
  return res.json();
}

export async function getProgressByDomain() {
  const res = await fetch(`${API_BASE_URL}/api/user/progress-by-domain`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch progress by domain");
  return res.json();
}

export async function getScoreHistory() {
  const res = await fetch(`${API_BASE_URL}/api/user/score-history`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch score history");
  return res.json();
}

export async function getRecentInterviews(limit = 5) {
  const res = await fetch(`${API_BASE_URL}/api/user/recent-interviews?limit=${limit}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch recent interviews");
  return res.json();
}

export async function getInterviewHistory(page = 1, limit = 10) {
  const res = await fetch(`${API_BASE_URL}/api/user/interview-history?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch interview history");
  return res.json();
}

export async function getPerformanceMetrics() {
  const res = await fetch(`${API_BASE_URL}/api/user/performance-metrics`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch performance metrics");
  return res.json();
}

// ============================================================
// FLEXYOURBRAIN - APTITUDE APIs (MEMBER 2)
// ============================================================

/**
 * AI-Powered Question Generation APIs
 */

export async function startAIPracticeSession(category, difficulty = 'medium', questionCount = 10) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/aptitude/practice/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        category,
        difficulty,
        question_count: questionCount
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to start practice session');
    }

    return await response.json();
  } catch (error) {
    console.error('Error starting AI practice session:', error);
    throw error;
  }
}

export async function getAIQuestionStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/aptitude/ai/question-stats`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to get AI stats');
    return await response.json();
  } catch (error) {
    console.error('Error fetching AI question stats:', error);
    throw error;
  }
}

export async function generateAIQuestions(domains = ['Logical', 'Quantitative'], difficulties = ['medium', 'hard']) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/aptitude/ai/generate-questions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        domains,
        difficulties,
        questions_per_combination: 3
      })
    });
    if (!response.ok) throw new Error('Failed to generate questions');
    return await response.json();
  } catch (error) {
    console.error('Error generating AI questions:', error);
    throw error;
  }
}

export async function getAIDomains() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/aptitude/ai/domains`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to get AI domains');
    return await response.json();
  } catch (error) {
    console.error('Error fetching AI domains:', error);
    throw error;
  }
}

export async function resetQuestionUsage() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/aptitude/ai/reset-usage`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to reset usage');
    return await response.json();
  } catch (error) {
    console.error('Error resetting question usage:', error);
    throw error;
  }
}

/**
 * General Aptitude APIs
 */

export async function getAptitudeCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/aptitude/categories`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to get categories');
    return await response.json();
  } catch (error) {
    console.error('Error fetching aptitude categories:', error);
    throw error;
  }
}

export async function getAnalyticsOverview() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/aptitude/analytics/overview`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to get analytics');
    return await response.json();
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
}

// ============================================================
// GAMIFICATION APIs
// ============================================================

export async function getGamificationStats() {
  const res = await fetch(`${API_BASE_URL}/api/gamification/stats`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch gamification stats");
  return res.json();
}

export async function getEarnedBadges() {
  const res = await fetch(`${API_BASE_URL}/api/gamification/badges/earned`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch earned badges");
  return res.json();
}

export async function getAvailableBadges() {
  const res = await fetch(`${API_BASE_URL}/api/gamification/badges/available`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch available badges");
  return res.json();
}

export async function getLeaderboard() {
  const res = await fetch(`${API_BASE_URL}/api/gamification/leaderboard`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch leaderboard");
  return res.json();
}

export async function checkBadges() {
  const res = await fetch(`${API_BASE_URL}/api/gamification/check-badges`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to check badges");
  return res.json();
}

// ============================================================
// SETTINGS APIs
// ============================================================

export async function getProfile() {
  const res = await fetch(`${API_BASE_URL}/api/settings/profile`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export async function updateProfile(profileData) {
  const res = await fetch(`${API_BASE_URL}/api/settings/profile`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to update profile");
  }

  return res.json();
}

export async function changePassword(oldPassword, newPassword) {
  const res = await fetch(`${API_BASE_URL}/api/settings/change-password`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to change password");
  }

  return res.json();
}

export async function deleteAccount() {
  const res = await fetch(`${API_BASE_URL}/api/settings/delete-account`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to delete account");
  }

  return res.json();
}

// ============================================================
// ADMIN APIs
// ============================================================

export async function getAdminUsers(params = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.search) queryParams.append('search', params.search);
  if (params.filter_admin !== undefined) queryParams.append('filter_admin', params.filter_admin);
  if (params.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params.order) queryParams.append('order', params.order);

  const res = await fetch(`${API_BASE_URL}/api/admin/users?${queryParams}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch admin users");
  return res.json();
}

export async function getAdminUserDetails(userId) {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch user details");
  return res.json();
}

export async function updateAdminUser(userId, userData) {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(userData),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to update user");
  }

  return res.json();
}

export async function deleteAdminUser(userId) {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to delete user");
  }

  return res.json();
}

export async function getAdminUsersStats() {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/stats/overview`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch admin users stats");
  return res.json();
}

export async function getAdminQuestions(params = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.domain) queryParams.append('domain', params.domain);
  if (params.difficulty) queryParams.append('difficulty', params.difficulty);

  const res = await fetch(`${API_BASE_URL}/api/admin/questions?${queryParams}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch questions");
  return res.json();
}

export async function createAdminQuestion(questionData) {
  const res = await fetch(`${API_BASE_URL}/api/admin/questions`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(questionData),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to create question");
  }

  return res.json();
}

export async function updateAdminQuestion(questionId, questionData) {
  const res = await fetch(`${API_BASE_URL}/api/admin/questions/${questionId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(questionData),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to update question");
  }

  return res.json();
}

export async function deleteAdminQuestion(questionId) {
  const res = await fetch(`${API_BASE_URL}/api/admin/questions/${questionId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to delete question");
  }

  return res.json();
}

export async function getAdminQuestionsStats() {
  const res = await fetch(`${API_BASE_URL}/api/admin/questions/stats`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch questions stats");
  return res.json();
}

export async function getAdminBadges() {
  const res = await fetch(`${API_BASE_URL}/api/admin/badges`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch admin badges");
  return res.json();
}

export async function createAdminBadge(badgeData) {
  const res = await fetch(`${API_BASE_URL}/api/admin/badges`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(badgeData),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to create badge");
  }

  return res.json();
}

export async function deleteAdminBadge(badgeId) {
  const res = await fetch(`${API_BASE_URL}/api/admin/badges/${badgeId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to delete badge");
  }

  return res.json();
}

export async function getAdminAnalyticsOverview() {
  const res = await fetch(`${API_BASE_URL}/api/admin/analytics/overview`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch analytics overview");
  return res.json();
}

// ============================================================
// HELPER: Generic API call wrapper
// ============================================================

export const api = {
  baseURL: API_BASE_URL,
  
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          detail: `HTTP ${response.status}: ${response.statusText}` 
        }));
        throw new Error(error.detail || error.message || `Request failed with status ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },
  
  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};

// Export API_BASE_URL for direct fetch calls in other files
export { API_BASE_URL };

// Export default for convenience
export default api;