// =====================================================================
//  DỮ LIỆU CĂN HỘ – chỉnh sửa tại đây, không cần đụng vào app.js
//  Thông số để trống ('') sẽ tự ẩn trên trang. Mặt bằng 3D là MINH HỌA,
//  bố trí phòng ước lượng theo ảnh phối cảnh – không phải bản vẽ kỹ thuật.
// =====================================================================

export const UNIT = {
  code: 'I3-2908',
  title: 'Căn hộ I3-2908',
  project: 'Imperia Smart City',
  building: 'Tòa I3',
  developer: 'MIK Group',
  address: 'Vinhomes Smart City, Tây Mỗ, Nam Từ Liêm, Hà Nội',
  intro: 'Căn hộ hoàn thiện nội thất phong cách Japandi: gỗ sồi sáng màu, cánh tủ mây đan, ' +
    'đèn LED hắt ấm áp và tối ưu lưu trữ ở từng góc nhỏ.',
  specs: [
    { label: 'Tầng', value: '29' },
    { label: 'Phòng ngủ', value: '2' },
    { label: 'Diện tích', value: '' },       // vd: '69,5 m² (tim tường)'
    { label: 'Hướng ban công', value: '' },  // vd: 'Đông Nam'
    { label: 'Nội thất', value: 'Full nội thất gỗ tông sồi' },
    { label: 'Pháp lý', value: '' },         // vd: 'Hợp đồng mua bán'
    { label: 'Giá bán', value: 'Liên hệ' },
  ],
  hotline: '0900 000 000',
  zalo: 'https://zalo.me/0900000000',
  // URL nhận form (Google Apps Script, webhook CRM...). Để trống = lưu tạm trên trình duyệt.
  leadEndpoint: '',
};

