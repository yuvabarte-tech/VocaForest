const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const replacement = `
let memDb: any = null;
let isSyncingToFirestore = false;
let pendingFirestoreSync = false;

// Safe, authoritative in-memory state
function loadDb(): any {
  if (memDb) return memDb;
  
  // 1. Try reading primary database file
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      if (content && content.trim().length > 0) {
        return JSON.parse(content);
      }
    }
  } catch (e) {
    console.error("Error loading primary DB_FILE, attempting backup recovery...", e);
  }

  // 2. Try restoring from backup database file
  try {
    if (fs.existsSync(BACKUP_DB_FILE)) {
      const backupContent = fs.readFileSync(BACKUP_DB_FILE, 'utf-8');
      if (backupContent && backupContent.trim().length > 0) {
        console.log("Successfully restored database from backup file!");
        const backupData = JSON.parse(backupContent);
        fs.writeFileSync(DB_FILE, JSON.stringify(backupData, null, 2), 'utf-8');
        return backupData;
      }
    }
  } catch (e) {
    console.error("Error loading BACKUP_DB_FILE:", e);
  }
  return null;
}

// Async Cloud Firestore Sync Functions
async function syncFromFirestore(): Promise<any> {
  if (!firestoreDb) return null;
  try {
    const dbDocRef = doc(firestoreDb, 'vocaforest', 'main');
    const snapshot = await getDoc(dbDocRef);
    if (snapshot.exists()) {
      const remoteData = snapshot.data();
      if (remoteData && remoteData.students && Object.keys(remoteData.students).length > 0) {
        console.log("☁️ Successfully loaded persistent student progress database from Firestore!");
        return remoteData;
      }
    }
  } catch (e) {
    console.error("Error fetching persistent database from Firestore:", e);
    throw e; // Throw to distinguish between empty and unavailable
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
    await setDoc(dbDocRef, dataToWrite); // Direct overwrite, memory is the single source of truth
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
  } catch (err) {
    console.error("Error saving database locally:", err);
  }
}

let webhookSyncTimeout: NodeJS.Timeout | null = null;
function triggerWebhookSync(db: any) {
  if (!db.teacherConfig?.googleSheetWebhookUrl) return;
  const webhookUrl = db.teacherConfig.googleSheetWebhookUrl;
  if (webhookSyncTimeout) clearTimeout(webhookSyncTimeout);
  webhookSyncTimeout = setTimeout(() => {
    try {
      const studentsData = Object.values(db.students).map((s: any) => ({
        username: s.username,
        fullName: s.fullName,
        xp: s.xp,
        level: s.level,
        quizAttempts: s.quizAttempts,
        correctAnswers: s.correctAnswers,        
        lastActive: s.lastActive
      }));
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_all', students: studentsData })
      }).catch(() => {});
    } catch (e) {}
  }, 5000);
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
    firestoreAvailable = true;
  } catch (e) {
    console.error("Could not reach Firestore on startup:", e);
    firestoreAvailable = false;
  }

  let finalData: any = null;

  if (firestoreAvailable && firestoreData && firestoreData.students && Object.keys(firestoreData.students).length > 0) {
    console.log("Found valid student data in Firestore! Using as authoritative database.");
    finalData = firestoreData;
  } else {
    console.log("Firestore empty or unavailable, falling back to local disk...");
    finalData = loadDb();
  }

  if (!finalData || !finalData.students || Object.keys(finalData.students).length === 0) {
    if (firestoreAvailable) {
       console.log("No existing database found on disk AND Firestore is verifiably empty. Initializing default roster...");
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
         vocabulary: defaultVocabulary
       };
    } else {
       console.log("Firestore is unavailable and local disk is empty. Cannot determine true state. Starting with blank to prevent overwrite.");
       finalData = { students: {}, noticeboard: { message: "Welcome!", updatedAt: new Date().toISOString() }, vocabulary: defaultVocabulary }; 
    }
  } else {
    const defaultPasswordHash = hashPassword("vocaforest123");
    Object.keys(finalData.students).forEach((uname) => {
      const s = finalData.students[uname];
      if (!s.passwordHash) s.passwordHash = defaultPasswordHash;
      if (s.xp === undefined) s.xp = 0;`;

const regex = /function mergeDatabases[\s\S]*?if \(s\.xp === undefined\) s\.xp = 0;/;
if (!regex.test(code)) {
  console.log("Regex not found!");
} else {
  code = code.replace(regex, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("server.ts modified successfully.");
}
