# Hướng dẫn sử dụng ViERP

ViERP là phần mềm quản lý doanh nghiệp (ERP) chạy ngay trên trình duyệt: quản lý khách hàng, bán hàng, kho, kế toán, nhân sự và tiền lương trong một hệ thống. Mỗi người chỉ thấy những menu đúng với quyền của mình, nên có thể bạn sẽ không thấy một vài mục được nhắc trong tài liệu này. Đó là bình thường.

Tài liệu viết cho nhân viên không chuyên kỹ thuật. Mỗi việc đều có các bước đánh số và một hình chụp màn hình ngay sau bước đó.

## Mục lục

| Chương | Dành cho ai |
|---|---|
| [1. Bắt đầu](01-bat-dau.md): đăng nhập, giao diện, menu, nhật ký chứng từ, quy tắc nháp/duyệt | Mọi người |
| [2. Danh bạ và Sản phẩm](02-danh-ba-san-pham.md) | Kinh doanh, mua hàng, kế toán |
| [3. CRM (chăm sóc khách hàng)](03-crm.md): cơ hội, lịch chăm sóc, báo giá | Nhân viên và trưởng phòng kinh doanh |
| [4. Bán hàng](04-ban-hang.md): báo giá, đơn bán, xác nhận, tạo hoá đơn | Kinh doanh |
| [5. Kho](05-kho.md): tồn kho, xuất kho, giao một phần, nhập kho | Thủ kho, mua hàng |
| [6. Kế toán](06-ke-toan.md): hoá đơn, HĐĐT, thu tiền, bút toán, đối chiếu ngân hàng, báo cáo | Kế toán |
| [7. Nhân sự](07-nhan-su.md): nghỉ phép, chấm công, hồ sơ, hợp đồng, bảng chấm công | Mọi nhân viên (phần A), bộ phận nhân sự (phần B) |
| [8. Tiền lương](08-tien-luong.md): bảng lương, chi lương, tạm ứng, phiếu lương | Nhân sự, giám đốc, mọi nhân viên |
| [9. Nhập dữ liệu từ Excel/CSV](09-nhap-du-lieu.md) | Quản trị, người triển khai |
| [10. Quản trị hệ thống](10-quan-tri.md): người dùng, vai trò, công ty, kế toán, mẫu in | Quản trị viên |
| [11. Kết nối AI](11-ket-noi-ai.md): mã truy cập API | Quản trị, người dùng nâng cao |

## Cách đọc tài liệu

- Mỗi việc gồm: mục đích, các bước đánh số (tên nút và nhãn ghi đúng như trên màn hình), kết quả, và lưu ý.
- Tên nút/nhãn in **đậm**, ví dụ nhấn **Lưu**. Khung đỏ trên hình là chỗ cần nhấn hoặc cần chú ý.
- Chương 4 đến 6 nối tiếp nhau theo một chuỗi nghiệp vụ: báo giá, đơn bán, giao hàng, hoá đơn, thu tiền. Hình trong các chương đó dùng cùng một đơn hàng ví dụ.
- Một số số liệu kế toán ghi theo hệ thống tài khoản mặc định (TT200/TT99). Số hiệu tài khoản có thể khác nếu công ty đã đổi cấu hình tại Thiết lập, Kế toán.

## Dữ liệu và tài khoản minh hoạ

Mọi hình chụp lấy từ bộ dữ liệu mẫu của "Công ty TNHH Công nghệ Minh Phát" (bán linh kiện máy tính và dịch vụ IT, 100 nhân sự). Tên người, công ty, mã số thuế đều là hư cấu. Ngày trên hình là 01/11/2026. Mật khẩu của các tài khoản nhân viên mẫu là `Demo@2026`.

| Tài khoản | Vai trò | Dùng trong chương |
|---|---|---|
| `trung.bx` | Nhân viên kinh doanh | 1, 2, 3, 4, 7, 8 |
| `toan.pa` | Trưởng phòng kinh doanh (xác nhận đơn, thấy mọi cơ hội) | 3, 4 |
| `thuy.dd` | Mua hàng (tạo phiếu nhập, sản phẩm) | 2, 5 |
| `thang.pd`, `dung.dd` | Thủ kho | 5 |
| `van.dn`, `quynh.nb`, `yen.pd`, `my.tp` | Kế toán | 6 |
| `huy.pt`, `dat.dv` | Nhân sự | 7, 8 |
| `hoa.tp` | Giám đốc (hạch toán lương, chi lương) | 8, 11 |
| `admin` | Quản trị hệ thống | 9, 10 |

Cách chụp lại toàn bộ hình khi giao diện thay đổi: xem [capture/README.md](capture/README.md).

## Thuật ngữ

- **Báo giá**: đơn bán ở trạng thái nháp, chưa cam kết với khách.
- **Xác nhận** (đơn bán, phiếu kho), **Ghi sổ** (hoá đơn), **Duyệt** (phiếu thu, bút toán, tạm ứng, hợp đồng, nghỉ phép), **Hạch toán** (bảng lương): cùng là bước "chốt" một chứng từ nháp, tuỳ loại chứng từ mà tên khác nhau.
- **Phiếu kho**: phiếu nhập kho hoặc phiếu xuất kho; trạng thái "Chờ xử lý" hoặc "Hoàn tất".
- **Backorder (phiếu giao phần còn lại)**: phiếu xuất cho phần còn thiếu, tự tạo khi giao một phần.
- **Bút toán**: dòng Nợ/Có ghi vào sổ cái. **Bút toán đảo**: bút toán ngược để huỷ một chứng từ đã ghi sổ.
- **HĐĐT**: hoá đơn điện tử (có Ký hiệu, Số HĐ, Mã tra cứu).
- **Công nợ phải thu**: tiền khách còn nợ. **Cấn trừ**: gán phiếu thu vào hoá đơn. "Chưa cấn trừ (tạm ứng)" là tiền khách trả trước.
- **Ngày khoá sổ**: không ghi được bút toán có ngày từ ngày này trở về trước.
- **Tài khoản hạch toán**: tài khoản kế toán mà từng loại nghiệp vụ tự ghi vào (theo TT200/TT99/TT133).
- **Giá vốn BQ**: giá vốn bình quân gia quyền di động của hàng tồn.
- **Cơ hội, Giai đoạn, Lịch chăm sóc**: các khái niệm của CRM.
- **Công chuẩn**: số ngày công chuẩn của tháng. **Duyệt và khoá**: chốt bảng chấm công.
- **Phiếu lương, Thực lĩnh, Tạm ứng, Phụ lục**: phiếu lương từng người; tiền thực nhận; tiền ứng trước lương; phụ lục hợp đồng thay đổi lương từ một ngày.
- **Người nhập, Tự duyệt**: người nhập là người lưu cuối cùng một chứng từ; "tự duyệt" là quyền duyệt chứng từ chính mình nhập.
- **Trao đổi & nhật ký**: khung ghi lịch sử và ghi chú ở cuối mỗi chứng từ.
- Số lượng có thể lẻ (1,5 m); tiền luôn là số nguyên đồng (VND).
