// src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  User, Settings, LogOut, Crown, Trophy, Flame, Calendar,
  Mic, ArrowRight, Edit, Home, Loader2,
  Linkedin, Github, Cake, Heart, Code
} from 'lucide-react';

// In-memory cache (session only)
let profileCache = {
  data: null,
  timestamp: null,
  CACHE_DURATION: 60000 // 1 minute
};

export default function Profile() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [profileExtra, setProfileExtra] = useState(null);
  const [gamificationStats, setGamificationStats] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [recentInterviews, setRecentInterviews] = useState([]);
  const [interviewStats, setInterviewStats] = useState(null);
  const [progressByDomain, setProgressByDomain] = useState([]);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    const now = Date.now();
    if (profileCache.data && now - profileCache.timestamp < profileCache.CACHE_DURATION) {
      console.log('Using cached profile data');
      const c = profileCache.data;
      setProfileExtra(c.profileExtra);
      setGamificationStats(c.gamificationStats);
      setEarnedBadges(c.earnedBadges);
      setRecentInterviews(c.recentInterviews);
      setInterviewStats(c.interviewStats);
      setProgressByDomain(c.progressByDomain);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching fresh profile data...');

      const [
        profileRes, gamRes, badgesRes, recentRes, statsRes, progressRes
      ] = await Promise.all([
        fetch('https://finalyearproject-t10v.onrender.com/api/settings/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://finalyearproject-t10v.onrender.com/api/gamification/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://finalyearproject-t10v.onrender.com/api/gamification/badges/earned', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://finalyearproject-t10v.onrender.com/api/user/recent-interviews?limit=5', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://finalyearproject-t10v.onrender.com/api/user/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('https://finalyearproject-t10v.onrender.com/api/user/progress-by-domain', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [
        profileJson, gamJson, badgesJson, recentJson, statsJson, progressJson
      ] = await Promise.all([
        profileRes.ok ? profileRes.json() : null,
        gamRes.ok ? gamRes.json() : null,
        badgesRes.ok ? badgesRes.json() : null,
        recentRes.ok ? recentRes.json() : null,
        statsRes.ok ? statsRes.json() : null,
        progressRes.ok ? progressRes.json() : null
      ]);

      setProfileExtra(profileJson);
      setGamificationStats(gamJson);
      setEarnedBadges(badgesJson || []);
      setRecentInterviews(recentJson?.recent_interviews || []);
      setInterviewStats(statsJson);
      setProgressByDomain(progressJson?.progress || []);

      profileCache.data = {
        profileExtra: profileJson,
        gamificationStats: gamJson,
        earnedBadges: badgesJson || [],
        recentInterviews: recentJson?.recent_interviews || [],
        interviewStats: statsJson,
        progressByDomain: progressJson?.progress || []
      };
      profileCache.timestamp = Date.now();

      setLoading(false);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Failed to load profile');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    profileCache.data = null;
    logout();
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDOB = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getLevelTitle = (level = 1) => {
    if (level >= 20) return 'Master Interviewer';
    if (level >= 15) return 'Interview Expert';
    if (level >= 10) return 'Career Architect';
    if (level >= 5) return 'Rising Professional';
    return 'Interview Novice';
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.colors.bgPrimary} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className={`w-16 h-16 ${theme.colors.accent} animate-spin mx-auto mb-4`} />
          <p className={`${theme.colors.textPrimary} text-lg`}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.colors.bgPrimary} flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={() => navigate('/master-dashboard')}
            className={`px-6 py-3 ${theme.colors.btnPrimary} text-white rounded-xl`}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const profile = {
    name: user?.name || 'User',
    email: user?.email || '',
    level: gamificationStats?.current_level || 1,
    title: getLevelTitle(gamificationStats?.current_level),
    currentXP: gamificationStats?.total_xp || 0,
    maxXP: gamificationStats?.xp_to_next_level || 100,
    xpProgress: gamificationStats?.xp_progress_percentage || 0,
    streak: gamificationStats?.current_streak || 0,
    longestStreak: gamificationStats?.longest_streak || 0,
    badgesCount: gamificationStats?.badges_count || 0,
    joinDate: user?.created_at
      ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'Recently'
  };

  const hasExtraInfo = profileExtra && (
    profileExtra.bio ||
    profileExtra.target_role ||
    profileExtra.linkedin_url ||
    profileExtra.github_url ||
    profileExtra.date_of_birth ||
    profileExtra.hobbies ||
    profileExtra.skills
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.colors.bgPrimary} p-4 sm:p-6 relative overflow-hidden`}>
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 -left-40 w-96 h-96 ${theme.colors.decorativeBg1} rounded-full blur-3xl opacity-20 animate-pulse`} />
        <div className={`absolute top-40 -right-40 w-96 h-96 ${theme.colors.decorativeBg2} rounded-full blur-3xl opacity-20 animate-pulse`} style={{ animationDelay: '1s' }} />
        <div className={`absolute bottom-20 left-1/3 w-96 h-96 ${theme.colors.decorativeBg3} rounded-full blur-3xl opacity-20 animate-pulse`} style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top nav */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${theme.colors.textPrimary}`}>Your Profile</h1>
            <p className={`${theme.colors.textMuted} text-sm`}>Your progress & personal info</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/master-dashboard')}
              className={`px-4 py-2 ${theme.colors.textSecondary} hover:${theme.colors.textPrimary} flex items-center gap-2 text-sm`}
            >
              <Home className="w-5 h-5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/settings')}
              className={`px-4 py-2 ${theme.colors.textSecondary} hover:${theme.colors.textPrimary} flex items-center gap-2 text-sm`}
            >
              <Settings className="w-5 h-5" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={handleLogout}
              className={`px-4 py-2 ${theme.colors.btnDanger} text-red-300 rounded-lg border flex items-center gap-2 text-sm`}
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Main Profile Card */}
        <div className={`bg-gradient-to-br ${theme.colors.cardGradient} backdrop-blur-xl border ${theme.colors.border} rounded-3xl p-6 sm:p-8 mb-8 ${theme.colors.glow}`}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left – Avatar + Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                {/* Avatar with crown */}
                <div className="relative shrink-0 mx-auto sm:mx-0">
                  <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-10">
                    <Crown className="w-16 h-16 text-yellow-400 opacity-85 drop-shadow-xl" fill="currentColor" />
                  </div>
                  <div className={`w-36 h-36 sm:w-44 sm:h-44 ${theme.colors.bgCard} rounded-full flex items-center justify-center border-4 ${theme.colors.borderLight} backdrop-blur-xl overflow-hidden shadow-lg`}>
                    <User className={`w-24 h-24 sm:w-28 sm:h-28 ${theme.colors.textPrimary} opacity-90`} />
                  </div>
                </div>

                {/* Name, level, progress, extra info */}
                <div className="flex-1 w-full sm:w-auto">
                  <h2 className={`text-3xl sm:text-4xl font-bold ${theme.colors.textPrimary} mb-1`}>{profile.name}</h2>
                  <p className={`${theme.colors.textSecondary} text-lg sm:text-xl mb-4`}>
                    Level {profile.level} • {profile.title}
                  </p>

                  {/* XP bar */}
                  <div className="mb-5">
                    <div className={`flex justify-between text-sm ${theme.colors.textMuted} mb-1.5 font-medium`}>
                      <span>Experience</span>
                      <span>{profile.currentXP} / {profile.maxXP} XP</span>
                    </div>
                    <div className={`h-3.5 ${theme.colors.progressTrack} rounded-full overflow-hidden`}>
                      <div
                        className={`h-full ${theme.colors.btnPrimary} rounded-r-full transition-all duration-700 ease-out`}
                        style={{ width: `${profile.xpProgress}%` }}
                      />
                    </div>
                  </div>

                  <p className={`${theme.colors.textMuted} text-sm mb-5`}>{profile.email}</p>

                  {/* Extra profile fields */}
                  {hasExtraInfo && (
                    <div className={`space-y-4 text-sm ${theme.colors.textSecondary}`}>
                      {profileExtra.bio && (
                        <div>
                          <p className={`${theme.colors.textMuted} text-xs mb-1 font-medium`}>Bio</p>
                          <p className="leading-relaxed">{profileExtra.bio}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                        {profileExtra.target_role && (
                          <div>
                            <p className={`${theme.colors.textMuted} text-xs mb-1 font-medium`}>Target Role</p>
                            <p className="font-medium">{profileExtra.target_role}</p>
                          </div>
                        )}

                        {profileExtra.linkedin_url && (
                          <div className="flex items-center gap-2.5">
                            <Linkedin className={`w-5 h-5 ${theme.colors.accent}`} />
                            <a href={profileExtra.linkedin_url} target="_blank" rel="noopener noreferrer" className={`${theme.colors.accent} hover:underline text-sm`}>
                              LinkedIn
                            </a>
                          </div>
                        )}

                        {profileExtra.github_url && (
                          <div className="flex items-center gap-2.5">
                            <Github className={`w-5 h-5 ${theme.colors.accent}`} />
                            <a href={profileExtra.github_url} target="_blank" rel="noopener noreferrer" className={`${theme.colors.accent} hover:underline text-sm`}>
                              GitHub
                            </a>
                          </div>
                        )}

                        {profileExtra.date_of_birth && (
                          <div className="flex items-center gap-2.5">
                            <Cake className={`w-5 h-5 ${theme.colors.accent}`} />
                            <span className="text-sm">{formatDOB(profileExtra.date_of_birth)}</span>
                          </div>
                        )}
                      </div>

                      {(profileExtra.hobbies || profileExtra.skills) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 mt-2">
                          {profileExtra.hobbies && (
                            <div>
                              <p className={`${theme.colors.textMuted} text-xs mb-1 font-medium flex items-center gap-1.5`}>
                                <Heart className="w-4 h-4" /> Hobbies
                              </p>
                              <p className="leading-relaxed">{profileExtra.hobbies}</p>
                            </div>
                          )}

                          {profileExtra.skills && (
                            <div>
                              <p className={`${theme.colors.textMuted} text-xs mb-1 font-medium flex items-center gap-1.5`}>
                                <Code className="w-4 h-4" /> Skills
                              </p>
                              <p className="leading-relaxed">{profileExtra.skills}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => navigate('/edit-profile')}
                    className={`mt-6 px-7 py-3 ${theme.colors.btnPrimary} text-white font-semibold rounded-xl flex items-center gap-2.5 hover:scale-105 transition-transform shadow-md`}
                  >
                    <Edit className="w-5 h-5" />
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Right column – quick stats */}
            <div className="space-y-4 lg:space-y-5">
              <div className={`${theme.colors.bgCard} backdrop-blur border ${theme.colors.borderLight} rounded-2xl p-5 flex items-center gap-4`}>
                <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <Flame className="w-7 h-7 text-orange-400" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${theme.colors.textPrimary}`}>{profile.streak}</p>
                  <p className={`${theme.colors.textMuted} text-sm`}>Day Streak</p>
                  {profile.longestStreak > 0 && (
                    <p className={`text-xs ${theme.colors.textMuted} mt-0.5`}>
                      Best: {profile.longestStreak} days
                    </p>
                  )}
                </div>
              </div>

              <div className={`${theme.colors.bgCard} backdrop-blur border ${theme.colors.borderLight} rounded-2xl p-5 flex items-center gap-4`}>
                <div className="w-14 h-14 bg-yellow-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <Trophy className="w-7 h-7 text-yellow-400" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${theme.colors.textPrimary}`}>{profile.badgesCount}</p>
                  <p className={`${theme.colors.textMuted} text-sm`}>Badges Earned</p>
                </div>
              </div>

              <div className={`${theme.colors.bgCard} backdrop-blur border ${theme.colors.borderLight} rounded-2xl p-5 flex items-center gap-4`}>
                <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <Calendar className="w-7 h-7 text-blue-400" />
                </div>
                <div>
                  <p className={`text-xl font-bold ${theme.colors.textPrimary}`}>Joined {profile.joinDate}</p>
                  <p className={`${theme.colors.textMuted} text-sm`}>Member since</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Earned Badges */}
          <div className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.borderLight} rounded-3xl p-6`}>
            <h3 className={`text-2xl font-bold ${theme.colors.textPrimary} mb-6`}>Earned Badges</h3>

            {earnedBadges.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                  {earnedBadges.slice(0, 4).map((badge) => (
                    <div
                      key={badge.id}
                      className={`${theme.colors.bgGlass} backdrop-blur-xl border ${theme.colors.borderLight} rounded-2xl p-5 text-center transition-transform hover:scale-[1.02]`}
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-md">
                        {badge.icon || '🏆'}
                      </div>
                      <h4 className={`${theme.colors.textPrimary} font-bold mb-1.5`}>{badge.name}</h4>
                      <p className={`${theme.colors.textSecondary} text-sm mb-2`}>{badge.description}</p>
                      <p className={`${theme.colors.accent} text-xs font-medium`}>+{badge.xp_reward} XP</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/badges')}
                  className={`w-full py-3.5 ${theme.colors.btnSecondary} ${theme.colors.textPrimary} font-semibold rounded-xl border ${theme.colors.borderLight} flex items-center justify-center gap-2 hover:opacity-90 transition`}
                >
                  View All {earnedBadges.length} Badges
                  <ArrowRight className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="text-center py-12">
                <Trophy className={`w-16 h-16 ${theme.colors.textMuted} mx-auto mb-4`} />
                <p className={`${theme.colors.textMuted}`}>No badges yet</p>
                <p className={`${theme.colors.textMuted} text-sm mt-2`}>Finish interviews to earn badges!</p>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.borderLight} rounded-3xl p-6`}>
            <h3 className={`text-2xl font-bold ${theme.colors.textPrimary} mb-6`}>Recent Activity</h3>

            {recentInterviews.length > 0 ? (
              <div className="space-y-6">
                {recentInterviews.map((interview, idx) => (
                  <div key={interview.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-12 h-12 ${theme.colors.btnPrimary} rounded-xl flex items-center justify-center shrink-0 ring-1 ring-white/10`}>
                        <Mic className="w-6 h-6 text-white" />
                      </div>
                      {idx < recentInterviews.length - 1 && (
                        <div className={`w-0.5 flex-1 bg-gradient-to-b from-transparent via-${theme.colors.borderLight?.replace('border-', 'bg-') || 'gray-700'} to-transparent mt-1`} />
                      )}
                    </div>
                    <div className="flex-1 pt-1.5">
                      <p className={`${theme.colors.textMuted} text-xs sm:text-sm mb-1`}>
                        {formatDate(interview.created_at)}
                      </p>
                      <p className={`${theme.colors.textPrimary} text-sm sm:text-base`}>
                        Completed {interview.domain} interview
                        {interview.overall_score && (
                          <span className={`${theme.colors.accent} font-medium`}>
                            {' • Score: '}{interview.overall_score}/10
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Mic className={`w-16 h-16 ${theme.colors.textMuted} mx-auto mb-4`} />
                <p className={theme.colors.textMuted}>No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}