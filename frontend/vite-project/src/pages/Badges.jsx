// src/pages/Badges.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Trophy, CheckCircle, Lock, ArrowLeft, Loader2, Home, User, Zap, Settings
} from 'lucide-react';

export default function Badges() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [availableBadges, setAvailableBadges] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'earned', 'locked'

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);

      // Fetch earned badges
      const earnedRes = await fetch('https://finalyearproject-t10v.onrender.com/api/gamification/badges/earned', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (earnedRes.ok) {
        const earnedData = await earnedRes.json();
        setEarnedBadges(earnedData);
      }

      // Fetch available badges
      const availableRes = await fetch('https://finalyearproject-t10v.onrender.com/api/gamification/badges/available', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (availableRes.ok) {
        const availableData = await availableRes.json();
        setAvailableBadges(availableData);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching badges:', err);
      setLoading(false);
    }
  };

  // Get requirement description
  const getRequirementText = (badge) => {
    const type = badge.requirement_type;
    const value = badge.requirement_value;

    switch(type) {
      case 'interviews_count':
        return `Complete ${value} interviews`;
      case 'high_score_count':
        return `Score 9+ in ${value} interviews`;
      case 'score_threshold':
        return `Score ${value}/10 or higher`;
      case 'streak_days':
        return `${value} day streak`;
      case 'domain_interviews':
        return `${value} interviews in one domain`;
      case 'aptitude_score':
        return `Score ${value}% on aptitude test`;
      case 'ats_score':
        return `ATS score of ${value}+`;
      case 'module_completion':
        return `Use ${value} different modules`;
      case 'level_speed':
        return `Reach level ${value} in 2 weeks`;
      default:
        return 'Complete requirement';
    }
  };

  // Filter badges
  const getFilteredBadges = () => {
    if (filter === 'earned') return earnedBadges;
    if (filter === 'locked') return availableBadges;
    return [...earnedBadges, ...availableBadges];
  };

  const filteredBadges = getFilteredBadges();

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.colors.bgPrimary} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className={`w-16 h-16 ${theme.colors.accent} animate-spin mx-auto mb-4`} />
          <p className={`${theme.colors.textPrimary} text-lg`}>Loading badges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.colors.bgPrimary} p-4 sm:p-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/profile')}
              className={`p-2 ${theme.colors.textSecondary} hover:${theme.colors.textPrimary} transition-colors`}
              title="Back to Profile"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className={`text-3xl sm:text-4xl font-bold ${theme.colors.textPrimary} flex items-center gap-3`}>
                <Trophy className="w-8 h-8 text-yellow-500" />
                Badge Collection
              </h1>
              <p className={`${theme.colors.textMuted} text-sm mt-1`}>
                {earnedBadges.length} earned • {availableBadges.length} to unlock
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className={`p-2 ${theme.colors.textSecondary} hover:${theme.colors.textPrimary} transition-colors`}
              title="Dashboard"
            >
              <Home className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/profile')}
              className={`p-2 ${theme.colors.textSecondary} hover:${theme.colors.textPrimary} transition-colors`}
              title="Profile"
            >
              <User className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className={`p-2 ${theme.colors.textSecondary} hover:${theme.colors.textPrimary} transition-colors`}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.border} rounded-2xl p-6 text-center ${theme.colors.shadow}`}>
            <div className="text-3xl font-bold text-yellow-500 mb-2">
              {earnedBadges.length}
            </div>
            <p className={theme.colors.textSecondary}>Badges Earned</p>
          </div>

          <div className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.border} rounded-2xl p-6 text-center ${theme.colors.shadow}`}>
            <div className={`text-3xl font-bold ${theme.colors.accent} mb-2`}>
              {availableBadges.length}
            </div>
            <p className={theme.colors.textSecondary}>To Unlock</p>
          </div>

          <div className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.border} rounded-2xl p-6 text-center ${theme.colors.shadow}`}>
            <div className="text-3xl font-bold text-green-500 mb-2">
              {Math.round((earnedBadges.length / (earnedBadges.length + availableBadges.length)) * 100) || 0}%
            </div>
            <p className={theme.colors.textSecondary}>Completion</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              filter === 'all'
                ? `${theme.colors.btnPrimary} ${theme.colors.shadow}`
                : `${theme.colors.btnSecondary}`
            }`}
          >
            All Badges ({earnedBadges.length + availableBadges.length})
          </button>
          <button
            onClick={() => setFilter('earned')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              filter === 'earned'
                ? `${theme.colors.btnPrimary} ${theme.colors.shadow}`
                : `${theme.colors.btnSecondary}`
            }`}
          >
            Earned ({earnedBadges.length})
          </button>
          <button
            onClick={() => setFilter('locked')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
              filter === 'locked'
                ? `${theme.colors.btnPrimary} ${theme.colors.shadow}`
                : `${theme.colors.btnSecondary}`
            }`}
          >
            Locked ({availableBadges.length})
          </button>
        </div>

        {/* Badges Grid */}
        {filteredBadges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBadges.map((badge) => {
              const isEarned = earnedBadges.some(b => b.id === badge.id);
              
              return (
                <div
                  key={badge.id}
                  className={`relative backdrop-blur-xl border rounded-3xl p-6 transition-all duration-300 ${
                    isEarned
                      ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/50 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/20'
                      : `${theme.colors.bgCard} ${theme.colors.border} hover:${theme.colors.bgCard}`
                  }`}
                >
                  {/* Earned Badge Indicator */}
                  {isEarned && (
                    <div className="absolute top-4 right-4">
                      <CheckCircle className="w-6 h-6 text-green-500 fill-green-500/20" />
                    </div>
                  )}

                  {/* Badge Icon */}
                  <div className="relative mb-4">
                    <div className={`w-24 h-24 mx-auto rounded-2xl flex items-center justify-center text-5xl ${
                      isEarned
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/50'
                        : `${theme.colors.bgGlass} border ${theme.colors.borderLight}`
                    }`}>
                      {badge.icon || '🏆'}
                    </div>
                    
                    {/* Lock overlay for locked badges */}
                    {!isEarned && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl backdrop-blur-sm">
                        <Lock className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Badge Info */}
                  <h3 className={`text-xl font-bold text-center mb-2 ${
                    isEarned ? 'text-orange-600' : theme.colors.textSecondary
                  }`}>
                    {badge.name}
                  </h3>

                  <p className={`text-center text-sm mb-4 ${
                    isEarned ? theme.colors.textSecondary : theme.colors.textMuted
                  }`}>
                    {badge.description}
                  </p>

                  {/* Requirement */}
                  <div className={`text-center text-xs px-3 py-2 rounded-lg font-medium ${
                    isEarned
                      ? 'bg-green-500/20 text-green-600 border border-green-500/50'
                      : `${theme.colors.bgCard} ${theme.colors.textSecondary} border ${theme.colors.borderLight}`
                  }`}>
                    {isEarned ? '✓ Completed' : getRequirementText(badge)}
                  </div>

                  {/* XP Reward */}
                  <div className="mt-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                      isEarned
                        ? 'bg-orange-500/20 text-orange-600 border border-orange-500/30'
                        : `${theme.colors.bgGlass} ${theme.colors.textMuted} border ${theme.colors.borderLight}`
                    }`}>
                      <Zap className="w-3 h-3" />
                      +{badge.xp_reward} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <Trophy className={`w-20 h-20 ${theme.colors.textMuted} mx-auto mb-4`} />
            <p className={`${theme.colors.textMuted} text-lg`}>No badges to display</p>
          </div>
        )}
      </div>
    </div>
  );
}