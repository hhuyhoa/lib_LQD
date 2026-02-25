import React, { useState, useEffect, useCallback } from 'react';
import { BookRecord, AppView, UserRole } from './types';

import BookList from './components/BookList';
import BookForm from './components/BookForm';
import BookDetail from './components/BookDetail';
import UserModule from './components/UserModule';
import ChatModule from './components/ChatModule';
import TrainingModule from './components/TrainingModule';
import Login from './components/Login';

import {
  Plus,
  Library,
  FileUp,
  RefreshCw,
  Database,
  User as UserIcon,
  Keyboard,
  LogOut,
  Menu,
  X,
  ChevronRight,
  MessageSquare,
  ShieldCheck,
  CircleUser,
  CheckCircle2,
  Cpu
} from 'lucide-react';

const STORAGE_KEY = 'library_books_db';
const ROLE_STORAGE_KEY = 'library_user_role';
const PROMPT_STORAGE_KEY = 'library_system_prompt';
const DB_INITIALIZED_KEY = 'library_db_initialized';

// CSV mẫu trên Google Drive (dùng khi chưa có dữ liệu local)
const INITIAL_FILE_ID = '1T4W0gtYrOk6MuacwntytNoyg5v2OKMes';
const INITIAL_CSV_URL = `https://docs.google.com/uc?id=${INITIAL_FILE_ID}&export=download`;

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentModule, setCurrentModule] = useState<AppView>(AppView.USER);
  const [entryView, setEntryView] = useState<AppView>(AppView.LIST);

  const [books, setBooks] = useState<BookRecord[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [editingBook, setEditingBook] = useState<BookRecord | undefined>();
  const [selectedBook, setSelectedBook] = useState<BookRecord | undefined>();

  const [isSyncing, setIsSyncing] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // -------------------- PARSE CSV --------------------
  const parseCSVData = useCallback((text: string): BookRecord[] => {
    const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedText.split('\n');

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const newRecords: BookRecord[] = [];
    if (lines.length < 2) return [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = parseLine(line);
      if (cols.length < 3) continue;

      newRecords.push({
        id: cols[0] || `AUTO-${Date.now()}-${i}`,
        isbn: cols[1] || '',
        title: cols[2] || 'Không tiêu đề',
        author: cols[3] || 'Chưa rõ tác giả',
        publisher: cols[4] || '',
        year: cols[5] ? parseInt(cols[5]) : '',
        edition: cols[6] || '',
        language: cols[7] || 'Tiếng Việt',
        pages: cols[8] ? parseInt(cols[8]) : '',
        summary: (cols[9] || '').replace(/^"|"$/g, '').replace(/""/g, '"'),
        pdfLink: (cols[10] || '').replace(/^"|"$/g, '').replace(/""/g, '"'),
        coverImageUrl: (cols[11] || '').replace(/^"|"$/g, '').replace(/""/g, '"'),
        ocrSource: 'Hệ thống Import',
        aiConfidence: 1,
        createdAt: cols[12] || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    return newRecords;
  }, []);

  // -------------------- CSV BUILDERS --------------------
  const buildCSVContentFrom = (data: BookRecord[]) => {
    const headers = [
      "ID", "ISBN", "Title", "Author", "Publisher", "Year",
      "Edition", "Language", "Pages", "Summary", "PDF Link",
      "Cover Image", "Created At"
    ];

    const rows = data.map(b => [
      b.id,
      b.isbn,
      b.title,
      b.author,
      b.publisher,
      b.year,
      b.edition,
      b.language,
      b.pages,
      `"${(b.summary || '').replace(/"/g, '""')}"`,
      b.pdfLink,
      `"${(b.coverImageUrl || '').replace(/"/g, '""')}"`,
      b.createdAt
    ]);

    return "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  };

  // ✅ Export snapshot (không liên quan File System Access API)
  const exportToCSV = () => {
    const csvContent = buildCSVContentFrom(books);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `library_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // -------------------- COMMIT TO STORAGE (localStorage) --------------------
  const commitToStorage = (newBooks: BookRecord[]) => {
    setBooks(newBooks);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newBooks));
      localStorage.setItem(DB_INITIALIZED_KEY, 'true');
    } catch (e) {
      console.warn('Không thể lưu toàn bộ DB vào localStorage (có thể vượt quota).', e);
    }
  };

  // -------------------- INITIAL DATA (DRIVE) --------------------
  const fetchInitialDataFromDrive = useCallback(async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(INITIAL_CSV_URL);
      if (!response.ok) throw new Error('Network Error');
      const text = await response.text();
      const importedBooks = parseCSVData(text);
      if (importedBooks.length > 0) {
        commitToStorage(importedBooks);
      }
    } catch (e) {
      console.warn('Không thể tải dữ liệu mẫu từ Google Drive.', e);
    } finally {
      setIsSyncing(false);
      localStorage.setItem(DB_INITIALIZED_KEY, 'true');
    }
  }, [parseCSVData]);

  // -------------------- IMPORT (upload CSV & đè DB) --------------------
  const importFromCSV = () => {
    if (userRole !== UserRole.ADMIN) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';

    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const newRecords = parseCSVData(text);

        if (newRecords.length === 0) {
          alert('File CSV không có dữ liệu hợp lệ.');
          return;
        }

        // IMPORT = thay toàn bộ DB trong state + localStorage
        commitToStorage(newRecords);
        setEntryView(AppView.LIST);
        setEditingBook(undefined);
        setSelectedBook(undefined);

        alert('Đã thay toàn bộ dữ liệu theo file CSV mới (lưu trong localStorage).');
      };

      reader.readAsText(file);
    };

    input.click();
  };

  // -------------------- AUTH --------------------
  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    localStorage.setItem(ROLE_STORAGE_KEY, role);
    setCurrentModule(AppView.USER);
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem(ROLE_STORAGE_KEY);
    setCurrentModule(AppView.USER);
  };

  // -------------------- CRUD BOOKS --------------------
  const handleAddBook = (book: BookRecord) => {
    if (userRole !== UserRole.ADMIN) return;

    const existingIndex = books.findIndex(b => b.id === book.id);
    let updated: BookRecord[];

    if (existingIndex > -1) {
      updated = [...books];
      updated[existingIndex] = { ...book, updatedAt: new Date().toISOString() };
    } else {
      updated = [
        { ...book, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ...books
      ];
    }

    commitToStorage(updated);
    setEntryView(AppView.LIST);
    setEditingBook(undefined);
    setSelectedBook(undefined);

    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 1000);
  };

  const handleEdit = (book: BookRecord) => {
    if (userRole !== UserRole.ADMIN) return;
    setEditingBook(book);
    setCurrentModule(AppView.ENTRY);
    setEntryView(AppView.FORM);
  };

  const handleViewDetail = (book: BookRecord) => {
    setSelectedBook(book);
    setCurrentModule(AppView.ENTRY);
    setEntryView(AppView.DETAIL);
  };

  const handleSavePrompt = (newPrompt: string) => {
    setSystemPrompt(newPrompt);
    localStorage.setItem(PROMPT_STORAGE_KEY, newPrompt);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 1500);
  };

  // -------------------- INIT: ROLE, PROMPT, DATA --------------------
  useEffect(() => {
    // Role
    const savedRole = localStorage.getItem(ROLE_STORAGE_KEY) as UserRole | null;
    if (savedRole) setUserRole(savedRole);

    // Prompt
    const savedPrompt = localStorage.getItem(PROMPT_STORAGE_KEY);
    if (savedPrompt) {
      setSystemPrompt(savedPrompt);
    } else {
      (async () => {
        try {
          const response = await fetch('/training.txt');
          if (response.ok) {
            const text = await response.text();
            const trimmed = text.trim();
            setSystemPrompt(trimmed);
            localStorage.setItem(PROMPT_STORAGE_KEY, trimmed);
          } else {
            setSystemPrompt('Bạn là trợ lý thư viện chuyên nghiệp.');
          }
        } catch {
          setSystemPrompt('Bạn là trợ lý thư viện chuyên nghiệp.');
        }
      })();
    }

    // Data
    (async () => {
      let loaded = false;

      // 1. Dùng localStorage nếu có
      const savedBooks = localStorage.getItem(STORAGE_KEY);
      if (savedBooks) {
        try {
          const parsed = JSON.parse(savedBooks);
          setBooks(parsed);
          loaded = true;
        } catch (e) {
          console.error('Lỗi đọc DB từ localStorage', e);
        }
      }

      // 2. Nếu chưa có thì lấy từ Drive (lần đầu)
      if (!loaded) {
        const isInitialized = localStorage.getItem(DB_INITIALIZED_KEY);
        if (isInitialized !== 'true') {
          await fetchInitialDataFromDrive();
        }
      }
    })();
  }, [fetchInitialDataFromDrive]);

  // -------------------- RENDER ENTRY CONTENT --------------------
  const renderEntryContent = () => {
    if (books.length === 0 && !isSyncing) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-[40px] shadow-2xl shadow-indigo-100 border border-gray-100 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center mb-8">
            <Database className="w-12 h-12 text-indigo-500" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tight">
            Cơ sở dữ liệu trống
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            {userRole === UserRole.ADMIN && (
              <>
                <button
                  onClick={importFromCSV}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-3"
                >
                  <FileUp className="w-5 h-5" /> NHẬP FILE CSV (IMPORT)
                </button>
                <button
                  onClick={() => setEntryView(AppView.FORM)}
                  className="px-8 py-4 bg-white text-gray-900 border-2 border-gray-100 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
                >
                  <Plus className="w-5 h-5" /> TẠO SÁCH THỦ CÔNG
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    switch (entryView) {
      case AppView.LIST:
        return (
          <BookList
            books={books}
            onEdit={handleEdit}
            onViewDetail={handleViewDetail}
            onDelete={
              userRole === UserRole.ADMIN
                ? (book) => {
                    console.log('[App] onDelete called for', book.id);
                    const updated = books.filter((b) => b.id !== book.id);
                    console.log('[App] books length', books.length, '=>', updated.length);

                    commitToStorage(updated);

                    if (selectedBook && selectedBook.id === book.id) {
                      setSelectedBook(undefined);
                      setEntryView(AppView.LIST);
                    }
                  }
                : undefined
            }
          />
        );
      case AppView.FORM:
        return userRole === UserRole.ADMIN ? (
          <BookForm
            onSave={handleAddBook}
            onCancel={() => {
              setEntryView(AppView.LIST);
              setEditingBook(undefined);
            }}
            existingBook={editingBook}
            existingIds={books.map((b) => b.id)}
          />
        ) : (
          <BookList
            books={books}
            onEdit={handleEdit}
            onViewDetail={handleViewDetail}
          />
        );
      case AppView.DETAIL:
        return selectedBook ? (
          <BookDetail
            book={selectedBook}
            onBack={() => setEntryView(AppView.LIST)}
            onEdit={handleEdit}
          />
        ) : null;
      default:
        return null;
    }
  };

  const renderMainContent = () => {
    switch (currentModule) {
      case AppView.USER:
        return (
          <UserModule
            books={books}
            userRole={userRole}
            onLogout={handleLogout}
          />
        );
      case AppView.CHAT:
        return (
          <ChatModule
            books={books}
            onViewDetail={handleViewDetail}
            systemPrompt={systemPrompt}
          />
        );
      case AppView.TRAINING:
        return (
          <TrainingModule initialPrompt={systemPrompt} onSave={handleSavePrompt} />
        );
      case AppView.ENTRY:
        return renderEntryContent();
      default:
        return renderEntryContent();
    }
  };

  const sidebarItems = [
    {
      id: AppView.USER,
      label: 'Người dùng',
      icon: UserIcon,
      color: 'text-indigo-600',
      access: [UserRole.ADMIN, UserRole.GUEST]
    },
    {
      id: AppView.ENTRY,
      label: 'Nhập liệu',
      icon: Keyboard,
      color: 'text-emerald-600',
      access: [UserRole.ADMIN]
    },
    {
      id: AppView.TRAINING,
      label: 'Training AI',
      icon: Cpu,
      color: 'text-amber-600',
      access: [UserRole.ADMIN]
    },
    {
      id: AppView.CHAT,
      label: 'Chatbox AI',
      icon: MessageSquare,
      color: 'text-purple-600',
      access: [UserRole.ADMIN, UserRole.GUEST]
    }
  ].filter((item) => userRole && item.access.includes(userRole));

  if (!userRole) return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed bottom-6 right-6 z-[60] p-4 bg-indigo-600 text-white rounded-2xl shadow-2xl md:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 shadow-2xl transition-transform duration-300 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-10 px-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                <Library className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-black uppercase tracking-tight text-gray-900 leading-tight">
                  LIB LÊ QUÝ ĐÔN
                </h1>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                  v1.2 Test 
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-2 text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-grow space-y-2">
            <div className="px-3 mb-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Menu chính
              </span>
            </div>
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentModule(item.id);
                  if (item.id === AppView.ENTRY) setEntryView(AppView.LIST);
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all group ${
                  currentModule === item.id
                    ? 'bg-indigo-50 text-indigo-900 shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-4">
                  <item.icon
                    className={`w-5 h-5 ${
                      currentModule === item.id
                        ? item.color
                        : 'text-gray-400 group-hover:text-gray-600'
                    }`}
                  />
                  <span className="text-sm font-black uppercase tracking-wider">
                    {item.label}
                  </span>
                </div>
                {currentModule === item.id && (
                  <ChevronRight className="w-4 h-4 text-indigo-400" />
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-4 pt-6 border-t border-gray-50">
            <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-3">
              <div
                className={`w-10 h-10 ${
                  userRole === UserRole.ADMIN ? 'bg-indigo-600' : 'bg-gray-400'
                } rounded-xl flex items-center justify-center text-white font-black`}
              >
                {userRole === UserRole.ADMIN ? (
                  <ShieldCheck className="w-5 h-5" />
                ) : (
                  <CircleUser className="w-5 h-5" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-gray-900">
                  {userRole === UserRole.ADMIN ? 'Administrator' : 'Khách truy cập'}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {userRole === UserRole.ADMIN ? 'Toàn quyền' : 'Chỉ xem & Chat'}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-500 hover:bg-red-50 transition-colors font-black uppercase text-xs tracking-widest"
            >
              <LogOut className="w-5 h-5" /> Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-grow h-screen overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 px-8 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.15em]">
                {sidebarItems.find((i) => i.id === currentModule)?.label || 'Bảng điều khiển'}
              </h2>

              {isSyncing && (
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Đang tải dữ liệu...
                </div>
              )}

              {showSaveSuccess && (
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase animate-in fade-in zoom-in">
                  <CheckCircle2 className="w-3 h-3" /> Đã lưu thành công
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {userRole === UserRole.ADMIN && currentModule === AppView.ENTRY && (
                <div className="flex items-center gap-2 bg-black/5 p-1 rounded-xl">
                  <button
                    onClick={importFromCSV}
                    className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-white transition shadow-none hover:shadow-sm"
                  >
                    Import
                  </button>

                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-white transition shadow-none hover:shadow-sm"
                    title="Xuất một bản CSV mới (snapshot) để backup hoặc upload lên Google Drive."
                  >
                    Export
                  </button>
                </div>
              )}

              {userRole === UserRole.ADMIN && currentModule === AppView.ENTRY && (
                <button
                  onClick={() => {
                    setEditingBook(undefined);
                    setEntryView(AppView.FORM);
                  }}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 rounded-xl text-xs font-black text-white shadow-lg transition-all active:scale-95 uppercase tracking-wider"
                >
                  <Plus className="w-4 h-4" /> Thêm mới
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-8">{renderMainContent()}</div>
      </main>
    </div>
  );
};

export default App;