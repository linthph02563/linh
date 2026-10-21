// =====================================================================
//  DỮ LIỆU DỰ ÁN – chỉnh sửa tại đây, không cần đụng vào app.js
//  Toàn bộ số liệu (giá, số tầng, số căn, trạng thái...) là DỮ LIỆU MẪU
//  để demo. Hãy thay bằng bảng hàng thực tế trước khi đăng/chạy quảng cáo.
//  Toạ độ: 1 đơn vị ≈ 2m. Trục x: Tây → Đông, trục z: Bắc → Nam.
// =====================================================================

export const PROJECT = {
  brandTop: 'VINHOMES',
  brandMain: 'SMART CITY',
  tagline: 'Thành phố thông minh – Sống xanh giữa lòng phía Tây Hà Nội',
  address: 'Tây Mỗ – Đại Mỗ, Nam Từ Liêm, Hà Nội',
  hotline: '0900 000 000',
  zalo: 'https://zalo.me/0900000000',
  // URL nhận form đăng ký (Google Apps Script, webhook CRM...). Để trống = lưu tạm trên trình duyệt.
  leadEndpoint: '',
  intro:
    'Đại đô thị thông minh với hồ điều hòa trung tâm, công viên ven hồ, quảng trường, ' +
    'sân thể thao và hệ thống trường học – tất cả nằm trong bán kính đi bộ từ căn hộ.',
  stats: [
    { value: '280 ha', label: 'Quy mô đô thị' },
    { value: '8', label: 'Tòa trong mô hình' },
    { value: '6', label: 'Nhóm tiện ích nội khu' },
    { value: '24/7', label: 'An ninh thông minh' },
  ],
};

export const ZONES = [
  { id: 'sapphire', name: 'The Sapphire', color: '#4fa3ff', pricePerM2: 52 }, // triệu/m²
  { id: 'tonkin', name: 'The Tonkin', color: '#ffb547', pricePerM2: 58 },
  { id: 'canopy', name: 'The Canopy', color: '#5fe3a1', pricePerM2: 63 },
];

// status: 'done' = đã hoàn thiện, 'building' = đang xây (builtFloors = số tầng đã lên)
export const TOWERS = [
  { id: 'S1', zone: 'sapphire', x: -305, z: -215, w: 30, d: 22, floors: 39, unitsPerFloor: 14, status: 'done', handover: 'Đã bàn giao' },
  { id: 'S2', zone: 'sapphire', x: -262, z: -232, w: 30, d: 22, floors: 41, unitsPerFloor: 14, status: 'done', handover: 'Đã bàn giao' },
  { id: 'S3', zone: 'sapphire', x: -222, z: -200, w: 32, d: 24, floors: 43, unitsPerFloor: 16, status: 'done', handover: 'Đã bàn giao' },
  { id: 'T1', zone: 'tonkin', x: 62, z: -240, w: 26, d: 22, floors: 32, unitsPerFloor: 12, status: 'done', handover: 'Q4/2026', led: true },
  { id: 'T2', zone: 'tonkin', x: 98, z: -262, w: 28, d: 22, floors: 36, unitsPerFloor: 12, status: 'done', handover: 'Q4/2026', led: true },
  { id: 'C1', zone: 'canopy', x: 150, z: -280, w: 30, d: 24, floors: 40, unitsPerFloor: 16, status: 'building', builtFloors: 33, handover: 'Q2/2027' },
  { id: 'C2', zone: 'canopy', x: 196, z: -262, w: 30, d: 24, floors: 42, unitsPerFloor: 16, status: 'building', builtFloors: 37, handover: 'Q2/2027', led: true },
  { id: 'C3', zone: 'canopy', x: 238, z: -290, w: 28, d: 22, floors: 38, unitsPerFloor: 14, status: 'building', builtFloors: 27, handover: 'Q4/2027' },
];

// Loại căn theo vị trí trên mặt bằng tầng (góc / giữa)
export const UNIT_TYPES = {
  corner: [{ type: '3PN', area: [92, 108] }, { type: '2PN+1', area: [74, 82] }],
  middle: [{ type: '2PN', area: [59, 69] }, { type: '1PN+1', area: [43, 50] }, { type: 'Studio', area: [28, 33] }],
};

export const AMENITIES = [
  { id: 'lake', name: 'Hồ điều hòa trung tâm', icon: 'water', pos: [-40, 4, 110],
    desc: 'Mặt hồ rộng hàng chục ha, phản chiếu toàn cảnh đô thị lúc hoàng hôn. Lý tưởng để chạy bộ, đạp xe ven hồ.' },
  { id: 'bridge', name: 'Cầu dạo ánh sáng', icon: 'spark', pos: [118, 6, 70],
    desc: 'Cây cầu cong phát sáng vắt ngang mặt hồ – điểm check-in nổi bật mỗi tối.' },
  { id: 'amphi', name: 'Quảng trường & nhạc nước', icon: 'music', pos: [20, 10, -80],
    desc: 'Khán đài ngoài trời hình rẻ quạt cùng hồ nhạc nước – nơi tổ chức sự kiện cộng đồng.' },
  { id: 'pitch', name: 'Sân bóng & thể thao', icon: 'ball', pos: [128, 6, -95],
    desc: 'Sân bóng cỏ nhân tạo, khu vui chơi trẻ em và sân tập thể thao đa năng.' },
  { id: 'school', name: 'Trường học liên cấp', icon: 'school', pos: [112, 22, -190],
    desc: 'Hệ thống trường học liên cấp ngay trong nội khu, cách các tòa căn hộ vài phút đi bộ.' },
  { id: 'kiosk', name: 'Đảo chòi nghỉ ven hồ', icon: 'leaf', pos: [168, 8, 150],
    desc: 'Đảo nhỏ với chòi nghỉ, khu BBQ và ghế ngắm hồ cho gia đình cuối tuần.' },
];

