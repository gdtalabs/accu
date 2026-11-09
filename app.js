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
    {id:'MED-001',generic:'Paracetamol',brand:'Biogesic',strength:'500 mg',form:'Tablet',batch:'PCM2601',supplier:'Sample Supplier',expiry:'2027-05-31',qty:160,reorder:40,cost:2,sell:5},
    {id:'MED-002',generic:'Amoxicillin',brand:'Generic',strength:'500 mg',form:'Capsule',batch:'AMX2602',supplier:'Sample Supplier',expiry:'2026-12-31',qty:35,reorder:30,cost:4.5,sell:8},
    {id:'MED-003',generic:'Metformin',brand:'Generic',strength:'500 mg',form:'Tablet',batch:'MET2604',supplier:'Sample Supplier',expiry:'2027-04-30',qty:90,reorder:25,cost:3,sell:6}
  ],
  labSupplies: [
    {id:'LS-001',name:'EDTA Tube',category:'Collection',brand:'Generic',supplier:'Sample Lab Supplier',lot:'EDTA-2601',unit:'piece',expiry:'2027-08-31',qty:120,reorder:30,cost:6.5},
    {id:'LS-002',name:'Urine Container',category:'Collection',brand:'Generic',supplier:'Sample Lab Supplier',lot:'UC-2602',unit:'piece',expiry:'',qty:80,reorder:25,cost:4},
    {id:'LS-003',name:'CBC Reagent',category:'Reagent',brand:'Analyzer Reagent',supplier:'Sample Lab Supplier',lot:'CBC-R-01',unit:'bottle',expiry:'2027-02-28',qty:8,reorder:3,cost:1250}
  ],
  labSupplyMovements: [],
  services: [
    {id:'SRV-CONSULT',type:'Consultation',name:'General Consultation',price:500},
    {id:'SRV-CBC',type:'Laboratory',name:'CBC',price:350},
    {id:'SRV-UA',type:'Laboratory',name:'Urinalysis',price:150},
    {id:'SRV-FBS',type:'Laboratory',name:'Fasting Blood Sugar',price:180},
    {id:'SRV-LIPID',type:'Laboratory',name:'Lipid Profile',price:650},
    {id:'SRV-XRAY',type:'Diagnostic',name:'Chest X-ray',price:600}
  ],
  transactions: [],
  clinic: {
    name:'ACCU Laboratory and Diagnostic Center',
    tradeName:'ACCU Laboratory and Diagnostic Center',
    address:'',
    contact:'',
    tin:'',
    branchCode:'',
    taxType:'NON-VAT',
    vatRate:12,
    invoiceLabel:'INVOICE',
    invoicePrefix:'INV-',
    invoiceDigits:7,
    invoiceNextNumber:1,
    paymentReceiptPrefix:'PR-',
    paymentReceiptDigits:7,
    paymentReceiptNextNumber:1,
    permitNo:'',
    permitDate:'',
    min:'',
    machineSerial:'',
    receiptFooter:'Thank you for choosing ACCU.'
  },
  pharmacyEntity: {
    name:'',
    tradeName:'',
    address:'',
    contact:'',
    tin:'',
    branchCode:'',
    taxType:'NON-VAT',
    vatRate:12,
    invoiceLabel:'INVOICE',
    invoicePrefix:'PH-',
    invoiceDigits:7,
    invoiceNextNumber:1,
    paymentReceiptPrefix:'PH-PR-',
    paymentReceiptDigits:7,
    paymentReceiptNextNumber:1,
    permitNo:'',
    permitDate:'',
    min:'',
    machineSerial:'',
    receiptFooter:'Thank you.'
  },
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
    actions:['addPatient','createConsult','completeConsult','createLab','labStatus','labResult','addMedicine','addLabSupply','useLabSupply','checkout','export'],
    bottom:['dashboard','patients','laboratory','pos','reports'],
    context:'Full clinic administration, clinical operations, billing, inventory, reports and audit access.',
    quick:{type:'view',target:'pos',label:'+ New Transaction'}
  },
  'Receptionist': {
    views:['dashboard','patients','consultations','laboratory'],
    actions:['addPatient','createConsult','createLab'],
    bottom:['dashboard','patients','consultations','laboratory'],
    context:'Front desk access for registration, consultation queueing and diagnostic requests. No clinical results, inventory or billing access.',
    quick:{type:'action',target:'patient',label:'+ Add Patient'}
  },
  'Physician': {
    views:['dashboard','patients','consultations','laboratory'],
    actions:['createConsult','completeConsult','createLab'],
    bottom:['dashboard','consultations','patients','laboratory'],
    context:'Clinical access for patient lookup, encounters, assessments and diagnostic requests. Laboratory results are read-only.',
    quick:{type:'action',target:'consult',label:'+ New Consultation'}
  },
  'Medical Technologist': {
    views:['dashboard','laboratory'],
    actions:['labStatus','labResult','addLabSupply','useLabSupply'],
    bottom:['dashboard','laboratory'],
    context:'Laboratory workbench for specimen workflow, result encoding, validation and release. No consultation, pharmacy or billing access.',
    quick:{type:'view',target:'laboratory',label:'Open Lab Queue'}
  },
  'Pharmacist': {
    views:['dashboard','pharmacy','pos'],
    actions:['addMedicine','checkout'],
    bottom:['dashboard','pharmacy','pos'],
    context:'Pharmacy access for inventory, batch/expiry monitoring and medicine-only dispensing.',
    quick:{type:'view',target:'pos',label:'+ Pharmacy Sale'}
  },
  'Cashier': {
    views:['dashboard','pos','reports'],
    actions:['checkout'],
    bottom:['dashboard','pos','reports'],
    context:'Cashier access for unified billing, payment collection and today’s transaction ledger. No clinical editing or inventory management.',
    quick:{type:'view',target:'pos',label:'+ New Transaction'}
  }
};

let db = load();
let cart = [];
let saleDraft = {entity:'clinic',patientId:'',payment:'Cash',tendered:'',buyerName:'',buyerTin:'',buyerAddress:'',discountType:'None',discountId:'',discountPercent:'0'};
let activeRole = localStorage.getItem(ROLE_KEY) || 'Administrator';
if(!ROLE_CONFIG[activeRole]) activeRole = 'Administrator';
let activeView = 'dashboard';
let labActiveTab = 'orders';
let pharmacySearch = '';
let medicinePosSearch = '';

