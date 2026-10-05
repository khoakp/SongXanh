import type { Metadata } from 'next'
import { InfoPage, InfoSection } from '@/components/info-page'

export const metadata: Metadata = { title: 'Quyền riêng tư | Sống Xanh Campus', description: 'Cách Sống Xanh Campus sử dụng và bảo vệ dữ liệu của bạn.', openGraph: { title: 'Quyền riêng tư | Sống Xanh Campus', description: 'Cách chúng tôi bảo vệ dữ liệu của bạn.', images: ['/icon.svg'] } }

export default function PrivacyPage() {
  return <InfoPage eyebrow="Minh bạch dữ liệu" title="Quyền riêng tư của bạn luôn được tôn trọng." intro="Chúng tôi chỉ sử dụng dữ liệu cần thiết để vận hành thử thách, tính tác động và giúp cộng đồng tiến bộ cùng nhau.">
    <InfoSection title="Dịch vụ được dùng"><p>Supabase lưu dữ liệu và hỗ trợ đăng nhập. Nếu dự án bật đăng nhập Google, Google xử lý bước xác thực tài khoản. Vercel Analytics có thể ghi nhận số liệu sử dụng tổng hợp để cải thiện trang.</p></InfoSection><InfoSection title="Dữ liệu và mục đích"><p>Chúng tôi lưu thông tin tài khoản, hoạt động thử thách, kết quả carbon, cam kết, huy hiệu và lựa chọn hiển thị tên để vận hành tính năng, tính tác động và hiển thị bảng xếp hạng.</p></InfoSection><InfoSection title="Thời gian lưu và quyền của bạn"><p>Dữ liệu được lưu trong thời gian tài khoản còn hoạt động hoặc theo thời gian cần thiết để vận hành hệ thống. Bạn có quyền xem, sửa hoặc yêu cầu xóa dữ liệu. Liên hệ qua email bên dưới để được hỗ trợ.</p></InfoSection>
    <InfoSection title="Tên hiển thị"><p>Bạn có thể bật tùy chọn ẩn tên. Khi đó, tên của bạn sẽ được hiển thị là “Ẩn danh” trên bảng xếp hạng và các khu vực công khai.</p></InfoSection>
    <InfoSection title="Liên hệ và an toàn"><p>Không chia sẻ mật khẩu. Nếu cần cập nhật, giải thích hoặc xóa dữ liệu, hãy liên hệ nhóm thực hiện qua địa chỉ ở trang Liên hệ. Chúng tôi không yêu cầu bạn gửi mật khẩu qua email.</p></InfoSection>
  </InfoPage>
}
