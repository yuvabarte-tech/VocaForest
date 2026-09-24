// @ts-nocheck
import StudentProfile from "./components/StudentProfile";

import AITeacherChat from './components/AITeacherChat';
import BackgroundAudio from './components/BackgroundAudio';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  BookOpen,
  Award,
  Gamepad2,
  User,
  LogOut,
  Mail,
  Megaphone,
  Sparkles,
  Trophy,
  Activity,
  CheckCircle
} from 'lucide-react';

import ForestCanvas from './components/ForestCanvas';
import AvatarSelector, { getAvatarData, AVATARS } from './components/AvatarSelector';
import MagicJournal from './components/MagicJournal';
import TrainingCards from './components/TrainingCards';
import FieldMission from './components/FieldMission';
import TeacherDashboard from './components/TeacherDashboard';
import MedalsAndCerts from './components/MedalsAndCerts';
import DailyMission from './components/DailyMission';
import GreatCanopy from './components/GreatCanopy';
import VocaPet from './components/VocaPet';
import WhisperingWoods from './components/WhisperingWoods';
import CollectibleCards from './components/CollectibleCards';
import ThesaurusActivity from './components/ThesaurusActivity';
import { vocabularyDb } from './vocabulary';

// Helper function removed - it was causing data loss by overwriting server data with stale local data

