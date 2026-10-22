/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Upload,
  Sparkles,
  Send,
  BookOpen,
  Award,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  Camera,
  Trash2,
  Check,
  AlertCircle,
  FileText,
  Heart
} from 'lucide-react';
import { TeacherPanel } from './components/TeacherPanel';
import { generateSampleHandwritingImage } from './sampleData';
import { downloadWordDocument, downloadElementAsImage } from './utils/exportUtils';

export default function App() {
  // Views: 'student-input' | 'student-loading' | 'student-result' | 'teacher'
  const [view, setView] = useState<'input' | 'loading' | 'result' | 'teacher'>('input');

  // Student Form State
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [currentGalleryIdx, setCurrentGalleryIdx] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Grading Result State
  const [gradingResult, setGradingResult] = useState<{
    text: string;
    score?: string;
  } | null>(null);

  // Teacher Auth State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [teacherPassInput, setTeacherPassInput] = useState('');
  const [teacherPassError, setTeacherPassError] = useState('');
  const [authenticatedPass, setAuthenticatedPass] = useState('');

  const resultCardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image helper with contrast/brightness enhancement
  const compressImage = (file: File): Promise<string> => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width;
          let h = img.height;
          if (w > 1200) {
            h = Math.round((h * 1200) / w);
            w = 1200;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.filter = 'contrast(1.1) brightness(1.05)';
            ctx.drawImage(img, 0, 0, w, h);
          }
          const base64 = canvas.toDataURL('image/jpeg', 0.65).split(',')[1];
          resolve(base64);
        };
      };
    });
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setErrorMessage('');
    const newImgs: string[] = [];
    for (let i = 0; i < e.target.files.length; i++) {
      const b64 = await compressImage(e.target.files[i]);
      newImgs.push(b64);
    }
    setImages(prev => [...prev, ...newImgs]);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleLoadSample = () => {
    setName('Nguyễn Minh Khang');
    setClassName('5A');
    const sample = generateSampleHandwritingImage().split(',')[1];
    setImages([sample]);
    setErrorMessage('');
  };

  const handleSubmitEssay = async () => {
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('⚠️ Em nhớ điền Tên của em nhé!');
      return;
    }
    if (!className.trim()) {
      setErrorMessage('⚠️ Em nhớ điền Lớp học của em nhé!');
      return;
    }
    if (images.length === 0) {
      setErrorMessage('⚠️ Em nhớ chụp hoặc chọn ít nhất một ảnh bài làm nhé!');
      return;
    }

    setIsSubmitting(true);
    setView('loading');

    try {
      // 1. Check blocked status
      const checkRes = await fetch('/api/check-blocked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), className: className.trim() }),
      });
      const checkData = await checkRes.json();
      if (checkData.blocked) {
        setView('input');
        setIsSubmitting(false);
        setErrorMessage('⚠️ Em đã bị chặn nộp bài. Vui lòng gặp cô giáo nhé! 🌻');
        return;
      }

      // 2. Submit to AI grading
      const gradeRes = await fetch('/api/grade-essay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          className: className.trim(),
          images,
        }),
      });

      const data = await gradeRes.json();

      if (!gradeRes.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi chấm bài.');
      }

      setGradingResult({
        text: data.resultText,
        score: data.score,
      });
      setCurrentGalleryIdx(0);
      setView('result');

      // Celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#f43f5e', '#fbbf24', '#34d399', '#a855f7'],
        });
      } catch (e) {}

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error(err);
      setView('input');
      setErrorMessage(
        err.message || '⚠️ Mạng đang bị nghẽn một chút. Em đợi một lát rồi bấm Gửi bài lại cho cô nhé! 🌻'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherPassError('');
    try {
      const res = await fetch('/api/teacher/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pass: teacherPassInput.trim() }),
      });
      if (res.ok) {
        setAuthenticatedPass(teacherPassInput.trim());
        setShowLoginModal(false);
        setView('teacher');
        setTeacherPassInput('');
      } else {
        setTeacherPassError('Mật mã không đúng cô ơi! (Gợi ý: 250778)');
      }
    } catch (e) {
      setTeacherPassError('Lỗi kết nối máy chủ.');
    }
  };

  const handleTeacherLogout = () => {
    setAuthenticatedPass('');
    setView('input');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForNewEssay = () => {
    setGradingResult(null);
    setImages([]);
    setName('');
    setClassName('');
    setErrorMessage('');
    setView('input');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatResultHtml = (raw: string) => {
    return raw
      .replace(
        /\[ĐIỂM SỐ:\s*(.*?)\]/gi,
        '<div class="text-center my-8"><span class="text-5xl sm:text-6xl font-black text-rose-600 border-4 border-dashed border-rose-300 px-8 sm:px-12 py-3 sm:py-4 rounded-full inline-block transform rotate-[-3deg] bg-white shadow-xl">$1</span></div>'
      )
      .replace(
        /# (.*)/g,
        '<h3 class="bg-gradient-to-r from-sky-100 to-white text-sky-800 p-4 rounded-2xl font-black mt-8 mb-4 border-l-[10px] border-sky-500 shadow-sm text-lg sm:text-xl">$1</h3>'
      )
      .replace(/\*\*(.*?)\*\*/g, '<b class="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold">$1</b>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="min-h-screen relative pb-16 flex flex-col justify-between">
      {/* Teacher View */}
      {view === 'teacher' ? (
        <TeacherPanel passcode={authenticatedPass} onLogout={handleTeacherLogout} />
      ) : (
        <main className="max-w-3xl mx-auto w-full px-3 sm:px-6 pt-6 sm:pt-10 flex-grow">
          {/* Main Top Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-white/90 px-4 py-1.5 rounded-full border border-sky-200 shadow-xs mb-3">
              <span className="text-lg">🎒</span>
              <span className="text-xs font-black text-sky-800 uppercase tracking-wider">
                Góc học văn Tiểu học • Lớp 4 & 5
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-sky-600 tracking-tight leading-tight">
              Lớp Học Văn Vui Vẻ 🌻
            </h1>
            <p className="text-sm sm:text-base text-sky-800/80 font-bold mt-2">
              Hệ thống hỗ trợ học tập & chấm bài văn tiểu học thông minh
            </p>
          </div>

          {/* VIEW 1: Input Form */}
          {view === 'input' && (
            <div className="cute-card p-6 sm:p-10 shadow-xl mb-10 transition-all">
              <div className="flex items-center justify-between border-b border-sky-100 pb-4 mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-sky-800 flex items-center gap-2">
                  <span>📝</span> Nộp Bài Làm Của Em
                </h2>
                <button
                  onClick={handleLoadSample}
                  type="button"
                  className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-black px-3 py-1.5 rounded-xl border border-amber-300 shadow-xs flex items-center gap-1 transition-transform active:scale-95"
                >
                  <Sparkles size={14} className="text-amber-600" />
                  Thử bài mẫu
                </button>
              </div>

              {/* Name & Class inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sky-800 font-extrabold mb-1.5 pl-1 text-sm sm:text-base">
                    🎈 Tên của em:
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full p-3.5 sm:p-4 rounded-2xl border-2 border-pink-200 outline-none text-base sm:text-lg focus:border-pink-500 bg-white shadow-xs transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sky-800 font-extrabold mb-1.5 pl-1 text-sm sm:text-base">
                    🏫 Lớp:
                  </label>
                  <input
                    type="text"
                    value={className}
                    onChange={e => setClassName(e.target.value)}
                    placeholder="VD: 5A"
                    className="w-full p-3.5 sm:p-4 rounded-2xl border-2 border-pink-200 outline-none text-base sm:text-lg focus:border-pink-500 bg-white shadow-xs transition-colors"
                  />
                </div>
              </div>

              {/* Image Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-4 border-dashed border-sky-300 p-8 sm:p-10 text-center rounded-3xl bg-sky-50/70 hover:bg-sky-100/80 transition-all cursor-pointer group mb-6 relative"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFiles}
                  className="hidden"
                />
                <div className="text-5xl sm:text-6xl mb-3 group-hover:scale-110 transition-transform">📸</div>
                <p className="font-black text-sky-800 text-lg sm:text-xl">
                  Bấm vào đây để nộp ảnh bài làm
                </p>
                <p className="text-sky-600 text-xs sm:text-sm mt-1 font-bold">
                  (Em có thể chọn hoặc chụp nhiều trang bài viết cùng lúc)
                </p>
              </div>

              {/* Previews */}
              {images.length > 0 && (
                <div className="mb-6 p-4 bg-sky-50/50 rounded-2xl border border-sky-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-sky-900 uppercase">
                      Các trang bài làm đã chọn ({images.length}):
                    </span>
                    <button
                      onClick={() => setImages([])}
                      className="text-xs text-rose-600 hover:underline font-bold"
                    >
                      Xóa tất cả
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                    {images.map((b64, idx) => (
                      <div
                        key={idx}
                        className="relative w-20 h-28 border-2 border-pink-300 rounded-xl overflow-hidden shadow-sm bg-white group"
                      >
                        <img
                          src={`data:image/jpeg;base64,${b64}`}
                          alt={`Trang ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 w-full bg-pink-500 text-white text-[10px] font-black text-center py-0.5 uppercase tracking-wide">
                          Trang {idx + 1}
                        </div>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            removeImage(idx);
                          }}
                          className="absolute top-1 right-1 bg-rose-500 hover:bg-rose-600 text-white w-5 h-5 rounded-full flex items-center justify-center font-black text-xs shadow-sm transition-colors"
                          title="Xóa ảnh này"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-6 p-4 bg-rose-50 border-2 border-rose-300 text-rose-700 rounded-2xl text-center font-black text-sm flex items-center justify-center gap-2 shadow-inner">
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmitEssay}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-pink-500 via-rose-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-black py-4 sm:py-5 rounded-3xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all text-xl sm:text-2xl border-b-8 border-rose-700 flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>🚀</span>
                <span>GỬI BÀI CHO CÔ GIÁO</span>
              </button>
            </div>
          )}

          {/* VIEW 2: Loading State */}
          {view === 'loading' && (
            <div className="cute-card p-10 sm:p-14 text-center shadow-2xl mt-4 mb-10">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="w-20 h-20 rounded-full border-6 border-pink-100 border-t-pink-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">
                  💌
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-rose-500 animate-pulse mb-3">
                Cô đang đọc bài của em...
              </h2>
              <p className="text-sky-900 font-bold text-base sm:text-lg mb-6">
                Em đợi một chút xíu nhé, cô chấm rất nhanh thôi! 🌻
              </p>

              <div className="max-w-md mx-auto bg-sky-50 p-4 rounded-2xl border border-sky-200 text-xs sm:text-sm text-sky-800 font-medium">
                <span className="font-black text-sky-900 block mb-1">💡 Lời khuyên viết văn hay:</span>
                "Khi miêu tả hay kể chuyện, hãy chú ý quan sát bằng nhiều giác quan và dùng từ láy gợi cảm để câu văn thêm sinh động nhé!"
              </div>
            </div>
          )}

          {/* VIEW 3: Result View */}
          {view === 'result' && gradingResult && (
            <div className="bg-white rounded-[36px] shadow-2xl overflow-hidden border-4 border-sky-300 mt-2 mb-12">
              {/* Header banner */}
              <div className="bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 p-5 text-white text-center font-black text-2xl sm:text-3xl tracking-wide shadow-md flex items-center justify-center gap-2">
                <span>🎉</span>
                <span>HOÀN THÀNH RỒI NÈ!</span>
                <span>🎉</span>
              </div>

              <div className="p-6 sm:p-10" ref={resultCardRef}>
                {/* Student badge */}
                <div className="text-center mb-6">
                  <span className="bg-amber-100 text-amber-900 px-6 py-2.5 rounded-full font-black text-base sm:text-lg border-2 border-amber-300 shadow-sm inline-flex items-center gap-2">
                    <span>🌟</span>
                    <span>Học sinh: {name} - Lớp {className}</span>
                  </span>
                </div>

                {/* Formatted result content */}
                <div
                  className="text-base sm:text-lg leading-relaxed text-gray-800"
                  dangerouslySetInnerHTML={{ __html: formatResultHtml(gradingResult.text) }}
                />

                {/* Attached student images gallery */}
                {images.length > 0 && (
                  <div className="mt-10 border-t-4 border-dashed border-sky-100 pt-8 flex flex-col items-center">
                    <h4 className="text-sky-800 font-black mb-4 text-lg sm:text-xl flex items-center gap-2">
                      <Camera className="text-sky-600" />
                      ẢNH CHỤP BÀI LÀM CỦA EM:
                    </h4>

                    <div className="w-full max-w-md bg-gray-100 p-3 rounded-2xl border border-gray-200 shadow-inner">
                      <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
                        <img
                          src={`data:image/jpeg;base64,${images[currentGalleryIdx]}`}
                          alt={`Trang ${currentGalleryIdx + 1}`}
                          className="w-full h-auto max-h-[480px] object-contain mx-auto"
                        />
                      </div>

                      {images.length > 1 && (
                        <div className="flex justify-between items-center mt-3 bg-white p-2 rounded-xl shadow-xs border border-gray-200">
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentGalleryIdx(prev => (prev > 0 ? prev - 1 : images.length - 1))
                            }
                            className="bg-sky-100 hover:bg-sky-200 text-sky-800 px-3.5 py-1.5 rounded-lg font-black text-xs sm:text-sm transition-colors flex items-center gap-1"
                          >
                            <ChevronLeft size={16} /> ẢNH TRƯỚC
                          </button>
                          <span className="font-black text-gray-700 text-sm">
                            Trang {currentGalleryIdx + 1} / {images.length}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentGalleryIdx(prev => (prev < images.length - 1 ? prev + 1 : 0))
                            }
                            className="bg-sky-100 hover:bg-sky-200 text-sky-800 px-3.5 py-1.5 rounded-lg font-black text-xs sm:text-sm transition-colors flex items-center gap-1"
                          >
                            ẢNH SAU <ChevronRight size={16} />
                          </button>
                        </div>
                      )}
                    </div>

                    <a
                      href={`data:image/jpeg;base64,${images[currentGalleryIdx]}`}
                      download={`BaiLam_${name}_Trang_${currentGalleryIdx + 1}.jpg`}
                      className="mt-4 bg-slate-800 hover:bg-black text-white px-6 py-2.5 rounded-full font-black text-xs sm:text-sm shadow-md transition-colors flex items-center gap-2"
                    >
                      <Download size={14} />
                      TẢI ẢNH NÀY VỀ MÁY
                    </a>
                  </div>
                )}
              </div>

              {/* Action buttons footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() =>
                    downloadWordDocument(name, className, formatResultHtml(gradingResult.text), gradingResult.score)
                  }
                  className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-black py-4 rounded-2xl shadow-[0_4px_0_#0369a1] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
                >
                  <Download size={18} />
                  TẢI PHIẾU CHẤM (WORD)
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (resultCardRef.current) {
                      await downloadElementAsImage(resultCardRef.current, `Phieu_Cham_${name}_${className}`);
                    }
                  }}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-[0_4px_0_#4338ca] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
                >
                  <Camera size={18} />
                  TẢI PHIẾU CHẤM (ẢNH)
                </button>

                <button
                  type="button"
                  onClick={resetForNewEssay}
                  className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-black py-4 rounded-2xl shadow-[0_4px_0_#be185d] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
                >
                  <RotateCcw size={18} />
                  NỘP BÀI KHÁC
                </button>
              </div>
            </div>
          )}
        </main>
      )}

      {/* Floating Teacher Login Button (when in student view) */}
      {view !== 'teacher' && (
        <button
          onClick={() => setShowLoginModal(true)}
          className="fixed bottom-12 right-4 sm:right-8 bg-white/95 text-sky-700 px-5 py-3 rounded-full shadow-2xl font-black border-2 border-sky-200 hover:scale-105 active:scale-95 transition-all z-40 flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
        >
          <span className="text-xl">👩‍🏫</span>
          <span>GIÁO VIÊN</span>
        </button>
      )}

      {/* Teacher Login Modal */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border-4 border-sky-300 relative animate-in fade-in zoom-in duration-150"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <span className="text-4xl block mb-2">👩‍🏫</span>
              <h3 className="text-2xl font-black text-sky-900">Sổ Tay Của Cô Giáo</h3>
              <p className="text-xs text-gray-500 mt-1">
                Vui lòng nhập mật mã để xem lịch sử nộp bài và quản lý danh sách học sinh.
              </p>
            </div>

            <form onSubmit={handleTeacherLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={teacherPassInput}
                  onChange={e => setTeacherPassInput(e.target.value)}
                  placeholder="Nhập mật mã giáo viên..."
                  className="w-full p-4 rounded-2xl border-2 border-sky-200 text-center font-bold text-lg focus:outline-none focus:border-sky-500 shadow-inner"
                  autoFocus
                />
                <p className="text-[11px] text-gray-400 text-center mt-2">
                  (Mật mã mặc định: <strong className="text-sky-700 cursor-pointer" onClick={() => setTeacherPassInput('250778')}>250778</strong> - bấm để điền nhanh)
                </p>
              </div>

              {teacherPassError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-bold text-center">
                  {teacherPassError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="w-1/2 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 text-sm"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-sm shadow-md transition-all"
                >
                  Đăng nhập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Persistent Running Marquee Copyright Banner */}
      <footer className="fixed bottom-0 left-0 w-full bg-[#0284c7] text-white py-2 z-30 text-xs sm:text-sm font-extrabold overflow-hidden shadow-lg select-none">
        <div className="animate-marquee whitespace-nowrap">
          Bản quyền thuộc về Nguyễn Hà Nam
          &nbsp;&nbsp;&nbsp;&nbsp; ● &nbsp;&nbsp;&nbsp;&nbsp;
          Lớp Học Văn Vui Vẻ - Nền tảng chấm bài văn tiểu học thông minh
          &nbsp;&nbsp;&nbsp;&nbsp; ● &nbsp;&nbsp;&nbsp;&nbsp;
          Bản quyền thuộc về Nguyễn Hà Nam
          &nbsp;&nbsp;&nbsp;&nbsp; ● &nbsp;&nbsp;&nbsp;&nbsp;
          Lớp Học Văn Vui Vẻ - Nền tảng chấm bài văn tiểu học thông minh
        </div>
      </footer>
    </div>
  );
}