function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw){ localStorage.setItem(STORAGE_KEY, JSON.stringify(seed)); return structuredClone(seed); }
  try{
    const parsed = JSON.parse(raw);
    parsed.audit ||= [];
    parsed.transactions ||= [];
    parsed.labOrders ||= [];
    parsed.consultations ||= [];
    parsed.clinic ||= structuredClone(seed.clinic);
    parsed.clinic = {...structuredClone(seed.clinic), ...parsed.clinic};
    parsed.pharmacyEntity ||= structuredClone(seed.pharmacyEntity);
    parsed.pharmacyEntity = {...structuredClone(seed.pharmacyEntity), ...parsed.pharmacyEntity};
    parsed.labSupplies ||= structuredClone(seed.labSupplies);
    parsed.labSupplyMovements ||= [];
    parsed.services = (parsed.services||[]).map(x=>({...x,taxClass:x.taxClass||'Unclassified'}));
    parsed.inventory = (parsed.inventory||[]).map(x=>({...x,supplier:x.supplier||'',taxClass:x.taxClass||'Unclassified'}));
    parsed.transactions = (parsed.transactions||[]).map(t=>({
      ...t,
      entity:t.entity||(((t.items||[]).length&&(t.items||[]).every(i=>i.kind==='Pharmacy'))?'pharmacy':'clinic'),
      invoiceNo:t.invoiceNo||'',
      legacyInvoice:!t.invoiceNo,
      discountType:t.discountType||'None',
      discountId:t.discountId||'',
      discountPercent:Number(t.discountPercent||0),
      discountAmount:Number(t.discountAmount||0),
      buyerName:t.buyerName||'',
      buyerTin:t.buyerTin||'',
      buyerAddress:t.buyerAddress||'',
      taxSummary:t.taxSummary||null
    }));
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
function entityCfg(entity='clinic'){return entity==='pharmacy'?(db.pharmacyEntity||seed.pharmacyEntity):(db.clinic||seed.clinic)}
function clinicCfg(){return entityCfg('clinic')}
function currentSaleEntity(){return activeRole==='Pharmacist'?'pharmacy':(saleDraft.entity||'clinic')}
function entityLabel(entity){return entity==='pharmacy'?'Pharmacy':'Clinic / Laboratory'}
function birSetupMissing(entity='clinic'){
  const c=entityCfg(entity);
  const required=[['Registered name',c.name],['Registered address',c.address],['TIN',c.tin],['Branch code',c.branchCode],['Tax status',c.taxType],['Permit to Use no.',c.permitNo],['Permit date',c.permitDate]];
  return required.filter(([,v])=>!String(v||'').trim()).map(([k])=>k);
}
function isBirConfigured(entity='clinic'){return birSetupMissing(entity).length===0}
function invoiceNumberFrom(n,entity='clinic'){
  const c=entityCfg(entity);
  const digits=Math.max(1,Math.min(12,Number(c.invoiceDigits||7)));
  return `${c.invoicePrefix||''}${String(Number(n||1)).padStart(digits,'0')}`;
}
function nextInvoiceNumber(entity='clinic'){
  const c=entityCfg(entity);
  const n=Math.max(1,Number(c.invoiceNextNumber||1));
  const no=invoiceNumberFrom(n,entity);
  c.invoiceNextNumber=n+1;
  return no;
}
function paymentReceiptNumberFrom(n,entity='clinic'){
  const c=entityCfg(entity);
  const digits=Math.max(1,Math.min(12,Number(c.paymentReceiptDigits||7)));
  return `${c.paymentReceiptPrefix||'PR-'}${String(Number(n||1)).padStart(digits,'0')}`;
}
function nextPaymentReceiptNumber(entity='clinic'){
  const c=entityCfg(entity);
  const n=Math.max(1,Number(c.paymentReceiptNextNumber||1));
  const no=paymentReceiptNumberFrom(n,entity);
  c.paymentReceiptNextNumber=n+1;
  return no;
}


function discountRate(){
  const n=Math.max(0,Math.min(100,Number(saleDraft.discountPercent||0)));
  return n/100;
}
function computeSale(){
  const subtotal=cartTotal();
  const rate=discountRate();
  const discountAmount=+(subtotal*rate).toFixed(2);
  const netTotal=+(subtotal-discountAmount).toFixed(2);
  const c=entityCfg(currentSaleEntity());
  const taxType=String(c.taxType||'NON-VAT').toUpperCase();
  const vatRate=Math.max(0,Number(c.vatRate||12))/100;
  const out={subtotal,discountAmount,total:netTotal,vatableSales:0,vatAmount:0,vatExemptSales:0,zeroRatedSales:0,nonVatSales:0,unclassified:[]};
  if(taxType!=='VAT'){
    out.nonVatSales=netTotal;
    return out;
  }
  const denom=subtotal||1;
  cart.forEach(line=>{
    const gross=line.price*line.qty;
    const lineDiscount=discountAmount*(gross/denom);
    const net=Math.max(0,gross-lineDiscount);
    const cls=String(line.taxClass||'Unclassified');
    if(cls==='VATable'){
      const base=net/(1+vatRate);
      out.vatableSales+=base;
      out.vatAmount+=net-base;
    }else if(cls==='VAT-exempt') out.vatExemptSales+=net;
    else if(cls==='Zero-rated') out.zeroRatedSales+=net;
    else if(cls==='Non-VAT') out.nonVatSales+=net;
    else out.unclassified.push(line.name);
  });
  for(const k of ['vatableSales','vatAmount','vatExemptSales','zeroRatedSales','nonVatSales']) out[k]=+out[k].toFixed(2);
  return out;
}
function sourceTaxClass(line){
  if(line.kind==='Pharmacy') return db.inventory.find(x=>x.id===line.refId)?.taxClass||'Unclassified';
  return db.services.find(x=>x.id===line.refId)?.taxClass||'Unclassified';
}

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
  document.body.dataset.role=activeRole.replace(/\s+/g,'-').toLowerCase();
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
  const clinicRevenueToday=txToday.filter(t=>(t.entity||'clinic')==='clinic').reduce((a,b)=>a+b.total,0);
  const pharmacyRevenueToday=txToday.filter(t=>t.entity==='pharmacy').reduce((a,b)=>a+b.total,0);
  const patientsToday=new Set(txToday.map(t=>t.patientId).filter(Boolean)).size;
  const low=db.inventory.filter(i=>i.qty<=i.reorder);
  const soon=db.inventory.filter(i=>i.expiry&&(()=>{const d=daysUntil(i.expiry);return d>=0&&d<=90})());
  const lowLab=(db.labSupplies||[]).filter(i=>i.qty<=i.reorder);
  const labsToday=db.labOrders.filter(o=>o.date===today());
  const consultToday=db.consultations.filter(c=>c.date===today());
  const pendingLabs=db.labOrders.filter(o=>o.status!=='Released');

  if(activeRole==='Administrator'){
    target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('Clinic / Lab Revenue',money(clinicRevenueToday),'Today · separate entity')}${stat('Pharmacy Revenue',money(pharmacyRevenueToday),'Today · separate entity')}${stat('Pending Lab Orders',pendingLabs.length,'Not yet released')}${stat('Stock Alerts',low.length+lowLab.length,'Pharmacy + lab supplies')}</div>
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
    target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('Collection Queue',collection,'For collection / collected')}${stat('Processing',processing,'Tests currently processing')}${stat('For Validation',validation,'Awaiting validation')}${stat('Low Lab Supplies',lowLab.length,'At or below reorder level')}</div>
      <div class="section-head"><h2>Active Laboratory Queue</h2><button class="secondary" onclick="showView('laboratory')">View All Orders</button></div>${labTable(pendingLabs.slice(0,10))}`;
    return;
  }

  if(activeRole==='Pharmacist'){
    const pharmToday=txToday.filter(t=>t.entity==='pharmacy').reduce((a,b)=>a+b.total,0);
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
  const frontDesk=activeRole==='Receptionist';
  const clinical=!frontDesk;
  const action=can('completeConsult');
  const head=frontDesk
    ? '<th>Encounter</th><th>Date</th><th>Patient</th><th>Doctor</th><th>Chief Complaint</th><th>Status</th>'
    : '<th>Encounter</th><th>Date</th><th>Patient</th><th>Doctor</th><th>Chief Complaint</th><th>Assessment</th><th>Fee</th><th>Status</th>';
  const colspan=(frontDesk?6:8)+(action?1:0);
  return `<div class="table-wrap"><table class="responsive-table"><thead><tr>${head}${action?'<th>Action</th>':''}</tr></thead><tbody>${rows.map(c=>`<tr><td data-label="Encounter">${c.id}</td><td data-label="Date">${c.date}</td><td data-label="Patient"><strong>${esc(patientName(c.patientId))}</strong></td><td data-label="Doctor">${esc(c.doctor||'—')}</td><td data-label="Chief Complaint">${esc(c.chief||'—')}</td>${clinical?`<td data-label="Assessment">${esc(c.assessment||'—')}</td><td data-label="Fee">${money(c.fee)}</td>`:''}<td data-label="Status"><span class="badge ${statusBadgeClass(c.status)}">${esc(c.status)}</span></td>${action?`<td data-label="Action"><button class="small-btn primary-mini" onclick="openConsultModal('${c.id}')">${c.status==='Completed'?'Edit':'Open Encounter'}</button></td>`:''}</tr>`).join('')||`<tr><td colspan="${colspan}" class="empty">No consultation encounters.</td></tr>`}</tbody></table></div>`;
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
  const canSupplies=['Administrator','Medical Technologist'].includes(activeRole);
  if(!canSupplies) labActiveTab='orders';
  const addOrder=can('createLab')?'<button class="primary" onclick="openLabModal()">+ New Lab Order</button>':'';
  const tabs=canSupplies?`<div class="subtabs"><button class="subtab ${labActiveTab==='orders'?'active':''}" onclick="setLabTab('orders')">Orders</button><button class="subtab ${labActiveTab==='supplies'?'active':''}" onclick="setLabTab('supplies')">Lab Supplies</button></div>`:'';
  const target=document.getElementById('laboratory');
  if(labActiveTab==='supplies'&&canSupplies){
    const low=db.labSupplies.filter(i=>i.qty<=i.reorder).length;
    const expSoon=db.labSupplies.filter(i=>i.expiry&&daysUntil(i.expiry)>=0&&daysUntil(i.expiry)<=90).length;
    target.innerHTML=`${tabs}<div class="grid grid-3 kpi-strip">${stat('Supply Batches',db.labSupplies.length,'Tracked laboratory supply batches')}${stat('Low Stock',low,'At or below reorder level')}${stat('Expiring ≤90 Days',expSoon,'Batches needing attention')}</div><div class="section-head"><div><h2>Laboratory Supplies</h2><p class="muted">Separate from pharmacy inventory. Track reagents, collection materials, PPE and other laboratory consumables.</p></div>${can('addLabSupply')?'<button class="primary" onclick="openLabSupplyModal()">+ Add Supply Batch</button>':''}</div>${labSuppliesTable(db.labSupplies)}`;
    return;
  }
  target.innerHTML=`${tabs}<div class="section-head"><h2>Laboratory & Diagnostic Orders</h2>${addOrder}</div>${labTable(db.labOrders)}`;
}
window.setLabTab=function(tab){labActiveTab=tab;renderLab()};
function labTable(rows){
  const showAmount=activeRole==='Administrator';
  const showResult=['Administrator','Physician','Medical Technologist'].includes(activeRole);
  const hasActions=can('labStatus')||can('labResult');
  const head=`<th>Order</th><th>Date</th><th>Patient</th><th>Tests</th>${showAmount?'<th>Amount</th>':''}<th>Status</th>${showResult?'<th>Result</th>':''}${hasActions?'<th>Actions</th>':''}`;
  const colspan=6+(showAmount?1:0)+(showResult?1:0)+(hasActions?1:0)-1;
  return `<div class="table-wrap"><table class="responsive-table"><thead><tr>${head}</tr></thead><tbody>${rows.map(o=>`<tr><td data-label="Order">${o.id}</td><td data-label="Date">${o.date}</td><td data-label="Patient"><strong>${esc(patientName(o.patientId))}</strong></td><td data-label="Tests">${o.tests.map(t=>`<span class="badge blue">${esc(t)}</span>`).join(' ')}</td>${showAmount?`<td data-label="Amount">${money(o.amount)}</td>`:''}<td data-label="Status"><span class="badge ${statusBadgeClass(o.status)}">${esc(o.status)}</span></td>${showResult?`<td data-label="Result">${o.resultNote?esc(o.resultNote):'<span class="muted">Not encoded</span>'}</td>`:''}${hasActions?`<td data-label="Actions"><div class="inline-actions">${can('labStatus')?labStatusControl(o):''}${can('labResult')?`<button class="small-btn" onclick="openLabResultModal('${o.id}')">Encode Result</button>`:''}</div></td>`:''}</tr>`).join('')||`<tr><td colspan="${colspan}" class="empty">No laboratory orders.</td></tr>`}</tbody></table></div>`;
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
function labSuppliesTable(rows){
  return `<div class="table-wrap"><table class="responsive-table"><thead><tr><th>Supply</th><th>Category</th><th>Supplier</th><th>Lot</th><th>Expiry</th><th>Stock</th><th>Reorder</th><th>Cost</th><th>Actions</th></tr></thead><tbody>${rows.map(i=>{const low=i.qty<=i.reorder;const exp=i.expiry&&daysUntil(i.expiry)<0;const soon=i.expiry&&daysUntil(i.expiry)>=0&&daysUntil(i.expiry)<=90;return `<tr><td data-label="Supply"><strong>${esc(i.name)}</strong><br><span class="muted">${esc(i.brand||'')} · ${esc(i.unit||'unit')}</span></td><td data-label="Category"><span class="badge blue">${esc(i.category||'Other')}</span></td><td data-label="Supplier">${esc(i.supplier||'—')}</td><td data-label="Lot">${esc(i.lot||'—')}</td><td data-label="Expiry">${i.expiry||'—'}</td><td data-label="Stock"><strong>${i.qty}</strong> ${esc(i.unit||'')}</td><td data-label="Reorder">${i.reorder}</td><td data-label="Cost">${money(i.cost)}</td><td data-label="Actions"><div class="inline-actions">${can('useLabSupply')?`<button class="small-btn" onclick="openLabSupplyMovement('${i.id}','use')">Use</button><button class="small secondary" onclick="openLabSupplyMovement('${i.id}','stockin')">+ Stock</button>`:''}${exp?'<span class="badge red">Expired</span>':low?'<span class="badge red">Low</span>':soon?'<span class="badge amber">Expiring</span>':'<span class="badge green">OK</span>'}</div></td></tr>`}).join('')||'<tr><td colspan="9" class="empty">No laboratory supplies yet.</td></tr>'}</tbody></table></div>`;
}
window.openLabSupplyModal=function(){
  if(!guard('addLabSupply'))return;
  modal('Add Laboratory Supply Batch',`<div class="form-grid">${field('Supply name','lsName')}${field('Category','lsCategory','select',['Reagent','Collection','Consumable','PPE','Cleaning','Other'])}${field('Brand / Manufacturer','lsBrand')}${field('Supplier','lsSupplier')}${field('Lot / Batch','lsLot')}${field('Unit','lsUnit','text','piece')}${field('Expiry','lsExpiry','date')}${field('Quantity','lsQty','number',0)}${field('Reorder level','lsReorder','number',10)}${field('Cost per unit','lsCost','number',0)}</div>`,()=>{const name=v('lsName');if(!name)return alert('Supply name is required.');db.labSupplies.unshift({id:`LS-${Date.now()}`,name,category:v('lsCategory'),brand:v('lsBrand'),supplier:v('lsSupplier'),lot:v('lsLot'),unit:v('lsUnit')||'unit',expiry:v('lsExpiry'),qty:+v('lsQty')||0,reorder:+v('lsReorder')||0,cost:+v('lsCost')||0});save(`Added lab supply batch: ${name}`);closeModal()},'Add Supply');
};
window.openLabSupplyMovement=function(id,mode){
  if(!guard('useLabSupply'))return;const i=db.labSupplies.find(x=>x.id===id);if(!i)return;const use=mode==='use';
  modal(`${use?'Use':'Stock In'} · ${i.name}`,`<div class="summary-box"><div class="summary-row"><span>Current stock</span><strong>${i.qty} ${esc(i.unit||'')}</strong></div><div class="summary-row"><span>Lot</span><strong>${esc(i.lot||'—')}</strong></div></div><div class="form-grid" style="margin-top:14px">${field(use?'Quantity used':'Quantity received','lsMoveQty','number',1)}<div class="field full"><label>Note / purpose</label><input id="lsMoveNote" placeholder="e.g. CBC run, restock PO, damaged stock"></div></div>`,()=>{const qty=Math.max(0,Number(v('lsMoveQty')||0));if(!qty)return alert('Enter a quantity.');if(use&&qty>i.qty)return alert('Not enough stock.');i.qty+=use?-qty:qty;db.labSupplyMovements.unshift({id:`LSM-${Date.now()}`,supplyId:i.id,type:use?'Use':'Stock In',qty,date:new Date().toISOString(),note:v('lsMoveNote'),user:activeRole});save(`${use?'Used':'Stocked in'} ${qty} ${i.unit||'unit'} of ${i.name}`);closeModal()},use?'Record Usage':'Add Stock');
};


function renderPharmacy(){
  const add=can('addMedicine')?'<button class="primary" onclick="openMedicineModal()">+ Add Medicine Batch</button>':'';
  const q=pharmacySearch.trim().toLowerCase();
  const rows=db.inventory.filter(i=>!q||[i.generic,i.brand,i.strength,i.form,i.batch,i.supplier].join(' ').toLowerCase().includes(q));
  document.getElementById('pharmacy').innerHTML=`<div class="section-head"><div><h2>Pharmacy Medicine Inventory</h2><p class="muted">Separate pharmacy entity inventory and sales.</p></div><div class="toolbar"><input class="search-input" value="${esc(pharmacySearch)}" placeholder="Search generic, brand, strength, batch…" oninput="setPharmacySearch(this.value)">${add}</div></div><div class="table-wrap"><table class="responsive-table"><thead><tr><th>Generic / Brand</th><th>Batch</th><th>Supplier</th><th>Expiry</th><th>Stock</th><th>Reorder</th><th>Cost</th><th>Selling Price</th><th>Status</th></tr></thead><tbody>${rows.map(i=>{const days=i.expiry?daysUntil(i.expiry):9999;const low=i.qty<=i.reorder;const exp=i.expiry&&days<0;const soon=i.expiry&&days>=0&&days<=90;return `<tr><td data-label="Generic / Brand"><strong>${esc(i.generic)} ${esc(i.strength)}</strong><br><span class="muted">${esc(i.brand||'No brand')} · ${esc(i.form)}</span></td><td data-label="Batch">${esc(i.batch)}</td><td data-label="Supplier">${esc(i.supplier||'—')}</td><td data-label="Expiry">${i.expiry||'—'}</td><td data-label="Stock">${i.qty}</td><td data-label="Reorder">${i.reorder}</td><td data-label="Cost">${money(i.cost)}</td><td data-label="Selling Price">${money(i.sell)}</td><td data-label="Status">${exp?'<span class="badge red">Expired</span>':low?'<span class="badge red">Low stock</span>':soon?'<span class="badge amber">Expiring soon</span>':'<span class="badge green">OK</span>'}</td></tr>`}).join('')||'<tr><td colspan="9" class="empty">No medicines match your search.</td></tr>'}</tbody></table></div>`;
}
window.setPharmacySearch=function(value){pharmacySearch=value;renderPharmacy();const el=document.querySelector('#pharmacy .search-input');if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length)}};
window.openMedicineModal=function(){
  if(!guard('addMedicine'))return;
  modal('Add Medicine Batch',`<div class="form-grid">${field('Generic name','mGeneric')}${field('Brand name','mBrand')}${field('Strength','mStrength')}${field('Dosage form','mForm')}${field('Batch / Lot','mBatch')}${field('Supplier','mSupplier')}${field('Expiry','mExpiry','date')}${field('Quantity','mQty','number',0)}${field('Reorder level','mReorder','number',20)}${field('Cost per unit','mCost','number',0)}${field('Selling price','mSell','number',0)}</div>`,()=>{const generic=v('mGeneric');if(!generic)return alert('Generic name is required.');db.inventory.push({id:`MED-${Date.now()}`,generic,brand:v('mBrand'),strength:v('mStrength'),form:v('mForm'),batch:v('mBatch'),supplier:v('mSupplier'),expiry:v('mExpiry'),qty:+v('mQty')||0,reorder:+v('mReorder')||0,cost:+v('mCost')||0,sell:+v('mSell')||0,taxClass:'Unclassified'});save(`Added pharmacy medicine batch: ${generic}`);closeModal()});
};



function captureSaleDraft(){
  const entity=document.getElementById('saleEntity');
  const p=document.getElementById('salePatient');
  const pay=document.getElementById('payMethod');
  const tendered=document.getElementById('amountTendered');
  const buyerName=document.getElementById('buyerName');
  const buyerTin=document.getElementById('buyerTin');
  const buyerAddress=document.getElementById('buyerAddress');
  const discountType=document.getElementById('discountType');
  const discountId=document.getElementById('discountId');
  const discountPercent=document.getElementById('discountPercent');
  if(entity)saleDraft.entity=entity.value;
  if(p)saleDraft.patientId=p.value;
  if(pay)saleDraft.payment=pay.value;
  if(tendered)saleDraft.tendered=tendered.value;
  if(buyerName)saleDraft.buyerName=buyerName.value;
  if(buyerTin)saleDraft.buyerTin=buyerTin.value;
  if(buyerAddress)saleDraft.buyerAddress=buyerAddress.value;
  if(discountType)saleDraft.discountType=discountType.value;
  if(discountId)saleDraft.discountId=discountId.value;
  if(discountPercent)saleDraft.discountPercent=discountPercent.value;
}
function cartTotal(){return cart.reduce((a,b)=>a+b.price*b.qty,0)}
function paymentFields(){
  const sale=computeSale();
  const isCash=saleDraft.payment==='Cash';
  const tendered=Number(saleDraft.tendered||0);
  const change=isCash?Math.max(0,tendered-sale.total):0;
  return `<div class="payment-panel">
    <div class="field"><label>Payment method</label><select id="payMethod" onchange="changePaymentMethod(this.value)">${['Cash','GCash','Maya','Bank Transfer','Other'].map(m=>`<option ${saleDraft.payment===m?'selected':''}>${m}</option>`).join('')}</select></div>
    ${isCash?`<div class="field"><label>Amount tendered</label><input id="amountTendered" type="number" min="0" step="0.01" inputmode="decimal" value="${esc(saleDraft.tendered)}" placeholder="0.00" oninput="updateChangePreview(this.value)"></div>
    <div class="cash-change-box"><span>Change</span><strong id="changePreview">${money(change)}</strong></div>`:`<div class="cash-change-box noncash"><span>Amount due</span><strong>${money(sale.total)}</strong></div>`}
  </div>`;
}
function buyerAndDiscountFields(){
  const p=db.patients.find(x=>x.id===saleDraft.patientId);
  const suggested=p?.discount&&p.discount!=='None'?`Patient registry flag: ${esc(p.discount)}. Verify eligibility and ID before applying any discount.`:'Buyer details are optional in this demo; enter them when required for the invoice.';
  return `<details class="invoice-details" open>
    <summary>Invoice / Buyer details</summary>
    <div class="form-grid invoice-form">
      <div class="field"><label>Buyer / patient name</label><input id="buyerName" value="${esc(saleDraft.buyerName||'')}" placeholder="${p?esc(p.name):'Optional'}" oninput="saleDraft.buyerName=this.value"></div>
      <div class="field"><label>Buyer TIN</label><input id="buyerTin" value="${esc(saleDraft.buyerTin||'')}" placeholder="If applicable" oninput="saleDraft.buyerTin=this.value"></div>
      <div class="field full"><label>Buyer business / billing address</label><input id="buyerAddress" value="${esc(saleDraft.buyerAddress||'')}" placeholder="If applicable" oninput="saleDraft.buyerAddress=this.value"></div>
      <div class="field"><label>Discount type</label><select id="discountType" onchange="changeDiscountType(this.value)">${['None','Senior Citizen','PWD','Custom'].map(x=>`<option ${saleDraft.discountType===x?'selected':''}>${x}</option>`).join('')}</select></div>
      <div class="field"><label>Discount ID / reference</label><input id="discountId" value="${esc(saleDraft.discountId||'')}" placeholder="SC/PWD ID or reference" oninput="saleDraft.discountId=this.value"></div>
      <div class="field"><label>Discount %</label><input id="discountPercent" type="number" min="0" max="100" step="0.01" value="${esc(saleDraft.discountPercent||'0')}" onchange="saleDraft.discountPercent=this.value;renderPOS()"></div>
      <div class="field full"><div class="notice blue">${suggested}<br><strong>Important:</strong> selecting Senior/PWD records the discount information only; this MVP does not decide legal eligibility or automatically reclassify items as VAT-exempt.</div></div>
    </div>
  </details>`;
}
function renderPOS(){
  if(!canView('pos'))return;
  const entity=currentSaleEntity();
  saleDraft.entity=entity;
  const pharmacist=activeRole==='Pharmacist';
  const entityCfgNow=entityCfg(entity);
  const canChooseEntity=['Administrator','Cashier'].includes(activeRole);
  const services=entity==='clinic'?db.services:[];
  const mq=medicinePosSearch.trim().toLowerCase();
  const medicines=entity==='pharmacy'?db.inventory.filter(i=>i.qty>0&&(!i.expiry||daysUntil(i.expiry)>=0)&&(!mq||[i.generic,i.brand,i.strength,i.form,i.batch].join(' ').toLowerCase().includes(mq))).sort((a,b)=>(a.expiry||'9999').localeCompare(b.expiry||'9999')):[];
  const entitySelector=canChooseEntity?`<div class="entity-switch"><span>Billing entity</span><div class="segmented"><button class="${entity==='clinic'?'active':''}" onclick="changeSaleEntity('clinic')">Clinic / Lab</button><button class="${entity==='pharmacy'?'active':''}" onclick="changeSaleEntity('pharmacy')">Pharmacy</button></div></div>`:`<div class="entity-chip">${entityLabel(entity)}</div>`;
  const serviceCard=services.length?`<div class="card"><div class="section-head"><h2>Clinic & Diagnostic Services</h2></div><div class="catalog">${services.map(s=>`<button class="catalog-item" onclick="addService('${s.id}')"><strong>${esc(s.name)}</strong><span>${s.type} · ${money(s.price)}${entityCfgNow.taxType==='VAT'?` · ${esc(s.taxClass||'Unclassified')}`:''}</span></button>`).join('')}</div></div>`:'';
  const medicineCard=entity==='pharmacy'?`<div class="card"><div class="section-head"><div><h2>Medicines</h2><p class="muted">Search by generic or brand name.</p></div></div><div class="field"><input class="search-input" value="${esc(medicinePosSearch)}" placeholder="Search generic, brand, strength or batch…" oninput="setMedicinePosSearch(this.value)"></div><div class="catalog">${medicines.map(i=>`<button class="catalog-item" onclick="addMedicine('${i.id}')"><strong>${esc(i.generic)} ${esc(i.strength)}</strong><span>${esc(i.brand||'No brand')} · ${esc(i.form)}<br>${esc(i.batch)} · Stock ${i.qty} · ${money(i.sell)}${entityCfgNow.taxType==='VAT'?` · ${esc(i.taxClass||'Unclassified')}`:''}</span></button>`).join('')||'<div class="empty">No saleable medicines match your search.</div>'}</div></div>`:'';
  const birMissing=birSetupMissing(entity);
  const entityNotice=entity==='pharmacy'?`<div class="notice blue"><strong>Separate Pharmacy Entity.</strong> Pharmacy medicines are billed and reported separately from ACCU clinic/laboratory services. A pharmacy invoice cannot contain clinic/lab services.</div>`:`<div class="notice blue"><strong>Clinic / Laboratory Entity.</strong> Consultation and diagnostic services are billed here. Pharmacy medicines are invoiced separately.</div>`;
  const birNotice=birMissing.length?`<div class="notice red bir-pos-warning"><strong>${entityLabel(entity)} demo / not yet ready for BIR production use.</strong> Missing admin setup: ${birMissing.map(esc).join(', ')}.</div>`:`<div class="notice blue bir-pos-warning"><strong>${entityLabel(entity)} BIR fields configured.</strong> Use in production only after the applicable registration/Permit to Use process is completed.</div>`;
  document.getElementById('pos').innerHTML=`${entitySelector}${entityNotice}${birNotice}<div class="pos-layout"><div>${serviceCard}${medicineCard}</div><div class="card"><div class="section-head"><div><h2>${entityLabel(entity)} Bill</h2><p class="muted">Invoice series and sales are separate per entity.</p></div><button class="ghost" onclick="clearCart()">Clear</button></div><div class="field"><label>Patient / Buyer</label><select id="salePatient" onchange="changeSalePatient(this.value)"><option value="">Walk-in</option>${db.patients.map(p=>`<option value="${p.id}" ${saleDraft.patientId===p.id?'selected':''}>${esc(p.name)} (${p.id})</option>`).join('')}</select></div>${buyerAndDiscountFields()}<div id="cartLines">${cart.length?cart.map((x,idx)=>`<div class="cart-line"><div><strong>${esc(x.name)}</strong><br><span class="muted">${x.kind}${entityCfgNow.taxType==='VAT'?` · ${esc(x.taxClass||'Unclassified')}`:''}</span></div><input type="number" min="1" value="${x.qty}" onchange="updateCartQty(${idx},this.value)"><div>${money(x.price*x.qty)}</div><button class="close-x" onclick="removeCartItem(${idx})">×</button></div>`).join(''):'<div class="empty">Add items to this entity’s bill.</div>'}</div>${saleSummary()}${paymentFields()}<button class="primary checkout-btn" onclick="checkout()" ${cart.length?'':'disabled'}>Complete Transaction & Generate Invoice</button></div></div>`;
}
window.changeSaleEntity=function(entity){if(!['Administrator','Cashier'].includes(activeRole))return;captureSaleDraft();if(saleDraft.entity!==entity&&cart.length&&!confirm('Changing billing entity will clear the current cart. Continue?'))return;saleDraft.entity=entity;cart=[];saleDraft.tendered='';medicinePosSearch='';renderPOS()};
window.setMedicinePosSearch=function(value){medicinePosSearch=value;captureSaleDraft();renderPOS();const el=document.querySelector('#pos .search-input');if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length)}};

window.changeSalePatient=function(value){
  captureSaleDraft();
  saleDraft.patientId=value;
  const p=db.patients.find(x=>x.id===value);
  if(p && !saleDraft.buyerName) saleDraft.buyerName=p.name;
  renderPOS();
};
window.changePaymentMethod=function(value){captureSaleDraft();saleDraft.payment=value;if(value!=='Cash')saleDraft.tendered='';renderPOS()};
window.changeDiscountType=function(value){captureSaleDraft();saleDraft.discountType=value;if(value==='Senior Citizen'||value==='PWD'){if(!Number(saleDraft.discountPercent))saleDraft.discountPercent='20'}else if(value==='None'){saleDraft.discountPercent='0';saleDraft.discountId=''}renderPOS()};
window.updateChangePreview=function(value){saleDraft.tendered=value;const el=document.getElementById('changePreview');if(el)el.textContent=money(Math.max(0,Number(value||0)-computeSale().total))};
window.addService=function(id){if(!can('checkout'))return;captureSaleDraft();if(currentSaleEntity()!=='clinic')return alert('Switch to Clinic / Lab billing first.');const s=db.services.find(x=>x.id===id);addCartLine({kind:s.type,refId:s.id,name:s.name,qty:1,price:s.price,taxClass:s.taxClass||'Unclassified'});renderPOS()};
window.addMedicine=function(id){if(!can('checkout'))return;captureSaleDraft();if(currentSaleEntity()!=='pharmacy')return alert('Switch to Pharmacy billing first.');const m=db.inventory.find(x=>x.id===id);addCartLine({kind:'Pharmacy',refId:m.id,name:`${m.generic} ${m.strength}`,qty:1,price:m.sell,taxClass:m.taxClass||'Unclassified'});renderPOS()};
function addCartLine(line){const existing=cart.find(x=>x.kind===line.kind&&x.refId===line.refId);if(existing)existing.qty+=1;else cart.push(line)}
window.updateCartQty=function(idx,value){if(!can('checkout'))return;captureSaleDraft();cart[idx].qty=Math.max(1,+value||1);renderPOS()};
window.removeCartItem=function(idx){if(!can('checkout'))return;captureSaleDraft();cart.splice(idx,1);renderPOS()};
window.clearCart=function(){if(!can('checkout'))return;captureSaleDraft();cart=[];saleDraft.tendered='';renderPOS()};
function saleSummary(){
  const x=computeSale();const c=entityCfg(currentSaleEntity());
  const taxRows=String(c.taxType).toUpperCase()==='VAT'?`<div class="summary-row"><span>VATable sales</span><strong>${money(x.vatableSales)}</strong></div><div class="summary-row"><span>VAT (${Number(c.vatRate||12)}%)</span><strong>${money(x.vatAmount)}</strong></div><div class="summary-row"><span>VAT-exempt sales</span><strong>${money(x.vatExemptSales)}</strong></div><div class="summary-row"><span>Zero-rated sales</span><strong>${money(x.zeroRatedSales)}</strong></div>${x.nonVatSales?`<div class="summary-row"><span>Other non-VAT sales</span><strong>${money(x.nonVatSales)}</strong></div>`:''}`:`<div class="summary-row"><span>Non-VAT sales</span><strong>${money(x.nonVatSales)}</strong></div>`;
  return `<div class="summary-box" style="margin-top:14px"><div class="summary-row"><span>Subtotal</span><strong>${money(x.subtotal)}</strong></div>${x.discountAmount?`<div class="summary-row"><span>${esc(saleDraft.discountType)} discount (${Number(saleDraft.discountPercent||0)}%)</span><strong>− ${money(x.discountAmount)}</strong></div>`:''}${taxRows}<div class="summary-row total"><span>Total Amount Due</span><span>${money(x.total)}</span></div></div>`;
}
window.checkout=function(){
  if(!guard('checkout')||!cart.length)return;captureSaleDraft();
  for(const line of cart.filter(x=>x.kind==='Pharmacy')){const inv=db.inventory.find(i=>i.id===line.refId);if(!inv||inv.qty<line.qty)return alert(`Insufficient stock for ${line.name}.`)}
  const entity=currentSaleEntity();
  if(entity==='clinic'&&cart.some(x=>x.kind==='Pharmacy'))return alert('Pharmacy is a separate entity. Remove medicines and issue a separate pharmacy invoice.');
  if(entity==='pharmacy'&&cart.some(x=>x.kind!=='Pharmacy'))return alert('Pharmacy is a separate entity. Remove clinic/lab services and issue a separate clinic invoice.');
  const sale=computeSale();const c=entityCfg(entity);
  if(String(c.taxType||'NON-VAT').toUpperCase()==='VAT'&&sale.unclassified.length)return alert(`Before using VAT mode, classify these items in Admin → Tax Classification: ${[...new Set(sale.unclassified)].join(', ')}`);
  if((saleDraft.discountType==='Senior Citizen'||saleDraft.discountType==='PWD')&&!String(saleDraft.discountId||'').trim()){if(!confirm(`${saleDraft.discountType} discount selected without an ID/reference. Continue for demo/testing?`))return}
  const isCash=saleDraft.payment==='Cash';const tendered=isCash?Number(saleDraft.tendered||0):sale.total;
  if(isCash&&tendered<sale.total)return alert(`Amount tendered is ${money(tendered)}. Please enter at least ${money(sale.total)}.`);
  const change=isCash?Math.max(0,tendered-sale.total):0;
  const items=structuredClone(cart).map(x=>({...x,taxClass:x.taxClass||sourceTaxClass(x)}));
  for(const line of items.filter(x=>x.kind==='Pharmacy'))db.inventory.find(i=>i.id===line.refId).qty-=line.qty;
  const id=nextId('TXN',db.transactions);const invoiceNo=nextInvoiceNumber(entity);
  const txn={id,entity,invoiceNo,invoiceLabel:c.invoiceLabel||'INVOICE',date:today(),time:new Date().toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'}),patientId:saleDraft.patientId||null,buyerName:saleDraft.buyerName||patientName(saleDraft.patientId),buyerTin:saleDraft.buyerTin||'',buyerAddress:saleDraft.buyerAddress||'',discountType:saleDraft.discountType||'None',discountId:saleDraft.discountId||'',discountPercent:Number(saleDraft.discountPercent||0),subtotal:sale.subtotal,discountAmount:sale.discountAmount,taxSummary:{vatableSales:sale.vatableSales,vatAmount:sale.vatAmount,vatExemptSales:sale.vatExemptSales,zeroRatedSales:sale.zeroRatedSales,nonVatSales:sale.nonVatSales,taxType:c.taxType,vatRate:Number(c.vatRate||12)},payment:saleDraft.payment,total:sale.total,tendered,change,operator:activeRole,items,birConfiguredAtIssue:isBirConfigured(entity)};
  db.transactions.unshift(txn);cart=[];saleDraft={entity:(activeRole==='Pharmacist'?'pharmacy':'clinic'),patientId:'',payment:'Cash',tendered:'',buyerName:'',buyerTin:'',buyerAddress:'',discountType:'None',discountId:'',discountPercent:'0'};save(`Completed transaction ${id}; invoice ${invoiceNo} (${money(sale.total)})`);showReceipt(txn);
};
function receiptBody(t){
  const entity=t.entity||'clinic';const clinic=entityCfg(entity);const patient=t.buyerName||(t.patientId?patientName(t.patientId):'Walk-in');const tendered=Number.isFinite(Number(t.tendered))?Number(t.tendered):Number(t.total||0);const change=Number.isFinite(Number(t.change))?Number(t.change):0;const tax=t.taxSummary||{};const configured=(t.birConfiguredAtIssue??isBirConfigured(entity))&&!!t.invoiceNo;const invoiceLabel=t.invoiceLabel||clinic.invoiceLabel||'INVOICE';const taxLine=String(clinic.taxType||'NON-VAT').toUpperCase()==='VAT'?'VAT REG TIN':'NON-VAT REG TIN';
  const taxRows=String(tax.taxType||clinic.taxType).toUpperCase()==='VAT'?`<div><span>VATable Sales</span><strong>${money(tax.vatableSales||0)}</strong></div><div><span>VAT (${Number(tax.vatRate||clinic.vatRate||12)}%)</span><strong>${money(tax.vatAmount||0)}</strong></div><div><span>VAT-Exempt Sales</span><strong>${money(tax.vatExemptSales||0)}</strong></div><div><span>Zero-Rated Sales</span><strong>${money(tax.zeroRatedSales||0)}</strong></div>${(tax.nonVatSales||0)?`<div><span>Other Non-VAT</span><strong>${money(tax.nonVatSales||0)}</strong></div>`:''}`:`<div><span>Non-VAT Sales</span><strong>${money(tax.nonVatSales??t.total)}</strong></div>`;
  return `<div class="thermal-receipt" id="thermalReceipt">${!configured?'<div class="invoice-demo-mark">DEMO — NOT FOR BIR PRODUCTION USE</div>':''}<div class="receipt-brand">${entity==='clinic'?'<img src="accu-logo.jpeg" alt="ACCU">':''}<h3>${esc(clinic.name||entityLabel(entity))}</h3>${clinic.tradeName&&clinic.tradeName!==clinic.name?`<p>${esc(clinic.tradeName)}</p>`:''}${clinic.address?`<p>${esc(clinic.address)}</p>`:''}${clinic.contact?`<p>${esc(clinic.contact)}</p>`:''}${clinic.tin?`<p><strong>${taxLine}:</strong> ${esc(clinic.tin)}${clinic.branchCode?`-${esc(clinic.branchCode)}`:''}</p>`:''}<p class="invoice-title"><strong>${esc(invoiceLabel)}</strong></p><p><strong>${t.invoiceNo?`No. ${esc(t.invoiceNo)}`:`LEGACY REF. ${esc(t.id)}`}</strong></p></div><div class="receipt-rule"></div><div class="receipt-meta"><div><span>Date</span><strong>${esc(t.date)} ${esc(t.time||'')}</strong></div><div><span>Internal Ref.</span><strong>${esc(t.id)}</strong></div><div><span>Buyer / Patient</span><strong>${esc(patient)}</strong></div>${t.buyerTin?`<div><span>Buyer TIN</span><strong>${esc(t.buyerTin)}</strong></div>`:''}${t.buyerAddress?`<div><span>Buyer Address</span><strong>${esc(t.buyerAddress)}</strong></div>`:''}<div><span>Processed by</span><strong>${esc(t.operator||'Clinic Staff')}</strong></div></div><div class="receipt-rule"></div><div class="receipt-items">${t.items.map(i=>`<div class="receipt-item"><div><strong>${esc(i.name)}</strong><small>${i.qty} × ${money(i.price)}${String(tax.taxType||clinic.taxType).toUpperCase()==='VAT'?` · ${esc(i.taxClass||'Unclassified')}`:''}</small></div><strong>${money(i.price*i.qty)}</strong></div>`).join('')}</div><div class="receipt-rule"></div><div class="receipt-totals"><div><span>Subtotal</span><strong>${money(t.subtotal??(Number(t.total||0)+Number(t.discountAmount||0)))}</strong></div>${Number(t.discountAmount||0)>0?`<div><span>${esc(t.discountType||'Discount')} ${Number(t.discountPercent||0)}%</span><strong>− ${money(t.discountAmount)}</strong></div>${t.discountId?`<div><span>Discount ID</span><strong>${esc(t.discountId)}</strong></div>`:''}`:''}${taxRows}<div class="grand-total"><span>TOTAL</span><strong>${money(t.total)}</strong></div><div><span>Payment</span><strong>${esc(t.payment)}</strong></div>${t.payment==='Cash'?`<div><span>Cash tendered</span><strong>${money(tendered)}</strong></div><div class="change"><span>Change</span><strong>${money(change)}</strong></div>`:''}</div><div class="receipt-rule"></div>${(clinic.permitNo||clinic.min||clinic.machineSerial)?`<div class="receipt-bir-meta">${clinic.permitNo?`<p><strong>Permit to Use:</strong> ${esc(clinic.permitNo)}${clinic.permitDate?` · ${esc(clinic.permitDate)}`:''}</p>`:''}${clinic.min?`<p><strong>MIN:</strong> ${esc(clinic.min)}</p>`:''}${clinic.machineSerial?`<p><strong>Terminal / Machine S/N:</strong> ${esc(clinic.machineSerial)}</p>`:''}</div>`:''}<p class="receipt-footer">${esc(clinic.receiptFooter||'Thank you for choosing ACCU.')}</p><p class="receipt-copy">${t.reprint?'REPRINTED COPY':''}</p></div>`;
}
function showReceipt(t){modal(t.reprint?'Reprint Invoice':'Transaction Complete · Invoice Generated',`${receiptBody(t)}<div class="receipt-print-note no-print"><strong>80 mm invoice ready.</strong><br>The invoice number is preserved on reprints. Choose the installed thermal printer in the browser print dialog. This prototype does not itself constitute BIR approval or a Permit to Use.</div>`,null,'Close',`<button class="secondary no-print" onclick="printReceipt('${t.id}',${t.reprint?'true':'false'})">${t.reprint?'Print Reprinted Invoice':'Print 80mm Invoice'}</button>`)}
window.reprintReceipt=function(id){const t=db.transactions.find(x=>x.id===id);if(!t)return alert('Transaction not found.');showReceipt({...t,reprint:true})};
window.printReceipt=function(id,isReprint=false){
  const original=db.transactions.find(x=>x.id===id);if(!original)return alert('Transaction not found.');const t={...original,reprint:!!isReprint};const receipt=receiptBody(t);const w=window.open('','_blank','width=420,height=760');if(!w)return alert('The print window was blocked. Please allow pop-ups for this site and try again.');w.document.open();w.document.write(`<!doctype html><html><head><meta charset="utf-8"><base href="${esc(location.href)}"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(t.invoiceNo||t.id)} Invoice</title><style>@page{size:80mm auto;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#000}body{width:80mm;font-family:Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}.thermal-receipt{width:72mm;margin:0 auto;padding:4mm 1.5mm 7mm;font-size:10.2px;line-height:1.32}.receipt-brand{text-align:center}.receipt-brand img{width:52mm;max-height:26mm;object-fit:contain;filter:grayscale(1);margin:0 auto 1.5mm;display:block}.receipt-brand h3{font-size:12px;margin:1mm 0;font-weight:800}.receipt-brand p{margin:.6mm 0;font-size:9.3px}.invoice-title{font-size:12px!important;letter-spacing:.06em}.invoice-demo-mark{text-align:center;border:1px solid #000;padding:1.2mm;font-weight:800;font-size:8.8px;margin-bottom:2mm}.receipt-rule{border-top:1px dashed #000;margin:2.2mm 0}.receipt-meta>div,.receipt-totals>div{display:flex;justify-content:space-between;gap:4mm;margin:1mm 0}.receipt-meta span,.receipt-totals span{font-weight:400}.receipt-meta strong,.receipt-totals strong{text-align:right}.receipt-item{display:grid;grid-template-columns:1fr auto;gap:3mm;margin:1.7mm 0;align-items:start}.receipt-item strong{font-size:10.2px}.receipt-item small{display:block;font-size:8.8px;margin-top:.5mm}.receipt-totals .grand-total{font-size:13px;font-weight:800;border-top:1px solid #000;padding-top:1.5mm;margin-top:1.5mm}.receipt-totals .change{font-size:11.5px;font-weight:800}.receipt-bir-meta p{margin:.6mm 0;text-align:center;font-size:8.4px}.receipt-footer{text-align:center;margin:2.8mm 0 1mm;font-size:9px}.receipt-copy{text-align:center;font-weight:800;margin:1mm 0;font-size:9px}@media screen{body{margin:10px auto;border:1px solid #ddd;box-shadow:0 8px 30px rgba(0,0,0,.12)}}</style></head><body>${receipt}<script>window.onload=()=>{setTimeout(()=>window.print(),250)}<\/script></body></html>`);w.document.close();
};


