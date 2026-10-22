import html2canvas from 'html2canvas';

export function downloadWordDocument(
  name: string,
  className: string,
  formattedHtml: string,
  score?: string
) {
  const safeName = (name || 'HocSinh').replace(/\s+/g, '_');
  const now = new Date().toLocaleDateString('vi-VN');

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Phiếu Chấm Văn - ${name}</title>
<style>
  body { font-family: 'Times New Roman', serif; font-size: 13pt; line-height: 1.5; color: #111827; margin: 40px; }
  .header-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
  .header-table td { vertical-align: top; }
  .title { text-align: center; font-size: 18pt; font-weight: bold; color: #be185d; margin: 15px 0 5px 0; text-transform: uppercase; }
  .subtitle { text-align: center; font-size: 12pt; font-style: italic; color: #4b5563; margin-bottom: 25px; }
  .info-box { background: #fdf2f8; border: 1.5pt solid #f472b6; padding: 12px; margin-bottom: 20px; border-radius: 8px; }
  .score-badge { font-size: 22pt; font-weight: bold; color: #e11d48; text-align: center; margin: 15px 0; }
  h3 { color: #0369a1; background: #e0f2fe; padding: 6px 12px; border-left: 5pt solid #0284c7; margin-top: 20px; font-size: 14pt; }
  b { color: #1d4ed8; }
  .footer { margin-top: 40px; width: 100%; }
</style>
</head>
<body>
  <table class="header-table">
    <tr>
      <td style="text-align: left; width: 60%;">
        <strong>TRƯỜNG TIỂU HỌC NGỌC CHÂU</strong><br>
        <em>Tổ Chuyên môn Khối 4 - 5</em>
      </td>
      <td style="text-align: right; width: 40%;">
        <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br>
        <em>Độc lập - Tự do - Hạnh phúc</em>
      </td>
    </tr>
  </table>

  <div class="title">PHIẾU CHẤM VĂN TIỂU HỌC</div>
  <div class="subtitle">Lớp Học Văn Vui Vẻ - Bản quyền thuộc về Nguyễn Hà Nam</div>

  <div class="info-box">
    <strong>Họ và tên học sinh:</strong> ${name} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    <strong>Lớp:</strong> ${className} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
    <strong>Thời gian chấm:</strong> ${now}
    ${score ? `<div class="score-badge">ĐIỂM: ${score}</div>` : ''}
  </div>

  <div class="content">
    ${formattedHtml}
  </div>

  <table class="footer">
    <tr>
      <td style="width: 50%;"></td>
      <td style="text-align: center; width: 50%;">
        <em>Ngày ... tháng ... năm 202...</em><br>
        <strong>NGƯỜI CHẤM BÀI</strong><br><br><br><br>
        <strong>Nguyễn Hà Nam</strong>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Phieu_Cham_${safeName}_${className}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadElementAsImage(element: HTMLElement, filename: string): Promise<void> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error('Failed to export image:', err);
    throw err;
  }
}
