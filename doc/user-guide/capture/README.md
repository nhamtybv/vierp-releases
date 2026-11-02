# Chụp lại hình cho hướng dẫn sử dụng

Script này tạo lại toàn bộ `docs/user-guide/images/` khi giao diện thay đổi. Dùng Playwright đã có trong `web/node_modules`; cần thêm `cwebp` để nén ảnh (`brew install webp` trên macOS, `apt install webp` trên Linux).

```sh
make build                                   # luôn build trước để ảnh khớp giao diện hiện tại
(cd web && npx playwright install chromium)  # lần đầu
node docs/user-guide/capture/capture.mjs     # khoảng 4 phút
node docs/user-guide/capture/capture.mjs 06  # chỉ chương có khoá bắt đầu bằng 06 (xem lưu ý bên dưới)
```

Script làm theo thứ tự:
1. Mở `bin/vierp` trên cổng trống ngẫu nhiên (không phải 8080/8081) với DB SQLite tạm và `EINVOICE_PROVIDER=sandbox`.
2. Nạp dữ liệu mẫu bằng `scripts/seed-demo/seed.mjs` (khôi phục `result.json` sau đó).
3. Chạy `steps.mjs` theo thứ tự, đăng nhập từng người dùng mẫu đúng như người làm việc đó ngoài thực tế (mật khẩu `Demo@2026`; `admin` dùng mật khẩu tạm của script).
4. Lưu ảnh WebP lossless (chụp PNG rồi nén bằng `cwebp -lossless -z 9`, nhỏ khoảng 1/3 so với PNG), rồi tắt máy chủ và xoá toàn bộ tệp tạm.

Ghi chú:
- Đồng hồ trình duyệt được cố định ở 01/11/2026 09:00 (ngày của dữ liệu mẫu) để các trạng thái quá hạn/hôm nay ổn định. **Đồng hồ máy chủ là giờ thật**: ngày chứng từ mới do máy chủ gán và giờ trong nhật ký là giờ thật khi chạy. Nút **Điền công chuẩn** và **Check-in** theo giờ máy chủ, nên bảng chấm công tháng 11 chụp ra ít ngày công.
- Chế độ chụp: 1280x800 (máy tính), 390x844 (điện thoại, các ảnh `*-phone`), WebP lossless tỉ lệ 1. Khung đỏ là điểm được nhấn mạnh (chèn bằng CSS khi chụp).
- Hộp thoại `confirm()` của trình duyệt và PDF không chụp được khi chạy ẩn; script tự chấp nhận hộp thoại và chụp kết quả.
- Mã truy cập API được làm mờ trong ảnh và thu hồi ngay; không có bí mật thật nào được lưu.
- Các chương sau dùng dữ liệu do chương trước tạo (đơn bán, hoá đơn, bảng lương...), nên nên chạy cả script. Tham số chương chỉ tiện khi chương đó không phụ thuộc chương trước (01, 02, 03).
- Khoá chương: 01 02 03 04 (chứa cả chương 5 Kho) 06 07 08 09 10 11. Khoá không khớp thì script báo lỗi và thoát mã 2. Script thoát mã 1 nếu có bước lỗi hoặc server không khởi động được; Ctrl+C/SIGTERM tắt server và xoá thư mục tạm.
- Mỗi bước (`sh.step`) lỗi sẽ được ghi log và bỏ qua; cuối cùng script in danh sách bước lỗi. Sửa selector trong `steps.mjs` khi giao diện đổi.
- Sau khi chạy, mở lại các ảnh trong `images/` để kiểm tra bằng mắt; hướng dẫn trong `docs/user-guide/*.md` tham chiếu đúng tên tệp ảnh.
