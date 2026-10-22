import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// High limit for base64 handwriting images
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Data directory for persistence
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const BLOCKED_FILE = path.join(DATA_DIR, 'blocked.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

interface Submission {
  id: string;
  name: string;
  className: string;
  timestamp: number;
  result: string;
  score?: string;
  imageUrls: string[]; // base64 or urls
}

function getSubmissions(): Submission[] {
  try {
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const content = fs.readFileSync(SUBMISSIONS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed to read submissions:', err);
  }
  // Initial seed data
  const seed: Submission[] = [
    {
      id: 'sub_1712000001',
      name: 'Nguyễn Hải Đăng',
      className: '5A',
      timestamp: Date.now() - 3600000 * 5,
      score: '9/10',
      imageUrls: [],
      result: `# ĐỀ BÀI: Tả cây bàng trên sân trường em vào một buổi sáng mùa hạ

# ĐIỂM SỐ VÀ NHẬN XÉT
[ĐIỂM SỐ: 9/10]
Bài văn của con rất giàu cảm xúc, chữ viết nắn nót, bố cục ba phần rõ ràng mạch lạc. Con có năng khiếu quan sát tinh tế khi miêu tả vòm lá bàng như chiếc ô khổng lồ xòe bóng mát cho chúng mình vui đùa. Cô rất khen ngợi tinh thần học tập của con!

# LỖI CẦN SỬA
- Câu "Cây bàng đứng sừng sững ở giữa sân trường như một người lính canh gác" nên thêm từ gợi cảm để câu văn uyển chuyển hơn.
- Con chú ý viết hoa đúng quy tắc tên riêng và đầu câu nhé.

# GỢI Ý CÂU VĂN HAY
- "Mỗi chiếc lá bàng xanh mướt như bàn tay nhỏ vẫy gọi từng tia nắng sớm lung linh nhảy múa trên cành."
- "Dưới gốc bàng già, những tiếng cười giòn giã của tuổi thơ chúng em như đọng lại mãi cùng năm tháng."

# BÀI VIẾT HOÀN CHỈNH
Mỗi sáng bước chân vào cổng trường, hình ảnh đầu tiên hiện ra trước mắt em là cây bàng già thân thương nơi góc sân. **Cây bàng như một bác bảo vệ tận tụy, bốn mùa đều lặng lẽ xòe bóng mát chở che cho đàn chim nhỏ chúng em.** Thân cây to lớn, vỏ nâu xù xì in hằn dấu vết của thời gian. Những tán lá xanh mướt đan xen tầng tầng lớp lớp, hệt như những chiếc ô xanh khổng lồ chắn bớt cái nắng chói chang của mùa hè. Dưới tán lá mát rượi, giờ ra chơi chúng em tụ họp đọc sách, chơi nhảy dây trong tiếng ve râm ran. Em yêu cây bàng lắm, bởi cây đã gắn bó và chứng kiến bao kỷ niệm đẹp đẽ của tuổi học trò dưới mái trường tiểu học thân thương.`
    },
    {
      id: 'sub_1712000002',
      name: 'Trần Mai Anh',
      className: '5B',
      timestamp: Date.now() - 3600000 * 12,
      score: '8.5/10',
      imageUrls: [],
      result: `# ĐỀ BÀI: Kể lại câu chuyện "Sự tích cây vú sữa" bằng lời của em

# ĐIỂM SỐ VÀ NHẬN XÉT
[ĐIỂM SỐ: 8.5/10]
Mai Anh kể chuyện rất truyền cảm và nắm chắc cốt truyện cổ tích cảm động này. Con đã biết bộc lộ niềm xúc động sâu sắc trước tình mẫu tử thiêng liêng. Đọc bài của con, cô cảm nhận được con là một cô bé rất hiếu thảo và giàu lòng nhân ái.

# LỖI CẦN SỬA
- Có một vài chỗ con dùng lặp từ "rồi", "xong rồi", con có thể thay bằng "tiếp đó", "bỗng nhiên", "trong khoảnh khắc ấy".
- Cần chú ý ngắt dấu chấm phẩy rõ ràng ở các câu dài để giọng kể mạch lạc hơn.

# GỢI Ý CÂU VĂN HAY
- "Dòng sữa ngọt ngào trắng ngần như tình yêu thương bao la của mẹ suốt đời dành trọn cho con."

# BÀI VIẾT HOÀN CHỈNH
Ngày xưa, có một cậu bé ham chơi, vì một lần bị mẹ mắng nên đã giận dỗi bỏ nhà đi. Cậu lang thang khắp nơi, đói lả và mệt mỏi, lúc này cậu mới nhớ tới mẹ hiền. Về đến nhà, cảnh tượng vắng hoe làm cậu òa khóc nức nở: "Mẹ ơi, mẹ ở đâu?". Cậu ôm lấy một thân cây xanh tốt trước sân mà khóc. **Như thấu hiểu nỗi ân hận tột cùng của con thơ, cây bỗng run rẩy, trổ hoa rồi kết trái chín mọng.** Trái nứt ra, tuôn trào dòng sữa trắng ngần ngọt lịm. Đó chính là cây vú sữa - hiện thân cho tình mẫu tử bao la, đời đời không bao giờ cạn.`
    }
  ];
  saveSubmissions(seed);
  return seed;
}

function saveSubmissions(list: Submission[]) {
  try {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save submissions:', err);
  }
}

function getBlockedList(): string[] {
  try {
    if (fs.existsSync(BLOCKED_FILE)) {
      const content = fs.readFileSync(BLOCKED_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed to read blocked list:', err);
  }
  return [];
}

function saveBlockedList(list: string[]) {
  try {
    fs.writeFileSync(BLOCKED_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save blocked list:', err);
  }
}

function getTeacherPasscode(): string {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      if (cfg.teacherPasscode) return cfg.teacherPasscode;
    }
  } catch (e) {}
  // Default passcode matches original Apps Script
  return '250778';
}

function saveTeacherPasscode(code: string) {
  try {
    let cfg: any = {};
    if (fs.existsSync(CONFIG_FILE)) {
      cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
    cfg.teacherPasscode = code;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save passcode:', e);
  }
}

// Ensure files are initialized
getSubmissions();
getBlockedList();

// Helper to normalize student keys "name_class"
function normalizeKey(name: string, className: string): string {
  return `${name.trim().toLowerCase()}_${className.trim().toLowerCase()}`;
}

// API Routes
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    submissionsCount: getSubmissions().length,
  });
});