// ---------------------------------------------------------------------
// CẢNH THAM QUAN
//  img   : ảnh phối cảnh (kéo để nhìn quanh, cuộn/chụm để phóng to)
//  pano  : nếu có ảnh panorama 360° thật (equirectangular 2:1) thì điền vào –
//          trang sẽ chuyển sang xoay tròn 360°. Khi dùng pano, toạ độ điểm bấm
//          tính bằng { yaw, pitch } (độ) thay cho { x, y } (% ảnh).
//  hfov  : góc nhìn ngang ước lượng của ảnh (độ)
//  view  : vị trí đứng chụp trên mặt bằng (mét) + hướng nhìn (độ, 0 = Bắc, 90 = Đông)
//  spots : type 'go' = chuyển cảnh, type 'info' = thông tin nội thất
// ---------------------------------------------------------------------
export const SCENES = [
  {
    id: 'sanh', name: 'Sảnh vào', room: 'sanh', img: 'assets/sanh.jpg', pano: '', hfov: 52,
    view: { x: 3.4, z: 7.3, yaw: 70 },
    spots: [
      { type: 'go', to: 'bep', x: 9, y: 58, label: 'Sang khu bếp' },
      { type: 'go', to: 'master-giuong', x: 92, y: 30, label: 'Phòng ngủ master' },
      { type: 'info', x: 36, y: 77, title: 'Tủ giày cánh mây đan', text: 'Cánh tủ đan mây thoáng khí, chống ẩm mùi cho giày dép. Mặt đá trắng đặt đồ trang trí, chìa khóa.' },
      { type: 'info', x: 73, y: 46, title: 'Khung gỗ treo đồ', text: 'Khung lưới gỗ sồi kết hợp kệ nhỏ và móc treo túi, áo khoác khi vừa về nhà.' },
      { type: 'info', x: 76, y: 86, title: 'Ghế ngồi thay giày', text: 'Băng ghế gỗ liền khung – ngồi mang giày thoải mái, gầm ghế để dép đi trong nhà.' },
      { type: 'info', x: 38, y: 32, title: 'Tranh thủy mặc', text: 'Điểm nhấn phong cách Nhật, tạo cảm giác thư thái ngay khi bước vào.' },
    ],
  },
  {
    id: 'bep', name: 'Phòng bếp', room: 'bep', img: 'assets/bep.jpg', pano: '', hfov: 70,
    view: { x: 1.6, z: 5.0, yaw: 180 },
    spots: [
      { type: 'go', to: 'sanh', x: 5, y: 60, label: 'Ra sảnh vào' },
      { type: 'go', to: 'phong-ngu-2', x: 79, y: 79, label: 'Phòng ngủ 2' },
      { type: 'info', x: 57, y: 44, title: 'Đá ốp vân mây xám', text: 'Mảng đá vân marble xám chạy liền mặt bếp – sang trọng, dễ lau chùi.' },
      { type: 'info', x: 51, y: 25, title: 'Tủ kính trưng bày & giá bát', text: 'Hai ô tủ kính khung trắng tích hợp giá úp bát, vừa trưng bày vừa tiện dụng.' },
      { type: 'info', x: 36, y: 41, title: 'LED hắt dưới tủ', text: 'Đèn LED âm dưới tủ bếp trên chiếu sáng mặt bàn chế biến, tạo chiều sâu buổi tối.' },
      { type: 'info', x: 27, y: 55, title: 'Đầu tủ bo cong', text: 'Góc tủ bo cong mềm mại, an toàn cho trẻ nhỏ và tạo điểm nhấn thiết kế.' },
      { type: 'info', x: 88, y: 55, title: 'Hốc tủ lạnh lớn', text: 'Chừa sẵn vị trí tủ lạnh 2 cánh cạnh hệ tủ bếp chữ L.' },
      { type: 'info', x: 4, y: 40, title: 'Khóa cửa thông minh', text: 'Cửa chính dùng khóa vân tay / mã số, ra vào không cần chìa.' },
    ],
  },
  {
    id: 'master-giuong', name: 'Phòng ngủ master', room: 'master', img: 'assets/master-giuong.jpg', pano: '', hfov: 72,
    view: { x: 7.0, z: 2.2, yaw: 90 },
    spots: [
      { type: 'go', to: 'master-tu', x: 73, y: 70, label: 'Xem phía tủ áo' },
      { type: 'go', to: 'phong-ngu-2', x: 98, y: 58, label: 'Ra hành lang' },
      { type: 'info', x: 56, y: 50, title: 'Gương LED tròn', text: 'Gương trang điểm viền LED ánh sáng ấm, bật tắt cảm ứng.' },
      { type: 'info', x: 56, y: 64, title: 'Bàn trang điểm liền đầu giường', text: 'Bàn trang điểm nối liền vách đầu giường, có ngăn kéo và đôn bọc nỉ.' },
      { type: 'info', x: 89, y: 30, title: 'Kệ góc LED', text: 'Kệ mở bo cong cuối tủ áo, có LED từng tầng – trưng sách, cây xanh.' },
      { type: 'info', x: 5, y: 32, title: 'Rèm cầu vồng', text: 'Rèm cầu vồng điều chỉnh ánh sáng linh hoạt cho cửa sổ phòng ngủ.' },
      { type: 'info', x: 26, y: 33, title: 'Tranh hoa anh đào', text: 'Tranh phong cảnh Nhật Bản tông pastel, đồng bộ phong cách Japandi.' },
      { type: 'info', x: 20, y: 80, title: 'Giường gỗ sồi', text: 'Giường khung gỗ, đầu giường bọc nệm êm – kích thước cho 2 người.' },
    ],
  },
  {
    id: 'master-tu', name: 'Master – tủ áo', room: 'master', img: 'assets/master-tu-ao.jpg', pano: '', hfov: 70,
    view: { x: 8.6, z: 1.6, yaw: 190 },
    spots: [
      { type: 'go', to: 'master-giuong', x: 8, y: 22, label: 'Quay về đầu giường' },
      { type: 'go', to: 'phong-ngu-2', x: 83, y: 62, label: 'Ra hành lang' },
      { type: 'info', x: 45, y: 40, title: 'Tủ áo kịch trần', text: 'Hệ tủ áo cao kịch trần, cánh khung gỗ ốp mây – tận dụng tối đa chiều cao lưu trữ.' },
      { type: 'info', x: 23, y: 63, title: 'Bàn trang điểm & kệ sách', text: 'Bàn trang điểm tích hợp vào tủ, phía trên là kệ sách có đèn hắt.' },
      { type: 'info', x: 70, y: 52, title: 'Kệ mở cạnh cửa', text: 'Dải kệ mở cuối tủ – đặt sách, cây xanh và đồ decor.' },
      { type: 'info', x: 85, y: 18, title: 'Điều hòa treo tường', text: 'Điều hòa đặt trên cửa, luồng gió không thổi trực tiếp vào giường.' },
    ],
  },
  {
    id: 'phong-ngu-2', name: 'Phòng ngủ 2', room: 'pn2', img: 'assets/phong-ngu-2.jpg', pano: '', hfov: 72,
    view: { x: 6.9, z: 6.7, yaw: 95 },
    spots: [
      { type: 'go', to: 'master-giuong', x: 5, y: 72, label: 'Phòng ngủ master' },
      { type: 'go', to: 'bep', x: 26, y: 72, label: 'Về khu bếp' },
      { type: 'info', x: 50, y: 84, title: 'Giường bục 3 ngăn kéo', text: 'Giường bục liền khối với 3 ngăn kéo lớn – không gầm bụi, thêm chỗ chứa đồ.' },
      { type: 'info', x: 60, y: 30, title: 'Vách gỗ trang trí', text: 'Vách gỗ điểm nút tròn tạo điểm nhấn đầu giường, ấm áp cho phòng trẻ.' },
      { type: 'info', x: 89, y: 42, title: 'Kệ trưng bày có LED', text: 'Kệ mở có đèn LED từng tầng, ô vòm cong dưới cùng – trưng đồ chơi, sách truyện.' },
      { type: 'info', x: 72, y: 30, title: 'Tủ áo âm tường', text: 'Tủ áo cánh trắng phẳng, tay nắm gỗ âm – gọn gàng, an toàn cho bé.' },
      { type: 'info', x: 10, y: 62, title: 'Bậu ngồi & đèn ngủ', text: 'Bậu gỗ mặt đá đặt đèn ngủ, cây xanh – kiêm chỗ ngồi đọc sách.' },
    ],
  },
];

