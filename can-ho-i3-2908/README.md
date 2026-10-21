# Căn hộ I3-2908 – Tham quan trực tuyến

Trang tham quan căn hộ dựng từ 5 ảnh phối cảnh nội thất, chạy hoàn toàn trên trình duyệt.

## 3 chế độ
| Chế độ | Mô tả |
|---|---|
| **Tham quan** | Đi từng phòng: kéo để nhìn quanh, cuộn/chụm để phóng to, nháy đúp để zoom vào điểm. Vòng tròn mũi tên = sang phòng khác (hiệu ứng zoom + chuyển cảnh), dấu **+** = thông tin nội thất. Mặt bằng nhỏ góc trái hiện vị trí & hướng nhìn. |
| **Sa bàn 3D** | Mô hình căn hộ minh họa xoay 360°, hạ/nâng tường, nhìn từ trên xuống. Bấm biểu tượng máy ảnh hoặc bấm vào phòng để vào tour. |
| **Thư viện ảnh** | Lưới ảnh + xem phóng to, chuyển ảnh bằng phím ← →. |

- Nút **Tự động**: tự lia qua từng phòng – bật lên rồi quay màn hình để làm video Reels / TikTok.
- Nút **Chia sẻ**: sao chép link mở đúng phòng đang xem, ví dụ `index.html#canh=bep`, `#sa-ban`, `#thu-vien`.
- **Thông tin căn** + form đặt lịch xem nhà, nút gọi hotline / Zalo.

## Chỉnh nội dung – file `data.js`
- `UNIT`: mã căn, dự án, chủ đầu tư, thông số (để trống `''` là tự ẩn), hotline, Zalo, `leadEndpoint` (URL nhận form, để trống thì form chỉ lưu tạm trên trình duyệt).
- `SCENES`: từng cảnh, ảnh, và các điểm bấm (`x`, `y` tính theo % ảnh).
- `PLAN`: mặt bằng minh họa (phòng, tường, cửa) dùng cho sa bàn 3D & mặt bằng nhỏ.

### Khi có ảnh panorama 360° thật
Chụp bằng máy 360° (Insta360, Ricoh Theta…) hoặc xuất từ phần mềm render (Lumion, Enscape, D5, 3ds Max + Corona/V-Ray) ở định dạng **equirectangular tỉ lệ 2:1** (vd 6000×3000). Chép vào `assets/` rồi điền `pano: 'assets/ten-anh.jpg'` cho cảnh tương ứng – cảnh đó sẽ xoay tròn 360°. Với cảnh pano, điểm bấm dùng `{ yaw, pitch }` (độ) thay cho `{ x, y }`.

## Chạy trên XAMPP
Chép thư mục `can-ho-i3-2908` vào `C:\xampp\htdocs\`, bật Apache, mở http://localhost/can-ho-i3-2908/
(phải mở qua `http://`, không bấm đúp file `index.html`).
