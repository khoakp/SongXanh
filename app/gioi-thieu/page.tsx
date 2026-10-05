import type { Metadata } from 'next'
import { InfoPage, InfoSection, DownloadableAssets } from '@/components/info-page'

export const metadata: Metadata = { title: 'Giới thiệu | Sống Xanh Campus', description: 'Tìm hiểu về Sống Xanh Campus, nguồn số liệu và nhóm thực hiện.', openGraph: { title: 'Giới thiệu | Sống Xanh Campus', description: 'Tìm hiểu về Sống Xanh Campus.', images: ['/icon.svg'] } }

export default function AboutPage() {
  return <InfoPage eyebrow="Về dự án" title="Cùng nhau biến campus thành nơi xanh hơn." intro="Sống Xanh Campus giúp sinh viên biến những lựa chọn hằng ngày thành hành động có thể ghi nhận, đo lường và lan tỏa.">
    <InfoSection title="Sống Xanh Campus là gì?"><p>Đây là không gian để bạn khám phá thử thách, theo dõi tác động cá nhân và cùng bạn bè xây dựng thói quen bền vững trong trường học. Mỗi nhiệm vụ hoàn thành đều được ghi nhận theo dữ liệu hoạt động thực tế.</p></InfoSection>
    <InfoSection title="Nguồn số liệu"><p>Các bộ đếm và bảng xếp hạng lấy từ dữ liệu tài khoản, nhiệm vụ và kết quả trong hệ thống. Hệ số tác động được quản trị viên cấu hình trong cơ sở dữ liệu; khi chưa có bản ghi, chúng tôi hiển thị số 0 hoặc trạng thái trống thay vì ước đoán.</p></InfoSection>
    <InfoSection title="Nhóm thực hiện"><p>{process.env.NEXT_PUBLIC_PROJECT_TEAM || 'Thông tin nhóm thực hiện sẽ được cập nhật.'}</p><p className="mt-3">Trường: {process.env.NEXT_PUBLIC_PROJECT_SCHOOL || 'Chưa cập nhật.'}</p><p className="mt-3">Giảng viên hướng dẫn: {process.env.NEXT_PUBLIC_PROJECT_ADVISOR || 'Chưa cập nhật.'}</p></InfoSection><InfoSection title="Tài nguyên chia sẻ"><p>Tải poster, sticker hoặc khung ảnh đại diện “Tôi sống xanh” để lan tỏa thông điệp. Các tệp được tạo trực tiếp từ mẫu nhận diện chung của dự án.</p><DownloadableAssets /></InfoSection>
  </InfoPage>
}
