'use strict';
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const status = {active:'Hoạt động',inactive:'Tạm ngưng',expired:'Hết hạn',cancelled:'Đã hủy',scheduled:'Đã lên lịch',done:'Hoàn thành'};
const specs = {
  'hoi-vien': {
    title:'Quản lý hội viên', desc:'Thêm, sửa, xóa và tra cứu hội viên của phòng tập.',
    cols:[['ma_hoi_vien','Mã hội viên'],['ho_ten','Họ và tên'],['so_dien_thoai','Số điện thoại'],['ngay_tham_gia','Ngày tham gia'],['trang_thai','Trạng thái']],
    fields:[['ma_hoi_vien','Mã hội viên','text'],['ho_ten','Họ và tên','text'],['so_dien_thoai','Số điện thoại','tel'],['ngay_tham_gia','Ngày tham gia','date'],['trang_thai','Trạng thái','select','statusActive']]
  },
  'goi-tap': {
    title:'Quản lý gói tập', desc:'Danh sách gói tập, thời hạn và học phí.',
    cols:[['ten_goi','Tên gói'],['thoi_han_thang','Thời hạn (tháng)'],['gia','Giá tiền (VNĐ)'],['trang_thai','Trạng thái']],
    fields:[['ten_goi','Tên gói tập','text'],['thoi_han_thang','Thời hạn (tháng)','number'],['gia','Giá tiền (VNĐ)','number'],['trang_thai','Trạng thái','select','statusActive']]
  },
  'huan-luyen-vien': {
    title:'Quản lý huấn luyện viên', desc:'Danh sách huấn luyện viên và chuyên môn.',
    cols:[['ma_hlv','Mã HLV'],['ho_ten','Họ và tên'],['chuyen_mon','Chuyên môn'],['so_dien_thoai','Số điện thoại'],['trang_thai','Trạng thái']],
    fields:[['ma_hlv','Mã HLV','text'],['ho_ten','Họ và tên','text'],['chuyen_mon','Chuyên môn','text'],['so_dien_thoai','Số điện thoại','tel'],['trang_thai','Trạng thái','select','statusActive']]
  },
  'dang-ky-goi': {
    title:'Đăng ký gói tập', desc:'Theo dõi gói tập đang sử dụng của mỗi hội viên.',
    cols:[['ten_hoi_vien','Hội viên'],['ten_goi','Gói tập'],['ngay_bat_dau','Bắt đầu'],['ngay_ket_thuc','Kết thúc'],['trang_thai','Trạng thái']],
    fields:[['hoi_vien_id','Hội viên','select','hoi-vien'],['goi_tap_id','Gói tập','select','goi-tap'],['ngay_bat_dau','Ngày bắt đầu','date'],['ngay_ket_thuc','Ngày kết thúc','date'],['trang_thai','Trạng thái','select','statusReg']]
  },
  'lich-tap': {
    title:'Quản lý lịch tập', desc:'Xếp lịch tập và phân công huấn luyện viên.',
    cols:[['ten_hoi_vien','Hội viên'],['ten_hlv','Huấn luyện viên'],['thoi_gian_bat_dau','Bắt đầu'],['thoi_gian_ket_thuc','Kết thúc'],['noi_dung','Nội dung'],['trang_thai','Trạng thái']],
    fields:[['hoi_vien_id','Hội viên','select','hoi-vien'],['huan_luyen_vien_id','Huấn luyện viên','select','huan-luyen-vien'],['thoi_gian_bat_dau','Giờ bắt đầu','datetime-local'],['thoi_gian_ket_thuc','Giờ kết thúc','datetime-local'],['noi_dung','Nội dung tập','text'],['trang_thai','Trạng thái','select','statusSession']]
  }
};
const state = {tab:'tong-quan',rows:[],currentId:null,summary:null};
const statMeta = [['hoi_vien','Hội viên','♙'],['goi_tap','Gói tập','▤'],['huan_luyen_vien','Huấn luyện viên','★'],['lich_tap','Lịch tập','▦']];
async function api(path, opts={}) {
  const response = await fetch('/api/'+path, {...opts,headers:{'Content-Type':'application/json',...(opts.headers||{})}});
  const data = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(data.error || `Lỗi HTTP ${response.status}`);
  return data;
}
function alertMessage(message,isError=false){const box=$('#message'); box.textContent=message;box.classList.toggle('error',isError);box.classList.remove('hidden');}
function clearMessage(){$('#message').classList.add('hidden');}
function showStats(data){
  $('#stats').innerHTML=statMeta.map(([field,label,symbol]) => `<div class="stat"><div class="stat-top"><span>${label}</span><span class="stat-icon">${symbol}</span></div><div class="stat-value">${Number(data[field]||0)}</div><div class="stat-foot">Dữ liệu từ MySQL</div></div>`).join('');
}
function cellText(key,value){
  if(key==='trang_thai'){const className=esc(value||'inactive');return `<span class="badge ${className}">${esc(status[value]||value)}</span>`;}
  if(key==='gia') return esc(new Intl.NumberFormat('vi-VN').format(Number(value||0)));
  return esc(value);
}
function renderTable(){
  const spec=specs[state.tab];
  if (!state.rows.length){ $('#content-area').innerHTML='<p class="empty">Chưa có dữ liệu. Chọn “Thêm mới” để tạo bản ghi.</p>';return; }
  $('#content-area').innerHTML=`<table><thead><tr><th>ID</th>${spec.cols.map(([,label])=>`<th>${esc(label)}</th>`).join('')}<th>Thao tác</th></tr></thead><tbody>${state.rows.map(row=>`<tr><td>#${Number(row.id)}</td>${spec.cols.map(([key])=>`<td>${cellText(key,row[key])}</td>`).join('')}<td><div class="actions"><button class="action" data-action="edit" data-id="${Number(row.id)}">Sửa</button><button class="action danger" data-action="delete" data-id="${Number(row.id)}">Xóa</button></div></td></tr>`).join('')}</tbody></table>`;
}
async function render(){
  clearMessage();
  const isHome=state.tab==='tong-quan';
  const spec=specs[state.tab];
  $('#title').textContent=isHome?'Tổng quan hệ thống':spec.title;
  $('#subtitle').textContent=isHome?'Theo dõi hoạt động và dữ liệu tại phòng Gym.':spec.desc;
  $('#crumb').textContent=isHome?'Tổng quan':spec.title;
  $('#add').classList.toggle('hidden',isHome);
  $('#table-title').textContent=isHome?'Hệ thống đã kết nối cơ sở dữ liệu':spec.title;
  $('#table-desc').textContent=isHome?'Demo nghiệp vụ quản lý Gym/Fitness': 'Dữ liệu đang được đọc trực tiếp từ MySQL';
  document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.tab));
  $('#content-area').innerHTML='<p class="loading">Đang tải dữ liệu...</p>';
  try {
    const summary=await api('tong-quan');
    state.summary=summary;showStats(summary);
    if(isHome){
      $('#content-area').innerHTML='<div class="overview-text"><strong>Chào mừng đến với GymFlow!</strong><p>Đây là website demo có dữ liệu thực trong MySQL. Dùng thanh menu bên trái để quản lý hội viên, gói tập, huấn luyện viên, đăng ký gói và lịch tập.</p><p>Dùng <strong>Thêm mới / Sửa / Xóa</strong> để thay đổi dữ liệu rồi kiểm tra lại trong phpMyAdmin.</p><p><strong>Lưu ý:</strong> Đây là bản thử nghiệm nội bộ; chưa tích hợp đăng nhập, Nginx và các dịch vụ giám sát.</p></div>';
    } else {state.rows=await api(state.tab);renderTable();}
  } catch(err){alertMessage(err.message,true);$('#content-area').innerHTML='<p class="empty">Không tải được dữ liệu. Kiểm tra Docker và MySQL.</p>';}
}
async function navigate(tab){state.tab=tab;await render();}
function choices(source){
  if(source==='statusActive')return [['active','Hoạt động'],['inactive','Tạm ngưng']];
  if(source==='statusReg')return [['active','Đang sử dụng'],['expired','Hết hạn'],['cancelled','Đã hủy']];
  if(source==='statusSession')return [['scheduled','Đã lên lịch'],['done','Hoàn thành'],['cancelled','Đã hủy']];
  return [];
}
async function openModal(id=null){
  state.currentId=id;
  const spec=specs[state.tab];
  const current=id?state.rows.find(r=>Number(r.id)===id):{};
  const related={};
  const refs=[...new Set(spec.fields.map(f=>f[3]).filter(f=>specs[f]))];
  try {await Promise.all(refs.map(async name=>{related[name]=await api(name);}));}
  catch(err){return alertMessage(err.message,true);}
  $('#modal-title').textContent=(id?'Cập nhật: ':'Thêm mới: ')+spec.title;
  $('#form-fields').innerHTML=spec.fields.map(([key,label,type,source])=>{
    const original=current[key]??'';
    const value=type==='datetime-local'&&original?String(original).replace(' ','T').slice(0,16):String(original);
    let control='';
    if(type==='select'){
      const opts=source&&related[source] ? related[source].map(item=>[item.id, source==='goi-tap'?item.ten_goi:item.ho_ten]) : choices(source);
      control=`<select name="${key}" ${source&&related[source]?'required':''}>${source&&related[source]?'<option value="">-- Chọn --</option>':''}${opts.map(([v,t])=>`<option value="${esc(v)}" ${String(original)===String(v)?'selected':''}>${esc(t)}</option>`).join('')}</select>`;
    } else {
      const min=type==='number'?'min="0" step="1"':'';
      control=`<input name="${key}" type="${type}" value="${esc(value)}" ${min} required maxlength="250">`;
    }
    return `<div class="field"><label for="f_${key}">${esc(label)}</label>${control.replace('<input ','<input id="f_'+key+'" ').replace('<select ','<select id="f_'+key+'" ')}</div>`;
  }).join('');
  $('#modal').classList.remove('hidden');
  const first=$('#form-fields input, #form-fields select'); if(first)first.focus();
}
function closeModal(){$('#modal').classList.add('hidden');state.currentId=null;}
async function save(e){
  e.preventDefault(); const fields=specs[state.tab].fields;
  const fd=new FormData(e.target),body={};
  for(const [key,,type] of fields){const v=fd.get(key);body[key]=type==='number'&&v!==''?Number(v):v;}
  const id=state.currentId;
  try {
    await api(state.tab+(id?'/'+id:''), {method:id?'PUT':'POST',body:JSON.stringify(body)});
    closeModal(); await render(); alertMessage(id?'Đã cập nhật dữ liệu.':'Đã thêm dữ liệu thành công.');
  }catch(err){alertMessage(err.message,true);}
}
async function remove(id){
  if(!confirm('Bạn có chắc muốn xóa bản ghi này?'))return;
  try {await api(state.tab+'/'+id,{method:'DELETE'});await render();alertMessage('Đã xóa dữ liệu.');}
  catch(err){alertMessage(err.message,true);}
}
$('#nav').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)navigate(b.dataset.tab);});
$('#content-area').addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;const id=Number(b.dataset.id);if(b.dataset.action==='edit')openModal(id);else if(b.dataset.action==='delete')remove(id);});
$('#reload').addEventListener('click',render);
$('#add').addEventListener('click',()=>openModal());
$('#close-modal').addEventListener('click',closeModal);
$('#cancel').addEventListener('click',closeModal);
$('#entry-form').addEventListener('submit',save);
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});
render();