// Check blocked status
app.post('/api/check-blocked', (req, res) => {
  const { name, className } = req.body;
  if (!name || !className) {
    return res.json({ blocked: false });
  }
  const key = normalizeKey(name, className);
  const blockedList = getBlockedList().map(k => k.toLowerCase());
  const isBlocked = blockedList.includes(key);
  res.json({ blocked: isBlocked });
});

// Grade essay using Gemini AI Vision
app.post('/api/grade-essay', async (req, res) => {
  try {
    const { name, className, images } = req.body;

    if (!name || !className || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        error: 'Vui lòng cung cấp đầy đủ Tên, Lớp và ít nhất một ảnh bài làm.'
      });
    }

    // Check if blocked
    const key = normalizeKey(name, className);
    const blockedList = getBlockedList().map(k => k.toLowerCase());
    if (blockedList.includes(key)) {
      return res.status(403).json({
        blocked: true,
        error: 'Em đã bị chặn nộp bài. Vui lòng gặp cô giáo nhé!'
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Chưa cấu hình GEMINI_API_KEY trên hệ thống máy chủ.'
      });
    }

    const ai = new GoogleGenAI();

    const promptText = `Bạn là cô giáo dạy Văn lớp 5 vô cùng tâm lý, hiền từ và yêu thương học sinh. Hãy chấm bài cho học sinh: ${name} lớp ${className}.

YÊU CẦU CHUNG TỐI THƯỢNG:
1. ĐỌC DỊCH CHỮ VIẾT TAY THÔNG MINH: Chữ học sinh Tiểu học có thể rất khó đọc. DÙNG NGỮ CẢNH ĐỂ SUY LUẬN VÀ DỊCH CHUẨN XÁC từng chữ viết tay. Tuyệt đối không đoán bừa làm sai lệch ý các em.
2. Ngôn ngữ nhận xét PHẢI nhẹ nhàng, ân cần, khích lệ như đang tâm tình với học sinh 10 tuổi.

A. NẾU LÀ BÀI VĂN KỂ CHUYỆN:
Bạn phải tự động truy xuất dữ liệu từ các thư viện quốc gia, SGK Tiếng Việt và các nguồn đáng tin cậy để nhận diện câu chuyện.
- TRƯỜNG HỢP 1: NẾU KỂ TRUYỆN ĐÃ CÓ BẢN GỐC (Truyện cổ tích, SGK, truyện đã xuất bản...): BẮT BUỘC ĐÚNG CỐT TRUYỆN GỐC. Ở phần 'BÀI VIẾT HOÀN CHỈNH', hãy thêm câu thoại tự nhiên, khắc họa nội tâm, cảm xúc nhân vật thật bay bổng nhưng KHÔNG BỊA TÌNH TIẾT SAI SỰ THẬT SO VỚI BẢN GỐC.
- TRƯỜNG HỢP 2: NẾU KỂ TRUYỆN HOÀN TOÀN MỚI DO HỌC SINH TỰ TƯỞNG TƯỢNG (Không tìm thấy bản gốc): TÔN TRỌNG TUYỆT ĐỐI CỐT TRUYỆN CỦA HỌC SINH. Bạn KHÔNG ĐƯỢC TỰ Ý TẠO THÊM TÌNH TIẾT MỚI, không làm thay đổi diễn biến, logic hay hành động nhân vật mà HS đã viết. Sự sáng tạo ở phần 'BÀI VIẾT HOÀN CHỈNH' chỉ giới hạn ở việc: Trau chuốt từ ngữ, làm mượt câu văn, thêm các từ láy gợi tả, gợi cảm, miêu tả rõ hơn khung cảnh dựa trên đúng diễn biến HS đưa ra.

B. NẾU LÀ BÀI VĂN MIÊU TẢ (tả cảnh, người, vật, cây cối...):
- Tập trung đánh giá dựa trên bố cục 3 phần của lớp 4, 5. Soi kỹ trình tự miêu tả, cách quan sát bằng nhiều giác quan và việc sử dụng các biện pháp tu từ.

TRẢ VỀ ĐÚNG ĐỊNH DẠNG SAU:
# ĐỀ BÀI (Ghi lại tên đề bài/truyện bạn nhận diện được)
# ĐIỂM SỐ VÀ NHẬN XÉT (Cú pháp: [ĐIỂM SỐ: X/10])
# LỖI CẦN SỬA
# GỢI Ý CÂU VĂN HAY
# BÀI VIẾT HOÀN CHỈNH (Viết lại bài hoàn chỉnh. Phần nào bạn sửa/thêm vào để làm hay hơn thì bọc trong cặp dấu ** ** để làm nổi bật)`;

    const parts: any[] = [{ text: promptText }];

    for (const img of images) {
      // Clean data uri prefix if present
      const cleanBase64 = img.includes(';base64,') ? img.split(';base64,')[1] : img;
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    console.log(`[AI Grading] Request for ${name} (${className}) with ${images.length} images...`);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: parts,
    });

    const resultText = response.text || '';
    if (!resultText) {
      throw new Error('Không nhận được phản hồi chấm bài từ AI.');
    }

    // Extract score
    const scoreMatch = resultText.match(/\[ĐIỂM SỐ:\s*(.*?)\]/i);
    const score = scoreMatch ? scoreMatch[1].trim() : '8.5/10';

    // Save to database
    const newSubmission: Submission = {
      id: 'sub_' + Date.now(),
      name: name.trim(),
      className: className.trim(),
      timestamp: Date.now(),
      result: resultText,
      score: score,
      imageUrls: images, // Keep base64 photos for teacher review & student gallery
    };

    const currentSubmissions = getSubmissions();
    currentSubmissions.unshift(newSubmission);
    // Keep max 200 submissions to manage storage
    if (currentSubmissions.length > 200) {
      currentSubmissions.pop();
    }
    saveSubmissions(currentSubmissions);

    return res.json({
      success: true,
      resultText,
      score,
      submission: {
        id: newSubmission.id,
        timestamp: newSubmission.timestamp,
        name: newSubmission.name,
        className: newSubmission.className,
      },
    });
  } catch (error: any) {
    console.error('[AI Grading Error]:', error);
    return res.status(500).json({
      error: error?.message || 'Có lỗi xảy ra khi chấm bài. Em thử lại nhé!',
    });
  }
});

