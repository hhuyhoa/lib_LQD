
import React from 'react';
import { BookRecord } from '../types';
import { ArrowLeft, Edit2, FileText, Printer, ExternalLink } from 'lucide-react';

interface Props {
  book: BookRecord;
  onBack: () => void;
  onEdit: (book: BookRecord) => void;
}

const BookDetail: React.FC<Props> = ({ book, onBack, onEdit }) => {
  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-bold text-sm transition"
        >
          <div className="p-2 rounded-full group-hover:bg-indigo-50 transition">
            <ArrowLeft className="w-5 h-5" />
          </div>
          QUAY LẠI DANH SÁCH
        </button>
        <div className="flex gap-2">
           <button onClick={() => window.print()} className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition">
            <Printer className="w-5 h-5" />
          </button>
          <button 
            onClick={() => onEdit(book)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition font-bold text-sm"
          >
            <Edit2 className="w-4 h-4" /> CHỈNH SỬA
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-2xl shadow-indigo-100/50 overflow-hidden border border-gray-100 flex flex-col md:flex-row min-h-[500px]">
        <div className="w-full md:w-[380px] bg-gray-50 p-12 flex items-center justify-center border-r border-gray-50">
          <div className="w-full relative group">
            <div className="absolute -inset-4 bg-indigo-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative aspect-[3/4.5] w-full rounded-2xl shadow-[20px_20px_60px_rgba(0,0,0,0.15)] overflow-hidden">
              {book.coverImageUrl ? (
                <img src={book.coverImageUrl} className="w-full h-full object-cover" alt={book.title} />
              ) : (
                <div className="w-full h-full bg-indigo-600 flex flex-col p-8 text-white text-center">
                  <div className="text-2xl font-black mb-4 leading-tight">{book.title}</div>
                  <div className="mt-auto pt-6 border-t border-white/20">
                    <div className="text-emerald-300 font-bold uppercase tracking-widest text-xs">{book.author}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-grow p-12 md:p-16 space-y-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900 leading-tight mb-2">{book.title}</h1>
            <div className="h-1.5 w-24 bg-indigo-600 rounded-full mt-6"></div>
          </div>

          <div className="space-y-6">
            <div className="flex items-start">
              <span className="w-36 text-gray-400 font-bold text-xs uppercase tracking-widest pt-1">Loại tài liệu:</span>
              <span className="text-gray-900 text-lg font-bold">Tài liệu giấy - </span>
            </div>
            <div className="flex items-start">
              <span className="w-36 text-gray-400 font-bold text-xs uppercase tracking-widest pt-1">Tác giả:</span>
              <span className="text-gray-900 text-xl font-black">{book.author}</span>
            </div>
            <div className="flex items-start">
              <span className="w-36 text-gray-400 font-bold text-xs uppercase tracking-widest pt-1">Nhà xuất bản:</span>
              <span className="text-gray-900 text-lg font-bold">{book.publisher || "Chưa cập nhật"}</span>
            </div>
            <div className="flex items-start">
              <span className="w-36 text-gray-400 font-bold text-xs uppercase tracking-widest pt-1">Năm xuất bản:</span>
              <span className="text-indigo-600 text-2xl font-black tracking-tight">{book.year || "----"}</span>
            </div>
            <div className="flex items-start pt-4">
              <span className="w-36 text-gray-400 font-bold text-xs uppercase tracking-widest pt-1">Ngôn ngữ:</span>
              <span className="inline-flex items-center px-4 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-black rounded-full border border-indigo-100 uppercase tracking-tighter">
                {book.language}
              </span>
            </div>
          </div>

          {book.summary && (
            <div className="pt-10 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tóm tắt nội dung chính thống</h3>
              </div>
              <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-6">
                <p className="text-gray-600 leading-relaxed text-base italic">"{book.summary}"</p>
                
                {book.summarySources && book.summarySources.length > 0 && (
                  <div className="pt-4 border-t border-gray-200/50">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <ExternalLink className="w-3 h-3" /> Trích nguồn tham khảo:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {book.summarySources.map((source, idx) => (
                        <a 
                          key={idx}
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="bg-white px-3 py-1.5 rounded-lg border border-gray-100 text-[10px] text-indigo-600 font-bold hover:shadow-md transition flex items-center gap-1.5"
                        >
                          {source.title} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetail;