function paymentReceiptBody(t){
  const entity=t.entity||'clinic';
  const clinic=entityCfg(entity);
  const buyer=t.buyerName||(t.patientId?patientName(t.patientId):'Walk-in');
  const taxLine=String(clinic.taxType||'NON-VAT').toUpperCase()==='VAT'?'VAT REG TIN':'NON-VAT REG TIN';
  return `<div class="thermal-receipt" id="thermalReceipt">
    ${!isBirConfigured(entity)?'<div class="invoice-demo-mark">DEMO — NOT FOR BIR PRODUCTION USE</div>':''}
    <div class="receipt-brand">${entity==='clinic'?'<img src="accu-logo.jpeg" alt="ACCU">':''}<h3>${esc(clinic.name||entityLabel(entity))}</h3>${clinic.address?`<p>${esc(clinic.address)}</p>`:''}${clinic.tin?`<p><strong>${taxLine}:</strong> ${esc(clinic.tin)}${clinic.branchCode?`-${esc(clinic.branchCode)}`:''}</p>`:''}<p class="invoice-title"><strong>PAYMENT RECEIPT</strong></p><p><strong>No. ${esc(t.paymentReceiptNo||'UNASSIGNED')}</strong></p></div>
    <div class="receipt-rule"></div>
    <div class="receipt-meta"><div><span>Payment Date</span><strong>${esc(t.date)} ${esc(t.time||'')}</strong></div><div><span>Received From</span><strong>${esc(buyer)}</strong></div>${t.buyerTin?`<div><span>Buyer TIN</span><strong>${esc(t.buyerTin)}</strong></div>`:''}${t.buyerAddress?`<div><span>Buyer Address</span><strong>${esc(t.buyerAddress)}</strong></div>`:''}<div><span>Invoice Reference</span><strong>${esc(t.invoiceNo||t.id)}</strong></div><div><span>Payment Method</span><strong>${esc(t.payment)}</strong></div></div>
    <div class="receipt-rule"></div>
    <div class="receipt-totals"><div class="grand-total"><span>TOTAL PAID</span><strong>${money(t.total)}</strong></div></div>
    <div class="receipt-rule"></div>
    <p class="supplementary-note"><strong>SUPPLEMENTARY DOCUMENT</strong><br>This payment receipt does not replace the Invoice.<br>THIS DOCUMENT IS NOT VALID FOR CLAIM OF INPUT TAX.</p>
    ${(clinic.permitNo||clinic.min||clinic.machineSerial)?`<div class="receipt-bir-meta">${clinic.permitNo?`<p><strong>Permit to Use:</strong> ${esc(clinic.permitNo)}${clinic.permitDate?` · ${esc(clinic.permitDate)}`:''}</p>`:''}${clinic.min?`<p><strong>MIN:</strong> ${esc(clinic.min)}</p>`:''}${clinic.machineSerial?`<p><strong>Terminal / Machine S/N:</strong> ${esc(clinic.machineSerial)}</p>`:''}</div>`:''}
    <p class="receipt-copy">${t.paymentReceiptReprint?'REPRINTED COPY':''}</p>
  </div>`;
}
function showPaymentReceipt(t){
  modal(t.paymentReceiptReprint?'Reprint Payment Receipt':'Supplementary Payment Receipt',`${paymentReceiptBody(t)}<div class="receipt-print-note no-print"><strong>Supplementary document.</strong><br>Use this only when ACCU’s accountant/bookkeeper says a separate payment/collection receipt is appropriate. It does not replace the principal Invoice.</div>`,null,'Close',`<button class="secondary no-print" onclick="printPaymentReceipt('${t.id}',${t.paymentReceiptReprint?'true':'false'})">${t.paymentReceiptReprint?'Print Reprinted Payment Receipt':'Print Payment Receipt'}</button>`)
}
window.generatePaymentReceipt=function(id){
  if(!['Administrator','Cashier'].includes(activeRole))return alert('Only Administrator or Cashier can generate a supplementary payment receipt in this MVP.');
  const t=db.transactions.find(x=>x.id===id);if(!t)return alert('Transaction not found.');
  if(!t.invoiceNo)return alert('This is a legacy demo transaction without an invoice number. Generate payment receipts only for transactions issued through the new Invoice workflow.');
  if(!confirm('Generate a supplementary Payment Receipt linked to this Invoice? Use this only when appropriate under ACCU’s accounting/BIR setup.'))return;
  if(!t.paymentReceiptNo){t.paymentReceiptNo=nextPaymentReceiptNumber(t.entity||'clinic');save(`Generated supplementary payment receipt ${t.paymentReceiptNo} for invoice ${t.invoiceNo||t.id}`)}
  showPaymentReceipt({...t,paymentReceiptReprint:false});
};
window.reprintPaymentReceipt=function(id){
  if(!['Administrator','Cashier'].includes(activeRole))return alert('Only Administrator or Cashier can reprint a payment receipt.');
  const t=db.transactions.find(x=>x.id===id);if(!t?.paymentReceiptNo)return alert('No payment receipt has been generated for this transaction.');
  showPaymentReceipt({...t,paymentReceiptReprint:true});
};
window.printPaymentReceipt=function(id,isReprint=false){
  const t0=db.transactions.find(x=>x.id===id);if(!t0?.paymentReceiptNo)return alert('Payment receipt not found.');
  const t={...t0,paymentReceiptReprint:!!isReprint};const receipt=paymentReceiptBody(t);const w=window.open('','_blank','width=420,height=680');if(!w)return alert('The print window was blocked. Please allow pop-ups and try again.');
  w.document.open();w.document.write(`<!doctype html><html><head><meta charset="utf-8"><base href="${esc(location.href)}"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(t.paymentReceiptNo)} Payment Receipt</title><style>@page{size:80mm auto;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#000}body{width:80mm;font-family:Arial,Helvetica,sans-serif}.thermal-receipt{width:72mm;margin:0 auto;padding:4mm 1.5mm 7mm;font-size:10.2px;line-height:1.32}.receipt-brand{text-align:center}.receipt-brand img{width:52mm;max-height:26mm;object-fit:contain;filter:grayscale(1);margin:0 auto 1.5mm;display:block}.receipt-brand h3{font-size:12px;margin:1mm 0}.receipt-brand p{margin:.6mm 0;font-size:9.3px}.invoice-title{font-size:12px!important}.invoice-demo-mark{text-align:center;border:1px solid #000;padding:1.2mm;font-weight:800;font-size:8.8px;margin-bottom:2mm}.receipt-rule{border-top:1px dashed #000;margin:2.2mm 0}.receipt-meta>div,.receipt-totals>div{display:flex;justify-content:space-between;gap:4mm;margin:1mm 0}.receipt-meta strong,.receipt-totals strong{text-align:right}.grand-total{font-size:13px;font-weight:800}.supplementary-note{text-align:center;font-size:8.7px;line-height:1.45}.receipt-bir-meta p{margin:.6mm 0;text-align:center;font-size:8.4px}.receipt-copy{text-align:center;font-weight:800;font-size:9px}@media screen{body{margin:10px auto;border:1px solid #ddd;box-shadow:0 8px 30px rgba(0,0,0,.12)}}</style></head><body>${receipt}<script>window.onload=()=>{setTimeout(()=>window.print(),250)}<\/script></body></html>`);w.document.close();
};

