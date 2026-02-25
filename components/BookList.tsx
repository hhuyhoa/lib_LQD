import React, { useState, useMemo } from 'react';
import { BookRecord } from '../types';
import {
  Search,
  Edit2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Eye,
  Trash2,
} from 'lucide-react';

interface Props {
  books: BookRecord[];
  onEdit: (book: BookRecord) => void;
  onViewDetail: (book: BookRecord) => void;
  onDelete?: (book: BookRecord) => void; // ADMIN mới truyền, guest thì undefined
}

const BookList: React.FC<Props> = ({ books, onEdit, onViewDetail, onDelete }) => {
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const haystack = (b.title + b.author + b.isbn + b.id).toLowerCase();
      const matchSearch = haystack.includes(search.toLowerCase());
      const matchLang = langFilter === '' || b.language === langFilter;
      return matchSearch && matchLang;
    });
  }, [books, search, langFilter]);

  const languages = useMemo(
    () => Array.from(new Set(books.map((b) => b.language).filter(Boolean))),
    [books]
  );

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / itemsPerPage));
  const currentBooks = filteredBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleLangChange = (value: string) => {
    setLangFilter(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Thanh search + filter */}
      <div className="bg-white p-3 rounded-xl shadow-sm border flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm theo Tên, ISBN, Tác giả, Mã..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-50 outline-none"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="border border-gray-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-50 bg-white"
            value={langFilter}
            onChange={(e) => handleLangChange(e.target.value)}
          >
            <option value="">Tất cả ngôn ngữ</option>
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bảng sách */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Bìa / Mã
                </th>
                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Thông tin sách
                </th>
                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Xuất bản
                </th>
                <th className="px-6 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentBooks.length > 0 ? (
                currentBooks.map((book) => (
                  <tr
                    key={book.id}
                    className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                    onClick={() => onViewDetail(book)}
                  >
                    {/* Bìa / Mã */}
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-14 bg-gray-100 rounded border flex-shrink-0 overflow-hidden shadow-sm">
                          {book.coverImageUrl ? (
                            <img
                              src={book.coverImageUrl}
                              className="w-full h-full object-cover"
                              alt="Cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <BookOpen className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="font-mono text-xs font-bold text-indigo-600">
                          {book.id}
                        </div>
                      </div>
                    </td>

                    {/* Thông tin sách */}
                    <td className="px-6 py-3">
                      <div className="text-sm font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {book.title}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <span>{book.author}</span>
                        {book.isbn && (
                          <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400">
                            ISBN: {book.isbn}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Xuất bản */}
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-700">
                        {book.publisher || '---'}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-gray-400">
                          {book.year || 'N/A'}
                        </span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                          {book.language}
                        </span>
                      </div>
                    </td>

                    {/* Hành động */}
                    <td
                      className="px-6 py-3 text-right"
                      onClick={(e) => e.stopPropagation()} // tránh click row
                    >
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onViewDetail(book)}
                          className="p-2 text-gray-600 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg shadow-none hover:shadow-sm transition"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onEdit(book)}
                          className="p-2 text-indigo-600 hover:bg-white border border-transparent hover:border-indigo-100 rounded-lg shadow-none hover:shadow-sm transition"
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {onDelete && (
                          <button
                            onClick={() => {
                              console.log('[BookList] Delete click', book.id);
                              onDelete(book);
                            }}
                            className="p-2 text-red-500 hover:bg-white border border-transparent hover:border-red-100 rounded-lg shadow-none hover:shadow-sm transition"
                            title="Xoá"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center text-gray-400">
                      <Search className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-sm italic">
                        Không tìm thấy bản ghi nào khớp với tìm kiếm
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Trang {currentPage} / {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1.5 border border-gray-200 rounded-md bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookList;