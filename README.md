# GymFlow – Hệ thống Quản lý Phòng Gym/Fitness

## 1. Giới thiệu

GymFlow là hệ thống quản lý phòng Gym/Fitness được xây dựng trong khuôn khổ môn học Triển khai và Quản trị hệ thống phần mềm – Đề tài 23.

Hệ thống hỗ trợ quản lý hội viên, gói tập, huấn luyện viên, đăng ký gói và lịch tập. Bên cạnh các chức năng nghiệp vụ, dự án tích hợp các công cụ triển khai, giám sát, quản lý log và bảo mật cơ bản.

## 2. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Backend | Node.js, Express |
| Database | MySQL |
| Database Management | phpMyAdmin |
| Containerization | Docker Compose |
| Reverse Proxy | Nginx |
| Monitoring | Prometheus, Grafana |
| Exporters | cAdvisor, Nginx Exporter, MySQL Exporter |
| Logging | Loki, Promtail |
| Version Control | Git, GitHub |

## 3. Chức năng hệ thống

- Quản lý thông tin hội viên.
- Quản lý các gói tập Gym.
- Quản lý huấn luyện viên.
- Quản lý đăng ký gói tập.
- Quản lý và phân công lịch tập.
- Giám sát hoạt động của hệ thống bằng Grafana.
- Thu thập và truy vấn log tập trung bằng Loki.

## 4. Kiến trúc triển khai

Người dùng → Nginx Reverse Proxy → Node.js/Express → MySQL.

Các dịch vụ được triển khai bằng Docker Compose. Prometheus thu thập metrics từ các exporter và Grafana trực quan hóa dữ liệu giám sát. Promtail thu thập log và chuyển đến Loki để truy vấn thông qua Grafana Explore.

## 5. Yêu cầu môi trường

- Windows có Docker Desktop và Docker Compose.
- Git.
- Trình duyệt web.
- Các cổng dịch vụ cần thiết không bị ứng dụng khác chiếm dụng.

## 6. Hướng dẫn cài đặt

**Bước 1:** Clone repository về máy bằng Git.

**Bước 2:** Mở thư mục dự án trong VS Code.

**Bước 3:** Tạo file `.env` dựa trên `.env.example`. Điền mật khẩu mạnh cho MySQL, Grafana và tài khoản giám sát.

**Bước 4:** Khởi động Docker Desktop.

**Bước 5:** Kiểm tra cấu hình với lệnh `docker compose config -q`.

**Bước 6:** Khởi động hệ thống bằng lệnh `docker compose up -d --build`.

**Bước 7:** Kiểm tra container bằng lệnh `docker compose ps`.

**Bước 8:** Đăng nhập phpMyAdmin và nhập file `database/schema.sql` vào cơ sở dữ liệu `gym_fitness` nếu đây là lần đầu khởi tạo và các bảng chưa tồn tại.

**Bước 9:** Khởi tạo tài khoản giám sát MySQL theo cấu hình của dự án và xác nhận các exporter hoạt động.

## 7. Địa chỉ truy cập

| Dịch vụ | Địa chỉ |
|---|---|
| Website GymFlow qua Nginx | http://localhost:8088 |
| phpMyAdmin | http://localhost:8081 |
| Grafana | http://localhost:3002 |
| Prometheus Targets | http://localhost:9091/targets |
| Loki Ready | http://localhost:3101/ready |

Các địa chỉ trên áp dụng cho cấu hình triển khai local của dự án.

## 8. Kiểm tra hệ thống

- Website hiển thị và truy xuất dữ liệu MySQL thành công.
- Các container cần thiết hoạt động.
- Nginx reverse proxy chuyển tiếp yêu cầu đến ứng dụng.
- Prometheus Targets có trạng thái UP.
- Grafana hiển thị dashboard giám sát Docker, Nginx và MySQL.
- Loki hoạt động và Grafana thực hiện được truy vấn LogQL.

## 9. Bảo mật

Hệ thống triển khai các biện pháp:

- Chạy ứng dụng bằng tài khoản không phải root.
- Phân tách mạng frontend, backend và monitoring.
- Không công bố trực tiếp cổng MySQL ra máy chủ.
- Giới hạn Linux capabilities và áp dụng no-new-privileges.
- Cấu hình HTTP security headers trên Nginx.
- Lưu mật khẩu trong file môi trường và không đưa file `.env` lên GitHub.

## 10. Quản lý mã nguồn

Dự án sử dụng Git và GitHub để quản lý phiên bản mã nguồn, cấu hình Docker, tài liệu triển khai và các thay đổi trong quá trình phát triển.

## 11. Ghi chú

Dự án được xây dựng nhằm mục đích học tập và thực hành triển khai hệ thống phần mềm. Các biện pháp bảo mật và cấu hình giám sát cần được đánh giá, hoàn thiện thêm trước khi triển khai trong môi trường production.