function renderReports(){
  if(!canView('reports'))return;
  const cashier=activeRole==='Cashier';
  const rows=cashier?db.transactions.filter(t=>t.date===today()):db.transactions;
  const clinicRows=rows.filter(t=>(t.entity||'clinic')==='clinic');
  const pharmacyRows=rows.filter(t=>t.entity==='pharmacy');
  const clinicRev=clinicRows.reduce((a,b)=>a+b.total,0);
  const pharmacyRev=pharmacyRows.reduce((a,b)=>a+b.total,0);
  const total=clinicRev+pharmacyRev;
  const cards=`${stat(cashier?'Today · Clinic / Lab':'Clinic / Lab Revenue',money(clinicRev),'Separate clinic/laboratory entity')}${stat(cashier?'Today · Pharmacy':'Pharmacy Revenue',money(pharmacyRev),'Separate pharmacy entity')}${stat('Combined View',money(total),'Dashboard total only; entities remain separate')}${stat('Transactions',rows.length,cashier?'Completed today':'All recorded transactions')}`;
  document.getElementById('reports').innerHTML=`<div class="grid grid-4">${cards}</div><div class="notice blue" style="margin-top:16px"><strong>Entity separation:</strong> Pharmacy sales are tracked independently from clinic/laboratory sales. Do not treat the combined dashboard total as a single-entity invoice or tax report.</div><div class="section-head"><h2>${cashier?'Today’s Transaction Ledger':'Transaction Ledger'}</h2>${can('export')?'<div class="inline-actions"><button class="secondary" onclick="exportCSV()">Export CSV</button><button class="secondary" onclick="exportStructuredJSON()">Structured JSON</button></div>':''}</div>${transactionsTable(rows)}`;
}
function transactionsTable(rows){return `<div class="table-wrap"><table class="responsive-table"><thead><tr><th>Entity</th><th>Invoice</th><th>Date</th><th>Buyer / Patient</th><th>Items</th><th>Payment</th><th>Total</th><th>Invoice Copy</th></tr></thead><tbody>${rows.map(t=>`<tr><td data-label="Entity"><span class="badge ${t.entity==='pharmacy'?'green':'blue'}">${esc(entityLabel(t.entity||'clinic'))}</span></td><td data-label="Invoice"><strong>${t.invoiceNo?esc(t.invoiceNo):'<span class="badge amber">Legacy / no invoice</span>'}</strong><br><span class="muted">${esc(t.id)}</span></td><td data-label="Date">${t.date}<br><span class="muted">${t.time||''}</span></td><td data-label="Buyer / Patient">${esc(t.buyerName||patientName(t.patientId))}</td><td data-label="Items">${t.items.map(i=>`${esc(i.name)} ×${i.qty}`).join('<br>')}</td><td data-label="Payment">${esc(t.payment)}</td><td data-label="Total"><strong>${money(t.total)}</strong></td><td data-label="Invoice Copy"><div class="inline-actions"><button class="small secondary" onclick="reprintReceipt('${t.id}')">Reprint Invoice</button>${t.paymentReceiptNo?`<button class="small-btn" onclick="reprintPaymentReceipt('${t.id}')">Reprint Payment Receipt</button>`:`<button class="small-btn" onclick="generatePaymentReceipt('${t.id}')">Payment Receipt</button>`}</div></td></tr>`).join('')||'<tr><td colspan="8" class="empty">No transactions yet.</td></tr>'}</tbody></table></div>`}

