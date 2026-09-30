/**
 * Local-First Personal Storage Engine (IndexedDB) for Almanac v2.
 * Manages user courses, modules, lessons, interview plans, practice sessions,
 * bookmarks, and structured learning activities (for future streak computation).
 */

const DB_NAME = "almanac_personal_v2";
const DB_VERSION = 1;

const STORES = {
  COURSES: "courses",
  COURSE_PROGRESS: "course_progress",
  INTERVIEW_PLANS: "interview_plans",
  INTERVIEW_SESSIONS: "interview_sessions",
  USER_ACTIVITY: "user_activity",
  SAVED_NOTES: "saved_notes",
};

function openDatabase() {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Courses Store
      if (!db.objectStoreNames.contains(STORES.COURSES)) {
        const courseStore = db.createObjectStore(STORES.COURSES, { keyPath: "id" });
        courseStore.createIndex("createdAt", "createdAt", { unique: false });
        courseStore.createIndex("topic", "topic", { unique: false });
      }

      // 2. Course Progress Store
      if (!db.objectStoreNames.contains(STORES.COURSE_PROGRESS)) {
        const progressStore = db.createObjectStore(STORES.COURSE_PROGRESS, { keyPath: "courseId" });
        progressStore.createIndex("lastAccessedAt", "lastAccessedAt", { unique: false });
      }

      // 3. Interview Plans Store
      if (!db.objectStoreNames.contains(STORES.INTERVIEW_PLANS)) {
        const interviewStore = db.createObjectStore(STORES.INTERVIEW_PLANS, { keyPath: "id" });
        interviewStore.createIndex("createdAt", "createdAt", { unique: false });
        interviewStore.createIndex("role", "role", { unique: false });
      }

      // 4. Interview Practice Sessions Store
      if (!db.objectStoreNames.contains(STORES.INTERVIEW_SESSIONS)) {
        const sessionStore = db.createObjectStore(STORES.INTERVIEW_SESSIONS, { keyPath: "id" });
        sessionStore.createIndex("planId", "planId", { unique: false });
        sessionStore.createIndex("timestamp", "timestamp", { unique: false });
      }

      // 5. User Activity Store (for future streak computation)
      if (!db.objectStoreNames.contains(STORES.USER_ACTIVITY)) {
        const activityStore = db.createObjectStore(STORES.USER_ACTIVITY, {
          keyPath: "id",
          autoIncrement: true,
        });
        activityStore.createIndex("timestamp", "timestamp", { unique: false });
        activityStore.createIndex("type", "type", { unique: false });
      }

      // 6. Saved Notes Bookmarks Store
      if (!db.objectStoreNames.contains(STORES.SAVED_NOTES)) {
        const savedStore = db.createObjectStore(STORES.SAVED_NOTES, { keyPath: "slug" });
        savedStore.createIndex("savedAt", "savedAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// -------------------------------------------------------------
// Course Operations
// -------------------------------------------------------------

export async function saveCourse(course) {
  const db = await openDatabase();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.COURSES, STORES.COURSE_PROGRESS], "readwrite");
    const courseStore = tx.objectStore(STORES.COURSES);
    const progressStore = tx.objectStore(STORES.COURSE_PROGRESS);

    const now = new Date().toISOString();
    const courseRecord = {
      ...course,
      createdAt: course.createdAt || now,
      updatedAt: now,
    };

    courseStore.put(courseRecord);

    // Initialize progress record if missing
    const getProg = progressStore.get(courseRecord.id);
    getProg.onsuccess = () => {
      if (!getProg.result) {
        progressStore.put({
          courseId: courseRecord.id,
          completedLessons: [],
          activeLessonId: courseRecord.modules?.[0]?.lessons?.[0]?.id || null,
          percentage: 0,
          lastAccessedAt: now,
        });
      }
    };

    tx.oncomplete = () => resolve(courseRecord);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCourse(courseId) {
  const db = await openDatabase();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.COURSES, "readonly");
    const store = tx.objectStore(STORES.COURSES);
    const request = store.get(courseId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllCourses() {
  const db = await openDatabase();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.COURSES, "readonly");
    const store = tx.objectStore(STORES.COURSES);
    const request = store.getAll();

    request.onsuccess = () => {
      const courses = request.result || [];
      // Sort newest first
      courses.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
      resolve(courses);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteCourse(courseId) {
  const db = await openDatabase();
  if (!db) return false;

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORES.COURSES, STORES.COURSE_PROGRESS], "readwrite");
    tx.objectStore(STORES.COURSES).delete(courseId);
    tx.objectStore(STORES.COURSE_PROGRESS).delete(courseId);

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCourseProgress(courseId) {
  const db = await openDatabase();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.COURSE_PROGRESS, "readonly");
    const store = tx.objectStore(STORES.COURSE_PROGRESS);
    const request = store.get(courseId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function markLessonComplete(courseId, lessonId) {
  const db = await openDatabase();
  if (!db) return null;

  const course = await getCourse(courseId);
  const totalLessons = course?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 1;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.COURSE_PROGRESS, "readwrite");
    const store = tx.objectStore(STORES.COURSE_PROGRESS);
    const request = store.get(courseId);

    request.onsuccess = () => {
      const current = request.result || {
        courseId,
        completedLessons: [],
        activeLessonId: lessonId,
        percentage: 0,
      };

      const set = new Set(current.completedLessons || []);
      set.add(lessonId);
      const completed = Array.from(set);
      const percentage = Math.min(100, Math.round((completed.length / totalLessons) * 100));

      const updated = {
        ...current,
        completedLessons: completed,
        percentage,
        lastAccessedAt: new Date().toISOString(),
      };

      store.put(updated);
    };

    tx.oncomplete = () => {
      logActivity("COURSE_LESSON_COMPLETED", { courseId, lessonId, courseTitle: course?.title });
      resolve(true);
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateActiveLesson(courseId, lessonId) {
  const db = await openDatabase();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.COURSE_PROGRESS, "readwrite");
    const store = tx.objectStore(STORES.COURSE_PROGRESS);
    const request = store.get(courseId);

    request.onsuccess = () => {
      const current = request.result || { courseId, completedLessons: [], percentage: 0 };
      store.put({
        ...current,
        activeLessonId: lessonId,
        lastAccessedAt: new Date().toISOString(),
      });
    };

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// -------------------------------------------------------------
// Interview Plan & Practice Session Operations
// -------------------------------------------------------------

export async function saveInterviewPlan(plan) {
  const db = await openDatabase();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.INTERVIEW_PLANS, "readwrite");
    const store = tx.objectStore(STORES.INTERVIEW_PLANS);

    const now = new Date().toISOString();
    const record = {
      ...plan,
      createdAt: plan.createdAt || now,
      updatedAt: now,
    };

    store.put(record);
    tx.oncomplete = () => resolve(record);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getInterviewPlan(planId) {
  const db = await openDatabase();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.INTERVIEW_PLANS, "readonly");
    const store = tx.objectStore(STORES.INTERVIEW_PLANS);
    const request = store.get(planId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllInterviewPlans() {
  const db = await openDatabase();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.INTERVIEW_PLANS, "readonly");
    const store = tx.objectStore(STORES.INTERVIEW_PLANS);
    const request = store.getAll();

    request.onsuccess = () => {
      const plans = request.result || [];
      plans.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
      resolve(plans);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveInterviewSession(sessionData) {
  const db = await openDatabase();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.INTERVIEW_SESSIONS, "readwrite");
    const store = tx.objectStore(STORES.INTERVIEW_SESSIONS);

    const record = {
      id: sessionData.id || `session-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...sessionData,
    };

    store.put(record);
    tx.oncomplete = () => {
      logActivity("INTERVIEW_PRACTICE", {
        planId: record.planId,
        questionId: record.questionId,
        score: record.evaluation?.score,
      });
      resolve(record);
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getInterviewSessions(planId) {
  const db = await openDatabase();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.INTERVIEW_SESSIONS, "readonly");
    const store = tx.objectStore(STORES.INTERVIEW_SESSIONS);
    const request = store.getAll();

    request.onsuccess = () => {
      const all = request.result || [];
      const filtered = planId ? all.filter((s) => s.planId === planId) : all;
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      resolve(filtered);
    };
    request.onerror = () => reject(request.error);
  });
}

export const getAllInterviewSessions = getInterviewSessions;

// -------------------------------------------------------------
// Note Bookmarks Operations
// -------------------------------------------------------------

export async function saveNoteBookmark(note) {
  const db = await openDatabase();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SAVED_NOTES, "readwrite");
    const store = tx.objectStore(STORES.SAVED_NOTES);

    const record = {
      slug: note.slug,
      title: note.title,
      category: note.category,
      categoryLabel: note.categoryLabel,
      description: note.description,
      readingTime: note.readingTime,
      difficulty: note.difficulty,
      savedAt: new Date().toISOString(),
    };

    store.put(record);
    tx.oncomplete = () => resolve(record);
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeNoteBookmark(slug) {
  const db = await openDatabase();
  if (!db) return false;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SAVED_NOTES, "readwrite");
    const store = tx.objectStore(STORES.SAVED_NOTES);
    store.delete(slug);

    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSavedNotes() {
  const db = await openDatabase();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.SAVED_NOTES, "readonly");
    const store = tx.objectStore(STORES.SAVED_NOTES);
    const request = store.getAll();

    request.onsuccess = () => {
      const notes = request.result || [];
      notes.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
      resolve(notes);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function isNoteSaved(slug) {
  const db = await openDatabase();
  if (!db) return false;

  return new Promise((resolve) => {
    const tx = db.transaction(STORES.SAVED_NOTES, "readonly");
    const store = tx.objectStore(STORES.SAVED_NOTES);
    const request = store.get(slug);

    request.onsuccess = () => resolve(!!request.result);
    request.onerror = () => resolve(false);
  });
}

// -------------------------------------------------------------
// User Activity Logging (Data Model for Future Streaks)
// -------------------------------------------------------------

export async function logActivity(type, metadata = {}) {
  const validTypes = [
    "NOTE_READ",
    "COURSE_LESSON_COMPLETED",
    "QUIZ_COMPLETED",
    "INTERVIEW_PRACTICE",
    "EXERCISE_COMPLETED",
  ];

  if (!validTypes.includes(type)) return null;

  const db = await openDatabase();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.USER_ACTIVITY, "readwrite");
      const store = tx.objectStore(STORES.USER_ACTIVITY);

      const record = {
        type,
        timestamp: new Date().toISOString(),
        metadata,
      };

      store.add(record);
      tx.oncomplete = () => resolve(record);
      tx.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function getActivityHistory(limit = 100) {
  const db = await openDatabase();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.USER_ACTIVITY, "readonly");
    const store = tx.objectStore(STORES.USER_ACTIVITY);
    const request = store.getAll();

    request.onsuccess = () => {
      const list = request.result || [];
      list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      resolve(list.slice(0, limit));
    };
    request.onerror = () => reject(request.error);
  });
}
