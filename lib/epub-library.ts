export type StoredEpubBook = {
  id: string;
  title: string;
  author: string;
  fileName: string;
  size: number;
  cover: string | null;
  progress: number;
  location: string | null;
  createdAt: number;
  updatedAt: number;
  file: Blob;
};

const DB_NAME = "luna-reader";
const STORE_NAME = "books";
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("无法打开本地书库"));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("书库操作失败"));
  });
}

export async function listStoredBooks(): Promise<StoredEpubBook[]> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const books = await requestResult(transaction.objectStore(STORE_NAME).getAll() as IDBRequest<StoredEpubBook[]>);
    return books.sort((left, right) => right.updatedAt - left.updatedAt);
  } finally {
    database.close();
  }
}

export async function getStoredBook(id: string): Promise<StoredEpubBook | undefined> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readonly");
    return await requestResult(transaction.objectStore(STORE_NAME).get(id) as IDBRequest<StoredEpubBook | undefined>);
  } finally {
    database.close();
  }
}

export async function saveStoredBook(book: StoredEpubBook): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    await requestResult(transaction.objectStore(STORE_NAME).put(book));
  } finally {
    database.close();
  }
}

export async function updateStoredProgress(id: string, location: string, progress: number): Promise<void> {
  const book = await getStoredBook(id);
  if (!book) return;
  await saveStoredBook({
    ...book,
    location,
    progress: Math.min(100, Math.max(0, Math.round(progress))),
    updatedAt: Date.now(),
  });
}

export async function deleteStoredBook(id: string): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    await requestResult(transaction.objectStore(STORE_NAME).delete(id));
  } finally {
    database.close();
  }
}