// Teacher endpoints with passcode protection
function verifyTeacher(req: express.Request): boolean {
  const pass = (req.query.pass as string) || (req.body.pass as string) || (req.headers['x-teacher-pass'] as string);
  return pass === getTeacherPasscode();
}

app.post('/api/teacher/verify', (req, res) => {
  const { pass } = req.body;
  if (pass === getTeacherPasscode()) {
    return res.json({ valid: true });
  }
  return res.status(401).json({ valid: false, message: 'Mật mã không đúng cô ơi!' });
});

app.post('/api/teacher/change-pass', (req, res) => {
  const { oldPass, newPass } = req.body;
  if (oldPass !== getTeacherPasscode()) {
    return res.status(401).json({ error: 'Mật mã cũ không chính xác.' });
  }
  if (!newPass || newPass.trim().length < 4) {
    return res.status(400).json({ error: 'Mật mã mới phải có ít nhất 4 ký tự.' });
  }
  saveTeacherPasscode(newPass.trim());
  res.json({ success: true, message: 'Đổi mật mã thành công!' });
});

app.get('/api/teacher/submissions', (req, res) => {
  if (!verifyTeacher(req)) {
    return res.status(401).json({ error: 'Mật mã không chính xác.' });
  }
  const subs = getSubmissions();
  res.json(subs);
});

