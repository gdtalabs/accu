const STORAGE_KEY = 'accuClinicMvpV1';
const ROLE_KEY = 'accuClinicRoleV2';

const seed = {
  patients: [
    {id:'P-0001',name:'Maria Santos',sex:'F',dob:'1985-02-14',phone:'09171234567',address:'Tacloban City',discount:'None'},
    {id:'P-0002',name:'Jose Reyes',sex:'M',dob:'1958-10-09',phone:'09181234567',address:'Palo, Leyte',discount:'Senior'}
  ],
  consultations: [
    {id:'C-0001',patientId:'P-0001',doctor:'Dr. A. Cruz',date:new Date().toISOString().slice(0,10),chief:'Fever and cough',vitals:'BP 120/80; T 38.0°C',assessment:'Acute upper respiratory infection',fee:500,status:'Completed'}
  ],
  labOrders: [
    {id:'LAB-0001',patientId:'P-0002',date:new Date().toISOString().slice(0,10),tests:['CBC','Urinalysis'],status:'Processing',amount:500,resultNote:''}
  ],
  inventory: [
    {id:'MED-001',generic:'Paracetamol',brand:'Biogesic',strength:'500 mg',form:'Tablet',batch:'PCM2601',expiry:'2027-05-31',qty:160,reorder:40,cost:2,sell:5},
    {id:'MED-002',generic:'Amoxicillin',brand:'Generic',strength:'500 mg',form:'Capsule',batch:'AMX2602',expiry:'2026-12-31',qty:35,reorder:30,cost:4.5,sell:8},
    {id:'MED-003',generic:'Metformin',brand:'Generic',strength:'500 mg',form:'Tablet',batch:'MET2604',expiry:'2027-04-30',qty:90,reorder:25,cost:3,sell:6}
  ],
  services: [
    {id:'SRV-CONSULT',type:'Consultation',name:'General Consultation',price:500},
    {id:'SRV-CBC',type:'Laboratory',name:'CBC',price:350},
    {id:'SRV-UA',type:'Laboratory',name:'Urinalysis',price:150},
    {id:'SRV-FBS',type:'Laboratory',name:'Fasting Blood Sugar',price:180},
    {id:'SRV-LIPID',type:'Laboratory',name:'Lipid Profile',price:650},
    {id:'SRV-XRAY',type:'Diagnostic',name:'Chest X-ray',price:600}
  ],
  transactions: [],
  audit: [{ts:new Date().toISOString(),user:'Administrator',action:'Demo database initialized'}]
};

const TITLES = {
  dashboard:'Dashboard', patients:'Patient Registry', consultations:'Consultations', laboratory:'Laboratory',
  pharmacy:'Pharmacy Inventory', pos:'POS / Billing', reports:'Reports', settings:'Admin & Audit Log'
};

const ICONS = {dashboard:'⌂',patients:'👤',consultations:'🩺',laboratory:'🧪',pharmacy:'💊',pos:'▣',reports:'▤',settings:'⚙'};
const SHORT_LABELS = {dashboard:'Home',patients:'Patients',consultations:'Consult',laboratory:'Lab',pharmacy:'Pharmacy',pos:'POS',reports:'Sales',settings:'Admin'};

const ROLE_CONFIG = {
  'Administrator': {
    views:['dashboard','patients','consultations','laboratory','pharmacy','pos','reports','settings'],
    actions:['addPatient','createConsult','completeConsult','createLab','labStatus','labResult','addMedicine','checkout','export'],
    bottom:['dashboard','patients','laboratory','pos','reports'],
    context:'Full clinic overview, operations, billing, inventory, reports and audit access.',
    quick:{type:'view',target:'pos',label:'+ New Transaction'}
  },
  'Receptionist': {
    views:['dashboard','patients','consultations','laboratory'],
    actions:['addPatient','createConsult','createLab'],
    bottom:['dashboard','patients','consultations','laboratory'],
    context:'Front desk workspace for patient registration, consultation queue and lab requests.',
    quick:{type:'action',target:'patient',label:'+ Add Patient'}
  },
  'Physician': {
    views:['dashboard','patients','consultations','laboratory'],
    actions:['createConsult','completeConsult','createLab'],
    bottom:['dashboard','consultations','patients','laboratory'],
    context:'Clinical workspace for encounters, patient lookup and diagnostic requests.',
    quick:{type:'action',target:'consult',label:'+ New Consultation'}
  },
  'Medical Technologist': {
    views:['dashboard','patients','laboratory'],
    actions:['labStatus','labResult'],
    bottom:['dashboard','laboratory','patients'],
    context:'Laboratory work queue for collection, processing, validation and result release.',
    quick:{type:'view',target:'laboratory',label:'Open Lab Queue'}
  },
  'Pharmacist': {
    views:['dashboard','patients','pharmacy','pos'],
    actions:['addMedicine','checkout'],
    bottom:['dashboard','pharmacy','pos','patients'],
    context:'Pharmacy workspace for stock, expiry monitoring and medicine dispensing.',
    quick:{type:'view',target:'pos',label:'+ Pharmacy Sale'}
  },
  'Cashier': {
    views:['dashboard','patients','pos','reports'],
    actions:['checkout'],
    bottom:['dashboard','pos','patients','reports'],
    context:'Billing workspace for patient checkout, payments and today’s transaction ledger.',
    quick:{type:'view',target:'pos',label:'+ New Transaction'}
  }
};

