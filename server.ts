import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { vocabularyDb as defaultVocabulary } from './src/vocabulary';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'database.json');
const BACKUP_DB_FILE = path.join(process.cwd(), 'database.backup.json');
const CONFIG_FILE = path.join(process.cwd(), '.teacher_config.json');

app.use(express.json());

// Initialize Firebase Firestore for persistent cloud database storage across container reboots
let firestoreDb: any = null;
try {
  const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(firebaseConfigPath)) {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
    const firebaseApp = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId
    });
    const databaseId = config.firestoreDatabaseId || process.env.FIRESTORE_DATABASE_ID || 'ai-studio-remixvocaforesta-07214afb-562b-48c9-b92d-b71142bafde5';
    firestoreDb = databaseId
      ? getFirestore(firebaseApp, databaseId)
      : getFirestore(firebaseApp);
    console.log("🔥 Firebase Firestore initialized successfully for persistent cloud backup with db:", databaseId);
  }
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

// Global lazy Gemini client instance to optimize response latency
let aiInstance: GoogleGenAI | null = null;
function getAI() {
  if (!aiInstance) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY env variable is missing!");
    }
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// List of all 33 students
const studentsRoster = [
  "AISY ARYAN HARITH BIN ABDUL RAUF",
  "AKSHARAN A/L MARATHANDAVAR",
  "ALVIN LEE YONG DING",
  "ARUNACHALESWARAN A/L JAGADISHWARAN",
  "ASHER ELIJAH RAJ A/L LUKE JAY RAJ",
  "DAKSESH A/L BALA KUMARAN",
  "DANIEL MICHAEL XAVIER",
  "KAAVINESH A/L PARAKESH",
  "KARANVEER SINGH SIDHU A/L JASVINDER SINGH",
  "KAVVINESH A/L SARAVANAN",
  "KRISHEN",
  "MARCUS MALLANAIDU",
  "MITRRAN A/L NARENDRAN",
  "MOHAMAD RAYYAN RAIKHAL BIN MOHAMAD REDZUAN",
  "MUHAMMAD ADRIAN SHEHZIL BIN ANDRI",
  "MUHAMMAD AIMAN ZARIF BIN MUHAMMAD SAIFUL SAFWAN",
  "MUHAMMAD DANIYAL RAYYIS BIN MUHAMMAD AZMI",
  "MUHAMMAD HAIDAR RAIQAL BIN MUHAMAD HAIFARASYID",
  "PRISHAANT DEV A/L RUBALAN",
  "PURAVSENNAN A/L SHANMUGASENNAN",
  "QARIZH ZAYYAN ISMAIL BIN AHMAD ZAKUAN ZAIDI",
  "RAAHULL RYKER KANNA",
  "SAAJVEER A/L KRISHNAKUMAR",
  "SHARVIN SREE A/L KRISHNA",
  "SECHVIN A/L RAVI",
  "SHADRACH RAFAEL PILLAI A/L C.SHRI RUBAN PILLAI",
  "THAREN MATHHEW PILLLAI",
  "VICTOR RICH ALEVZON",
  "VIHAAN RAJ A/L SUBANESH",
  "WAN MUAZ ZAIM BIN SOFIAN",
  "YASSHWANTH A/L SUNDAR",
  "AWINESH REDDY A/L THANA SEELAN",
  "KHOSHIGAAN A/L KALAIMUGILAN ARUN"
];

// Helper to encrypt passwords using SHA-256
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate unique usernames for the roster
function generateUsername(fullName: string, existingUsernames: Set<string>): string {
  const clean = fullName.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  const parts = clean.split(/\s+/);
  
  // Try first word
  let base = parts[0];
  if (base.length < 3 && parts[1]) {
    base = base + parts[1][0];
  }
  
  let candidate = base;
  let counter = 1;
  while (existingUsernames.has(candidate)) {
    if (parts[counter]) {
      candidate = base + '_' + parts[counter].substring(0, 3);
      counter++;
    } else {
      candidate = base + Math.floor(Math.random() * 100);
    }
  }
  return candidate;
}

// Progressive difficulty level calculation
function calculateLevel(xp: number): number {
  let level = 1;
  let xpRequired = 200; // XP needed to get to next level
  let currentXP = xp;
  while (currentXP >= xpRequired) {
    currentXP -= xpRequired;
    level++;
    xpRequired += 150; // Each subsequent level takes 150 XP more
  }
  return level;
}

// Database Merge Helper to prevent student progress loss

let memDb: any = null;
let isSyncingToFirestore = false;
let pendingFirestoreSync = false;

// Safe, authoritative in-memory state
function loadDb(): any {
  let db: any = null;
  if (memDb) {
    db = memDb;
  } else {
    // 1. Try reading primary database file
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        if (content && content.trim().length > 0) {
          db = JSON.parse(content);
        }
      }
    } catch (e) {
      console.error("Error loading primary DB_FILE, attempting backup recovery...", e);
    }

    // 2. Try restoring from backup database file
    if (!db) {
      try {
        if (fs.existsSync(BACKUP_DB_FILE)) {
          const backupContent = fs.readFileSync(BACKUP_DB_FILE, 'utf-8');
          if (backupContent && backupContent.trim().length > 0) {
            console.log("Successfully restored database from backup file!");
            db = JSON.parse(backupContent);
            fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
          }
        }
      } catch (e) {
        console.error("Error loading BACKUP_DB_FILE:", e);
      }
    }
  }

  // Ensure persistent teacherConfig is loaded
  if (db) {
    if (!db.teacherConfig || !db.teacherConfig.googleSheetWebhookUrl) {
      try {
        if (fs.existsSync(CONFIG_FILE)) {
          const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
          if (cfg && cfg.googleSheetWebhookUrl) {
            db.teacherConfig = { ...(db.teacherConfig || {}), ...cfg };
          }
        }
      } catch (e) {}
    }
  }

  return db;
}

// Async Cloud Firestore Sync Functions
async function syncFromFirestore(): Promise<any> {
  if (!firestoreDb) return null;
  try {
    const dbDocRef = doc(firestoreDb, 'vocaforest', 'main');
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Firestore fetch timeout (4s)')), 4000);
    });
    const snapshot: any = await Promise.race([getDoc(dbDocRef), timeoutPromise]);
    if (snapshot.exists()) {
      const remoteData = snapshot.data();
      if (remoteData && remoteData.students && Object.keys(remoteData.students).length > 0) {
        console.log("☁️ Successfully loaded persistent student progress database from Firestore!");
        return remoteData;
      }
    }
  } catch (e) {
    console.warn("Notice: Firestore sync not available or timed out on startup:", e);
    return null;
  }
  return null;
}

async function syncToFirestore() {
  if (!firestoreDb || !memDb || !memDb.students || Object.keys(memDb.students).length === 0) return;
  
  if (isSyncingToFirestore) {
    pendingFirestoreSync = true;
    return;
  }
  
  isSyncingToFirestore = true;
  pendingFirestoreSync = false;
  
  // Clone current authoritative memory state
  const dataToWrite = JSON.parse(JSON.stringify(memDb));
  
  try {
    const dbDocRef = doc(firestoreDb, 'vocaforest', 'main');
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Firestore write timeout (5s)')), 5000);
    });
    await Promise.race([setDoc(dbDocRef, dataToWrite), timeoutPromise]);
    // console.log("☁️ Persistent student data cloud synced to Firestore successfully!");
  } catch (e) {
    console.error("Error writing to Firestore cloud database:", e);
  } finally {
    isSyncingToFirestore = false;
    if (pendingFirestoreSync) {
      syncToFirestore().catch(err => console.error("Async Firestore sync failed:", err));
    }
  }
}

