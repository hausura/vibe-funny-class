import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  UserX,
  Settings,
  LogOut,
  Search,
  Trash2,
  Download,
  Camera,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  KeyRound,
  Eye,
  X
} from 'lucide-react';
import { downloadWordDocument, downloadElementAsImage } from '../utils/exportUtils';

interface Submission {
  id: string;
  name: string;
  className: string;
  timestamp: number;
  result: string;
  score?: string;
  imageUrls: string[];
}

interface TeacherPanelProps {
  passcode: string;
  onLogout: () => void;
}

export const TeacherPanel: React.FC<TeacherPanelProps> = ({ passcode, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'hist' | 'block' | 'settings'>('hist');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [blockedList, setBlockedList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Settings state
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Block manual form
  const [blockName, setBlockName] = useState('');
  const [blockClass, setBlockClass] = useState('');

  // Fetch submissions
  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/submissions?pass=${encodeURIComponent(passcode)}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (e) {
      console.error('Failed to load submissions:', e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch blocked list
  const loadBlockedList = async () => {
    try {
      const res = await fetch(`/api/teacher/blocked?pass=${encodeURIComponent(passcode)}`);
      if (res.ok) {
        const data = await res.json();
        setBlockedList(data);
      }
    } catch (e) {
      console.error('Failed to load blocked list:', e);
    }
  };

  useEffect(() => {
    loadSubmissions();
    loadBlockedList();
  }, [passcode]);

  const handleDelete = async (id: string, studentName: string) => {
    if (!window.confirm(`Cô chắc chắn muốn xóa bài của học sinh ${studentName}?`)) return;
    try {
      const res = await fetch(`/api/teacher/submissions/${id}?pass=${encodeURIComponent(passcode)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSubmissions(prev => prev.filter(s => s.id !== id && String(s.timestamp) !== id));
      }
    } catch (e) {
      alert('Lỗi khi xóa bài nộp.');
    }
  };

  const handleBlock = async (name: string, className: string) => {
    if (!window.confirm(`Chặn học sinh "${name}" (Lớp ${className}) nộp bài?`)) return;
    try {
      const res = await fetch('/api/teacher/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pass: passcode, name, className }),
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedList(data.blockedList);
        alert(`Đã chặn học sinh ${name} (Lớp ${className})!`);
      }
    } catch (e) {
      alert('Lỗi khi chặn học sinh.');
    }
  };

  const handleUnblock = async (key: string) => {
    const displayName = key.replace('_', ' (Lớp ') + ')';
    if (!window.confirm(`Bỏ chặn cho học sinh ${displayName}?`)) return;
    try {
      const res = await fetch('/api/teacher/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pass: passcode, key }),
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedList(data.blockedList);
      }
    } catch (e) {
      alert('Lỗi khi bỏ chặn.');
    }
  };

  const handleManualBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockName.trim() || !blockClass.trim()) return;
    await handleBlock(blockName.trim(), blockClass.trim());
    setBlockName('');
    setBlockClass('');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    try {
      const res = await fetch('/api/teacher/change-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPass, newPass }),
      });
      const data = await res.json();
      if (res.ok) {
        setPassMsg({ type: 'success', text: 'Đổi mật mã thành công!' });
        setOldPass('');
        setNewPass('');
      } else {
        setPassMsg({ type: 'error', text: data.error || 'Đổi mật mã thất bại.' });
      }
    } catch (e) {
      setPassMsg({ type: 'error', text: 'Có lỗi xảy ra khi đổi mật mã.' });
    }
  };

  const scrollToCard = (id: string) => {
    const el = document.getElementById(`essay-card-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-pink-400');
      setTimeout(() => el.classList.remove('ring-4', 'ring-pink-400'), 2500);
    }
  };

  const filteredSubmissions = submissions.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.className.toLowerCase().includes(q) || s.result.toLowerCase().includes(q);
  });

  const renderResultFormatted = (raw: string) => {
    return raw
      .replace(/\[ĐIỂM SỐ:\s*(.*?)\]/gi, '<div style="margin: 12px 0; text-align: center;"><span style="font-size: 20px; font-weight: 900; color: #e11d48; background: #fff1f2; padding: 6px 18px; border-radius: 9999px; border: 2px dashed #f43f5e;">ĐIỂM: $1</span></div>')
      .replace(/# (.*)/g, '<h4 style="background: #e0f2fe; color: #0369a1; padding: 8px 12px; border-radius: 10px; font-weight: 800; margin-top: 14px; margin-bottom: 6px;">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<b style="color: #1d4ed8; background: #eff6ff; padding: 1px 4px; border-radius: 4px;">$1</b>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="max-w-6xl mx-auto w-full pb-28 pt-4 px-3 sm:px-6">
      {/* Teacher Header Bar */}
      <div className="bg-white rounded-3xl shadow-xl border-2 border-sky-200 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-sky-600 to-indigo-600 p-5 sm:p-6 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 bg-white/20 rounded-2xl">👩‍🏫</span>
            <div>
              <h1 className="text-2xl font-black tracking-tight">SỔ TAY CỦA CÔ GIÁO</h1>
              <p className="text-xs sm:text-sm text-sky-100 font-medium">
                Bản quyền thuộc về Nguyễn Hà Nam
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('hist')}
              className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 ${
                activeTab === 'hist'
                  ? 'bg-white text-sky-800 shadow-md scale-105'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              <BookOpen size={16} />
              LỊCH SỬ BÀI NỘP ({submissions.length})
            </button>

            <button
              onClick={() => setActiveTab('block')}
              className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 ${
                activeTab === 'block'
                  ? 'bg-white text-rose-700 shadow-md scale-105'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              <UserX size={16} />
              DS CHẶN ({blockedList.length})
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'bg-white text-slate-800 shadow-md scale-105'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
            >
              <Settings size={16} />
              CÀI ĐẶT
            </button>

            <button
              onClick={onLogout}
              className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md transition-colors flex items-center gap-1.5 ml-auto md:ml-2"
            >
              <LogOut size={16} />
              ĐĂNG XUẤT
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Submissions History */}
      {activeTab === 'hist' && (
        <div className="space-y-6">
          {/* Search & Actions Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm theo tên học sinh, lớp..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-sky-400"
              />
            </div>

            <button
              onClick={loadSubmissions}
              disabled={loading}
              className="w-full sm:w-auto bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-sky-200"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Làm mới danh sách
            </button>
          </div>

          {/* Quick jump pills */}
          {submissions.length > 0 && (
            <div className="bg-sky-50/80 p-4 rounded-2xl border border-sky-200">
              <h3 className="font-black text-sky-900 text-xs sm:text-sm uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span>📌</span> Danh sách bài nộp gần đây (bấm để xem nhanh):
              </h3>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto custom-scrollbar p-1">
                {submissions.map(s => {
                  const time = new Date(s.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <button
                      key={s.id}
                      onClick={() => scrollToCard(s.id)}
                      className="bg-white hover:bg-sky-100 text-sky-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-sky-200 shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <span>👉 {s.name} ({s.className})</span>
                      <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[11px] font-black">
                        {s.score || 'Đã chấm'}
                      </span>
                      <span className="text-gray-400 text-[10px]">{time}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submissions list */}
          {loading ? (
            <div className="bg-white p-16 rounded-3xl text-center shadow-sm border border-gray-100">
              <div className="inline-block w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sky-700 font-bold">Đang tải danh sách bài làm của học sinh...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl text-center shadow-sm border border-gray-200 text-gray-500 font-bold">
              Không tìm thấy bài nộp nào.
            </div>
          ) : (
            <div className="space-y-6">
              {filteredSubmissions.map(sub => {
                const dateStr = new Date(sub.timestamp).toLocaleString('vi-VN');
                const cardDomId = `essay-card-${sub.id}`;
                const printContainerId = `print-area-${sub.id}`;

                return (
                  <div
                    key={sub.id}
                    id={cardDomId}
                    className="bg-white p-5 sm:p-7 rounded-3xl shadow-md border-2 border-sky-100 transition-all scroll-mt-6"
                  >
                    {/* Student Info Top */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📝</span>
                        <div>
                          <span className="font-black text-sky-800 text-xl">{sub.name}</span>
                          <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-black ml-2 border border-pink-200">
                            Lớp {sub.className}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {sub.score && (
                          <span className="bg-rose-500 text-white font-black px-3 py-1 rounded-xl text-sm shadow-sm">
                            Điểm: {sub.score}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 font-bold">{dateStr}</span>
                      </div>
                    </div>

                    {/* Result Content */}
                    <div
                      id={printContainerId}
                      className="bg-slate-50/70 p-5 rounded-2xl text-sm text-gray-800 leading-relaxed border border-slate-200 max-h-96 overflow-y-auto custom-scrollbar mb-4"
                      dangerouslySetInnerHTML={{ __html: renderResultFormatted(sub.result) }}
                    />

                    {/* Attached Photos */}
                    {sub.imageUrls && sub.imageUrls.length > 0 && (
                      <div className="mb-4 pt-2">
                        <p className="text-xs font-black text-sky-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Camera size={14} /> ẢNH BÀI LÀM CỦA HỌC SINH ({sub.imageUrls.length} ảnh):
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {sub.imageUrls.map((imgUrl, idx) => {
                            const src = imgUrl.startsWith('http') || imgUrl.startsWith('data:') ? imgUrl : `data:image/jpeg;base64,${imgUrl}`;
                            return (
                              <div key={idx} className="relative group text-center">
                                <img
                                  src={src}
                                  alt={`Trang ${idx + 1}`}
                                  onClick={() => setSelectedImage(src)}
                                  className="w-20 h-28 object-cover border-2 border-sky-200 rounded-xl shadow-sm group-hover:scale-105 transition-all cursor-pointer bg-white"
                                />
                                <div className="mt-1 flex items-center justify-center gap-1">
                                  <a
                                    href={src}
                                    download={`BaiLam_${sub.name}_Trang_${idx + 1}.jpg`}
                                    className="text-[10px] bg-sky-100 hover:bg-sky-200 text-sky-700 px-2 py-0.5 rounded font-black shadow-xs"
                                  >
                                    📥 Tải
                                  </a>
                                  <button
                                    onClick={() => setSelectedImage(src)}
                                    className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-black"
                                    title="Xem phóng to"
                                  >
                                    🔍
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => downloadWordDocument(sub.name, sub.className, renderResultFormatted(sub.result), sub.score)}
                        className="bg-sky-500 hover:bg-sky-600 text-white font-black px-4 py-2.5 rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-all"
                      >
                        <Download size={14} />
                        TẢI BÀI CHỮA (WORD)
                      </button>

                      <button
                        onClick={async () => {
                          const target = document.getElementById(printContainerId);
                          if (target) {
                            await downloadElementAsImage(target, `Phieu_Cham_${sub.name}_${sub.className}`);
                          }
                        }}
                        className="bg-indigo-500 hover:bg-indigo-600 text-white font-black px-4 py-2.5 rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-all"
                      >
                        <Camera size={14} />
                        TẢI ẢNH CHỮA (PNG)
                      </button>

                      <button
                        onClick={() => handleDelete(sub.id, sub.name)}
                        className="bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white font-bold px-3 py-2.5 rounded-xl text-xs border border-rose-200 transition-colors flex items-center gap-1.5 ml-auto"
                      >
                        <Trash2 size={14} />
                        XÓA BÀI
                      </button>

                      <button
                        onClick={() => handleBlock(sub.name, sub.className)}
                        className="bg-orange-50 hover:bg-orange-500 text-orange-600 hover:text-white font-bold px-3 py-2.5 rounded-xl text-xs border border-orange-200 transition-colors flex items-center gap-1.5"
                      >
                        <UserX size={14} />
                        CHẶN HS
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Blocked Students */}
      {activeTab === 'block' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border-2 border-sky-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4 mb-6">
            <div>
              <h2 className="text-xl font-black text-sky-900 flex items-center gap-2">
                <UserX className="text-rose-500" />
                DANH SÁCH HỌC SINH BỊ CHẶN NỘP BÀI
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Học sinh trong danh sách này khi nộp bài sẽ nhận thông báo liên hệ gặp cô giáo.
              </p>
            </div>
            <button
              onClick={loadBlockedList}
              className="bg-sky-50 text-sky-700 hover:bg-sky-100 font-bold px-3 py-1.5 rounded-xl text-xs border border-sky-200 flex items-center gap-1"
            >
              <RefreshCw size={12} /> Cập nhật
            </button>
          </div>

          {/* Manual block form */}
          <form onSubmit={handleManualBlock} className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 mb-6 flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-rose-800 mb-1">Tên học sinh cần chặn:</label>
              <input
                type="text"
                placeholder="VD: Nguyễn Văn B"
                value={blockName}
                onChange={e => setBlockName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-rose-300 text-sm focus:outline-none focus:border-rose-500 bg-white"
              />
            </div>
            <div className="w-full sm:w-36">
              <label className="block text-xs font-bold text-rose-800 mb-1">Lớp:</label>
              <input
                type="text"
                placeholder="VD: 5B"
                value={blockClass}
                onChange={e => setBlockClass(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-rose-300 text-sm focus:outline-none focus:border-rose-500 bg-white"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-black px-5 py-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1"
            >
              <UserX size={14} /> Thêm vào danh sách chặn
            </button>
          </form>

          {/* List */}
          {blockedList.length === 0 ? (
            <div className="text-center py-12 text-gray-400 font-bold bg-slate-50 rounded-2xl border border-dashed border-gray-200">
              Hiện tại không có học sinh nào bị chặn. 🌻
            </div>
          ) : (
            <div className="space-y-3">
              {blockedList.map(key => {
                const displayName = key.replace('_', ' (Lớp ') + ')';
                return (
                  <div
                    key={key}
                    className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-200 hover:border-sky-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
                        🚫
                      </span>
                      <span className="font-black text-gray-800 uppercase tracking-wide">
                        {displayName}
                      </span>
                    </div>

                    <button
                      onClick={() => handleUnblock(key)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-black text-xs shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle size={14} />
                      BỎ CHẶN
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border-2 border-sky-100 max-w-xl mx-auto">
          <h2 className="text-xl font-black text-sky-900 flex items-center gap-2 mb-2">
            <KeyRound className="text-sky-600" />
            ĐỔI MẬT MÃ GIÁO VIÊN
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            Mật mã mặc định ban đầu là: <code className="bg-slate-100 px-2 py-0.5 rounded font-black text-sky-700">250778</code>
          </p>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mật mã hiện tại:</label>
              <input
                type="password"
                value={oldPass}
                onChange={e => setOldPass(e.target.value)}
                placeholder="Nhập mật mã hiện tại..."
                className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mật mã mới:</label>
              <input
                type="password"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                placeholder="Nhập mật mã mới..."
                className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            {passMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  passMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {passMsg.text}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-black py-3 rounded-xl text-sm shadow-md transition-all"
            >
              LƯU MẬT MÃ MỚI
            </button>
          </form>

          {/* Info Card */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-2">Thông tin hệ thống</h3>
            <div className="text-xs text-gray-600 space-y-1 bg-slate-50 p-4 rounded-xl">
              <p>• Mô hình AI: <strong>Gemini 3.8 Flash (Vision)</strong></p>
              <p>• Tự động nhận diện chữ viết tay & cốt truyện SGK Tiếng Việt</p>
              <p>• Lưu trữ bài nộp: Tối đa 200 bài gần nhất</p>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl p-2 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 bg-gray-900/70 hover:bg-black text-white p-2 rounded-full z-10 transition-colors"
            >
              <X size={20} />
            </button>
            <img
              src={selectedImage}
              alt="Ảnh phóng to"
              className="max-h-[82vh] w-auto mx-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
