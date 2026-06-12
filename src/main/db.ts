import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

// Define structures
export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate: string;
  estimatedPomodoros: number;
  actualPomodoros: number;
  completed: boolean;
  createdAt: string;
}

export interface Session {
  id?: number;
  startTime: string;
  endTime: string;
  type: 'work' | 'break';
  durationSeconds: number;
  focusScore: number;
  cameraUsed: boolean;
  interrupted: boolean;
}

export interface FocusLog {
  id?: number;
  timestamp: string;
  sessionId: string;
  status: 'focused' | 'distracted' | 'absent';
  source: 'webcam' | 'activity';
}

export interface DatabaseDriver {
  init(): void;
  getTasks(): Task[];
  saveTask(task: Task): void;
  deleteTask(id: string): void;
  getSessions(): Session[];
  saveSession(session: Session): number;
  getFocusLogs(sessionId: string): FocusLog[];
  saveFocusLog(log: FocusLog): void;
  getSettings(): Record<string, string>;
  saveSetting(key: string, value: string): void;
  deleteSession(id: number): void;
  exportData(): string;
}

// Fallback JSON-based Database Driver
class JSONDatabaseDriver implements DatabaseDriver {
  private dbPath: string;
  private data: {
    tasks: Task[];
    sessions: Session[];
    focusLogs: FocusLog[];
    settings: Record<string, string>;
  } = { tasks: [], sessions: [], focusLogs: [], settings: {} };

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  init(): void {
    if (fs.existsSync(this.dbPath)) {
      try {
        const fileContent = fs.readFileSync(this.dbPath, 'utf8');
        this.data = JSON.parse(fileContent);
        // Ensure all arrays exist
        this.data.tasks = this.data.tasks || [];
        this.data.sessions = this.data.sessions || [];
        this.data.focusLogs = this.data.focusLogs || [];
        this.data.settings = this.data.settings || {};
      } catch (err) {
        console.error('Failed to load JSON database, resetting. Error:', err);
        this.save();
      }
    } else {
      this.save();
    }
  }

  private save(): void {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to save JSON database:', err);
    }
  }

  getTasks(): Task[] {
    return this.data.tasks;
  }

  saveTask(task: Task): void {
    const index = this.data.tasks.findIndex(t => t.id === task.id);
    if (index >= 0) {
      this.data.tasks[index] = task;
    } else {
      this.data.tasks.push(task);
    }
    this.save();
  }

  deleteTask(id: string): void {
    this.data.tasks = this.data.tasks.filter(t => t.id !== id);
    this.save();
  }

  getSessions(): Session[] {
    return this.data.sessions;
  }

  saveSession(session: Session): number {
    const nextId = this.data.sessions.length + 1;
    const sessionWithId = { ...session, id: nextId };
    this.data.sessions.push(sessionWithId);
    this.save();
    return nextId;
  }

  getFocusLogs(sessionId: string): FocusLog[] {
    return this.data.focusLogs.filter(f => f.sessionId === sessionId);
  }

  saveFocusLog(log: FocusLog): void {
    const nextId = this.data.focusLogs.length + 1;
    this.data.focusLogs.push({ ...log, id: nextId });
    this.save();
  }

  getSettings(): Record<string, string> {
    return this.data.settings;
  }

  saveSetting(key: string, value: string): void {
    this.data.settings[key] = value;
    this.save();
  }

  deleteSession(id: number): void {
    this.data.sessions = this.data.sessions.filter(s => s.id !== id);
    this.save();
  }

  exportData(): string {
    return JSON.stringify(this.data, null, 2);
  }
}

// Native SQLite Database Driver
class SQLiteDatabaseDriver implements DatabaseDriver {
  private dbPath: string;
  private db: any = null;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  init(): void {
    // We import dynamically to handle environments without node:sqlite
    const { DatabaseSync } = require('node:sqlite');
    this.db = new DatabaseSync(this.dbPath);

    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        priority TEXT,
        category TEXT,
        dueDate TEXT,
        estimatedPomodoros INTEGER,
        actualPomodoros INTEGER,
        completed INTEGER,
        createdAt TEXT
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        startTime TEXT,
        endTime TEXT,
        type TEXT,
        durationSeconds INTEGER,
        focusScore REAL,
        cameraUsed INTEGER,
        interrupted INTEGER
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS focus_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        sessionId TEXT,
        status TEXT,
        source TEXT
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
  }

