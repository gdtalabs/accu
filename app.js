const STORAGE_KEY = 'accuClinicSystemV1';
const ROLE_KEY = 'accuClinicRoleV2';

const seed = {
  patients: [],
  consultations: [],
  labOrders: [],
  radiologyOrders: [],
  pharmacyReturns: [],
  inventory: [],
  labSupplies: [],
  labSupplyMovements: [],
  services: [
    {id:'SRV-CONSULT',type:'Consultation',name:'General Consultation',price:500},
    {id:'SRV-CBC',type:'Laboratory',name:'CBC',price:350},
    {id:'SRV-UA',type:'Laboratory',name:'Urinalysis',price:150},
    {id:'SRV-FBS',type:'Laboratory',name:'Fasting Blood Sugar',price:180},
    {id:'SRV-LIPID',type:'Laboratory',name:'Lipid Profile',price:650},
    {id:'SRV-XRAY',type:'Radiology',name:'Chest X-ray',price:600},
    {id:'SRV-US-WA',type:'Radiology',name:'Ultrasound – Whole Abdomen',price:950}
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
  practitioners: [],
  meta:{schemaVersion:10,interopProfile:'HL7 FHIR R4 / PH Core draft-aligned',lastMigration:''},
  audit: [{ts:new Date().toISOString(),user:'System',action:'System initialized'}]
};

const TITLES = {
  dashboard:'Dashboard', patients:'Patient Registry', consultations:'Consultations', laboratory:'Laboratory', radiology:'Radiology',
  pharmacy:'Pharmacy', pos:'POS / Billing', reports:'Reports', interop:'Interoperability', settings:'Administration'
};

const ICONS = {dashboard:'⌂',patients:'👤',consultations:'🩺',laboratory:'🧪',radiology:'☢',pharmacy:'💊',pos:'▣',reports:'▤',interop:'⇄',settings:'⚙'};
const SHORT_LABELS = {dashboard:'Home',patients:'Patients',consultations:'Consult',laboratory:'Lab',radiology:'Radiology',pharmacy:'Pharmacy',pos:'POS',reports:'Sales',interop:'Interop',settings:'Admin'};

const ROLE_CONFIG = {
  'Administrator': {
    views:['dashboard','patients','consultations','laboratory','radiology','pharmacy','pos','reports','interop','settings'],
    actions:['addPatient','createConsult','completeConsult','createLab','labStatus','labResult','createRadiology','radiologyStatus','addMedicine','pharmacyReturn','addLabSupply','useLabSupply','checkout','export','interopConfig','manageServices'],
    bottom:['dashboard','patients','laboratory','radiology','pos'],
    context:'Full administrative access across clinic, laboratory, radiology, pharmacy, billing, reporting, interoperability and user management.',
    quick:{type:'view',target:'pos',label:'+ New Transaction'}
  },
  'Receptionist': {
    views:['dashboard','patients','consultations','laboratory','radiology'],
    actions:['addPatient','createConsult','createLab','createRadiology'],
    bottom:['dashboard','patients','consultations','laboratory','radiology'],
    context:'Front desk access for registration, consultation queueing, laboratory requests and radiology requests.',
    quick:{type:'action',target:'patient',label:'+ Add Patient'}
  },
  'Physician': {
    views:['dashboard','patients','consultations','laboratory','radiology','interop'],
    actions:['createConsult','completeConsult','createLab','createRadiology'],
    bottom:['dashboard','consultations','patients','laboratory','radiology'],
    context:'Clinical access for patient encounters and diagnostic requests, with read-only access to released laboratory and radiology results.',
    quick:{type:'action',target:'consult',label:'+ New Consultation'}
  },
  'Medical Technologist': {
    views:['dashboard','laboratory'],
    actions:['labStatus','labResult','addLabSupply','useLabSupply'],
    bottom:['dashboard','laboratory'],
    context:'Laboratory workbench for specimen workflow, result encoding, validation, release and laboratory supply management.',
    quick:{type:'view',target:'laboratory',label:'Open Lab Queue'}
  },
  'Radiologic Technologist': {
    views:['dashboard','radiology'],
    actions:['radiologyStatus'],
    bottom:['dashboard','radiology'],
    context:'Radiology worklist for scheduling, image acquisition and procedure-status updates. Diagnostic interpretation is restricted.',
    quick:{type:'view',target:'radiology',label:'Open Radiology Worklist'}
  },
  'Radiologist': {
    views:['dashboard','patients','radiology'],
    actions:['radiologyStatus','radiologyReport'],
    bottom:['dashboard','radiology','patients'],
    context:'Radiology reporting workspace for findings, impression and final report release.',
    quick:{type:'view',target:'radiology',label:'Open Reporting Queue'}
  },
  'Pharmacist': {
    views:['dashboard','pharmacy','pos'],
    actions:['addMedicine','pharmacyReturn','checkout'],
    bottom:['dashboard','pharmacy','pos'],
    context:'Pharmacy access for inventory, batch/expiry monitoring, medicine-only dispensing and controlled returns.',
    quick:{type:'view',target:'pos',label:'+ Pharmacy Sale'}
  },
  'Pharmacy Assistant': {
    views:['dashboard','pharmacy','pos'],
    actions:['pharmacyReturn','checkout'],
    bottom:['dashboard','pharmacy','pos'],
    context:'Pharmacy support access for medicine lookup, dispensing, sales and authorized returns.',
    quick:{type:'view',target:'pos',label:'+ Pharmacy Sale'}
  },
  'Cashier': {
    views:['dashboard','pos','reports'],
    actions:['checkout'],
    bottom:['dashboard','pos','reports'],
    context:'Cashier access for billing, payment collection and transaction review.',
    quick:{type:'view',target:'pos',label:'+ New Transaction'}
  }
};

function newUuid(){
  if(globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)});
}
function ensureInteropModel(parsed){
  let changed=false;
  parsed.meta={...structuredClone(seed.meta),...(parsed.meta||{}),schemaVersion:10};
  parsed.practitioners ||= structuredClone(seed.practitioners);
  const ensure=(obj)=>{if(obj&&!obj.uuid){obj.uuid=newUuid();changed=true}return obj};
  (parsed.patients||[]).forEach(p=>{ensure(p);p.identifiers ||= [{system:'urn:accu:patient-id',value:p.id}];});
  (parsed.consultations||[]).forEach(c=>{ensure(c);c.diagnosisCodeSystem ||= 'http://hl7.org/fhir/sid/icd-10';c.diagnosisCode ||= '';if(!c.practitionerId&&c.doctor){let pr=parsed.practitioners.find(x=>x.name===c.doctor);if(!pr){pr={id:`PRAC-${String(parsed.practitioners.length+1).padStart(3,'0')}`,uuid:newUuid(),name:c.doctor,role:'Physician',licenseNo:'',codeSystem:'',code:''};parsed.practitioners.push(pr);changed=true}c.practitionerId=pr.id;}});
  (parsed.labOrders||[]).forEach(o=>{ensure(o);o.resultComponents ||= [];o.serviceIds ||= (o.tests||[]).map(t=>(parsed.services||[]).find(s=>s.name===t)?.id).filter(Boolean);});
  (parsed.radiologyOrders||[]).forEach(o=>{ensure(o);o.serviceIds ||= (o.tests||[]).map(t=>(parsed.services||[]).find(s=>s.name===t)?.id).filter(Boolean);o.findings ||= '';o.impression ||= '';o.reportedBy ||= '';});
  (parsed.pharmacyReturns||[]).forEach(ensure);
  (parsed.services||[]).forEach(x=>{ensure(x);x.localCode ||= x.id;x.codeSystem ||= (x.type==='Laboratory'?'http://loinc.org':'');x.standardCode ||= '';});
  (parsed.inventory||[]).forEach(x=>{ensure(x);x.localCode ||= x.id;x.standardCodeSystem ||= '';x.standardCode ||= '';});
  (parsed.labSupplies||[]).forEach(ensure);
  if(!parsed.clinic.uuid){parsed.clinic.uuid=newUuid();changed=true} if(!parsed.pharmacyEntity.uuid){parsed.pharmacyEntity.uuid=newUuid();changed=true}
  if(changed) parsed.meta.lastMigration=new Date().toISOString();
  return changed;
}

let db = window.ACCUBackend?.configured ? structuredClone(seed) : load();
let cart = [];
let saleDraft = {entity:'clinic',patientId:'',payment:'Cash',tendered:'',buyerName:'',buyerTin:'',buyerAddress:'',discountType:'None',discountId:'',discountPercent:'0'};
let activeRole = localStorage.getItem(ROLE_KEY) || 'Administrator';
if(!ROLE_CONFIG[activeRole]) activeRole = 'Administrator';
let activeView = 'dashboard';
let labActiveTab = 'orders';
let pharmacyActiveTab = 'inventory';
let pharmacySearch = '';
let medicinePosSearch = '';
let staffProfiles = [];

function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw){ const fresh=structuredClone(seed);ensureInteropModel(fresh);localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));return fresh; }
  try{
    const parsed = JSON.parse(raw);
    parsed.audit ||= [];
    parsed.transactions ||= [];
    parsed.labOrders ||= [];
    parsed.radiologyOrders ||= [];
    parsed.pharmacyReturns ||= [];
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
    const migrated=ensureInteropModel(parsed);
    if(migrated || Number(parsed.meta?.schemaVersion||0)<10) localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    return parsed;
  }catch{const fresh=structuredClone(seed);ensureInteropModel(fresh);return fresh}
}
function updateBackendBadge(text,kind=''){
  const el=document.getElementById('backendBadge'); if(!el)return; el.textContent=text; el.className='backend-badge'+(kind?' '+kind:'');
}
async function syncBackend(action){
  if(!window.ACCUBackend?.configured || !window.ACCUBackend.status.user) return;
  updateBackendBadge('Syncing…');
  try{await window.ACCUBackend.syncWorkspace(db,action,activeRole);updateBackendBadge('Supabase connected','live')}catch(e){console.error(e);updateBackendBadge('Sync error','error')}
}
function save(action){
  if(action) db.audit.unshift({ts:new Date().toISOString(),user:activeRole,action});
  if(!window.ACCUBackend?.configured) localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  renderAll();
  updateRoleUI();
  syncBackend(action);
}
function money(n){return new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(Number(n||0))}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function today(){return new Date().toISOString().slice(0,10)}
function patientName(id){return db.patients.find(p=>p.id===id)?.name || 'Walk-in'}
function nextId(prefix,list){return `${prefix}-${String(list.length+1).padStart(4,'0')}`}
function roleCfg(){return ROLE_CONFIG[activeRole]}
function can(action){return roleCfg().actions.includes(action)}
function canView(view){return roleCfg().views.includes(view)}
function guard(action){if(!can(action)){alert(`This action is not available to the ${activeRole} role.`);return false}return true}
function statusBadgeClass(status){return status==='Completed'||status==='Released'?'green':status==='Processing'||status==='For Validation'?'amber':'blue'}
function daysUntil(date){return Math.ceil((new Date(`${date}T23:59:59`)-new Date())/86400000)}
function entityCfg(entity='clinic'){return entity==='pharmacy'?(db.pharmacyEntity||seed.pharmacyEntity):(db.clinic||seed.clinic)}
function clinicCfg(){return entityCfg('clinic')}
function currentSaleEntity(){return activeRole==='Pharmacist'?'pharmacy':(saleDraft.entity||'clinic')}
function entityLabel(entity){return entity==='pharmacy'?'Pharmacy':'Clinic / Laboratory / Radiology'}
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
  const roleSelect=document.getElementById('roleSelect');if(roleSelect)roleSelect.value=activeRole;
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
  const returnedToday=(db.pharmacyReturns||[]).filter(r=>String(r.createdAt||'').slice(0,10)===today());
  const refundToday=returnedToday.reduce((a,b)=>a+Number(b.refundAmount||0),0);
  const revenueToday=txToday.reduce((a,b)=>a+b.total,0)-refundToday;
  const clinicRevenueToday=txToday.filter(t=>(t.entity||'clinic')==='clinic').reduce((a,b)=>a+b.total,0);
  const pharmacyGrossToday=txToday.filter(t=>t.entity==='pharmacy').reduce((a,b)=>a+b.total,0);
  const pharmacyRevenueToday=pharmacyGrossToday-refundToday;
  const low=db.inventory.filter(i=>i.qty<=i.reorder);
  const soon=db.inventory.filter(i=>i.expiry&&(()=>{const d=daysUntil(i.expiry);return d>=0&&d<=90})());
  const lowLab=(db.labSupplies||[]).filter(i=>i.qty<=i.reorder);
  const labsToday=db.labOrders.filter(o=>o.date===today());
  const radsToday=(db.radiologyOrders||[]).filter(o=>o.date===today());
  const consultToday=db.consultations.filter(c=>c.date===today());
  const pendingLabs=db.labOrders.filter(o=>o.status!=='Released');
  const pendingRads=(db.radiologyOrders||[]).filter(o=>o.status!=='Final');

  if(activeRole==='Administrator'){
    target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('Clinic / Diagnostics',money(clinicRevenueToday),'Today · clinic entity')}${stat('Pharmacy Net Sales',money(pharmacyRevenueToday),refundToday?`${money(refundToday)} returns/refunds today`:'Today · pharmacy entity')}${stat('Pending Diagnostics',pendingLabs.length+pendingRads.length,`${pendingLabs.length} lab · ${pendingRads.length} radiology`)}${stat('Stock Alerts',low.length+lowLab.length,'Pharmacy + lab supplies')}</div>
      <div class="grid grid-2"><div class="card"><div class="section-head"><h2>Operational Alerts</h2></div>${inventoryAlerts(low,soon)}</div><div class="card"><div class="section-head"><h2>Today’s Workflow</h2></div>${workflowRows(consultToday.length,labsToday.length,radsToday.length,txToday.length)}</div></div>
      <div class="section-head"><h2>Recent Transactions</h2><button class="secondary" onclick="showView('pos')">Open POS</button></div>${transactionsTable(db.transactions.slice(0,8))}`;
    return;
  }
  if(activeRole==='Receptionist'){
    const waiting=consultToday.filter(c=>c.status!=='Completed').length;
    target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('Patients Registered',db.patients.length,'Current patient registry')}${stat('Consultations Today',consultToday.length,'Scheduled / registered today')}${stat('Lab Requests Today',labsToday.length,'Orders created today')}${stat('Radiology Requests',radsToday.length,'Orders created today')}</div>
      <div class="card"><div class="section-head"><h2>Front Desk Actions</h2></div><div class="action-grid">${actionCard('Register Patient','Create a new patient profile',`openPatientModal()`)}${actionCard('Consultation Queue',`Add patient for physician consultation`,`openConsultModal()`)}${actionCard('Laboratory Request','Create a laboratory order',`openLabModal()`)}${actionCard('Radiology Request','Create an imaging request',`openRadiologyModal()`)}</div></div>
      <div class="section-head"><h2>Today’s Consultation Queue</h2></div>${consultationsTable(consultToday)}`;
    return;
  }
  if(activeRole==='Physician'){
    const queued=consultToday.filter(c=>c.status!=='Completed');
    target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('Consultations Today',consultToday.length,'All encounters today')}${stat('Waiting',queued.length,'Not yet completed')}${stat('Pending Lab Orders',pendingLabs.length,'Awaiting release')}${stat('Pending Radiology',pendingRads.length,'Awaiting final report')}</div><div class="section-head"><h2>Patient Queue</h2><button class="primary" onclick="openConsultModal()">+ New Consultation</button></div>${consultationsTable(queued.length?queued:consultToday)}`;
    return;
  }
  if(activeRole==='Medical Technologist'){
    const collection=pendingLabs.filter(o=>['For Collection','Collected'].includes(o.status)).length;
    const processing=pendingLabs.filter(o=>o.status==='Processing').length;
    const validation=pendingLabs.filter(o=>o.status==='For Validation').length;
    target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('Collection Queue',collection,'For collection / collected')}${stat('Processing',processing,'Tests currently processing')}${stat('For Validation',validation,'Awaiting validation')}${stat('Low Lab Supplies',lowLab.length,'At or below reorder level')}</div><div class="section-head"><h2>Active Laboratory Queue</h2><button class="secondary" onclick="showView('laboratory')">View All Orders</button></div>${labTable(pendingLabs.slice(0,10))}`;
    return;
  }
  if(activeRole==='Radiologic Technologist'){
    const scheduled=pendingRads.filter(o=>['Ordered','Scheduled'].includes(o.status)).length;
    const imaging=pendingRads.filter(o=>['For Imaging','Performed'].includes(o.status)).length;
    target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('Scheduled / Ordered',scheduled,'Awaiting imaging')}${stat('Imaging Worklist',imaging,'For imaging / performed')}${stat('For Reading',pendingRads.filter(o=>o.status==='For Reading').length,'Awaiting radiologist')}${stat('Completed Today',radsToday.filter(o=>o.status==='Final').length,'Final reports')}</div><div class="section-head"><h2>Radiology Worklist</h2></div>${radiologyTable(pendingRads.slice(0,10))}`;
    return;
  }
  if(activeRole==='Radiologist'){
    const reading=pendingRads.filter(o=>o.status==='For Reading'||o.status==='Performed');
    target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('For Reading',reading.length,'Awaiting interpretation')}${stat('Final Today',radsToday.filter(o=>o.status==='Final').length,'Released reports')}${stat('Pending Imaging',pendingRads.filter(o=>['Ordered','Scheduled','For Imaging'].includes(o.status)).length,'Not yet ready for reading')}${stat('Total Radiology Orders',db.radiologyOrders.length,'All recorded orders')}</div><div class="section-head"><h2>Reporting Queue</h2></div>${radiologyTable(reading.length?reading:db.radiologyOrders.slice(0,10))}`;
    return;
  }
  if(activeRole==='Pharmacist'){
    target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('Pharmacy Net Sales',money(pharmacyRevenueToday),'Today after recorded refunds')}${stat('Returns Today',returnedToday.length,refundToday?money(refundToday)+' financial adjustment':'No refund today')}${stat('Low-stock Items',low.length,'At or below reorder level')}${stat('Expiring ≤90 Days',soon.length,'Batches needing attention')}</div><div class="grid grid-2"><div class="card"><div class="section-head"><h2>Inventory Alerts</h2></div>${inventoryAlerts(low,soon)}</div><div class="card"><div class="section-head"><h2>Quick Actions</h2></div><div class="action-grid">${actionCard('New Pharmacy Sale','Open medicine-only POS',`showView('pos')`)}${actionCard('Process Return','Return against a pharmacy invoice',`openPharmacyReturnModal()`)}${actionCard('Add Stock Batch','Register incoming medicine stock',`openMedicineModal()`)}</div></div></div>`;
    return;
  }
  const cashTotal=txToday.filter(t=>t.payment==='Cash').reduce((a,b)=>a+b.total,0);
  const ewallet=txToday.filter(t=>['GCash','Maya'].includes(t.payment)).reduce((a,b)=>a+b.total,0);
  target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('Today’s Collections',money(revenueToday),'Net of recorded pharmacy refunds')}${stat('Transactions',txToday.length,'Completed today')}${stat('Cash',money(cashTotal),'Cash collections before refunds')}${stat('E-wallet',money(ewallet),'GCash + Maya')}</div><div class="section-head"><h2>Recent Payments</h2><button class="primary" onclick="showView('pos')">+ New Transaction</button></div>${transactionsTable(txToday.slice(0,10))}`;
}

