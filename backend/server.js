'use strict';
const express = require('express');
const helmet = require('helmet');
const mysql = require('mysql2/promise');
const path = require('node:path');

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '50kb' }));
const db = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'gym_user',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'gym_fitness',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 5,
  dateStrings: true
});

const models = Object.freeze({
  'hoi-vien': {
    table: 'hoi_vien',
    fields: ['ma_hoi_vien','ho_ten','so_dien_thoai','ngay_tham_gia','trang_thai'],
    required: ['ma_hoi_vien','ho_ten','so_dien_thoai','ngay_tham_gia'],
    order: 'id DESC'
  },
  'goi-tap': {
    table: 'goi_tap',
    fields: ['ten_goi','thoi_han_thang','gia','trang_thai'],
    required: ['ten_goi','thoi_han_thang','gia'],
    order: 'id DESC'
  },
  'huan-luyen-vien': {
    table: 'huan_luyen_vien',
    fields: ['ma_hlv','ho_ten','chuyen_mon','so_dien_thoai','trang_thai'],
    required: ['ma_hlv','ho_ten','chuyen_mon','so_dien_thoai'],
    order: 'id DESC'
  },
  'dang-ky-goi': {
    table: 'dang_ky_goi',
    fields: ['hoi_vien_id','goi_tap_id','ngay_bat_dau','ngay_ket_thuc','trang_thai'],
    required: ['hoi_vien_id','goi_tap_id','ngay_bat_dau','ngay_ket_thuc'],
    order: 'id DESC',
    select: `SELECT d.*, h.ho_ten AS ten_hoi_vien, g.ten_goi
       FROM dang_ky_goi AS d
       JOIN hoi_vien AS h ON d.hoi_vien_id = h.id
       JOIN goi_tap AS g ON d.goi_tap_id = g.id
       ORDER BY d.id DESC`
  },
  'lich-tap': {
    table: 'lich_tap',
    fields: ['hoi_vien_id','huan_luyen_vien_id','thoi_gian_bat_dau','thoi_gian_ket_thuc','noi_dung','trang_thai'],
    required: ['hoi_vien_id','huan_luyen_vien_id','thoi_gian_bat_dau','thoi_gian_ket_thuc','noi_dung'],
    order: 'id DESC',
    select: `SELECT l.*, h.ho_ten AS ten_hoi_vien, v.ho_ten AS ten_hlv
       FROM lich_tap AS l
       JOIN hoi_vien AS h ON l.hoi_vien_id = h.id
       JOIN huan_luyen_vien AS v ON l.huan_luyen_vien_id = v.id
       ORDER BY l.id DESC`
  }
});

const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req,res,next)).catch(next);
const modelOf = name => models[name] || null;
const idOf = param => (/^[1-9][0-9]*$/.test(param) ? Number(param) : null);

function incoming(cfg, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    const e = new Error('Dữ liệu gửi lên không hợp lệ'); e.status = 400; throw e;
  }
  const values = cfg.fields.map(f => {
    let v = body[f];
    if (typeof v === 'string') v = v.trim();
    if (f === 'thoi_gian_bat_dau' || f === 'thoi_gian_ket_thuc') {
      if (typeof v === 'string') v = v.replace('T',' ').replace(/^(\d{4}-\d\d-\d\d \d\d:\d\d)$/,'$1:00');
    }
    if (v === undefined || v === '') v = null;
    if (cfg.required.includes(f) && (v === null)) {
      const e = new Error(`Thiếu trường bắt buộc: ${f}`); e.status = 400; throw e;
    }
    return v;
  });
  return values;
}

app.get('/api/health', asyncRoute(async (req,res) => {
  await db.query('SELECT 1 AS ok');
  res.json({ status: 'ok', database: 'connected' });
}));

app.get('/api/tong-quan', asyncRoute(async (req,res) => {
  const [rows] = await db.query(`SELECT
    (SELECT COUNT(*) FROM hoi_vien) AS hoi_vien,
    (SELECT COUNT(*) FROM goi_tap) AS goi_tap,
    (SELECT COUNT(*) FROM huan_luyen_vien) AS huan_luyen_vien,
    (SELECT COUNT(*) FROM dang_ky_goi) AS dang_ky_goi,
    (SELECT COUNT(*) FROM lich_tap) AS lich_tap`);
  res.json(rows[0]);
}));

app.get('/api/:resource', asyncRoute(async (req,res) => {
  const cfg = modelOf(req.params.resource);
  if (!cfg) return res.status(404).json({error:'Chức năng không tồn tại'});
  const sql = cfg.select || `SELECT * FROM ${cfg.table} ORDER BY ${cfg.order}`;
  const [rows] = await db.query(sql);
  res.json(rows);
}));

app.post('/api/:resource', asyncRoute(async (req,res) => {
  const cfg = modelOf(req.params.resource);
  if (!cfg) return res.status(404).json({error:'Chức năng không tồn tại'});
  const values = incoming(cfg, req.body);
  const sql = `INSERT INTO ${cfg.table} (${cfg.fields.join(',')}) VALUES (${cfg.fields.map(()=>'?').join(',')})`;
  const [result] = await db.execute(sql, values);
  res.status(201).json({message:'Đã thêm thành công', id: result.insertId});
}));

app.put('/api/:resource/:id', asyncRoute(async (req,res) => {
  const cfg = modelOf(req.params.resource);
  const id = idOf(req.params.id);
  if (!cfg || !id) return res.status(404).json({error:'Không tìm thấy'});
  const values = incoming(cfg,req.body);
  const sql = `UPDATE ${cfg.table} SET ${cfg.fields.map(f=>`${f}=?`).join(',')} WHERE id=?`;
  const [result] = await db.execute(sql,[...values,id]);
  if (!result.affectedRows) return res.status(404).json({error:'Bản ghi không tồn tại'});
  res.json({message:'Đã cập nhật thành công'});
}));

app.delete('/api/:resource/:id', asyncRoute(async (req,res) => {
  const cfg = modelOf(req.params.resource);
  const id = idOf(req.params.id);
  if (!cfg || !id) return res.status(404).json({error:'Không tìm thấy'});
  const [result] = await db.execute(`DELETE FROM ${cfg.table} WHERE id=?`,[id]);
  if (!result.affectedRows) return res.status(404).json({error:'Bản ghi không tồn tại'});
  res.json({message:'Đã xóa thành công'});
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use((req,res) => res.status(404).json({error:'Đường dẫn không tồn tại'}));
app.use((err, req, res, next) => {
  if (err.status) return res.status(err.status).json({error:err.message});
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({error:'Mã hoặc tên đã tồn tại, vui lòng nhập giá trị khác'});
  if (['ER_ROW_IS_REFERENCED_2', 'ER_NO_REFERENCED_ROW_2'].includes(err.code))
    return res.status(409).json({error:'Dữ liệu đang được liên kết hoặc khóa ngoại không tồn tại'});
  if (['ER_CHECK_CONSTRAINT_VIOLATED', 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD', 'ER_BAD_NULL_ERROR', 'ER_WARN_DATA_OUT_OF_RANGE', 'WARN_DATA_TRUNCATED'].includes(err.code))
    return res.status(400).json({error:'Dữ liệu không đúng định dạng hoặc vi phạm ràng buộc'});
  console.error('Request error:', err.code || err.message);
  res.status(500).json({error:'Có lỗi máy chủ, hãy xem docker compose logs app'});
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, '0.0.0.0', () => console.log(`Gym app listening at ${port}`));