window.exportCSV=function(){if(!guard('export'))return;const rows=[['Entity','Invoice','Internal Ref','Date','Buyer/Patient','Buyer TIN','Discount Type','Discount Amount','Payment','Total'],...db.transactions.map(t=>[entityLabel(t.entity||'clinic'),t.invoiceNo||t.id,t.id,t.date,t.buyerName||patientName(t.patientId),t.buyerTin||'',t.discountType||'None',t.discountAmount||0,t.payment,t.total])];const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='accu-invoices.csv';a.click()};

window.exportStructuredJSON=function(){
  if(!guard('export'))return;
  const c=entityCfg('clinic');const p=entityCfg('pharmacy');
  const payload={
    schema:'ACCU-INVOICE-EXPORT-1.0',
    generatedAt:new Date().toISOString(),
    disclaimer:'Internal structured export only; not a BIR EIS-certified payload and not transmitted to BIR.',
    entities:{clinic:{registeredName:c.name,tradeName:c.tradeName,address:c.address,tin:c.tin,branchCode:c.branchCode,taxType:c.taxType,permitNo:c.permitNo,min:c.min,machineSerial:c.machineSerial},pharmacy:{registeredName:p.name,tradeName:p.tradeName,address:p.address,tin:p.tin,branchCode:p.branchCode,taxType:p.taxType,permitNo:p.permitNo,min:p.min,machineSerial:p.machineSerial}},
    invoices:db.transactions.filter(t=>t.invoiceNo).map(t=>({entity:t.entity||'clinic',invoiceNo:t.invoiceNo,invoiceType:t.invoiceLabel||'INVOICE',internalReference:t.id,date:t.date,time:t.time,buyer:{name:t.buyerName||patientName(t.patientId),tin:t.buyerTin||'',address:t.buyerAddress||''},items:t.items.map(i=>({description:i.name,category:i.kind,quantity:i.qty,unitPrice:i.price,lineAmount:+(i.price*i.qty).toFixed(2),taxClass:i.taxClass||'Unclassified'})),subtotal:t.subtotal??t.total,discount:{type:t.discountType||'None',id:t.discountId||'',rate:Number(t.discountPercent||0),amount:Number(t.discountAmount||0)},tax:t.taxSummary||{},total:t.total,payment:{method:t.payment,tendered:t.tendered,change:t.change},operator:t.operator,paymentReceiptNo:t.paymentReceiptNo||null}))
  };
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));a.download='accu-multi-entity-invoice-export.json';a.click();
};



function taxClassOptions(current){return ['Unclassified','VATable','VAT-exempt','Zero-rated','Non-VAT'].map(x=>`<option value="${x}" ${current===x?'selected':''}>${x}</option>`).join('')}
window.setTaxClass=function(kind,id,value){if(activeRole!=='Administrator')return alert('Administrator access required.');const list=kind==='medicine'?db.inventory:db.services;const row=list.find(x=>x.id===id);if(!row)return;row.taxClass=value;db.audit.unshift({ts:new Date().toISOString(),user:activeRole,action:`Set ${kind} tax classification for ${id} to ${value}`});localStorage.setItem(STORAGE_KEY,JSON.stringify(db))};
function renderTaxMatrix(){const rows=[...db.services.map(x=>({kind:'service',id:x.id,label:`${x.name} (${x.type})`,cls:x.taxClass||'Unclassified'})),...db.inventory.map(x=>({kind:'medicine',id:x.id,label:`${x.generic} ${x.strength} · ${x.batch}`,cls:x.taxClass||'Unclassified'}))];return `<div class="table-wrap"><table class="responsive-table"><thead><tr><th>Item / Service</th><th>Type</th><th>Tax Classification</th></tr></thead><tbody>${rows.map(r=>`<tr><td data-label="Item">${esc(r.label)}</td><td data-label="Type">${r.kind==='medicine'?'Pharmacy':'Service'}</td><td data-label="Tax Classification"><select class="small-select" onchange="setTaxClass('${r.kind}','${r.id}',this.value)">${taxClassOptions(r.cls)}</select></td></tr>`).join('')}</tbody></table></div>`}
function renderSettings(){
  if(!canView('settings'))return;const c=entityCfg('clinic');const p=entityCfg('pharmacy');const missing=birSetupMissing('clinic');const pmissing=birSetupMissing('pharmacy');const lastIssued=db.transactions.find(t=>t.invoiceNo)?.invoiceNo||'None yet';
  document.getElementById('settings').innerHTML=`<div class="grid grid-2"><div class="card"><h2>BIR Readiness</h2><p class="muted">The system can be configured to generate an invoice with the clinic's registered details and a sequential invoice number. This screen does <strong>not</strong> represent BIR approval, accreditation or a Permit to Use.</p><div class="bir-readiness ${missing.length?'not-ready':'ready'}"><strong>${missing.length?'Setup incomplete':'Core invoice fields configured'}</strong><span>${missing.length?`Missing: ${missing.map(esc).join(', ')}`:'Verify the entries against ACCU’s BIR Certificate of Registration and actual Permit to Use before production.'}</span></div><div class="summary-row"><span>Next invoice</span><strong>${esc(invoiceNumberFrom(c.invoiceNextNumber||1))}</strong></div><div class="summary-row"><span>Last issued</span><strong>${esc(lastIssued)}</strong></div><div class="summary-row"><span>Tax status</span><strong>${esc(c.taxType||'NON-VAT')}</strong></div><div class="notice blue" style="margin-top:12px">BIR’s EOPT rules use <strong>Invoice</strong> as the principal sales document. Official/Payment/Collection Receipts are supplementary documents for collection/payment scenarios, depending on the transaction and the clinic’s accounting setup.</div></div><div class="card"><h2>Registered Taxpayer Details</h2><div class="form-grid"><div class="field full"><label>Registered name</label><input id="cfgClinicName" value="${esc(c.name||'')}" placeholder="As shown on BIR registration"></div><div class="field full"><label>Trade name</label><input id="cfgTradeName" value="${esc(c.tradeName||'')}" placeholder="If applicable"></div><div class="field full"><label>Registered business address</label><input id="cfgAddress" value="${esc(c.address||'')}" placeholder="As registered with BIR"></div><div class="field"><label>Contact</label><input id="cfgContact" value="${esc(c.contact||'')}" placeholder="Phone / mobile"></div><div class="field"><label>TIN</label><input id="cfgTin" value="${esc(c.tin||'')}" placeholder="Do not guess"></div><div class="field"><label>Branch code</label><input id="cfgBranchCode" value="${esc(c.branchCode||'')}" placeholder="e.g. 00000"></div><div class="field"><label>Tax status</label><select id="cfgTaxType"><option ${c.taxType==='NON-VAT'?'selected':''}>NON-VAT</option><option ${c.taxType==='VAT'?'selected':''}>VAT</option></select></div><div class="field"><label>VAT rate %</label><input id="cfgVatRate" type="number" min="0" max="100" step="0.01" value="${esc(c.vatRate??12)}"></div></div></div></div><div class="grid grid-2" style="margin-top:16px"><div class="card"><h2>Invoice Series</h2><p class="muted">Use the series actually approved/registered for ACCU. Changing the next number after live issuance can create duplicate or skipped invoice numbers.</p><div class="form-grid"><div class="field"><label>Invoice label</label><select id="cfgInvoiceLabel">${['INVOICE','SALES INVOICE','CASH INVOICE','SERVICE INVOICE'].map(x=>`<option ${c.invoiceLabel===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Prefix</label><input id="cfgInvoicePrefix" value="${esc(c.invoicePrefix||'')}"></div><div class="field"><label>Number of digits</label><input id="cfgInvoiceDigits" type="number" min="1" max="12" value="${esc(c.invoiceDigits||7)}"></div><div class="field"><label>Next serial number</label><input id="cfgInvoiceNext" type="number" min="1" value="${esc(c.invoiceNextNumber||1)}"></div><div class="field"><label>Payment receipt prefix</label><input id="cfgPaymentReceiptPrefix" value="${esc(c.paymentReceiptPrefix||'PR-')}"></div><div class="field"><label>Payment receipt digits</label><input id="cfgPaymentReceiptDigits" type="number" min="1" max="12" value="${esc(c.paymentReceiptDigits||7)}"></div><div class="field"><label>Next payment receipt no.</label><input id="cfgPaymentReceiptNext" type="number" min="1" value="${esc(c.paymentReceiptNextNumber||1)}"></div><div class="field full"><label>Invoice footer</label><input id="cfgFooter" value="${esc(c.receiptFooter||'')}"></div></div></div><div class="card"><h2>POS / Permit Details</h2><p class="muted">Enter only details from ACCU’s actual BIR authorization/registration documents.</p><div class="form-grid"><div class="field full"><label>Permit to Use (PTU) number</label><input id="cfgPermitNo" value="${esc(c.permitNo||'')}" placeholder="Leave blank until issued"></div><div class="field"><label>Permit date</label><input id="cfgPermitDate" type="date" value="${esc(c.permitDate||'')}"></div><div class="field"><label>MIN / machine identification no.</label><input id="cfgMin" value="${esc(c.min||'')}" placeholder="If applicable"></div><div class="field full"><label>Terminal / machine serial no.</label><input id="cfgMachineSerial" value="${esc(c.machineSerial||'')}" placeholder="If applicable"></div></div></div></div><div class="card" style="margin-top:16px"><div class="section-head"><div><h2>Separate Pharmacy Entity</h2><p class="muted" style="margin:5px 0 0">Pharmacy inventory, sales and invoice series are separate from the clinic/laboratory entity.</p></div></div><div class="bir-readiness ${pmissing.length?'not-ready':'ready'}"><strong>${pmissing.length?'Pharmacy setup incomplete':'Pharmacy core invoice fields configured'}</strong><span>${pmissing.length?`Missing: ${pmissing.map(esc).join(', ')}`:'Verify against the pharmacy entity’s own BIR registration and authorization documents.'}</span></div><div class="form-grid"><div class="field full"><label>Pharmacy registered name</label><input id="phName" value="${esc(p.name||'')}" placeholder="Do not guess — use registered name"></div><div class="field full"><label>Trade name</label><input id="phTradeName" value="${esc(p.tradeName||'')}"></div><div class="field full"><label>Registered address</label><input id="phAddress" value="${esc(p.address||'')}"></div><div class="field"><label>Contact</label><input id="phContact" value="${esc(p.contact||'')}"></div><div class="field"><label>TIN</label><input id="phTin" value="${esc(p.tin||'')}"></div><div class="field"><label>Branch code</label><input id="phBranchCode" value="${esc(p.branchCode||'')}"></div><div class="field"><label>Tax status</label><select id="phTaxType"><option ${p.taxType==='NON-VAT'?'selected':''}>NON-VAT</option><option ${p.taxType==='VAT'?'selected':''}>VAT</option></select></div><div class="field"><label>VAT rate %</label><input id="phVatRate" type="number" value="${esc(p.vatRate??12)}"></div><div class="field"><label>Invoice label</label><select id="phInvoiceLabel">${['INVOICE','SALES INVOICE','CASH INVOICE','SERVICE INVOICE'].map(x=>`<option ${p.invoiceLabel===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Invoice prefix</label><input id="phInvoicePrefix" value="${esc(p.invoicePrefix||'PH-')}"></div><div class="field"><label>Invoice digits</label><input id="phInvoiceDigits" type="number" min="1" max="12" value="${esc(p.invoiceDigits||7)}"></div><div class="field"><label>Next invoice no.</label><input id="phInvoiceNext" type="number" min="1" value="${esc(p.invoiceNextNumber||1)}"></div><div class="field full"><label>Permit to Use (PTU) no.</label><input id="phPermitNo" value="${esc(p.permitNo||'')}"></div><div class="field"><label>Permit date</label><input id="phPermitDate" type="date" value="${esc(p.permitDate||'')}"></div><div class="field"><label>MIN</label><input id="phMin" value="${esc(p.min||'')}"></div><div class="field full"><label>Terminal / Machine S/N</label><input id="phMachineSerial" value="${esc(p.machineSerial||'')}"></div><div class="field full"><label>Invoice footer</label><input id="phFooter" value="${esc(p.receiptFooter||'Thank you.')}"></div></div></div><div class="card" style="margin-top:16px"><div class="section-head"><div><h2>Tax Classification</h2><p class="muted" style="margin:5px 0 0">For VAT mode, classify every billed service/medicine before checkout. Do not infer medical/pharmacy tax treatment from this demo—have ACCU’s accountant/bookkeeper validate the classifications.</p></div></div>${renderTaxMatrix()}</div><div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="primary" onclick="saveReceiptConfig()">Save BIR / Invoice Configuration</button></div><div class="grid grid-2" style="margin-top:16px"><div class="card"><h2>Electronic Invoice Readiness</h2><p class="muted">The Reports module can export structured JSON containing seller, buyer, item, discount, tax and payment fields. It is an internal interoperability export only.</p><div class="notice blue">It is <strong>not</strong> a BIR EIS-certified payload, does not transmit sales to BIR, and does not constitute a Permit to Transmit. Production e-invoicing must follow the BIR requirements applicable to ACCU’s taxpayer classification and system.</div></div><div class="card"><h2>Thermal Printer Setup</h2><p class="muted">The MVP uses the browser print dialog. Install the printer driver on the cashier computer, select the 80 mm receipt paper size, set margins to none/minimum, and disable browser headers/footers.</p><div class="notice">For silent/direct printing, auto-cut and cash-drawer commands, a production version can add an ESC/POS print bridge or dedicated desktop POS client.</div></div><div class="card"><h2>Production Security</h2><p class="muted">This demo still stores data in browser localStorage. Before real patient or financial use, move authentication, permissions, audit logs, backups and patient data to a secure backend/database.</p><div class="notice red">Do not deploy this browser-only demo as the clinic’s live medical/financial record system.</div></div></div><div class="section-head"><h2>Audit Log</h2></div><div class="table-wrap"><table class="responsive-table"><thead><tr><th>Timestamp</th><th>User / Role</th><th>Action</th></tr></thead><tbody>${db.audit.slice(0,100).map(a=>`<tr><td data-label="Timestamp">${new Date(a.ts).toLocaleString('en-PH')}</td><td data-label="Role">${esc(a.user)}</td><td data-label="Action">${esc(a.action)}</td></tr>`).join('')}</tbody></table></div>`;
}
window.saveReceiptConfig=function(){
  if(activeRole!=='Administrator')return alert('Administrator access required.');const next=Math.max(1,Number(v('cfgInvoiceNext')||1));const prefix=v('cfgInvoicePrefix');const digits=Math.max(1,Math.min(12,Number(v('cfgInvoiceDigits')||7)));const candidate=`${prefix}${String(next).padStart(digits,'0')}`;if(db.transactions.some(t=>t.invoiceNo===candidate))return alert(`Invoice ${candidate} already exists. Choose the next unused serial number.`);const prPrefix=v('cfgPaymentReceiptPrefix')||'PR-';const prDigits=Math.max(1,Math.min(12,Number(v('cfgPaymentReceiptDigits')||7)));const prNext=Math.max(1,Number(v('cfgPaymentReceiptNext')||1));const prCandidate=`${prPrefix}${String(prNext).padStart(prDigits,'0')}`;if(db.transactions.some(t=>t.paymentReceiptNo===prCandidate))return alert(`Payment Receipt ${prCandidate} already exists. Choose the next unused serial number.`);
  db.clinic={...entityCfg('clinic'),name:v('cfgClinicName')||'ACCU Laboratory and Diagnostic Center',tradeName:v('cfgTradeName'),address:v('cfgAddress'),contact:v('cfgContact'),tin:v('cfgTin'),branchCode:v('cfgBranchCode'),taxType:v('cfgTaxType')||'NON-VAT',vatRate:Math.max(0,Number(v('cfgVatRate')||12)),invoiceLabel:v('cfgInvoiceLabel')||'INVOICE',invoicePrefix:prefix,invoiceDigits:digits,invoiceNextNumber:next,paymentReceiptPrefix:prPrefix,paymentReceiptDigits:prDigits,paymentReceiptNextNumber:prNext,permitNo:v('cfgPermitNo'),permitDate:v('cfgPermitDate'),min:v('cfgMin'),machineSerial:v('cfgMachineSerial'),receiptFooter:v('cfgFooter')||'Thank you for choosing ACCU.'};
  const phNext=Math.max(1,Number(v('phInvoiceNext')||1)),phPrefix=v('phInvoicePrefix')||'PH-',phDigits=Math.max(1,Math.min(12,Number(v('phInvoiceDigits')||7)));const phCandidate=`${phPrefix}${String(phNext).padStart(phDigits,'0')}`;if(db.transactions.some(t=>t.entity==='pharmacy'&&t.invoiceNo===phCandidate))return alert(`Pharmacy invoice ${phCandidate} already exists. Choose the next unused serial number.`);
  db.pharmacyEntity={...entityCfg('pharmacy'),name:v('phName'),tradeName:v('phTradeName'),address:v('phAddress'),contact:v('phContact'),tin:v('phTin'),branchCode:v('phBranchCode'),taxType:v('phTaxType')||'NON-VAT',vatRate:Math.max(0,Number(v('phVatRate')||12)),invoiceLabel:v('phInvoiceLabel')||'INVOICE',invoicePrefix:phPrefix,invoiceDigits:phDigits,invoiceNextNumber:phNext,permitNo:v('phPermitNo'),permitDate:v('phPermitDate'),min:v('phMin'),machineSerial:v('phMachineSerial'),receiptFooter:v('phFooter')||'Thank you.'};save('Updated separate clinic/lab and pharmacy entity invoice configuration');alert('Entity configurations saved. Verify production values against each entity’s own BIR registration and Permit to Use documents.');
};

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

function renderAll(){
  const renderers={dashboard:renderDashboard,patients:renderPatients,consultations:renderConsultations,laboratory:renderLab,pharmacy:renderPharmacy,pos:renderPOS,reports:renderReports,settings:renderSettings};
  Object.entries(renderers).forEach(([view,render])=>{
    const el=document.getElementById(view);
    if(canView(view)) render();
    else if(el) el.innerHTML='';
  });
}

// Static UI wiring
document.getElementById('todayLabel').textContent=new Date().toLocaleDateString('en-PH',{weekday:'short',year:'numeric',month:'short',day:'numeric'});
document.querySelectorAll('.nav-item').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.view)));
document.getElementById('quickSaleBtn').onclick=runQuickAction;
document.getElementById('mobileQuickBtn').onclick=runQuickAction;
document.getElementById('menuBtn').onclick=openDrawer;
document.getElementById('drawerBackdrop').onclick=closeDrawer;
document.getElementById('roleSelect').addEventListener('change',e=>{activeRole=e.target.value;localStorage.setItem(ROLE_KEY,activeRole);cart=[];saleDraft={entity:(activeRole==='Pharmacist'?'pharmacy':'clinic'),patientId:'',payment:'Cash',tendered:'',buyerName:'',buyerTin:'',buyerAddress:'',discountType:'None',discountId:'',discountPercent:'0'};renderAll();updateRoleUI()});
document.getElementById('resetDemo').onclick=()=>{if(confirm('Reset all demo data?')){localStorage.removeItem(STORAGE_KEY);db=load();cart=[];saleDraft={entity:(activeRole==='Pharmacist'?'pharmacy':'clinic'),patientId:'',payment:'Cash',tendered:'',buyerName:'',buyerTin:'',buyerAddress:'',discountType:'None',discountId:'',discountPercent:'0'};renderAll();updateRoleUI();showView('dashboard')}};

renderAll();
updateRoleUI();