function inventoryAlerts(low,soon){
  return `${low.length?`<div class="notice red"><strong>Low stock:</strong> ${low.map(x=>`${esc(x.generic)} (${x.qty})`).join(', ')}</div>`:''}${soon.length?`<div class="notice" style="margin-top:10px"><strong>Expiring within 90 days:</strong> ${soon.map(x=>`${esc(x.generic)} – ${x.expiry}`).join(', ')}</div>`:''}${!low.length&&!soon.length?'<div class="empty">No urgent stock or expiry alerts.</div>':''}`;
}
function workflowRows(consults,labs,rads,txs){return `<div class="summary-row"><span>Consultations</span><strong>${consults}</strong></div><div class="summary-row"><span>Lab orders</span><strong>${labs}</strong></div><div class="summary-row"><span>Radiology orders</span><strong>${rads}</strong></div><div class="summary-row"><span>Transactions</span><strong>${txs}</strong></div>`}

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
    {const id=nextId('P',db.patients);db.patients.push({id,uuid:newUuid(),identifiers:[{system:'urn:accu:patient-id',value:id}],name,sex:v('pSex'),dob:v('pDob'),phone:v('pPhone'),address:v('pAddress'),discount:v('pDiscount')})};save(`Added patient ${name}`);closeModal();
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
  if(!id && !db.patients.length) return alert('Register a patient before creating a consultation encounter.');
  const existing=id?db.consultations.find(c=>c.id===id):null;
  const receptionist=activeRole==='Receptionist';
  const title=existing?'Consultation Encounter':(receptionist?'Add to Consultation Queue':'New Consultation');
  const pId=existing?.patientId||db.patients[0]?.id||'';
  modal(title,`<div class="form-grid">${patientSelect('cPatient',pId)}${field('Doctor','cDoctor','text',existing?.doctor||'')}${field('Date','cDate','date',existing?.date||today())}${field('Consultation fee','cFee','number',existing?.fee??500)}<div class="field full"><label>Chief complaint</label><input id="cChief" value="${esc(existing?.chief||'')}"></div><div class="field full"><label>Vitals</label><input id="cVitals" value="${esc(existing?.vitals||'')}" placeholder="BP, PR, RR, Temp"></div><div class="field full"><label>Assessment / Diagnosis</label><textarea id="cAssessment" ${receptionist?'disabled':''}>${esc(existing?.assessment||'')}</textarea></div>${!receptionist?`<div class="field"><label>Diagnosis code system</label><select id="cDxSystem"><option value="http://hl7.org/fhir/sid/icd-10" ${(existing?.diagnosisCodeSystem||'').includes('icd-10')?'selected':''}>ICD-10</option><option value="http://snomed.info/sct" ${(existing?.diagnosisCodeSystem||'').includes('snomed')?'selected':''}>SNOMED CT</option></select></div><div class="field"><label>Diagnosis code (optional)</label><input id="cDxCode" value="${esc(existing?.diagnosisCode||'')}" placeholder="e.g. I10"></div>`:''}${receptionist?'<div class="notice blue full">Receptionist entries are added to the physician queue. Clinical assessment is completed under the Physician role.</div>':''}</div>`,()=>{
    const record={patientId:v('cPatient'),doctor:v('cDoctor'),date:v('cDate')||today(),chief:v('cChief'),vitals:v('cVitals'),assessment:v('cAssessment'),diagnosisCodeSystem:v('cDxSystem')||existing?.diagnosisCodeSystem||'http://hl7.org/fhir/sid/icd-10',diagnosisCode:v('cDxCode')||existing?.diagnosisCode||'',fee:+v('cFee')||0,status:receptionist?'Queued':'Completed'};
    if(existing){Object.assign(existing,record);save(`Updated consultation ${existing.id}`)}else{record.id=nextId('C',db.consultations);record.uuid=newUuid();db.consultations.unshift(record);save(`Created consultation ${record.id}`)}
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
  target.innerHTML=`${tabs}<div class="section-head"><h2>Laboratory Orders</h2>${addOrder}</div>${labTable(db.labOrders)}`;
}
window.setLabTab=function(tab){labActiveTab=tab;renderLab()};
function labTable(rows){
  const showAmount=activeRole==='Administrator';
  const showResult=['Administrator','Physician','Medical Technologist'].includes(activeRole);
  const hasActions=can('labStatus')||can('labResult');
  const head=`<th>Order</th><th>Date</th><th>Patient</th><th>Tests</th>${showAmount?'<th>Amount</th>':''}<th>Status</th>${showResult?'<th>Result</th>':''}${hasActions?'<th>Actions</th>':''}`;
  const colspan=6+(showAmount?1:0)+(showResult?1:0)+(hasActions?1:0)-1;
  return `<div class="table-wrap"><table class="responsive-table"><thead><tr>${head}</tr></thead><tbody>${rows.map(o=>`<tr><td data-label="Order">${o.id}</td><td data-label="Date">${o.date}</td><td data-label="Patient"><strong>${esc(patientName(o.patientId))}</strong></td><td data-label="Tests">${o.tests.map(t=>`<span class="badge blue">${esc(t)}</span>`).join(' ')}</td>${showAmount?`<td data-label="Amount">${money(o.amount)}</td>`:''}<td data-label="Status"><span class="badge ${statusBadgeClass(o.status)}">${esc(o.status)}</span></td>${showResult?`<td data-label="Result">${(o.resultComponents||[]).length?`<strong>${o.resultComponents.length} structured result${o.resultComponents.length===1?'':'s'}</strong>${o.resultNote?`<br><span class="muted">${esc(o.resultNote)}</span>`:''}`:(o.resultNote?esc(o.resultNote):'<span class="muted">Not encoded</span>')}</td>`:''}${hasActions?`<td data-label="Actions"><div class="inline-actions">${can('labStatus')?labStatusControl(o):''}${can('labResult')?`<button class="small-btn" onclick="openLabResultModal('${o.id}')">Encode Result</button>`:''}</div></td>`:''}</tr>`).join('')||`<tr><td colspan="${colspan}" class="empty">No laboratory orders.</td></tr>`}</tbody></table></div>`;
}
function labStatusControl(o){
  const statuses=['For Collection','Collected','Processing','For Validation','Released'];
  return `<select class="small-select" aria-label="Lab status" onchange="setLabStatus('${o.id}',this.value)">${statuses.map(s=>`<option ${o.status===s?'selected':''}>${s}</option>`).join('')}</select>`;
}
window.setLabStatus=function(id,status){if(!guard('labStatus'))return;const o=db.labOrders.find(x=>x.id===id);if(o){o.status=status;save(`Lab order ${id} changed to ${status}`)}};
function resultComponentRow(c={},idx=0){return `<div class="result-component-row" data-result-row><div><label>Analyte / Component</label><input data-f="name" value="${esc(c.name||'')}" placeholder="Hemoglobin"></div><div><label>Standard code</label><input data-f="code" value="${esc(c.code||'')}" placeholder="LOINC if mapped"></div><div><label>Value</label><input data-f="value" value="${esc(c.value??'')}"></div><div><label>Unit</label><input data-f="unit" value="${esc(c.unit||'')}"></div><div><label>Ref. low</label><input data-f="low" value="${esc(c.low??'')}"></div><div><label>Ref. high</label><input data-f="high" value="${esc(c.high??'')}"></div><div><label>Flag</label><select data-f="flag">${['','N','L','H','Critical'].map(x=>`<option ${c.flag===x?'selected':''}>${x}</option>`).join('')}</select></div><button type="button" class="small-btn result-remove" onclick="this.closest('[data-result-row]').remove()">Remove</button></div>`}
window.appendResultRow=function(){document.getElementById('resultComponents')?.insertAdjacentHTML('beforeend',resultComponentRow({},Date.now()))};
window.openLabResultModal=function(id){
  if(!guard('labResult'))return;
  const o=db.labOrders.find(x=>x.id===id);if(!o)return;
  const rows=(o.resultComponents?.length?o.resultComponents:[{}]).map(resultComponentRow).join('');
  modal(`Laboratory Result · ${o.id}`,`<div class="summary-box"><div class="summary-row"><span>Patient</span><strong>${esc(patientName(o.patientId))}</strong></div><div class="summary-row"><span>Tests</span><strong>${o.tests.map(esc).join(', ')}</strong></div></div><div class="section-head" style="margin-top:14px"><div><h3>Structured result components</h3><p class="muted">Optional standard code is intended for a validated LOINC mapping.</p></div><button type="button" class="small secondary" onclick="appendResultRow()">+ Component</button></div><div id="resultComponents" class="result-components">${rows}</div><div class="field" style="margin-top:14px"><label>Result summary / comment</label><textarea id="labResultNote" placeholder="Human-readable interpretation or note">${esc(o.resultNote||'')}</textarea></div><div class="notice blue" style="margin-top:12px">FHIR export uses each structured row as an Observation. Blank standard codes remain local/unmapped rather than being guessed.</div>`,()=>{const comps=[...document.querySelectorAll('[data-result-row]')].map(row=>{const get=f=>row.querySelector(`[data-f="${f}"]`)?.value?.trim()||'';return {uuid:newUuid(),name:get('name'),codeSystem:get('code')?'http://loinc.org':'',code:get('code'),value:get('value'),unit:get('unit'),low:get('low'),high:get('high'),flag:get('flag')}}).filter(x=>x.name||x.value);o.resultComponents=comps;o.resultNote=v('labResultNote');if(o.status==='For Collection'||o.status==='Collected')o.status='Processing';save(`Updated structured result for ${o.id}`);closeModal()},'Save Result');
};
window.openLabModal=function(){
  if(!db.patients.length) return alert('Register a patient before creating a laboratory order.');
  if(!guard('createLab'))return;
  const labServices=db.services.filter(s=>s.type==='Laboratory'||s.type==='Diagnostic');
  modal('New Laboratory Order',`<div class="form-grid">${patientSelect('lPatient')}${field('Date','lDate','date',today())}<div class="field full"><label>Tests</label>${labServices.map(s=>`<label style="display:flex;gap:8px;align-items:center;margin:9px 0"><input style="width:auto;min-height:0" type="checkbox" class="labTest" value="${s.id}"> ${esc(s.name)} — ${money(s.price)}</label>`).join('')}</div></div>`,()=>{
    const ids=[...document.querySelectorAll('.labTest:checked')].map(x=>x.value);if(!ids.length)return alert('Select at least one test.');
    const tests=ids.map(id=>db.services.find(s=>s.id===id));const order={id:nextId('LAB',db.labOrders),uuid:newUuid(),patientId:v('lPatient'),date:v('lDate')||today(),serviceIds:tests.map(x=>x.id),tests:tests.map(x=>x.name),status:'For Collection',amount:tests.reduce((a,b)=>a+b.price,0),resultNote:'',resultComponents:[]};db.labOrders.unshift(order);save(`Created lab order ${order.id}`);closeModal();
  });
};
function labSuppliesTable(rows){
  return `<div class="table-wrap"><table class="responsive-table"><thead><tr><th>Supply</th><th>Category</th><th>Supplier</th><th>Lot</th><th>Expiry</th><th>Stock</th><th>Reorder</th><th>Cost</th><th>Actions</th></tr></thead><tbody>${rows.map(i=>{const low=i.qty<=i.reorder;const exp=i.expiry&&daysUntil(i.expiry)<0;const soon=i.expiry&&daysUntil(i.expiry)>=0&&daysUntil(i.expiry)<=90;return `<tr><td data-label="Supply"><strong>${esc(i.name)}</strong><br><span class="muted">${esc(i.brand||'')} · ${esc(i.unit||'unit')}</span></td><td data-label="Category"><span class="badge blue">${esc(i.category||'Other')}</span></td><td data-label="Supplier">${esc(i.supplier||'—')}</td><td data-label="Lot">${esc(i.lot||'—')}</td><td data-label="Expiry">${i.expiry||'—'}</td><td data-label="Stock"><strong>${i.qty}</strong> ${esc(i.unit||'')}</td><td data-label="Reorder">${i.reorder}</td><td data-label="Cost">${money(i.cost)}</td><td data-label="Actions"><div class="inline-actions">${can('useLabSupply')?`<button class="small-btn" onclick="openLabSupplyMovement('${i.id}','use')">Use</button><button class="small secondary" onclick="openLabSupplyMovement('${i.id}','stockin')">+ Stock</button>`:''}${exp?'<span class="badge red">Expired</span>':low?'<span class="badge red">Low</span>':soon?'<span class="badge amber">Expiring</span>':'<span class="badge green">OK</span>'}</div></td></tr>`}).join('')||'<tr><td colspan="9" class="empty">No laboratory supplies yet.</td></tr>'}</tbody></table></div>`;
}
window.openLabSupplyModal=function(){
  if(!guard('addLabSupply'))return;
  modal('Add Laboratory Supply Batch',`<div class="form-grid">${field('Supply name','lsName')}${field('Category','lsCategory','select',['Reagent','Collection','Consumable','PPE','Cleaning','Other'])}${field('Brand / Manufacturer','lsBrand')}${field('Supplier','lsSupplier')}${field('Lot / Batch','lsLot')}${field('Unit','lsUnit','text','piece')}${field('Expiry','lsExpiry','date')}${field('Quantity','lsQty','number',0)}${field('Reorder level','lsReorder','number',10)}${field('Cost per unit','lsCost','number',0)}</div>`,()=>{const name=v('lsName');if(!name)return alert('Supply name is required.');{const id=`LS-${Date.now()}`;db.labSupplies.unshift({id,uuid:newUuid(),name,category:v('lsCategory'),brand:v('lsBrand'),supplier:v('lsSupplier'),lot:v('lsLot'),unit:v('lsUnit')||'unit',expiry:v('lsExpiry'),qty:+v('lsQty')||0,reorder:+v('lsReorder')||0,cost:+v('lsCost')||0});}save(`Added lab supply batch: ${name}`);closeModal()},'Add Supply');
};
window.openLabSupplyMovement=function(id,mode){
  if(!guard('useLabSupply'))return;const i=db.labSupplies.find(x=>x.id===id);if(!i)return;const use=mode==='use';
  modal(`${use?'Use':'Stock In'} · ${i.name}`,`<div class="summary-box"><div class="summary-row"><span>Current stock</span><strong>${i.qty} ${esc(i.unit||'')}</strong></div><div class="summary-row"><span>Lot</span><strong>${esc(i.lot||'—')}</strong></div></div><div class="form-grid" style="margin-top:14px">${field(use?'Quantity used':'Quantity received','lsMoveQty','number',1)}<div class="field full"><label>Note / purpose</label><input id="lsMoveNote" placeholder="e.g. CBC run, restock PO, damaged stock"></div></div>`,()=>{const qty=Math.max(0,Number(v('lsMoveQty')||0));if(!qty)return alert('Enter a quantity.');if(use&&qty>i.qty)return alert('Not enough stock.');i.qty+=use?-qty:qty;db.labSupplyMovements.unshift({id:`LSM-${Date.now()}`,supplyId:i.id,type:use?'Use':'Stock In',qty,date:new Date().toISOString(),note:v('lsMoveNote'),user:activeRole});save(`${use?'Used':'Stocked in'} ${qty} ${i.unit||'unit'} of ${i.name}`);closeModal()},use?'Record Usage':'Add Stock');
};


function renderRadiology(){
  const add=can('createRadiology')?'<button class="primary" onclick="openRadiologyModal()">+ New Radiology Order</button>':'';
  const pending=db.radiologyOrders.filter(o=>o.status!=='Final').length;
  const forReading=db.radiologyOrders.filter(o=>['Performed','For Reading'].includes(o.status)).length;
  const finalToday=db.radiologyOrders.filter(o=>o.status==='Final'&&o.date===today()).length;
  document.getElementById('radiology').innerHTML=`<div class="grid grid-3 kpi-strip">${stat('Open Orders',pending,'Not yet final')}${stat('For Reading',forReading,'Ready for interpretation')}${stat('Final Today',finalToday,'Reports completed today')}</div><div class="section-head"><div><h2>Radiology Worklist</h2><p class="muted">Imaging requests, acquisition workflow and final diagnostic reports.</p></div>${add}</div>${radiologyTable(db.radiologyOrders)}`;
}
function radiologyTable(rows){
  const showReport=['Administrator','Physician','Radiologist'].includes(activeRole);
  const hasActions=can('radiologyStatus')||can('radiologyReport');
  const head=`<th>Order</th><th>Date</th><th>Patient</th><th>Study</th><th>Status</th>${showReport?'<th>Report</th>':''}${hasActions?'<th>Actions</th>':''}`;
  const colspan=5+(showReport?1:0)+(hasActions?1:0);
  return `<div class="table-wrap"><table class="responsive-table"><thead><tr>${head}</tr></thead><tbody>${rows.map(o=>`<tr><td data-label="Order"><strong>${esc(o.id)}</strong></td><td data-label="Date">${esc(o.date||'')}</td><td data-label="Patient"><strong>${esc(patientName(o.patientId))}</strong></td><td data-label="Study">${(o.tests||[]).map(t=>`<span class="badge blue">${esc(t)}</span>`).join(' ')}</td><td data-label="Status"><span class="badge ${o.status==='Final'?'green':o.status==='For Reading'||o.status==='Performed'?'amber':'blue'}">${esc(o.status)}</span></td>${showReport?`<td data-label="Report">${o.status==='Final'?`<strong>${esc(o.impression||'Final report')}</strong>${o.reportedBy?`<br><span class="muted">${esc(o.reportedBy)}</span>`:''}`:'<span class="muted">Not final</span>'}</td>`:''}${hasActions?`<td data-label="Actions"><div class="inline-actions">${can('radiologyStatus')?radiologyStatusControl(o):''}${o.status==='Final'&&showReport?`<button class="small-btn" onclick="openRadiologyViewModal('${o.id}')">View Report</button>`:''}${can('radiologyReport')?`<button class="small-btn" onclick="openRadiologyReportModal('${o.id}')">${o.status==='Final'?'Edit Report':'Report'}</button>`:''}</div></td>`:''}</tr>`).join('')||`<tr><td colspan="${colspan}" class="empty">No radiology orders.</td></tr>`}</tbody></table></div>`;
}
function radiologyStatusControl(o){
  const statuses=activeRole==='Radiologic Technologist'?['Ordered','Scheduled','For Imaging','Performed','For Reading']:['Ordered','Scheduled','For Imaging','Performed','For Reading','Final'];
  return `<select class="small-select" aria-label="Radiology status" onchange="setRadiologyStatus('${o.id}',this.value)">${statuses.map(x=>`<option ${o.status===x?'selected':''}>${x}</option>`).join('')}</select>`;
}
window.setRadiologyStatus=function(id,status){if(!guard('radiologyStatus'))return;const o=db.radiologyOrders.find(x=>x.id===id);if(!o)return;if(status==='Final'&&!o.impression)return alert('A radiologist report is required before final release.');o.status=status;save(`Radiology order ${id} changed to ${status}`)};
window.openRadiologyModal=function(){
  if(!guard('createRadiology'))return;
  if(!db.patients.length) return alert('Register a patient before creating a radiology order.');
  const services=db.services.filter(s=>s.type==='Radiology');
  modal('New Radiology Order',`<div class="form-grid">${patientSelect('rPatient')}${field('Requested date','rDate','date',today())}<div class="field full"><label>Imaging study</label>${services.map(s=>`<label style="display:flex;gap:8px;align-items:center;margin:9px 0"><input style="width:auto;min-height:0" type="checkbox" class="radStudy" value="${s.id}"> ${esc(s.name)} — ${money(s.price)}</label>`).join('')||'<div class="notice">No radiology services are configured. Add them to the service catalog first.</div>'}</div><div class="field full"><label>Clinical indication / request note</label><textarea id="rIndication" placeholder="Reason for imaging, relevant clinical history"></textarea></div></div>`,()=>{const ids=[...document.querySelectorAll('.radStudy:checked')].map(x=>x.value);if(!ids.length)return alert('Select at least one imaging study.');const tests=ids.map(id=>db.services.find(s=>s.id===id)).filter(Boolean);const o={id:nextId('RAD',db.radiologyOrders),uuid:newUuid(),patientId:v('rPatient'),date:v('rDate')||today(),serviceIds:tests.map(x=>x.id),tests:tests.map(x=>x.name),amount:tests.reduce((a,b)=>a+b.price,0),indication:v('rIndication'),status:'Ordered',findings:'',impression:'',reportedBy:'',reportDate:''};db.radiologyOrders.unshift(o);save(`Created radiology order ${o.id}`);closeModal()},'Create Order');
};
window.openRadiologyViewModal=function(id){const o=db.radiologyOrders.find(x=>x.id===id);if(!o||o.status!=='Final')return;modal(`Radiology Report · ${o.id}`,`<div class="summary-box"><div class="summary-row"><span>Patient</span><strong>${esc(patientName(o.patientId))}</strong></div><div class="summary-row"><span>Study</span><strong>${(o.tests||[]).map(esc).join(', ')}</strong></div><div class="summary-row"><span>Reported by</span><strong>${esc(o.reportedBy||'—')}</strong></div></div><div class="card" style="margin-top:14px;box-shadow:none"><h3>Findings</h3><p style="white-space:pre-wrap">${esc(o.findings||'—')}</p><h3>Impression</h3><p style="white-space:pre-wrap"><strong>${esc(o.impression||'—')}</strong></p></div>`,null,'Close')};
window.openRadiologyReportModal=function(id){
  if(!guard('radiologyReport'))return;const o=db.radiologyOrders.find(x=>x.id===id);if(!o)return;
  modal(`Radiology Report · ${o.id}`,`<div class="summary-box"><div class="summary-row"><span>Patient</span><strong>${esc(patientName(o.patientId))}</strong></div><div class="summary-row"><span>Study</span><strong>${(o.tests||[]).map(esc).join(', ')}</strong></div><div class="summary-row"><span>Indication</span><strong>${esc(o.indication||'—')}</strong></div></div><div class="field" style="margin-top:14px"><label>Findings</label><textarea id="radFindings" placeholder="Imaging findings">${esc(o.findings||'')}</textarea></div><div class="field" style="margin-top:12px"><label>Impression</label><textarea id="radImpression" placeholder="Diagnostic impression">${esc(o.impression||'')}</textarea></div><div class="field" style="margin-top:12px"><label>Reported by</label><input id="radReportedBy" value="${esc(o.reportedBy||window.ACCUBackend?.status?.profile?.full_name||'')}" placeholder="Radiologist"></div><div class="notice blue" style="margin-top:12px">Final release should be performed by an authorized radiologist or administrator according to clinic policy.</div>`,()=>{if(!v('radImpression'))return alert('Impression is required to finalize the report.');o.findings=v('radFindings');o.impression=v('radImpression');o.reportedBy=v('radReportedBy');o.reportDate=new Date().toISOString();o.status='Final';save(`Finalized radiology report ${o.id}`);closeModal()},'Save & Finalize');
};


function renderPharmacy(){
  const tabs=`<div class="subtabs"><button class="subtab ${pharmacyActiveTab==='inventory'?'active':''}" onclick="setPharmacyTab('inventory')">Medicine Inventory</button><button class="subtab ${pharmacyActiveTab==='returns'?'active':''}" onclick="setPharmacyTab('returns')">Returns & Adjustments</button></div>`;
  const target=document.getElementById('pharmacy');
  if(pharmacyActiveTab==='returns'){
    const returns=db.pharmacyReturns||[];
    const refunded=returns.reduce((a,b)=>a+Number(b.refundAmount||0),0);
    target.innerHTML=`${tabs}<div class="grid grid-3 kpi-strip">${stat('Return Records',returns.length,'Documented pharmacy returns')}${stat('Financial Adjustments',money(refunded),'Refund / store-credit value')}${stat('Restocked Units',returns.filter(r=>r.restock).reduce((a,b)=>a+Number(b.qty||0),0),'Returned to saleable inventory')}</div><div class="section-head"><div><h2>Pharmacy Returns</h2><p class="muted">Returns are linked to an original pharmacy invoice and maintain an audit trail.</p></div>${can('pharmacyReturn')?'<button class="primary" onclick="openPharmacyReturnModal()">+ Process Return</button>':''}</div>${pharmacyReturnsTable(returns)}`;
    return;
  }
  const add=can('addMedicine')?'<button class="primary" onclick="openMedicineModal()">+ Add Medicine Batch</button>':'';
  const q=pharmacySearch.trim().toLowerCase();
  const rows=db.inventory.filter(i=>!q||[i.generic,i.brand,i.strength,i.form,i.batch,i.supplier].join(' ').toLowerCase().includes(q));
  target.innerHTML=`${tabs}<div class="section-head"><div><h2>Medicine Inventory</h2><p class="muted">Generic and brand names, batch tracking, expiry monitoring and pharmacy-only stock.</p></div><div class="toolbar"><input class="search-input" value="${esc(pharmacySearch)}" placeholder="Search generic, brand, strength, batch…" oninput="setPharmacySearch(this.value)">${add}</div></div><div class="table-wrap"><table class="responsive-table"><thead><tr><th>Generic / Brand</th><th>Batch</th><th>Supplier</th><th>Expiry</th><th>Stock</th><th>Reorder</th><th>Cost</th><th>Selling Price</th><th>Status</th></tr></thead><tbody>${rows.map(i=>{const days=i.expiry?daysUntil(i.expiry):9999;const low=i.qty<=i.reorder;const exp=i.expiry&&days<0;const soon=i.expiry&&days>=0&&days<=90;return `<tr><td data-label="Generic / Brand"><strong>${esc(i.generic)} ${esc(i.strength)}</strong><br><span class="muted">${esc(i.brand||'No brand')} · ${esc(i.form)}</span></td><td data-label="Batch">${esc(i.batch)}</td><td data-label="Supplier">${esc(i.supplier||'—')}</td><td data-label="Expiry">${i.expiry||'—'}</td><td data-label="Stock">${i.qty}</td><td data-label="Reorder">${i.reorder}</td><td data-label="Cost">${money(i.cost)}</td><td data-label="Selling Price">${money(i.sell)}</td><td data-label="Status">${exp?'<span class="badge red">Expired</span>':low?'<span class="badge red">Low stock</span>':soon?'<span class="badge amber">Expiring soon</span>':'<span class="badge green">OK</span>'}</td></tr>`}).join('')||'<tr><td colspan="9" class="empty">No medicines match your search.</td></tr>'}</tbody></table></div>`;
}
window.setPharmacyTab=function(tab){pharmacyActiveTab=tab;renderPharmacy()};

window.setPharmacySearch=function(value){pharmacySearch=value;renderPharmacy();const el=document.querySelector('#pharmacy .search-input');if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length)}};
window.openMedicineModal=function(){
  if(!guard('addMedicine'))return;
  modal('Add Medicine Batch',`<div class="form-grid">${field('Generic name','mGeneric')}${field('Brand name','mBrand')}${field('Strength','mStrength')}${field('Dosage form','mForm')}${field('Batch / Lot','mBatch')}${field('Supplier','mSupplier')}${field('Expiry','mExpiry','date')}${field('Quantity','mQty','number',0)}${field('Reorder level','mReorder','number',20)}${field('Cost per unit','mCost','number',0)}${field('Selling price','mSell','number',0)}${field('Standard code system','mStdSystem','select',['','RxNorm','Local / other'])}${field('Standard medication code','mStdCode')}</div>`,()=>{const generic=v('mGeneric');if(!generic)return alert('Generic name is required.');{const id=`MED-${Date.now()}`;const sys=v('mStdSystem');db.inventory.push({id,uuid:newUuid(),localCode:id,generic,brand:v('mBrand'),strength:v('mStrength'),form:v('mForm'),batch:v('mBatch'),supplier:v('mSupplier'),expiry:v('mExpiry'),qty:+v('mQty')||0,reorder:+v('mReorder')||0,cost:+v('mCost')||0,sell:+v('mSell')||0,taxClass:'Unclassified',standardCodeSystem:sys==='RxNorm'?'http://www.nlm.nih.gov/research/umls/rxnorm':(sys==='Local / other'?'urn:accu:medication-code':''),standardCode:v('mStdCode')})};save(`Added pharmacy medicine batch: ${generic}`);closeModal()});
};



