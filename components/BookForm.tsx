import React, { useState, useEffect, useRef } from 'react';
import { BookRecord, BookSource } from '../types';
import { extractBookMetadata } from '../services/geminiService';
import {
  ImagePlus,
  Loader2,
  Save,
  X,
  Sparkles,
  BookOpen,
  ExternalLink,
  Camera
} from 'lucide-react';

interface Props {
  onSave: (book: BookRecord) => void;
  onCancel: () => void;
  existingBook?: BookRecord;
  existingIds: string[];
}

// Nén ảnh để tránh base64 quá nặng
const compressImage = (base64: string, maxWidth = 400): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
  });
};

const BookForm: React.FC<Props> = ({
  onSave,
  onCancel,
  existingBook,
  existingIds
}) => {
  const [loading, setLoading] = useState(false);

  // Danh sách ảnh (từ file upload + camera)
  const [images, setImages] = useState<string[]>([]);

  // Cover input (đổi ảnh bìa thủ công)
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Camera
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [formData, setFormData] = useState<Partial<BookRecord>>({
    id: '',
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    year: '',
    edition: '',
    language: 'Tiếng Việt',
    pages: '',
    summary: '',
    summarySources: [],
    pdfLink: '',
    coverImageUrl: '',
    ocrSource: 'Manual',
    aiConfidence: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Nếu sửa sách cũ → fill form
  useEffect(() => {
    if (existingBook) {
      setFormData(existingBook);
    }
  }, [existingBook]);

  // ---------- UPLOAD ẢNH (TỪ FILE) – chỉ lưu, CHƯA gọi AI ----------
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const base64Images: string[] = [];

    for (const file of files) {
      const reader = new FileReader();
      const p = new Promise<string>((resolve) => {
        reader.onload = (ev) => resolve(ev.target?.result as string);
      });
      reader.readAsDataURL(file);
      const rawBase64 = await p;
      const compressed = await compressImage(rawBase64);
      base64Images.push(compressed);
    }

    const updatedImages = [...images, ...base64Images];
    setImages(updatedImages);

    // Nếu chưa có cover → lấy ảnh đầu tiên làm bìa
    if (!formData.coverImageUrl && base64Images.length > 0) {
      setFormData((prev) => ({
        ...prev,
        coverImageUrl: base64Images[0]
      }));
    }
  };

  // ---------- NÚT "Nhập dữ liệu AI" – gọi Gemini OCR + tóm tắt ----------
  const handleRunAI = async () => {
    if (images.length === 0) {
      alert('Vui lòng thêm ít nhất 1 ảnh (bìa / mục lục / phụ lục) trước khi dùng AI.');
      return;
    }

    setLoading(true);
    try {
      const result = await extractBookMetadata(images);

      setFormData((prev) => ({
        ...prev,
        title: result.title || prev.title,
        author: result.author || prev.author,
        isbn: result.isbn || prev.isbn,
        publisher: result.publisher || prev.publisher,
        year: result.year || prev.year,
        edition: result.edition || prev.edition,
        pages: result.pages || prev.pages,
        language: result.language || prev.language || 'Tiếng Việt',
        summary: result.summary || prev.summary,
        summarySources:
          (result.summarySources as BookSource[]) ||
          prev.summarySources ||
          [],
        aiConfidence: result.confidence ?? prev.aiConfidence ?? 0,
        ocrSource: 'Gemini OCR & Summarization'
      }));
    } catch (err: any) {
      console.error('AI OCR error in BookForm:', err);
      alert(err?.message || 'AI không thể phân tích ảnh. Vui lòng nhập tay.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- CAMERA: MỞ / ĐÓNG / CHỤP ----------
  const openCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert(
        'Trình duyệt không hỗ trợ camera (getUserMedia). Hãy dùng Chrome / Edge mới nhất.'
      );
      return;
    }

    try {
      // bật khung trước để người dùng thấy
      setShowCamera(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        // trên mobile có thể đổi thành { facingMode: 'environment' }
        video: { facingMode: 'environment' }
      });

      console.log('[Camera] stream acquired', stream);

      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;
        (video as any).srcObject = stream;

        // đảm bảo play sau khi metadata sẵn sàng
        video.onloadedmetadata = () => {
          console.log('[Camera] metadata loaded', video.videoWidth, video.videoHeight);
          video
            .play()
            .then(() => console.log('[Camera] playing'))
            .catch((e) => console.error('[Camera] play error', e));
        };
      }
    } catch (err) {
      console.error('Camera error', err);
      alert(
        'Không mở được camera. Hãy kiểm tra quyền truy cập camera cho trang web trong trình duyệt (Site settings → Camera → Allow).'
      );
      setShowCamera(false);
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      (videoRef.current as any).srcObject = null;
    }
    setShowCamera(false);
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    // nếu metadata chưa có → không chụp, tránh ảnh đen
    if (!video.videoWidth || !video.videoHeight) {
      alert('Camera chưa sẵn sàng. Hãy đợi hình xuất hiện rồi hãy chụp.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const rawBase64 = canvas.toDataURL('image/jpeg', 0.9);
    const compressed = await compressImage(rawBase64, 500);

    const updatedImages = [...images, compressed];
    setImages(updatedImages);

    if (!formData.coverImageUrl) {
      setFormData((prev) => ({
        ...prev,
        coverImageUrl: compressed
      }));
    }
  };

  // ---------- CHỌN / ĐỔI ẢNH BÌA ----------
  const handleCoverClick = () => {
    coverInputRef.current?.click();
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const rawBase64 = ev.target?.result as string;
      const compressed = await compressImage(rawBase64, 500);
      setFormData((prev) => ({ ...prev, coverImageUrl: compressed }));
    };
    reader.readAsDataURL(file);
  };

  // ---------- VALIDATE + SUBMIT ----------
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.id) newErrors.id = 'Mã sách là bắt buộc';
    else if (!existingBook && existingIds.includes(formData.id)) {
      newErrors.id = 'Mã sách đã tồn tại';
    }
    if (!formData.title) newErrors.title = 'Tên sách là bắt buộc';
    if (!formData.author) newErrors.author = 'Tác giả là bắt buộc';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      ...formData,
      updatedAt: new Date().toISOString(),
      createdAt: formData.createdAt || new Date().toISOString()
    } as BookRecord);
  };

  // ---------- JSX ----------
  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          {existingBook ? 'Cập nhật thông tin sách' : 'Biên mục sách mới'}
          <span className="text-xs bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
            AI cataloging
          </span>
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Cột trái: AI + ảnh + camera + bìa */}
        <div className="lg:col-span-4 space-y-6">
          {/* Khối AI */}
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-indigo-100/20 border border-gray-100">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-indigo-500" /> Trợ lý AI (OCR + Tóm tắt)
            </h3>

            {/* Upload ảnh thông tin */}
            <label className="cursor-pointer border-2 border-dashed border-indigo-100 bg-indigo-50/10 rounded-2xl p-8 flex flex-col items-center justify-center hover:bg-indigo-50/50 transition-all duration-300 group mb-4">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ImagePlus className="w-8 h-8 text-indigo-500" />
              </div>
              <span className="text-sm font-black text-indigo-600">
                Thêm ảnh (bìa / mục lục / phụ lục)
              </span>
              <p className="text-[10px] text-gray-400 mt-2 text-center px-4 font-medium uppercase tracking-wider leading-relaxed">
                Chọn nhiều ảnh cùng lúc. AI sẽ phân tích tổng hợp.
              </p>
              <input
                type="file"
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>

            {/* Nút mở camera */}
            <button
              type="button"
              onClick={openCamera}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-indigo-100 bg-white text-xs font-black text-indigo-600 hover:bg-indigo-50 transition-all mb-4"
            >
              <Camera className="w-4 h-4" /> Chụp từ camera
            </button>

            {/* Khung camera */}
            {showCamera && (
              <div className="mt-4 bg-gray-900 rounded-2xl overflow-hidden border border-gray-700">
                <div className="relative w-full aspect-[3/4] bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex justify-between gap-3 p-3 bg-black/70">
                  <button
                    type="button"
                    onClick={handleCapture}
                    className="flex-1 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-black uppercase tracking-widest hover:bg-emerald-600"
                  >
                    Chụp ảnh
                  </button>
                  <button
                    type="button"
                    onClick={closeCamera}
                    className="flex-1 px-4 py-2 rounded-xl bg-gray-200 text-gray-700 text-xs font-black uppercase tracking-widest hover:bg-gray-300"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}

            {/* Nút chạy AI */}
            <button
              type="button"
              onClick={handleRunAI}
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.18em] hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang phân tích AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Nhập dữ liệu AI
                </>
              )}
            </button>

            {/* Thumbnails ảnh đã thêm */}
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="relative group rounded-xl border border-gray-100 aspect-[3/4] bg-gray-50 overflow-hidden shadow-sm"
                  >
                    <img src={img} alt="Scan" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-indigo-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() =>
                          setImages((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="text-white p-1.5 bg-red-500 rounded-full shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Khối ảnh bìa */}
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-indigo-100/20 border border-gray-100">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
              Ảnh bìa (click để đổi ảnh)
            </h3>

            <div
              onClick={handleCoverClick}
              className="group cursor-pointer aspect-[3/4.5] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden relative shadow-inner hover:border-indigo-400 transition-all"
            >
              {formData.coverImageUrl ? (
                <>
                  <img
                    src={formData.coverImageUrl}
                    className="w-full h-full object-cover"
                    alt="Preview"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                    <Camera className="w-10 h-10 mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Đổi ảnh bìa
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center p-8 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                    Chưa có ảnh
                  </span>
                </div>
              )}
              <input
                type="file"
                ref={coverInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleCoverUpload}
              />
            </div>

            <div className="mt-4">
              <input
                type="text"
                className="w-full text-[11px] font-mono px-3 py-2 border border-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-100 outline-none bg-gray-50"
                placeholder="Hoặc nhập URL ảnh bìa..."
                value={formData.coverImageUrl || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    coverImageUrl: e.target.value
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Cột phải: Form thông tin sách */}
        <div className="lg:col-span-8">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-10 rounded-[40px] shadow-2xl shadow-indigo-100/30 border border-gray-100 space-y-8"
          >
            {/* Định danh + cơ bản */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-4 w-1 bg-indigo-600 rounded-full" />
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">
                  Định danh &amp; Cơ bản
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Mã sách *
                  </label>
                  <input
                    type="text"
                    className={`w-full px-5 py-3.5 border rounded-2xl focus:ring-4 outline-none font-mono text-sm ${
                      errors.id
                        ? 'border-red-500 focus:ring-red-100'
                        : 'focus:ring-indigo-50 border-gray-100 bg-gray-50/50'
                    }`}
                    value={formData.id || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        id: e.target.value
                      })
                    }
                  />
                  {errors.id && (
                    <p className="text-[10px] text-red-500 mt-2 font-bold">{errors.id}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    ISBN
                  </label>
                  <input
                    type="text"
                    className="w-full px-5 py-3.5 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none bg-gray-50/50 text-sm font-mono"
                    value={formData.isbn || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isbn: e.target.value
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Tên sách *
                </label>
                <input
                  type="text"
                  className={`w-full px-5 py-4 border rounded-2xl focus:ring-4 outline-none font-black text-lg ${
                    errors.title
                      ? 'border-red-500 focus:ring-red-100'
                      : 'focus:ring-indigo-50 border-gray-100 bg-gray-50/30'
                  }`}
                  value={formData.title || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: e.target.value
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Tác giả *
                </label>
                <input
                  type="text"
                  className={`w-full px-5 py-3.5 border rounded-2xl focus:ring-4 outline-none font-bold ${
                    errors.author
                      ? 'border-red-500 focus:ring-red-100'
                      : 'focus:ring-indigo-50 border-gray-100 bg-gray-50/30'
                  }`}
                  value={formData.author || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      author: e.target.value
                    })
                  }
                />
              </div>
            </div>

            {/* NXB + năm */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Nhà xuất bản
                </label>
                <input
                  type="text"
                  className="w-full px-5 py-3.5 border border-gray-100 rounded-2xl outline-none bg-gray-50/30 font-bold"
                  value={formData.publisher || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      publisher: e.target.value
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Năm xuất bản
                </label>
                <input
                  type="number"
                  className="w-full px-5 py-3.5 border border-gray-100 rounded-2xl outline-none bg-gray-50/30 font-bold"
                  value={formData.year || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      year: e.target.value ? parseInt(e.target.value, 10) : ''
                    })
                  }
                />
              </div>
            </div>

            {/* Tóm tắt */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-4 w-1 bg-indigo-600 rounded-full" />
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">
                  Tóm tắt nội dung
                </h3>
              </div>

              <div>
                <textarea
                  className="w-full px-5 py-4 border border-gray-100 rounded-3xl focus:ring-4 focus:ring-indigo-50 outline-none h-48 resize-none text-sm leading-relaxed bg-gray-50/20"
                  placeholder="AI sẽ cố gắng tóm tắt dựa trên mục lục/phụ lục. Bạn có thể chỉnh sửa lại cho phù hợp."
                  value={formData.summary || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      summary: e.target.value
                    })
                  }
                />

                {formData.summarySources && formData.summarySources.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> Nguồn trích dẫn chính thống:
                    </h4>
                    <ul className="space-y-1.5">
                      {formData.summarySources.map((source, idx) => (
                        <li key={idx}>
                          <a
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-2"
                          >
                            • {source.title}{' '}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Footer: nút Hủy / Lưu */}
            <div className="pt-10 flex justify-end gap-4 border-t border-gray-50">
              <button
                type="button"
                onClick={onCancel}
                className="px-10 py-4 rounded-2xl text-xs font-black text-gray-400 hover:bg-gray-100 uppercase tracking-widest"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-14 py-4 rounded-2xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all uppercase tracking-[0.15em] flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> {existingBook ? 'Cập nhật' : 'Lưu sách'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookForm;