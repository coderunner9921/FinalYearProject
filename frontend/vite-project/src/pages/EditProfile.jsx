// src/pages/EditProfile.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  ArrowLeft, Save, Loader2, CheckCircle, XCircle, User,
  Mail, Briefcase, Linkedin, Github, Calendar, Heart, Code
} from 'lucide-react';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    target_role: '',
    linkedin_url: '',
    github_url: '',
    date_of_birth: '',
    hobbies: '',
    skills: ''
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  // Fetch current profile data
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('http://127.0.0.1:8000/api/settings/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name || '',
          email: data.email || '',
          bio: data.bio || '',
          target_role: data.target_role || '',
          linkedin_url: data.linkedin_url || '',
          github_url: data.github_url || '',
          date_of_birth: data.date_of_birth || '',
          hobbies: data.hobbies || '',
          skills: data.skills || ''
        });
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      showMessage('error', 'Failed to load profile data');
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // LinkedIn URL validation
    if (formData.linkedin_url && !formData.linkedin_url.includes('linkedin.com')) {
      newErrors.linkedin_url = 'Invalid LinkedIn URL';
    }

    // GitHub URL validation
    if (formData.github_url && !formData.github_url.includes('github.com')) {
      newErrors.github_url = 'Invalid GitHub URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showMessage('error', 'Please fix the errors in the form');
      return;
    }

    const token = localStorage.getItem('token');
    setSaving(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/settings/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          bio: formData.bio || null,
          target_role: formData.target_role || null,
          linkedin_url: formData.linkedin_url || null,
          github_url: formData.github_url || null,
          date_of_birth: formData.date_of_birth || null,
          hobbies: formData.hobbies || null,
          skills: formData.skills || null
        })
      });

      if (res.ok) {
        showMessage('success', 'Profile updated successfully!');
        
        // Update localStorage with new user data
        const data = await res.json();
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Navigate back to profile after 1 second
        setTimeout(() => {
          navigate('/profile');
        }, 1000);
      } else {
        const error = await res.json();
        showMessage('error', error.detail || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      showMessage('error', 'Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${theme.colors.bgPrimary} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className={`w-16 h-16 ${theme.colors.accent} animate-spin mx-auto mb-4`} />
          <p className={theme.colors.textPrimary}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.colors.bgPrimary} p-6 relative overflow-hidden`}>
      {/* Animated Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 -left-40 w-96 h-96 ${theme.colors.decorativeBg1} rounded-full blur-3xl opacity-20 animate-pulse`}></div>
        <div className={`absolute top-40 -right-40 w-96 h-96 ${theme.colors.decorativeBg2} rounded-full blur-3xl opacity-20 animate-pulse`} style={{animationDelay: '1s'}}></div>
        <div className={`absolute -bottom-40 left-1/3 w-96 h-96 ${theme.colors.decorativeBg3} rounded-full blur-3xl opacity-20 animate-pulse`} style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Message Toast */}
        {message.text && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl border flex items-center gap-3 shadow-xl animate-slide-in ${
            message.type === 'success' 
              ? 'bg-green-500/20 backdrop-blur-xl border-green-500/50 text-green-300' 
              : 'bg-red-500/20 backdrop-blur-xl border-red-500/50 text-red-300'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="font-semibold">{message.text}</span>
          </div>
        )}

        {/* Header */}
        <div className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.borderLight} rounded-3xl p-8 mb-6 ${theme.colors.shadow}`}>
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => navigate('/profile')}
              className={`p-2 ${theme.colors.btnSecondary} rounded-xl transition-colors`}
            >
              <ArrowLeft className={`w-6 h-6 ${theme.colors.textPrimary}`} />
            </button>
            <div>
              <h1 className={`text-4xl font-bold ${theme.colors.textPrimary}`}>Edit Profile</h1>
              <p className={`${theme.colors.textSecondary} text-lg`}>
                Update your personal information
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={`${theme.colors.bgCard} backdrop-blur-xl border ${theme.colors.borderLight} rounded-3xl p-8 ${theme.colors.shadow}`}>
          
          {/* Basic Information */}
          <div className="mb-8">
            <h2 className={`text-2xl font-bold ${theme.colors.textPrimary} mb-6`}>Basic Information</h2>
            
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className={`block ${theme.colors.textSecondary} text-sm mb-2`}>
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 ${theme.colors.bgInput} border ${errors.name ? 'border-red-500' : theme.colors.borderLight} rounded-xl ${theme.colors.textPrimary} placeholder-gray-500 ${theme.colors.borderFocus} transition-all`}
                  placeholder="Enter your full name"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className={`block ${theme.colors.textSecondary} text-sm mb-2`}>
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 ${theme.colors.bgInput} border ${errors.email ? 'border-red-500' : theme.colors.borderLight} rounded-xl ${theme.colors.textPrimary} placeholder-gray-500 ${theme.colors.borderFocus} transition-all`}
                  placeholder="your.email@example.com"
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Bio */}
              <div>
                <label className={`block ${theme.colors.textSecondary} text-sm mb-2`}>Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className={`w-full px-4 py-3 ${theme.colors.bgInput} border ${theme.colors.borderLight} rounded-xl ${theme.colors.textPrimary} placeholder-gray-500 ${theme.colors.borderFocus} transition-all`}
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="mb-8">
            <h2 className={`text-2xl font-bold ${theme.colors.textPrimary} mb-6`}>Professional Information</h2>
            
            <div className="space-y-4">
              {/* Target Role */}
              <div>
                <label className={`block ${theme.colors.textSecondary} text-sm mb-2`}>
                  <Briefcase className="w-4 h-4 inline mr-2" />
                  Target Role
                </label>
                <input
                  type="text"
                  name="target_role"
                  value={formData.target_role}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 ${theme.colors.bgInput} border ${theme.colors.borderLight} rounded-xl ${theme.colors.textPrimary} placeholder-gray-500 ${theme.colors.borderFocus} transition-all`}
                  placeholder="e.g., Software Engineer, Data Scientist"
                />
              </div>

              {/* Skills */}
              <div>
                <label className={`block ${theme.colors.textSecondary} text-sm mb-2`}>
                  <Code className="w-4 h-4 inline mr-2" />
                  Skills
                </label>
                <textarea
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-4 py-3 ${theme.colors.bgInput} border ${theme.colors.borderLight} rounded-xl ${theme.colors.textPrimary} placeholder-gray-500 ${theme.colors.borderFocus} transition-all`}
                  placeholder="List your skills (e.g., Python, React, Machine Learning)"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="mb-8">
            <h2 className={`text-2xl font-bold ${theme.colors.textPrimary} mb-6`}>Social Links</h2>
            
            <div className="space-y-4">
              {/* LinkedIn */}
              <div>
                <label className={`block ${theme.colors.textSecondary} text-sm mb-2`}>
                  <Linkedin className="w-4 h-4 inline mr-2" />
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  name="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 ${theme.colors.bgInput} border ${errors.linkedin_url ? 'border-red-500' : theme.colors.borderLight} rounded-xl ${theme.colors.textPrimary} placeholder-gray-500 ${theme.colors.borderFocus} transition-all`}
                  placeholder="https://www.linkedin.com/in/yourprofile"
                />
                {errors.linkedin_url && <p className="text-red-400 text-sm mt-1">{errors.linkedin_url}</p>}
              </div>

              {/* GitHub */}
              <div>
                <label className={`block ${theme.colors.textSecondary} text-sm mb-2`}>
                  <Github className="w-4 h-4 inline mr-2" />
                  GitHub URL
                </label>
                <input
                  type="url"
                  name="github_url"
                  value={formData.github_url}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 ${theme.colors.bgInput} border ${errors.github_url ? 'border-red-500' : theme.colors.borderLight} rounded-xl ${theme.colors.textPrimary} placeholder-gray-500 ${theme.colors.borderFocus} transition-all`}
                  placeholder="https://github.com/yourusername"
                />
                {errors.github_url && <p className="text-red-400 text-sm mt-1">{errors.github_url}</p>}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="mb-8">
            <h2 className={`text-2xl font-bold ${theme.colors.textPrimary} mb-6`}>Personal Information</h2>
            
            <div className="space-y-4">
              {/* Date of Birth */}
              <div>
                <label className={`block ${theme.colors.textSecondary} text-sm mb-2`}>
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 ${theme.colors.bgInput} border ${theme.colors.borderLight} rounded-xl ${theme.colors.textPrimary} placeholder-gray-500 ${theme.colors.borderFocus} transition-all`}
                />
              </div>

              {/* Hobbies */}
              <div>
                <label className={`block ${theme.colors.textSecondary} text-sm mb-2`}>
                  <Heart className="w-4 h-4 inline mr-2" />
                  Hobbies & Interests
                </label>
                <textarea
                  name="hobbies"
                  value={formData.hobbies}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full px-4 py-3 ${theme.colors.bgInput} border ${theme.colors.borderLight} rounded-xl ${theme.colors.textPrimary} placeholder-gray-500 ${theme.colors.borderFocus} transition-all`}
                  placeholder="What do you enjoy doing in your free time?"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className={`flex-1 px-6 py-3 ${theme.colors.btnSecondary} rounded-xl font-semibold transition-all`}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 px-6 py-3 ${theme.colors.btnPrimary} rounded-xl font-semibold transition-all flex items-center justify-center gap-2`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}