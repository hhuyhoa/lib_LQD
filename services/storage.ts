
import { BookRecord } from "../types";

const STORAGE_KEY = 'lib_library_data_v1';
const CHAT_STORAGE_KEY = 'lib_chat_history_v1';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export const getBooks = (): BookRecord[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveBook = (book: BookRecord): void => {
  const books = getBooks();
  const index = books.findIndex(b => b.id === book.id);
  const now = new Date().toISOString();
  
  if (index >= 0) {
    books[index] = { ...book, updatedAt: now };
  } else {
    books.push({ ...book, createdAt: now, updatedAt: now });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
};

export const deleteBook = (id: string): void => {
  const books = getBooks().filter(b => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
};

export const isIdDuplicate = (id: string, originalId?: string): boolean => {
  if (id === originalId) return false;
  return getBooks().some(b => b.id === id);
};

export const getChatHistory = (): ChatMessage[] => {
  const data = localStorage.getItem(CHAT_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveChatHistory = (messages: ChatMessage[]): void => {
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
};

export const clearChatHistory = (): void => {
  localStorage.removeItem(CHAT_STORAGE_KEY);
};

export const exportToCSV = (books: BookRecord[]) => {
  const headers = ["ID", "ISBN", "Title", "Author", "Publisher", "Year", "Lang", "Summary", "Link", "Cover"];
  const rows = books.map(b => [
    b.id, b.isbn, b.title, b.author, b.publisher, b.year, b.language, 
    `"${(b.summary || '').replace(/"/g, '""')}"`, b.pdfLink, b.coverImageUrl
  ]);
  const csvContent = "\ufeff" + [headers, ...rows].map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `library_export_${new Date().getTime()}.csv`;
  link.click();
};

export const importFromCSV = async (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) return resolve();

        const books = getBooks();
        const existingIds = new Set(books.map(b => b.id));
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const parts = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          if (parts.length < 3) continue;

          const id = parts[0].trim();
          const record: BookRecord = {
            id,
            isbn: parts[1]?.trim() || '',
            title: parts[2]?.trim() || '',
            author: parts[3]?.trim() || '',
            publisher: parts[4]?.trim() || '',
            year: parts[5]?.trim() ? parseInt(parts[5].trim(), 10) : '',
            language: parts[6]?.trim() || 'Tiếng Việt',
            summary: parts[7]?.replace(/^"|"$/g, '').replace(/""/g, '"') || '',
            pdfLink: parts[8]?.trim() || '',
            coverImageUrl: parts[9]?.trim() || '',
            pages: '',
            edition: '',
            ocrSource: 'Import CSV',
            aiConfidence: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          if (existingIds.has(id)) {
            const idx = books.findIndex(b => b.id === id);
            books[idx] = { ...record, createdAt: books[idx].createdAt };
          } else {
            books.push(record);
            existingIds.add(id);
          }
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
        resolve();
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsText(file);
  });
};