let db = load();
let cart = [];
let saleDraft = {patientId:'',payment:'Cash'};
let activeRole = localStorage.getItem(ROLE_KEY) || 'Administrator';
if(!ROLE_CONFIG[activeRole]) activeRole = 'Administrator';
let activeView = 'dashboard';

function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw){ localStorage.setItem(STORAGE_KEY, JSON.stringify(seed)); return structuredClone(seed); }
  try{
    const parsed = JSON.parse(raw);
    parsed.audit ||= [];
    parsed.transactions ||= [];
    parsed.labOrders ||= [];
    parsed.consultations ||= [];
    return parsed;
  }catch{return structuredClone(seed)}
}
function save(action){
  if(action) db.audit.unshift({ts:new Date().toISOString(),user:activeRole,action});
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  renderAll();
  updateRoleUI();
}
function money(n){return new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(Number(n||0))}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function today(){return new Date().toISOString().slice(0,10)}
function patientName(id){return db.patients.find(p=>p.id===id)?.name || 'Walk-in'}
function nextId(prefix,list){return `${prefix}-${String(list.length+1).padStart(4,'0')}`}
function roleCfg(){return ROLE_CONFIG[activeRole]}
function can(action){return roleCfg().actions.includes(action)}
function canView(view){return roleCfg().views.includes(view)}
function guard(action){if(!can(action)){alert(`This action is not available to the ${activeRole} role in this MVP.`);return false}return true}
function statusBadgeClass(status){return status==='Completed'||status==='Released'?'green':status==='Processing'||status==='For Validation'?'amber':'blue'}
function daysUntil(date){return Math.ceil((new Date(`${date}T23:59:59`)-new Date())/86400000)}
function stat(label,value,sub){return `<div class="card"><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-sub">${sub}</div></div>`}
function actionCard(title,sub,onclick){return `<button class="action-card" onclick="${onclick}"><strong>${title}</strong><span>${sub}</span></button>`}

function closeDrawer(){document.getElementById('sidebar').classList.remove('open');document.getElementById('drawerBackdrop').classList.remove('show')}
function openDrawer(){document.getElementById('sidebar').classList.add('open');document.getElementById('drawerBackdrop').classList.add('show')}

window.showView = function(id){
  if(!canView(id)) id='dashboard';
  activeView=id;
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));
  document.getElementById('pageTitle').textContent=TITLES[id];
  document.querySelectorAll('.mobile-nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
  if(id==='pos') renderPOS();
  closeDrawer();
  window.scrollTo({top:0,behavior:'smooth'});
};

function updateRoleUI(){
  const cfg=roleCfg();
  document.getElementById('roleSelect').value=activeRole;
  document.getElementById('desktopRoleLabel').textContent=activeRole;
  document.getElementById('mobileRoleLabel').textContent=activeRole;
  document.getElementById('roleContext').textContent=cfg.context;
  document.querySelectorAll('.nav-item').forEach(btn=>{btn.hidden=!cfg.views.includes(btn.dataset.view)});

  const bottom=cfg.bottom.filter(v=>cfg.views.includes(v));
  const mobileNav=document.getElementById('mobileBottomNav');
  mobileNav.style.setProperty('--mobile-nav-count',bottom.length);
  mobileNav.innerHTML=bottom.map(v=>`<button class="mobile-nav-btn ${activeView===v?'active':''}" data-view="${v}" onclick="showView('${v}')"><span class="mi">${ICONS[v]}</span><span class="ml">${SHORT_LABELS[v]}</span></button>`).join('');

  document.getElementById('quickSaleBtn').textContent=cfg.quick.label;
  document.getElementById('mobileQuickBtn').title=cfg.quick.label;
  if(!cfg.views.includes(activeView)) activeView='dashboard';
  showView(activeView);
}

function runQuickAction(){
  const q=roleCfg().quick;
  if(q.type==='view') return showView(q.target);
  if(q.target==='patient') return openPatientModal();
  if(q.target==='consult') return openConsultModal();
}

