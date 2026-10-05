# Sống Xanh Campus

Nền tảng giúp sinh viên đo lường tác động môi trường, tham gia thử thách bền vững và lan tỏa lối sống xanh trong campus.

## Thứ tự triển khai Supabase
Chạy theo thứ tự: `scripts/schema.sql` → `scripts/rls.sql` → `scripts/functions.sql` → `scripts/seed.sql`. Sau đó chạy migration trong `scripts/2026-10-05-privacy-and-deletion.sql` và kiểm tra RLS trước khi dùng production.

## Cài đặt và chạy dự án

### Yêu cầu
- Node.js 18+
- pnpm 12.3.4 (see `packageManager` in `package.json`)
- Tài khoản Supabase

### Các bước cài đặt

1. **Clone dự án**
   ```bash
   git clone <repository-url>
   cd song-xanh
   ```

2. **Cài đặt dependencies**
   ```bash
   pnpm install
   ```

3. **Cấu hình biến môi trường**
   ```bash
   cp .env.example .env.local
   ```
   
   Sau đó cập nhật các giá trị trong `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` - URL của dự án Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anonymous key từ Supabase
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Publishable key từ Supabase
   - `NEXT_PUBLIC_CONTACT_EMAIL` - Email liên hệ cho trang liên hệ

4. **Chạy máy chủ phát triển**
   ```bash
   pnpm dev
   ```
   
   Ứng dụng sẽ khả dụng tại `http://localhost:3000`

### Nhập dữ liệu mẫu

Dữ liệu mẫu được tạo thông qua giao diện quản trị tại `/quan-tri`.

**Dữ liệu mẫu bao gồm:**
- Bài viết (kiến thức, gương sáng, tin xanh)
- Câu hỏi đúng/sai (quiz)
- Thử thách (challenge) với điểm và hệ số tác động
- Chiến dịch với huy hiệu và thách thức
- Hệ số phát thải và quy đổi tác động

**Công cụ quản trị:**
- Tạo và sửa bài viết với biểu mẫu WYSIWYG
- Quản lý thử thách, điểm và độ khó

- Xuất báo cáo CSV với tiêu đề tiếng Việt
- Ghi nhật ký mọi thay đổi (ai, khi nào, đổi gì)

### Cấu trúc dự án

```
song-xanh/
├── app/                      # Next.js app router pages
│   ├── page.tsx             # Trang chủ
│   ├── profile/             # Hồ sơ người dùng
│   ├── quan-tri/            # Quản trị nội dung
│   ├── thu-thach/           # Thử thách
│   ├── tro-choi/            # Trò chơi/Carbon
│   ├── cam-ket/             # Cam kết bền vững
│   ├── guong-sang/          # Gương sáng
│   ├── xep-hang/            # Xếp hạng
│   ├── chien-dich/          # Chiến dịch
│   └── api/                 # API routes
├── components/              # React components
├── public/                  # Static assets
├── app/globals.css          # Global styles
└── next.config.mjs          # Next.js config

```

### Tính năng chính

**Trang Chủ**
- Xếp hạng top người dùng
- Thử thách nổi bật
- Thẻ "Bạn có biết?" từ dữ liệu thực
- Cây ảo theo cấp người dùng
- Banner chiến dịch hiện tại

**Thử Thách**
- Danh sách thử thách theo chủ đề
- Giao diện để hoàn thành nhiệm vụ


**Trò Chơi - Carbon Calculator**
- Tính toán lượng carbon tiết kiệm
- Chia sẻ kết quả

**Hồ Sơ**
- Cây ảo với huy hiệu
- Streak (ngày liên tiếp)
- Lịch sử hoạt động
- Tùy chọn ẩn tên
- Yêu cầu xóa dữ liệu

**Cam Kết Bền Vững**
- Tạo thiệp cam kết (PNG)
- Lọc theo lớp/khoa
- Hiển thị tên người dùng (nếu chọn)

**Gương Sáng**
- Hiển thị chỉ bài có nhân vật đồng ý
- Nút hành động liên quan (thử thách, cam kết)
- Hiển thị nguồn rõ ràng

**Quản Trị**
- Soạn bài viết (tiêu đề, slug, loại, tóm tắt, nội dung, ảnh)
- Tạo câu hỏi quiz
- Quản lý thử thách và huy hiệu
- Quản lý chiến dịch
- Sửa hệ số tác động

- Xuất CSV với tiêu đề tiếng Việt
- Ghi nhật ký thay đổi

### Bảo mật

- Tất cả logic liên quan đến điểm, quyền, đáp án được kiểm tra trên máy chủ
- Row Level Security (RLS) trên Supabase cho toàn bộ dữ liệu người dùng
- Mọi mốc ngày tính theo múi giờ Asia/Ho_Chi_Minh
- Không tin dữ liệu từ trình duyệt - xác thực lại trên server
- Các API quản trị kiểm tra vai trò trước xử lý

### Phát triển

**Chạy các kiểm tra**
```bash
# Build kiểm tra
pnpm build

# Type checking
pnpm typecheck
```

**Format code**
```bash
# Đã được cấu hình qua next.config
# Mã được tổ chức theo module, hàm được tách biệt
```

### Triển khai

Dự án được triển khai trên Vercel. Mỗi push lên `main` sẽ tự động triển khai.

### Liên hệ & Hỗ trợ

- Email: Xem biến `NEXT_PUBLIC_CONTACT_EMAIL`
- Issues: Tạo issue trên GitHub repository
- Feedback: Gửi qua hình thức liên hệ trong ứng dụng

### License

Dự án này được phát triển cho mục đích giáo dục và bền vững.

---

**Cập nhật cuối cùng:** October 2026
