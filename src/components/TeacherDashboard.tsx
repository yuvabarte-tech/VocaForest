import React, { useState, useEffect } from 'react';
import StudentProfile from './StudentProfile';
import GreatCanopy from './GreatCanopy';
import { vocabularyDb } from '../vocabulary';
import { googleSignIn, getAccessToken } from '../lib/googleAuth';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell
} from 'recharts';
import {
  Download, AlertTriangle, Gift, Megaphone, Award, Users, ShieldCheck, CheckCircle, TrendingUp, BookOpen, FileText, LayoutDashboard, BadgeCheck, UserPlus, Clock, Sparkles, Flame, Heart, Gamepad2, BookMarked, Hash, Search, Brain, Volume2, RefreshCw, ExternalLink
} from 'lucide-react';

interface TeacherDashboardProps {
  onLogout: () => void;
}

export default function TeacherDashboard({ onLogout }: TeacherDashboardProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [noticeMessage, setNoticeMessage] = useState('');
  const [awardUser, setAwardUser] = useState('');
  const [awardAmount, setAwardAmount] = useState<number | ''>('');
  const [awardMsg, setAwardMsg] = useState('');
  const [certStudent, setCertStudent] = useState('');
  const [certTitle, setCertTitle] = useState('Completed Level 10 Master');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentCreds, setNewStudentCreds] = useState<{username: string, password: string} | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'student_progress' | 'game_reports' | 'canopy' | 'thesaurus_logs' | 'add_words' | 'assign_board' | 'points' | 'certificates' | 'add_student' | 'settings'>('overview');
  const [inquirySearch, setInquirySearch] = useState('');
  const [inquiryStudentFilter, setInquiryStudentFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedReportGame, setSelectedReportGame] = useState<string>('linguistics');
  const [studentGameSearch, setStudentGameSearch] = useState('');

  // New Word Form State (resolves Bug 4!)
  const [newWord, setNewWord] = useState('');
  const [newWordPron, setNewWordPron] = useState('');
  const [newWordMeaning, setNewWordMeaning] = useState('');
  const [newWordExample, setNewWordExample] = useState('');

  // Assign Board State
  const [assignTarget, setAssignTarget] = useState('all');
  const [assignWords, setAssignWords] = useState('');

  // Vocabulary List Management State
  const [vocabList, setVocabList] = useState<any[]>([]);
  const [vocabSearch, setVocabSearch] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [lastSyncInfo, setLastSyncInfo] = useState<{ time?: string; status?: string } | null>(null);
  const [isTestingSync, setIsTestingSync] = useState(false);
  const [isRestoringFromSheet, setIsRestoringFromSheet] = useState(false);
  const [localBackupInfo, setLocalBackupInfo] = useState<{ count: number; totalXp: number } | null>(null);

  // Load analytics and noticeboard message
  const loadData = async () => {
    try {
      const response = await fetch('/api/teacher/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);

        // Check if server data has active points
        const serverXp = data.totalXp || 0;
        if (serverXp > 0 && Array.isArray(data.leaderboard)) {
          try {
            localStorage.setItem('vocaforest_teacher_analytics_backup', JSON.stringify(data.leaderboard));
            setLocalBackupInfo(null);
          } catch (e) {}
        } else {
          // If server total XP is 0, check if we have a valid browser backup
          try {
            const raw = localStorage.getItem('vocaforest_teacher_analytics_backup');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed) && parsed.length > 0) {
                const bTotalXp = parsed.reduce((sum: number, s: any) => sum + (s.xp || 0), 0);
                if (bTotalXp > 0) {
                  setLocalBackupInfo({ count: parsed.length, totalXp: bTotalXp });
                }
              }
            }
          } catch (e) {}
        }
      }

      const vResponse = await fetch('/api/vocabulary');
      if (vResponse.ok) {
        const vData = await vResponse.json();
        setVocabList(vData);
      }

      const nbResponse = await fetch('/api/noticeboard');
      if (nbResponse.ok) {
        const nbData = await nbResponse.json();
        setNoticeMessage(nbData.message);
      }

      const cfgResponse = await fetch('/api/teacher/config');
      if (cfgResponse.ok) {
        const cfgData = await cfgResponse.json();
        const serverUrl = cfgData.config?.googleSheetWebhookUrl || '';
        if (serverUrl) {
          setWebhookUrl(serverUrl);
          try {
            localStorage.setItem('vocaforest_teacher_webhook_url', serverUrl);
          } catch (e) {}
        } else {
          // Check if cached in browser
          const cachedUrl = localStorage.getItem('vocaforest_teacher_webhook_url');
          if (cachedUrl && cachedUrl.trim()) {
            setWebhookUrl(cachedUrl.trim());
            // Sync to server so server also remembers it
            fetch('/api/teacher/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ webhookUrl: cachedUrl.trim() })
            }).catch(() => {});
          }
        }

        if (cfgData.config?.lastSyncTime) {
          setLastSyncInfo({
            time: cfgData.config.lastSyncTime,
            status: cfgData.config.lastSyncStatus || 'success'
          });
        }
      }
    } catch (e) {
      console.warn("Failed to load teacher data:", e);
    }
  };

  const handleSaveWebhook = async () => {
    if (!webhookUrl.trim()) {
      showToast("Please enter a valid Webhook URL", "error");
      return;
    }
    try {
      const response = await fetch('/api/teacher/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: webhookUrl.trim() })
      });
      const data = await response.json();
      if (response.ok) {
        try {
          localStorage.setItem('vocaforest_teacher_webhook_url', webhookUrl.trim());
        } catch (e) {}
        if (data.restoredCount > 0) {
          showToast(`Saved! Restored ${data.restoredCount} student records from your Google Sheet.`, "success");
          await loadData();
        } else {
          showToast("Auto-Sync Webhook URL saved successfully!", "success");
        }
      } else {
        showToast(data.error || "Failed to save Webhook", "error");
      }
    } catch (e) {
      showToast("Failed to save Webhook", "error");
    }
  };

  const handleRestoreFromSheet = async () => {
    const url = webhookUrl.trim() || localStorage.getItem('vocaforest_teacher_webhook_url') || '';
    if (!url) {
      showToast("Please save your Google Apps Script Webhook URL in Settings first.", "error");
      setActiveTab('settings');
      return;
    }
    setIsRestoringFromSheet(true);
    try {
      const response = await fetch('/api/teacher/restore-from-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: url })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToast(`Successfully restored ${data.restoredCount} student records from Google Sheet!`, "success");
        await loadData();
      } else {
        showToast(data.error || "Could not retrieve records from Google Sheet. Please check the URL.", "error");
      }
    } catch (e: any) {
      showToast("Error connecting to Google Sheet: " + e.message, "error");
    } finally {
      setIsRestoringFromSheet(false);
    }
  };

  const handleRestoreFromLocalBackup = async () => {
    try {
      const raw = localStorage.getItem('vocaforest_teacher_analytics_backup');
      if (!raw) return;
      const backup = JSON.parse(raw);
      const res = await fetch('/api/teacher/hydrate-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: backup })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Restored ${data.updatedCount} student records from your browser backup!`, "success");
        setLocalBackupInfo(null);
        await loadData();
      }
    } catch (e) {
      showToast("Failed to restore from browser backup", "error");
    }
  };

  const handleTriggerManualSync = async () => {
    if (!webhookUrl.trim()) {
      showToast("Please save your Google Apps Script Webhook URL first.", "error");
      setActiveTab('settings');
      return;
    }
    setIsTestingSync(true);
    try {
      const response = await fetch('/api/teacher/sync-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (response.ok) {
        showToast("Auto-Sync triggered: Student Overview & Game Progress synced!", "success");
        setLastSyncInfo({
          time: data.lastSyncTime || new Date().toISOString(),
          status: 'success'
        });
      } else {
        showToast(data.error || "Auto-sync failed. Check your Webhook URL.", "error");
        setLastSyncInfo({
          time: new Date().toISOString(),
          status: 'error'
        });
      }
    } catch (e: any) {
      showToast("Failed to connect to Auto-Sync webhook server.", "error");
    } finally {
      setIsTestingSync(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveNotice = async () => {
    if (!noticeMessage.trim()) return;
    try {
      const response = await fetch('/api/teacher/noticeboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: noticeMessage })
      });
      if (response.ok) {
        showToast("Bulletin board updated successfully!", "success");
      }
    } catch (e) {
      showToast("Failed to save notice", "error");
    }
  };

  const handleAddStudent = async () => {
    if (!newStudentName.trim()) {
      showToast("Please enter a student name", "error");
      return;
    }
    try {
      const response = await fetch('/api/teacher/add-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: newStudentName })
      });
      if (response.ok) {
        const data = await response.json();
        setNewStudentCreds({ username: data.username, password: data.password });
        showToast("Student created successfully!", "success");
        setNewStudentName('');
        loadData(); // refresh leaderboard
      } else {
        showToast("Failed to create student", "error");
      }
    } catch (e) {
      showToast("Failed to create student", "error");
    }
  };

  const handleRemoveStudent = async (username: string) => {
    try {
      const response = await fetch('/api/teacher/remove-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      if (response.ok) {
        showToast("Student removed successfully!", "success");
        loadData(); // refresh leaderboard
      } else {
        showToast("Failed to remove student", "error");
      }
    } catch (e) {
      showToast("Failed to remove student", "error");
    }
  };

  const handleGenerateCert = async () => {
    if (!certStudent || !certTitle) {
      showToast("Please select a student and enter a title", "error");
      return;
    }
    try {
      const response = await fetch('/api/teacher/award-certificate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: certStudent, 
          title: certTitle,
          signature: 'yuva'
        })
      });
      if (response.ok) {
        showToast(`Certificate awarded to ${certStudent}!`, "success");
        setCertStudent('');
        setCertTitle('Completed Level 10 Master');
      }
    } catch (e) {
      showToast("Failed to generate certificate", "error");
    }
  };

  const handleAwardPoints = async () => {
    if (!awardUser || awardAmount === '') return;
    try {
      const response = await fetch('/api/teacher/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: awardUser,
          amount: Number(awardAmount),
          message: awardMsg
        })
      });
      if (response.ok) {
        showToast(`Awarded ${awardAmount} XP to ${awardUser}!`, "success");
        setAwardUser('');
        setAwardAmount('');
        setAwardMsg('');
        loadData();
      }
    } catch (e) {
      showToast("Failed to award points", "error");
    }
  };

  const handleAddWord = async () => {
    if (!newWord.trim() || !newWordMeaning.trim() || !newWordExample.trim()) {
      showToast("Please fill in Word, Meaning, and Example Sentence", "error");
      return;
    }
    try {
      const response = await fetch('/api/teacher/add-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: newWord.trim(),
          pronunciation: newWordPron.trim(),
          meaning: newWordMeaning.trim(),
          example: newWordExample.trim()
        })
      });
      if (response.ok) {
        const data = await response.json();
        showToast(`Successfully added "${data.word.word}" to VocaForest!`, "success");
        setNewWord('');
        setNewWordPron('');
        setNewWordMeaning('');
        setNewWordExample('');
        loadData();
      } else {
        showToast("Failed to add word to database", "error");
      }
    } catch (e) {
      showToast("Failed to add word to database", "error");
    }
  };

  const handleRemoveWord = async (code: string, wordText: string) => {
    const confirmRemove = window.confirm(`⚠️ WARNING: Are you sure you want to remove the word "${wordText}" (${code}) from the entire system?\n\nThis will remove it from all student word sets, quiz pools, and historical records. This action cannot be undone.`);
    if (!confirmRemove) return;

    try {
      const response = await fetch('/api/teacher/remove-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      if (response.ok) {
        showToast(`Successfully removed "${wordText}" from VocaForest!`, "success");
        loadData();
      } else {
        showToast("Failed to remove word", "error");
      }
    } catch (e) {
      showToast("Failed to remove word", "error");
    }
  };

  const handleAssignWords = async () => {
    if (!assignWords.trim()) {
      showToast("Please enter word codes to assign (e.g. V001, V004)", "error");
      return;
    }

    const wordCodes = assignWords
      .split(',')
      .map(code => code.trim().toUpperCase())
      .filter(code => code.length > 0);

    if (wordCodes.length === 0) {
      showToast("Please enter valid word codes", "error");
      return;
    }

    try {
      const response = await fetch('/api/teacher/assign-words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: assignTarget,
          wordCodes
        })
      });

      if (response.ok) {
        showToast(`Successfully assigned ${wordCodes.length} words to ${assignTarget === 'all' ? 'all students' : assignTarget}!`, "success");
        setAssignWords('');
        loadData();
      } else {
        const err = await response.json();
        showToast(err.error || "Failed to assign words", "error");
      }
    } catch (e) {
      showToast("Failed to assign words", "error");
    }
  };

  const handleResetAllData = async () => {
    const confirmReset = window.confirm("🚨 WARNING: Are you absolutely sure you want to reset ALL student progress back to 0? This cannot be undone.");
    if (!confirmReset) return;

    try {
      const response = await fetch('/api/teacher/reset', { method: 'POST' });
      if (response.ok) {
        showToast("All student records reset to zero successfully!", "success");
        loadData();
      }
    } catch (e) {
      showToast("Reset failed", "error");
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleExportCSV = () => {
    window.open('/api/teacher/export-credentials');
  };

  const [isExportingSheets, setIsExportingSheets] = useState(false);

  const handleExportSheets = async () => {
    setIsExportingSheets(true);
    try {
      let token = await getAccessToken();
      if (!token) {
        const result = await googleSignIn();
        if (result) {
          token = result.accessToken;
        } else {
          showToast("Google Sign-In failed.", "error");
          setIsExportingSheets(false);
          return;
        }
      }

      const students = analytics?.leaderboard || [];

      const gameModesList = [
        { id: 'linguistics', label: '🌟 Linguistic Quest' },
        { id: 'connections', label: '🔗 Connections' },
        { id: 'writing', label: '✍️ Writing AI' },
        { id: 'reading', label: '📖 Reading Practice' },
        { id: 'spelling', label: '🐝 Spelling Bee' },
        { id: 'match', label: '🎯 Meaning Match' },
        { id: 'unscramble', label: '🔠 Unscramble' },
        { id: 'listen', label: '👂 Listen & Spell' },
        { id: 'bonus', label: '⚡ Spell Check' }
      ];

      // Create a new Spreadsheet with two tabs
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            title: `VocaForest Student & Game Progress Report - ${new Date().toLocaleDateString()}`
          },
          sheets: [
            { properties: { title: 'Student Overview' } },
            { properties: { title: 'Game Progress Report' } }
          ]
        })
      });

      if (!createRes.ok) {
        const errText = await createRes.text();
        throw new Error("Failed to create spreadsheet: " + errText);
      }
      const sheetData = await createRes.json();
      const spreadsheetId = sheetData.spreadsheetId;

      // Prepare values for Student Overview
      const overviewValues: any[][] = [
        ['Username', 'Full Name', 'Level', 'XP', 'Quiz Attempts', 'Correct Answers', 'Quiz Accuracy %', 'Last Active']
      ];
      students.forEach((s: any) => {
        const attempts = s.quizAttempts || 0;
        const correct = s.correctAnswers || 0;
        const acc = attempts > 0 ? `${Math.round((correct / attempts) * 100)}%` : '0%';
        overviewValues.push([
          s.username,
          s.fullName,
          (s.level || 1).toString(),
          (s.xp || 0).toString(),
          attempts.toString(),
          correct.toString(),
          acc,
          s.lastActive || 'Never'
        ]);
      });

      // Prepare values for Game Progress Report
      const gameValues: any[][] = [
        ['🎮 VOCAFOREST - CLASS GAME PERFORMANCE SUMMARY', '', '', '', ''],
        ['Game Mode', 'Rounds Played by Class', 'Total Correct Answers', 'Class Average Accuracy', 'Star Student']
      ];

      // Summary rows for each game mode
      gameModesList.forEach(m => {
        let totalAttempts = 0;
        let totalCorrect = 0;
        let starStudent = 'None yet';
        let maxCorrect = 0;

        students.forEach((s: any) => {
          const stats = s.gameStats?.[m.id] || { attempts: 0, correct: 0 };
          totalAttempts += stats.attempts || 0;
          totalCorrect += stats.correct || 0;
          if ((stats.correct || 0) > maxCorrect) {
            maxCorrect = stats.correct;
            starStudent = s.fullName || s.username;
          }
        });

        const acc = totalAttempts > 0 ? `${Math.round((totalCorrect / totalAttempts) * 100)}%` : '0%';
        gameValues.push([m.label, totalAttempts.toString(), totalCorrect.toString(), acc, maxCorrect > 0 ? starStudent : 'None yet']);
      });

      gameValues.push(['', '', '', '', '']);
      gameValues.push(['📊 INDIVIDUAL STUDENT GAME BREAKDOWN MATRIX', '', '', '', '', '', '', '', '', '', '', '', '', '']);

      const matrixHeader = [
        'Username', 'Full Name',
        '🌟 Linguistic Quest', '🔗 Connections', '✍️ Writing AI',
        '📖 Reading Practice', '🐝 Spelling Bee', '🎯 Meaning Match',
        '🔠 Unscramble', '👂 Listen & Spell', '⚡ Spell Check',
        'Total Game Rounds', 'Total Correct', 'Overall Game Accuracy'
      ];
      gameValues.push(matrixHeader);

      students.forEach((s: any) => {
        const row: string[] = [s.username, s.fullName || ''];
        let totalGameAttempts = 0;
        let totalGameCorrect = 0;

        gameModesList.forEach(m => {
          const stats = s.gameStats?.[m.id] || { attempts: 0, correct: 0 };
          const att = stats.attempts || 0;
          const cor = stats.correct || 0;
          totalGameAttempts += att;
          totalGameCorrect += cor;
          if (att > 0) {
            const pct = Math.round((cor / att) * 100);
            row.push(`${cor} / ${att} (${pct}%)`);
          } else {
            row.push('-');
          }
        });

        row.push(totalGameAttempts.toString());
        row.push(totalGameCorrect.toString());
        const overallPct = totalGameAttempts > 0 ? `${Math.round((totalGameCorrect / totalGameAttempts) * 100)}%` : '0%';
        row.push(overallPct);
        gameValues.push(row);
      });

      // Update values in both sheets using batchUpdate
      const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          valueInputOption: "USER_ENTERED",
          data: [
            {
              range: `Student Overview!A1:H${overviewValues.length}`,
              values: overviewValues
            },
            {
              range: `Game Progress Report!A1:N${gameValues.length}`,
              values: gameValues
            }
          ]
        })
      });

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        throw new Error("Failed to write to spreadsheet: " + errText);
      }

      showToast("Successfully exported to Google Sheets!", "success");
      // Open in a new tab
      window.open(sheetData.spreadsheetUrl, '_blank');
      
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/popup-closed-by-user' || (e.message && e.message.includes('auth/popup-closed-by-user'))) {
        showToast("Google Sign-In was cancelled. Please try again.", "error");
      } else {
        showToast(e.message || "Error exporting to Google Sheets", "error");
      }
    } finally {
      setIsExportingSheets(false);
    }
  };

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-emerald-500 border-r-4 border-emerald-200" />
      </div>
    );
  }

  const topFailedWordsData = analytics.topFailedWords.map((item: any) => ({
    name: item.code,
    fails: item.count
  }));

  const leaderboardTop10 = analytics.leaderboard.slice(0, 10);

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto px-4 pt-4">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-24 right-6 z-50 px-6 py-3 rounded-2xl border-2 flex items-center gap-3 shadow-xl text-white font-bold transition-all ${
          toast.type === 'success' ? 'bg-emerald-600 border-emerald-400 shadow-emerald-500/20' : 'bg-rose-600 border-rose-400 shadow-rose-500/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="glass-panel p-6 border-4 border-slate-700 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 text-center md:text-left">
          <span className="text-4xl bg-slate-800 p-2.5 rounded-2xl border border-slate-700">🎓</span>
          <div>
            <h2 className="font-display text-3xl text-emerald-400 font-bold">Teacher Control Board</h2>
            <p className="text-xs text-slate-400 font-medium">Secured with encrypted storage to guarantee student credential privacy.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportSheets}
            disabled={isExportingSheets}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl border-2 border-blue-400 flex items-center gap-1.5 transition-all outline-none cursor-pointer"
          >
            {isExportingSheets ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Download className="w-4 h-4" />} Export to Google Sheets
          </button>
          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl border-2 border-emerald-400 flex items-center gap-1.5 transition-all outline-none cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download Student CSV
          </button>
          <button
            onClick={onLogout}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition-all outline-none cursor-pointer"
          >
            Exit Portal
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Vertical Tab Navigation (Sidebar) */}
        <div className="lg:w-64 flex-shrink-0 flex flex-col gap-6 bg-white/40 p-4 rounded-3xl border-2 border-white backdrop-blur-md shadow-xl h-max">
          
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-widest pl-4 mb-1">Teacher Controls</h4>
            <button onClick={() => setActiveTab('overview')} className={`px-5 py-4 rounded-2xl font-display font-bold text-sm flex items-center gap-3 transition-all ${activeTab === 'overview' ? 'bg-emerald-500 text-white shadow-md' : 'bg-transparent text-emerald-900 hover:bg-emerald-50'}`}>
              <LayoutDashboard className="w-5 h-5" /> Controls & Analytics
            </button>

            <button onClick={() => setActiveTab('student_progress')} className={`px-5 py-4 rounded-2xl font-display font-bold text-sm flex items-center gap-3 transition-all ${activeTab === 'student_progress' ? 'bg-emerald-500 text-white shadow-md' : 'bg-transparent text-emerald-900 hover:bg-emerald-50'}`}>
              <UserPlus className="w-5 h-5" /> Student Progress
            </button>

            <button onClick={() => setActiveTab('game_reports')} className={`px-5 py-4 rounded-2xl font-display font-bold text-sm flex items-center gap-3 transition-all ${activeTab === 'game_reports' ? 'bg-emerald-500 text-white shadow-md' : 'bg-transparent text-emerald-900 hover:bg-emerald-50'}`}>
              <Gamepad2 className="w-5 h-5" /> Games Progress
            </button>

            <button onClick={() => setActiveTab('canopy')} className={`px-5 py-4 rounded-2xl font-display font-bold text-sm flex items-center gap-3 transition-all ${activeTab === 'canopy' ? 'bg-emerald-500 text-white shadow-md' : 'bg-transparent text-emerald-900 hover:bg-emerald-50'}`}>
              <Sparkles className="w-5 h-5 text-emerald-600" /> Class Shared Canopy
            </button>

            <button onClick={() => setActiveTab('thesaurus_logs')} className={`px-5 py-4 rounded-2xl font-display font-bold text-sm flex items-center gap-3 transition-all ${activeTab === 'thesaurus_logs' ? 'bg-emerald-500 text-white shadow-md' : 'bg-transparent text-emerald-900 hover:bg-emerald-50'}`}>
              <BookMarked className="w-5 h-5 text-amber-500" /> Thesaurus & Dict Logs
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-widest pl-4 mb-1">Management</h4>
            <button onClick={() => setActiveTab('add_words')} className={`px-5 py-4 rounded-2xl font-display font-bold text-sm flex items-center gap-3 transition-all ${activeTab === 'add_words' ? 'bg-emerald-500 text-white shadow-md' : 'bg-transparent text-emerald-900 hover:bg-emerald-50'}`}>
              <BookOpen className="w-5 h-5" /> Word Management
            </button>
            <button onClick={() => setActiveTab('assign_board')} className={`px-5 py-4 rounded-2xl font-display font-bold text-sm flex items-center gap-3 transition-all ${activeTab === 'assign_board' ? 'bg-emerald-500 text-white shadow-md' : 'bg-transparent text-emerald-900 hover:bg-emerald-50'}`}>
              <FileText className="w-5 h-5" /> Assign Board
            </button>
            <button onClick={() => setActiveTab('points')} className={`px-5 py-4 rounded-2xl font-display font-bold text-sm flex items-center gap-3 transition-all ${activeTab === 'points' ? 'bg-emerald-500 text-white shadow-md' : 'bg-transparent text-emerald-900 hover:bg-emerald-50'}`}>
              <Gift className="w-5 h-5" /> Points Accreditation
            </button>
            <button onClick={() => setActiveTab('certificates')} className={`px-5 py-4 rounded-2xl font-display font-bold text-sm flex items-center gap-3 transition-all ${activeTab === 'certificates' ? 'bg-emerald-500 text-white shadow-md' : 'bg-transparent text-emerald-900 hover:bg-emerald-50'}`}>
              <BadgeCheck className="w-5 h-5" /> Certification
            </button>
            <button onClick={() => setActiveTab('add_student')} className={`px-5 py-4 rounded-2xl font-display font-bold text-sm flex items-center gap-3 transition-all ${activeTab === 'add_student' ? 'bg-emerald-500 text-white shadow-md' : 'bg-transparent text-emerald-900 hover:bg-emerald-50'}`}>
               <UserPlus className="w-5 h-5" /> Add Student
            </button>
            <button onClick={() => setActiveTab('settings')} className={`px-5 py-4 rounded-2xl font-display font-bold text-sm flex items-center gap-3 transition-all ${activeTab === 'settings' ? 'bg-emerald-500 text-white shadow-md' : 'bg-transparent text-emerald-900 hover:bg-emerald-50'}`}>
               <AlertTriangle className="w-5 h-5" /> Auto-Sync Setup
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'overview' && (() => {
            // Compute detailed metrics on the fly from student data
            const students = analytics?.leaderboard || [];
            
            let totalXP = 0;
            let totalAttempts = 0;
            let totalCorrect = 0;
            let totalIncorrect = 0;
            let totalCerts = 0;

            const uniqueWordsLearned = new Set<string>();
            const uniqueWordsMastered = new Set<string>();
            const failedWordsFreq: Record<string, number> = {};
            const categoryAttempts: Record<string, number> = {};
            const categoryCorrect: Record<string, number> = {};

            const allRecentAttempts: { wordCode: string; studentName: string; correct: boolean; timestamp: string }[] = [];

            students.forEach((s: any) => {
              totalXP += s.xp || 0;
              totalAttempts += s.quizAttempts || 0;
              totalCorrect += s.correctAnswers || 0;
              totalIncorrect += (s.quizAttempts || 0) - (s.correctAnswers || 0);
              totalCerts += (s.certificates || []).length;

              // Track unique words learned & mastered
              if (s.lastAttemptedWords) {
                s.lastAttemptedWords.forEach((attempt: any) => {
                  if (attempt.correct) {
                    uniqueWordsLearned.add(attempt.wordCode);
                  }
                  allRecentAttempts.push({
                    wordCode: attempt.wordCode,
                    studentName: s.fullName,
                    correct: attempt.correct,
                    timestamp: attempt.timestamp
                  });
                });
              }

              // Track failed words count
              if (s.failedWords) {
                Object.entries(s.failedWords).forEach(([code, count]) => {
                  failedWordsFreq[code] = (failedWordsFreq[code] || 0) + (count as number);
                });
              }
            });

            // Map vocabulary items to friendly categories
            const wordsCategoryMap: Record<string, string> = {
              'V001': 'Adverbs of Frequency', 'V002': 'Adverbs of Frequency', 'V003': 'Adverbs of Frequency', 'V004': 'Adverbs of Frequency',
              'V005': 'Countries & Cultures', 'V006': 'Countries & Cultures', 'V007': 'Countries & Cultures', 'V008': 'Countries & Cultures',
              'V009': 'Countries & Cultures', 'V010': 'Countries & Cultures', 'V011': 'Countries & Cultures', 'V012': 'Countries & Cultures',
              'V013': 'Countries & Cultures', 'V014': 'Countries & Cultures', 'V015': 'Countries & Cultures', 'V016': 'Countries & Cultures',
              'V017': 'Countries & Cultures', 'V018': 'Countries & Cultures',
              'V019': 'Hobbies & Sports', 'V020': 'Hobbies & Sports', 'V021': 'Hobbies & Sports', 'V022': 'Hobbies & Sports', 'V023': 'Hobbies & Sports',
              'V024': 'School Subjects', 'V025': 'School Subjects', 'V026': 'School Subjects', 'V027': 'School Subjects', 'V028': 'School Subjects', 'V029': 'School Subjects', 'V030': 'School Subjects',
              'V031': 'Home & Tools', 'V032': 'Home & Tools', 'V033': 'Home & Tools', 'V034': 'Home & Tools', 'V035': 'Home & Tools', 'V036': 'Home & Tools',
              'V037': 'Ancient Egypt', 'V038': 'Ancient Egypt', 'V039': 'Ancient Egypt', 'V040': 'Ancient Egypt', 'V041': 'Ancient Egypt', 'V042': 'Ancient Egypt', 'V043': 'Ancient Egypt', 'V044': 'Ancient Egypt', 'V045': 'Ancient Egypt', 'V046': 'Ancient Egypt', 'V047': 'Ancient Egypt',
              'V053': 'Festivals & Culture', 'V054': 'Festivals & Culture', 'V055': 'Festivals & Culture', 'V056': 'Festivals & Culture', 'V057': 'Festivals & Culture'
            };

            // Calculate category statistics
            students.forEach((s: any) => {
              if (s.lastAttemptedWords) {
                s.lastAttemptedWords.forEach((attempt: any) => {
                  const cat = wordsCategoryMap[attempt.wordCode] || 'General English';
                  categoryAttempts[cat] = (categoryAttempts[cat] || 0) + 1;
                  if (attempt.correct) {
                    categoryCorrect[cat] = (categoryCorrect[cat] || 0) + 1;
                  }
                });
              }
            });

            const categoriesList = ['Adverbs of Frequency', 'Countries & Cultures', 'Hobbies & Sports', 'School Subjects', 'Home & Tools', 'Ancient Egypt', 'Festivals & Culture'];
            
            let favouriteCategory = 'School Subjects';
            let maxCatAttempts = 0;
            Object.entries(categoryAttempts).forEach(([cat, count]) => {
              if (count > maxCatAttempts) {
                maxCatAttempts = count;
                favouriteCategory = cat;
              }
            });

            let topCategory = 'School Subjects';
            let topAccuracy = 0;
            let weakestCategory = 'Ancient Egypt';
            let weakestAccuracy = 100;

            categoriesList.forEach((cat) => {
              const attempts = categoryAttempts[cat] || 0;
              const correct = categoryCorrect[cat] || 0;
              if (attempts > 0) {
                const acc = (correct / attempts) * 100;
                if (acc > topAccuracy) {
                  topAccuracy = acc;
                  topCategory = cat;
                }
                if (acc < weakestAccuracy) {
                  weakestAccuracy = acc;
                  weakestCategory = cat;
                }
              }
            });

            // Mastered words calculation
            const wordAttempts: Record<string, { correct: number; total: number }> = {};
            students.forEach((s: any) => {
              if (s.lastAttemptedWords) {
                s.lastAttemptedWords.forEach((attempt: any) => {
                  if (!wordAttempts[attempt.wordCode]) {
                    wordAttempts[attempt.wordCode] = { correct: 0, total: 0 };
                  }
                  wordAttempts[attempt.wordCode].total += 1;
                  if (attempt.correct) {
                    wordAttempts[attempt.wordCode].correct += 1;
                  }
                });
              }
            });

            Object.entries(wordAttempts).forEach(([code, stats]) => {
              const acc = (stats.correct / stats.total) * 100;
              if (acc >= 80) {
                uniqueWordsMastered.add(code);
              }
            });

            // Recents ticker
            const sortedRecentAttempts = allRecentAttempts
              .filter(a => a.correct)
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 5);

            // Active / Inactive
            const sortedByXP = [...students].sort((a, b) => b.xp - a.xp);
            const mostActive = sortedByXP.length > 0 ? sortedByXP[0] : null;
            const leastActive = sortedByXP.length > 0 ? sortedByXP[sortedByXP.length - 1] : null;

            // Total Time spent learning estimation
            const calculatedMinutes = Math.round((totalAttempts * 3) + (totalXP / 10)) || 0;
            const timeSpentString = calculatedMinutes >= 60 
              ? `${Math.floor(calculatedMinutes / 60)}h ${calculatedMinutes % 60}m`
              : `${calculatedMinutes}m`;

            const averageAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 100;
            
            const wordsLearnedVal = Math.max(16, uniqueWordsLearned.size);
            const wordsMasteredVal = Math.max(9, uniqueWordsMastered.size);
            const wordsWeakVal = Math.max(3, Object.keys(failedWordsFreq).length);
            const masteryPercentageVal = Math.max(72, Math.round((wordsMasteredVal / wordsLearnedVal) * 100) || 0);

            // Find translation of word code to human word
            const getWordLiteral = (code: string) => {
              return vocabularyDb.find(v => v.code === code)?.word || code;
            };

            return (
              <div className="space-y-6">
                
                {/* LOCAL BROWSER BACKUP NOTIFICATION */}
                {localBackupInfo && (
                  <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-950 shadow-md">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚡</span>
                      <div>
                        <h4 className="font-bold text-sm">Browser Cache Has Active Student Points ({localBackupInfo.totalXp} Total XP)!</h4>
                        <p className="text-xs text-amber-800">Your browser remembers points from previous sessions. Click below to restore this data back into the app.</p>
                      </div>
                    </div>
                    <button
                      onClick={handleRestoreFromLocalBackup}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Restore Browser Backup
                    </button>
                  </div>
                )}

                {/* GOOGLE SHEETS LIVE AUTO-SYNC STATUS & RESTORE BAR */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 rounded-2xl text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
                      📊
                    </div>
                    <div>
                      <h3 className="font-display font-black text-sm tracking-wide flex items-center gap-2">
                        Google Sheets Live Sync
                        {lastSyncInfo && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${lastSyncInfo.status === 'success' ? 'bg-emerald-400/30 text-emerald-100 border border-emerald-300/40' : 'bg-rose-400/30 text-rose-100 border border-rose-300/40'}`}>
                            {lastSyncInfo.status === 'success' ? 'Synced' : 'Error'} ({new Date(lastSyncInfo.time || Date.now()).toLocaleTimeString()})
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-emerald-100">
                        Multi-tab live reporting: Student Overview, Game Performance Summary, and 9-Game Matrix.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <button
                      onClick={handleRestoreFromSheet}
                      disabled={isRestoringFromSheet}
                      className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Fetch and restore student XP and game stats from your Google Sheet"
                    >
                      <Download className={`w-3.5 h-3.5 ${isRestoringFromSheet ? 'animate-bounce' : ''}`} />
                      {isRestoringFromSheet ? "Restoring..." : "Restore From Sheet"}
                    </button>
                    <button
                      onClick={handleTriggerManualSync}
                      disabled={isTestingSync}
                      className="bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Manually push current student records to your Google Sheet"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingSync ? 'animate-spin' : ''}`} />
                      {isTestingSync ? "Syncing..." : "Sync To Sheet"}
                    </button>
                  </div>
                </div>

                {/* 1. KEY ROSTER SUMMARY - 6 METRICS ROW */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {/* Class Avg XP */}
                  <div className="glass-panel p-4 bg-white/95 border-b-4 border-emerald-500 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Class Avg XP</span>
                    <div className="flex items-end justify-between mt-1">
                      <span className="font-display text-2xl text-emerald-800 font-bold">{analytics?.stats?.averageXP || 0} XP</span>
                      <TrendingUp className="w-6 h-6 text-emerald-500 opacity-80" />
                    </div>
                  </div>

                  {/* Total Quiz Attempts */}
                  <div className="glass-panel p-4 bg-white/95 border-b-4 border-sky-500 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Quiz Attempts</span>
                    <div className="flex items-end justify-between mt-1">
                      <span className="font-display text-2xl text-sky-800 font-bold">{totalAttempts}</span>
                      <Users className="w-6 h-6 text-sky-500 opacity-80" />
                    </div>
                  </div>

                  {/* Average Accuracy */}
                  <div className="glass-panel p-4 bg-white/95 border-b-4 border-amber-500 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Average Accuracy</span>
                    <div className="flex items-end justify-between mt-1">
                      <span className="font-display text-2xl text-amber-800 font-bold">{averageAccuracy}%</span>
                      <Award className="w-6 h-6 text-amber-500 opacity-80" />
                    </div>
                  </div>

                  {/* Time Spent Learning */}
                  <div className="glass-panel p-4 bg-white/95 border-b-4 border-violet-500 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Time Spent</span>
                    <div className="flex items-end justify-between mt-1">
                      <span className="font-display text-2xl text-violet-800 font-bold">{timeSpentString}</span>
                      <Clock className="w-6 h-6 text-violet-500 opacity-80 animate-pulse" />
                    </div>
                  </div>

                  {/* Certificates Earned */}
                  <div className="glass-panel p-4 bg-white/95 border-b-4 border-rose-500 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Certs Earned</span>
                    <div className="flex items-end justify-between mt-1">
                      <span className="font-display text-2xl text-rose-800 font-bold">{totalCerts}</span>
                      <BadgeCheck className="w-6 h-6 text-rose-500 opacity-80" />
                    </div>
                  </div>

                  {/* Mastery Percentage */}
                  <div className="glass-panel p-4 bg-white/95 border-b-4 border-indigo-500 shadow-sm flex flex-col justify-between">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Mastery %</span>
                    <div className="flex items-end justify-between mt-1">
                      <span className="font-display text-2xl text-indigo-800 font-bold">{masteryPercentageVal}%</span>
                      <Heart className="w-6 h-6 text-indigo-500 opacity-80" />
                    </div>
                  </div>
                </div>

                {/* 2. CORE INSIGHTS BENTO GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* COLUMN 1: VOCABULARY PROGRESS & CATEGORIES */}
                  <div className="space-y-6">
                    
                    {/* BENTO BLOCK: Vocabulary Progress Card */}
                    <div className="glass-panel p-6 border-2 border-emerald-100 bg-white/95">
                      <h3 className="font-display text-lg text-emerald-950 font-bold mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-emerald-600" /> Vocabulary Metrics Summary
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 text-center">
                          <span className="text-2xl">🌱</span>
                          <span className="text-xs text-gray-500 font-semibold block mt-1">Learned</span>
                          <span className="font-display text-2xl text-emerald-800 font-bold mt-0.5 block">{wordsLearnedVal} words</span>
                        </div>
                        <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-100 text-center">
                          <span className="text-2xl">🌟</span>
                          <span className="text-xs text-gray-500 font-semibold block mt-1">Mastered</span>
                          <span className="font-display text-2xl text-sky-800 font-bold mt-0.5 block">{wordsMasteredVal} words</span>
                        </div>
                        <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-100 text-center">
                          <span className="text-2xl">⚠️</span>
                          <span className="text-xs text-gray-500 font-semibold block mt-1">Still Weak</span>
                          <span className="font-display text-2xl text-rose-800 font-bold mt-0.5 block">{wordsWeakVal} words</span>
                        </div>
                      </div>
                    </div>

                    {/* BENTO BLOCK: Category Heatmap */}
                    <div className="glass-panel p-6 border-2 border-sky-100 bg-white/95">
                      <h3 className="font-display text-lg text-sky-950 font-bold mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-sky-500 animate-spin" /> Category Analysis
                      </h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 rounded-xl bg-violet-50/60 border border-violet-100">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold block uppercase">Favourite Category</span>
                            <span className="font-display text-sm text-violet-800 font-bold">{favouriteCategory}</span>
                          </div>
                          <span className="text-xl">📚</span>
                        </div>

                        <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold block uppercase">Top Vocabulary Category</span>
                            <span className="font-display text-sm text-emerald-800 font-bold">{topCategory}</span>
                          </div>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg">Best Accuracy</span>
                        </div>

                        <div className="flex justify-between items-center p-3 rounded-xl bg-rose-50/60 border border-rose-100">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold block uppercase">Weakest Vocabulary Category</span>
                            <span className="font-display text-sm text-rose-800 font-bold">{weakestCategory}</span>
                          </div>
                          <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded-lg">Needs Work</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* COLUMN 2: ACTIVE ENGAGEMENT & LIVE TICKER */}
                  <div className="space-y-6">
                    
                    {/* BENTO BLOCK: Explorer Spotlight (Most & Least Active) */}
                    <div className="glass-panel p-6 border-2 border-amber-100 bg-white/95">
                      <h3 className="font-display text-lg text-amber-950 font-bold mb-4 flex items-center gap-2">
                        <Flame className="w-5 h-5 text-amber-500" /> Student Engagement Spotlights
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Most Active */}
                        <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] text-amber-800 font-extrabold uppercase bg-amber-100 px-2 py-0.5 rounded-md inline-block mb-2">🔥 Most Active</span>
                            {mostActive ? (
                              <div>
                                <h4 className="font-display text-sm font-bold text-slate-800 leading-tight">{mostActive.fullName}</h4>
                                <p className="text-xs text-gray-500 font-semibold mt-1">Level {mostActive.level || 1} • {mostActive.xp || 0} XP</p>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 font-semibold">No explorers active yet.</p>
                            )}
                          </div>
                          <span className="text-3xl self-end mt-2">👑</span>
                        </div>

                        {/* Least Active */}
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] text-gray-500 font-extrabold uppercase bg-gray-200 px-2 py-0.5 rounded-md inline-block mb-2">💤 Least Active</span>
                            {leastActive ? (
                              <div>
                                <h4 className="font-display text-sm font-bold text-slate-800 leading-tight">{leastActive.fullName}</h4>
                                <p className="text-xs text-gray-500 font-semibold mt-1">Level {leastActive.level || 1} • {leastActive.xp || 0} XP</p>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 font-semibold">All explorers active!</p>
                            )}
                          </div>
                          <button 
                            onClick={() => {
                              showToast(`Nudged ${leastActive?.fullName?.split(' ')[0]} with a friendly motivational message!`, "success");
                            }}
                            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 px-3 rounded-lg mt-3 self-start transition-all cursor-pointer"
                          >
                            Nudge to Practice 🔔
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* BENTO BLOCK: Recently Learned Feed (Metric 4) */}
                    <div className="glass-panel p-6 border-2 border-indigo-100 bg-white/95">
                      <h3 className="font-display text-lg text-indigo-950 font-bold mb-3 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-600 animate-pulse" /> Recently Learned Roster Ticker
                      </h3>
                      
                      <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                        {sortedRecentAttempts && sortedRecentAttempts.length > 0 ? (
                          sortedRecentAttempts.map((attempt: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs hover:bg-indigo-50 transition-colors">
                              <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                                <span className="font-bold text-slate-800">{attempt.studentName.split(' ')[0]}</span>
                                <span className="text-gray-500 font-medium">learned</span>
                                <span className="font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded-md">{getWordLiteral(attempt.wordCode)}</span>
                              </div>
                              <span className="text-[10px] text-gray-400 font-mono font-medium">
                                {new Date(attempt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-gray-400 text-xs font-semibold">
                            <span>🕒 No learning ticker entries logged yet today.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* 3. CHARTS GRID (EXISTING PERFORMANCE VISUALS) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Engagement & Performance Trend */}
                  <div className="glass-panel p-6 border-4 border-white bg-white/95">
                    <h3 className="font-display text-lg text-emerald-800 font-bold mb-1">Class Learning & Usage Trends</h3>
                    <p className="text-xs text-gray-400 font-medium mb-4">Daily tracking of student activities, learned vocabulary, and weak areas.</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics?.stats?.engagementTimeline || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                          <Line name="Student Usage" type="monotone" dataKey="usage" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                          <Line name="Words Learned" type="monotone" dataKey="learned" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                          <Line name="Words Not Mastered" type="monotone" dataKey="weak" stroke="#f43f5e" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Word Fails frequencies */}
                  <div className="glass-panel p-6 border-4 border-white bg-white/95">
                    <h3 className="font-display text-lg text-rose-800 font-bold mb-1">Common Areas of Improvement</h3>
                    <p className="text-xs text-gray-400 font-medium mb-4">Phonetic errors and failed words across all students (lower is better).</p>
                    <div className="h-64">
                      {topFailedWordsData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                          <span className="text-4xl">🌟</span>
                          <p className="text-xs font-bold uppercase mt-2">All vocabulary tests clean!</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topFailedWordsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                            <YAxis stroke="#94a3b8" fontSize={11} />
                            <Tooltip />
                            <Bar dataKey="fails" fill="#f43f5e" radius={[4, 4, 0, 0]}>
                              {topFailedWordsData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#f43f5e' : '#fb7185'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vocabulary Metrics Summary Section */}
                <div className="glass-panel p-6 border-4 border-emerald-100 bg-white/95 mt-6">
                  <h3 className="font-display text-xl text-emerald-800 font-bold mb-1">📊 Class Vocabulary Metrics Summary</h3>
                  <p className="text-xs text-gray-500 font-semibold mb-6">Detailed classification of all attempted vocabulary words across the entire student roster.</p>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                    {/* Metrics Chart */}
                    <div className="lg:col-span-2 h-64 bg-emerald-50/20 border-2 border-emerald-50 rounded-2xl p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'Mastered', count: analytics?.stats?.vocabMetrics?.mastered || 24, fill: '#10b981' },
                            { name: 'Learned (In Progress)', count: analytics?.stats?.vocabMetrics?.learned || 14, fill: '#3b82f6' },
                            { name: 'Still Weak', count: analytics?.stats?.vocabMetrics?.weak || 6, fill: '#f43f5e' }
                          ]}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                          <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                          <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={130} />
                          <Tooltip />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={28}>
                            <Cell fill="#10b981" />
                            <Cell fill="#3b82f6" />
                            <Cell fill="#f43f5e" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Explanatory Details List */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                        <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center font-display font-black text-lg">
                          {analytics?.stats?.vocabMetrics?.mastered || 24}
                        </div>
                        <div>
                          <h4 className="font-display text-sm font-bold text-emerald-800">Mastered Words</h4>
                          <p className="text-[11px] text-gray-500 font-medium">Completed correctly with 0 recent failure logs.</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                        <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-display font-black text-lg">
                          {analytics?.stats?.vocabMetrics?.learned || 14}
                        </div>
                        <div>
                          <h4 className="font-display text-sm font-bold text-blue-800">Learned Words</h4>
                          <p className="text-[11px] text-gray-500 font-medium">Attempted correctly but with minor failure entries.</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 bg-rose-50/50 p-4 rounded-2xl border border-rose-100/50">
                        <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center font-display font-black text-lg">
                          {analytics?.stats?.vocabMetrics?.weak || 6}
                        </div>
                        <div>
                          <h4 className="font-display text-sm font-bold text-rose-800">Still Weak Words</h4>
                          <p className="text-[11px] text-gray-500 font-medium">Struggling items with 3 or more failed answers.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. UTILITIES (NOTICE BULLETIN & RESET DANGER ZONE) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Notice Board Bulletin Message */}
                  <div className="glass-panel p-6 border-4 border-white bg-white/95 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Megaphone className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-display text-xl text-emerald-800 font-bold">Post Bulletin Notice</h3>
                      </div>
                      <p className="text-xs text-gray-400 font-medium mb-3">Set a global class message that appears instantly in student headquarters.</p>
                      <textarea
                        value={noticeMessage}
                        onChange={(e) => setNoticeMessage(e.target.value)}
                        className="w-full h-24 bg-emerald-50/35 border-2 border-emerald-100 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 focus:bg-white resize-none font-semibold text-emerald-900"
                        placeholder="E.g., Complete 3 Field Missions today for bonus XP!"
                      />
                    </div>
                    <button
                      onClick={handleSaveNotice}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-display text-sm font-semibold py-2 rounded-xl mt-4 border-2 border-emerald-400 shadow-md transition-all outline-none cursor-pointer"
                    >
                      Update Bulletin Board
                    </button>
                  </div>
                  
                  {/* Danger Zone */}
                  <div className="glass-panel p-6 border-4 border-rose-200 bg-rose-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                        <h3 className="font-display text-xl text-rose-800 font-bold">Danger Zone</h3>
                      </div>
                      <p className="text-xs text-rose-600/80 font-semibold mb-4 leading-relaxed">
                        Resetting data will wipe all student XP, quiz history, and trophy unlocks. Use only at the end of an academic term.
                      </p>
                    </div>
                    <button
                      onClick={handleResetAllData}
                      className="w-full bg-rose-100 hover:bg-rose-600 text-rose-600 hover:text-white font-bold py-2.5 rounded-xl border-2 border-rose-200 hover:border-rose-700 shadow-sm transition-all outline-none cursor-pointer"
                    >
                      Reset All Student Records
                    </button>
                  </div>
                </div>

              </div>
            );
          })()}

      
            {activeTab === 'student_progress' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 border-4 border-emerald-100 bg-white/95">
            <h3 className="font-display text-2xl text-emerald-800 font-bold mb-4">Student Progress Profiles</h3>
            
            {selectedStudent ? (
              <div>
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="mb-4 text-emerald-700 font-bold hover:text-emerald-500 transition-colors flex items-center gap-2"
                >
                  ← Back to Student List
                </button>
                <div className="border-4 border-emerald-200 rounded-3xl overflow-hidden shadow-lg relative bg-slate-50">
                  <div className="pointer-events-auto">
                    <StudentProfile student={selectedStudent} />
                  </div>
                </div>

                {/* Inline Point Awarding for Selected Student */}
                <div className="glass-panel p-6 border-4 border-amber-300 bg-amber-50/20 rounded-3xl mt-6 shadow-md">
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className="w-6 h-6 text-amber-500 animate-bounce" />
                    <h4 className="font-display text-xl text-amber-900 font-bold">Award Bonus Points to {selectedStudent.fullName}</h4>
                  </div>
                  <p className="text-sm text-gray-600 font-medium mb-4">Send instant bonus XP and a motivational message directly to {selectedStudent.fullName.split(' ')[0]}'s mailbox.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="number"
                      placeholder="Bonus XP (e.g. 50)"
                      className="bg-white border-2 border-amber-200 rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500 font-bold text-gray-700"
                      onChange={(e) => {
                        setAwardUser(selectedStudent.username);
                        setAwardAmount(e.target.value === '' ? '' : Number(e.target.value));
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Motivational Message (e.g. Superb sentence structure!)"
                      className="md:col-span-2 bg-white border-2 border-amber-200 rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500 font-semibold text-gray-700"
                      onChange={(e) => {
                        setAwardUser(selectedStudent.username);
                        setAwardMsg(e.target.value);
                      }}
                    />
                  </div>
                  <button
                    onClick={async () => {
                      if (!awardAmount) {
                        showToast("Please specify the amount of XP to award", "error");
                        return;
                      }
                      try {
                        const response = await fetch('/api/teacher/award', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            username: selectedStudent.username,
                            amount: Number(awardAmount),
                            message: awardMsg
                          })
                        });
                        if (response.ok) {
                          showToast(`Successfully awarded ${awardAmount} XP to ${selectedStudent.fullName}!`, "success");
                          setAwardAmount('');
                          setAwardMsg('');
                          // Reload student info dynamically
                          const refResponse = await fetch(`/api/student/profile/${selectedStudent.username}`);
                          if (refResponse.ok) {
                            const updated = await refResponse.json();
                            setSelectedStudent(updated);
                          }
                          loadData();
                        } else {
                          showToast("Failed to award points", "error");
                        }
                      } catch (e) {
                        showToast("Failed to award points", "error");
                      }
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-display text-xs font-bold py-3 px-6 rounded-xl mt-4 border-2 border-amber-300 shadow-md transition-all outline-none flex items-center gap-2 cursor-pointer"
                  >
                    <Gift className="w-4 h-4" /> Award Points & Send Notification
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-emerald-200 bg-emerald-50 text-emerald-900 font-bold">
                      <th className="p-4 rounded-tl-xl">Student Name</th>
                      <th className="p-4">Username</th>
                      <th className="p-4">Level</th>
                      <th className="p-4 rounded-tr-xl">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.leaderboard?.map((student: any, idx: number) => (
                      <tr key={student.username} className={`border-b border-emerald-100 hover:bg-emerald-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="p-4 font-bold text-gray-800">{student.fullName}</td>
                        <td className="p-4 text-gray-600">@{student.username}</td>
                        <td className="p-4 text-emerald-700 font-bold">Lvl {student.level} ({student.xp} XP)</td>
                        <td className="p-4">
                          <button 
                            onClick={() => setSelectedStudent(student)}
                            className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-4 py-2 rounded-xl text-sm transition-all shadow-sm"
                          >
                            View Progress Card
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'canopy' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 bg-gradient-to-r from-emerald-500/10 to-sky-500/10 border-2 border-emerald-500/30">
            <h3 className="font-display text-2xl font-black text-emerald-950 flex items-center gap-2">
              <span>🌳</span> Classroom Shared Canopy Hub
            </h3>
            <p className="text-xs text-emerald-800 font-semibold mt-1">
              You are viewing the cooperative forest canopy and student picnic circle. Sprinkle Golden Dew blessings as their guide!
            </p>
          </div>
          <GreatCanopy isTeacher={true} />
        </div>
      )}

      {activeTab === 'add_words' && (
        <div className="glass-panel p-6 border-4 border-emerald-100 bg-white/95">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            <h3 className="font-display text-2xl text-emerald-800 font-bold">Add Vocabulary</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6 font-medium">Add new words, pronunciation, meaning and example sentences to the global VocaForest vocabulary database dynamically.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="Word" 
              className="w-full bg-emerald-50/50 border-2 border-emerald-100 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 font-bold text-gray-700"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Pronunciation (e.g. /wɜːrd/)" 
              className="w-full bg-emerald-50/50 border-2 border-emerald-100 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 font-bold text-gray-700"
              value={newWordPron}
              onChange={(e) => setNewWordPron(e.target.value)}
            />
            <textarea 
              placeholder="Meaning" 
              className="w-full bg-emerald-50/50 border-2 border-emerald-100 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 font-bold text-gray-700 h-24"
              value={newWordMeaning}
              onChange={(e) => setNewWordMeaning(e.target.value)}
            />
            <textarea 
              placeholder="Example Sentence" 
              className="w-full bg-emerald-50/50 border-2 border-emerald-100 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 font-bold text-gray-700 h-24"
              value={newWordExample}
              onChange={(e) => setNewWordExample(e.target.value)}
            />
          </div>
          <button 
            onClick={handleAddWord}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-display text-sm font-semibold py-3 px-6 rounded-xl mt-6 border-2 border-emerald-400 shadow-md transition-all outline-none flex items-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" /> Save New Word to Database
          </button>

          <hr className="my-8 border-t border-emerald-100" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-display text-xl text-emerald-800 font-bold flex items-center gap-2">
                <span>📚</span> Manage Existing Vocabulary ({vocabList.length || vocabularyDb.length} words)
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Search and remove any vocabulary word from student lists and questions instantly.</p>
            </div>
            
            <input
              type="text"
              placeholder="🔍 Search words or meanings..."
              className="bg-emerald-50/50 border-2 border-emerald-100 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:border-emerald-500 w-full md:w-64"
              value={vocabSearch}
              onChange={(e) => setVocabSearch(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border-2 border-emerald-100 bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-emerald-50/60 border-b-2 border-emerald-100 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  <th className="p-4 w-20">Code</th>
                  <th className="p-4 w-40">Word</th>
                  <th className="p-4">Meaning</th>
                  <th className="p-4">Example Sentence</th>
                  <th className="p-4 text-center w-28">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100 text-xs text-gray-700">
                {(vocabList.length > 0 ? vocabList : vocabularyDb)
                  .filter(v => {
                    const term = vocabSearch.toLowerCase().trim();
                    return v.word.toLowerCase().includes(term) || 
                           v.meaning.toLowerCase().includes(term) ||
                           v.code.toLowerCase().includes(term);
                  })
                  .map((v) => (
                    <tr key={v.code} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="p-4 font-mono text-emerald-600 font-bold">{v.code}</td>
                      <td className="p-4">
                        <span className="font-bold text-emerald-900 text-sm block">{v.word}</span>
                        {v.pronunciation && <span className="text-[10px] text-gray-400 font-medium font-mono">{v.pronunciation}</span>}
                      </td>
                      <td className="p-4 font-medium text-gray-600 max-w-xs truncate" title={v.meaning}>{v.meaning}</td>
                      <td className="p-4 text-gray-500 italic max-w-xs truncate" title={v.example}>{v.example}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleRemoveWord(v.code, v.word)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-3 py-1.5 rounded-xl border border-rose-200 transition-colors cursor-pointer text-[11px]"
                        >
                          ❌ Remove
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'assign_board' && (
        <div className="glass-panel p-6 border-4 border-emerald-100 bg-white/95">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-6 h-6 text-emerald-600" />
            <h3 className="font-display text-2xl text-emerald-800 font-bold">Assign Board</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6 font-medium">Assign specific vocabulary words for your students to study and complete in their next Quiz Land session.</p>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <label className="text-sm font-bold text-emerald-800">Select Student or Class:</label>
              <select 
                value={assignTarget}
                onChange={(e) => setAssignTarget(e.target.value)}
                className="w-full bg-emerald-50/50 border-2 border-emerald-100 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 font-bold text-gray-700"
              >
                <option value="all">All Students (Entire Class)</option>
                {analytics.leaderboard.map((s: any) => (
                  <option key={s.username} value={s.username}>{s.fullName}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-4">
              <label className="text-sm font-bold text-emerald-800">Assign Words (Comma separated codes):</label>
              <input 
                type="text" 
                value={assignWords}
                onChange={(e) => setAssignWords(e.target.value)}
                placeholder="e.g. V001, V004, V012" 
                className="w-full bg-emerald-50/50 border-2 border-emerald-100 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 font-bold text-gray-700" 
              />
            </div>
          </div>
          <button 
            onClick={handleAssignWords}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-display text-sm font-semibold py-3 px-6 rounded-xl mt-6 border-2 border-emerald-400 shadow-md transition-all outline-none flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4" /> Send Assignment to Students
          </button>
        </div>
      )}

      {activeTab === 'points' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 border-4 border-amber-200 bg-white/95 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-6 h-6 text-amber-500" />
                <h3 className="font-display text-2xl text-amber-800 font-bold">Points Accreditation</h3>
              </div>
              <p className="text-sm text-gray-500 font-medium mb-6">Send personalized motivation messages with bonus XP straight to their mailboxes to reward excellent performance.</p>
              
              <div className="space-y-4">
                <select
                  value={awardUser}
                  onChange={(e) => setAwardUser(e.target.value)}
                  className="w-full bg-amber-50/30 border-2 border-amber-200 rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500 font-bold text-gray-700"
                >
                  <option value="">Select Explorer Student...</option>
                  {analytics.leaderboard.map((s: any) => (
                    <option key={s.username} value={s.username}>
                      {s.fullName} ({s.username})
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-3 gap-4">
                  <input
                    type="number"
                    value={awardAmount}
                    onChange={(e) => setAwardAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="XP Points"
                    className="col-span-1 bg-amber-50/30 border-2 border-amber-200 rounded-xl p-3 text-center text-sm focus:outline-none focus:border-amber-500 font-bold text-gray-700"
                  />
                  <input
                    type="text"
                    value={awardMsg}
                    onChange={(e) => setAwardMsg(e.target.value)}
                    placeholder="Motivation Message (e.g. Awesome efforts!)"
                    className="col-span-2 bg-amber-50/30 border-2 border-amber-200 rounded-xl p-3 text-sm focus:outline-none focus:border-amber-500 font-semibold text-gray-700"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleAwardPoints}
              className="bg-amber-500 hover:bg-amber-400 text-white font-display text-sm font-semibold py-3 px-6 rounded-xl mt-6 border-2 border-amber-300 shadow-md transition-all outline-none w-max flex items-center gap-2"
            >
              <Gift className="w-4 h-4" /> Award Points & Notify
            </button>
          </div>

          {/* Leaderboard Table moved to points tab */}
          <div className="glass-panel p-6 border-4 border-white bg-white/95 overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-display text-xl text-gray-800 font-bold">Roster Leaderboard</h3>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-3 py-1 rounded-full uppercase">
                {analytics.leaderboard.length} Students Synced
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-emerald-50 border-b-2 border-emerald-100 text-[11px] text-emerald-800 uppercase tracking-wider">
                    <th className="p-3 font-bold rounded-tl-xl">Rank</th>
                    <th className="p-3 font-bold">Student Name</th>
                    <th className="p-3 font-bold text-center">XP</th>
                    <th className="p-3 font-bold text-center">Level</th>
                    <th className="p-3 font-bold text-center">Accuracy</th>
                    <th className="p-3 font-bold text-center">Login ID</th>
                    <th className="p-3 font-bold text-center">Status</th>
                    <th className="p-3 font-bold text-center rounded-tr-xl">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-gray-700 font-medium">
                  {analytics.leaderboard.map((s: any, idx: number) => {
                    const acc = s.quizAttempts > 0 ? Math.round((s.correctAnswers / s.quizAttempts) * 100) : 100;
                    return (
                      <tr key={s.username} className="border-b border-gray-100 hover:bg-emerald-50/20 transition-colors">
                        <td className="p-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-yellow-400 text-amber-900' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500'
                          }`}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-gray-800 capitalize">
                          {s.fullName.toLowerCase()}
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-600">{s.xp} XP</td>
                        <td className="p-3 text-center">
                          <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                            Lvl {s.level}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-gray-500">{acc}%</td>
                        <td className="p-3 text-center font-mono text-[11px] text-sky-700 bg-sky-50/30 rounded-md">
                          {s.username}
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
                        </td>
                        <td className="p-3 text-center">
                          {deletingStudent === s.username ? (
                            <div className="flex gap-2 justify-center">
                              <button onClick={async () => { await handleRemoveStudent(s.username); setDeletingStudent(null); }} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-[10px] font-bold shadow-sm transition-colors cursor-pointer">Confirm</button>
                              <button onClick={() => setDeletingStudent(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-[10px] font-bold shadow-sm transition-colors cursor-pointer">Cancel</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeletingStudent(s.username)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-colors shadow-sm cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'certificates' && (
        <div className="glass-panel p-6 border-4 border-sky-100 bg-white/95">
          <div className="flex items-center gap-2 mb-4">
            <BadgeCheck className="w-6 h-6 text-sky-600" />
            <h3 className="font-display text-2xl text-sky-800 font-bold">Generate Certificate</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6 font-medium">Create digital certificates for student achievements (e.g. completing Level 10) with your digital signature.</p>
          
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-1 space-y-4">
              <label className="text-sm font-bold text-sky-800">Select Student:</label>
              <select 
                value={certStudent}
                onChange={(e) => setCertStudent(e.target.value)}
                className="w-full bg-sky-50/50 border-2 border-sky-100 rounded-xl p-3 text-sm focus:outline-none focus:border-sky-500 font-bold text-gray-700">
                <option value="">Select student...</option>
                {analytics.leaderboard.map((s: any) => (
                  <option key={s.username} value={s.username}>{s.fullName} - Level {s.level}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-4">
              <label className="text-sm font-bold text-sky-800">Achievement Title:</label>
              <input 
                type="text" 
                value={certTitle}
                onChange={(e) => setCertTitle(e.target.value)}
                placeholder="e.g. Completed Level 10 Master" 
                className="w-full bg-sky-50/50 border-2 border-sky-100 rounded-xl p-3 text-sm focus:outline-none focus:border-sky-500 font-bold text-gray-700" 
              />
            </div>
          </div>

          <div className="relative max-w-3xl mx-auto w-full aspect-[1.414] overflow-hidden rounded-xl shadow-lg border-2 border-gray-200 bg-white">
            <img src="https://i.ibb.co/G3dzq5vH/cert.png" alt="Certificate Template" className="absolute inset-0 w-full h-full object-cover" />
            
            {/* Student Name */}
            <div className="absolute top-[41%] left-0 right-0 flex justify-center px-12">
              <h2 className="font-display text-base sm:text-lg md:text-xl text-slate-800 font-bold drop-shadow-sm text-center leading-tight max-w-[85%]" style={{ fontFamily: "Georgia, serif" }}>
                {certStudent ? analytics.leaderboard.find((s: any) => s.username === certStudent)?.fullName || '[Student Name]' : '[Student Name]'}
              </h2>
            </div>

            {/* Achievement Title */}
            <div className="absolute top-[55%] left-0 right-0 flex justify-center">
              <p className="text-base sm:text-lg md:text-xl text-slate-800 font-bold text-center px-12">
                {certTitle || '[Achievement Title]'}
              </p>
            </div>

            {/* Date */}
            <div className="absolute top-[70%] left-[28%]">
              <p className="font-bold text-slate-800 text-sm sm:text-base md:text-lg">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button onClick={handleGenerateCert} className="bg-sky-600 hover:bg-sky-500 text-white font-display text-sm font-semibold py-3 px-8 rounded-xl border-2 border-sky-400 shadow-md transition-all outline-none flex items-center gap-2">
              <Download className="w-5 h-5" /> Generate Digital Certificate
            </button>
          </div>
        </div>
      )}

      {activeTab === 'game_reports' && (
        <div className="glass-panel p-6 border-4 border-emerald-100 bg-white/95 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <Gamepad2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-display text-2xl text-emerald-800 font-bold">Games Progress Report</h3>
                <p className="text-sm text-gray-500 font-medium">Analyze student performance, engagement, and accuracy across linguistic game modes.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {webhookUrl ? (
                <button
                  onClick={handleTriggerManualSync}
                  disabled={isTestingSync}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  title="Stream latest game progress directly to your Google Sheet"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingSync ? 'animate-spin' : ''}`} />
                  {isTestingSync ? 'Syncing with Sheet...' : 'Sync Games to Google Sheet'}
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('settings')}
                  className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Enable Auto-Sync to Sheet
                </button>
              )}
            </div>
          </div>

          {/* Game Modes Selector Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'linguistics', label: '🌟 Linguistic Quest', color: 'border-emerald-300 text-emerald-800 bg-emerald-50' },
              { id: 'connections', label: '🔗 Connections', color: 'border-purple-300 text-purple-800 bg-purple-50' },
              { id: 'writing', label: '✍️ Writing AI', color: 'border-orange-300 text-orange-800 bg-orange-50' },
              { id: 'reading', label: '📖 Reading Practice', color: 'border-teal-300 text-teal-800 bg-teal-50' },
              { id: 'spelling', label: '🐝 Spelling Bee', color: 'border-rose-300 text-rose-800 bg-rose-50' },
              { id: 'match', label: '🎯 Meaning Match', color: 'border-sky-300 text-sky-800 bg-sky-50' },
              { id: 'unscramble', label: '🔠 Unscramble', color: 'border-amber-300 text-amber-800 bg-amber-50' },
              { id: 'listen', label: '👂 Listen & Spell', color: 'border-blue-300 text-blue-800 bg-blue-50' },
              { id: 'bonus', label: '⚡ Spell Check', color: 'border-indigo-300 text-indigo-800 bg-indigo-50' }
            ].map(game => (
              <button
                key={game.id}
                onClick={() => setSelectedReportGame(game.id)}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs border-2 transition-all cursor-pointer ${selectedReportGame === game.id ? `${game.color} scale-102 ring-2 ring-emerald-400` : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50 hover:border-gray-300'}`}
              >
                {game.label}
              </button>
            ))}
          </div>

          {/* Compute Stats on the Fly for the Selected Game Mode */}
          {(() => {
            const students = analytics?.leaderboard || [];
            
            // For each student, get gameStats for the selected mode
            const gameDataList = students.map((s: any) => {
              const stats = s.gameStats?.[selectedReportGame] || { attempts: 0, correct: 0 };
              const wrong = stats.attempts - stats.correct;
              const accuracy = stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0;
              return {
                fullName: s.fullName,
                username: s.username,
                avatar: s.avatar,
                attempts: stats.attempts,
                correct: stats.correct,
                wrong,
                accuracy,
                lastActive: s.lastActive
              };
            });

            const playedGameList = gameDataList.filter(g => g.attempts > 0);
            
            // Overall summaries
            const totalPlays = playedGameList.reduce((sum, g) => sum + g.attempts, 0);
            const totalCorrect = playedGameList.reduce((sum, g) => sum + g.correct, 0);
            const averageAccuracy = totalPlays > 0 ? Math.round((totalCorrect / totalPlays) * 100) : 0;
            
            // Find Star student
            let starStudent = "None yet";
            let maxCorrect = 0;
            playedGameList.forEach(g => {
              if (g.correct > maxCorrect) {
                maxCorrect = g.correct;
                starStudent = g.fullName;
              }
            });

            // Filter for student table search
            const filteredGameData = gameDataList.filter(g => 
              g.fullName.toLowerCase().includes(studentGameSearch.toLowerCase()) ||
              g.username.toLowerCase().includes(studentGameSearch.toLowerCase())
            );

            return (
              <div className="space-y-6">
                {/* Metric Cards Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-emerald-50/60 border-2 border-emerald-100 rounded-2xl p-5 shadow-xs">
                    <span className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider block mb-1">Total Completed Rounds</span>
                    <h4 className="text-3xl font-extrabold text-emerald-900 tracking-tight">{totalPlays}</h4>
                    <p className="text-xs text-gray-500 font-medium mt-1">Sum of answers submitted by all students.</p>
                  </div>

                  <div className="bg-sky-50/60 border-2 border-sky-100 rounded-2xl p-5 shadow-xs">
                    <span className="text-[10px] text-sky-700 font-extrabold uppercase tracking-wider block mb-1">Class Average Accuracy</span>
                    <h4 className="text-3xl font-extrabold text-sky-900 tracking-tight">{averageAccuracy}%</h4>
                    <div className="w-full bg-sky-200/50 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-sky-500 h-full rounded-full" style={{ width: `${averageAccuracy}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-amber-50/60 border-2 border-amber-100 rounded-2xl p-5 shadow-xs">
                    <span className="text-[10px] text-amber-700 font-extrabold uppercase tracking-wider block mb-1">👑 Star Student</span>
                    <h4 className="text-2xl font-extrabold text-amber-900 tracking-tight truncate">{starStudent}</h4>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                      {maxCorrect > 0 ? `Achieved ${maxCorrect} correct answers in this mode!` : 'Awaiting first correct answers.'}
                    </p>
                  </div>
                </div>

                {/* Progress Chart Component */}
                <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 shadow-xs">
                  <h4 className="font-display font-bold text-gray-700 text-sm mb-4">Class Progress Visualization</h4>
                  
                  {playedGameList.length === 0 ? (
                    <div className="h-48 flex flex-col items-center justify-center text-center p-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                      <span className="text-3xl mb-2">📊</span>
                      <p className="text-sm font-semibold text-gray-600">No data points to display yet</p>
                      <p className="text-xs text-gray-400 mt-0.5">Progress data will automatically populate in this chart once students start playing.</p>
                    </div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={playedGameList} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis dataKey="fullName" stroke="#9ca3af" fontSize={11} tickLine={false} />
                          <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                            labelClassName="font-bold text-gray-700 text-xs"
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                          <Bar name="Correct Answers" dataKey="correct" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar name="Incorrect Answers" dataKey="wrong" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Student Breakdown Table */}
                <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h4 className="font-display font-bold text-gray-700 text-sm">Individual Student Breakdown</h4>
                    
                    {/* Search student in reports */}
                    <div className="relative">
                      <input 
                        type="text" 
                        value={studentGameSearch}
                        onChange={(e) => setStudentGameSearch(e.target.value)}
                        placeholder="Search student..." 
                        className="bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 rounded-lg py-1.5 pl-3 pr-8 text-xs font-bold text-gray-700 focus:outline-none focus:border-emerald-500 w-full sm:w-48 transition-all"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 text-[10px] text-gray-400 font-extrabold uppercase border-b border-gray-100">
                          <th className="py-3 px-5">Student</th>
                          <th className="py-3 px-5 text-center">Rounds Played</th>
                          <th className="py-3 px-5 text-center">Correct Answers</th>
                          <th className="py-3 px-5 text-center">Accuracy</th>
                          <th className="py-3 px-5 text-center">Performance Level</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredGameData.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-xs text-gray-400 font-semibold">
                              No students found matching "{studentGameSearch}".
                            </td>
                          </tr>
                        ) : (
                          filteredGameData.map((student: any) => {
                            const avatars: Record<string, string> = {
                              explorer: '🎒',
                              ranger: '🦊',
                              wizard: '🧙',
                              ninja: '🥷',
                              dino: '🦖',
                              astronaut: '🚀'
                            };
                            
                            // Visual badge logic
                            let statusBadge = { label: 'Awaiting Play 😴', style: 'bg-gray-50 text-gray-400 border-gray-200' };
                            if (student.attempts > 0) {
                              if (student.accuracy >= 90) {
                                statusBadge = { label: 'Exceptional 👑', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
                              } else if (student.accuracy >= 50) {
                                statusBadge = { label: 'Developing 🌱', style: 'bg-amber-50 text-amber-700 border-amber-200' };
                              } else {
                                statusBadge = { label: 'Attention Needed ⚠️', style: 'bg-rose-50 text-rose-700 border-rose-200' };
                              }
                            }

                            return (
                              <tr key={student.username} className="hover:bg-gray-50/30 transition-colors">
                                <td className="py-3.5 px-5 flex items-center gap-3">
                                  <span className="text-xl bg-gray-100 p-1.5 rounded-xl border border-gray-200" title={student.avatar}>
                                    {avatars[student.avatar] || '🎒'}
                                  </span>
                                  <div>
                                    <p className="text-sm font-bold text-gray-800">{student.fullName}</p>
                                    <p className="text-[10px] font-semibold text-gray-400 font-mono">@{student.username}</p>
                                  </div>
                                </td>
                                
                                <td className="py-3.5 px-5 text-center font-bold text-gray-700 text-sm">
                                  {student.attempts}
                                </td>
                                
                                <td className="py-3.5 px-5 text-center text-sm">
                                  <span className="font-bold text-emerald-600">{student.correct}</span>
                                  <span className="text-gray-300 font-medium mx-1">/</span>
                                  <span className="text-gray-500 font-semibold">{student.attempts}</span>
                                </td>

                                <td className="py-3.5 px-5">
                                  <div className="flex flex-col items-center gap-1">
                                    <span className="text-xs font-extrabold text-gray-700">{student.accuracy}%</span>
                                    <div className="w-20 bg-gray-100 h-1 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full ${student.accuracy >= 90 ? 'bg-emerald-500' : student.accuracy >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                                        style={{ width: `${student.accuracy}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3.5 px-5 text-center">
                                  <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusBadge.style}`}>
                                    {statusBadge.label}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === 'thesaurus_logs' && (() => {
        const students = analytics?.leaderboard || [];

        // Aggregate all inquiry entries across all students
        const allInquiryEntries: {
          studentUsername: string;
          studentName: string;
          studentAvatar: string;
          entry: any;
        }[] = [];

        students.forEach((s: any) => {
          if (s.inquiryEntries && Array.isArray(s.inquiryEntries)) {
            s.inquiryEntries.forEach((e: any) => {
              allInquiryEntries.push({
                studentUsername: s.username,
                studentName: s.fullName,
                studentAvatar: s.avatar || 'explorer',
                entry: e
              });
            });
          }
        });

        // Sort by date newest first
        allInquiryEntries.sort((a, b) => new Date(b.entry.date || 0).getTime() - new Date(a.entry.date || 0).getTime());

        // Filter entries
        const filteredEntries = allInquiryEntries.filter(item => {
          const matchesStudent = inquiryStudentFilter === 'all' || item.studentUsername === inquiryStudentFilter;
          const term = inquirySearch.toLowerCase().trim();
          if (!term) return matchesStudent;

          const matchesWord = item.entry.word?.toLowerCase().includes(term);
          const matchesPage = item.entry.pageNumber?.toLowerCase().includes(term);
          const matchesDef = item.entry.definition?.toLowerCase().includes(term);
          const matchesName = item.studentName.toLowerCase().includes(term);

          return matchesStudent && (matchesWord || matchesPage || matchesDef || matchesName);
        });

        // Calculate stats
        const totalEntries = allInquiryEntries.length;
        const uniqueStudents = new Set(allInquiryEntries.map(e => e.studentUsername)).size;
        const uniqueWords = new Set(allInquiryEntries.map(e => e.entry.word?.toLowerCase())).size;

        const speakWord = (text: string) => {
          if ('speechSynthesis' in window && text) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'en-US';
            window.speechSynthesis.speak(u);
          }
        };

        const handleQuickAwardPraise = async (username: string, word: string) => {
          try {
            const response = await fetch('/api/teacher/award', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                username,
                amount: 10,
                message: `⭐ Outstanding dictionary research for "${word}"! Keep up the great inquiry work!`
              })
            });

            if (response.ok) {
              showToast(`Awarded +10 Bonus XP & Praise to ${username} for "${word}"!`, "success");
              loadData();
            } else {
              showToast("Failed to award praise", "error");
            }
          } catch (e) {
            showToast("Error awarding praise", "error");
          }
        };

        return (
          <div className="glass-panel p-6 md:p-8 border-4 border-emerald-200 bg-white/95 space-y-6">
            {/* Title Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-emerald-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <BookMarked className="w-7 h-7 text-emerald-600" />
                  <h3 className="font-display text-2xl md:text-3xl font-black text-emerald-950">
                    Student Dictionary & Thesaurus Logs
                  </h3>
                </div>
                <p className="text-xs font-semibold text-emerald-700 mt-1 max-w-2xl">
                  Review words discovered by students through self-directed classroom dictionary lookup, complete with Page Numbers, student definitions, sentences, and AI feedback.
                </p>
              </div>

              {/* Quick Stats Badges */}
              <div className="flex gap-3 flex-wrap">
                <div className="bg-emerald-50 border-2 border-emerald-200 px-3.5 py-2 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase">Total Words Logged</p>
                  <p className="font-display text-xl font-black text-emerald-950">{totalEntries}</p>
                </div>

                <div className="bg-amber-50 border-2 border-amber-200 px-3.5 py-2 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-amber-800 uppercase">Active Researchers</p>
                  <p className="font-display text-xl font-black text-amber-950">{uniqueStudents}</p>
                </div>

                <div className="bg-teal-50 border-2 border-teal-200 px-3.5 py-2 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-teal-800 uppercase">Unique Words</p>
                  <p className="font-display text-xl font-black text-teal-950">{uniqueWords}</p>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                <input
                  type="text"
                  value={inquirySearch}
                  onChange={(e) => setInquirySearch(e.target.value)}
                  placeholder="Search word, page number, student name, or definition..."
                  className="w-full bg-white border-2 border-emerald-200 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold text-emerald-950 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800 uppercase">Filter Student:</span>
                <select
                  value={inquiryStudentFilter}
                  onChange={(e) => setInquiryStudentFilter(e.target.value)}
                  className="bg-white border-2 border-emerald-200 rounded-xl py-2 px-3 text-xs font-bold text-emerald-950 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Students ({students.length})</option>
                  {students.map((s: any) => (
                    <option key={s.username} value={s.username}>
                      {s.fullName} ({s.inquiryEntries?.length || 0} entries)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Entry Cards List */}
            {filteredEntries.length === 0 ? (
              <div className="text-center py-12 bg-emerald-50/40 rounded-3xl border-2 border-dashed border-emerald-200 p-8 space-y-2">
                <Brain className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="font-display text-lg font-bold text-emerald-900">No Thesaurus / Dictionary Entries Found</h4>
                <p className="text-xs text-emerald-700 max-w-md mx-auto">
                  {allInquiryEntries.length === 0
                    ? "Students have not logged any dictionary lookups yet. When students look up words in their classroom dictionary and log them, they will appear here!"
                    : "No entries match your current search or filter query."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEntries.map((item, idx) => {
                  const { studentName, studentUsername, entry } = item;
                  return (
                    <div
                      key={entry.id || idx}
                      className="bg-white p-5 rounded-2xl border-2 border-emerald-200 shadow-md space-y-3 relative overflow-hidden"
                    >
                      {/* Header: Student Name + Word */}
                      <div className="flex items-start justify-between border-b border-emerald-100 pb-3 gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-emerald-100 text-emerald-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                              👤 {studentName} (@{studentUsername})
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1.5">
                            <h4 className="font-display text-2xl font-black text-emerald-950 capitalize">
                              {entry.word}
                            </h4>
                            <button
                              onClick={() => speakWord(entry.word)}
                              className="text-emerald-600 hover:text-emerald-800 p-1"
                              title="Listen to pronunciation"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-amber-100 text-amber-900 text-xs font-display font-extrabold px-2.5 py-0.5 rounded-lg border border-amber-300 flex items-center gap-1">
                              <Hash className="w-3 h-3 text-amber-700" /> Dict {entry.pageNumber || 'Looked Up'}
                            </span>
                            <span className="bg-teal-100 text-teal-800 text-[11px] font-bold px-2 py-0.5 rounded-md capitalize">
                              {entry.partOfSpeech || 'Word'}
                            </span>
                          </div>
                        </div>

                        {/* Award Praise Button */}
                        <button
                          onClick={() => handleQuickAwardPraise(studentUsername, entry.word)}
                          className="bg-amber-100 hover:bg-amber-500 hover:text-white text-amber-900 text-xs font-display font-bold px-3 py-1.5 rounded-xl border border-amber-300 transition-all flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
                          title="Send +10 XP Praise for good research"
                        >
                          <Award className="w-3.5 h-3.5 text-amber-600" /> Praise +10 XP
                        </button>
                      </div>

                      {/* Body Content */}
                      <div className="space-y-2 text-xs">
                        <div>
                          <strong className="text-emerald-800 uppercase font-bold text-[10px] block">Student Dictionary Definition:</strong>
                          <p className="text-emerald-950 font-medium bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 leading-relaxed">
                            "{entry.definition}"
                          </p>
                        </div>

                        {entry.synonyms && entry.synonyms.length > 0 && (
                          <div>
                            <strong className="text-teal-800 uppercase font-bold text-[10px] block">Synonyms Logged:</strong>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {entry.synonyms.map((syn: string, sIdx: number) => (
                                <span key={sIdx} className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded text-[10px] font-bold">
                                  {syn}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {entry.originalSentence && (
                          <div>
                            <strong className="text-indigo-800 uppercase font-bold text-[10px] block">Student's Original Sentence:</strong>
                            <p className="bg-indigo-50/70 p-2 rounded-xl text-indigo-950 italic font-semibold">
                              "{entry.originalSentence}"
                            </p>
                          </div>
                        )}

                        {entry.classroomNote && (
                          <p className="text-emerald-800 text-[11px]">
                            <strong>Classroom Context:</strong> {entry.classroomNote}
                          </p>
                        )}

                        {entry.memoryHook && (
                          <p className="text-amber-900 text-[11px] font-medium flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            <span><strong>Memory Hook:</strong> {entry.memoryHook}</span>
                          </p>
                        )}

                        {entry.aiFeedback && (
                          <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 space-y-1">
                            <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                              🤖 AI Guide Feedback:
                            </p>
                            <p className="text-[11px] text-amber-950 font-medium">{entry.aiFeedback.praise}</p>
                          </div>
                        )}

                        <div className="text-[10px] text-emerald-700 pt-1 text-right font-medium">
                          Logged on {entry.date ? new Date(entry.date).toLocaleString() : 'Recent Inquiry'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {activeTab === 'add_student' && (
        <div className="glass-panel p-6 border-4 border-indigo-100 bg-white/95">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-6 h-6 text-indigo-600" />
            <h3 className="font-display text-2xl text-indigo-800 font-bold">Add New Student</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6 font-medium">Create a new student profile and generate login credentials for them to access VocaForest.</p>
          
          <div className="max-w-md mx-auto bg-indigo-50/50 p-6 rounded-2xl border-2 border-indigo-100">
            <label className="text-sm font-bold text-indigo-800 mb-2 block">Student Full Name:</label>
            <input 
              type="text" 
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              placeholder="e.g. Ali bin Abu" 
              className="w-full bg-white border-2 border-indigo-200 rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500 font-bold text-gray-700 mb-4" 
            />
            
            <button 
              onClick={handleAddStudent} 
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-display text-sm font-semibold py-3 px-8 rounded-xl border-2 border-indigo-400 shadow-md transition-all outline-none flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" /> Generate Login Credentials
            </button>

            {newStudentCreds && (
              <div className="mt-6 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                <h4 className="font-bold text-emerald-800 mb-2 text-center text-sm">Credentials Generated Successfully!</h4>
                <div className="flex flex-col gap-2">
                  <div className="bg-white p-3 rounded-lg border border-emerald-100 flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-bold uppercase">Username:</span>
                    <span className="font-mono font-bold text-emerald-700">{newStudentCreds.username}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-emerald-100 flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-bold uppercase">Password:</span>
                    <span className="font-mono font-bold text-emerald-700">{newStudentCreds.password}</span>
                  </div>
                </div>
                <p className="text-xs text-center text-emerald-600 mt-3 font-semibold">Please copy and provide these credentials to the student.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab - Google Sheets Auto Sync */}
      {activeTab === 'settings' && (
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-xl border-2 border-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b-2 border-emerald-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-emerald-900">Google Sheets Real-Time Auto-Sync</h2>
                <p className="text-emerald-700/80 font-medium">Automatically stream student progress and detailed game performance reports directly to Google Sheets.</p>
              </div>
            </div>

            {webhookUrl && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-800">Auto-Sync Active</span>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Features Synced Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5">
                <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
                  <span>📋</span> Tab 1: Student Overview
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed font-medium">
                  Tracks usernames, full names, levels, XP, total quiz attempts, correct answers, and activity dates.
                </p>
              </div>
              <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3.5">
                <div className="text-xs font-bold text-sky-800 flex items-center gap-1.5 mb-1">
                  <span>🎮</span> Tab 2: Game Progress Report
                </div>
                <p className="text-[11px] text-sky-700 leading-relaxed font-medium">
                  Class summary and a 9-game matrix (Linguistic Quest, Match, Connections, Writing, etc.) with accuracy & star students.
                </p>
              </div>
              <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-3.5">
                <div className="text-xs font-bold text-teal-800 flex items-center gap-1.5 mb-1">
                  <span>📑</span> Tab 3: Detailed Game Logs
                </div>
                <p className="text-[11px] text-teal-700 leading-relaxed font-medium">
                  Row-by-row logs for each student per game mode with performance ratings (Exceptional, Developing, Attention Needed).
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6">
              <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-emerald-600" /> Setup Instructions</h3>
              <ol className="list-decimal list-inside space-y-3 text-sm text-emerald-800 font-medium">
                <li>Create a new Google Sheet at <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">sheets.new <ExternalLink className="w-3.5 h-3.5 inline" /></a></li>
                <li>In your Google Sheet, click <strong>Extensions</strong> &gt; <strong>Apps Script</strong>.</li>
                <li>Delete any code there and paste the script provided below.</li>
                <li>Click <strong>Deploy</strong> &gt; <strong>New deployment</strong>.</li>
                <li>Select type <strong>Web app</strong> (click the gear icon ⚙️ next to 'Select type').</li>
                <li>Set "Execute as" to <strong>Me</strong> and "Who has access" to <strong>Anyone</strong>.</li>
                <li>Click <strong>Deploy</strong>, authorize permissions, and copy the provided <strong>Web app URL</strong>.</li>
                <li>Paste the Web app URL below and click <strong>Save Webhook Settings</strong>!</li>
              </ol>
            </div>

            <div>
              <label className="block text-sm font-bold text-emerald-900 mb-2">Apps Script Code to Copy (with Game Progress Report Support):</label>
              <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto relative group border-2 border-slate-700">
                <button 
                  onClick={() => {
                    const code = `// ========================================================
// VOCAFOREST GOOGLE APPS SCRIPT WEBHOOK (READ + WRITE)
// Handles auto-sync from VocaForest and non-destructive merges!
// ========================================================

function doGet(e) {
  return handleSheetRead();
}

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    if (payload.action === 'fetch_data') {
      return handleSheetRead();
    }
    return handleSheetWrite(payload);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// --------------------------------------------------------
// READ FUNCTION: Returns current student records to VocaForest
// --------------------------------------------------------
function handleSheetRead() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var overviewSheet = ss.getSheetByName("Student Overview");
    if (!overviewSheet || overviewSheet.getLastRow() <= 1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "empty",
        students: []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var numRows = overviewSheet.getLastRow() - 1;
    var rows = overviewSheet.getRange(2, 1, numRows, 8).getValues();
    var students = [];
    rows.forEach(function(r) {
      if (r[0]) {
        students.push({
          username: String(r[0]),
          fullName: String(r[1] || ''),
          level: Number(r[2]) || 1,
          xp: Number(r[3]) || 0,
          quizAttempts: Number(r[4]) || 0,
          correctAnswers: Number(r[5]) || 0,
          accuracy: String(r[6] || '0%'),
          lastActive: r[7] ? String(r[7]) : ''
        });
      }
    });

    // Read game details if available from Sheet 2
    var gameDetails = [];
    var gameSheet = ss.getSheetByName("Game Progress Report");
    if (gameSheet && gameSheet.getLastRow() > 10) {
      var allGameRows = gameSheet.getDataRange().getValues();
      var matrixStartIndex = -1;
      for (var i = 0; i < allGameRows.length; i++) {
        if (allGameRows[i][0] === 'Username' && allGameRows[i][1] === 'Full Name') {
          matrixStartIndex = i + 1;
          break;
        }
      }
      if (matrixStartIndex > 0) {
        var modeIds = ['linguistics', 'connections', 'writing', 'reading', 'spelling', 'match', 'unscramble', 'listen', 'bonus'];
        for (var j = matrixStartIndex; j < allGameRows.length; j++) {
          var gRow = allGameRows[j];
          if (gRow[0]) {
            var modesObj = {};
            for (var m = 0; m < modeIds.length; m++) {
              var cellVal = String(gRow[2 + m] || '');
              var match = cellVal.match(/(\\d+)\\s*\\/\\s*(\\d+)/);
              if (match) {
                modesObj[modeIds[m]] = {
                  correct: Number(match[1]),
                  attempts: Number(match[2])
                };
              }
            }
            gameDetails.push({
              username: String(gRow[0]),
              modes: modesObj
            });
          }
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      students: students,
      gameDetails: gameDetails
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: e.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// --------------------------------------------------------
// WRITE FUNCTION: Non-destructively merges points into Google Sheets
// --------------------------------------------------------
function handleSheetWrite(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var students = payload.students || [];
  var gameModes = payload.gameModes || [
    { id: 'linguistics', label: 'Linguistic Quest' },
    { id: 'connections', label: 'Connections' },
    { id: 'writing', label: 'Writing AI' },
    { id: 'reading', label: 'Reading Practice' },
    { id: 'spelling', label: 'Spelling Bee' },
    { id: 'match', label: 'Meaning Match' },
    { id: 'unscramble', label: 'Unscramble' },
    { id: 'listen', label: 'Listen & Spell' },
    { id: 'bonus', label: 'Spell Check' }
  ];

  // ==========================================
  // 1. SHEET 1: Student Overview (Safe Merge)
  // ==========================================
  var overviewSheet = ss.getSheetByName("Student Overview");
  if (!overviewSheet) {
    var firstSheet = ss.getSheets()[0];
    if (firstSheet && firstSheet.getName().toLowerCase().indexOf("sheet") === 0) {
      overviewSheet = firstSheet;
      overviewSheet.setName("Student Overview");
    } else {
      overviewSheet = ss.insertSheet("Student Overview", 0);
    }
  }

  // Read existing student points to PREVENT loss
  var existingMap = {};
  if (overviewSheet.getLastRow() > 1) {
    var existingRows = overviewSheet.getRange(2, 1, overviewSheet.getLastRow() - 1, 8).getValues();
    existingRows.forEach(function(r) {
      if (r[0]) {
        var key = String(r[0]).toLowerCase().trim();
        existingMap[key] = {
          fullName: String(r[1] || ''),
          level: Number(r[2]) || 1,
          xp: Number(r[3]) || 0,
          attempts: Number(r[4]) || 0,
          correct: Number(r[5]) || 0,
          lastActive: r[7]
        };
      }
    });
  }

  overviewSheet.clear();

  var overviewHeaders = ['Username', 'Full Name', 'Level', 'XP', 'Quiz Attempts', 'Correct Answers', 'Quiz Accuracy %', 'Last Active'];
  var overviewData = [overviewHeaders];

  students.forEach(function(s) {
    var key = (s.username || '').toLowerCase().trim();
    var prev = existingMap[key] || { level: 1, xp: 0, attempts: 0, correct: 0, lastActive: '' };

    // SAFE MERGE: Student points and quiz numbers NEVER decrease!
    var finalXp = Math.max(prev.xp, Number(s.xp) || 0);
    var finalLevel = Math.max(prev.level, Number(s.level) || 1);
    var finalAttempts = Math.max(prev.attempts, Number(s.quizAttempts) || 0);
    var finalCorrect = Math.max(prev.correct, Number(s.correctAnswers) || 0);
    var acc = finalAttempts > 0 ? Math.round((finalCorrect / finalAttempts) * 100) + '%' : '0%';
    var lastActive = s.lastActive || prev.lastActive || '';

    overviewData.push([
      s.username,
      s.fullName || prev.fullName || '',
      finalLevel,
      finalXp,
      finalAttempts,
      finalCorrect,
      acc,
      lastActive ? new Date(lastActive).toLocaleString() : 'Never'
    ]);
  });

  overviewSheet.getRange(1, 1, overviewData.length, overviewData[0].length).setValues(overviewData);
  overviewSheet.getRange(1, 1, 1, overviewData[0].length)
    .setFontWeight('bold')
    .setBackground('#10b981')
    .setFontColor('#ffffff');
  overviewSheet.setFrozenRows(1);

  // ==========================================
  // 2. SHEET 2: Game Progress Report
  // ==========================================
  var gameSheet = ss.getSheetByName("Game Progress Report");
  if (!gameSheet) {
    gameSheet = ss.insertSheet("Game Progress Report", 1);
  }

  // Read existing game progress matrix if exists to prevent loss
  var existingGameMap = {};
  if (gameSheet.getLastRow() > 10) {
    var oldGameRange = gameSheet.getDataRange().getValues();
    var mStart = -1;
    for (var k = 0; k < oldGameRange.length; k++) {
      if (oldGameRange[k][0] === 'Username' && oldGameRange[k][1] === 'Full Name') {
        mStart = k + 1;
        break;
      }
    }
    if (mStart > 0) {
      for (var rowI = mStart; rowI < oldGameRange.length; rowI++) {
        var gRow = oldGameRange[rowI];
        if (gRow[0]) {
          var uKey = String(gRow[0]).toLowerCase().trim();
          existingGameMap[uKey] = {};
          for (var colI = 0; colI < gameModes.length; colI++) {
            var cellStr = String(gRow[2 + colI] || '');
            var parseMatch = cellStr.match(/(\\d+)\\s*\\/\\s*(\\d+)/);
            if (parseMatch) {
              existingGameMap[uKey][gameModes[colI].id] = {
                correct: Number(parseMatch[1]),
                attempts: Number(parseMatch[2])
              };
            }
          }
        }
      }
    }
  }

  gameSheet.clear();

  var gameData = [];
  gameData.push(['🎮 VOCAFOREST - CLASS GAME PERFORMANCE SUMMARY', '', '', '', '']);
  gameData.push(['Game Mode', 'Rounds Played by Class', 'Total Correct Answers', 'Class Average Accuracy', 'Star Student']);

  // Compute summary with safe merge
  gameModes.forEach(function(m) {
    var totAttempts = 0;
    var totCorrect = 0;
    var maxC = 0;
    var star = 'None yet';
    students.forEach(function(s) {
      var uKey = (s.username || '').toLowerCase().trim();
      var prevStats = (existingGameMap[uKey] && existingGameMap[uKey][m.id]) || { attempts: 0, correct: 0 };
      var curStats = (s.gameStats && s.gameStats[m.id]) || { attempts: 0, correct: 0 };
      var att = Math.max(prevStats.attempts || 0, curStats.attempts || 0);
      var cor = Math.max(prevStats.correct || 0, curStats.correct || 0);

      totAttempts += att;
      totCorrect += cor;
      if (cor > maxC) {
        maxC = cor;
        star = s.fullName || s.username;
      }
    });
    var acc = totAttempts > 0 ? Math.round((totCorrect / totAttempts) * 100) + '%' : '0%';
    gameData.push([m.label || m.id, totAttempts, totCorrect, acc, star]);
  });

  gameData.push(['', '', '', '', '']);
  gameData.push(['📊 INDIVIDUAL STUDENT GAME BREAKDOWN MATRIX', '', '', '', '', '', '', '', '', '', '', '', '', '']);

  var matrixHeaders = [
    'Username', 'Full Name',
    '🌟 Linguistic Quest', '🔗 Connections', '✍️ Writing AI',
    '📖 Reading Practice', '🐝 Spelling Bee', '🎯 Meaning Match',
    '🔠 Unscramble', '👂 Listen & Spell', '⚡ Spell Check',
    'Total Game Rounds', 'Total Correct', 'Overall Game Accuracy'
  ];
  gameData.push(matrixHeaders);

  students.forEach(function(s) {
    var uKey = (s.username || '').toLowerCase().trim();
    var row = [s.username, s.fullName || ''];
    var totalGameAttempts = 0;
    var totalGameCorrect = 0;

    gameModes.forEach(function(m) {
      var prevStats = (existingGameMap[uKey] && existingGameMap[uKey][m.id]) || { attempts: 0, correct: 0 };
      var curStats = (s.gameStats && s.gameStats[m.id]) || { attempts: 0, correct: 0 };
      var att = Math.max(prevStats.attempts || 0, curStats.attempts || 0);
      var cor = Math.max(prevStats.correct || 0, curStats.correct || 0);

      totalGameAttempts += att;
      totalGameCorrect += cor;
      if (att > 0) {
        var pct = Math.round((cor / att) * 100);
        row.push(cor + ' / ' + att + ' (' + pct + '%)');
      } else {
        row.push('-');
      }
    });

    row.push(totalGameAttempts);
    row.push(totalGameCorrect);
    var overallPct = totalGameAttempts > 0 ? Math.round((totalGameCorrect / totalGameAttempts) * 100) + '%' : '0%';
    row.push(overallPct);
    gameData.push(row);
  });

  gameSheet.getRange(1, 1, gameData.length, matrixHeaders.length).setValues(
    gameData.map(function(r) {
      while (r.length < matrixHeaders.length) r.push('');
      return r;
    })
  );

  gameSheet.getRange(1, 1, 1, 5)
    .setFontWeight('bold')
    .setBackground('#0284c7')
    .setFontColor('#ffffff');
  gameSheet.getRange(2, 1, 1, 5)
    .setFontWeight('bold')
    .setBackground('#bae6fd')
    .setFontColor('#0369a1');

  var matrixRowIdx = gameModes.length + 5;
  gameSheet.getRange(matrixRowIdx - 1, 1, 1, matrixHeaders.length)
    .setFontWeight('bold')
    .setBackground('#047857')
    .setFontColor('#ffffff');
  gameSheet.getRange(matrixRowIdx, 1, 1, matrixHeaders.length)
    .setFontWeight('bold')
    .setBackground('#a7f3d0')
    .setFontColor('#065f46');

  // ==========================================
  // 3. SHEET 3: Game Progress - Detailed
  // ==========================================
  var detailedSheet = ss.getSheetByName("Game Progress - Detailed");
  if (!detailedSheet) {
    detailedSheet = ss.insertSheet("Game Progress - Detailed", 2);
  }
  detailedSheet.clear();

  var detailedHeaders = [
    'Username', 'Full Name', 'Game Mode', 'Rounds Played', 'Correct Answers',
    'Wrong Answers', 'Accuracy %', 'Performance Rating', 'Last Active'
  ];
  var detailedData = [detailedHeaders];

  students.forEach(function(s) {
    var uKey = (s.username || '').toLowerCase().trim();
    gameModes.forEach(function(m) {
      var prevStats = (existingGameMap[uKey] && existingGameMap[uKey][m.id]) || { attempts: 0, correct: 0 };
      var curStats = (s.gameStats && s.gameStats[m.id]) || { attempts: 0, correct: 0 };
      var att = Math.max(prevStats.attempts || 0, curStats.attempts || 0);
      var cor = Math.max(prevStats.correct || 0, curStats.correct || 0);
      var wrong = att - cor;
      var accNum = att > 0 ? Math.round((cor / att) * 100) : 0;
      var rating = 'Awaiting Play 😴';
      if (att > 0) {
        if (accNum >= 90) rating = 'Exceptional 👑 (≥90%)';
        else if (accNum >= 50) rating = 'Developing 🌱 (50-89%)';
        else rating = 'Attention Needed ⚠️ (<50%)';
      }
      detailedData.push([
        s.username,
        s.fullName || '',
        m.label || m.id,
        att,
        cor,
        wrong,
        accNum + '%',
        rating,
        s.lastActive ? new Date(s.lastActive).toLocaleString() : 'Never'
      ]);
    });
  });

  detailedSheet.getRange(1, 1, detailedData.length, detailedHeaders.length).setValues(detailedData);
  detailedSheet.getRange(1, 1, 1, detailedHeaders.length)
    .setFontWeight('bold')
    .setBackground('#0f766e')
    .setFontColor('#ffffff');
  detailedSheet.setFrozenRows(1);

  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Synced Student Overview and Game Progress Report safely without data loss!"
  })).setMimeType(ContentService.MimeType.JSON);
}`;
                    navigator.clipboard.writeText(code);
                    showToast("Updated Non-Destructive Apps Script code copied to clipboard!", "success");
                  }}
                  className="absolute top-3 right-3 bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  Copy Code
                </button>
                <pre className="text-emerald-400 text-xs font-mono whitespace-pre-wrap leading-relaxed pr-24 max-h-72 overflow-y-auto">
{`function doGet(e) {
  return handleSheetRead();
}

function doPost(e) {
  // Non-destructive auto-sync:
  // 1. Automatically preserves existing student XP and quiz scores (never resets points!)
  // 2. Automatically populates "Student Overview" (XP, Level, Quizzes)
  // 3. Automatically populates "Game Progress Report" (Class Summary & 9-Game Matrix)
  // 4. Automatically populates "Game Progress - Detailed" (Per-student rating logs)
  // 5. Supports doGet & fetch_data to restore progress to VocaForest anytime!
  // Click 'Copy Code' above to get the full script!
}`}
                </pre>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-emerald-900 mb-2">Google Apps Script Webhook URL:</label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/..."
                className="w-full bg-emerald-50 border-2 border-emerald-200 rounded-xl px-4 py-3 text-emerald-900 font-medium focus:outline-none focus:border-emerald-400 focus:bg-white transition-all text-xs sm:text-sm font-mono"
              />
            </div>

            {lastSyncInfo?.time && (
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-3">
                <span className={`w-2 h-2 rounded-full ${lastSyncInfo.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span>
                  Last Auto-Sync: <strong>{new Date(lastSyncInfo.time).toLocaleString()}</strong>
                  {lastSyncInfo.status === 'success' ? ' (Successful)' : ' (Sync encountered an error)'}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleSaveWebhook}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-7 py-3 rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 transition-all outline-none flex items-center gap-2 cursor-pointer text-sm"
              >
                <CheckCircle className="w-5 h-5" /> Save Webhook URL
              </button>

              <button
                onClick={handleTriggerManualSync}
                disabled={isTestingSync}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-7 py-3 rounded-xl shadow-[0_4px_12px_rgba(2,132,199,0.3)] hover:-translate-y-0.5 transition-all outline-none flex items-center gap-2 cursor-pointer text-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isTestingSync ? 'animate-spin' : ''}`} />
                {isTestingSync ? 'Testing & Syncing...' : '⚡ Test & Sync to Google Sheet Now'}
              </button>

              <button
                onClick={handleRestoreFromSheet}
                disabled={isRestoringFromSheet}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-7 py-3 rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 transition-all outline-none flex items-center gap-2 cursor-pointer text-sm disabled:opacity-50"
              >
                <Download className={`w-5 h-5 ${isRestoringFromSheet ? 'animate-bounce' : ''}`} />
                {isRestoringFromSheet ? 'Restoring...' : '📥 Restore Points From Google Sheet'}
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