function renderDashboard(){
  const target=document.getElementById('dashboard');
  const txToday=db.transactions.filter(t=>t.date===today());
  const revenueToday=txToday.reduce((a,b)=>a+b.total,0);
  const patientsToday=new Set(txToday.map(t=>t.patientId).filter(Boolean)).size;
  const low=db.inventory.filter(i=>i.qty<=i.reorder);
  const soon=db.inventory.filter(i=>{const d=daysUntil(i.expiry);return d>=0&&d<=90});
  const labsToday=db.labOrders.filter(o=>o.date===today());
  const consultToday=db.consultations.filter(c=>c.date===today());
  const pendingLabs=db.labOrders.filter(o=>o.status!=='Released');

  if(activeRole==='Administrator'){
    target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('Today’s Revenue',money(revenueToday),'Across consultation, lab & pharmacy')}${stat('Patients Today',patientsToday,'Unique billed patients')}${stat('Pending Lab Orders',pendingLabs.length,'Not yet released')}${stat('Low-stock Items',low.length,'At or below reorder level')}</div>
      <div class="grid grid-2"><div class="card"><div class="section-head"><h2>Operational Alerts</h2></div>${inventoryAlerts(low,soon)}</div><div class="card"><div class="section-head"><h2>Today’s Workflow</h2></div>${workflowRows(consultToday.length,labsToday.length,txToday.length)}</div></div>
      <div class="section-head"><h2>Recent Transactions</h2><button class="secondary" onclick="showView('pos')">Open POS</button></div>${transactionsTable(db.transactions.slice(0,8))}`;
    return;
  }

  if(activeRole==='Receptionist'){
    const waiting=consultToday.filter(c=>c.status!=='Completed').length;
    target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('Patients Registered',db.patients.length,'Current patient registry')}${stat('Consultations Today',consultToday.length,'Scheduled / registered today')}${stat('Waiting for Doctor',waiting,'Open consultation encounters')}${stat('Lab Requests Today',labsToday.length,'Orders created today')}</div>
      <div class="card"><div class="section-head"><h2>Front Desk Actions</h2></div><div class="action-grid">${actionCard('Register Patient','Create a new patient profile',`openPatientModal()`)}${actionCard('Add to Consultation Queue','Register a patient for consultation',`openConsultModal()`)}${actionCard('Create Lab Request','Register laboratory or diagnostic tests',`openLabModal()`)}</div></div>
      <div class="section-head"><h2>Today’s Consultation Queue</h2></div>${consultationsTable(consultToday)}`;
    return;
  }

  if(activeRole==='Physician'){
    const queued=consultToday.filter(c=>c.status!=='Completed');
    const completed=consultToday.filter(c=>c.status==='Completed');
    target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('Consultations Today',consultToday.length,'All encounters today')}${stat('Waiting',queued.length,'Not yet completed')}${stat('Completed',completed.length,'Completed encounters')}${stat('Pending Lab Orders',pendingLabs.length,'Awaiting result release')}</div>
      <div class="section-head"><h2>Patient Queue</h2><button class="primary" onclick="openConsultModal()">+ New Consultation</button></div>${consultationsTable(queued.length?queued:consultToday)}`;
    return;
  }

  if(activeRole==='Medical Technologist'){
    const collection=pendingLabs.filter(o=>['For Collection','Collected'].includes(o.status)).length;
    const processing=pendingLabs.filter(o=>o.status==='Processing').length;
    const validation=pendingLabs.filter(o=>o.status==='For Validation').length;
    const releasedToday=labsToday.filter(o=>o.status==='Released').length;
    target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('Collection Queue',collection,'For collection / collected')}${stat('Processing',processing,'Tests currently processing')}${stat('For Validation',validation,'Awaiting validation')}${stat('Released Today',releasedToday,'Released laboratory orders')}</div>
      <div class="section-head"><h2>Active Laboratory Queue</h2><button class="secondary" onclick="showView('laboratory')">View All Orders</button></div>${labTable(pendingLabs.slice(0,10))}`;
    return;
  }

  if(activeRole==='Pharmacist'){
    const pharmToday=txToday.flatMap(t=>t.items).filter(i=>i.kind==='Pharmacy').reduce((a,b)=>a+b.price*b.qty,0);
    target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('Pharmacy Sales',money(pharmToday),'Medicine sales today')}${stat('Low-stock Items',low.length,'At or below reorder level')}${stat('Expiring ≤90 Days',soon.length,'Batches needing attention')}${stat('Inventory Units',db.inventory.reduce((a,b)=>a+b.qty,0),'Total units across batches')}</div>
      <div class="grid grid-2"><div class="card"><div class="section-head"><h2>Inventory Alerts</h2></div>${inventoryAlerts(low,soon)}</div><div class="card"><div class="section-head"><h2>Quick Actions</h2></div><div class="action-grid">${actionCard('New Pharmacy Sale','Open medicine-only POS',`showView('pos')`)}${actionCard('Add Stock Batch','Register incoming medicine stock',`openMedicineModal()`)}</div></div></div>`;
    return;
  }

  const cashTotal=txToday.filter(t=>t.payment==='Cash').reduce((a,b)=>a+b.total,0);
  const ewallet=txToday.filter(t=>['GCash','Maya'].includes(t.payment)).reduce((a,b)=>a+b.total,0);
  target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('Today’s Collections',money(revenueToday),'All completed payments')}${stat('Transactions',txToday.length,'Completed today')}${stat('Cash',money(cashTotal),'Cash collections today')}${stat('E-wallet',money(ewallet),'GCash + Maya today')}</div>
    <div class="section-head"><h2>Recent Payments</h2><button class="primary" onclick="showView('pos')">+ New Transaction</button></div>${transactionsTable(txToday.slice(0,10))}`;
}

function inventoryAlerts(low,soon){
  return `${low.length?`<div class="notice red"><strong>Low stock:</strong> ${low.map(x=>`${esc(x.generic)} (${x.qty})`).join(', ')}</div>`:''}${soon.length?`<div class="notice" style="margin-top:10px"><strong>Expiring within 90 days:</strong> ${soon.map(x=>`${esc(x.generic)} – ${x.expiry}`).join(', ')}</div>`:''}${!low.length&&!soon.length?'<div class="empty">No urgent stock or expiry alerts.</div>':''}`;
}
function workflowRows(consults,labs,txs){return `<div class="summary-row"><span>Consultations</span><strong>${consults}</strong></div><div class="summary-row"><span>Lab orders</span><strong>${labs}</strong></div><div class="summary-row"><span>Transactions</span><strong>${txs}</strong></div><div class="summary-row"><span>Inventory units</span><strong>${db.inventory.reduce((a,b)=>a+b.qty,0)}</strong></div>`}

function renderPatients(){
  const add=can('addPatient')?'<button class="primary" onclick="openPatientModal()">+ Add Patient</button>':'';
  document.getElementById('patients').innerHTML=`<div class="section-head"><h2>${db.patients.length} registered patients</h2><div class="toolbar"><input id="patientSearch" placeholder="Search patient…">${add}</div></div><div id="patientsTable">${patientsTable(db.patients)}</div>`;
  document.getElementById('patientSearch').oninput=e=>document.getElementById('patientsTable').innerHTML=patientsTable(db.patients.filter(p=>Object.values(p).join(' ').toLowerCase().includes(e.target.value.toLowerCase())));
}
function patientsTable(rows){return `<div class="table-wrap"><table class="responsive-table"><thead><tr><th>ID</th><th>Name</th><th>Sex</th><th>DOB</th><th>Phone</th><th>Address</th><th>Discount</th></tr></thead><tbody>${rows.map(p=>`<tr><td data-label="ID">${p.id}</td><td data-label="Name"><strong>${esc(p.name)}</strong></td><td data-label="Sex">${esc(p.sex)}</td><td data-label="DOB">${p.dob||'—'}</td><td data-label="Phone">${esc(p.phone||'—')}</td><td data-label="Address">${esc(p.address||'—')}</td><td data-label="Discount"><span class="badge blue">${esc(p.discount||'None')}</span></td></tr>`).join('')||'<tr><td colspan="7" class="empty">No patients found.</td></tr>'}</tbody></table></div>`}

window.openPatientModal=function(){
  if(!guard('addPatient')) return;
  modal('Add Patient',`<div class="form-grid">${field('Full name','pName','text','e.g. Ana Dela Cruz')}${field('Sex','pSex','select',['F','M'])}${field('Date of birth','pDob','date')}${field('Phone','pPhone')}<div class="field full"><label>Address</label><input id="pAddress"></div>${field('Discount','pDiscount','select',['None','Senior','PWD'])}</div>`,()=>{
    const name=v('pName');if(!name)return alert('Name is required.');
    db.patients.push({id:nextId('P',db.patients),name,sex:v('pSex'),dob:v('pDob'),phone:v('pPhone'),address:v('pAddress'),discount:v('pDiscount')});save(`Added patient ${name}`);closeModal();
  });
};

function renderConsultations(){
  const add=can('createConsult')?`<button class="primary" onclick="openConsultModal()">${activeRole==='Receptionist'?'+ Add to Queue':'+ New Consultation'}</button>`:'';
  document.getElementById('consultations').innerHTML=`<div class="section-head"><h2>Consultation Queue & Encounters</h2>${add}</div>${consultationsTable(db.consultations)}`;
}
function consultationsTable(rows){
  return `<div class="table-wrap"><table class="responsive-table"><thead><tr><th>Encounter</th><th>Date</th><th>Patient</th><th>Doctor</th><th>Chief Complaint</th><th>Assessment</th><th>Fee</th><th>Status</th>${can('completeConsult')?'<th>Action</th>':''}</tr></thead><tbody>${rows.map(c=>`<tr><td data-label="Encounter">${c.id}</td><td data-label="Date">${c.date}</td><td data-label="Patient"><strong>${esc(patientName(c.patientId))}</strong></td><td data-label="Doctor">${esc(c.doctor||'—')}</td><td data-label="Chief Complaint">${esc(c.chief||'—')}</td><td data-label="Assessment">${esc(c.assessment||'—')}</td><td data-label="Fee">${money(c.fee)}</td><td data-label="Status"><span class="badge ${statusBadgeClass(c.status)}">${esc(c.status)}</span></td>${can('completeConsult')?`<td data-label="Action"><button class="small-btn primary-mini" onclick="openConsultModal('${c.id}')">${c.status==='Completed'?'Edit':'Open Encounter'}</button></td>`:''}</tr>`).join('')||`<tr><td colspan="${can('completeConsult')?9:8}" class="empty">No consultation encounters.</td></tr>`}</tbody></table></div>`;
}
window.openConsultModal=function(id=''){
  if(id && !guard('completeConsult')) return;
  if(!id && !guard('createConsult')) return;
  const existing=id?db.consultations.find(c=>c.id===id):null;
  const receptionist=activeRole==='Receptionist';
  const title=existing?'Consultation Encounter':(receptionist?'Add to Consultation Queue':'New Consultation');
  const pId=existing?.patientId||db.patients[0]?.id||'';
  modal(title,`<div class="form-grid">${patientSelect('cPatient',pId)}${field('Doctor','cDoctor','text',existing?.doctor||'')}${field('Date','cDate','date',existing?.date||today())}${field('Consultation fee','cFee','number',existing?.fee??500)}<div class="field full"><label>Chief complaint</label><input id="cChief" value="${esc(existing?.chief||'')}"></div><div class="field full"><label>Vitals</label><input id="cVitals" value="${esc(existing?.vitals||'')}" placeholder="BP, PR, RR, Temp"></div><div class="field full"><label>Assessment / Diagnosis</label><textarea id="cAssessment" ${receptionist?'disabled':''}>${esc(existing?.assessment||'')}</textarea></div>${receptionist?'<div class="notice blue full">Receptionist entries are added to the physician queue. Clinical assessment is completed under the Physician role.</div>':''}</div>`,()=>{
    const record={patientId:v('cPatient'),doctor:v('cDoctor'),date:v('cDate')||today(),chief:v('cChief'),vitals:v('cVitals'),assessment:v('cAssessment'),fee:+v('cFee')||0,status:receptionist?'Queued':'Completed'};
    if(existing){Object.assign(existing,record);save(`Updated consultation ${existing.id}`)}else{record.id=nextId('C',db.consultations);db.consultations.unshift(record);save(`Created consultation ${record.id}`)}
    closeModal();
  },existing?'Save Encounter':(receptionist?'Add to Queue':'Save Encounter'));
};

