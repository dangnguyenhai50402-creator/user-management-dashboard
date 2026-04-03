Cài đặt & Chạy dự án
1. Clone dự án
git clone <your-repo-url>
cd user-management-dashboard
2. Cài đặt các thư viện
npm install
3. Chạy server phát triển
npm run dev
Mở trình duyệt tại: http://localhost:3000

Thư viện & lý do sử dụng
Core
  Next.js 16
→ Sử dụng App Router, hỗ trợ SSR/CSR
  React 19
→ Tối ưu hiệu năng và hooks
Quản lý state & dữ liệu
  @tanstack/react-query
→ Quản lý dữ liệu từ API, caching, refetch tự động
  axios
→ Gửi request HTTP đơn giản, dễ dùng
  zustand
→ Quản lý global state nhẹ, ít boilerplate
Form & Validation
  react-hook-form
→ Form hiệu năng cao, dễ xử lý input
  zod + @hookform/resolvers
→ Kiểm tra dữ liệu theo schema, hỗ trợ TypeScript
UI & Styling
  @mantine/core + @mantine/hooks
→ Các component UI sẵn có: Table, Form, Modal, Button...
  @tabler/icons-react
→ Bộ icon hiện đại, đồng bộ
  tailwindcss
→ Tùy biến layout nhanh với class tiện ích
Cải thiện UX
  react-hot-toast
→ Hiển thị thông báo thành công hoặc lỗi

Những cải thiện trong tương lai:
Kết nối API thật. Thay dữ liệu giả bằng REST API
Authentication & Authorization. Bảo vệ route, phân quyền admin/user
UX nâng cao
Modal confirm thay alert
Skeleton loading khi fetch dữ liệu
Validate form đẹp hơn