// ---------------------------------------------------------------------
// MẶT BẰNG MINH HỌA (đơn vị mét). x: Tây → Đông, z: Bắc → Nam
// ---------------------------------------------------------------------
export const PLAN = {
  size: { w: 10, d: 8 },
  rooms: [
    { id: 'khach', name: 'Phòng khách', rect: [0, 0, 6.2, 4.4], floor: 'wood' },
    { id: 'bancong', name: 'Ban công', rect: [0, -1.3, 6.2, 1.3], floor: 'tile' },
    { id: 'bep', name: 'Bếp', rect: [0, 4.4, 2.8, 3.6], floor: 'marble' },
    { id: 'an', name: 'Bàn ăn', rect: [2.8, 4.4, 2.2, 1.2], floor: 'wood' },
    { id: 'sanh', name: 'Sảnh', rect: [2.8, 5.6, 2.2, 2.4], floor: 'marble' },
    { id: 'hall', name: 'Hành lang', rect: [5, 4.4, 1.2, 3.6], floor: 'wood' },
    { id: 'hall2', name: '', rect: [6.2, 3.8, 1.8, 1.4], floor: 'wood' },
    { id: 'master', name: 'Phòng ngủ master', rect: [6.2, 0, 3.8, 3.8], floor: 'wood' },
    { id: 'wc', name: 'WC', rect: [8, 3.8, 2, 1.4], floor: 'tile' },
    { id: 'pn2', name: 'Phòng ngủ 2', rect: [6.2, 5.2, 3.8, 2.8], floor: 'wood' },
  ],
  // [x1, z1, x2, z2] – tường thẳng; doors / windows: { at: [x, z], along: 'x'|'z', w }
  walls: [
    [0, 8, 10, 8], [0, 0, 0, 8], [10, 0, 10, 8], [6.2, 0, 10, 0], [0, 0, 6.2, 0],
    [6.2, 0, 6.2, 3.8], [6.2, 3.8, 10, 3.8], [8, 3.8, 8, 5.2], [6.2, 5.2, 10, 5.2],
    [6.2, 5.2, 6.2, 8], [5, 5.6, 5, 8], [2.8, 6.8, 2.8, 8],
    [0, -1.3, 6.2, -1.3, 1.1], [0, -1.3, 0, 0, 1.1], [6.2, -1.3, 6.2, 0, 1.1],
  ],
  doors: [
    { at: [3.85, 8], along: 'x', w: 1.0, main: true },
    { at: [6.9, 3.8], along: 'x', w: 0.85 },
    { at: [8, 4.5], along: 'z', w: 0.75 },
    { at: [6.8, 5.2], along: 'x', w: 0.85 },
  ],
  windows: [
    { at: [3.1, 0], along: 'x', w: 5.4, glassDoor: true },
    { at: [8.2, 0], along: 'x', w: 2.0 },
  ],
};

export const GALLERY_ORDER = ['sanh', 'bep', 'master-giuong', 'master-tu', 'phong-ngu-2'];