function renderLab(){
  const add=can('createLab')?'<button class="primary" onclick="openLabModal()">+ New Lab Order</button>':'';
  document.getElementById('laboratory').innerHTML=`<div class="section-head"><h2>Laboratory & Diagnostic Orders</h2>${add}</div>${labTable(db.labOrders)}`;
}
function labTable(rows){
  const hasActions=can('labStatus')||can('labResult');
  return `<div class="table-wrap"><table class="responsive-table"><thead><tr><th>Order</th><th>Date</th><th>Patient</th><th>Tests</th><th>Amount</th><th>Status</th><th>Result</th>${hasActions?'<th>Actions</th>':''}</tr></thead><tbody>${rows.map(o=>`<tr><td data-label="Order">${o.id}</td><td data-label="Date">${o.date}</td><td data-label="Patient"><strong>${esc(patientName(o.patientId))}</strong></td><td data-label="Tests">${o.tests.map(t=>`<span class="badge blue">${esc(t)}</span>`).join(' ')}</td><td data-label="Amount">${money(o.amount)}</td><td data-label="Status"><span class="badge ${statusBadgeClass(o.status)}">${esc(o.status)}</span></td><td data-label="Result">${o.resultNote?esc(o.resultNote):'<span class="muted">Not encoded</span>'}</td>${hasActions?`<td data-label="Actions"><div class="inline-actions">${can('labStatus')?labStatusControl(o):''}${can('labResult')?`<button class="small-btn" onclick="openLabResultModal('${o.id}')">Encode Result</button>`:''}</div></td>`:''}</tr>`).join('')||`<tr><td colspan="${hasActions?8:7}" class="empty">No laboratory orders.</td></tr>`}</tbody></table></div>`;
}
function labStatusControl(o){
  const statuses=['For Collection','Collected','Processing','For Validation','Released'];
  return `<select class="small-select" aria-label="Lab status" onchange="setLabStatus('${o.id}',this.value)">${statuses.map(s=>`<option ${o.status===s?'selected':''}>${s}</option>`).join('')}</select>`;
}
window.setLabStatus=function(id,status){if(!guard('labStatus'))return;const o=db.labOrders.find(x=>x.id===id);if(o){o.status=status;save(`Lab order ${id} changed to ${status}`)}};
window.openLabResultModal=function(id){
  if(!guard('labResult'))return;
  const o=db.labOrders.find(x=>x.id===id);if(!o)return;
  modal(`Laboratory Result · ${o.id}`,`<div class="summary-box"><div class="summary-row"><span>Patient</span><strong>${esc(patientName(o.patientId))}</strong></div><div class="summary-row"><span>Tests</span><strong>${o.tests.map(esc).join(', ')}</strong></div></div><div class="field" style="margin-top:14px"><label>Result / Result note</label><textarea id="labResultNote" placeholder="MVP result note or summary">${esc(o.resultNote||'')}</textarea></div><div class="notice blue" style="margin-top:12px">For production, each test should use structured analytes, units, reference ranges, flags, validator and release timestamps.</div>`,()=>{o.resultNote=v('labResultNote');if(o.status==='For Collection'||o.status==='Collected')o.status='Processing';save(`Updated result for ${o.id}`);closeModal()},'Save Result');
};
window.openLabModal=function(){
  if(!guard('createLab'))return;
  const labServices=db.services.filter(s=>['Laboratory','Diagnostic'].includes(s.type));
  modal('New Laboratory / Diagnostic Order',`<div class="form-grid">${patientSelect('lPatient')}${field('Date','lDate','date',today())}<div class="field full"><label>Tests</label>${labServices.map(s=>`<label style="display:flex;gap:8px;align-items:center;margin:9px 0"><input style="width:auto;min-height:0" type="checkbox" class="labTest" value="${s.id}"> ${esc(s.name)} — ${money(s.price)}</label>`).join('')}</div></div>`,()=>{
    const ids=[...document.querySelectorAll('.labTest:checked')].map(x=>x.value);if(!ids.length)return alert('Select at least one test.');
    const tests=ids.map(id=>db.services.find(s=>s.id===id));const order={id:nextId('LAB',db.labOrders),patientId:v('lPatient'),date:v('lDate')||today(),tests:tests.map(x=>x.name),status:'For Collection',amount:tests.reduce((a,b)=>a+b.price,0),resultNote:''};db.labOrders.unshift(order);save(`Created lab order ${order.id}`);closeModal();
  });
};

