# Smart City 3D – Sa bàn tương tác

Trang trải nghiệm bất động sản 3D chạy hoàn toàn trên trình duyệt (Three.js, không cần server riêng).

## 3 chế độ xem
| Chế độ | Mô tả |
|---|---|
| **Ảnh thực tế** | Ảnh toàn cảnh kéo / phóng to (chuột, cuộn, chụm 2 ngón). Bấm các điểm sáng để xem thông tin, nút "Xem trên sa bàn 3D" bay tới đúng vị trí. |
| **Sa bàn 3D** | Mô hình xoay 360°: hồ phản chiếu, cầu đèn, quảng trường nhạc nước, sân bóng, các tòa & cần cẩu. Chế độ Ngày / Hoàng hôn / Đêm. |
| **Tour 360°** | Đi qua các điểm tham quan, bấm mũi tên để chuyển cảnh, kéo để nhìn xung quanh, cuộn để zoom. |

## Tính năng chính
- Rê chuột vào tòa → xem nhanh số căn trống. Bấm tòa → chọn tầng → mặt bằng căn (còn trống / giữ chỗ / đã bán) → chi tiết căn, giá.
- **Xem view từ căn**: đặt camera đúng vị trí cửa sổ căn hộ đã chọn.
- **Tìm căn** theo phân khu, loại căn, hướng, tầng, giá.
- **Vị trí**: vòng cung liên kết vùng kèm thời gian di chuyển.
- **Chụp ảnh sa bàn** (nút máy ảnh) → tải JPG về máy để đăng Facebook / Zalo.
- Form đăng ký nhận báo giá, nút gọi hotline & Zalo.
- Link chia sẻ thẳng tới tòa/tầng: `index.html#toa=S1&tang=12`, tour: `#tour=p-lake`, ảnh: `#anh`.

## Chỉnh nội dung
Mọi dữ liệu nằm trong **`data.js`** (không cần sửa `app.js`):
- `PROJECT` – tên, hotline, Zalo, `leadEndpoint` (URL nhận form: Google Apps Script, webhook CRM…; để trống thì lưu tạm trong trình duyệt).
- `ZONES`, `TOWERS` – phân khu, giá/m², số tầng, số căn/tầng, trạng thái xây dựng, vị trí trên sa bàn.
- `AMENITIES`, `LANDMARKS`, `PHOTO_HOTSPOTS`, `GALLERY`.
- `TOUR_POINTS` – điểm tham quan 360°. Có ảnh panorama thật (equirectangular tỉ lệ 2:1, chụp bằng flycam/máy 360°) thì bỏ vào `assets/` và điền `pano: 'assets/ten-anh.jpg'`; để trống thì cảnh được dựng từ mô hình 3D.

> ⚠️ Bảng hàng căn hộ hiện được **sinh ngẫu nhiên làm dữ liệu mẫu** (`UNITS` trong `app.js`). Khi có bảng hàng thật, thay bằng dữ liệu từ file JSON / Google Sheet.

## Chạy thử
Trang dùng ES module nên cần mở qua web server (không mở trực tiếp file):
```bash
cd smartcity-3d
python3 -m http.server 8000
# mở http://localhost:8000
```
Đưa lên hosting: upload nguyên thư mục `smartcity-3d/` (GitHub Pages, Netlify, Vercel, hosting thường đều chạy được). Thư viện Three.js đã nằm sẵn trong `vendor/`, không phụ thuộc CDN.

## Cấu trúc
```
index.html   – khung giao diện
style.css    – giao diện (desktop + mobile)
data.js      – dữ liệu dự án (chỉnh ở đây)
scene.js     – dựng mô hình 3D thủ tục
app.js       – điều khiển camera, panel, tìm căn, tour, ảnh
assets/      – ảnh dự án
vendor/      – Three.js r160 (MIT)
```
