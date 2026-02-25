
import React, { useState, useMemo } from 'react';
import { BookRecord } from '../types';
import { Search, Filter, Hash, User, Building, Calendar, ArrowRight, BookOpen } from 'lucide-react';

interface Props {
  books: BookRecord[];
  onViewDetail: (book: BookRecord) => void;
}

const SearchModule: React.FC<Props> = ({ books, onViewDetail }) => {
  const [query, setQuery] = useState('');
  const [selectedField, setSelectedField] = useState('all');

  const filtered = useMemo(() => {
    if (!query) return [];
    return books.filter(b => {
      const q = query.toLowerCase();
      if (selectedField === 'title') return b.title.toLowerCase().includes(q);
      if (selectedField === 'author') return b.author.toLowerCase().includes(q);
      if (selectedField === 'isbn') return b.isbn.toLowerCase().includes(q);
      if (selectedField === 'id') return b.id.toLowerCase().includes(q);
      return (b.title + b.author + b.isbn + b.id + b.publisher).toLowerCase().includes(q);
    });
  }, [books, query, selectedField]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-indigo-100/30 border border-gray-100">
        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-8">Tìm kiếm nâng cao</h2>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Nhập từ khóa tìm kiếm (Tên, Tác giả, ISBN, Mã sách...)"
              className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none text-lg font-medium"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select 
            className="px-6 py-4 bg-white border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 text-sm font-bold text-gray-600"
            value={selectedField}
            onChange={(e) => setSelectedField(e.target.value)}
          >
            <option value="all">Tất cả các trường</option>
            <option value="title">Tên sách</option>
            <option value="author">Tác giả</option>
            <option value="isbn">ISBN</option>
            <option value="id">Mã Accession</option>
          </select>
        </div>

        {query && (
          <div className="mt-8 border-t border-gray-50 pt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Kết quả tìm kiếm ({filtered.length})</h3>
            </div>
            
            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map(book => (
                  <div 
                    key={book.id} 
                    onClick={() => onViewDetail(book)}
                    className="flex gap-6 p-4 bg-gray-50 hover:bg-white hover:shadow-xl hover:shadow-indigo-50 rounded-2xl border border-transparent hover:border-indigo-100 transition-all cursor-pointer group"
                  >
                    <div className="w-20 h-28 bg-gray-200 rounded-xl overflow-hidden shadow-sm flex-shrink-0">
                      {book.coverImageUrl ? (
                        <img src={book.coverImageUrl} className="w-full h-full object-cover" alt="Cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <BookOpen className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow flex flex-col justify-between py-1">
                      <div>
                        <h4 className="font-black text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">{book.title}</h4>
                        <p className="text-xs text-gray-500 font-bold mt-1">{book.author}</p>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-[10px] font-mono text-indigo-500 font-black">{book.id}</span>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 font-medium">Không tìm thấy bản ghi nào phù hợp.</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {!query && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-indigo-50 p-8 rounded-[32px] border border-indigo-100 text-center">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-sm">
                <Building className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-2">Lọc theo NXB</h4>
              <p className="text-[10px] text-indigo-400 font-bold uppercase">Phân loại dữ liệu nhanh</p>
           </div>
           <div className="bg-emerald-50 p-8 rounded-[32px] border border-emerald-100 text-center">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600 shadow-sm">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-2">Lọc theo Năm</h4>
              <p className="text-[10px] text-emerald-400 font-bold uppercase">Tìm sách mới nhất</p>
           </div>
           <div className="bg-amber-50 p-8 rounded-[32px] border border-amber-100 text-center">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-600 shadow-sm">
                <Hash className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest mb-2">Tìm theo ISBN</h4>
              <p className="text-[10px] text-amber-400 font-bold uppercase">Tra cứu mã chuẩn</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default SearchModule;