// Liên kết vùng – angle: hướng tính theo độ (0 = Bắc, 90 = Đông), dist: khoảng cách hiển thị trên mô hình
export const LANDMARKS = [
  { name: 'Đại lộ Thăng Long', time: '2 phút', angle: 330, dist: 520 },
  { name: 'SVĐ Quốc gia Mỹ Đình', time: '10 phút', angle: 15, dist: 700 },
  { name: 'Keangnam – Phạm Hùng', time: '15 phút', angle: 50, dist: 850 },
  { name: 'Hồ Hoàn Kiếm', time: '25 phút', angle: 80, dist: 1050 },
  { name: 'Vành đai 3.5', time: '5 phút', angle: 200, dist: 560 },
  { name: 'Đô thị Hà Đông', time: '12 phút', angle: 140, dist: 760 },
];

export const GALLERY = [
  { src: 'assets/toan-canh.jpg', title: 'Toàn cảnh hoàng hôn bên hồ điều hòa' },
];

// Điểm bấm trên ảnh thực tế (toạ độ % theo chiều ngang / dọc của ảnh).
// link: id tiện ích hoặc id tòa để bay tới trên sa bàn 3D.
export const PHOTO_HOTSPOTS = [
  { x: 15, y: 44, title: 'Phân khu The Sapphire', text: 'Cụm 3 tòa căn hộ cao tầng đã bàn giao, view trực diện hồ điều hòa.', link: 'tower:S3' },
  { x: 66, y: 41, title: 'The Tonkin', text: 'Hai tòa với dải đèn LED mặt đứng, sát quảng trường trung tâm.', link: 'tower:T2' },
  { x: 82, y: 36, title: 'The Canopy (đang xây)', text: 'Cụm tòa mới đang thi công, hàng chọn đẹp – giá tốt giai đoạn đầu.', link: 'tower:C2' },
  { x: 40, y: 86, title: 'Hồ điều hòa', text: 'Mặt hồ phản chiếu toàn cảnh đô thị – lá phổi xanh của dự án.', link: 'amenity:lake' },
  { x: 72, y: 80, title: 'Cầu dạo ánh sáng', text: 'Cây cầu cong phát sáng vắt ngang mặt hồ.', link: 'amenity:bridge' },
  { x: 51, y: 64, title: 'Quảng trường & nhạc nước', text: 'Khán đài rẻ quạt cùng hồ nhạc nước.', link: 'amenity:amphi' },
  { x: 67, y: 67, title: 'Sân bóng & khu vui chơi', text: 'Sân cỏ nhân tạo và sân chơi trẻ em.', link: 'amenity:pitch' },
  { x: 65, y: 53, title: 'Trường học liên cấp', text: 'Trường học ngay trong nội khu.', link: 'amenity:school' },
  { x: 83, y: 91, title: 'Đảo chòi nghỉ', text: 'Chòi nghỉ, khu BBQ ven hồ.', link: 'amenity:kiosk' },
];

// Các điểm tham quan 360°. Nếu có ảnh panorama thật (equirectangular 2:1, vd 8000x4000),
// điền vào `pano` – trang sẽ dùng ảnh đó. Để trống thì cảnh 360° được dựng từ mô hình 3D.
// links: các điểm có thể bấm chuyển tới từ điểm này.
export const TOUR_POINTS = [
  { id: 'p-lake', name: 'Bờ hồ phía Nam', pos: [-20, 4, 225], look: [0, 30, -100], pano: '', links: ['p-bridge', 'p-plaza', 'p-sky'] },
  { id: 'p-bridge', name: 'Giữa cầu ánh sáng', pos: [105, 5, 60], look: [-100, 20, 80], pano: '', links: ['p-lake', 'p-kiosk', 'p-plaza'] },
  { id: 'p-plaza', name: 'Quảng trường nhạc nước', pos: [20, 4, -40], look: [20, 10, 100], pano: '', links: ['p-lake', 'p-bridge', 'p-pitch'] },
  { id: 'p-pitch', name: 'Sân bóng', pos: [100, 3, -110], look: [150, 50, -280], pano: '', links: ['p-plaza', 'p-sky'] },
  { id: 'p-kiosk', name: 'Đảo chòi nghỉ', pos: [168, 4, 158], look: [-50, 20, 50], pano: '', links: ['p-bridge', 'p-lake'] },
  { id: 'p-sky', name: 'Flycam trên hồ', pos: [10, 120, 300], look: [0, 40, -150], pano: '', links: ['p-lake', 'p-plaza'] },
];