function renderPharmacy(){
  const add=can('addMedicine')?'<button class="primary" onclick="openMedicineModal()">+ Add Medicine Batch</button>':'';
  document.getElementById('pharmacy').innerHTML=`<div class="section-head"><h2>Medicine Inventory</h2>${add}</div><div class="table-wrap"><table class="responsive-table"><thead><tr><th>Medicine</th><th>Batch</th><th>Expiry</th><th>Stock</th><th>Reorder</th><th>Cost</th><th>Selling Price</th><th>Status</th></tr></thead><tbody>${db.inventory.map(i=>{const days=daysUntil(i.expiry);const low=i.qty<=i.reorder;const exp=days<0;const soon=days>=0&&days<=90;return `<tr><td data-label="Medicine"><strong>${esc(i.generic)} ${esc(i.strength)}</strong><br><span class="muted">${esc(i.brand)} · ${esc(i.form)}</span></td><td data-label="Batch">${esc(i.batch)}</td><td data-label="Expiry">${i.expiry}</td><td data-label="Stock">${i.qty}</td><td data-label="Reorder">${i.reorder}</td><td data-label="Cost">${money(i.cost)}</td><td data-label="Selling Price">${money(i.sell)}</td><td data-label="Status">${exp?'<span class="badge red">Expired</span>':low?'<span class="badge red">Low stock</span>':soon?'<span class="badge amber">Expiring soon</span>':'<span class="badge green">OK</span>'}</td></tr>`}).join('')}</tbody></table></div>`;
}
window.openMedicineModal=function(){
  if(!guard('addMedicine'))return;
  modal('Add Medicine Batch',`<div class="form-grid">${field('Generic name','mGeneric')}${field('Brand','mBrand')}${field('Strength','mStrength')}${field('Dosage form','mForm')}${field('Batch / Lot','mBatch')}${field('Expiry','mExpiry','date')}${field('Quantity','mQty','number',0)}${field('Reorder level','mReorder','number',20)}${field('Cost per unit','mCost','number',0)}${field('Selling price','mSell','number',0)}</div>`,()=>{db.inventory.push({id:`MED-${Date.now()}`,generic:v('mGeneric'),brand:v('mBrand'),strength:v('mStrength'),form:v('mForm'),batch:v('mBatch'),expiry:v('mExpiry'),qty:+v('mQty')||0,reorder:+v('mReorder')||0,cost:+v('mCost')||0,sell:+v('mSell')||0});save('Added medicine batch');closeModal()});
};

