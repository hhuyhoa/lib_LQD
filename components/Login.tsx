
import React, { useState } from 'react';
import { UserRole } from '../types';
import { ShieldCheck, User, Lock, Library, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  onLogin: (role: UserRole) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Simulate slight delay for professional feel
    setTimeout(() => {
      if (password === '123') {
        onLogin(UserRole.ADMIN);
      } else {
        setError('Mật khẩu quản trị viên không chính xác.');
        setIsLoading(false);
      }
    }, 600);
  };

  const handleGuestLogin = () => {
    onLogin(UserRole.GUEST);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-white to-white">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-indigo-600 rounded-3xl text-white shadow-2xl shadow-indigo-200 mb-6">
            <Library className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Library Lê Quý Đôn</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">Hệ thống quản lý & Tra cứu thông minh</p>
        </div>

        <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-indigo-100/50 border border-gray-100">
          {!selectedRole ? (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-gray-900 mb-6 text-center">Chọn vai trò đăng nhập</h2>
              
              <button 
                onClick={() => setSelectedRole(UserRole.ADMIN)}
                className="w-full flex items-center justify-between p-6 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-3xl group transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-indigo-900 uppercase tracking-wider">Quản trị viên</div>
                    <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Toàn quyền truy cập</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-indigo-300 group-hover:translate-x-1 transition-transform" />
              </button>

              <button 
                onClick={handleGuestLogin}
                className="w-full flex items-center justify-between p-6 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-3xl group transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm text-gray-400">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-black text-gray-900 uppercase tracking-wider">Khách truy cập</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tra cứu & Chat AI</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <button 
                onClick={() => { setSelectedRole(null); setError(''); }}
                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-6 hover:underline"
              >
                ← Quay lại
              </button>
              
              <h2 className="text-lg font-black text-gray-900 mb-2">Xác thực Quản trị</h2>
              <p className="text-xs text-gray-400 font-medium mb-8">Vui lòng nhập mật khẩu để truy cập quyền quản trị viên.</p>

              <form onSubmit={handleAdminSubmit} className="space-y-6">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="password"
                    autoFocus
                    placeholder="Mật khẩu (vinhhanh)"
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-medium transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-2xl border border-red-100 text-xs font-bold animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={isLoading || !password}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'XÁC NHẬN ĐĂNG NHẬP'}
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">
          © 2026 Lib Lê Quý Đôn 
        </p>
      </div>
    </div>
  );
};

export default Login;
