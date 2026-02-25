
import React from 'react';
import { BookRecord, UserRole } from '../types';
import { User, ShieldCheck, Activity, BookCheck, Database, Calendar, CircleUser, Info, LogOut, RefreshCw } from 'lucide-react';

interface Props {
  books: BookRecord[];
  userRole: UserRole | null;
  onLogout: () => void;
}

const UserModule: React.FC<Props> = ({ books, userRole, onLogout }) => {
  const totalBooks = books.length;
  const lastUpdate = books.length > 0 ? new Date(Math.max(...books.map(b => new Date(b.updatedAt).getTime()))).toLocaleDateString('vi-VN') : 'N/A';
  
  const isAdmin = userRole === UserRole.ADMIN;

  const stats = [
    { label: 'Tổng số sách', value: totalBooks, icon: BookCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Dữ liệu AI trích xuất', value: books.filter(b => b.ocrSource.includes('Gemini')).length, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Cập nhật lần cuối', value: lastUpdate, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Dung lượng (Local)', value: (JSON.stringify(books).length / 1024).toFixed(1) + ' KB', icon: Database, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-indigo-100/50 border border-gray-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5">
           {isAdmin ? <ShieldCheck className="w-64 h-64 text-indigo-900" /> : <User className="w-64 h-64 text-gray-900" />}
        </div>
        
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className={`w-32 h-32 ${isAdmin ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-gray-400 to-gray-600'} rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200`}>
              {isAdmin ? <ShieldCheck className="w-16 h-16" /> : <CircleUser className="w-16 h-16" />}
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2">
                {isAdmin ? 'Quản trị viên' : 'Khách truy cập'}
              </h2>
              <div className={`flex items-center justify-center md:justify-start gap-2 ${isAdmin ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500 bg-gray-100'} font-bold px-4 py-1.5 rounded-full w-fit`}>
                {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                <span className="text-xs uppercase tracking-widest">{isAdmin ? 'Administrator' : 'Guest Viewer'}</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="px-8 py-4 bg-white border-2 border-red-50 text-red-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-50 transition-all flex items-center gap-3 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" /> Đăng xuất & Đổi quyền
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
          {stats.map((item, idx) => (
            <div key={idx} className="bg-gray-50/50 border border-gray-100 p-6 rounded-3xl flex items-center gap-6 group hover:bg-white hover:shadow-xl hover:shadow-indigo-50 transition-all duration-300">
              <div className={`${item.bg} ${item.color} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.label}</div>
                <div className="text-xl font-black text-gray-900">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`${isAdmin ? 'bg-indigo-900' : 'bg-gray-800'} p-8 rounded-[32px] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-200`}>
        <div className="flex-grow">
          <h3 className="text-xl font-bold mb-2">
            {isAdmin ? 'Quyền Hạn Hệ Thống' : 'Chế Độ Khách'}
          </h3>
          <p className={`${isAdmin ? 'text-indigo-200' : 'text-gray-400'} text-sm max-w-xl`}>
            {isAdmin 
              ? 'Bạn có toàn quyền biên mục, chỉnh sửa và quản lý cơ sở dữ liệu sách. Hãy đảm bảo sao lưu file CSV định kỳ để bảo toàn dữ liệu.'
              : 'Bạn đang ở chế độ xem. Bạn có thể tra cứu nâng cao và trò chuyện với trợ lý AI để tìm sách phù hợp. Để nhập liệu, vui lòng đăng nhập quyền Quản trị.'}
          </p>
        </div>
        <div className="flex gap-4">
          {!isAdmin && (
            <button 
              onClick={onLogout}
              className="px-8 py-3 bg-white text-gray-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors"
            >
              Đăng nhập Admin
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserModule;