export default function App() {
  // Authentication & Layout Routing
  const [role, setRole] = useState<'student' | 'teacher' | null>(null);
  const [student, setStudent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('hq');
  const [bulletinNotice, setBulletinNotice] = useState<string>('');
  const [vocabLoaded, setVocabLoaded] = useState(false);
  
  // Login form state
  const [loginRole, setLoginRole] = useState<'student' | 'teacher' | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Mail Notification Popup
  const [showMailbox, setShowMailbox] = useState(false);
  const [mailContent, setMailContent] = useState('');
  
  // Storyline Modal
  const [showStory, setShowStory] = useState(false);

  // Fetch bulletin noticeboard message and sync vocabulary on startup
  const fetchBulletinAndVocab = async () => {
    try {
      const response = await fetch('/api/noticeboard');
      if (response.ok) {
        const data = await response.json();
        setBulletinNotice(data.message);
      }
    } catch (e) {
      console.warn(e);
    }

    try {
      const response = await fetch('/api/vocabulary');
      if (response.ok) {
        const list = await response.json();
        if (Array.isArray(list) && list.length > 0) {
          vocabularyDb.splice(0, vocabularyDb.length, ...list);
          setVocabLoaded(prev => !prev); // Trigger state change to force child update
        }
      }
    } catch (e) {
      console.warn("Failed to sync vocabulary:", e);
    }
  };

  useEffect(() => {
    fetchBulletinAndVocab();
    const interval = setInterval(fetchBulletinAndVocab, 15000); // Poll noticeboard and vocab every 15s

    // Preload all avatar images asynchronously for instant cache load (resolves Bug 3!)
    AVATARS.forEach((av) => {
      const img = new Image();
      img.src = av.img;
    });

    return () => clearInterval(interval);
  }, []);

  // Poll for student updates (to keep real-time progress syncing across multiple devices!)
  useEffect(() => {
    if (role === 'student' && student) {
      const syncInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/student/profile/${student.username}`);
          if (response.ok) {
            const data = await response.json();
            
            // Prevent stale server overwrite race condition safely without data loss!
            setStudent((prevStudent: any) => {
              if (!prevStudent) return data;
              
              // Use lastUpdated timestamp to prevent stale server responses from overwriting new local saves!
              if (prevStudent.lastUpdated && data.lastUpdated && prevStudent.lastUpdated > data.lastUpdated) {
                 return prevStudent;
              }

              return data;
            });

            // Check for new teacher message in logs
            const teacherNote = data.lastAttemptedWords?.find((log: any) => log.wordCode === 'TEACHER_NOTE');
            if (teacherNote && teacherNote.note && !teacherNote.read) {
              setMailContent(teacherNote.note);
              setShowMailbox(true);
              // Mark note as read locally/server side in a fast patch
              teacherNote.read = true;
            }
          }
        } catch (e) {
          console.warn("Seamless sync error:", e);
        }
      }, 8000); // Poll and sync every 8 seconds

      return () => clearInterval(syncInterval);
    }
  }, [role, student]);



  // Auth Action
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput.trim()) return;

    setLoginError('');
    setIsLoggingIn(true);

    try {
      let cachedStudent: any = null;
      if (loginRole === 'student') {
        try {
          const raw = localStorage.getItem('vocaforest_student_' + usernameInput.toLowerCase().trim());
          if (raw) cachedStudent = JSON.parse(raw);
        } catch (e) {}
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput,
          role: loginRole,
          cachedStudent
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRole(data.role);
        if (data.role === 'student') {
          const finalStudent = data.student;
          try {
            localStorage.setItem('vocaforest_student_' + finalStudent.username.toLowerCase().trim(), JSON.stringify(finalStudent));
          } catch (e) {}

          setStudent(finalStudent);
          setActiveTab('hq');
          setShowStory(true);

          // Check for initial unread notes from Teacher
          const note = finalStudent.lastAttemptedWords?.find((log: any) => log.wordCode === 'TEACHER_NOTE');
          if (note && note.note) {
            setMailContent(note.note);
            setShowMailbox(true);
          }
        } else {
          setActiveTab('teacherDash');
        }
        // Clear login fields
        setUsernameInput('');
        setPasswordInput('');
        setLoginRole(null);
      } else {
        const errData = await response.json();
        setLoginError(errData.error || "Incorrect login parameters.");
      }
    } catch (e) {
      setLoginError("Failed to connect to full-stack server.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Synchronize student state to localStorage on changes
  useEffect(() => {
    if (student && student.username) {
      try {
        localStorage.setItem('vocaforest_student_' + student.username.toLowerCase().trim(), JSON.stringify(student));
      } catch (e) {}
    }
  }, [student]);

  const handleLogout = () => {
    setRole(null);
    setStudent(null);
    setActiveTab('hq');
  };

  // Avatar Selected Update handler
  const handleSelectAvatar = async (avatarKey: string) => {
    if (!student) return;
    try {
      const response = await fetch('/api/student/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: student.username, avatar: avatarKey })
      });
      if (response.ok) {
        const data = await response.json();
        setStudent(data.student);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Custom Avatar Theme / emoji lookup helper
  const avatarData = student ? getAvatarData(student.avatar) : null;

  return (
    <div className="relative w-full h-screen overflow-hidden font-body flex bg-[#122614] bg-cover bg-center" style={{ backgroundImage: "url('https://i.ibb.co/21y2yhC3/forest.png')" }}>

      
      {/* Background Soft Overlay - Immersive Dark Forest Tint */}
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" />

      <AnimatePresence mode="wait">
        {/* ================= LOGIN PANEL ================= */}
        {role === null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="glass-panel w-full max-w-4xl p-8 flex flex-col md:flex-row items-center gap-8 border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.6)] bg-white/10 backdrop-blur-xl">
              
              {/* Mascot & Welcome Banner */}
              <div className="flex-1 flex flex-col items-center text-center">
                <img
                  src="https://i.ibb.co/r2pW26Mw/icon-Copy.png"
                  alt="VocaForest Logo"
                  className="w-56 md:w-64 mb-2 drop-shadow-[0_10px_25px_rgba(0,0,0,0.4)] animate-bounce"
                />
                <h1 className="font-display text-4xl text-white font-bold leading-none select-none drop-shadow-[0_4px_12px_rgba(16,185,129,0.5)]">
                  VOCAFOREST <span className="text-emerald-400">4.5</span>
                </h1>
                <p className="text-[10px] text-emerald-300 font-bold tracking-widest uppercase mt-2.5 mb-1">
                  Magical Learning Adventure
                </p>
                <p className="text-sm text-yellow-300 font-bold italic mb-4 drop-shadow-md">
                  Can you save the VocaForest?
                </p>

                <img
                  src="https://i.ibb.co/p6Bg3wbw/wave.png"
                  alt="Teacher Yuva"
                  className="w-48 h-48 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] animate-pulse"
                />
              </div>

              {/* Login Controls Form */}
              <div className="flex-1 w-full max-w-sm flex flex-col items-center bg-white rounded-3xl p-6 border-2 border-white shadow-inner">
                <h2 className="font-display text-2xl text-slate-800 font-bold mb-6 text-center">
                  Who is exploring today?
                </h2>

                {loginRole === null ? (
                  <div className="flex flex-col space-y-4 w-full">
                    {/* Student Select button */}
                    <button
                      onClick={() => setLoginRole('student')}
                      className="w-full transition-all focus:outline-none focus:ring-0 active:scale-95"
                    >
                      <img
                        src="https://i.ibb.co/pjHn9t7J/student-icon.png"
                        alt="Student Portal"
                        className="w-72 h-40 object-contain mx-auto drop-shadow-md hover:scale-105 transition-transform"
                      />
                    </button>

                    {/* Teacher Select button */}
                    <button
                      onClick={() => setLoginRole('teacher')}
                      className="w-full transition-all focus:outline-none focus:ring-0 active:scale-95"
                    >
                      <img
                        src="https://i.ibb.co/vyq6B8w/teacher-icon-removebg-preview.png"
                        alt="Teacher Portal"
                        className="w-72 h-40 object-contain mx-auto drop-shadow-md hover:scale-105 transition-transform"
                      />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleLogin} className="w-full space-y-4">
                    <div className="text-center mb-3">
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full uppercase">
                        {loginRole === 'student' ? 'Student Entry' : 'Teacher Guard'}
                      </span>
                    </div>

                    <div>
                      <label className="text-xs text-emerald-800 font-bold ml-1">Username / ID</label>
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        placeholder={loginRole === 'student' ? 'e.g., aisy' : 'E.g., teacher'}
                        className="w-full bg-white border-4 border-emerald-100 rounded-2xl py-2.5 px-4 text-base focus:outline-none focus:border-emerald-500 font-body font-semibold text-emerald-900 mt-1 shadow-inner"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-emerald-800 font-bold ml-1">Password</label>
                      <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white border-4 border-emerald-100 rounded-2xl py-2.5 px-4 text-base focus:outline-none focus:border-emerald-500 font-body font-semibold text-emerald-900 mt-1 shadow-inner"
                      />
                    </div>

                    {loginError && (
                      <p className="text-xs text-rose-600 font-semibold bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl text-center">
                        {loginError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full border-0 bg-transparent focus:outline-none active:scale-95 transition-transform mt-4"
                    >
                      <img
                        src="https://i.ibb.co/NgJp9XLp/login-icon.png"
                        alt="Play Now Login"
                        className={`w-48 mx-auto drop-shadow-md hover:scale-105 transition-transform ${isLoggingIn ? 'opacity-50' : ''}`}
                      />
                    </button>

                    <div className="text-center mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginRole(null);
                          setLoginError('');
                          setUsernameInput('');
                          setPasswordInput('');
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-800 font-bold underline outline-none focus:outline-none"
                      >
                        ← Back to Roles
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ================= MAIN APPLICATION LAYOUT ================= */}
        {role !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-10 flex flex-col md:flex-row w-full h-full"
          >
            {/* Sidebar Navigation - Sleek Glassmorphism Theme */}
            <aside className="w-full md:w-64 flex-shrink-0 bg-emerald-950/75 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/10 text-white flex flex-col z-20 shadow-2xl">
              <div className="p-6 border-b border-white/10 text-center bg-black/25">
                <h1 className="font-display text-3xl text-emerald-300 font-bold tracking-wide select-none drop-shadow-[0_2px_8px_rgba(16,185,129,0.4)]">
                  VOCAFOREST <span className="text-emerald-400 font-bold">4.5</span>
                </h1>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-1">
                  Hybrid Learning Env
                </p>
              </div>

              {/* Navigation Tabs */}
              <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-2 font-display text-base">
                {role === 'student' && (
                  <>
                    <button
                      onClick={() => setActiveTab('hq')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all outline-none border ${
                        activeTab === 'hq'
                          ? 'bg-emerald-500/80 border-white/20 text-white font-bold shadow-lg shadow-emerald-500/20'
                          : 'border-transparent text-emerald-200/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Compass className="w-5 h-5" /> Headquarters
                    </button>

                    <button
                      onClick={() => setActiveTab('journal')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all outline-none border ${
                        activeTab === 'journal'
                          ? 'bg-emerald-500/80 border-white/20 text-white font-bold shadow-lg shadow-emerald-500/20'
                          : 'border-transparent text-emerald-200/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <BookOpen className="w-5 h-5" /> Magic Journal
                    </button>

                    <button
                      onClick={() => setActiveTab('thesaurus')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all outline-none border ${
                        activeTab === 'thesaurus'
                          ? 'bg-emerald-500/80 border-white/20 text-white font-bold shadow-lg shadow-emerald-500/20'
                          : 'border-transparent text-emerald-200/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <BookOpen className="w-5 h-5 text-amber-300" /> Thesaurus Activity
                    </button>

                    <button
                      onClick={() => setActiveTab('personal_journal')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all outline-none border ${
                        activeTab === 'personal_journal'
                          ? 'bg-emerald-500/80 border-white/20 text-white font-bold shadow-lg shadow-emerald-500/20'
                          : 'border-transparent text-emerald-200/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <BookOpen className="w-5 h-5" /> Personal Journal
                    </button>

                    <button
                      onClick={() => setActiveTab('training')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all outline-none border ${
                        activeTab === 'training'
                          ? 'bg-emerald-500/80 border-white/20 text-white font-bold shadow-lg shadow-emerald-500/20'
                          : 'border-transparent text-emerald-200/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-5 h-5" /> Training Cards
                    </button>

                    <button
                      onClick={() => setActiveTab('quiz')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all outline-none border ${
                        activeTab === 'quiz'
                          ? 'bg-emerald-500/80 border-white/20 text-white font-bold shadow-lg shadow-emerald-500/20'
                          : 'border-transparent text-emerald-200/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Gamepad2 className="w-5 h-5 animate-pulse text-yellow-400" /> Quiz Land
                    </button>

                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all outline-none border ${
                        activeTab === 'profile'
                          ? 'bg-emerald-500/80 border-white/20 text-white font-bold shadow-lg shadow-emerald-500/20'
                          : 'border-transparent text-emerald-200/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <User className="w-5 h-5" /> My Profile
                    </button>

                    <button
                      onClick={() => setActiveTab('daily_mission')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all outline-none border ${
                        activeTab === 'daily_mission'
                          ? 'bg-emerald-500/80 border-white/20 text-white font-bold shadow-lg shadow-emerald-500/20'
                          : 'border-transparent text-emerald-200/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <CheckCircle className="w-5 h-5" /> Daily Mission
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('medals')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all outline-none border ${
                        activeTab === 'medals'
                          ? 'bg-emerald-500/80 border-white/20 text-white font-bold shadow-lg shadow-emerald-500/20'
                          : 'border-transparent text-emerald-200/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Award className="w-5 h-5 text-amber-400" /> Medals & Certs
                    </button>

                    <button
                      onClick={() => setActiveTab('avatars')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all outline-none border ${
                        activeTab === 'avatars'
                          ? 'bg-emerald-500/80 border-white/20 text-white font-bold shadow-lg shadow-emerald-500/20'
                          : 'border-transparent text-emerald-200/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <User className="w-5 h-5" /> Custom Avatars
                    </button>

                    {/* CREATIVE GAMEPLAY FEATURES */}
                    <div className="h-px bg-white/10 my-2" />
                    <p className="text-[10px] font-bold text-emerald-400 px-4 uppercase tracking-widest">Forest Fun</p>

                    <button
                      onClick={() => setActiveTab('canopy')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all outline-none border ${
                        activeTab === 'canopy'
                          ? 'bg-emerald-500/80 border-white/20 text-white font-bold shadow-lg shadow-emerald-500/20'
                          : 'border-transparent text-emerald-200/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="text-lg">🌳</span> Shared Canopy
                    </button>

                    <button
                      onClick={() => setActiveTab('vocapet')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all outline-none border ${
                        activeTab === 'vocapet'
                          ? 'bg-emerald-500/80 border-white/20 text-white font-bold shadow-lg shadow-emerald-500/20'
                          : 'border-transparent text-emerald-200/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="text-lg">🦊</span> My Voca-Pet
                    </button>

                    <button
                      onClick={() => setActiveTab('whispering')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all outline-none border ${
                        activeTab === 'whispering'
                          ? 'bg-emerald-500/80 border-white/20 text-white font-bold shadow-lg shadow-emerald-500/20'
                          : 'border-transparent text-emerald-200/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="text-lg">🗣️</span> Whisper Woods
                    </button>

                    <button
                      onClick={() => setActiveTab('collectibles')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all outline-none border ${
                        activeTab === 'collectibles'
                          ? 'bg-emerald-500/80 border-white/20 text-white font-bold shadow-lg shadow-emerald-500/20'
                          : 'border-transparent text-emerald-200/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="text-lg">🎒</span> Element Cards
                    </button>
                  </>
                )}

                {role === 'teacher' && (
                  <button
                    onClick={() => setActiveTab('teacherDash')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all outline-none border ${
                      activeTab === 'teacherDash'
                        ? 'bg-emerald-500/80 border-white/20 text-white font-bold shadow-lg shadow-emerald-500/20'
                        : 'border-transparent text-emerald-200/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Activity className="w-5 h-5" /> Teacher Controls
                  </button>
                )}
              </nav>

              <div className="p-4 border-t border-white/10 bg-black/20">
                <button
                  onClick={handleLogout}
                  className="w-full bg-rose-950/55 hover:bg-rose-900 text-rose-300 font-semibold py-2.5 rounded-xl border border-rose-800 flex items-center justify-center gap-1.5 outline-none cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </div>
            </aside>

            {/* Main Workspace Frame */}
            <main className="flex-1 flex flex-col overflow-hidden h-full">
              {/* Top Status Banner - Beautiful Translucent Glass Panel */}
              <header className="h-20 bg-white/10 backdrop-blur-xl border-b border-white/20 flex items-center justify-between px-6 shrink-0 z-10 text-white shadow-lg">
                {role === 'student' && student ? (
                  <>
                    {/* Student Info */}
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarData?.theme || 'from-emerald-400 to-teal-600'} flex items-center justify-center text-2xl border-2 border-white/60 shadow-lg shrink-0`}>
                        <img src={avatarData?.img} alt="avatar" className="w-full h-full object-cover rounded-full" crossOrigin="anonymous" />
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block leading-tight">
                          Active Explorer
                        </span>
                        <h2 className="font-display text-lg text-white font-bold tracking-wide capitalize">
                          {student.fullName.split(' ')[0].toLowerCase()}
                        </h2>
                      </div>
                    </div>

                    {/* Stats Progress Level bar */}
                    <div className="flex gap-4 items-center">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-emerald-300 font-bold uppercase block leading-tight">Level</span>
                        <span className="font-display text-2xl text-emerald-400 font-black">
                          {student.level}
                        </span>
                      </div>

                      <div className="w-32 md:w-48">
                        <div className="flex justify-between text-[10px] text-emerald-200 font-bold mb-1">
                          <span>Progress XP</span>
                          <span>{student.xp % 100} / 100</span>
                        </div>
                        <div className="w-full bg-black/40 border border-white/15 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_#34d399]"
                            style={{ width: `${student.xp % 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="hidden sm:flex flex-col items-center bg-white/10 backdrop-blur-md px-4 py-1 rounded-xl border border-white/15">
                        <span className="text-[10px] text-yellow-300 font-bold uppercase leading-tight">Total XP</span>
                        <span className="font-display text-base text-yellow-300 font-bold">{student.xp}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🎓</span>
                      <div>
                        <span className="text-[10px] text-emerald-300 font-bold block uppercase leading-tight">Administrator Mode</span>
                        <h2 className="font-display text-lg text-white font-bold">Teacher Yuva Portal</h2>
                      </div>
                    </div>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 font-semibold px-4 py-1.5 rounded-full border border-emerald-500/30">
                      Sync Database Status: <strong>Online</strong>
                    </span>
                  </>
                )}
              </header>

              {/* Scrollable Workspace Panels */}
              <div className="flex-1 overflow-y-auto p-6 relative">
                <AnimatePresence mode="wait">
                  {/* TAB: Headquarters (Student Home) */}
                  {activeTab === 'hq' && role === 'student' && student && (
                    <motion.div
                      key="hq"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6 max-w-5xl mx-auto"
                    >
                      {/* Interactive Visual Growing Forest */}
                      <ForestCanvas xp={student.xp} level={student.level} />

                      {/* Class Bulletin notice board */}
                      <div className="glass-panel p-6 border-4 border-amber-400 bg-white/95 relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
                        <img
                          src="https://i.ibb.co/p6Bg3wbw/wave.png"
                          alt="Teacher Yuva Guide"
                          className="w-28 h-28 object-contain drop-shadow-md z-10"
                        />
                        <div className="z-10 flex-1">
                          <div className="flex items-center gap-2 mb-2 text-amber-700">
                            <Megaphone className="w-5 h-5 animate-bounce" />
                            <h3 className="font-display text-lg font-bold">Teacher Yuva's Noticeboard</h3>
                          </div>
                          <p className="text-sm font-semibold text-gray-700 bg-amber-50/40 p-4 rounded-xl border-2 border-amber-100 border-dashed leading-relaxed italic">
                            "{bulletinNotice || 'Welcome to the magical VocaForest! Let\'s map some vocabulary trees today!'}"
                          </p>
                        </div>
                      </div>

                      {/* Assigned words panel */}
                      {student.assignedWords && student.assignedWords.length > 0 && (
                        <div className="glass-panel p-5 border-4 border-sky-400 bg-sky-50/25 rounded-3xl shadow-md">
                          <div className="flex items-center gap-2 mb-2 text-sky-800">
                            <Sparkles className="w-5 h-5 text-sky-500 animate-pulse" />
                            <h3 className="font-display text-lg font-bold">Your Target Assignments</h3>
                          </div>
                          <p className="text-xs text-gray-600 font-semibold mb-3">
                            Your teacher has assigned specific words for you to practice. Start Quiz Land to master them:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {student.assignedWords.map((code: string) => {
                              const v = vocabularyDb.find(item => item.code === code);
                              return (
                                <span key={code} className="bg-white border-2 border-sky-200 text-sky-800 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                                  <span className="text-[10px] bg-sky-500 text-white font-mono px-1.5 py-0.5 rounded font-bold">
                                    {code}
                                  </span>
                                  {v ? v.word : code}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Launch Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Play Mission */}
                        <div
                          onClick={() => setActiveTab('quiz')}
                          className="glass-panel p-6 border-4 border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/40 transition-all cursor-pointer flex flex-col justify-between group h-48 text-left"
                        >
                          <div>
                            <span className="text-3xl">🏹</span>
                            <h3 className="font-display text-2xl text-emerald-800 font-bold mt-2">Active Field Mission</h3>
                            <p className="text-xs text-gray-500 font-semibold mt-1">Practice spelling, vocabulary definition and climb the leaderboard.</p>
                          </div>
                          <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider mt-4 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                            Start Mission Case →
                          </span>
                        </div>

                        {/* Open Journal */}
                        <div
                          onClick={() => setActiveTab('journal')}
                          className="glass-panel p-6 border-4 border-amber-500 bg-amber-50/10 hover:bg-amber-50/30 transition-all cursor-pointer flex flex-col justify-between group h-48 text-left"
                        >
                          <div>
                            <span className="text-3xl">📚</span>
                            <h3 className="font-display text-2xl text-amber-800 font-bold mt-2">Woodland Magic Journal</h3>
                            <p className="text-xs text-gray-500 font-semibold mt-1">Review pronunciation codes, phonetics, and contextual sentences.</p>
                          </div>
                          <span className="text-xs text-amber-600 font-bold uppercase tracking-wider mt-4 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                            Open Journal Book →
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB: Vocabulary Journal */}
                  {activeTab === 'journal' && role === 'student' && (
                    <motion.div
                      key="journal"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <MagicJournal student={student} onUpdateStudent={setStudent} mode="global" />
                    </motion.div>
                  )}

                  {/* TAB: Personal Journal */}
                  {activeTab === 'personal_journal' && role === 'student' && (
                    <motion.div
                      key="personal_journal"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <MagicJournal student={student} onUpdateStudent={setStudent} mode="personal" />
                    </motion.div>
                  )}

                  {/* TAB: Thesaurus Activity */}
                  {activeTab === 'thesaurus' && role === 'student' && student && (
                    <motion.div
                      key="thesaurus"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <ThesaurusActivity student={student} onUpdateStudent={setStudent} />
                    </motion.div>
                  )}

                  {/* TAB: Medals & Certs */}
                  {activeTab === 'medals' && role === 'student' && student && (
                    <motion.div
                      key="medals"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <MedalsAndCerts student={student} />
                    </motion.div>
                  )}

                  {/* TAB: Daily Mission */}
                  {activeTab === 'daily_mission' && role === 'student' && student && (
                    <motion.div
                      key="daily_mission"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <DailyMission student={student} onUpdateStudent={setStudent} />
                    </motion.div>
                  )}

                  {/* TAB: Training Cards (Flashcards) */}
                  {activeTab === 'training' && role === 'student' && (
                    <motion.div
                      key="training"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <TrainingCards />
                    </motion.div>
                  )}

                  {/* TAB: Active Quiz Game */}
                  {activeTab === 'quiz' && role === 'student' && student && (
                    <motion.div
                      key="quiz"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <FieldMission student={student} onUpdateStudent={setStudent} />
                    </motion.div>
                  )}

                  {/* TAB: Avatars Selection */}
                  {activeTab === 'avatars' && role === 'student' && student && (
                    <motion.div
                      key="avatars"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <AvatarSelector currentAvatar={student.avatar} onSelectAvatar={handleSelectAvatar} />
                    </motion.div>
                  )}

                  {/* TAB: Student Profile */}
                  {activeTab === 'profile' && role === 'student' && student && (
                    <motion.div
                      key="profile"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <StudentProfile student={student} />
                    </motion.div>
                  )}

                  {/* TAB: Great Canopy (Cooperative Tree) */}
                  {activeTab === 'canopy' && role === 'student' && student && (
                    <motion.div
                      key="canopy"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <GreatCanopy student={student} onUpdateStudent={setStudent} />
                    </motion.div>
                  )}

                  {/* TAB: Voca-Pet Companions */}
                  {activeTab === 'vocapet' && role === 'student' && student && (
                    <motion.div
                      key="vocapet"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <VocaPet student={student} onUpdateStudent={setStudent} />
                    </motion.div>
                  )}

                  {/* TAB: Whispering Woods Riddle Quest */}
                  {activeTab === 'whispering' && role === 'student' && student && (
                    <motion.div
                      key="whispering"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <WhisperingWoods student={student} onUpdateStudent={setStudent} />
                    </motion.div>
                  )}

                  {/* TAB: Collectible Element Cards */}
                  {activeTab === 'collectibles' && role === 'student' && student && (
                    <motion.div
                      key="collectibles"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <CollectibleCards student={student} onUpdateStudent={setStudent} />
                    </motion.div>
                  )}

                  {/* TAB: Teacher Dashboard Panel */}
                  {activeTab === 'teacherDash' && role === 'teacher' && (
                    <motion.div
                      key="teacher"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="max-w-7xl mx-auto"
                    >
                      <TeacherDashboard onLogout={handleLogout} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Immersive Footer - Magical HUD Bar */}
              
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Personal Mailbox Notification Modal */}
      <AnimatePresence>
        {showMailbox && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-3xl border-8 border-amber-400 shadow-2xl flex flex-col items-center text-center max-w-md w-full relative"
            >
              {/* Mail Box Header */}
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center text-4xl text-amber-600 mb-4 shadow-inner -mt-16 border-4 border-white">
                <Mail className="w-8 h-8 animate-pulse" />
              </div>

              <h2 className="font-display text-3xl text-amber-800 font-bold mb-1">Teacher Yuva Mail!</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-6">Special Motivation Letter</p>

              <div className="bg-amber-50/50 p-5 rounded-2xl border-2 border-amber-100 border-dashed mb-6 w-full font-semibold text-amber-900 leading-relaxed italic">
                "{mailContent}"
              </div>

              <img
                src="https://i.ibb.co/XrJtHGh5/celebrating-removebg-preview.png"
                alt="Teacher Yuva Celebrating"
                className="w-32 h-32 object-contain drop-shadow-md mb-4"
              />

              <button
                onClick={() => setShowMailbox(false)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-white font-display text-base font-semibold py-3 rounded-xl border-2 border-amber-300 shadow-md transition-all outline-none"
              >
                Close & Collect Rewards
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Intro Story Modal */}
      <AnimatePresence>
        {showStory && (
          <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-emerald-950 p-8 rounded-[32px] border-4 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)] flex flex-col items-center text-center max-w-lg w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://i.ibb.co/21y2yhC3/forest.png')] bg-cover opacity-20" />
              <div className="relative z-10 flex flex-col items-center">
                <img src="https://i.ibb.co/vyq6B8w/teacher-icon-removebg-preview.png" alt="Teacher Yuva" className="w-32 h-32 mb-4 drop-shadow-lg" />
                <h2 className="font-display text-3xl text-emerald-300 font-bold mb-4 drop-shadow-sm">The Story of VocaForest</h2>
                
                <div className="bg-black/40 p-6 rounded-2xl border border-emerald-800/50 mb-6 w-full text-emerald-50 text-left space-y-3 leading-relaxed">
                  <p><strong>Teacher Yuva</strong> was once the Guardian of VocaForest.</p>
                  <p>The forest was magical because every English word gave life to a tree.</p>
                  <p>One day... A creature called <strong>The Forgetting Fog</strong> covered the forest. Children started forgetting words.</p>
                  <p className="text-emerald-200">The trees became grey. Butterflies disappeared. Animals went missing.</p>
                  <p className="text-emerald-400 font-bold mt-2">Teacher Yuva cannot save the forest alone. She chooses...</p>
                  <p className="text-3xl text-center text-yellow-400 font-display font-bold py-2 animate-pulse">YOU.</p>
                </div>

                <button
                  onClick={() => setShowStory(false)}
                  className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-display text-xl font-bold py-4 rounded-2xl shadow-[0_0_15px_#10b981] transition-all outline-none"
                >
                  I WILL SAVE THE FOREST!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    

      {role === 'student' && student && (
        <>
          <BackgroundAudio />
          <AITeacherChat student={student} />
        </>
      )}

      {/* Trademark / Created By */}
      <div className="fixed bottom-0 left-0 w-full p-2 bg-black/80 text-white text-center text-xs flex justify-center items-center gap-2 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
        <span>© 2026 Created by: <strong>YUVABARTE ARUN ARUMUGAM</strong></span>
        <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-[8px] font-bold">TM</div>
      </div>

    </div>
  );
}
