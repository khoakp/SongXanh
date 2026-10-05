import type { Metadata } from 'next'
import { ContactLink, InfoPage, InfoSection } from '@/components/info-page'

export const metadata: Metadata = { title: 'Liên hệ | Sống Xanh Campus', description: 'Liên hệ nhóm Sống Xanh Campus để gửi góp ý hoặc báo lỗi.', openGraph: { title: 'Liên hệ | Sống Xanh Campus', description: 'Gửi góp ý cho Sống Xanh Campus.', images: ['/icon.svg'] } }

export default function ContactPage() {
  return <InfoPage eyebrow="Kết nối với chúng tôi" title="Một góp ý nhỏ cũng tạo nên thay đổi lớn." intro="Bạn gặp lỗi, có ý tưởng cho thử thách mới hoặc muốn đồng hành cùng campus? Hãy gửi lời nhắn cho nhóm thực hiện.">
    <InfoSection title="Gửi email"><p className="mb-5">Vui lòng mô tả rõ vấn đề, trang bạn đang sử dụng và cách liên hệ phù hợp. Chúng tôi sẽ tiếp nhận và phản hồi khi có thể.</p><ContactLink /></InfoSection>
    <InfoSection title="Địa chỉ liên hệ"><ContactLink /></InfoSection><InfoSection title="Khi báo lỗi"><p>Nếu có thể, hãy gửi kèm ảnh chụp màn hình và thời điểm xảy ra lỗi. Không gửi mật khẩu hoặc thông tin nhạy cảm qua email.</p></InfoSection>
  </InfoPage>
}
