
import React, { useState } from 'react';
import { Cpu, Save, RefreshCw, AlertCircle, HelpCircle } from 'lucide-react';

interface Props {
  initialPrompt: string;
  onSave: (prompt: string) => void;
}

const TrainingModule: React.FC<Props> = ({ initialPrompt, onSave }) => {
  const [prompt, setPrompt] = useState(initialPrompt);

  const handleReset = () => {
    if (window.confirm("Bạn có chắc chắn muốn đặt lại Prompt về mặc định?")) {
      const defaultPrompt = `Bạn là trợ lý thư viện chuyên nghiệp.
Nhiệm vụ:
1. Gợi ý sách phù hợp nhất từ danh mục hiện có.
2. Cung cấp thông tin mượn sách chi tiết và chính xác.
3. Trả lời thân thiện, lịch sự bằng tiếng Việt.
4. Nếu không tìm thấy sách, hãy gợi ý các chủ đề tương đương.`;
      setPrompt(defaultPrompt);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-indigo-100/50 border border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-2 flex items-center gap-3">
              <Cpu className="w-8 h-8 text-amber-500" /> Training AI
            </h2>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Cấu hình hành vi và tính cách cho Chatbox</p>
          </div>
          <button 
            onClick={handleReset}
            className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
            title="Đặt lại mặc định"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-sm font-black text-amber-900 uppercase tracking-wider mb-1">System Instruction</h4>
              <p className="text-xs text-amber-700 leading-relaxed font-medium">
                Đây là tập hợp các hướng dẫn mà AI sẽ tuân thủ trong suốt cuộc trò chuyện. Bạn có thể định nghĩa "vai trò", "giới hạn" và "phong cách trả lời" tại đây.
              </p>
            </div>
          </div>

          <div className="relative">
            <textarea
              className="w-full h-80 px-8 py-6 bg-gray-50 border border-gray-200 rounded-3xl focus:ring-4 focus:ring-indigo-100 outline-none text-sm font-medium leading-relaxed resize-none shadow-inner"
              placeholder="Nhập yêu cầu huấn luyện AI tại đây..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            ></textarea>
            <div className="absolute top-4 right-4 text-gray-300">
              <HelpCircle className="w-5 h-5 cursor-help" />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button 
              onClick={() => onSave(prompt)}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center gap-3"
            >
              <Save className="w-5 h-5" /> LƯU CẤU HÌNH AI
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100">
          <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-4">Gợi ý cách viết Prompt</h4>
          <ul className="space-y-3">
            {['Xác định rõ vai trò (VD: Thủ thư)', 'Đặt giới hạn (VD: Không trả lời ngoài lề)', 'Định dạng câu trả lời (VD: Dùng Markdown)', 'Cung cấp ví dụ mẫu'].map((tip, idx) => (
              <li key={idx} className="flex items-center gap-3 text-xs font-bold text-indigo-600 bg-white/50 p-3 rounded-xl border border-white">
                <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                {tip}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100">
          <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest mb-4">Lưu ý bảo mật</h4>
          <p className="text-xs text-emerald-700 leading-relaxed font-medium">
            Mọi thay đổi trong Training AI sẽ được áp dụng ngay lập tức cho tất cả người dùng (bao gồm cả khách). Đảm bảo không nhập thông tin nhạy cảm vào Prompt.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrainingModule;
