-- DE 23: GYM / FITNESS
-- Chon database gym_fitness trong phpMyAdmin truoc khi chay.
-- An toan khi chay lai: khong DROP TABLE, du lieu demo INSERT IGNORE.
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS hoi_vien (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ma_hoi_vien VARCHAR(20) NOT NULL UNIQUE,
    ho_ten VARCHAR(120) NOT NULL,
    so_dien_thoai VARCHAR(20) NOT NULL,
    ngay_tham_gia DATE NOT NULL,
    trang_thai ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS goi_tap (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ten_goi VARCHAR(100) NOT NULL UNIQUE,
    thoi_han_thang INT UNSIGNED NOT NULL,
    gia DECIMAL(12,0) NOT NULL,
    trang_thai ENUM('active','inactive') NOT NULL DEFAULT 'active',
    CONSTRAINT chk_goi_thoi_han CHECK (thoi_han_thang > 0),
    CONSTRAINT chk_goi_gia CHECK (gia >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS huan_luyen_vien (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ma_hlv VARCHAR(20) NOT NULL UNIQUE,
    ho_ten VARCHAR(120) NOT NULL,
    chuyen_mon VARCHAR(120) NOT NULL,
    so_dien_thoai VARCHAR(20) NOT NULL,
    trang_thai ENUM('active','inactive') NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dang_ky_goi (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hoi_vien_id INT UNSIGNED NOT NULL,
    goi_tap_id INT UNSIGNED NOT NULL,
    ngay_bat_dau DATE NOT NULL,
    ngay_ket_thuc DATE NOT NULL,
    trang_thai ENUM('active','expired','cancelled') NOT NULL DEFAULT 'active',
    CONSTRAINT fk_dkg_hoi_vien FOREIGN KEY (hoi_vien_id) REFERENCES hoi_vien(id) ON DELETE RESTRICT,
    CONSTRAINT fk_dkg_goi_tap FOREIGN KEY (goi_tap_id) REFERENCES goi_tap(id) ON DELETE RESTRICT,
    CONSTRAINT chk_dkg_ngay CHECK (ngay_ket_thuc >= ngay_bat_dau)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lich_tap (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hoi_vien_id INT UNSIGNED NOT NULL,
    huan_luyen_vien_id INT UNSIGNED NOT NULL,
    thoi_gian_bat_dau DATETIME NOT NULL,
    thoi_gian_ket_thuc DATETIME NOT NULL,
    noi_dung VARCHAR(250) NOT NULL,
    trang_thai ENUM('scheduled','done','cancelled') NOT NULL DEFAULT 'scheduled',
    CONSTRAINT fk_lt_hoi_vien FOREIGN KEY (hoi_vien_id) REFERENCES hoi_vien(id) ON DELETE RESTRICT,
    CONSTRAINT fk_lt_hlv FOREIGN KEY (huan_luyen_vien_id) REFERENCES huan_luyen_vien(id) ON DELETE RESTRICT,
    CONSTRAINT chk_lt_thoi_gian CHECK (thoi_gian_ket_thuc > thoi_gian_bat_dau)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Toan bo thong tin duoi day la du lieu GIẢ LAP de trinh dien.
INSERT IGNORE INTO hoi_vien (id, ma_hoi_vien, ho_ten, so_dien_thoai, ngay_tham_gia, trang_thai) VALUES
(1,'HV001','Nguyễn Văn A','0000000001','2026-10-18','active'),
(2,'HV002','Trần Thị B','0000000002','2026-10-20','active');

INSERT IGNORE INTO goi_tap (id,ten_goi,thoi_han_thang,gia,trang_thai) VALUES
(1,'Gói 1 tháng',1,399000,'active'),
(2,'Gói 3 tháng',3,999000,'active'),
(3,'Gói 6 tháng',6,1799000,'active');

INSERT IGNORE INTO huan_luyen_vien (id,ma_hlv,ho_ten,chuyen_mon,so_dien_thoai,trang_thai) VALUES
(1,'HLV001','Lê Minh C','Tăng cơ, thể lực','0000000003','active'),
(2,'HLV002','Phạm Thị D','Yoga, giảm mỡ','0000000004','active');

INSERT IGNORE INTO dang_ky_goi (id,hoi_vien_id,goi_tap_id,ngay_bat_dau,ngay_ket_thuc,trang_thai) VALUES
(1,1,2,'2026-10-18','2027-01-17','active'),
(2,2,1,'2026-10-20','2026-11-19','active');

INSERT IGNORE INTO lich_tap (id,hoi_vien_id,huan_luyen_vien_id,thoi_gian_bat_dau,thoi_gian_ket_thuc,noi_dung,trang_thai) VALUES
(1,1,1,'2026-10-26 18:00:00','2026-10-26 19:00:00','Tập ngực, vai','scheduled'),
(2,2,2,'2026-10-27 17:00:00','2026-10-27 18:00:00','Yoga cơ bản','scheduled');

SELECT 'hoi_vien' AS bang, COUNT(*) AS so_dong FROM hoi_vien
UNION ALL SELECT 'goi_tap', COUNT(*) FROM goi_tap
UNION ALL SELECT 'huan_luyen_vien', COUNT(*) FROM huan_luyen_vien
UNION ALL SELECT 'dang_ky_goi', COUNT(*) FROM dang_ky_goi
UNION ALL SELECT 'lich_tap', COUNT(*) FROM lich_tap;