function returnedQtyFor(txnId,refId){return (db.pharmacyReturns||[]).filter(r=>r.transactionId===txnId&&r.refId===refId).reduce((a,b)=>a+Number(b.qty||0),0)}
function pharmacyReturnsTable(rows){return `<div class="table-wrap"><table class="responsive-table"><thead><tr><th>Return Ref.</th><th>Date</th><th>Invoice</th><th>Medicine</th><th>Qty</th><th>Reason</th><th>Disposition</th><th>Financial Adjustment</th><th>Processed By</th></tr></thead><tbody>${rows.map(r=>`<tr><td data-label="Return Ref."><strong>${esc(r.id)}</strong></td><td data-label="Date">${new Date(r.createdAt).toLocaleString('en-PH')}</td><td data-label="Invoice">${esc(r.invoiceNo||r.transactionId)}</td><td data-label="Medicine">${esc(r.itemName)}</td><td data-label="Qty">${r.qty}</td><td data-label="Reason">${esc(r.reason)}</td><td data-label="Disposition"><span class="badge ${r.restock?'green':'amber'}">${esc(r.disposition)}</span></td><td data-label="Financial">${r.financialAction==='No Refund'?esc(r.financialAction):`${esc(r.financialAction)} · ${money(r.refundAmount)}`}</td><td data-label="Processed By">${esc(r.operator||'—')}</td></tr>`).join('')||'<tr><td colspan="9" class="empty">No pharmacy returns recorded.</td></tr>'}</tbody></table></div>`}
function returnEligibleTransactions(){return db.transactions.filter(t=>t.entity==='pharmacy'&&(t.items||[]).some(i=>Number(i.qty||0)>returnedQtyFor(t.id,i.refId||i.ref)))}
window.populateReturnItems=function(){const txn=db.transactions.find(t=>t.id===v('retTxn'));const sel=document.getElementById('retItem');if(!sel)return;sel.innerHTML=txn?(txn.items||[]).map((i,idx)=>{const ref=i.refId||i.ref;const left=Math.max(0,Number(i.qty||0)-returnedQtyFor(txn.id,ref));return left?`<option value="${idx}">${esc(i.name)} · ${left} returnable</option>`:''}).join(''):'';updateReturnPreview()};
window.updateReturnPreview=function(){const txn=db.transactions.find(t=>t.id===v('retTxn'));const idx=Number(v('retItem')||0);const line=txn?.items?.[idx];const qty=Math.max(1,Number(v('retQty')||1));if(!txn||!line)return;const factor=Number(txn.subtotal||0)>0?Number(txn.total||0)/Number(txn.subtotal||1):1;const suggested=+(Number(line.price||0)*qty*factor).toFixed(2);const el=document.getElementById('retRefund');if(el&&!el.dataset.touched)el.value=suggested.toFixed(2);const left=Math.max(0,Number(line.qty||0)-returnedQtyFor(txn.id,line.refId||line.ref));const max=document.getElementById('retMax');if(max)max.textContent=`Maximum returnable: ${left}`};
window.openPharmacyReturnModal=function(transactionId=''){
  if(!guard('pharmacyReturn'))return;const eligible=returnEligibleTransactions();if(!eligible.length)return alert('No pharmacy invoice currently has returnable items.');
  const chosen=eligible.find(t=>t.id===transactionId)||eligible[0];
  modal('Process Pharmacy Return',`<div class="notice blue">Link every return to the original pharmacy invoice. Only restore stock when the returned medicine is verified as saleable under pharmacy policy. This internal return record does not replace any accounting or tax document required by the clinic's procedures.</div><div class="form-grid" style="margin-top:14px"><div class="field full"><label>Original pharmacy invoice</label><select id="retTxn" onchange="populateReturnItems()">${eligible.map(t=>`<option value="${t.id}" ${chosen.id===t.id?'selected':''}>${esc(t.invoiceNo||t.id)} · ${esc(t.buyerName||patientName(t.patientId))} · ${money(t.total)}</option>`).join('')}</select></div><div class="field full"><label>Medicine</label><select id="retItem" onchange="updateReturnPreview()"></select><small id="retMax" class="muted"></small></div>${field('Quantity to return','retQty','number',1)}<div class="field"><label>Financial action</label><select id="retFinancial" onchange="updateReturnPreview()"><option>Refund</option><option>Store Credit</option><option>No Refund</option></select></div><div class="field"><label>Refund / credit amount</label><input id="retRefund" type="number" min="0" step="0.01" oninput="this.dataset.touched='1'"></div><div class="field"><label>Inventory disposition</label><select id="retDisposition"><option>Quarantine / Do Not Restock</option><option>Restock to Saleable Inventory</option><option>Dispose / Damaged</option></select></div><div class="field full"><label>Return reason</label><input id="retReason" placeholder="e.g. wrong item dispensed, approved unopened return"></div><div class="field full"><label>Notes</label><textarea id="retNotes" placeholder="Condition, authorization, replacement details, etc."></textarea></div></div>`,()=>{const txn=db.transactions.find(t=>t.id===v('retTxn'));const idx=Number(v('retItem')||0);const line=txn?.items?.[idx];if(!txn||!line)return alert('Select an invoice item.');const refId=line.refId||line.ref;const max=Math.max(0,Number(line.qty||0)-returnedQtyFor(txn.id,refId));const qty=Math.max(1,Number(v('retQty')||1));if(qty>max)return alert(`Only ${max} unit(s) remain returnable for this line.`);if(!v('retReason'))return alert('Return reason is required.');const financialAction=v('retFinancial');const refundAmount=financialAction==='No Refund'?0:Math.max(0,Number(v('retRefund')||0));const factor=Number(txn.subtotal||0)>0?Number(txn.total||0)/Number(txn.subtotal||1):1;const maxFinancial=+(Number(line.price||0)*qty*factor).toFixed(2);if(refundAmount>maxFinancial+0.01)return alert(`Financial adjustment cannot exceed ${money(maxFinancial)} for the returned quantity.`);const disposition=v('retDisposition');const restock=disposition==='Restock to Saleable Inventory';if(restock){const med=db.inventory.find(i=>i.id===refId);if(!med)return alert('Original medicine batch was not found. Do not restock until the batch is reconciled.');med.qty+=qty;}const r={id:nextId('RET',db.pharmacyReturns),uuid:newUuid(),transactionId:txn.id,invoiceNo:txn.invoiceNo||'',refId,itemName:line.name,qty,unitPrice:Number(line.price||0),reason:v('retReason'),notes:v('retNotes'),financialAction,refundAmount,disposition,restock,operator:window.ACCUBackend?.status?.profile?.full_name||activeRole,createdAt:new Date().toISOString()};db.pharmacyReturns.unshift(r);const totalSold=(txn.items||[]).reduce((a,i)=>a+Number(i.qty||0),0);const totalReturned=(txn.items||[]).reduce((a,i)=>a+returnedQtyFor(txn.id,i.refId||i.ref),0);txn.returnStatus=totalReturned>=totalSold?'Returned':'Partially Returned';save(`Processed pharmacy return ${r.id} for ${txn.invoiceNo||txn.id}`);closeModal();pharmacyActiveTab='returns';showView('pharmacy')},'Record Return');
  setTimeout(populateReturnItems,0);
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
  const suggested=p?.discount&&p.discount!=='None'?`Patient registry flag: ${esc(p.discount)}. Verify eligibility and ID before applying any discount.`:'Enter buyer details when required for the invoice or clinic policy.';
  return `<details class="invoice-details" open>
    <summary>Invoice / Buyer details</summary>
    <div class="form-grid invoice-form">
      <div class="field"><label>Buyer / patient name</label><input id="buyerName" value="${esc(saleDraft.buyerName||'')}" placeholder="${p?esc(p.name):'Optional'}" oninput="saleDraft.buyerName=this.value"></div>
      <div class="field"><label>Buyer TIN</label><input id="buyerTin" value="${esc(saleDraft.buyerTin||'')}" placeholder="If applicable" oninput="saleDraft.buyerTin=this.value"></div>
      <div class="field full"><label>Buyer business / billing address</label><input id="buyerAddress" value="${esc(saleDraft.buyerAddress||'')}" placeholder="If applicable" oninput="saleDraft.buyerAddress=this.value"></div>
      <div class="field"><label>Discount type</label><select id="discountType" onchange="changeDiscountType(this.value)">${['None','Senior Citizen','PWD','Custom'].map(x=>`<option ${saleDraft.discountType===x?'selected':''}>${x}</option>`).join('')}</select></div>
      <div class="field"><label>Discount ID / reference</label><input id="discountId" value="${esc(saleDraft.discountId||'')}" placeholder="SC/PWD ID or reference" oninput="saleDraft.discountId=this.value"></div>
      <div class="field"><label>Discount %</label><input id="discountPercent" type="number" min="0" max="100" step="0.01" value="${esc(saleDraft.discountPercent||'0')}" onchange="saleDraft.discountPercent=this.value;renderPOS()"></div>
      <div class="field full"><div class="notice blue">${suggested}<br><strong>Important:</strong> selecting Senior/PWD records the discount information only; this system does not decide legal eligibility or automatically reclassify items as VAT-exempt.</div></div>
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
  const birNotice=birMissing.length?`<div class="notice red bir-pos-warning"><strong>${entityLabel(entity)} is not yet configured for BIR production use.</strong> Missing admin setup: ${birMissing.map(esc).join(', ')}.</div>`:`<div class="notice blue bir-pos-warning"><strong>${entityLabel(entity)} BIR fields configured.</strong> Use in production only after the applicable registration/Permit to Use process is completed.</div>`;
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
  if((saleDraft.discountType==='Senior Citizen'||saleDraft.discountType==='PWD')&&!String(saleDraft.discountId||'').trim()){if(!confirm(`${saleDraft.discountType} discount selected without an ID/reference. Continue without an ID/reference? Only proceed when permitted by clinic policy.`))return}
  const isCash=saleDraft.payment==='Cash';const tendered=isCash?Number(saleDraft.tendered||0):sale.total;
  if(isCash&&tendered<sale.total)return alert(`Amount tendered is ${money(tendered)}. Please enter at least ${money(sale.total)}.`);
  const change=isCash?Math.max(0,tendered-sale.total):0;
  const items=structuredClone(cart).map(x=>({...x,taxClass:x.taxClass||sourceTaxClass(x)}));
  for(const line of items.filter(x=>x.kind==='Pharmacy'))db.inventory.find(i=>i.id===line.refId).qty-=line.qty;
  const id=nextId('TXN',db.transactions);const invoiceNo=nextInvoiceNumber(entity);
  const txn={id,uuid:newUuid(),entity,invoiceNo,invoiceLabel:c.invoiceLabel||'INVOICE',date:today(),time:new Date().toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'}),patientId:saleDraft.patientId||null,buyerName:saleDraft.buyerName||patientName(saleDraft.patientId),buyerTin:saleDraft.buyerTin||'',buyerAddress:saleDraft.buyerAddress||'',discountType:saleDraft.discountType||'None',discountId:saleDraft.discountId||'',discountPercent:Number(saleDraft.discountPercent||0),subtotal:sale.subtotal,discountAmount:sale.discountAmount,taxSummary:{vatableSales:sale.vatableSales,vatAmount:sale.vatAmount,vatExemptSales:sale.vatExemptSales,zeroRatedSales:sale.zeroRatedSales,nonVatSales:sale.nonVatSales,taxType:c.taxType,vatRate:Number(c.vatRate||12)},payment:saleDraft.payment,total:sale.total,tendered,change,operator:activeRole,items,birConfiguredAtIssue:isBirConfigured(entity)};
  db.transactions.unshift(txn);cart=[];saleDraft={entity:(activeRole==='Pharmacist'?'pharmacy':'clinic'),patientId:'',payment:'Cash',tendered:'',buyerName:'',buyerTin:'',buyerAddress:'',discountType:'None',discountId:'',discountPercent:'0'};save(`Completed transaction ${id}; invoice ${invoiceNo} (${money(sale.total)})`);showReceipt(txn);
};
function receiptBody(t){
  const entity=t.entity||'clinic';const clinic=entityCfg(entity);const patient=t.buyerName||(t.patientId?patientName(t.patientId):'Walk-in');const tendered=Number.isFinite(Number(t.tendered))?Number(t.tendered):Number(t.total||0);const change=Number.isFinite(Number(t.change))?Number(t.change):0;const tax=t.taxSummary||{};const configured=(t.birConfiguredAtIssue??isBirConfigured(entity))&&!!t.invoiceNo;const invoiceLabel=t.invoiceLabel||clinic.invoiceLabel||'INVOICE';const taxLine=String(clinic.taxType||'NON-VAT').toUpperCase()==='VAT'?'VAT REG TIN':'NON-VAT REG TIN';
  const taxRows=String(tax.taxType||clinic.taxType).toUpperCase()==='VAT'?`<div><span>VATable Sales</span><strong>${money(tax.vatableSales||0)}</strong></div><div><span>VAT (${Number(tax.vatRate||clinic.vatRate||12)}%)</span><strong>${money(tax.vatAmount||0)}</strong></div><div><span>VAT-Exempt Sales</span><strong>${money(tax.vatExemptSales||0)}</strong></div><div><span>Zero-Rated Sales</span><strong>${money(tax.zeroRatedSales||0)}</strong></div>${(tax.nonVatSales||0)?`<div><span>Other Non-VAT</span><strong>${money(tax.nonVatSales||0)}</strong></div>`:''}`:`<div><span>Non-VAT Sales</span><strong>${money(tax.nonVatSales??t.total)}</strong></div>`;
  return `<div class="thermal-receipt" id="thermalReceipt">${!configured?'<div class="invoice-demo-mark">NOT CONFIGURED FOR BIR PRODUCTION USE</div>':''}<div class="receipt-brand">${entity==='clinic'?'<img src="accu-logo.jpeg" alt="ACCU">':''}<h3>${esc(clinic.name||entityLabel(entity))}</h3>${clinic.tradeName&&clinic.tradeName!==clinic.name?`<p>${esc(clinic.tradeName)}</p>`:''}${clinic.address?`<p>${esc(clinic.address)}</p>`:''}${clinic.contact?`<p>${esc(clinic.contact)}</p>`:''}${clinic.tin?`<p><strong>${taxLine}:</strong> ${esc(clinic.tin)}${clinic.branchCode?`-${esc(clinic.branchCode)}`:''}</p>`:''}<p class="invoice-title"><strong>${esc(invoiceLabel)}</strong></p><p><strong>${t.invoiceNo?`No. ${esc(t.invoiceNo)}`:`LEGACY REF. ${esc(t.id)}`}</strong></p></div><div class="receipt-rule"></div><div class="receipt-meta"><div><span>Date</span><strong>${esc(t.date)} ${esc(t.time||'')}</strong></div><div><span>Internal Ref.</span><strong>${esc(t.id)}</strong></div><div><span>Buyer / Patient</span><strong>${esc(patient)}</strong></div>${t.buyerTin?`<div><span>Buyer TIN</span><strong>${esc(t.buyerTin)}</strong></div>`:''}${t.buyerAddress?`<div><span>Buyer Address</span><strong>${esc(t.buyerAddress)}</strong></div>`:''}<div><span>Processed by</span><strong>${esc(t.operator||'Clinic Staff')}</strong></div></div><div class="receipt-rule"></div><div class="receipt-items">${t.items.map(i=>`<div class="receipt-item"><div><strong>${esc(i.name)}</strong><small>${i.qty} × ${money(i.price)}${String(tax.taxType||clinic.taxType).toUpperCase()==='VAT'?` · ${esc(i.taxClass||'Unclassified')}`:''}</small></div><strong>${money(i.price*i.qty)}</strong></div>`).join('')}</div><div class="receipt-rule"></div><div class="receipt-totals"><div><span>Subtotal</span><strong>${money(t.subtotal??(Number(t.total||0)+Number(t.discountAmount||0)))}</strong></div>${Number(t.discountAmount||0)>0?`<div><span>${esc(t.discountType||'Discount')} ${Number(t.discountPercent||0)}%</span><strong>− ${money(t.discountAmount)}</strong></div>${t.discountId?`<div><span>Discount ID</span><strong>${esc(t.discountId)}</strong></div>`:''}`:''}${taxRows}<div class="grand-total"><span>TOTAL</span><strong>${money(t.total)}</strong></div><div><span>Payment</span><strong>${esc(t.payment)}</strong></div>${t.payment==='Cash'?`<div><span>Cash tendered</span><strong>${money(tendered)}</strong></div><div class="change"><span>Change</span><strong>${money(change)}</strong></div>`:''}</div><div class="receipt-rule"></div>${(clinic.permitNo||clinic.min||clinic.machineSerial)?`<div class="receipt-bir-meta">${clinic.permitNo?`<p><strong>Permit to Use:</strong> ${esc(clinic.permitNo)}${clinic.permitDate?` · ${esc(clinic.permitDate)}`:''}</p>`:''}${clinic.min?`<p><strong>MIN:</strong> ${esc(clinic.min)}</p>`:''}${clinic.machineSerial?`<p><strong>Terminal / Machine S/N:</strong> ${esc(clinic.machineSerial)}</p>`:''}</div>`:''}<p class="receipt-footer">${esc(clinic.receiptFooter||'Thank you for choosing ACCU.')}</p><p class="receipt-copy">${t.reprint?'REPRINTED COPY':''}</p></div>`;
}
function showReceipt(t){modal(t.reprint?'Reprint Invoice':'Transaction Complete · Invoice Generated',`${receiptBody(t)}<div class="receipt-print-note no-print"><strong>80 mm invoice ready.</strong><br>The invoice number is preserved on reprints. Choose the installed thermal printer in the browser print dialog. BIR authorization and Permit to Use remain separate regulatory requirements.</div>`,null,'Close',`<button class="secondary no-print" onclick="printReceipt('${t.id}',${t.reprint?'true':'false'})">${t.reprint?'Print Reprinted Invoice':'Print 80mm Invoice'}</button>`)}
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
    ${!isBirConfigured(entity)?'<div class="invoice-demo-mark">NOT CONFIGURED FOR BIR PRODUCTION USE</div>':''}
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
  if(!['Administrator','Cashier'].includes(activeRole))return alert('Only Administrator or Cashier can generate a supplementary payment receipt for the ${activeRole} role.');
  const t=db.transactions.find(x=>x.id===id);if(!t)return alert('Transaction not found.');
  if(!t.invoiceNo)return alert('This legacy transaction does not have an invoice number. Generate payment receipts only for transactions issued through the configured Invoice workflow.');
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
  const pharmacyGross=pharmacyRows.reduce((a,b)=>a+b.total,0);
  const relevantReturns=(db.pharmacyReturns||[]).filter(r=>!cashier||String(r.createdAt||'').slice(0,10)===today());
  const returnAdjustments=relevantReturns.reduce((a,b)=>a+Number(b.refundAmount||0),0);
  const pharmacyRev=pharmacyGross-returnAdjustments;
  const total=clinicRev+pharmacyRev;
  const cards=`${stat(cashier?'Today · Clinic / Lab':'Clinic / Lab Revenue',money(clinicRev),'Separate clinic/laboratory entity')}${stat(cashier?'Today · Pharmacy':'Pharmacy Revenue',money(pharmacyRev),'Separate pharmacy entity')}${stat('Pharmacy Returns',money(returnAdjustments),'Refund / credit adjustments')}${stat('Net Combined View',money(total),'Dashboard view only; entities remain separate')}`;
  document.getElementById('reports').innerHTML=`<div class="grid grid-4">${cards}</div><div class="notice blue" style="margin-top:16px"><strong>Entity separation:</strong> Pharmacy sales are tracked independently from clinic/laboratory sales. Do not treat the combined dashboard total as a single-entity invoice or tax report.</div><div class="section-head"><h2>${cashier?'Today’s Transaction Ledger':'Transaction Ledger'}</h2>${can('export')?'<div class="inline-actions"><button class="secondary" onclick="exportCSV()">Export CSV</button><button class="secondary" onclick="exportStructuredJSON()">Structured JSON</button></div>':''}</div>${transactionsTable(rows)}`;
}
function transactionsTable(rows){return `<div class="table-wrap"><table class="responsive-table"><thead><tr><th>Entity</th><th>Invoice</th><th>Date</th><th>Buyer / Patient</th><th>Items</th><th>Payment</th><th>Total</th><th>Status / Actions</th></tr></thead><tbody>${rows.map(t=>`<tr><td data-label="Entity"><span class="badge ${t.entity==='pharmacy'?'green':'blue'}">${esc(entityLabel(t.entity||'clinic'))}</span></td><td data-label="Invoice"><strong>${t.invoiceNo?esc(t.invoiceNo):'<span class="badge amber">Legacy / no invoice</span>'}</strong><br><span class="muted">${esc(t.id)}</span></td><td data-label="Date">${t.date}<br><span class="muted">${t.time||''}</span></td><td data-label="Buyer / Patient">${esc(t.buyerName||patientName(t.patientId))}</td><td data-label="Items">${t.items.map(i=>`${esc(i.name)} ×${i.qty}`).join('<br>')}</td><td data-label="Payment">${esc(t.payment)}</td><td data-label="Total"><strong>${money(t.total)}</strong></td><td data-label="Status / Actions"><div class="inline-actions">${t.returnStatus?`<span class="badge amber">${esc(t.returnStatus)}</span>`:''}<button class="small-btn" onclick="reprintReceipt('${t.id}')">Reprint Invoice</button>${t.paymentReceiptNo?`<button class="small-btn" onclick="reprintPaymentReceipt('${t.id}')">Payment Receipt</button>`:`<button class="small-btn" onclick="generatePaymentReceipt('${t.id}')">Payment Receipt</button>`}${t.entity==='pharmacy'&&can('pharmacyReturn')?`<button class="small-btn" onclick="openPharmacyReturnModal('${t.id}')">Return</button>`:''}</div></td></tr>`).join('')||'<tr><td colspan="8" class="empty">No transactions yet.</td></tr>'}</tbody></table></div>`}

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

function serviceCatalogPanelHtml(){
  const rows=db.services.map(s=>`<tr><td data-label="Service"><strong>${esc(s.name)}</strong><br><span class="muted">${esc(s.localCode||s.id)}</span></td><td data-label="Type"><span class="badge blue">${esc(s.type)}</span></td><td data-label="Price"><strong>${money(s.price)}</strong></td><td data-label="Standard Code">${s.standardCode?`${esc(s.standardCode)}<br><span class="muted">${esc(s.codeSystem||'')}</span>`:'<span class="muted">Not mapped</span>'}</td><td data-label="Action"><button class="small-btn" onclick="openServiceModal('${s.id}')">Edit</button></td></tr>`).join('');
  return `<div class="card" style="margin-bottom:16px"><div class="section-head"><div><h2>Service Catalog</h2><p class="muted" style="margin:5px 0 0">Configure consultation, laboratory and radiology services used in ordering and billing.</p></div><button class="primary" onclick="openServiceModal()">+ Add Service</button></div><div class="notice" style="margin-bottom:12px">Review starter services and prices before go-live. Radiology orders only show services classified as <strong>Radiology</strong>.</div><div class="table-wrap"><table class="responsive-table"><thead><tr><th>Service</th><th>Type</th><th>Price</th><th>Standard Code</th><th>Action</th></tr></thead><tbody>${rows||'<tr><td colspan="5" class="empty">No services configured.</td></tr>'}</tbody></table></div></div>`;
}
window.openServiceModal=function(id=''){
  if(!guard('manageServices'))return;const existing=id?db.services.find(x=>x.id===id):null;
  modal(existing?'Edit Service':'Add Service',`<div class="form-grid"><div class="field"><label>Service type</label><select id="svcType">${['Consultation','Laboratory','Radiology','Other'].map(x=>`<option ${existing?.type===x?'selected':''}>${x}</option>`).join('')}</select></div>${field('Service name','svcName','text',existing?.name||'')}${field('Price','svcPrice','number',existing?.price??0)}${field('Local code','svcLocalCode','text',existing?.localCode||existing?.id||'')}<div class="field"><label>Standard code system</label><select id="svcCodeSystem"><option value="" ${!existing?.codeSystem?'selected':''}>Unmapped / local only</option><option value="http://loinc.org" ${existing?.codeSystem==='http://loinc.org'?'selected':''}>LOINC</option><option value="http://snomed.info/sct" ${existing?.codeSystem==='http://snomed.info/sct'?'selected':''}>SNOMED CT</option></select></div>${field('Standard code','svcStandardCode','text',existing?.standardCode||'')}</div>`,()=>{const name=v('svcName');if(!name)return alert('Service name is required.');const price=Math.max(0,Number(v('svcPrice')||0));if(existing){existing.type=v('svcType');existing.name=name;existing.price=price;existing.localCode=v('svcLocalCode')||existing.id;existing.codeSystem=v('svcCodeSystem');existing.standardCode=v('svcStandardCode');save(`Updated service ${existing.name}`)}else{const sid=`SRV-${Date.now()}`;db.services.push({id:sid,uuid:newUuid(),localCode:v('svcLocalCode')||sid,type:v('svcType'),name,price,taxClass:'Unclassified',codeSystem:v('svcCodeSystem'),standardCode:v('svcStandardCode')});save(`Added service ${name}`)}closeModal()},existing?'Save Changes':'Add Service');
};

function staffAccountsPanelHtml(){
  if(!window.ACCUBackend?.configured){
    return `<div class="card" style="margin-bottom:16px"><h2>Staff User Accounts</h2><div class="notice blue">Connect Supabase to manage real staff accounts. Staff account management requires the connected Supabase backend.</div></div>`;
  }
  return `<div class="card" id="staffAccountsPanel" style="margin-bottom:16px">
    <div class="section-head">
      <div><h2>Staff User Accounts</h2><p class="muted" style="margin:5px 0 0">Create staff logins, assign roles, disable access, or issue a new temporary password.</p></div>
      <button class="primary" onclick="openCreateStaffModal()">+ Create Staff Account</button>
    </div>
    <div class="notice blue" style="margin-bottom:12px"><strong>Temporary password workflow:</strong> the administrator gives the initial password privately. On first sign-in, the staff member is blocked from clinic modules until they set their own password.</div>
    <div class="table-wrap"><table class="responsive-table">
      <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Password</th><th>Actions</th></tr></thead>
      <tbody id="staffAccountsBody"><tr><td colspan="6" class="muted">Loading staff accounts…</td></tr></tbody>
    </table></div>
  </div>`;
}
async function refreshStaffAccounts(){
  const body=document.getElementById('staffAccountsBody');
  if(!body || !window.ACCUBackend?.configured)return;
  try{
    staffProfiles=await window.ACCUBackend.listProfiles();
    const me=window.ACCUBackend.status.user?.id;
    body.innerHTML=staffProfiles.length?staffProfiles.map(p=>{
      const self=p.user_id===me;
      const roleOptions=Object.keys(ROLE_CONFIG).map(r=>`<option value="${esc(r)}" ${p.role===r?'selected':''}>${esc(r)}</option>`).join('');
      return `<tr>
        <td data-label="Name"><strong>${esc(p.full_name||'Unnamed user')}</strong>${self?'<br><span class="muted">Your account</span>':''}</td>
        <td data-label="Email">${esc(p.email||'—')}</td>
        <td data-label="Role"><select class="small-select" onchange="changeStaffRole('${p.user_id}',this.value)" ${self?'disabled':''}>${roleOptions}</select></td>
        <td data-label="Status"><span class="badge ${p.active?'green':'red'}">${p.active?'Active':'Disabled'}</span></td>
        <td data-label="Password">${p.must_change_password?'<span class="badge amber">Change required</span>':'<span class="badge green">Set by user</span>'}</td>
        <td data-label="Actions"><div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="secondary small-btn" onclick="openResetTempPassword('${p.user_id}')">Temp password</button>
          ${self?'<button class="ghost small-btn" onclick="openMyPasswordModal()">Change mine</button>':`<button class="ghost small-btn ${p.active?'danger':''}" onclick="toggleStaffActive('${p.user_id}',${!p.active})">${p.active?'Disable':'Enable'}</button>`}
        </div></td>
      </tr>`;
    }).join(''):`<tr><td colspan="6" class="muted">No staff accounts found.</td></tr>`;
  }catch(e){
    console.error(e);
    body.innerHTML=`<tr><td colspan="6"><div class="notice red">Unable to load staff accounts: ${esc(e.message||String(e))}</div></td></tr>`;
  }
}
window.openCreateStaffModal=function(){
  if(activeRole!=='Administrator')return alert('Administrator access required.');
  const roles=Object.keys(ROLE_CONFIG);
  modal('Create Staff Account',`
    <div class="form-grid">
      <div class="field full"><label>Full name</label><input id="staffFullName" autocomplete="name" placeholder="e.g. Maria Dela Cruz"></div>
      <div class="field full"><label>Email (used to sign in)</label><input id="staffEmail" type="email" autocomplete="off" placeholder="staff@example.com"></div>
      <div class="field full"><label>Role</label><select id="staffRole">${roles.map(r=>`<option>${esc(r)}</option>`).join('')}</select></div>
      <div class="field"><label>Temporary password</label><input id="staffTempPassword" type="password" autocomplete="new-password" minlength="10"></div>
      <div class="field"><label>Confirm temporary password</label><input id="staffTempPassword2" type="password" autocomplete="new-password" minlength="10"></div>
    </div>
    <div class="notice" style="margin-top:12px">Use at least 10 characters and send it privately. The password is sent directly to Supabase Auth and is not saved in the ACCU profile table.</div>
    <p id="staffCreateError" class="auth-error"></p>
  `,async()=>{
    const fullName=v('staffFullName'),email=v('staffEmail'),role=v('staffRole');
    const p1=document.getElementById('staffTempPassword').value,p2=document.getElementById('staffTempPassword2').value;
    const err=document.getElementById('staffCreateError');err.textContent='';
    if(!fullName||!email)return err.textContent='Full name and email are required.';
    if(p1.length<10)return err.textContent='Temporary password must be at least 10 characters.';
    if(p1!==p2)return err.textContent='Passwords do not match.';
    const btn=document.getElementById('modalSave');btn.disabled=true;btn.textContent='Creating…';
    try{
      await window.ACCUBackend.createStaffUser({email,fullName,role,temporaryPassword:p1});
      closeModal();await refreshStaffAccounts();
      alert(`Account created for ${fullName}. Give the temporary password privately; it will not be shown again.`);
    }catch(e){err.textContent=e.message||'Unable to create staff account.';btn.disabled=false;btn.textContent='Create Account'}
  },'Create Account');
};
window.openResetTempPassword=function(userId){
  if(activeRole!=='Administrator')return alert('Administrator access required.');
  const profile=staffProfiles.find(p=>p.user_id===userId);
  const name=profile?.full_name||profile?.email||'this staff account';
  modal('Issue Temporary Password',`
    <p class="muted">This will replace the current password for <strong>${esc(name)}</strong>. At the next sign-in, the user must create a new personal password before accessing clinic data.</p>
    <div class="form-grid">
      <div class="field"><label>New temporary password</label><input id="resetTemp1" type="password" autocomplete="new-password" minlength="10"></div>
      <div class="field"><label>Confirm</label><input id="resetTemp2" type="password" autocomplete="new-password" minlength="10"></div>
    </div>
    <p id="staffResetError" class="auth-error"></p>
  `,async()=>{
    const p1=document.getElementById('resetTemp1').value,p2=document.getElementById('resetTemp2').value;
    const err=document.getElementById('staffResetError');err.textContent='';
    if(p1.length<10)return err.textContent='Temporary password must be at least 10 characters.';
    if(p1!==p2)return err.textContent='Passwords do not match.';
    const btn=document.getElementById('modalSave');btn.disabled=true;btn.textContent='Resetting…';
    try{
      await window.ACCUBackend.resetStaffPassword(userId,p1);
      closeModal();await refreshStaffAccounts();
      alert('Temporary password issued. The staff member will be required to change it on next sign-in.');
    }catch(e){err.textContent=e.message||'Unable to reset password.';btn.disabled=false;btn.textContent='Issue Temporary Password'}
  },'Issue Temporary Password');
};
window.toggleStaffActive=async function(userId,active){
  if(activeRole!=='Administrator')return alert('Administrator access required.');
  if(userId===window.ACCUBackend.status.user?.id)return alert('You cannot disable your own account here.');
  if(!confirm(`${active?'Enable':'Disable'} this staff account?`))return;
  try{await window.ACCUBackend.updateStaffProfile(userId,{active});await refreshStaffAccounts()}
  catch(e){alert(e.message||'Unable to update account.')}
};
window.changeStaffRole=async function(userId,role){
  if(activeRole!=='Administrator')return alert('Administrator access required.');
  if(userId===window.ACCUBackend.status.user?.id)return refreshStaffAccounts();
  try{await window.ACCUBackend.updateStaffProfile(userId,{role});await refreshStaffAccounts()}
  catch(e){alert(e.message||'Unable to update role.');await refreshStaffAccounts()}
};
window.openMyPasswordModal=function(){
  if(!window.ACCUBackend?.configured)return alert('Password management is available in connected mode.');
  modal('Change My Password',`
    <div class="form-grid">
      <div class="field full"><label>Current password</label><input id="myCurrentPassword" type="password" autocomplete="current-password"></div>
      <div class="field full"><label>New password</label><input id="myNewPassword1" type="password" autocomplete="new-password" minlength="10"></div>
      <div class="field full"><label>Confirm new password</label><input id="myNewPassword2" type="password" autocomplete="new-password" minlength="10"></div>
    </div>
    <p id="myPasswordError" class="auth-error"></p>
  `,async()=>{
    const current=document.getElementById('myCurrentPassword').value;
    const p1=document.getElementById('myNewPassword1').value,p2=document.getElementById('myNewPassword2').value;
    const err=document.getElementById('myPasswordError');err.textContent='';
    if(p1.length<10)return err.textContent='Password must be at least 10 characters.';
    if(p1!==p2)return err.textContent='Passwords do not match.';
    const btn=document.getElementById('modalSave');btn.disabled=true;btn.textContent='Updating…';
    try{await window.ACCUBackend.changeOwnPassword(p1,current);closeModal();alert('Password updated successfully.')}
    catch(e){err.textContent=e.message||'Unable to change password.';btn.disabled=false;btn.textContent='Update Password'}
  },'Update Password');
};

function renderSettings(){
  if(!canView('settings'))return;const c=entityCfg('clinic');const p=entityCfg('pharmacy');const missing=birSetupMissing('clinic');const pmissing=birSetupMissing('pharmacy');const lastIssued=db.transactions.find(t=>t.invoiceNo)?.invoiceNo||'None yet';
  document.getElementById('settings').innerHTML=`<div class="grid grid-2"><div class="card"><h2>BIR Readiness</h2><p class="muted">The system can be configured to generate an invoice with the clinic's registered details and a sequential invoice number. This screen does <strong>not</strong> represent BIR approval, accreditation or a Permit to Use.</p><div class="bir-readiness ${missing.length?'not-ready':'ready'}"><strong>${missing.length?'Setup incomplete':'Core invoice fields configured'}</strong><span>${missing.length?`Missing: ${missing.map(esc).join(', ')}`:'Verify the entries against ACCU’s BIR Certificate of Registration and actual Permit to Use before production.'}</span></div><div class="summary-row"><span>Next invoice</span><strong>${esc(invoiceNumberFrom(c.invoiceNextNumber||1))}</strong></div><div class="summary-row"><span>Last issued</span><strong>${esc(lastIssued)}</strong></div><div class="summary-row"><span>Tax status</span><strong>${esc(c.taxType||'NON-VAT')}</strong></div><div class="notice blue" style="margin-top:12px">BIR’s EOPT rules use <strong>Invoice</strong> as the principal sales document. Official/Payment/Collection Receipts are supplementary documents for collection/payment scenarios, depending on the transaction and the clinic’s accounting setup.</div></div><div class="card"><h2>Registered Taxpayer Details</h2><div class="form-grid"><div class="field full"><label>Registered name</label><input id="cfgClinicName" value="${esc(c.name||'')}" placeholder="As shown on BIR registration"></div><div class="field full"><label>Trade name</label><input id="cfgTradeName" value="${esc(c.tradeName||'')}" placeholder="If applicable"></div><div class="field full"><label>Registered business address</label><input id="cfgAddress" value="${esc(c.address||'')}" placeholder="As registered with BIR"></div><div class="field"><label>Contact</label><input id="cfgContact" value="${esc(c.contact||'')}" placeholder="Phone / mobile"></div><div class="field"><label>TIN</label><input id="cfgTin" value="${esc(c.tin||'')}" placeholder="Do not guess"></div><div class="field"><label>Branch code</label><input id="cfgBranchCode" value="${esc(c.branchCode||'')}" placeholder="e.g. 00000"></div><div class="field"><label>Tax status</label><select id="cfgTaxType"><option ${c.taxType==='NON-VAT'?'selected':''}>NON-VAT</option><option ${c.taxType==='VAT'?'selected':''}>VAT</option></select></div><div class="field"><label>VAT rate %</label><input id="cfgVatRate" type="number" min="0" max="100" step="0.01" value="${esc(c.vatRate??12)}"></div></div></div></div><div class="grid grid-2" style="margin-top:16px"><div class="card"><h2>Invoice Series</h2><p class="muted">Use the series actually approved/registered for ACCU. Changing the next number after live issuance can create duplicate or skipped invoice numbers.</p><div class="form-grid"><div class="field"><label>Invoice label</label><select id="cfgInvoiceLabel">${['INVOICE','SALES INVOICE','CASH INVOICE','SERVICE INVOICE'].map(x=>`<option ${c.invoiceLabel===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Prefix</label><input id="cfgInvoicePrefix" value="${esc(c.invoicePrefix||'')}"></div><div class="field"><label>Number of digits</label><input id="cfgInvoiceDigits" type="number" min="1" max="12" value="${esc(c.invoiceDigits||7)}"></div><div class="field"><label>Next serial number</label><input id="cfgInvoiceNext" type="number" min="1" value="${esc(c.invoiceNextNumber||1)}"></div><div class="field"><label>Payment receipt prefix</label><input id="cfgPaymentReceiptPrefix" value="${esc(c.paymentReceiptPrefix||'PR-')}"></div><div class="field"><label>Payment receipt digits</label><input id="cfgPaymentReceiptDigits" type="number" min="1" max="12" value="${esc(c.paymentReceiptDigits||7)}"></div><div class="field"><label>Next payment receipt no.</label><input id="cfgPaymentReceiptNext" type="number" min="1" value="${esc(c.paymentReceiptNextNumber||1)}"></div><div class="field full"><label>Invoice footer</label><input id="cfgFooter" value="${esc(c.receiptFooter||'')}"></div></div></div><div class="card"><h2>POS / Permit Details</h2><p class="muted">Enter only details from ACCU’s actual BIR authorization/registration documents.</p><div class="form-grid"><div class="field full"><label>Permit to Use (PTU) number</label><input id="cfgPermitNo" value="${esc(c.permitNo||'')}" placeholder="Leave blank until issued"></div><div class="field"><label>Permit date</label><input id="cfgPermitDate" type="date" value="${esc(c.permitDate||'')}"></div><div class="field"><label>MIN / machine identification no.</label><input id="cfgMin" value="${esc(c.min||'')}" placeholder="If applicable"></div><div class="field full"><label>Terminal / machine serial no.</label><input id="cfgMachineSerial" value="${esc(c.machineSerial||'')}" placeholder="If applicable"></div></div></div></div><div class="card" style="margin-top:16px"><div class="section-head"><div><h2>Separate Pharmacy Entity</h2><p class="muted" style="margin:5px 0 0">Pharmacy inventory, sales and invoice series are separate from the clinic/laboratory entity.</p></div></div><div class="bir-readiness ${pmissing.length?'not-ready':'ready'}"><strong>${pmissing.length?'Pharmacy setup incomplete':'Pharmacy core invoice fields configured'}</strong><span>${pmissing.length?`Missing: ${pmissing.map(esc).join(', ')}`:'Verify against the pharmacy entity’s own BIR registration and authorization documents.'}</span></div><div class="form-grid"><div class="field full"><label>Pharmacy registered name</label><input id="phName" value="${esc(p.name||'')}" placeholder="Do not guess — use registered name"></div><div class="field full"><label>Trade name</label><input id="phTradeName" value="${esc(p.tradeName||'')}"></div><div class="field full"><label>Registered address</label><input id="phAddress" value="${esc(p.address||'')}"></div><div class="field"><label>Contact</label><input id="phContact" value="${esc(p.contact||'')}"></div><div class="field"><label>TIN</label><input id="phTin" value="${esc(p.tin||'')}"></div><div class="field"><label>Branch code</label><input id="phBranchCode" value="${esc(p.branchCode||'')}"></div><div class="field"><label>Tax status</label><select id="phTaxType"><option ${p.taxType==='NON-VAT'?'selected':''}>NON-VAT</option><option ${p.taxType==='VAT'?'selected':''}>VAT</option></select></div><div class="field"><label>VAT rate %</label><input id="phVatRate" type="number" value="${esc(p.vatRate??12)}"></div><div class="field"><label>Invoice label</label><select id="phInvoiceLabel">${['INVOICE','SALES INVOICE','CASH INVOICE','SERVICE INVOICE'].map(x=>`<option ${p.invoiceLabel===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Invoice prefix</label><input id="phInvoicePrefix" value="${esc(p.invoicePrefix||'PH-')}"></div><div class="field"><label>Invoice digits</label><input id="phInvoiceDigits" type="number" min="1" max="12" value="${esc(p.invoiceDigits||7)}"></div><div class="field"><label>Next invoice no.</label><input id="phInvoiceNext" type="number" min="1" value="${esc(p.invoiceNextNumber||1)}"></div><div class="field full"><label>Permit to Use (PTU) no.</label><input id="phPermitNo" value="${esc(p.permitNo||'')}"></div><div class="field"><label>Permit date</label><input id="phPermitDate" type="date" value="${esc(p.permitDate||'')}"></div><div class="field"><label>MIN</label><input id="phMin" value="${esc(p.min||'')}"></div><div class="field full"><label>Terminal / Machine S/N</label><input id="phMachineSerial" value="${esc(p.machineSerial||'')}"></div><div class="field full"><label>Invoice footer</label><input id="phFooter" value="${esc(p.receiptFooter||'Thank you.')}"></div></div></div><div class="card" style="margin-top:16px"><div class="section-head"><div><h2>Tax Classification</h2><p class="muted" style="margin:5px 0 0">For VAT mode, classify every billed service/medicine before checkout. Do not automatically infer medical/pharmacy tax treatment; have ACCU’s accountant/bookkeeper validate the classifications.</p></div></div>${renderTaxMatrix()}</div><div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="primary" onclick="saveReceiptConfig()">Save BIR / Invoice Configuration</button></div><div class="grid grid-2" style="margin-top:16px"><div class="card"><h2>Electronic Invoice Readiness</h2><p class="muted">The Reports module can export structured JSON containing seller, buyer, item, discount, tax and payment fields. It is an internal interoperability export only.</p><div class="notice blue">It is <strong>not</strong> a BIR EIS-certified payload, does not transmit sales to BIR, and does not constitute a Permit to Transmit. Production e-invoicing must follow the BIR requirements applicable to ACCU’s taxpayer classification and system.</div></div><div class="card"><h2>Thermal Printer Setup</h2><p class="muted">The System uses the browser print dialog. Install the printer driver on the cashier computer, select the 80 mm receipt paper size, set margins to none/minimum, and disable browser headers/footers.</p><div class="notice">For silent/direct printing, auto-cut and cash-drawer commands, silent/direct printing can be enabled through an ESC/POS print bridge or dedicated desktop POS client.</div></div><div class="card"><h2>Deployment Security</h2><p class="muted">Connected mode uses Supabase Auth, PostgreSQL and Row Level Security. Connected mode uses authenticated backend storage and does not persist the clinical workspace to browser localStorage. Configure backups, retention, privacy controls and deployment monitoring before go-live.</p><div class="notice red">Before go-live, complete privacy review, backup/restore testing, concurrency testing, device hardening and validation of invoice issuance workflows.</div></div></div><div class="section-head"><h2>Audit Log</h2></div><div class="table-wrap"><table class="responsive-table"><thead><tr><th>Timestamp</th><th>User / Role</th><th>Action</th></tr></thead><tbody>${db.audit.slice(0,100).map(a=>`<tr><td data-label="Timestamp">${new Date(a.ts).toLocaleString('en-PH')}</td><td data-label="Role">${esc(a.user)}</td><td data-label="Action">${esc(a.action)}</td></tr>`).join('')}</tbody></table></div>`;
  document.getElementById("settings").insertAdjacentHTML("afterbegin",serviceCatalogPanelHtml());
  document.getElementById("settings").insertAdjacentHTML("afterbegin",staffAccountsPanelHtml());
  if(window.ACCUBackend?.configured)setTimeout(refreshStaffAccounts,0);
}
window.saveReceiptConfig=function(){
  if(activeRole!=='Administrator')return alert('Administrator access required.');const next=Math.max(1,Number(v('cfgInvoiceNext')||1));const prefix=v('cfgInvoicePrefix');const digits=Math.max(1,Math.min(12,Number(v('cfgInvoiceDigits')||7)));const candidate=`${prefix}${String(next).padStart(digits,'0')}`;if(db.transactions.some(t=>t.invoiceNo===candidate))return alert(`Invoice ${candidate} already exists. Choose the next unused serial number.`);const prPrefix=v('cfgPaymentReceiptPrefix')||'PR-';const prDigits=Math.max(1,Math.min(12,Number(v('cfgPaymentReceiptDigits')||7)));const prNext=Math.max(1,Number(v('cfgPaymentReceiptNext')||1));const prCandidate=`${prPrefix}${String(prNext).padStart(prDigits,'0')}`;if(db.transactions.some(t=>t.paymentReceiptNo===prCandidate))return alert(`Payment Receipt ${prCandidate} already exists. Choose the next unused serial number.`);
  db.clinic={...entityCfg('clinic'),name:v('cfgClinicName')||'ACCU Laboratory and Diagnostic Center',tradeName:v('cfgTradeName'),address:v('cfgAddress'),contact:v('cfgContact'),tin:v('cfgTin'),branchCode:v('cfgBranchCode'),taxType:v('cfgTaxType')||'NON-VAT',vatRate:Math.max(0,Number(v('cfgVatRate')||12)),invoiceLabel:v('cfgInvoiceLabel')||'INVOICE',invoicePrefix:prefix,invoiceDigits:digits,invoiceNextNumber:next,paymentReceiptPrefix:prPrefix,paymentReceiptDigits:prDigits,paymentReceiptNextNumber:prNext,permitNo:v('cfgPermitNo'),permitDate:v('cfgPermitDate'),min:v('cfgMin'),machineSerial:v('cfgMachineSerial'),receiptFooter:v('cfgFooter')||'Thank you for choosing ACCU.'};
  const phNext=Math.max(1,Number(v('phInvoiceNext')||1)),phPrefix=v('phInvoicePrefix')||'PH-',phDigits=Math.max(1,Math.min(12,Number(v('phInvoiceDigits')||7)));const phCandidate=`${phPrefix}${String(phNext).padStart(phDigits,'0')}`;if(db.transactions.some(t=>t.entity==='pharmacy'&&t.invoiceNo===phCandidate))return alert(`Pharmacy invoice ${phCandidate} already exists. Choose the next unused serial number.`);
  db.pharmacyEntity={...entityCfg('pharmacy'),name:v('phName'),tradeName:v('phTradeName'),address:v('phAddress'),contact:v('phContact'),tin:v('phTin'),branchCode:v('phBranchCode'),taxType:v('phTaxType')||'NON-VAT',vatRate:Math.max(0,Number(v('phVatRate')||12)),invoiceLabel:v('phInvoiceLabel')||'INVOICE',invoicePrefix:phPrefix,invoiceDigits:phDigits,invoiceNextNumber:phNext,permitNo:v('phPermitNo'),permitDate:v('phPermitDate'),min:v('phMin'),machineSerial:v('phMachineSerial'),receiptFooter:v('phFooter')||'Thank you.'};save('Updated separate clinic/lab and pharmacy entity invoice configuration');alert('Entity configurations saved. Verify production values against each entity’s own BIR registration and Permit to Use documents.');
};


function fhirRef(type,id){return `${type}/${id}`}
function coding(system,code,display){return code?{coding:[{system,code,display}]}:{text:display||''}}
function fhirPatient(p){return {resourceType:'Patient',id:p.uuid,identifier:[{system:'urn:accu:patient-id',value:p.id},...(p.identifiers||[]).filter(x=>x.value&&x.value!==p.id)],name:[{text:p.name}],gender:p.sex==='M'?'male':p.sex==='F'?'female':'unknown',...(p.dob?{birthDate:p.dob}:{}),...(p.phone?{telecom:[{system:'phone',value:p.phone}]}:{}),...(p.address?{address:[{text:p.address}]}:{})}}
function fhirOrganization(entity='clinic'){const c=entityCfg(entity);return {resourceType:'Organization',id:c.uuid,identifier:[...(c.tin?[{system:'urn:philippines:bir:tin',value:c.tin+(c.branchCode?`-${c.branchCode}`:'')}]:[])],active:true,name:c.name||entityLabel(entity),alias:c.tradeName&&c.tradeName!==c.name?[c.tradeName]:undefined,telecom:c.contact?[{system:'phone',value:c.contact}]:undefined,address:c.address?[{text:c.address}]:undefined}}
function fhirPractitioner(pr){return {resourceType:'Practitioner',id:pr.uuid,identifier:[{system:'urn:accu:practitioner-id',value:pr.id},...(pr.licenseNo?[{system:'urn:philippines:professional-license',value:pr.licenseNo}]:[])],active:true,name:[{text:pr.name}]}}
function fhirEncounter(c){const p=db.patients.find(x=>x.id===c.patientId);const pr=db.practitioners.find(x=>x.id===c.practitionerId)||db.practitioners.find(x=>x.name===c.doctor);return {resourceType:'Encounter',id:c.uuid,status:c.status==='Completed'?'finished':'in-progress',class:{system:'http://terminology.hl7.org/CodeSystem/v3-ActCode',code:'AMB',display:'ambulatory'},subject:p?{reference:fhirRef('Patient',p.uuid),display:p.name}:undefined,participant:pr?[{individual:{reference:fhirRef('Practitioner',pr.uuid),display:pr.name}}]:undefined,period:{start:`${c.date}T08:00:00+08:00`},reasonCode:c.chief?[{text:c.chief}]:undefined,diagnosis:c.assessment?[{condition:{display:c.assessment},use:c.diagnosisCode?coding(c.diagnosisCodeSystem,c.diagnosisCode,c.assessment):undefined}]:undefined}}
function fhirServiceRequests(o){const p=db.patients.find(x=>x.id===o.patientId);return (o.serviceIds?.length?o.serviceIds.map(id=>db.services.find(s=>s.id===id)).filter(Boolean):(o.tests||[]).map(name=>db.services.find(s=>s.name===name)).filter(Boolean)).map((svc,i)=>({resourceType:'ServiceRequest',id:`${o.uuid}-${i+1}`,status:o.status==='Released'?'completed':'active',intent:'order',code:svc.standardCode?coding(svc.codeSystem||'http://loinc.org',svc.standardCode,svc.name):{text:svc.name},subject:p?{reference:fhirRef('Patient',p.uuid),display:p.name}:undefined,authoredOn:o.date,identifier:[{system:'urn:accu:lab-order',value:o.id}],performer:[{reference:fhirRef('Organization',entityCfg('clinic').uuid),display:entityCfg('clinic').name}] }))}
function fhirObservations(o){const p=db.patients.find(x=>x.id===o.patientId);return (o.resultComponents||[]).map((r,i)=>{const numeric=r.value!==''&&!Number.isNaN(Number(r.value));const obs={resourceType:'Observation',id:r.uuid||`${o.uuid}-obs-${i+1}`,status:o.status==='Released'?'final':'preliminary',code:r.code?coding(r.codeSystem||'http://loinc.org',r.code,r.name):{text:r.name||`Result ${i+1}`},subject:p?{reference:fhirRef('Patient',p.uuid),display:p.name}:undefined,effectiveDateTime:`${o.date}T08:00:00+08:00`,identifier:[{system:'urn:accu:lab-order',value:o.id}]};if(numeric)obs.valueQuantity={value:Number(r.value),...(r.unit?{unit:r.unit,system:'http://unitsofmeasure.org',code:r.unit}:{} )};else if(r.value)obs.valueString=r.value;if(r.low||r.high)obs.referenceRange=[{...(r.low?{low:{value:Number(r.low),unit:r.unit||undefined}}:{}),...(r.high?{high:{value:Number(r.high),unit:r.unit||undefined}}:{})}];if(r.flag)obs.interpretation=[{text:r.flag}];return obs})}
function fhirDiagnosticReport(o,obs,srs){const p=db.patients.find(x=>x.id===o.patientId);return {resourceType:'DiagnosticReport',id:o.uuid,status:o.status==='Released'?'final':'partial',code:{text:(o.tests||[]).join(', ')||'Laboratory report'},subject:p?{reference:fhirRef('Patient',p.uuid),display:p.name}:undefined,basedOn:srs.map(x=>({reference:fhirRef('ServiceRequest',x.id)})),effectiveDateTime:`${o.date}T08:00:00+08:00`,result:obs.map(x=>({reference:fhirRef('Observation',x.id)})),conclusion:o.resultNote||undefined}}
function fhirMedication(m){return {resourceType:'Medication',id:m.uuid,identifier:[{system:'urn:accu:medication-id',value:m.localCode||m.id}],code:m.standardCode?coding(m.standardCodeSystem||'urn:accu:medication-code',m.standardCode,`${m.generic} ${m.strength}`):{text:`${m.generic} ${m.strength}${m.brand?` (${m.brand})`:''}`},form:m.form?{text:m.form}:undefined,batch:{lotNumber:m.batch||undefined,expirationDate:m.expiry||undefined}}}
function buildPatientBundle(patientId){const p=db.patients.find(x=>x.id===patientId);if(!p)return null;const resources=[fhirPatient(p),fhirOrganization('clinic'),fhirOrganization('pharmacy')];const seen=new Set(resources.map(r=>`${r.resourceType}/${r.id}`));const add=r=>{if(r&&!seen.has(`${r.resourceType}/${r.id}`)){resources.push(r);seen.add(`${r.resourceType}/${r.id}`)}};db.consultations.filter(c=>c.patientId===patientId).forEach(c=>{const pr=db.practitioners.find(x=>x.id===c.practitionerId)||db.practitioners.find(x=>x.name===c.doctor);if(pr)add(fhirPractitioner(pr));add(fhirEncounter(c))});db.labOrders.filter(o=>o.patientId===patientId).forEach(o=>{const srs=fhirServiceRequests(o);srs.forEach(add);const obs=fhirObservations(o);obs.forEach(add);add(fhirDiagnosticReport(o,obs,srs))});db.radiologyOrders.filter(o=>o.patientId===patientId).forEach(o=>{(o.serviceIds||[]).map(id=>db.services.find(x=>x.id===id)).filter(Boolean).forEach((svc,i)=>add({resourceType:'ServiceRequest',id:`${o.uuid}-rad-${i+1}`,status:o.status==='Final'?'completed':'active',intent:'order',code:svc.standardCode?coding(svc.codeSystem||'http://loinc.org',svc.standardCode,svc.name):{text:svc.name},subject:{reference:fhirRef('Patient',p.uuid),display:p.name},authoredOn:o.date,identifier:[{system:'urn:accu:radiology-order',value:o.id}]}));if(o.status==='Final')add({resourceType:'DiagnosticReport',id:o.uuid,status:'final',code:{text:(o.tests||[]).join(', ')||'Radiology report'},subject:{reference:fhirRef('Patient',p.uuid),display:p.name},effectiveDateTime:o.reportDate||o.date,conclusion:o.impression||'',presentedForm:o.findings?[{contentType:'text/plain',data:btoa(unescape(encodeURIComponent(o.findings)))}]:undefined})});const meds=new Set;db.transactions.filter(t=>t.entity==='pharmacy'&&t.patientId===patientId).forEach(t=>(t.items||[]).forEach(item=>{const m=db.inventory.find(x=>x.id===(item.refId||item.ref));if(m&&!meds.has(m.uuid)){add(fhirMedication(m));meds.add(m.uuid)}}));return {resourceType:'Bundle',id:newUuid(),type:'collection',timestamp:new Date().toISOString(),meta:{tag:[{system:'urn:accu:interop',code:'preview',display:'Interoperability preview — not a certified exchange payload'}]},entry:resources.map(resource=>({resource}))}}
function downloadJson(obj,filename){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/fhir+json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
let fhirPreviewPatientId='';
window.previewFhir=function(){const id=document.getElementById('interopPatient')?.value||fhirPreviewPatientId||db.patients[0]?.id;if(!id)return;fhirPreviewPatientId=id;const b=buildPatientBundle(id);document.getElementById('fhirPreview').textContent=JSON.stringify(b,null,2)};
window.exportFhir=function(){const id=document.getElementById('interopPatient')?.value||fhirPreviewPatientId||db.patients[0]?.id;const b=buildPatientBundle(id);if(b)downloadJson(b,`ACCU-FHIR-${id}.json`)};
window.saveTerminology=function(){if(!can('interopConfig'))return alert('Administrator access required.');db.services.forEach(x=>{const sys=document.getElementById(`svcSys-${x.id}`),code=document.getElementById(`svcCode-${x.id}`);if(sys)x.codeSystem=sys.value;if(code)x.standardCode=code.value.trim()});db.inventory.forEach(x=>{const sys=document.getElementById(`medSys-${x.id}`),code=document.getElementById(`medCode-${x.id}`);if(sys)x.standardCodeSystem=sys.value;if(code)x.standardCode=code.value.trim()});save('Updated interoperability terminology mappings')};
function renderInterop(){
 const root=document.getElementById('interop');if(!root)return;const pCount=db.patients.filter(x=>x.uuid).length;const svcMapped=db.services.filter(x=>x.standardCode).length;const medMapped=db.inventory.filter(x=>x.standardCode).length;const structured=db.labOrders.reduce((a,o)=>a+(o.resultComponents||[]).length,0);const admin=can('interopConfig');const patientId=fhirPreviewPatientId||db.patients[0]?.id||'';
 const svcRows=db.services.map(x=>`<tr><td data-label="Local code"><span class="code-pill">${esc(x.localCode||x.id)}</span></td><td data-label="Service"><strong>${esc(x.name)}</strong><br><span class="muted">${esc(x.type)}</span></td><td data-label="Code system"><select id="svcSys-${x.id}" class="small-select" ${admin?'':'disabled'}><option value="" ${!x.codeSystem?'selected':''}>Unmapped / local only</option><option value="http://loinc.org" ${x.codeSystem==='http://loinc.org'?'selected':''}>LOINC</option><option value="http://snomed.info/sct" ${x.codeSystem==='http://snomed.info/sct'?'selected':''}>SNOMED CT</option></select></td><td data-label="Standard code"><input id="svcCode-${x.id}" value="${esc(x.standardCode||'')}" placeholder="Validate before entering" ${admin?'':'disabled'}></td></tr>`).join('');
 const medRows=db.inventory.map(x=>`<tr><td data-label="Local code"><span class="code-pill">${esc(x.localCode||x.id)}</span></td><td data-label="Medicine"><strong>${esc(x.generic)} ${esc(x.strength)}</strong><br><span class="muted">${esc(x.brand||'No brand')} · ${esc(x.form||'')}</span></td><td data-label="Code system"><select id="medSys-${x.id}" class="small-select" ${admin?'':'disabled'}><option value="" ${!x.standardCodeSystem?'selected':''}>Unmapped / local only</option><option value="http://www.nlm.nih.gov/research/umls/rxnorm" ${x.standardCodeSystem?.includes('rxnorm')?'selected':''}>RxNorm</option><option value="urn:accu:medication-code" ${x.standardCodeSystem==='urn:accu:medication-code'?'selected':''}>Local / other</option></select></td><td data-label="Standard code"><input id="medCode-${x.id}" value="${esc(x.standardCode||'')}" placeholder="Validated code" ${admin?'':'disabled'}></td></tr>`).join('');
 root.innerHTML=`<div class="notice blue"><strong>Interoperability-ready, not interoperability-certified.</strong> This interoperability workspace maps internal data to HL7 FHIR R4-style resources and keeps local + standard terminology fields. Philippine Core FHIR alignment should be validated against the current DOH implementation guide before production integration.</div><div class="grid grid-4" style="margin-top:16px">${stat('Stable Patient IDs',`${pCount}/${db.patients.length}`,'UUID + local MRN')}${stat('Mapped Services',`${svcMapped}/${db.services.length}`,'Standard terminology codes')}${stat('Mapped Medicines',`${medMapped}/${db.inventory.length}`,'Medication terminology')}${stat('Structured Results',structured,'Observation-ready components')}</div><div class="interop-grid" style="margin-top:16px"><div class="card entity-card"><div class="section-head"><div><h2>FHIR Patient Bundle Preview</h2><p class="muted">Generates a FHIR preview Bundle using current patient, encounter, laboratory, radiology and medication data.</p></div></div><div class="field"><label>Patient</label><select id="interopPatient" onchange="fhirPreviewPatientId=this.value;previewFhir()">${db.patients.map(p=>`<option value="${p.id}" ${patientId===p.id?'selected':''}>${esc(p.name)} · ${p.id}</option>`).join('')}</select></div><div class="fhir-actions" style="margin:12px 0"><button class="primary" onclick="previewFhir()">Generate Preview</button><button class="secondary" onclick="exportFhir()">Export FHIR JSON</button></div><pre id="fhirPreview" class="fhir-preview">Select a patient and generate a preview.</pre></div><div class="card"><h2>Readiness Checklist</h2><div class="readiness-list"><div class="readiness-item"><span>Stable technical identifiers</span><strong class="badge green">Implemented</strong></div><div class="readiness-item"><span>Separate Organizations</span><strong class="badge green">Clinic + Pharmacy</strong></div><div class="readiness-item"><span>Patient / Encounter mapping</span><strong class="badge green">FHIR preview</strong></div><div class="readiness-item"><span>Lab ServiceRequest / DiagnosticReport</span><strong class="badge green">FHIR preview</strong></div><div class="readiness-item"><span>Structured Observation components</span><strong class="badge ${structured?'green':'amber'}">${structured?'Available':'Encode results'}</strong></div><div class="readiness-item"><span>Terminology mapping</span><strong class="badge ${svcMapped||medMapped?'amber':'blue'}">Local + optional standard</strong></div><div class="readiness-item"><span>Authenticated FHIR API</span><strong class="badge amber">Production phase</strong></div><div class="readiness-item"><span>DOH / HIE conformance testing</span><strong class="badge amber">Not yet validated</strong></div></div><div class="notice" style="margin-top:14px">The JSON export is for technical mapping review. It is not proof of DOH certification, NHDR integration, or conformance to a production exchange endpoint.</div></div></div><div class="card" style="margin-top:16px"><div class="section-head"><div><h2>Service Terminology Mapping</h2><p class="muted">Keep ACCU's local code while adding a validated standard code. Do not guess LOINC/SNOMED codes.</p></div>${admin?'<button class="primary" onclick="saveTerminology()">Save Mappings</button>':''}</div><div class="table-wrap"><table class="responsive-table"><thead><tr><th>Local code</th><th>Service</th><th>Code system</th><th>Standard code</th></tr></thead><tbody>${svcRows}</tbody></table></div></div><div class="card" style="margin-top:16px"><div class="section-head"><div><h2>Medication Terminology Mapping</h2><p class="muted">Generic and brand names remain local display data; optional standard codes support future exchange.</p></div></div><div class="table-wrap"><table class="responsive-table"><thead><tr><th>Local code</th><th>Medicine</th><th>Code system</th><th>Standard code</th></tr></thead><tbody>${medRows}</tbody></table></div></div>`;setTimeout(()=>{if(canView('interop'))previewFhir()},0)
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

function renderAll(){
  const renderers={dashboard:renderDashboard,patients:renderPatients,consultations:renderConsultations,laboratory:renderLab,radiology:renderRadiology,pharmacy:renderPharmacy,pos:renderPOS,reports:renderReports,interop:renderInterop,settings:renderSettings};
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
document.getElementById('roleSelect')?.addEventListener('change',()=>{});
document.getElementById('resetLocalData')?.addEventListener('click',()=>{});

document.getElementById('authGate').hidden=false;

async function hydrateFromBackend(){
  const b=window.ACCUBackend; if(!b?.configured){updateBackendBadge('Backend setup required','error');document.getElementById('authGate').hidden=false;const err=document.getElementById('authError');if(err)err.textContent='Supabase is not configured yet. Add your Project URL and publishable key in config.js.';const btn=document.getElementById('authSignIn');if(btn)btn.disabled=true;return;}
  updateBackendBadge('Connecting…');
  try{
    const profile=await b.getProfile();
    if(!profile){document.getElementById('authGate').hidden=false;updateBackendBadge('Sign in required');return;}
    activeRole=profile.role;
    localStorage.setItem(ROLE_KEY,activeRole);
    const un=document.getElementById('signedInUserName');if(un)un.textContent=profile.full_name||'Authorized staff';
    const ue=document.getElementById('signedInUserEmail');if(ue)ue.textContent=profile.email||'';
    if(profile.must_change_password){
      document.getElementById('authGate').hidden=true;
      document.getElementById('passwordGate').hidden=false;
      updateBackendBadge('Password change required','error');
      return;
    }
    document.getElementById('passwordGate').hidden=true;
    const remote=await b.loadWorkspace();
    if(remote){
      const hasRemote=(remote.patients?.length||remote.consultations?.length||remote.labOrders?.length||remote.radiologyOrders?.length||remote.inventory?.length||remote.transactions?.length);
      if(hasRemote){db={...structuredClone(seed),...remote,clinic:{...structuredClone(seed.clinic),...(remote.clinic||{})},pharmacyEntity:{...structuredClone(seed.pharmacyEntity),...(remote.pharmacyEntity||{})},meta:{...structuredClone(seed.meta),...(remote.meta||{})},audit:db.audit||[]};ensureInteropModel(db);}
      else if(activeRole==='Administrator'){await b.syncWorkspace(db,'Initial backend seed',activeRole)}
    }
    const rs=document.getElementById('roleSelect');if(rs){rs.value=activeRole;rs.disabled=true;}
    const help=document.querySelector('.role-help');if(help)help.textContent='Role is enforced by Supabase profile + Row Level Security.';
    const reset=document.getElementById('resetLocalData');if(reset)reset.style.display='none';
    if(!document.getElementById('myPasswordBtn')){const btn=document.createElement('button');btn.id='myPasswordBtn';btn.className='ghost';btn.textContent='Change my password';btn.onclick=openMyPasswordModal;document.querySelector('.sidebar-footer').appendChild(btn)}
    if(!document.getElementById('signOutBtn')){const btn=document.createElement('button');btn.id='signOutBtn';btn.className='ghost';btn.textContent='Sign out';btn.onclick=async()=>{await b.signOut();localStorage.removeItem(STORAGE_KEY);location.reload()};document.querySelector('.sidebar-footer').appendChild(btn)}
    document.getElementById('authGate').hidden=true;renderAll();updateRoleUI();updateBackendBadge('Supabase connected','live');
  }catch(e){console.error(e);updateBackendBadge('Backend error','error');document.getElementById('authGate').hidden=false;document.getElementById('authError').textContent=e.message||'Unable to connect.'}
}
const signInBtn=document.getElementById('authSignIn');
if(signInBtn)signInBtn.onclick=async()=>{const email=document.getElementById('authEmail').value.trim(),password=document.getElementById('authPassword').value;const err=document.getElementById('authError');err.textContent='';signInBtn.disabled=true;try{await window.ACCUBackend.signIn(email,password);await hydrateFromBackend()}catch(e){err.textContent=e.message||'Sign in failed'}finally{signInBtn.disabled=false}};

const firstLoginPasswordBtn=document.getElementById('changePasswordBtn');
if(firstLoginPasswordBtn)firstLoginPasswordBtn.onclick=async()=>{
  const p1=document.getElementById('newPassword').value,p2=document.getElementById('confirmNewPassword').value;
  const err=document.getElementById('passwordChangeError');err.textContent='';
  if(p1.length<10)return err.textContent='Use at least 10 characters.';
  if(p1!==p2)return err.textContent='Passwords do not match.';
  firstLoginPasswordBtn.disabled=true;firstLoginPasswordBtn.textContent='Updating…';
  try{
    await window.ACCUBackend.changeOwnPassword(p1);
    document.getElementById('newPassword').value='';
    document.getElementById('confirmNewPassword').value='';
    document.getElementById('passwordGate').hidden=true;
    await hydrateFromBackend();
  }catch(e){err.textContent=e.message||'Unable to change password.'}
  finally{firstLoginPasswordBtn.disabled=false;firstLoginPasswordBtn.textContent='Set new password'}
};
const passwordGateSignOut=document.getElementById('passwordGateSignOut');
if(passwordGateSignOut)passwordGateSignOut.onclick=async()=>{await window.ACCUBackend.signOut();location.reload()};

hydrateFromBackend();
