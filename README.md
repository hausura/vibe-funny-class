# Lớp Học Văn Vui Vẻ

Ứng dụng React/Vite với máy chủ Express. Các API chấm bài dùng Gemini và cần cấu hình `GEMINI_API_KEY` ở môi trường chạy.

## Đưa mã nguồn lên GitHub

1. Tạo một repository mới trên GitHub.
2. Trong thư mục dự án, chạy:

   ```bash
   git init
   git add .
   git commit -m "Prepare app for deployment"
   git branch -M main
   git remote add origin https://github.com/<username>/<repository>.git
   git push -u origin main
   ```

Không tạo hay commit file `.env` có khóa thật. `.env*` đã bị loại khỏi Git; chỉ `.env.example` được giữ làm mẫu.

## Deploy toàn bộ app bằng Docker trên Render

GitHub lưu mã nguồn, còn máy chủ Express cần một dịch vụ chạy app. Có thể kết nối repository với Render:

1. Tạo **Web Service** mới và kết nối repository GitHub.
2. Chọn runtime **Docker**; Render sẽ build từ `Dockerfile` trong repository.
3. Chọn gói **Free** nếu đang có sẵn trong dashboard.
4. Trong Environment, thêm `GEMINI_API_KEY` với giá trị khóa thật. Không ghi khóa vào Dockerfile, README, hoặc GitHub.
5. Deploy và mở URL mà Render cấp.

Gói miễn phí có thể tạm dừng dịch vụ khi không có truy cập và không hỗ trợ persistent disk. App hiện lưu bài nộp, danh sách chặn và mật mã giáo viên trong thư mục `data` dạng JSON, nên dữ liệu có thể mất khi instance khởi động lại hoặc deploy lại. Nếu cần lưu dữ liệu lâu dài, cần chuyển sang database hoặc dịch vụ lưu trữ persistent.

## Chạy local

```bash
npm install
npm run dev
```

Để gọi Gemini khi chạy local, tạo `.env.local` từ `.env.example` và thay placeholder bằng khóa thật. Đừng commit file đó.