app.delete('/api/teacher/submissions/:id', (req, res) => {
  if (!verifyTeacher(req)) {
    return res.status(401).json({ error: 'Mật mã không chính xác.' });
  }
  const id = req.params.id;
  const subs = getSubmissions().filter(s => s.id !== id && String(s.timestamp) !== id);
  saveSubmissions(subs);
  res.json({ success: true });
});

app.get('/api/teacher/blocked', (req, res) => {
  if (!verifyTeacher(req)) {
    return res.status(401).json({ error: 'Mật mã không chính xác.' });
  }
  res.json(getBlockedList());
});

app.post('/api/teacher/block', (req, res) => {
  if (!verifyTeacher(req)) {
    return res.status(401).json({ error: 'Mật mã không chính xác.' });
  }
  const { name, className } = req.body;
  if (!name || !className) {
    return res.status(400).json({ error: 'Thiếu tên hoặc lớp.' });
  }
  const key = `${name.trim()}_${className.trim()}`;
  const list = getBlockedList();
  if (!list.includes(key)) {
    list.push(key);
    saveBlockedList(list);
  }
  res.json({ success: true, blockedList: list });
});

app.post('/api/teacher/unblock', (req, res) => {
  if (!verifyTeacher(req)) {
    return res.status(401).json({ error: 'Mật mã không chính xác.' });
  }
  const { key } = req.body;
  let list = getBlockedList();
  list = list.filter(k => k.toLowerCase() !== (key || '').toLowerCase());
  saveBlockedList(list);
  res.json({ success: true, blockedList: list });
});

// Production & Dev server mounting
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌸 Lớp Học Văn Vui Vẻ Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