  getTasks(): Task[] {
    const query = this.db.prepare('SELECT * FROM tasks ORDER BY createdAt DESC');
    return query.all().map((t: any) => ({
      ...t,
      completed: t.completed === 1
    }));
  }

  saveTask(task: Task): void {
    const statement = this.db.prepare(`
      INSERT INTO tasks (id, title, description, priority, category, dueDate, estimatedPomodoros, actualPomodoros, completed, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title=excluded.title,
        description=excluded.description,
        priority=excluded.priority,
        category=excluded.category,
        dueDate=excluded.dueDate,
        estimatedPomodoros=excluded.estimatedPomodoros,
        actualPomodoros=excluded.actualPomodoros,
        completed=excluded.completed
    `);
    statement.run(
      task.id,
      task.title,
      task.description,
      task.priority,
      task.category,
      task.dueDate,
      task.estimatedPomodoros,
      task.actualPomodoros,
      task.completed ? 1 : 0,
      task.createdAt
    );
  }

  deleteTask(id: string): void {
    const statement = this.db.prepare('DELETE FROM tasks WHERE id = ?');
    statement.run(id);
  }

  getSessions(): Session[] {
    const query = this.db.prepare('SELECT * FROM sessions ORDER BY id DESC');
    return query.all().map((s: any) => ({
      ...s,
      cameraUsed: s.cameraUsed === 1,
      interrupted: s.interrupted === 1
    }));
  }

  saveSession(session: Session): number {
    const statement = this.db.prepare(`
      INSERT INTO sessions (startTime, endTime, type, durationSeconds, focusScore, cameraUsed, interrupted)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = statement.run(
      session.startTime,
      session.endTime,
      session.type,
      session.durationSeconds,
      session.focusScore,
      session.cameraUsed ? 1 : 0,
      session.interrupted ? 1 : 0
    );
    return Number(result.lastInsertRowid);
  }

  getFocusLogs(sessionId: string): FocusLog[] {
    const query = this.db.prepare('SELECT * FROM focus_logs WHERE sessionId = ? ORDER BY timestamp ASC');
    return query.all(sessionId);
  }

  saveFocusLog(log: FocusLog): void {
    const statement = this.db.prepare(`
      INSERT INTO focus_logs (timestamp, sessionId, status, source)
      VALUES (?, ?, ?, ?)
    `);
    statement.run(log.timestamp, log.sessionId, log.status, log.source);
  }

  getSettings(): Record<string, string> {
    const query = this.db.prepare('SELECT * FROM settings');
    const rows = query.all();
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }

  saveSetting(key: string, value: string): void {
    const statement = this.db.prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value
    `);
    statement.run(key, value);
  }

  deleteSession(id: number): void {
    const statement = this.db.prepare('DELETE FROM sessions WHERE id = ?');
    statement.run(id);
  }

  exportData(): string {
    const data = {
      tasks: this.getTasks(),
      sessions: this.getSessions(),
      settings: this.getSettings()
    };
    return JSON.stringify(data, null, 2);
  }
}

// Initialize Active Driver
let activeDriver: DatabaseDriver;
const isDev = !app.isPackaged;
const userDataPath = isDev ? process.cwd() : app.getPath('userData');

try {
  // Test if node:sqlite can load
  const { DatabaseSync } = require('node:sqlite');
  if (typeof DatabaseSync !== 'function') throw new Error('node:sqlite not functional');
  
  const sqliteDbPath = path.join(userDataPath, 'studyflow.db');
  console.log(`🗄️ SQLite database initialized at: ${sqliteDbPath}`);
  activeDriver = new SQLiteDatabaseDriver(sqliteDbPath);
} catch (e) {
  const jsonDbPath = path.join(userDataPath, 'studyflow_db.json');
  console.warn(`⚠️ Native SQLite unavailable (using JSON fallback at ${jsonDbPath}):`, (e as Error).message);
  activeDriver = new JSONDatabaseDriver(jsonDbPath);
}

// Initialize active database tables
activeDriver.init();

export default activeDriver;
