// Sample realistic handwritten essay image generator in Base64
// Creates an image of a primary school student's notebook page with ruled grid and Vietnamese handwriting
export function generateSampleHandwritingImage(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background: notebook paper tone
  ctx.fillStyle = '#fffdfa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Red margin line
  ctx.strokeStyle = '#f87171';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(90, 0);
  ctx.lineTo(90, canvas.height);
  ctx.stroke();

  // Blue grid lines (ô li học sinh tiểu học)
  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = 0.8;
  for (let y = 40; y < canvas.height; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  for (let x = 40; x < canvas.width; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Header
  ctx.fillStyle = '#1e3a8a';
  ctx.font = 'bold 20px "Comic Sans MS", cursive, sans-serif';
  ctx.fillText('Bài Làm Văn - Lớp 5A', 300, 75);

  // Student essay text in dark blue ink
  ctx.fillStyle = '#1e40af';
  ctx.font = '19px "Comic Sans MS", cursive, sans-serif';

  const lines = [
    'Đề bài: Tả cây bàng trên sân trường em.',
    '',
    '    Mỗi sáng mai đến trường, bước chân qua cổng,',
    'em luôn nhìn thấy cây bàng già đứng sừng sững',
    'nơi góc sân. Cây bàng to lớn lắm, hai bạn học',
    'sinh chúng em ôm không xuể. Thân cây màu nâu',
    'xù xì, in hằn những vết nứt thời gian.',
    '',
    '    Vào mùa hạ, từng vòm lá bàng xanh mướt đan',
    'xen vào nhau như một chiếc ô khổng lồ xòe bóng',
    'mát cho chúng em vui đùa. Giờ ra chơi, chúng',
    'em thường tụ họp dưới gốc bàng để đọc truyện',
    'và chơi nhảy dây. Tiếng ve sầu râm ran trên cành',
    'như hòa cùng tiếng cười nói rộn rã.',
    '',
    '    Em rất yêu quý cây bàng trường em. Cây đã',
    'gắn bó với bao kỷ niệm tuổi thơ tươi đẹp dưới',
    'mái trường tiểu học thân thương này.'
  ];

  let lineY = 125;
  for (const line of lines) {
    if (line) {
      ctx.fillText(line, 110, lineY);
    }
    lineY += 40;
  }

  return canvas.toDataURL('image/jpeg', 0.85);
}