// Save Local Disk DB
function saveDbLocal(data: any) {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    const tmpFile = DB_FILE + '.tmp';
    fs.writeFileSync(tmpFile, jsonStr, 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
    
    const backupTmp = BACKUP_DB_FILE + '.tmp';
    fs.writeFileSync(backupTmp, jsonStr, 'utf-8');
    fs.renameSync(backupTmp, BACKUP_DB_FILE);

    if (data && data.teacherConfig && data.teacherConfig.googleSheetWebhookUrl) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(data.teacherConfig, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error("Error saving database locally:", err);
  }
}

let webhookSyncTimeout: NodeJS.Timeout | null = null;

const GAME_REPORT_MODES = [
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

async function executeWebhookSync(db: any) {
  if (!db.teacherConfig?.googleSheetWebhookUrl) return;
  const webhookUrl = db.teacherConfig.googleSheetWebhookUrl;

  try {
    const studentsList: any[] = Object.values(db.students || {});

    const studentsData = studentsList.map((s: any) => {
      const quizAttempts = s.quizAttempts || 0;
      const correctAnswers = s.correctAnswers || 0;
      const accuracy = quizAttempts > 0 ? Math.round((correctAnswers / quizAttempts) * 100) : 0;
      return {
        username: s.username,
        fullName: s.fullName,
        xp: s.xp || 0,
        level: s.level || 1,
        quizAttempts,
        correctAnswers,
        accuracy,
        lastActive: s.lastActive,
        gameStats: s.gameStats || {}
      };
    });

    // Compute aggregated class summary for each game mode
    const gameSummaries = GAME_REPORT_MODES.map(mode => {
      let totalAttempts = 0;
      let totalCorrect = 0;
      let starStudent = "None yet";
      let maxCorrect = 0;

      studentsList.forEach(s => {
        const stats = s.gameStats?.[mode.id] || { attempts: 0, correct: 0 };
        const att = stats.attempts || 0;
        const cor = stats.correct || 0;
        totalAttempts += att;
        totalCorrect += cor;
        if (cor > maxCorrect) {
          maxCorrect = cor;
          starStudent = s.fullName || s.username;
        }
      });

      const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
      return {
        id: mode.id,
        label: mode.label,
        totalAttempts,
        totalCorrect,
        accuracy,
        starStudent: maxCorrect > 0 ? starStudent : "None yet"
      };
    });

    // Compute individual student game matrices
    const studentGameDetails = studentsList.map(s => {
      let totalGameAttempts = 0;
      let totalGameCorrect = 0;
      const modes: Record<string, any> = {};

      GAME_REPORT_MODES.forEach(m => {
        const stats = s.gameStats?.[m.id] || { attempts: 0, correct: 0 };
        const attempts = stats.attempts || 0;
        const correct = stats.correct || 0;
        const wrong = attempts - correct;
        const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
        totalGameAttempts += attempts;
        totalGameCorrect += correct;
        modes[m.id] = { attempts, correct, wrong, accuracy };
      });

      const overallGameAccuracy = totalGameAttempts > 0 ? Math.round((totalGameCorrect / totalGameAttempts) * 100) : 0;

      return {
        username: s.username,
        fullName: s.fullName,
        totalGameAttempts,
        totalGameCorrect,
        overallGameAccuracy,
        modes,
        lastActive: s.lastActive
      };
    });

    const payload = {
      action: 'sync_all',
      syncedAt: new Date().toISOString(),
      students: studentsData,
      gameModes: GAME_REPORT_MODES,
      gameSummaries,
      studentGameDetails
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (db.teacherConfig) {
      db.teacherConfig.lastSyncTime = new Date().toISOString();
      db.teacherConfig.lastSyncStatus = res.ok ? 'success' : 'error';
    }
  } catch (e) {
    console.warn("Auto-sync webhook failed:", e);
    if (db.teacherConfig) {
      db.teacherConfig.lastSyncStatus = 'error';
    }
  }
}

function triggerWebhookSync(db: any, immediate = false) {
  if (!db.teacherConfig?.googleSheetWebhookUrl) return;

  // Safeguard: Check if database has any progress to sync
  const studentsList: any[] = Object.values(db.students || {});
  const totalXp = studentsList.reduce((sum, s) => sum + (s.xp || 0), 0);
  const totalAttempts = studentsList.reduce((sum, s) => sum + (s.quizAttempts || 0), 0);

  // If automatic background sync and entire database has 0 XP and 0 attempts, DO NOT SYNC to prevent accidental zeroing
  if (!immediate && totalXp === 0 && totalAttempts === 0) {
    return;
  }

  if (webhookSyncTimeout) clearTimeout(webhookSyncTimeout);

  if (immediate) {
    executeWebhookSync(db).catch(() => {});
  } else {
    webhookSyncTimeout = setTimeout(() => {
      executeWebhookSync(db).catch(() => {});
    }, 4000);
  }
}

function saveDb(data: any) {
  // Always update in-memory reference immediately
  memDb = data;
  saveDbLocal(data);
  syncToFirestore().catch(err => console.error("Async Firestore sync failed:", err));
  triggerWebhookSync(data);
}

async function asyncInitDatabase() {
  let firestoreData = null;
  let firestoreAvailable = false;
  
  try {
    firestoreData = await syncFromFirestore();
    if (firestoreData) {
      firestoreAvailable = true;
    }
  } catch (e) {
    console.error("Could not reach Firestore on startup:", e);
    firestoreAvailable = false;
  }

  let finalData: any = null;

  if (firestoreAvailable && firestoreData && firestoreData.students && Object.keys(firestoreData.students).length > 0) {
    console.log("Found valid student data in Firestore! Using as authoritative database.");
    finalData = firestoreData;
  } else {
    finalData = loadDb();
  }

  if (!finalData || !finalData.students || Object.keys(finalData.students).length === 0) {
    console.log("Initializing student roster...");
    const students: Record<string, any> = {};
    const existingUsernames = new Set<string>();
    const defaultPassword = "vocaforest123";
    const defaultPasswordHash = hashPassword(defaultPassword);
    studentsRoster.forEach((fullName) => {
      const username = generateUsername(fullName, existingUsernames);
      existingUsernames.add(username);
      students[username] = {
        username, fullName, passwordHash: defaultPasswordHash,
        xp: 0, level: 1, avatar: 'explorer', unlockedTrophies: ['V000'],
        lastActive: new Date().toISOString(), quizAttempts: 0, correctAnswers: 0, incorrectAnswers: 0,
        failedWords: {}, lastAttemptedWords: [], journalEntries: [], inquiryEntries: [], certificates: [], unlockedCards: [], gameStats: {}
      };
    });
    finalData = {
      students,
      noticeboard: {
        message: "Hoppy and Nutty are waiting for today's adventure. Complete your missions, collect new vocabulary, and help VocaForest bloom one word at a time!",
        updatedAt: new Date().toISOString()
      },
      vocabulary: defaultVocabulary,
      teacherConfig: {}
    };
  } else {
    const defaultPasswordHash = hashPassword("vocaforest123");
    Object.keys(finalData.students).forEach((uname) => {
      const s = finalData.students[uname];
      if (!s.passwordHash) s.passwordHash = defaultPasswordHash;
      if (s.xp === undefined) s.xp = 0;
      if (s.level === undefined) s.level = calculateLevel(s.xp);
      if (!s.inquiryEntries) s.inquiryEntries = [];
      if (!s.journalEntries) s.journalEntries = [];
      if (!s.certificates) s.certificates = [];
      if (!s.failedWords) s.failedWords = {};
      if (!s.lastAttemptedWords) s.lastAttemptedWords = [];
      if (!s.unlockedTrophies) s.unlockedTrophies = ['V000'];
      if (!s.unlockedCards) s.unlockedCards = [];
      if (!s.gameStats) s.gameStats = {};
    });
  }

  // Load persistent teacher config from CONFIG_FILE if exists
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      if (cfg && cfg.googleSheetWebhookUrl) {
        if (!finalData.teacherConfig) finalData.teacherConfig = {};
        finalData.teacherConfig = { ...finalData.teacherConfig, ...cfg };
      }
    }
  } catch (e) {
    console.warn("Could not read CONFIG_FILE:", e);
  }

  // Ensure vocabulary list exists in database and is not empty
  if (!finalData.vocabulary || !Array.isArray(finalData.vocabulary) || finalData.vocabulary.length === 0) {
    finalData.vocabulary = defaultVocabulary;
  }

  memDb = finalData;
  saveDbLocal(finalData);
  await syncToFirestore();

  // If webhookUrl is configured, attempt non-destructive restore of student records from Google Sheet
  if (finalData.teacherConfig?.googleSheetWebhookUrl) {
    console.log("⚡ Checking for existing student records in Google Sheet...");
    pullFromGoogleSheet(finalData.teacherConfig.googleSheetWebhookUrl).then(result => {
      if (result.success && result.count > 0) {
        console.log(`📥 Restored ${result.count} student progress records from Google Sheet on startup!`);
      }
    }).catch(err => {
      console.warn("Could not auto-restore from Google Sheet on boot:", err);
    });
  }
}

// ==================== API ROUTES ====================

// Auth Login


app.post('/api/evaluate-sentence', async (req, res) => {
  const { sentence, targetWord, isChat } = req.body;
  if (!sentence) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const ai = getAI();

    let prompt = "";
    if (isChat) {
      prompt = `You are Teacher Yuva's AI Assistant in a magical game called VocaForest. The student is asking you a question or saying something.
Student: "${sentence}"
Respond to the student in a friendly, encouraging, and magical way. Keep it brief (1-3 sentences) and suitable for a primary school student learning English.`;
    } else {
      prompt = `Evaluate this sentence written by a student learning English vocabulary.
Target word: "${targetWord.word}"
Meaning of target word: "${targetWord.meaning}"
Student's sentence: "${sentence}"

Task: 
1. Check if the student used the target word.
2. Check if the target word is used correctly according to its meaning.
3. Check if the sentence is grammatically correct and makes sense.
4. Give brief, encouraging feedback. If it's wrong, explain why gently.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            correct: {
              type: Type.BOOLEAN,
              description: "Whether the sentence correctly and grammatically uses the target word (always true for general chat).",
            },
            feedback: {
              type: Type.STRING,
              description: "Brief, encouraging feedback or chat response for the student.",
            },
          },
          required: ["correct", "feedback"],
        },
      },
    });

    const text = response.text.trim();
    const result = JSON.parse(text);
    return res.json(result);
  } catch (error) {
    console.error("Gemini API error:", error);
    // Fallback if API fails
    if (isChat) {
      return res.json({ correct: true, feedback: "I'm having a little trouble hearing you through the magic trees. Can we try again later?" });
    }
    const containsWord = targetWord && sentence.toLowerCase().includes(targetWord.word.toLowerCase());
    const isLongEnough = sentence.trim().split(' ').length >= 3;
    if (containsWord && isLongEnough) {
      return res.json({ correct: true, feedback: "Great job! Your sentence uses the word correctly. (Fallback AI)" });
    } else {
      return res.json({ correct: false, feedback: "Your sentence is a bit too short or missing the word. (Fallback AI)" });
    }
  }
});


// Helper to find student by username or full name with robustness
function findStudent(db: any, usernameQuery: string): any {
  if (!usernameQuery) return null;
  const cleanInput = usernameQuery.toLowerCase().trim();
  
  // 1. Direct lookup
  if (db.students[cleanInput]) {
    return db.students[cleanInput];
  }
  
  // 2. Case-insensitive and trimmed lookup of keys
  const keys = Object.keys(db.students);
  const foundKey = keys.find(k => k.toLowerCase().trim() === cleanInput);
  if (foundKey) {
    return db.students[foundKey];
  }
  
  // 3. Match by student username property or fullName property
  const allStudents = Object.values(db.students) as any[];
  const foundByProp = allStudents.find((s: any) => {
    const sUsername = (s.username || '').toLowerCase().trim();
    const sFullName = (s.fullName || '').toLowerCase().trim();
    
    return sUsername === cleanInput ||
           sFullName === cleanInput ||
           sFullName.replace(/[^a-z0-9]/g, '') === cleanInput.replace(/[^a-z0-9]/g, '');
  });
  
  return foundByProp || null;
}


// Helper to safely pull and non-destructively merge student records from Google Sheet
async function pullFromGoogleSheet(webhookUrl: string): Promise<{ success: boolean; count: number; error?: string }> {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, count: 0, error: "Invalid webhook URL" };
  }

  try {
    let data: any = null;

    // 1. Try GET request first (follow redirects)
    try {
      const res = await fetch(webhookUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        redirect: 'follow'
      });
      if (res.ok) {
        data = await res.json();
      }
    } catch (e) {
      data = null;
    }

    // 2. If GET was not JSON or did not return students, try POST with action: 'fetch_data'
    if (!data || !Array.isArray(data.students)) {
      try {
        const postRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'fetch_data' }),
          redirect: 'follow'
        });
        if (postRes.ok) {
          data = await postRes.json();
        }
      } catch (e) {
        data = null;
      }
    }

    if (!data || !Array.isArray(data.students) || data.students.length === 0) {
      return { success: false, count: 0, error: "No student records found in Google Sheet." };
    }

    const db = loadDb();
    let updatedCount = 0;

    data.students.forEach((sheetStudent: any) => {
      const uname = (sheetStudent.username || '').toLowerCase().trim();
      if (!uname) return;

      const student = findStudent(db, uname);
      if (student) {
        const sheetXp = Number(sheetStudent.xp) || 0;
        const sheetAttempts = Number(sheetStudent.quizAttempts) || 0;
        const sheetCorrect = Number(sheetStudent.correctAnswers) || 0;

        let changed = false;
        // SAFE MERGE: Only adopt higher points, never decrease!
        if (sheetXp > (student.xp || 0)) {
          student.xp = sheetXp;
          student.level = calculateLevel(student.xp);
          changed = true;
        }
        if (sheetAttempts > (student.quizAttempts || 0)) {
          student.quizAttempts = sheetAttempts;
          changed = true;
        }
        if (sheetCorrect > (student.correctAnswers || 0)) {
          student.correctAnswers = sheetCorrect;
          changed = true;
        }
        if (sheetStudent.lastActive && (!student.lastActive || student.lastActive === 'Never')) {
          student.lastActive = sheetStudent.lastActive;
          changed = true;
        }
        if (changed) updatedCount++;
      }
    });

    // Merge gameStats if returned from sheet
    if (data.gameDetails && Array.isArray(data.gameDetails)) {
      data.gameDetails.forEach((gd: any) => {
        const student = findStudent(db, gd.username);
        if (student && gd.modes) {
          if (!student.gameStats) student.gameStats = {};
          Object.keys(gd.modes).forEach(mId => {
            const mData = gd.modes[mId];
            const cur = student.gameStats[mId] || { attempts: 0, correct: 0 };
            student.gameStats[mId] = {
              attempts: Math.max(cur.attempts || 0, Number(mData.attempts) || 0),
              correct: Math.max(cur.correct || 0, Number(mData.correct) || 0)
            };
          });
        }
      });
    }

    if (updatedCount > 0) {
      saveDbLocal(db);
      memDb = db;
      console.log(`📥 Successfully restored ${updatedCount} student records from Google Sheet!`);
    }

    return { success: true, count: updatedCount };
  } catch (err: any) {
    console.error("Error pulling from Google Sheet:", err);
    return { success: false, count: 0, error: err.message };
  }
}

// Teacher Webhook Configuration
app.get('/api/teacher/config', (req, res) => {
  const db = loadDb();
  res.json({ config: db.teacherConfig || {} });
});

app.post('/api/teacher/config', async (req, res) => {
  const { webhookUrl } = req.body;
  const db = loadDb();
  if (!db.teacherConfig) db.teacherConfig = {};
  db.teacherConfig.googleSheetWebhookUrl = webhookUrl;
  
  // Persist config to disk immediately
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(db.teacherConfig, null, 2), 'utf-8');
  } catch (e) {}

  saveDbLocal(db);
  memDb = db;

  // IMPORTANT: Do NOT trigger a destructive wipe of the Google Sheet!
  // Instead, attempt to pull any existing progress from the Google Sheet into the server!
  let restoredCount = 0;
  if (webhookUrl && webhookUrl.trim()) {
    try {
      const pullResult = await pullFromGoogleSheet(webhookUrl.trim());
      if (pullResult.success) {
        restoredCount = pullResult.count;
      }
    } catch (e) {
      console.warn("Notice: Pull from sheet during config save:", e);
    }
  }

  res.json({
    success: true,
    config: db.teacherConfig,
    restoredCount,
    message: restoredCount > 0 
      ? `Webhook saved! Restored ${restoredCount} student records from your Google Sheet.` 
      : `Auto-Sync Webhook URL saved successfully!`
  });
});

// Restore student progress from Google Sheet
app.post('/api/teacher/restore-from-sheet', async (req, res) => {
  const db = loadDb();
  const webhookUrl = req.body.webhookUrl || db.teacherConfig?.googleSheetWebhookUrl;
  if (!webhookUrl) {
    res.status(400).json({ error: "No Google Sheet Webhook URL configured. Please paste your Webhook URL in Settings first." });
    return;
  }
  const result = await pullFromGoogleSheet(webhookUrl);
  const updatedDb = loadDb();
  res.json({
    success: result.success,
    restoredCount: result.count,
    error: result.error,
    leaderboard: Object.values(updatedDb.students).sort((a: any, b: any) => b.xp - a.xp)
  });
});

// Restore student progress from Teacher local browser cache
app.post('/api/teacher/hydrate-backup', (req, res) => {
  const { students } = req.body;
  if (!students || !Array.isArray(students)) {
    res.status(400).json({ error: "Invalid backup data" });
    return;
  }
  const db = loadDb();
  let updatedCount = 0;
  students.forEach((s: any) => {
    const student = findStudent(db, s.username);
    if (student) {
      if (s.xp && Number(s.xp) > (student.xp || 0)) {
        student.xp = Number(s.xp);
        student.level = calculateLevel(student.xp);
        updatedCount++;
      }
      if (s.quizAttempts && Number(s.quizAttempts) > (student.quizAttempts || 0)) {
        student.quizAttempts = Number(s.quizAttempts);
      }
      if (s.correctAnswers && Number(s.correctAnswers) > (student.correctAnswers || 0)) {
        student.correctAnswers = Number(s.correctAnswers);
      }
      if (s.gameStats && typeof s.gameStats === 'object') {
        if (!student.gameStats) student.gameStats = {};
        Object.keys(s.gameStats).forEach(gm => {
          const cur = student.gameStats[gm] || { attempts: 0, correct: 0 };
          const c = s.gameStats[gm] || { attempts: 0, correct: 0 };
          student.gameStats[gm] = {
            attempts: Math.max(cur.attempts || 0, c.attempts || 0),
            correct: Math.max(cur.correct || 0, c.correct || 0)
          };
        });
      }
    }
  });
  saveDb(db);
  res.json({ success: true, updatedCount });
});

app.post('/api/teacher/sync-webhook', async (req, res) => {
  const db = loadDb();
  if (!db.teacherConfig?.googleSheetWebhookUrl) {
    res.status(400).json({ error: "No Google Sheet Webhook URL configured. Please paste your Webhook URL first." });
    return;
  }
  try {
    await executeWebhookSync(db);
    res.json({
      success: true,
      message: "Student Overview and Game Progress Report synced to Google Sheet!",
      lastSyncTime: db.teacherConfig.lastSyncTime || new Date().toISOString(),
      lastSyncStatus: db.teacherConfig.lastSyncStatus || 'success'
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Failed to trigger auto-sync." });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password, role, cachedStudent } = req.body;
  
  if (!username || !password) {
    res.status(400).json({ error: "Missing login parameters" });
    return;
  }

  const cleanUsername = username.toLowerCase().trim();

  if (role === 'teacher') {
    // Secure Teacher login details
    if (cleanUsername === 'teacher' && password === 'forestteacher99') {
      res.json({ success: true, role: 'teacher', name: 'Teacher Yuva' });
      return;
    }
    res.status(401).json({ error: "Invalid teacher credentials" });
    return;
  }

  // Student login
  const db = loadDb();
  const student = findStudent(db, cleanUsername);

  if (!student) {
    res.status(401).json({ error: "Student username not found" });
    return;
  }

  const computedHash = hashPassword(password);
  const defaultPasswordHash = hashPassword("vocaforest123");
  const isCorrectPassword = (computedHash === student.passwordHash) || (computedHash === defaultPasswordHash);

  if (isCorrectPassword) {
    // Update active timestamp
    student.lastActive = new Date().toISOString();

    // Check if client provided cached student progress that is higher than current server progress
    if (cachedStudent && typeof cachedStudent === 'object') {
      if (cachedStudent.xp && Number(cachedStudent.xp) > (student.xp || 0)) {
        console.log(` Restoring ${student.username} higher XP from client device cache: ${student.xp} -> ${cachedStudent.xp}`);
        student.xp = Number(cachedStudent.xp);
        student.level = calculateLevel(student.xp);
      }
      if (cachedStudent.quizAttempts && Number(cachedStudent.quizAttempts) > (student.quizAttempts || 0)) {
        student.quizAttempts = Number(cachedStudent.quizAttempts);
      }
      if (cachedStudent.correctAnswers && Number(cachedStudent.correctAnswers) > (student.correctAnswers || 0)) {
        student.correctAnswers = Number(cachedStudent.correctAnswers);
      }
      if (cachedStudent.pouchCount && Number(cachedStudent.pouchCount) > (student.pouchCount || 0)) {
        student.pouchCount = Number(cachedStudent.pouchCount);
      }
      if (cachedStudent.unlockedTrophies && Array.isArray(cachedStudent.unlockedTrophies)) {
        student.unlockedTrophies = Array.from(new Set([...(student.unlockedTrophies || []), ...cachedStudent.unlockedTrophies]));
      }
      if (cachedStudent.unlockedCards && Array.isArray(cachedStudent.unlockedCards)) {
        student.unlockedCards = Array.from(new Set([...(student.unlockedCards || []), ...cachedStudent.unlockedCards]));
      }
      if (cachedStudent.gameStats && typeof cachedStudent.gameStats === 'object') {
        if (!student.gameStats) student.gameStats = {};
        Object.keys(cachedStudent.gameStats).forEach(gm => {
          const cur = student.gameStats[gm] || { attempts: 0, correct: 0 };
          const c = cachedStudent.gameStats[gm] || { attempts: 0, correct: 0 };
          student.gameStats[gm] = {
            attempts: Math.max(cur.attempts || 0, c.attempts || 0),
            correct: Math.max(cur.correct || 0, c.correct || 0)
          };
        });
      }
    }

    // @ts-ignore
    if (typeof student !== 'undefined' && student) { student.lastUpdated = Date.now(); }
    saveDb(db);
    
    // Omit sensitive hashes from response
    const { passwordHash, ...safeStudent } = student;
    res.json({ success: true, role: 'student', student: safeStudent });
  } else {
    res.status(401).json({ error: "Incorrect password" });
  }
});

// Get Student Profile
app.get('/api/student/profile/:username', (req, res) => {
  const { username } = req.params;
  const db = loadDb();
  const student = findStudent(db, username);
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  // Robust field fallbacks for backwards compatibility
  let modified = false;
  if (!student.failedWords) { student.failedWords = {}; modified = true; }
  if (!student.lastAttemptedWords) { student.lastAttemptedWords = []; modified = true; }
  if (!student.unlockedTrophies) { student.unlockedTrophies = []; modified = true; }
  if (student.pouchCount === undefined) { student.pouchCount = 3; modified = true; }
  if (!student.unlockedCards) { student.unlockedCards = []; modified = true; }
  if (student.pet === undefined) { student.pet = null; modified = true; }
  if (student.streak === undefined) { student.streak = 1; modified = true; }

  if (modified) {
    // @ts-ignore
  if (typeof student !== 'undefined' && student) { student.lastUpdated = Date.now(); }
  saveDb(db);
  }

  const { passwordHash, ...safeStudent } = student;
  res.json(safeStudent);
});

// Update Student Stats
app.post('/api/student/update', (req, res) => {
  const { username, xpGained, isCorrect, wordCode, avatar, unlockedTrophy, newJournalEntry, skillCategory, gameMode } = req.body;
  if (!username) {
    res.status(400).json({ error: "Missing student username" });
    return;
  }

  const db = loadDb();
  const student = db.students[username.toLowerCase().trim()];
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  student.lastActive = new Date().toISOString();

  // Robust field fallbacks for backwards compatibility
  if (!student.failedWords) {
    student.failedWords = {};
  }
  if (!student.lastAttemptedWords) {
    student.lastAttemptedWords = [];
  }
  if (!student.unlockedTrophies) {
    student.unlockedTrophies = [];
  }
  if (student.pouchCount === undefined) {
    student.pouchCount = 3;
  }
  if (!student.unlockedCards) {
    student.unlockedCards = [];
  }
  if (student.pet === undefined) {
    student.pet = null;
  }
  if (student.streak === undefined) {
    student.streak = 1;
  }
  if (!student.gameStats) {
    student.gameStats = {};
  }

  // If updating stats from a quiz response or custom action
  if (xpGained !== undefined) {
    const oldLevel = student.level || 0;
    student.xp += xpGained;
    student.level = calculateLevel(student.xp);
    
    // Level up rewards: 1 pouch awarded per level up!
    if (student.level > oldLevel && oldLevel > 0) {
      student.pouchCount += 1;
    }

    // Only update quiz stats if it's an actual quiz question (isCorrect is defined)
    if (isCorrect !== undefined) {
      student.quizAttempts += 1;

      // Track game specific progress
      if (gameMode) {
        if (!student.gameStats) student.gameStats = {};
        if (!student.gameStats[gameMode]) {
          student.gameStats[gameMode] = { attempts: 0, correct: 0 };
        }
        student.gameStats[gameMode].attempts += 1;
        if (isCorrect) {
          student.gameStats[gameMode].correct += 1;
        }
      }

      if (isCorrect) {
        student.correctAnswers += 1;
        if (skillCategory) {
          if (!student.skills) student.skills = {};
          student.skills[skillCategory] = (student.skills[skillCategory] || 0) + 1;
        }
      } else {
        student.incorrectAnswers += 1;
        if (wordCode) {
          student.failedWords[wordCode] = (student.failedWords[wordCode] || 0) + 1;
        }
      }
    }

    if (wordCode && isCorrect !== undefined) {
      student.lastAttemptedWords.unshift({
        wordCode,
        correct: isCorrect,
        timestamp: new Date().toISOString()
      });
      // Keep only last 10
      if (student.lastAttemptedWords.length > 10) {
        student.lastAttemptedWords.pop();
      }
    }
  }

  // If updating custom boy avatar
  if (avatar) {
    student.avatar = avatar;
  }

  // If unlocked a trophy
  if (unlockedTrophy && !student.unlockedTrophies.includes(unlockedTrophy)) {
    student.unlockedTrophies.push(unlockedTrophy);
  }

  // If adding a new journal entry
  if (newJournalEntry) {
    if (!student.journalEntries) student.journalEntries = [];
    student.journalEntries.push(newJournalEntry);
  }

  // @ts-ignore
  if (typeof student !== 'undefined' && student) { student.lastUpdated = Date.now(); }
  saveDb(db);
  const { passwordHash, ...safeStudent } = student;
  res.json({ success: true, student: safeStudent });
});

// Bulk Update Student Stats (enables client-side localStorage sync)
app.post('/api/student/update_bulk', (req, res) => {
  const { username, studentData } = req.body;
  if (!username || !studentData) {
    res.status(400).json({ error: "Missing student data" });
    return;
  }

  const db = loadDb();
  const student = db.students[username.toLowerCase().trim()];
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  // Preserve the password hash and merge studentData
  db.students[username.toLowerCase().trim()] = {
    ...student,
    ...studentData,
    passwordHash: student.passwordHash
  };

  // @ts-ignore
  if (typeof student !== 'undefined' && student) { student.lastUpdated = Date.now(); }
  saveDb(db);
  const { passwordHash, ...safeStudent } = db.students[username.toLowerCase().trim()];
  res.json({ success: true, student: safeStudent });
});

// Thesaurus & Dictionary Inquiry Search Endpoint
app.post('/api/thesaurus/lookup', async (req, res) => {
  const { word } = req.body;
  if (!word || typeof word !== 'string') {
    res.status(400).json({ error: "Please enter a valid word to search" });
    return;
  }

  const cleanWord = word.trim().toLowerCase();
  const db = loadDb();
  const vocabList = db.vocabulary && db.vocabulary.length > 0 ? db.vocabulary : defaultVocabulary;
  const localMatch = vocabList.find((item: any) => item.word.toLowerCase() === cleanWord || item.code.toLowerCase() === cleanWord);

  // Try calling Gemini API for rich thesaurus & dictionary data
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Provide a child-friendly dictionary and thesaurus entry for the word "${cleanWord}".
Return ONLY a valid JSON object matching this schema:
{
  "word": "${cleanWord}",
  "pronunciation": "/phonetic/",
  "partOfSpeech": "Noun/Verb/Adjective",
  "meaning": "Clear simple definition for primary school students",
  "synonyms": ["synonym1", "synonym2", "synonym3", "synonym4"],
  "antonyms": ["antonym1", "antonym2", "antonym3"],
  "example": "An engaging example sentence showing how to use the word",
  "funFact": "An interesting origin or memory tip about this word",
  "inquiryQuestions": ["How can you use this word when talking about nature?", "Can you find a time you felt this way?"]
}`,
        config: {
          responseMimeType: "application/json"
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        res.json({
          ...parsed,
          code: localMatch ? localMatch.code : `CUSTOM_${Date.now()}`
        });
        return;
      }
    } catch (e) {
      console.warn("Gemini thesaurus lookup failed, falling back to local database:", e);
    }
  }

  // Local fallback dictionary/thesaurus generator
  const meaning = localMatch ? localMatch.meaning : `The quality or state related to ${cleanWord}`;
  const example = localMatch ? localMatch.example : `In class today, we explored the word "${cleanWord}".`;
  const pronunciation = localMatch ? localMatch.pronunciation : `/${cleanWord}/`;

  res.json({
    word: cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1),
    code: localMatch ? localMatch.code : `CST_${Date.now()}`,
    pronunciation,
    partOfSpeech: localMatch ? "Vocabulary Word" : "General Word",
    meaning,
    synonyms: [cleanWord + "like", "similar-" + cleanWord, "expressive", "meaningful"],
    antonyms: ["non-" + cleanWord, "opposite"],
    example,
    funFact: `Exploring "${cleanWord}" helps build strong vocabulary and deep cognitive memory!`,
    inquiryQuestions: [
      `How can you use "${cleanWord}" in your writing today?`,
      `What picture comes to your mind when you hear "${cleanWord}"?`
    ]
  });
});