function captureSaleDraft(){
  const p=document.getElementById('salePatient');const pay=document.getElementById('payMethod');
  if(p)saleDraft.patientId=p.value;if(pay)saleDraft.payment=pay.value;
}
function renderPOS(){
  if(!canView('pos'))return;
  const pharmacist=activeRole==='Pharmacist';
  const services=pharmacist?[]:db.services;
  const medicines=db.inventory.filter(i=>i.qty>0&&daysUntil(i.expiry)>=0).sort((a,b)=>new Date(a.expiry)-new Date(b.expiry));
  const serviceCard=services.length?`<div class="card"><div class="section-head"><h2>Services</h2></div><div class="catalog">${services.map(s=>`<button class="catalog-item" onclick="addService('${s.id}')"><strong>${esc(s.name)}</strong><span>${s.type} · ${money(s.price)}</span></button>`).join('')}</div></div>`:'';
  document.getElementById('pos').innerHTML=`<div class="pos-layout"><div>${serviceCard}<div class="card" style="${services.length?'margin-top:16px':''}"><div class="section-head"><h2>${pharmacist?'Medicines':'Pharmacy'}</h2></div><div class="catalog">${medicines.map(i=>`<button class="catalog-item" onclick="addMedicine('${i.id}')"><strong>${esc(i.generic)} ${esc(i.strength)}</strong><span>${esc(i.brand)} · ${esc(i.batch)} · Exp ${i.expiry}<br>Stock ${i.qty} · ${money(i.sell)}</span></button>`).join('')||'<div class="empty">No saleable medicine batches.</div>'}</div></div></div>
    <div class="card"><div class="section-head"><h2>${pharmacist?'Pharmacy Sale':'Current Bill'}</h2><button class="ghost" onclick="clearCart()">Clear</button></div><div class="field"><label>Patient</label><select id="salePatient" onchange="saleDraft.patientId=this.value"><option value="">Walk-in</option>${db.patients.map(p=>`<option value="${p.id}" ${saleDraft.patientId===p.id?'selected':''}>${esc(p.name)} (${p.id})</option>`).join('')}</select></div><div id="cartLines">${cart.length?cart.map((x,idx)=>`<div class="cart-line"><div><strong>${esc(x.name)}</strong><br><span class="muted">${x.kind}</span></div><input type="number" min="1" value="${x.qty}" onchange="updateCartQty(${idx},this.value)"><div>${money(x.price*x.qty)}</div><button class="close-x" onclick="removeCartItem(${idx})">×</button></div>`).join(''):'<div class="empty">Add services or medicines to the bill.</div>'}</div>${saleSummary()}<div class="field" style="margin-top:12px"><label>Payment method</label><select id="payMethod" onchange="saleDraft.payment=this.value">${['Cash','GCash','Maya','Bank Transfer','Other'].map(m=>`<option ${saleDraft.payment===m?'selected':''}>${m}</option>`).join('')}</select></div><button class="primary" style="width:100%;margin-top:12px" onclick="checkout()" ${cart.length?'':'disabled'}>Complete Transaction</button></div></div>`;
}
window.addService=function(id){if(!can('checkout'))return;captureSaleDraft();const s=db.services.find(x=>x.id===id);addCartLine({kind:s.type,refId:s.id,name:s.name,qty:1,price:s.price});renderPOS()};
window.addMedicine=function(id){if(!can('checkout'))return;captureSaleDraft();const m=db.inventory.find(x=>x.id===id);addCartLine({kind:'Pharmacy',refId:m.id,name:`${m.generic} ${m.strength}`,qty:1,price:m.sell});renderPOS()};
function addCartLine(line){const existing=cart.find(x=>x.kind===line.kind&&x.refId===line.refId);if(existing)existing.qty+=1;else cart.push(line)}
window.updateCartQty=function(idx,value){captureSaleDraft();cart[idx].qty=Math.max(1,+value||1);renderPOS()};
window.removeCartItem=function(idx){captureSaleDraft();cart.splice(idx,1);renderPOS()};
window.clearCart=function(){captureSaleDraft();cart=[];renderPOS()};
function saleSummary(){const sub=cart.reduce((a,b)=>a+b.price*b.qty,0);return `<div class="summary-box" style="margin-top:14px"><div class="summary-row"><span>Subtotal</span><strong>${money(sub)}</strong></div><div class="summary-row"><span>Discount</span><strong>${money(0)}</strong></div><div class="summary-row total"><span>Total</span><span>${money(sub)}</span></div></div>`}
window.checkout=function(){
  if(!guard('checkout')||!cart.length)return;captureSaleDraft();
  for(const line of cart.filter(x=>x.kind==='Pharmacy')){const inv=db.inventory.find(i=>i.id===line.refId);if(!inv||inv.qty<line.qty)return alert(`Insufficient stock for ${line.name}.`)}
  const items=structuredClone(cart);for(const line of items.filter(x=>x.kind==='Pharmacy'))db.inventory.find(i=>i.id===line.refId).qty-=line.qty;
  const total=items.reduce((a,b)=>a+b.price*b.qty,0),id=nextId('TXN',db.transactions);
  const txn={id,date:today(),time:new Date().toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'}),patientId:saleDraft.patientId||null,payment:saleDraft.payment,total,items};
  db.transactions.unshift(txn);cart=[];saleDraft={patientId:'',payment:'Cash'};save(`Completed transaction ${id} (${money(total)})`);showReceipt(txn);
};
function showReceipt(t){modal('Transaction Complete',`<div class="receipt"><h3>ACCU LABORATORY AND DIAGNOSTIC CENTER</h3><p>Clinic POS Receipt</p><p>${t.date} ${t.time}</p><p>${t.id}</p><hr><p style="text-align:left"><strong>Patient:</strong> ${esc(patientName(t.patientId))}</p><hr>${t.items.map(i=>`<div class="summary-row"><span>${esc(i.name)} ×${i.qty}</span><span>${money(i.price*i.qty)}</span></div>`).join('')}<hr><div class="summary-row total"><span>TOTAL</span><span>${money(t.total)}</span></div><p>Paid via ${esc(t.payment)}</p><p>Thank you.</p></div>`,null,'Close',`<button class="secondary no-print" onclick="window.print()">Print Receipt</button>`)}

function renderReports(){
  if(!canView('reports'))return;
  const cashier=activeRole==='Cashier';
  const rows=cashier?db.transactions.filter(t=>t.date===today()):db.transactions;
  const items=rows.flatMap(t=>t.items);
  const rev=rows.reduce((a,b)=>a+b.total,0);
  const consult=items.filter(i=>i.kind==='Consultation').reduce((a,b)=>a+b.price*b.qty,0);
  const lab=items.filter(i=>['Laboratory','Diagnostic'].includes(i.kind)).reduce((a,b)=>a+b.price*b.qty,0);
  const pharm=items.filter(i=>i.kind==='Pharmacy').reduce((a,b)=>a+b.price*b.qty,0);
  const cards=cashier?`${stat('Today’s Revenue',money(rev),'Completed transactions today')}${stat('Transactions',rows.length,'Today’s receipts')}${stat('Cash',money(rows.filter(t=>t.payment==='Cash').reduce((a,b)=>a+b.total,0)),'Cash payments')}${stat('Digital',money(rows.filter(t=>t.payment!=='Cash').reduce((a,b)=>a+b.total,0)),'Non-cash payments')}`:`${stat('Total Revenue',money(rev),'All recorded transactions')}${stat('Consultation',money(consult),'Billed consultation services')}${stat('Laboratory',money(lab),'Lab & diagnostic services')}${stat('Pharmacy',money(pharm),'Dispensed medicines')}`;
  document.getElementById('reports').innerHTML=`<div class="grid grid-4">${cards}</div><div class="section-head"><h2>${cashier?'Today’s Transaction Ledger':'Transaction Ledger'}</h2>${can('export')?'<button class="secondary" onclick="exportCSV()">Export CSV</button>':''}</div>${transactionsTable(rows)}`;
}
function transactionsTable(rows){return `<div class="table-wrap"><table class="responsive-table"><thead><tr><th>Transaction</th><th>Date</th><th>Patient</th><th>Items</th><th>Payment</th><th>Total</th></tr></thead><tbody>${rows.map(t=>`<tr><td data-label="Transaction">${t.id}</td><td data-label="Date">${t.date}<br><span class="muted">${t.time||''}</span></td><td data-label="Patient">${esc(patientName(t.patientId))}</td><td data-label="Items">${t.items.map(i=>`${esc(i.name)} ×${i.qty}`).join('<br>')}</td><td data-label="Payment">${esc(t.payment)}</td><td data-label="Total"><strong>${money(t.total)}</strong></td></tr>`).join('')||'<tr><td colspan="6" class="empty">No transactions yet.</td></tr>'}</tbody></table></div>`}
window.exportCSV=function(){if(!guard('export'))return;const rows=[['Transaction','Date','Patient','Payment','Total'],...db.transactions.map(t=>[t.id,t.date,patientName(t.patientId),t.payment,t.total])];const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='accu-transactions.csv';a.click()};

function renderSettings(){
  if(!canView('settings'))return;
  document.getElementById('settings').innerHTML=`<div class="grid grid-2"><div class="card"><h2>Clinic Configuration</h2><p class="muted">This MVP stores data in this browser using localStorage. For production, move authentication and patient data to a secure server/database with backups.</p><div class="summary-row"><span>Patients</span><strong>${db.patients.length}</strong></div><div class="summary-row"><span>Services</span><strong>${db.services.length}</strong></div><div class="summary-row"><span>Medicine batches</span><strong>${db.inventory.length}</strong></div><div class="summary-row"><span>Transactions</span><strong>${db.transactions.length}</strong></div></div><div class="card"><h2>Role-based Views</h2><p class="muted">Administrator · Receptionist · Physician · Medical Technologist · Pharmacist · Cashier</p><div class="notice">The demo now hides modules and actions by role. This is still client-side only; production authorization must be enforced in the backend/database.</div></div></div><div class="section-head"><h2>Audit Log</h2></div><div class="table-wrap"><table class="responsive-table"><thead><tr><th>Timestamp</th><th>User / Role</th><th>Action</th></tr></thead><tbody>${db.audit.slice(0,100).map(a=>`<tr><td data-label="Timestamp">${new Date(a.ts).toLocaleString('en-PH')}</td><td data-label="Role">${esc(a.user)}</td><td data-label="Action">${esc(a.action)}</td></tr>`).join('')}</tbody></table></div>`;
}

function patientSelect(id,selected=''){return `<div class="field"><label>Patient</label><select id="${id}">${db.patients.map(p=>`<option value="${p.id}" ${selected===p.id?'selected':''}>${esc(p.name)} (${p.id})</option>`).join('')}</select></div>`}
function field(label,id,type='text',arg=''){
  if(type==='select')return `<div class="field"><label>${label}</label><select id="${id}">${arg.map(o=>`<option>${esc(o)}</option>`).join('')}</select></div>`;
  return `<div class="field"><label>${label}</label><input id="${id}" type="${type}" ${arg!==''?`value="${esc(arg)}"`:''}></div>`;
}
function v(id){return document.getElementById(id)?.value?.trim()||''}
function modal(title,body,onSave,saveText='Save',extra=''){
  document.getElementById('modalRoot').innerHTML=`<div class="modal-backdrop" onclick="if(event.target===this)closeModal()"><div class="modal"><div class="modal-head"><h3>${title}</h3><button class="close-x" onclick="closeModal()">×</button></div><div class="modal-body">${body}</div><div class="modal-foot">${extra}<button class="ghost" onclick="closeModal()">${onSave?'Cancel':saveText}</button>${onSave?`<button id="modalSave" class="primary">${saveText}</button>`:''}</div></div></div>`;
  if(onSave)document.getElementById('modalSave').onclick=onSave;
}
window.closeModal=()=>document.getElementById('modalRoot').innerHTML='';

function renderAll(){renderDashboard();renderPatients();renderConsultations();renderLab();renderPharmacy();renderPOS();renderReports();renderSettings()}

// Static UI wiring
document.getElementById('todayLabel').textContent=new Date().toLocaleDateString('en-PH',{weekday:'short',year:'numeric',month:'short',day:'numeric'});
document.querySelectorAll('.nav-item').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.view)));
document.getElementById('quickSaleBtn').onclick=runQuickAction;
document.getElementById('mobileQuickBtn').onclick=runQuickAction;
document.getElementById('menuBtn').onclick=openDrawer;
document.getElementById('drawerBackdrop').onclick=closeDrawer;
document.getElementById('roleSelect').addEventListener('change',e=>{activeRole=e.target.value;localStorage.setItem(ROLE_KEY,activeRole);cart=[];saleDraft={patientId:'',payment:'Cash'};renderAll();updateRoleUI()});
document.getElementById('resetDemo').onclick=()=>{if(confirm('Reset all demo data?')){localStorage.removeItem(STORAGE_KEY);db=load();cart=[];saleDraft={patientId:'',payment:'Cash'};renderAll();updateRoleUI();showView('dashboard')}};

renderAll();
updateRoleUI();