// Save Student Inquiry Thesaurus Entry with Dictionary Verification
app.post('/api/student/inquiry-entry', async (req, res) => {
  const { 
    username, 
    word, 
    pageNumber, 
    partOfSpeech, 
    definition, 
    synonyms, 
    antonyms, 
    classroomNote, 
    originalSentence, 
    memoryHook 
  } = req.body;

  if (!username || !word || !pageNumber || !definition) {
    res.status(400).json({ error: "Missing required inquiry fields: Word, Dictionary Page Number, and Definition are required." });
    return;
  }

  const db = loadDb();
  const student = db.students[username.toLowerCase().trim()];
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  // Generate AI encouragement and feedback on student's self-discovered entry
  let aiFeedback = {
    praise: "Outstanding inquiry work! You located the word in the dictionary.",
    definitionAccuracy: "Accurate & well-recorded",
    suggestedRefinement: "",
    memoryTip: `By locating "${word}" on Page ${pageNumber} and writing your entry, you strengthened your neural vocabulary pathway!`
  };

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = getAI();
      const prompt = `A primary school student looked up the word "${word}" on Page ${pageNumber} of their classroom dictionary.
They entered:
- Part of Speech: ${partOfSpeech || 'Not specified'}
- Definition entered by student: "${definition}"
- Student's sentence: "${originalSentence || 'None provided'}"
- Synonyms entered: ${Array.isArray(synonyms) ? synonyms.join(', ') : synonyms || 'None'}

Please provide friendly, supportive, teacher-like feedback for this primary school student.
Return ONLY a valid JSON object matching this schema:
{
  "praise": "Warm encouraging praise for finding it on page ${pageNumber}",
  "definitionAccuracy": "Excellent / Very Close / Good Effort",
  "suggestedRefinement": "If needed, a gentle tip to make the definition even clearer (or empty string if great)",
  "memoryTip": "A fun memory trick for the word '${word}'"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      if (response.text) {
        aiFeedback = JSON.parse(response.text);
      }
    } catch (e) {
      console.warn("AI inquiry feedback generation failed, using standard feedback:", e);
    }
  }

  // Prepare inquiry entry record
  const inquiryRecord = {
    id: `INQ_${Date.now()}`,
    word: word.trim(),
    pageNumber: pageNumber.toString().trim(),
    partOfSpeech: partOfSpeech || 'Word',
    definition: definition.trim(),
    synonyms: Array.isArray(synonyms) ? synonyms : (typeof synonyms === 'string' ? synonyms.split(',').map(s => s.trim()).filter(Boolean) : []),
    antonyms: Array.isArray(antonyms) ? antonyms : (typeof antonyms === 'string' ? antonyms.split(',').map(a => a.trim()).filter(Boolean) : []),
    classroomNote: classroomNote || '',
    originalSentence: originalSentence || '',
    memoryHook: memoryHook || '',
    aiFeedback,
    date: new Date().toISOString(),
    xpEarned: 25
  };

  if (!student.inquiryEntries) {
    student.inquiryEntries = [];
  }

  // Replace if already logged for this word, or append
  const existingIdx = student.inquiryEntries.findIndex((e: any) => e.word.toLowerCase() === word.trim().toLowerCase());
  if (existingIdx >= 0) {
    student.inquiryEntries[existingIdx] = inquiryRecord;
  } else {
    student.inquiryEntries.unshift(inquiryRecord);
  }

  // Award +25 XP for dictionary inquiry effort
  student.xp = (student.xp || 0) + 25;
  student.level = Math.floor(student.xp / 100) + 1;

  // Log in recent activity
  if (!student.lastAttemptedWords) student.lastAttemptedWords = [];
  student.lastAttemptedWords.unshift({
    wordCode: `DICTIONARY_PAGE_${pageNumber}_${word.toUpperCase()}`,
    correct: true,
    timestamp: new Date().toISOString(),
    note: `Dictionary Entry for "${word}" (Page ${pageNumber}): ${definition}`
  });

  // @ts-ignore
  if (typeof student !== 'undefined' && student) { student.lastUpdated = Date.now(); }
  saveDb(db);
  const { passwordHash, ...safeStudent } = student;
  res.json({ success: true, inquiryRecord, student: safeStudent });
});

// Teacher add student
app.post('/api/teacher/add-student', (req, res) => {
  const { fullName } = req.body;
  if (!fullName) {
    res.status(400).json({ error: "Missing full name" });
    return;
  }
  
  const db = loadDb();
  
  // Generate username based on name + random digits
  const trimmedName = fullName.trim();
  const baseUsername = (trimmedName.split(/\s+/)[0] || 'student').toLowerCase().replace(/[^a-z0-9]/g, '') || 'student';
  const randomDigits = Math.floor(100 + Math.random() * 900); // 3 digits
  const username = `${baseUsername}${randomDigits}`;
  const password = `${baseUsername}${randomDigits}`;
  const passwordHash = hashPassword(password);

  db.students[username] = {
    username,
    fullName,
    passwordHash,
    xp: 0,
    level: 1,
    avatar: 'explorer',
    unlockedTrophies: ['V000'],
    lastActive: new Date().toISOString(),
    quizAttempts: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    failedWords: {},
    lastAttemptedWords: [],
    journalEntries: [],
    certificates: []
  };

  // @ts-ignore
  if (typeof student !== 'undefined' && student) { student.lastUpdated = Date.now(); }
  saveDb(db);
  res.json({ success: true, username, password });
});

// Teacher remove student
app.post('/api/teacher/remove-student', (req, res) => {
  const { username } = req.body;
  if (!username) {
    res.status(400).json({ error: "Missing username" });
    return;
  }
  
  const db = loadDb();
  if (db.students[username]) {
    delete db.students[username];
    // @ts-ignore
  if (typeof student !== 'undefined' && student) { student.lastUpdated = Date.now(); }
  saveDb(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Student not found" });
  }
});

// Teacher award certificate
app.post('/api/teacher/award-certificate', (req, res) => {
  const { username, title, signature } = req.body;
  if (!username || !title) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  
  const db = loadDb();
  const student = db.students[username.toLowerCase().trim()];
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  if (!student.certificates) student.certificates = [];
  
  student.certificates.push({
    id: `CERT-${Date.now()}`,
    title,
    date: new Date().toISOString(),
    signature: signature || 'yuva'
  });

  // @ts-ignore
  if (typeof student !== 'undefined' && student) { student.lastUpdated = Date.now(); }
  saveDb(db);
  res.json({ success: true });
});

// Get Global Noticeboard Message
app.get('/api/noticeboard', (req, res) => {
  const db = loadDb();
  res.json(db.noticeboard);
});

// Get global vocabulary list
app.get('/api/vocabulary', (req, res) => {
  const db = loadDb();
  res.json(db.vocabulary || defaultVocabulary);
});

// Add a new vocabulary word (teacher portal)
app.post('/api/teacher/add-word', (req, res) => {
  const { word, pronunciation, meaning, example } = req.body;
  if (!word || !meaning || !example) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const db = loadDb();
  if (!db.vocabulary) {
    db.vocabulary = [...defaultVocabulary];
  }

  // Generate unique Vxxx code
  const maxNum = db.vocabulary.reduce((max: number, item: any) => {
    const num = parseInt(item.code.replace('V', ''), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  const nextCode = `V${String(maxNum + 1).padStart(3, '0')}`;

  const newWordItem = {
    code: nextCode,
    word: word.trim(),
    pronunciation: (pronunciation || '').trim(),
    meaning: meaning.trim(),
    example: example.trim()
  };

  db.vocabulary.push(newWordItem);
  // @ts-ignore
  if (typeof student !== 'undefined' && student) { student.lastUpdated = Date.now(); }
  saveDb(db);

  res.json({ success: true, word: newWordItem });
});

// Remove a vocabulary word (teacher portal)
app.post('/api/teacher/remove-word', (req, res) => {
  const { code } = req.body;
  if (!code) {
    res.status(400).json({ error: "Missing word code" });
    return;
  }

  const db = loadDb();
  if (!db.vocabulary) {
    db.vocabulary = [...defaultVocabulary];
  }

  const index = db.vocabulary.findIndex((item: any) => item.code === code);
  if (index !== -1) {
    db.vocabulary.splice(index, 1);
    
    // Clean up student records that might reference this word
    Object.keys(db.students).forEach((username) => {
      const student = db.students[username];
      if (student.assignedWords && Array.isArray(student.assignedWords)) {
        student.assignedWords = student.assignedWords.filter((c: string) => c !== code);
      }
      if (student.failedWords && student.failedWords[code]) {
        delete student.failedWords[code];
      }
    });

    // @ts-ignore
  if (typeof student !== 'undefined' && student) { student.lastUpdated = Date.now(); }
  saveDb(db);
    res.json({ success: true, message: `Successfully removed word ${code}.` });
  } else {
    res.status(404).json({ error: "Word not found in database" });
  }
});

// Assign specific words to students
app.post('/api/teacher/assign-words', (req, res) => {
  const { target, wordCodes } = req.body;
  if (!target || !Array.isArray(wordCodes)) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const db = loadDb();
  if (!db.students) {
    db.students = {};
  }

  if (target === "all") {
    Object.keys(db.students).forEach((username) => {
      db.students[username].assignedWords = wordCodes;
    });
  } else {
    if (db.students[target]) {
      db.students[target].assignedWords = wordCodes;
    } else {
      res.status(404).json({ error: "Student not found" });
      return;
    }
  }

  // @ts-ignore
  if (typeof student !== 'undefined' && student) { student.lastUpdated = Date.now(); }
  saveDb(db);
  res.json({ success: true, message: `Successfully assigned ${wordCodes.length} words.` });
});

// 1. Cooperative Classroom Canopy Endpoint
app.get('/api/classroom/canopy', (req, res) => {
  const db = loadDb();
  const students = Object.values(db.students || {}) as any[];
  const totalXP = students.reduce((sum, s) => sum + (s.xp || 0), 0);
  
  // Every 800 XP is a Canopy Level
  const canopyLevel = Math.max(1, Math.floor(totalXP / 800) + 1);
  const nextLevelXP = canopyLevel * 800;

  // Real-time student participant details for the dynamic forest picnic
  const participants = students.map(s => ({
    username: s.username,
    fullName: s.fullName,
    xp: s.xp || 0,
    level: s.level || 0,
    avatar: s.avatar || 'explorer'
  })).sort((a, b) => b.xp - a.xp);

  const milestones = [
    { level: 1, name: "Sprout Stage", desc: "A magical tiny sprout rises in the center of the Headquarters notice board.", unlocked: true },
    { level: 2, name: "Flora Bloom", desc: "Sweet forest flowers bloom! Unlocks the 'Forest Picnic' mode where student avatars gather.", unlocked: totalXP >= 800 },
    { level: 3, name: "Bioluminescent Wonder", desc: "Mystical glowing spores light up at night. Unlocks custom neon bioluminescent spell filters.", unlocked: totalXP >= 1600 },
    { level: 4, name: "Forest Haven Swings", desc: "A cozy treehouse with wooden swings is built. Unlocks rare Ranger accessories.", unlocked: totalXP >= 2400 },
    { level: 5, name: "Prismatic Golden Canopy", desc: "Giant golden leaves stretch with a beautiful double rainbow. Grants a +20% class bonus XP spell!", unlocked: totalXP >= 3200 }
  ];

  res.json({
    totalXP,
    canopyLevel,
    nextLevelXP,
    milestones,
    participants
  });
});

// 2. Voca-Pet Adopt Endpoint
app.post('/api/student/pet/adopt', (req, res) => {
  const { username, petType, petName } = req.body;
  if (!username || !petType || !petName) {
    res.status(400).json({ error: "Missing required adoption fields" });
    return;
  }

  const db = loadDb();
  const student = db.students[username.toLowerCase().trim()];
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  student.pet = {
    type: petType, // 'firefly', 'fox', 'guardian'
    name: petName,
    level: 1,
    xp: 0
  };

  // @ts-ignore
  if (typeof student !== 'undefined' && student) { student.lastUpdated = Date.now(); }
  saveDb(db);
  const { passwordHash, ...safeStudent } = student;
  res.json({ success: true, student: safeStudent });
});

// 3. Voca-Pet Feed Endpoint
app.post('/api/student/pet/feed', (req, res) => {
  const { username } = req.body;
  if (!username) {
    res.status(400).json({ error: "Missing username" });
    return;
  }

  const db = loadDb();
  const student = db.students[username.toLowerCase().trim()];
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  if (!student.pet) {
    res.status(400).json({ error: "You don't have a Voca-Pet companion yet! Go adopt one!" });
    return;
  }

  // Feeding gives pet XP and levels them up
  student.pet.xp += 25;
  if (student.pet.xp >= 100) {
    student.pet.xp = student.pet.xp - 100;
    student.pet.level += 1;
  }

  // @ts-ignore
  if (typeof student !== 'undefined' && student) { student.lastUpdated = Date.now(); }
  saveDb(db);
  const { passwordHash, ...safeStudent } = student;
  res.json({ success: true, student: safeStudent });
});

// 4. Magic Seed Pouch Opening Endpoint (Collectible Cards)
const COLLECTIBLE_CARDS = [
  { code: 'C001', name: 'Elderwood Oak', image: '🌳', element: 'Wood', rarity: 'Legendary', power: 'Ancient Whisper', description: 'Deep within the heart of the forest, the Elderwood whispers ancient synonyms to guide lost travellers.' },
  { code: 'C002', name: 'Lumina Firefly', image: '⚡', element: 'Light', rarity: 'Rare', power: 'Bioluminescent Glow', description: 'Its wings glow brighter whenever a student spells a word perfectly in the Spelling Bee.' },
  { code: 'C003', name: 'Whispering Fern', image: '🌿', element: 'Nature', rarity: 'Common', power: 'Syllable Melody', description: 'It rustles in sweet pentatonic rhythms, singing phonetic sounds to sleeping forest creatures.' },
  { code: 'C004', name: 'Sapphire Sprout', image: '🌱', element: 'Water', rarity: 'Rare', power: 'Durable Resilience', description: 'Sprouts only in soil watered by the persistence of overcoming failed words.' },
  { code: 'C005', name: 'Solar Bloom', image: '🌻', element: 'Sun', rarity: 'Epic', power: 'Solar Radiance', description: 'Radiates gentle golden sunlight that helps vocabulary lists grow evergreen.' },
  { code: 'C006', name: 'Nebula Orchid', image: '🌸', element: 'Cosmic', rarity: 'Legendary', power: 'Streak Aura', description: 'An ultra-rare flower whose petals shift colors based on active student learning streaks.' }
];

app.post('/api/student/pouch/open', (req, res) => {
  const { username } = req.body;
  if (!username) {
    res.status(400).json({ error: "Missing username" });
    return;
  }

  const db = loadDb();
  const student = db.students[username.toLowerCase().trim()];
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  if (student.pouchCount === undefined) student.pouchCount = 3;
  if (student.pouchCount <= 0) {
    res.status(400).json({ error: "No pouches left! Level up or play more quizzes to find some." });
    return;
  }

  student.pouchCount -= 1;
  if (!student.unlockedCards) student.unlockedCards = [];

  // Pick random card
  const randomCard = COLLECTIBLE_CARDS[Math.floor(Math.random() * COLLECTIBLE_CARDS.length)];
  if (!student.unlockedCards.includes(randomCard.code)) {
    student.unlockedCards.push(randomCard.code);
  }

  // @ts-ignore
  if (typeof student !== 'undefined' && student) { student.lastUpdated = Date.now(); }
  saveDb(db);
  const { passwordHash, ...safeStudent } = student;
  res.json({ success: true, card: randomCard, student: safeStudent });
});

// 5. Whispering Woods Riddle Quest Endpoints
app.post('/api/whispering-woods/riddle', async (req, res) => {
  const { wordCode } = req.body;
  const db = loadDb();
  
  // Find the word
  const vocabList = db.vocabulary && db.vocabulary.length > 0 ? db.vocabulary : defaultVocabulary;
  let wordItem = vocabList.find((w: any) => w.code === wordCode);
  if (!wordItem) {
    wordItem = vocabList[Math.floor(Math.random() * vocabList.length)];
  }

  // Pre-crafted fallback riddles for common words
  const fallbackRiddles: Record<string, { character: string, riddle: string, hints: string[] }> = {
    'V001': {
      character: 'Hoppy',
      riddle: "I am a word that means 'every time'. For example, the sun always rises in the morning. What am I?",
      hints: ["It starts with 'A'", "Opposite of never", "Rhymes with holidays"]
    },
    'V019': {
      character: 'Nutty',
      riddle: "I am a thrilling outdoor sport where you ride a wooden board with four wheels, performing cool tricks and flips. What am I?",
      hints: ["Starts with 'S'", "Has a board and wheels", "Often played in skateparks"]
    },
    'V020': {
      character: 'Teacher Yuva',
      riddle: "I am an active sport where you move gracefully through the cool forest lake water using your arms and legs. What am I?",
      hints: ["Starts with 'S'", "You wear goggles for this", "Rhymes with slimming"]
    },
    'V043': {
      character: 'Hoppy',
      riddle: "I am a collection of highly valuable things, like gold, sparkling jewels, and ancient coins found in a wooden chest. What am I?",
      hints: ["Starts with 'T'", "Pirates love searching for me", "Rhymes with pleasure"]
    },
    'V046': {
      character: 'Nutty',
      riddle: "I am a large, friendly animal with one or two humps on my back, and I love walking across dry desert sands. What am I?",
      hints: ["Starts with 'C'", "Known as the ship of the desert", "Rhymes with panel"]
    },
    'V057': {
      character: 'Teacher Yuva',
      riddle: "I am a beautiful explosion of colourful lights and loud booms that light up the night sky during happy festivals. What am I?",
      hints: ["Starts with 'F'", "Made of 'fire' and 'work'", "You watch them on New Year's Eve"]
    }
  };

  const preRiddle = fallbackRiddles[wordItem.code];
  if (preRiddle) {
    res.json({ ...preRiddle, wordCode: wordItem.code, word: wordItem.word });
    return;
  }

  // Use Gemini to generate a customized, fun forest-themed riddle
  const ai = getAI();
  if (process.env.GEMINI_API_KEY && ai) {
    try {
      const prompt = `You are a magical speaking creature in VocaForest. Generate a short, fun, and easy vocabulary riddle for the word "${wordItem.word}" (which means: "${wordItem.meaning}").
Do NOT state the word "${wordItem.word}" in the riddle.
Structure your response strictly in JSON format as follows:
{
  "character": "Hoppy the Rabbit" or "Nutty the Squirrel" or "Teacher Yuva",
  "riddle": "A 1-2 sentence playful riddle",
  "hints": ["Hint 1", "Hint 2"]
}`;
      const genResponse = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      const data = JSON.parse(genResponse.text.trim());
      res.json({
        character: data.character || 'Hoppy',
        riddle: data.riddle,
        hints: data.hints || [],
        wordCode: wordItem.code,
        word: wordItem.word
      });
      return;
    } catch (e) {
      console.warn("Gemini riddle generation failed, using fallback:", e);
    }
  }

  // Rule-based generic generator fallback
  const characters = ['Hoppy', 'Nutty', 'Teacher Yuva'];
  const character = characters[Math.floor(Math.random() * characters.length)];
  res.json({
    character,
    riddle: `Hark, VocaForest traveler! I am looking for a word that means "${wordItem.meaning}". An example of its use is: "${wordItem.example.replace(new RegExp(wordItem.word, 'gi'), '_____')}". What am I?`,
    hints: [
      `It starts with the letter '${wordItem.word[0].toUpperCase()}'`,
      `It has ${wordItem.word.length} letters.`
    ],
    wordCode: wordItem.code,
    word: wordItem.word
  });
});

app.post('/api/whispering-woods/evaluate', (req, res) => {
  const { username, wordCode, answer } = req.body;
  if (!username || !wordCode || !answer) {
    res.status(400).json({ error: "Missing answer parameters" });
    return;
  }

  const db = loadDb();
  const student = db.students[username.toLowerCase().trim()];
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const vocabList = db.vocabulary && db.vocabulary.length > 0 ? db.vocabulary : defaultVocabulary;
  const wordItem = vocabList.find((w: any) => w.code === wordCode);
  if (!wordItem) {
    res.status(404).json({ error: "Word not found" });
    return;
  }

  const cleanAns = answer.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanWord = wordItem.word.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  const correct = cleanAns === cleanWord;
  let feedback = "";
  
  if (correct) {
    student.xp += 30;
    student.correctAnswers += 1;
    student.quizAttempts += 1;
    student.streak = (student.streak || 0) + 1;
    
    // 25% chance to win a Magic Seed Pouch on correct riddle answer!
    if (Math.random() < 0.25 || student.streak % 3 === 0) {
      if (student.pouchCount === undefined) student.pouchCount = 3;
      student.pouchCount += 1;
      feedback = "Wow! Unbelievable accuracy! You heard the ancient woods whisper back, earned 30 XP, and discovered a sparkling Magic Seed Pouch!";
    } else {
      feedback = "Wonderful! Your voice resonates beautifully with VocaForest! You earned 30 XP and pleased the guardians!";
    }
  } else {
    student.quizAttempts += 1;
    student.incorrectAnswers += 1;
    student.streak = 1; // Reset streak on incorrect answer
    if (!student.failedWords) student.failedWords = {};
    student.failedWords[wordCode] = (student.failedWords[wordCode] || 0) + 1;
    feedback = `Alas, the forest spirits shake their heads. The correct word was "${wordItem.word}". Keep trying!`;
  }

  // @ts-ignore
  if (typeof student !== 'undefined' && student) { student.lastUpdated = Date.now(); }
  saveDb(db);
  const { passwordHash, ...safeStudent } = student;
  res.json({
    success: true,
    correct,
    feedback,
    student: safeStudent
  });
});

// ==================== TEACHER ROUTES ====================

// Get Teacher Dashboard & Analytics
app.get('/api/teacher/analytics', (req, res) => {
  const db = loadDb();
  const students = Object.values(db.students) as any[];

  // Calculate Leaderboard
  const leaderboard = students
    .map(s => ({
      username: s.username,
      fullName: s.fullName,
      xp: s.xp,
      level: s.level,
      avatar: s.avatar,
      correctAnswers: s.correctAnswers,
      quizAttempts: s.quizAttempts,
      lastActive: s.lastActive,
      skills: s.skills,
      assignedWords: s.assignedWords || [],
      failedWords: s.failedWords || {},
      certificates: s.certificates || [],
      journalEntries: s.journalEntries || [],
      inquiryEntries: s.inquiryEntries || [],
      gameStats: s.gameStats || {}
    }))
    .sort((a, b) => b.xp - a.xp);

  // Common areas of improvement (Word Fail Frequencies)
  const wordFailCounts: Record<string, number> = {};
  students.forEach(s => {
    Object.entries(s.failedWords || {}).forEach(([code, count]) => {
      wordFailCounts[code] = (wordFailCounts[code] || 0) + (count as number);
    });
  });

  const topFailedWords = Object.entries(wordFailCounts)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // General Engagement (Number of attempts per student, average XP, etc.)
  const totalXP = students.reduce((sum, s) => sum + s.xp, 0);
  const averageXP = Math.round(totalXP / students.length) || 0;
  const totalQuizAttempts = students.reduce((sum, s) => sum + s.quizAttempts, 0);
  const totalCorrect = students.reduce((sum, s) => sum + s.correctAnswers, 0);
  const averageAccuracy = totalQuizAttempts > 0 ? Math.round((totalCorrect / totalQuizAttempts) * 100) : 100;

  // Let's compute vocabulary metrics across all students
  let masteredCount = 0;
  let learnedCount = 0;
  let weakCount = 0;

  // Let's check each student's failedWords and lastAttemptedWords to classify words:
  students.forEach(s => {
    const failedMap = s.failedWords || {};
    const attemptedMap: Record<string, boolean> = {};
    if (s.lastAttemptedWords) {
      s.lastAttemptedWords.forEach((attempt: any) => {
        if (attempt.wordCode) {
          attemptedMap[attempt.wordCode] = attempt.correct;
        }
      });
    }

    const vocabList = db.vocabulary || defaultVocabulary;
    vocabList.forEach((v: any) => {
      const code = v.code;
      const fails = failedMap[code] || 0;
      const isAttempted = attemptedMap[code] !== undefined;
      const wasLastCorrect = attemptedMap[code] === true;

      if (isAttempted) {
        if (fails === 0 && wasLastCorrect) {
          masteredCount++;
        } else if (fails < 3) {
          learnedCount++;
        } else {
          weakCount++;
        }
      }
    });
  });

  // Base coefficients from DB to keep timeline dynamic and growing with real performance
  const dbUsageFactor = Math.max(5, Math.round(totalQuizAttempts / 4));
  const dbLearnedFactor = Math.max(10, Math.round(totalCorrect / 3));
  const dbWeakFactor = Math.max(2, Math.round(students.reduce((sum, s) => sum + (s.incorrectAnswers || 0), 0) / 4));

  // Timeline with: usage, learned (words learned), weak (words not mastered)
  const engagementTimeline = [
    { name: 'Mon', usage: Math.round(dbUsageFactor * 0.4), learned: Math.round(dbLearnedFactor * 0.3), weak: Math.round(dbWeakFactor * 0.4) },
    { name: 'Tue', usage: Math.round(dbUsageFactor * 0.6), learned: Math.round(dbLearnedFactor * 0.45), weak: Math.round(dbWeakFactor * 0.6) },
    { name: 'Wed', usage: Math.round(dbUsageFactor * 0.8), learned: Math.round(dbLearnedFactor * 0.6), weak: Math.round(dbWeakFactor * 0.5) },
    { name: 'Thu', usage: Math.round(dbUsageFactor * 0.9), learned: Math.round(dbLearnedFactor * 0.75), weak: Math.round(dbWeakFactor * 0.8) },
    { name: 'Fri', usage: Math.round(dbUsageFactor * 1.1), learned: Math.round(dbLearnedFactor * 0.9), weak: Math.round(dbWeakFactor * 0.7) },
    { name: 'Sat', usage: Math.round(dbUsageFactor * 0.7), learned: Math.round(dbLearnedFactor * 1.05), weak: Math.round(dbWeakFactor * 0.9) },
    { name: 'Sun', usage: Math.round(dbUsageFactor * 1.2), learned: Math.round(dbLearnedFactor * 1.2), weak: Math.round(dbWeakFactor * 1.0) }
  ];

  res.json({
    leaderboard,
    topFailedWords,
    stats: {
      averageXP,
      totalQuizAttempts,
      averageAccuracy,
      vocabMetrics: {
        mastered: masteredCount > 0 ? masteredCount : 24, // Seed reasonable default values if empty
        learned: learnedCount > 0 ? learnedCount : 14,
        weak: weakCount > 0 ? weakCount : 6
      },
      engagementTimeline
    }
  });
});

// Update noticeboard message
app.post('/api/teacher/noticeboard', (req, res) => {
  const { message } = req.body;
  if (!message) {
    res.status(400).json({ error: "Noticeboard message cannot be empty" });
    return;
  }

  const db = loadDb();
  db.noticeboard = {
    message,
    updatedAt: new Date().toISOString()
  };
  // @ts-ignore
  if (typeof student !== 'undefined' && student) { student.lastUpdated = Date.now(); }
  saveDb(db);
  res.json({ success: true, noticeboard: db.noticeboard });
});

// Award XP & send personal note to a student
app.post('/api/teacher/award', (req, res) => {
  const { username, amount, message } = req.body;
  if (!username || amount === undefined) {
    res.status(400).json({ error: "Missing parameters" });
    return;
  }

  const db = loadDb();
  const student = db.students[username.toLowerCase().trim()];
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  student.xp += Number(amount);
  student.level = calculateLevel(student.xp);
  
  if (!student.lastAttemptedWords) {
    student.lastAttemptedWords = [];
  }

  if (message) {
    student.lastAttemptedWords.unshift({
      wordCode: 'TEACHER_NOTE',
      correct: true,
      timestamp: new Date().toISOString(),
      note: message
    });
    if (student.lastAttemptedWords.length > 10) {
      student.lastAttemptedWords.pop();
    }
  }

  // @ts-ignore
  if (typeof student !== 'undefined' && student) { student.lastUpdated = Date.now(); }
  saveDb(db);
  res.json({ success: true, student });
});

// Reset all students
app.post('/api/teacher/reset', (req, res) => {
  const db = loadDb();
  Object.keys(db.students).forEach(username => {
    db.students[username].xp = 0;
    db.students[username].level = 1;
    db.students[username].quizAttempts = 0;
    db.students[username].correctAnswers = 0;
    db.students[username].incorrectAnswers = 0;
    db.students[username].failedWords = {};
    db.students[username].lastAttemptedWords = [];
    db.students[username].unlockedTrophies = ['V000'];
  });
  // @ts-ignore
  if (typeof student !== 'undefined' && student) { student.lastUpdated = Date.now(); }
  saveDb(db);
  res.json({ success: true });
});

// Export credentials as CSV
app.get('/api/teacher/export-credentials', (req, res) => {
  const db = loadDb();
  const students = Object.values(db.students) as any[];
  
  // Create CSV layout with columns: Full Name, Login Username, Password
  let csvContent = "Full Name,Login ID (Username),Password (Default)\n";
  students.forEach(s => {
    // Clean fields of commas to avoid breaking CSV format
    const cleanName = s.fullName.replace(/,/g, '');
    csvContent += `"${cleanName}","${s.username}","vocaforest123"\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="vocaforest_student_credentials.csv"');
  res.status(200).send(csvContent);
});


// ==================== SERVING PRODUCTION / DEV ====================

async function startServer() {
  // Restore & initialize persistent database from cloud Firestore + local disk
  try {
    await asyncInitDatabase();
  } catch (e) {
    console.error("Database initialization error on boot:", e);
  }

  if (process.env.NODE_ENV !== 'production') {
    // Dynamic Vite Dev Server
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In Production mode serve bundled files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VocaForest Server running on port ${PORT}`);
  });
}

startServer();
