const STORAGE_KEY = 'accuClinicSystemV1';
const ROLE_KEY = 'accuClinicRoleV2';

const seed = {
  patients: [],
  consultations: [],
  labOrders: [],
  radiologyOrders: [],
  pharmacyReturns: [],
  onlineOrders: [],
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
  meta:{schemaVersion:12,interopProfile:'HL7 FHIR R4 / PH Core draft-aligned',lastMigration:''},
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
    actions:['addPatient','createConsult','completeConsult','queueStatus','createLab','labStatus','labResult','sendResultEmail','createRadiology','radiologyStatus','addMedicine','pharmacyReturn','onlineOrderStatus','approveRxOrder','addLabSupply','useLabSupply','checkout','export','interopConfig','manageServices','managePractitioners'],
    bottom:['dashboard','patients','laboratory','radiology','pos'],
    context:'Full administrative access across clinic, laboratory, radiology, pharmacy, billing, reporting, interoperability and user management.',
    quick:{type:'view',target:'pos',label:'+ New Transaction'}
  },
  'Receptionist': {
    views:['dashboard','patients','consultations','laboratory','radiology'],
    actions:['addPatient','createConsult','queueStatus','createLab','createRadiology'],
    bottom:['dashboard','patients','consultations','laboratory','radiology'],
    context:'Front desk access for registration, consultation queueing, laboratory requests and radiology requests.',
    quick:{type:'action',target:'patient',label:'+ Add Patient'}
  },
  'Physician': {
    views:['dashboard','patients','consultations','laboratory','radiology','interop'],
    actions:['createConsult','completeConsult','createLab','createRadiology','sendResultEmail'],
    bottom:['dashboard','consultations','patients','laboratory','radiology'],
    context:'Clinical access for patient encounters and diagnostic requests, with read-only access to released laboratory and radiology results.',
    quick:{type:'action',target:'consult',label:'+ New Consultation'}
  },
  'Medical Technologist': {
    views:['dashboard','laboratory'],
    actions:['labStatus','labResult','sendResultEmail','addLabSupply','useLabSupply'],
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
    actions:['radiologyStatus','radiologyReport','sendResultEmail'],
    bottom:['dashboard','radiology','patients'],
    context:'Radiology reporting workspace for findings, impression and final report release.',
    quick:{type:'view',target:'radiology',label:'Open Reporting Queue'}
  },
  'Pharmacist': {
    views:['dashboard','pharmacy','pos'],
    actions:['addMedicine','pharmacyReturn','onlineOrderStatus','approveRxOrder','checkout'],
    bottom:['dashboard','pharmacy','pos'],
    context:'Pharmacy access for medicines, retail products, inventory, online orders, dispensing and controlled returns.',
    quick:{type:'view',target:'pos',label:'+ Pharmacy Sale'}
  },
  'Pharmacy Assistant': {
    views:['dashboard','pharmacy','pos'],
    actions:['pharmacyReturn','onlineOrderStatus','checkout'],
    bottom:['dashboard','pharmacy','pos'],
    context:'Pharmacy support access for product lookup, POS, stock-handling workflows, returns and online-order preparation. Product master data and prescription approval remain restricted.',
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

const COMM_DEPARTMENTS=['Reception','Consultation','Laboratory','Radiology','Pharmacy','Cashier','Administration'];
const CONSULT_SPECIALTIES=['OB-GYNE','Pediatrics','Internal Medicine'];
const QUEUE_STATUSES=['For Vitals','Vitals Done','Waiting for Doctor','Called','In Consultation','Completed','No Show','Cancelled'];
let communications={notifications:[],reads:[],messages:[]};
let communicationTab='notifications';
const NOTIFICATION_SOUND_KEY='accu:notification-sound';
const DESKTOP_ALERT_KEY='accu:desktop-alerts';
let notificationAudioContext=null;

function notificationSoundEnabled(){return localStorage.getItem(NOTIFICATION_SOUND_KEY)!=='off'}
function desktopAlertsEnabled(){return localStorage.getItem(DESKTOP_ALERT_KEY)==='on'&&('Notification' in window)&&Notification.permission==='granted'}
function updateNotificationSoundUI(){
  const btn=document.getElementById('notificationSoundToggle');
  if(!btn)return;
  const on=notificationSoundEnabled();
  btn.textContent=on?'🔊':'🔇';
  btn.classList.toggle('muted-sound',!on);
  btn.setAttribute('aria-label',on?'Mute notification sounds':'Enable notification sounds');
  btn.title=on?'Notification sound on':'Notification sound muted';
}
function unlockNotificationAudio(){
  try{
    if(!notificationAudioContext)notificationAudioContext=new (window.AudioContext||window.webkitAudioContext)();
    if(notificationAudioContext.state==='suspended')notificationAudioContext.resume();
  }catch{}
}
function playNotificationSound(notification={}){
  if(!notificationSoundEnabled())return;
  try{
    unlockNotificationAudio();
    const ctx=notificationAudioContext;if(!ctx)return;
    const now=ctx.currentTime;
    const warning=notification.severity==='warning'||notification.requires_ack;
    const notes=warning?[659.25,783.99]:[523.25,659.25];
    notes.forEach((freq,i)=>{
      const osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.type='sine';osc.frequency.value=freq;
      gain.gain.setValueAtTime(0.0001,now+i*.11);
      gain.gain.exponentialRampToValueAtTime(warning?.075:.05,now+i*.11+.015);
      gain.gain.exponentialRampToValueAtTime(0.0001,now+i*.11+.16);
      osc.connect(gain);gain.connect(ctx.destination);osc.start(now+i*.11);osc.stop(now+i*.11+.18);
    });
  }catch{}
}
function showDesktopAlert(notification={}){
  if(!desktopAlertsEnabled()||!document.hidden)return;
  try{
    const n=new Notification(notification.title||'ACCU Notification',{body:notification.message||'',tag:`accu-${notification.id||Date.now()}`,renotify:true});
    n.onclick=()=>{window.focus();openCommunications('notifications');n.close()};
  }catch{}
}
function handleRealtimeCommunication(kind,row){
  if(kind==='notification'){
    playNotificationSound(row||{});
    showDesktopAlert(row||{});
  }
  refreshCommunications({quiet:true});
}
window.toggleNotificationSound=function(){
  localStorage.setItem(NOTIFICATION_SOUND_KEY,notificationSoundEnabled()?'off':'on');
  if(notificationSoundEnabled())unlockNotificationAudio();
  updateNotificationSoundUI();
};
window.toggleDesktopAlerts=async function(){
  if(!('Notification' in window))return alert('Desktop notifications are not supported by this browser.');
  if(localStorage.getItem(DESKTOP_ALERT_KEY)==='on'){
    localStorage.setItem(DESKTOP_ALERT_KEY,'off');openCommunications('notifications');return;
  }
  const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();
  if(permission==='granted')localStorage.setItem(DESKTOP_ALERT_KEY,'on');
  else localStorage.setItem(DESKTOP_ALERT_KEY,'off');
  openCommunications('notifications');
};

function communicationReadMap(){return new Map((communications.reads||[]).map(r=>[r.notification_id,r]))}
function unreadNotifications(){const m=communicationReadMap();return (communications.notifications||[]).filter(n=>!m.has(n.id))}
function updateCommunicationBadge(){
  const bell=document.getElementById('communicationBell'),badge=document.getElementById('notificationBadge');
  if(!bell||!badge)return;
  const count=unreadNotifications().length;
  badge.textContent=count>99?'99+':String(count);badge.hidden=count===0;
  bell.classList.toggle('has-unread',count>0);
}
async function refreshCommunications({quiet=false}={}){
  if(!window.ACCUBackend?.configured||!window.ACCUBackend.status.user)return;
  try{communications=await window.ACCUBackend.loadCommunications();updateCommunicationBadge();if(!quiet&&document.getElementById('communicationsPanel'))openCommunications(communicationTab)}catch(e){console.warn('Communications refresh failed',e)}
}
function notificationIcon(n){return n.severity==='warning'?'⚠️':n.severity==='success'?'✅':n.type==='department_message'?'💬':'🔔'}
function communicationContextLabel(n){return [n.entity_type,n.entity_local_id].filter(Boolean).join(' · ')}
window.openCommunications=function(tab='notifications'){
  communicationTab=tab;
  const readMap=communicationReadMap();
  const notifications=(communications.notifications||[]);
  const messages=(communications.messages||[]);
  let body='';
  if(tab==='notifications'){
    const desktopOn=desktopAlertsEnabled();
    body=`<div class="communication-toolbar"><div><strong>${unreadNotifications().length} unread</strong></div><div class="inline-actions"><button class="small-btn" onclick="toggleNotificationSound()">${notificationSoundEnabled()?'🔊 Sound':'🔇 Sound'}</button><button class="small-btn ${desktopOn?'active-setting':''}" onclick="toggleDesktopAlerts()">${desktopOn?'Desktop alerts on':'Desktop alerts'}</button>${notifications.length?'<button class="small-btn" onclick="markAllCommunicationRead()">Mark all read</button>':''}</div></div><div class="communication-list">${notifications.map(n=>{const r=readMap.get(n.id),unread=!r,ctx=communicationContextLabel(n);return `<article class="communication-item ${unread?'unread':''}"><div class="communication-icon">${notificationIcon(n)}</div><div class="communication-copy"><div class="communication-meta"><span class="badge blue">${esc(n.department)}</span><span>${new Date(n.created_at).toLocaleString('en-PH')}</span></div><strong>${esc(n.title)}</strong><p>${esc(n.message||'')}</p>${ctx?`<small class="muted">${esc(ctx)}</small>`:''}<div class="inline-actions" style="margin-top:8px">${unread?`<button class="small-btn" onclick="markCommunicationRead('${n.id}',${n.requires_ack?'true':'false'})">${n.requires_ack?'Acknowledge':'Mark read'}</button>`:''}${n.entity_type?`<button class="small-btn" onclick="openCommunicationContext('${n.id}')">Open</button>`:''}</div></div></article>`}).join('')||'<div class="empty">No notifications yet.</div>'}</div>`;
  }else if(tab==='inbox'){
    body=`<div class="communication-list">${messages.map(m=>`<article class="communication-item"><div class="communication-icon">💬</div><div class="communication-copy"><div class="communication-meta"><span class="badge green">To ${esc(m.target_department)}</span><span>${new Date(m.created_at).toLocaleString('en-PH')}</span></div><strong>${esc(m.subject||'Internal message')}</strong><p>${esc(m.body)}</p><small class="muted">From ${esc(m.sender_role||'Staff')}${m.context_local_id?` · ${esc(m.context_type||'Reference')} ${esc(m.context_local_id)}`:''}</small><div class="inline-actions" style="margin-top:8px"><button class="small-btn" onclick="replyDepartmentMessage('${m.id}')">Reply</button></div></div></article>`).join('')||'<div class="empty">No department messages yet.</div>'}</div>`;
  }else{
    body=`<div class="form-grid"><div class="field"><label>Send to department</label><select id="msgDepartment">${COMM_DEPARTMENTS.map(d=>`<option>${d}</option>`).join('')}</select></div><div class="field"><label>Reference type</label><select id="msgContextType"><option value="">None</option><option>Patient</option><option>Consultation</option><option>Laboratory Order</option><option>Radiology Order</option><option>Online Order</option><option>Transaction</option></select></div><div class="field full"><label>Reference ID (optional)</label><input id="msgContextId" placeholder="e.g. P-0007, LAB-0012, WEB-0004"></div><div class="field full"><label>Subject</label><input id="msgSubject" maxlength="120" placeholder="Short operational subject"></div><div class="field full"><label>Message</label><textarea id="msgBody" maxlength="1500" placeholder="Write a short internal message. Avoid unnecessary sensitive details."></textarea></div></div><div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="primary" onclick="sendCommunicationMessage()">Send Message</button></div>`;
  }
  const tabs=`<div class="subtabs"><button class="subtab ${tab==='notifications'?'active':''}" onclick="openCommunications('notifications')">Notifications</button><button class="subtab ${tab==='inbox'?'active':''}" onclick="openCommunications('inbox')">Department Inbox</button><button class="subtab ${tab==='compose'?'active':''}" onclick="openCommunications('compose')">Send Message</button></div>`;
  modal('Communications',`<div id="communicationsPanel">${tabs}${body}</div>`,null,'Close');
};
window.markCommunicationRead=async function(id,ack=false){try{await window.ACCUBackend.markNotificationRead(id,ack);await refreshCommunications({quiet:true});openCommunications('notifications')}catch(e){alert(e.message||'Unable to update notification.')}};
window.markAllCommunicationRead=async function(){try{await window.ACCUBackend.markAllNotificationsRead(unreadNotifications().map(n=>n.id));await refreshCommunications({quiet:true});openCommunications('notifications')}catch(e){alert(e.message||'Unable to mark notifications read.')}};
window.openCommunicationContext=async function(id){const n=(communications.notifications||[]).find(x=>x.id===id);if(!n)return;try{await window.ACCUBackend.markNotificationRead(id,false)}catch{}closeModal();await refreshCommunications({quiet:true});const type=n.entity_type||'';if(type==='online_order'){pharmacyActiveTab='online';showView('pharmacy');renderPharmacy()}else if(type==='lab_order')showView('laboratory');else if(type==='radiology_order')showView('radiology');else if(type==='encounter')showView('consultations');else if(type==='transaction')showView('reports');};
window.sendCommunicationMessage=async function(){const targetDepartment=v('msgDepartment'),subject=v('msgSubject'),body=v('msgBody'),contextType=v('msgContextType'),contextLocalId=v('msgContextId');if(!body)return alert('Message is required.');try{await window.ACCUBackend.sendDepartmentMessage({targetDepartment,subject,body,contextType,contextLocalId});await refreshCommunications({quiet:true});openCommunications('inbox')}catch(e){alert(e.message||'Unable to send message.')}};
window.replyDepartmentMessage=function(id){const m=(communications.messages||[]).find(x=>x.id===id);openCommunications('compose');setTimeout(()=>{const subj=document.getElementById('msgSubject'),ctx=document.getElementById('msgContextId'),ctype=document.getElementById('msgContextType');if(subj)subj.value=`Re: ${m?.subject||'Internal message'}`;if(ctx)ctx.value=m?.context_local_id||'';if(ctype&&m?.context_type){[...ctype.options].some(o=>{if(o.value===m.context_type||o.text===m.context_type){ctype.value=o.value||o.text;return true}return false})}},0)};
function startCommunicationRealtime(){window.ACCUBackend?.subscribeCommunications?.((kind,row)=>handleRealtimeCommunication(kind,row))}

function newUuid(){
  if(globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&3|8);return v.toString(16)});
}
function ensureInteropModel(parsed){
  let changed=false;
  parsed.meta={...structuredClone(seed.meta),...(parsed.meta||{}),schemaVersion:12};
  parsed.practitioners ||= structuredClone(seed.practitioners);
  const ensure=(obj)=>{if(obj&&!obj.uuid){obj.uuid=newUuid();changed=true}return obj};
  (parsed.patients||[]).forEach(p=>{ensure(p);p.identifiers ||= [{system:'urn:accu:patient-id',value:p.id}];p.email ||= '';p.phone ||= '';p.sex ||= '';p.dob ||= '';});
  (parsed.consultations||[]).forEach(c=>{ensure(c);c.diagnosisCodeSystem ||= 'http://hl7.org/fhir/sid/icd-10';c.diagnosisCode ||= '';c.specialty ||= 'Internal Medicine';if(!c.status||c.status==='Queued')c.status='For Vitals';if(c.status==='Waiting')c.status='Waiting for Doctor';c.queueNo ||= '';if(!c.vitals||typeof c.vitals==='string'){const legacy=typeof c.vitals==='string'?c.vitals:'';c.vitals={bpSystolic:'',bpDiastolic:'',heartRate:'',respRate:'',temperature:'',spo2:'',heightCm:'',weightKg:'',bmi:'',painScore:'',notes:legacy};changed=true;}if(!c.practitionerId&&c.doctor){let pr=parsed.practitioners.find(x=>x.name===c.doctor);if(!pr){pr={id:`PRAC-${String(parsed.practitioners.length+1).padStart(3,'0')}`,uuid:newUuid(),name:c.doctor,role:'Physician',specialty:c.specialty||'',licenseNo:'',codeSystem:'',code:''};parsed.practitioners.push(pr);changed=true}c.practitionerId=pr.id;}});
  (parsed.practitioners||[]).forEach(pr=>{ensure(pr);pr.specialty ||= '';pr.active = pr.active!==false;});
  (parsed.labOrders||[]).forEach(o=>{ensure(o);o.resultComponents ||= [];o.serviceIds ||= (o.tests||[]).map(t=>(parsed.services||[]).find(s=>s.name===t)?.id).filter(Boolean);});
  (parsed.radiologyOrders||[]).forEach(o=>{ensure(o);o.serviceIds ||= (o.tests||[]).map(t=>(parsed.services||[]).find(s=>s.name===t)?.id).filter(Boolean);o.findings ||= '';o.impression ||= '';o.reportedBy ||= '';});
  parsed.onlineOrders ||= [];
  (parsed.pharmacyReturns||[]).forEach(ensure);
  (parsed.onlineOrders||[]).forEach(ensure);
  (parsed.services||[]).forEach(x=>{ensure(x);x.localCode ||= x.id;x.codeSystem ||= (x.type==='Laboratory'?'http://loinc.org':'');x.standardCode ||= '';});
  (parsed.inventory||[]).forEach(x=>{ensure(x);x.localCode ||= x.id;x.standardCodeSystem ||= '';x.standardCode ||= '';x.productType ||= 'Medicine';x.productName ||= ['Medicine','Vaccine'].includes(x.productType)?(x.generic||x.brand||x.id):(x.brand||x.generic||x.id);x.category ||= x.productType==='Vaccine'?'Vaccines':(x.productType==='Medicine'?'Medicine':'General Merchandise');x.storageRequirement ||= x.productType==='Vaccine'?'2–8°C':'';x.route ||= '';x.sku ||= '';x.barcode ||= '';x.prescriptionRequired=!!x.prescriptionRequired;x.onlineEnabled=!!x.onlineEnabled;x.onlineDescription ||= '';x.imageUrl ||= '';});
  (parsed.labSupplies||[]).forEach(ensure);
  if(!parsed.clinic.uuid){parsed.clinic.uuid=newUuid();changed=true} if(!parsed.pharmacyEntity.uuid){parsed.pharmacyEntity.uuid=newUuid();changed=true}
  if(changed) parsed.meta.lastMigration=new Date().toISOString();
  return changed;
}

let db = window.ACCUBackend?.configured ? structuredClone(seed) : load();
let cart = [];
let saleDraft = {entity:'clinic',patientId:'',payment:'Cash',tendered:'',buyerName:'',buyerTin:'',buyerAddress:'',discountType:'None',discountId:'',discountPercent:'0',officialInvoiceRef:''};
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
    parsed.onlineOrders ||= [];
    parsed.consultations ||= [];
    parsed.clinic ||= structuredClone(seed.clinic);
    parsed.clinic = {...structuredClone(seed.clinic), ...parsed.clinic};
    parsed.pharmacyEntity ||= structuredClone(seed.pharmacyEntity);
    parsed.pharmacyEntity = {...structuredClone(seed.pharmacyEntity), ...parsed.pharmacyEntity};
    parsed.labSupplies ||= structuredClone(seed.labSupplies);
    parsed.labSupplyMovements ||= [];
    parsed.services = (parsed.services||[]).map(x=>({...x,taxClass:x.taxClass||'Unclassified'}));
    parsed.inventory = (parsed.inventory||[]).map(x=>({...x,supplier:x.supplier||'',taxClass:x.taxClass||'Unclassified',productType:x.productType||'Medicine',productName:x.productName||(x.generic||x.brand||x.id),category:x.category||(x.productType==='Vaccine'?'Vaccines':(x.productType==='Merchandise'?'General Merchandise':'Medicine')),storageRequirement:x.storageRequirement||(x.productType==='Vaccine'?'2–8°C':''),route:x.route||'',sku:x.sku||'',barcode:x.barcode||'',prescriptionRequired:!!x.prescriptionRequired,onlineEnabled:!!x.onlineEnabled,onlineDescription:x.onlineDescription||'',imageUrl:x.imageUrl||''}));
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
    if(migrated || Number(parsed.meta?.schemaVersion||0)<12) localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
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
function currentSaleEntity(){return ['Pharmacist','Pharmacy Assistant'].includes(activeRole)?'pharmacy':(saleDraft.entity||'clinic')}
function entityLabel(entity){return entity==='pharmacy'?'Pharmacy':'Clinic / Laboratory / Radiology'}
function isMedicineProduct(p){return ['Medicine','Vaccine'].includes(p?.productType||'Medicine')}
function isVaccineProduct(p){return (p?.productType||'')==='Vaccine'}
function pharmacyProductName(p){if(!p)return 'Pharmacy product';return isMedicineProduct(p)?`${p.generic||p.productName||''}${p.strength?` ${p.strength}`:''}`.trim():(p.productName||p.brand||p.generic||p.id)}
function pharmacyProductMeta(p){return isMedicineProduct(p)?[p.brand||'No brand',p.form||'',p.category||(isVaccineProduct(p)?'Vaccines':'Medicine'),isVaccineProduct(p)&&p.storageRequirement?`Storage ${p.storageRequirement}`:''].filter(Boolean).join(' · '):[p.brand||'',p.category||'Merchandise',p.sku?`SKU ${p.sku}`:''].filter(Boolean).join(' · ')}
function ageFromDob(dob){if(!dob)return '—';const b=new Date(`${dob}T00:00:00`);if(Number.isNaN(b.getTime()))return '—';const n=new Date();let a=n.getFullYear()-b.getFullYear();const m=n.getMonth()-b.getMonth();if(m<0||(m===0&&n.getDate()<b.getDate()))a--;return Math.max(0,a)}
function patientAge(p){return ageFromDob(p?.dob)}
function patientEmail(patientId){return db.patients.find(p=>p.id===patientId)?.email||''}
function currentStaffName(){return window.ACCUBackend?.status?.profile?.full_name||activeRole}
function currentStaffUserId(){return window.ACCUBackend?.status?.user?.id||''}
function specialtyPrefix(s){return s==='OB-GYNE'?'OB':s==='Pediatrics'?'PED':'IM'}
function nextQueueNo(specialty,date=today()){const pre=specialtyPrefix(specialty);const nums=db.consultations.filter(c=>c.date===date&&c.specialty===specialty&&String(c.queueNo||'').startsWith(pre+'-')).map(c=>Number(String(c.queueNo).split('-').pop())||0);return `${pre}-${String(Math.max(0,...nums)+1).padStart(2,'0')}`}
function activeDoctors(specialty=''){return (db.practitioners||[]).filter(p=>p.role==='Physician'&&p.active!==false&&(!specialty||p.specialty===specialty)).sort((a,b)=>String(a.name).localeCompare(String(b.name)))}
function doctorNameById(id){return db.practitioners.find(p=>p.id===id)?.name||''}
function transactionRevenueBreakdown(rows){const out={consultation:0,laboratory:0,radiology:0,pharmacy:0,other:0,total:0};for(const t of rows){const subtotal=Number(t.subtotal||0)||((t.items||[]).reduce((a,i)=>a+Number(i.price||0)*Number(i.qty||0),0));const factor=subtotal?Number(t.total||0)/subtotal:1;for(const i of (t.items||[])){const amt=Number(i.price||0)*Number(i.qty||0)*factor;const kind=String(i.kind||'').toLowerCase();if((t.entity||'clinic')==='pharmacy'||kind==='pharmacy')out.pharmacy+=amt;else if(kind.includes('consult'))out.consultation+=amt;else if(kind.includes('lab')||kind.includes('diagnostic'))out.laboratory+=amt;else if(kind.includes('radiolog'))out.radiology+=amt;else out.other+=amt;}out.total+=Number(t.total||0)}return out}
function todayDoctorCensus(){const rows=db.consultations.filter(c=>c.date===today());const map=new Map();for(const c of rows){const key=c.doctor||'Unassigned';const r=map.get(key)||{doctor:key,specialty:c.specialty||'—',total:0,completed:0,waiting:0};r.total++;if(c.status==='Completed')r.completed++;else if(!['Cancelled','No Show'].includes(c.status))r.waiting++;map.set(key,r)}return [...map.values()].sort((a,b)=>a.doctor.localeCompare(b.doctor))}
function doctorCensusTable(){const rows=todayDoctorCensus();return `<div class="table-wrap"><table class="responsive-table"><thead><tr><th>Doctor</th><th>Specialty</th><th>Patients</th><th>Completed</th><th>Open</th></tr></thead><tbody>${rows.map(r=>`<tr><td data-label="Doctor"><strong>${esc(r.doctor)}</strong></td><td data-label="Specialty">${esc(r.specialty)}</td><td data-label="Patients">${r.total}</td><td data-label="Completed">${r.completed}</td><td data-label="Open">${r.waiting}</td></tr>`).join('')||'<tr><td colspan="5" class="empty">No consultation patients today.</td></tr>'}</tbody></table></div>`}

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
  const roleContext=document.getElementById('roleContext');if(roleContext)roleContext.textContent='';
  document.querySelectorAll('.nav-item').forEach(btn=>{btn.hidden=!cfg.views.includes(btn.dataset.view)});

  const bottom=cfg.bottom.filter(v=>cfg.views.includes(v));
  const mobileNav=document.getElementById('mobileBottomNav');
  mobileNav.style.setProperty('--mobile-nav-count',bottom.length);
  mobileNav.innerHTML=bottom.map(v=>`<button class="mobile-nav-btn ${activeView===v?'active':''}" data-view="${v}" onclick="showView('${v}')"><span class="mi">${ICONS[v]}</span><span class="ml">${SHORT_LABELS[v]}</span></button>`).join('');

  document.getElementById('quickSaleBtn').textContent=cfg.quick.label;
  document.getElementById('mobileQuickBtn').title=cfg.quick.label;
  if(!cfg.views.includes(activeView)) activeView='dashboard';
  showView(activeView);
  updateCommunicationBadge();
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
  const rb=transactionRevenueBreakdown(txToday);rb.pharmacy=Math.max(0,rb.pharmacy-refundToday);rb.total=Math.max(0,rb.total-refundToday);
  const low=db.inventory.filter(i=>i.qty<=i.reorder);
  const soon=db.inventory.filter(i=>i.expiry&&(()=>{const d=daysUntil(i.expiry);return d>=0&&d<=90})());
  const lowLab=(db.labSupplies||[]).filter(i=>i.qty<=i.reorder);
  const labsToday=db.labOrders.filter(o=>o.date===today());
  const radsToday=(db.radiologyOrders||[]).filter(o=>o.date===today());
  const consultToday=db.consultations.filter(c=>c.date===today());
  const pendingLabs=db.labOrders.filter(o=>o.status!=='Released');
  const pendingRads=(db.radiologyOrders||[]).filter(o=>o.status!=='Final');

  if(activeRole==='Administrator'){
    target.innerHTML=`<div class="grid grid-5 kpi-strip">${stat('Consultation',money(rb.consultation),'Today')}${stat('Laboratory',money(rb.laboratory),'Today')}${stat('Radiology',money(rb.radiology),'Today')}${stat('Pharmacy',money(rb.pharmacy),'Net today')}${stat('General Total',money(rb.total),'All departments')}</div>
      <div class="grid grid-2"><div class="card"><div class="section-head"><h2>Operational Alerts</h2></div>${inventoryAlerts(low,soon)}</div><div class="card"><div class="section-head"><h2>Today’s Workflow</h2></div>${workflowRows(consultToday.length,labsToday.length,radsToday.length,txToday.length)}</div></div>
      <div class="section-head"><h2>Patients per Doctor · Today</h2></div>${doctorCensusTable()}
      <div class="section-head"><h2>Recent Transactions</h2><button class="secondary" onclick="showView('pos')">Open POS</button></div>${transactionsTable(db.transactions.slice(0,8))}`;
    return;
  }
  if(activeRole==='Receptionist'){
    const waiting=consultToday.filter(c=>!['Completed','Cancelled','No Show'].includes(c.status)).length;
    target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('Queue Today',consultToday.length,`${waiting} active`)}${stat('OB-GYNE',consultToday.filter(c=>c.specialty==='OB-GYNE').length,'Patients today')}${stat('Pediatrics',consultToday.filter(c=>c.specialty==='Pediatrics').length,'Patients today')}${stat('Internal Medicine',consultToday.filter(c=>c.specialty==='Internal Medicine').length,'Patients today')}</div>
      <div class="card"><div class="section-head"><h2>Front Desk</h2></div><div class="action-grid">${actionCard('Register Patient','Create patient record',`openPatientModal()`)}${actionCard('Consultation Queue','Assign specialty and doctor',`openConsultModal()`)}${actionCard('Laboratory Request','Create lab request',`openLabModal()`)}${actionCard('Radiology Request','Create imaging request',`openRadiologyModal()`)}</div></div>
      <div class="section-head"><h2>Today’s Consultation Queue</h2></div>${consultationsTable(consultToday)}<div class="section-head"><h2>Patients per Doctor</h2></div>${doctorCensusTable()}`;
    return;
  }
  if(activeRole==='Physician'){
    const myName=currentStaffName();const assigned=consultToday.filter(c=>c.doctor===myName);const physicianRows=assigned.length?assigned:consultToday;const queued=physicianRows.filter(c=>!['Completed','Cancelled','No Show'].includes(c.status));
    target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('Assigned Today',physicianRows.length,assigned.length?'Your queue':'Clinic queue')}${stat('Waiting',queued.length,'Open encounters')}${stat('Pending Lab',pendingLabs.length,'Awaiting release')}${stat('Pending Radiology',pendingRads.length,'Awaiting final report')}</div><div class="section-head"><h2>Patient Queue</h2><button class="primary" onclick="openConsultModal()">+ New Consultation</button></div>${consultationsTable(queued.length?queued:physicianRows)}`;
    return;
  }
  if(activeRole==='Medical Technologist'){
    const collection=pendingLabs.filter(o=>['For Collection','Collected'].includes(o.status)).length,processing=pendingLabs.filter(o=>o.status==='Processing').length,validation=pendingLabs.filter(o=>o.status==='For Validation').length;
    target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('Collection Queue',collection,'For collection / collected')}${stat('Processing',processing,'Tests processing')}${stat('For Validation',validation,'Awaiting validation')}${stat('Low Lab Supplies',lowLab.length,'At/below reorder')}</div><div class="section-head"><h2>Active Laboratory Queue</h2></div>${labTable(pendingLabs.slice(0,10))}`;return;
  }
  if(activeRole==='Radiologic Technologist'){
    const scheduled=pendingRads.filter(o=>['Ordered','Scheduled'].includes(o.status)).length,imaging=pendingRads.filter(o=>['For Imaging','Performed'].includes(o.status)).length;
    target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('Scheduled / Ordered',scheduled,'Awaiting imaging')}${stat('Imaging Worklist',imaging,'For imaging / performed')}${stat('For Reading',pendingRads.filter(o=>o.status==='For Reading').length,'Awaiting radiologist')}${stat('Final Today',radsToday.filter(o=>o.status==='Final').length,'Reports completed')}</div><div class="section-head"><h2>Radiology Worklist</h2></div>${radiologyTable(pendingRads.slice(0,10))}`;return;
  }
  if(activeRole==='Radiologist'){
    const reading=pendingRads.filter(o=>o.status==='For Reading'||o.status==='Performed');target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('For Reading',reading.length,'Awaiting interpretation')}${stat('Final Today',radsToday.filter(o=>o.status==='Final').length,'Released reports')}${stat('Pending Imaging',pendingRads.filter(o=>['Ordered','Scheduled','For Imaging'].includes(o.status)).length,'Not ready')}${stat('Total Orders',db.radiologyOrders.length,'All records')}</div><div class="section-head"><h2>Reporting Queue</h2></div>${radiologyTable(reading.length?reading:db.radiologyOrders.slice(0,10))}`;return;
  }
  if(['Pharmacist','Pharmacy Assistant'].includes(activeRole)){
    const webOrders=(db.onlineOrders||[]).filter(o=>!['Completed','Cancelled'].includes(o.status)),rxReview=webOrders.filter(o=>o.requiresPrescriptionReview&&!o.rxApproved).length,vaccines=db.inventory.filter(isVaccineProduct).length;const productAction=activeRole==='Pharmacist'?actionCard('Add Pharmacy Product','Medicine, vaccine or retail product',`openMedicineModal()`):'';
    target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('Pharmacy Net Sales',money(rb.pharmacy),'Today')}${stat('Online Orders',webOrders.length,rxReview?`${rxReview} Rx review`:'Active orders')}${stat('Vaccines',vaccines,'Tracked vaccine products')}${stat('Low Stock',low.length,'Products at reorder')}</div><div class="grid grid-2"><div class="card"><div class="section-head"><h2>Inventory Alerts</h2></div>${inventoryAlerts(low,soon)}</div><div class="card"><div class="section-head"><h2>Quick Actions</h2></div><div class="action-grid">${actionCard('New Pharmacy Sale','Open POS',`showView('pos')`)}${actionCard('Online Orders','Review orders',`setPharmacyTab('online')`)}${actionCard('Process Return','Record pharmacy return',`openPharmacyReturnModal()`)}${productAction}</div></div></div>`;return;
  }
  const me=currentStaffUserId();const myTx=txToday.filter(t=>!me||!t.operatorUserId||t.operatorUserId===me);const myRb=transactionRevenueBreakdown(myTx);const myIds=new Set(myTx.map(t=>t.id));const myRefunds=returnedToday.filter(r=>myIds.has(r.transactionId)).reduce((a,b)=>a+Number(b.refundAmount||0),0);myRb.pharmacy=Math.max(0,myRb.pharmacy-myRefunds);myRb.total=Math.max(0,myRb.total-myRefunds);const cashTotal=myTx.filter(t=>t.payment==='Cash').reduce((a,b)=>a+b.total,0);target.innerHTML=`<div class="grid grid-4 kpi-strip">${stat('My Collections',money(myRb.total),'Today')}${stat('My Transactions',myTx.length,'Today')}${stat('Cash',money(cashTotal),'Today')}${stat('Other Payments',money(myRb.total-cashTotal),'Today')}</div><div class="section-head"><h2>My Recent Payments</h2><button class="primary" onclick="showView('pos')">+ New Transaction</button></div>${transactionsTable(myTx.slice(0,10))}`;
}
function inventoryAlerts(low,soon){
  return `${low.length?`<div class="notice red"><strong>Low stock:</strong> ${low.map(x=>`${esc(pharmacyProductName(x))} (${x.qty})`).join(', ')}</div>`:''}${soon.length?`<div class="notice" style="margin-top:10px"><strong>Expiring within 90 days:</strong> ${soon.map(x=>`${esc(pharmacyProductName(x))} – ${x.expiry}`).join(', ')}</div>`:''}${!low.length&&!soon.length?'<div class="empty">No urgent stock or expiry alerts.</div>':''}`;
}
function workflowRows(consults,labs,rads,txs){return `<div class="summary-row"><span>Consultations</span><strong>${consults}</strong></div><div class="summary-row"><span>Lab orders</span><strong>${labs}</strong></div><div class="summary-row"><span>Radiology orders</span><strong>${rads}</strong></div><div class="summary-row"><span>Transactions</span><strong>${txs}</strong></div>`}

function renderPatients(){
  const add=can('addPatient')?'<button class="primary" onclick="openPatientModal()">+ Add Patient</button>':'';
  document.getElementById('patients').innerHTML=`<div class="section-head"><h2>${db.patients.length} patients</h2><div class="toolbar"><input id="patientSearch" placeholder="Search name, ID, email, phone…">${add}</div></div><div id="patientsTable">${patientsTable(db.patients)}</div>`;
  document.getElementById('patientSearch').oninput=e=>document.getElementById('patientsTable').innerHTML=patientsTable(db.patients.filter(p=>Object.values(p).join(' ').toLowerCase().includes(e.target.value.toLowerCase())));
}
function patientsTable(rows){return `<div class="table-wrap"><table class="responsive-table"><thead><tr><th>ID</th><th>Patient</th><th>Age / Sex</th><th>Contact</th><th>Last Visit</th><th>Action</th></tr></thead><tbody>${rows.map(p=>{const visits=db.consultations.filter(c=>c.patientId===p.id).sort((a,b)=>String(b.date).localeCompare(String(a.date)));return `<tr><td data-label="ID">${p.id}</td><td data-label="Patient"><strong>${esc(p.name)}</strong>${p.email?`<br><span class="muted">${esc(p.email)}</span>`:''}</td><td data-label="Age / Sex">${patientAge(p)} yrs · ${esc(p.sex||'—')}</td><td data-label="Contact">${esc(p.phone||'—')}<br><span class="muted">${esc(p.address||'')}</span></td><td data-label="Last Visit">${visits[0]?.date||'—'}</td><td data-label="Action"><button class="small-btn" onclick="openPatientRecord('${p.id}')">Open Record</button>${can('addPatient')?` <button class="small-btn" onclick="openPatientModal('${p.id}')">Edit</button>`:''}</td></tr>`}).join('')||'<tr><td colspan="6" class="empty">No patients found.</td></tr>'}</tbody></table></div>`}
window.openPatientModal=function(id=''){
  if(!guard('addPatient')) return;const existing=id?db.patients.find(p=>p.id===id):null;
  modal(existing?'Edit Patient':'Add Patient',`<div class="form-grid">${field('Full name','pName','text',existing?.name||'')}<div class="field"><label>Sex</label><select id="pSex"><option value="F" ${existing?.sex==='F'?'selected':''}>Female</option><option value="M" ${existing?.sex==='M'?'selected':''}>Male</option><option value="Other" ${existing?.sex==='Other'?'selected':''}>Other / Prefer not to say</option></select></div>${field('Date of birth','pDob','date',existing?.dob||'')}${field('Phone','pPhone','text',existing?.phone||'')}${field('Email address (optional)','pEmail','email',existing?.email||'')}<div class="field"><label>Discount</label><select id="pDiscount">${['None','Senior','PWD'].map(x=>`<option ${existing?.discount===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field full"><label>Address</label><input id="pAddress" value="${esc(existing?.address||'')}"></div></div>`,()=>{const name=v('pName');if(!name)return alert('Name is required.');const values={name,sex:v('pSex'),dob:v('pDob'),phone:v('pPhone'),email:v('pEmail').toLowerCase(),address:v('pAddress'),discount:v('pDiscount')};if(existing){Object.assign(existing,values);save(`Updated patient ${existing.id}`)}else{const pid=nextId('P',db.patients);db.patients.push({id:pid,uuid:newUuid(),identifiers:[{system:'urn:accu:patient-id',value:pid}],...values});save(`Added patient ${name}`)}closeModal()},existing?'Save Changes':'Add Patient');
};
window.openPatientRecord=function(id){const p=db.patients.find(x=>x.id===id);if(!p)return;const consults=db.consultations.filter(c=>c.patientId===id).sort((a,b)=>String(b.date).localeCompare(String(a.date)));const labs=db.labOrders.filter(o=>o.patientId===id).sort((a,b)=>String(b.date).localeCompare(String(a.date)));const rads=db.radiologyOrders.filter(o=>o.patientId===id).sort((a,b)=>String(b.date).localeCompare(String(a.date)));modal(`Patient Record · ${p.id}`,`<div class="patient-record-head"><div><h3>${esc(p.name)}</h3><p>${patientAge(p)} years · ${esc(p.sex||'—')} · DOB ${esc(p.dob||'—')}</p></div>${can('addPatient')?`<button class="secondary" onclick="closeModal();openPatientModal('${p.id}')">Edit Patient</button>`:''}</div><div class="patient-demographics"><div><span>Phone</span><strong>${esc(p.phone||'—')}</strong></div><div><span>Email</span><strong>${esc(p.email||'—')}</strong></div><div><span>Address</span><strong>${esc(p.address||'—')}</strong></div><div><span>Discount</span><strong>${esc(p.discount||'None')}</strong></div></div><div class="record-section"><h3>Consultations</h3>${consults.length?consults.map(c=>`<div class="record-row"><span>${esc(c.date)} · ${esc(c.specialty||'Consultation')} · ${esc(c.doctor||'Unassigned')}</span><strong>${esc(c.status)}</strong><small>${esc(c.assessment||c.chief||'')}${vitalsHasData(c.vitals)?` · ${esc(vitalsSummary(c.vitals))}`:''}</small></div>`).join(''):'<div class="empty">No consultation history.</div>'}</div><div class="record-section"><h3>Laboratory</h3>${labs.length?labs.map(o=>`<div class="record-row"><span>${esc(o.date)} · ${esc(o.id)}</span><strong>${esc(o.status)}</strong><small>${(o.tests||[]).map(esc).join(', ')}</small></div>`).join(''):'<div class="empty">No laboratory history.</div>'}</div><div class="record-section"><h3>Radiology</h3>${rads.length?rads.map(o=>`<div class="record-row"><span>${esc(o.date)} · ${esc(o.id)}</span><strong>${esc(o.status)}</strong><small>${(o.tests||[]).map(esc).join(', ')}</small></div>`).join(''):'<div class="empty">No radiology history.</div>'}</div>`,null,'Close')};
function renderConsultations(){
  const add=can('createConsult')?`<button class="primary" onclick="openConsultModal()">${activeRole==='Receptionist'?'+ Add to Queue':'+ New Consultation'}</button>`:'';
  const todayRows=db.consultations.filter(c=>c.date===today());
  document.getElementById('consultations').innerHTML=`<div class="grid grid-3 kpi-strip">${CONSULT_SPECIALTIES.map(sp=>stat(sp,todayRows.filter(c=>c.specialty===sp).length,'Today')).join('')}</div><div class="section-head"><h2>Consultation Queue & Encounters</h2>${add}</div>${consultationsTable(db.consultations)}<div class="section-head"><h2>Today · Patients per Doctor</h2></div>${doctorCensusTable()}`;
}
function consultationsTable(rows){
  const showAssessment=activeRole!=='Receptionist';const canQueue=can('queueStatus');const canClinical=can('completeConsult');const hasAction=canQueue||canClinical;
  const head=`<th>Queue</th><th>Date</th><th>Patient</th><th>Specialty</th><th>Doctor</th><th>Status</th><th>Vitals</th><th>Chief Complaint</th>${showAssessment?'<th>Assessment</th>':''}${hasAction?'<th>Action</th>':''}`;
  return `<div class="table-wrap"><table class="responsive-table"><thead><tr>${head}</tr></thead><tbody>${rows.map(c=>`<tr><td data-label="Queue"><strong>${esc(c.queueNo||c.id)}</strong><br><span class="muted">${esc(c.id)}</span></td><td data-label="Date">${esc(c.date)}</td><td data-label="Patient"><button class="link-button" onclick="openPatientRecord('${c.patientId}')"><strong>${esc(patientName(c.patientId))}</strong></button></td><td data-label="Specialty"><span class="badge blue">${esc(c.specialty||'—')}</span></td><td data-label="Doctor">${esc(c.doctor||'Unassigned')}</td><td data-label="Status"><span class="badge ${statusBadgeClass(c.status)}">${esc(c.status)}</span></td><td data-label="Vitals"><span class="muted">${esc(vitalsSummary(c.vitals))}</span></td><td data-label="Chief Complaint">${esc(c.chief||'—')}</td>${showAssessment?`<td data-label="Assessment">${esc(c.assessment||'—')}</td>`:''}${hasAction?`<td data-label="Action"><div class="inline-actions">${canQueue?`<button class="small-btn" onclick="openQueueUpdateModal('${c.id}')">Queue & Vitals</button>`:''}${canClinical?`<button class="small-btn primary-mini" onclick="openConsultModal('${c.id}')">${c.status==='Completed'?'Edit':'Open Encounter'}</button>`:''}</div></td>`:''}</tr>`).join('')||'<tr><td colspan="10" class="empty">No consultation encounters.</td></tr>'}</tbody></table></div>`;
}
function doctorOptionsHtml(specialty,selected=''){const docs=activeDoctors(specialty);return `<option value="">Unassigned / next available</option>${docs.map(d=>`<option value="${esc(d.id)}" ${selected===d.id?'selected':''}>${esc(d.name)}</option>`).join('')}`}
function emptyVitals(){return {bpSystolic:'',bpDiastolic:'',heartRate:'',respRate:'',temperature:'',spo2:'',heightCm:'',weightKg:'',bmi:'',painScore:'',notes:''}}
function normalizedVitals(v){return v&&typeof v==='object'?{...emptyVitals(),...v}:emptyVitals()}
function calculateBmi(weightKg,heightCm){const w=Number(weightKg),h=Number(heightCm)/100;return w>0&&h>0?(w/(h*h)).toFixed(1):''}
function vitalsHasData(v){const x=normalizedVitals(v);return ['bpSystolic','bpDiastolic','heartRate','respRate','temperature','spo2','heightCm','weightKg','painScore'].some(k=>String(x[k]||'').trim()!=='')}
function vitalsSummary(v){const x=normalizedVitals(v),parts=[];if(x.bpSystolic||x.bpDiastolic)parts.push(`BP ${x.bpSystolic||'—'}/${x.bpDiastolic||'—'}`);if(x.heartRate)parts.push(`HR ${x.heartRate}`);if(x.respRate)parts.push(`RR ${x.respRate}`);if(x.temperature)parts.push(`T ${x.temperature}°C`);if(x.spo2)parts.push(`SpO₂ ${x.spo2}%`);if(x.weightKg)parts.push(`${x.weightKg} kg`);if(x.heightCm)parts.push(`${x.heightCm} cm`);if(x.bmi)parts.push(`BMI ${x.bmi}`);if(x.painScore!=='')parts.push(`Pain ${x.painScore}/10`);return parts.join(' · ')||'Not recorded'}
function vitalsFields(v={},prefix='v'){const x=normalizedVitals(v);return `${field('BP systolic',prefix+'Bps','number',x.bpSystolic)}${field('BP diastolic',prefix+'Bpd','number',x.bpDiastolic)}${field('Heart rate',''+prefix+'Hr','number',x.heartRate)}${field('Respiratory rate',prefix+'Rr','number',x.respRate)}${field('Temperature (°C)',prefix+'Temp','number',x.temperature)}${field('SpO₂ (%)',prefix+'Spo2','number',x.spo2)}${field('Height (cm)',prefix+'Height','number',x.heightCm)}${field('Weight (kg)',prefix+'Weight','number',x.weightKg)}${field('Pain score (0–10)',prefix+'Pain','number',x.painScore)}<div class="field full"><label>Vitals note (optional)</label><input id="${prefix}Notes" value="${esc(x.notes||'')}" placeholder="e.g. taken seated, repeat BP"></div>`}
function readVitals(prefix='v'){const weightKg=v(prefix+'Weight'),heightCm=v(prefix+'Height');return {bpSystolic:v(prefix+'Bps'),bpDiastolic:v(prefix+'Bpd'),heartRate:v(prefix+'Hr'),respRate:v(prefix+'Rr'),temperature:v(prefix+'Temp'),spo2:v(prefix+'Spo2'),heightCm,weightKg,bmi:calculateBmi(weightKg,heightCm),painScore:v(prefix+'Pain'),notes:v(prefix+'Notes')}}
window.refreshConsultDoctorOptions=function(){const specialty=v('cSpecialty'),sel=document.getElementById('cPractitioner');if(sel)sel.innerHTML=doctorOptionsHtml(specialty,'')};
window.openConsultModal=function(id=''){
  if(id&&!guard('completeConsult'))return;if(!id&&!guard('createConsult'))return;if(!id&&!db.patients.length)return alert('Register a patient before creating a consultation encounter.');
  const existing=id?db.consultations.find(c=>c.id===id):null,receptionist=activeRole==='Receptionist',pId=existing?.patientId||db.patients[0]?.id||'',specialty=existing?.specialty||'Internal Medicine',existingVitals=normalizedVitals(existing?.vitals);
  const intake=receptionist?vitalsFields(existingVitals,'cV'):`<div class="field full"><label>Vitals recorded by Reception</label><div class="summary-box"><strong>${esc(vitalsSummary(existingVitals))}</strong></div></div>`;
  modal(existing?'Consultation Encounter':(receptionist?'Add to Consultation Queue':'New Consultation'),`<div class="form-grid">${patientSelect('cPatient',pId)}<div class="field"><label>Specialty</label><select id="cSpecialty" onchange="refreshConsultDoctorOptions()">${CONSULT_SPECIALTIES.map(x=>`<option ${specialty===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Doctor</label><select id="cPractitioner">${doctorOptionsHtml(specialty,existing?.practitionerId||'')}</select></div>${field('Date','cDate','date',existing?.date||today())}${field('Consultation fee','cFee','number',existing?.fee??500)}<div class="field full"><label>Chief complaint</label><input id="cChief" value="${esc(existing?.chief||'')}"></div>${intake}${!receptionist?`<div class="field full"><label>Assessment / Diagnosis</label><textarea id="cAssessment">${esc(existing?.assessment||'')}</textarea></div><div class="field"><label>Diagnosis code system</label><select id="cDxSystem"><option value="http://hl7.org/fhir/sid/icd-10" ${(existing?.diagnosisCodeSystem||'').includes('icd-10')?'selected':''}>ICD-10</option><option value="http://snomed.info/sct" ${(existing?.diagnosisCodeSystem||'').includes('snomed')?'selected':''}>SNOMED CT</option></select></div><div class="field"><label>Diagnosis code (optional)</label><input id="cDxCode" value="${esc(existing?.diagnosisCode||'')}"></div>`:''}</div>`,()=>{const sp=v('cSpecialty'),practitionerId=v('cPractitioner'),doctor=doctorNameById(practitionerId)||existing?.doctor||'',vitals=receptionist?readVitals('cV'):existingVitals;const intakeStatus=receptionist?(vitalsHasData(vitals)?'Vitals Done':'For Vitals'):'Completed';const record={patientId:v('cPatient'),specialty:sp,practitionerId,doctor,date:v('cDate')||today(),chief:v('cChief'),vitals,assessment:receptionist?(existing?.assessment||''):v('cAssessment'),diagnosisCodeSystem:receptionist?(existing?.diagnosisCodeSystem||'http://hl7.org/fhir/sid/icd-10'):(v('cDxSystem')||existing?.diagnosisCodeSystem||'http://hl7.org/fhir/sid/icd-10'),diagnosisCode:receptionist?(existing?.diagnosisCode||''):(v('cDxCode')||existing?.diagnosisCode||''),fee:+v('cFee')||0,status:intakeStatus};if(existing){Object.assign(existing,record);save(`Updated consultation ${existing.id}`)}else{record.id=nextId('C',db.consultations);record.uuid=newUuid();record.queueNo=nextQueueNo(sp,record.date);db.consultations.unshift(record);save(`Created consultation ${record.id}`)}closeModal()},existing?'Save Encounter':(receptionist?'Add to Queue':'Save Encounter'));
};
window.openQueueUpdateModal=function(id){if(!guard('queueStatus'))return;const c=db.consultations.find(x=>x.id===id);if(!c)return;const cv=normalizedVitals(c.vitals);modal(`Queue & Vitals · ${c.queueNo||c.id}`,`<div class="form-grid"><div class="field"><label>Specialty</label><select id="qSpecialty" onchange="refreshQueueDoctorOptions('${c.practitionerId||''}')">${CONSULT_SPECIALTIES.map(x=>`<option ${c.specialty===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field"><label>Doctor</label><select id="qPractitioner">${doctorOptionsHtml(c.specialty,c.practitionerId||'')}</select></div><div class="field full"><label>Chief complaint</label><input id="qChief" value="${esc(c.chief||'')}"></div>${vitalsFields(cv,'qV')}<div class="field full"><label>Status</label><select id="qStatus">${QUEUE_STATUSES.map(x=>`<option ${c.status===x?'selected':''}>${x}</option>`).join('')}</select></div></div>`,async()=>{const specialty=v('qSpecialty'),practitionerId=v('qPractitioner'),doctor=doctorNameById(practitionerId),chief=v('qChief'),vitals=readVitals('qV');let status=v('qStatus'),queueNo=specialty!==c.specialty?nextQueueNo(specialty,c.date):(c.queueNo||nextQueueNo(specialty,c.date));if(status==='For Vitals'&&vitalsHasData(vitals))status='Vitals Done';if(activeRole==='Receptionist'&&status==='Completed')return alert('Clinical completion should be recorded by the physician.');try{if(window.ACCUBackend?.configured&&activeRole==='Receptionist')await window.ACCUBackend.updateConsultIntake({localId:c.id,specialty,practitionerId,doctor,status,queueNo,chief,vitals});Object.assign(c,{specialty,practitionerId,doctor,status,queueNo,chief,vitals});save(`Updated queue and vitals ${c.id}`);closeModal()}catch(e){alert(e.message||'Unable to update queue and vitals.')}},'Save Intake');};
window.refreshQueueDoctorOptions=function(selected=''){const sel=document.getElementById('qPractitioner');if(sel)sel.innerHTML=doctorOptionsHtml(v('qSpecialty'),selected)};
function renderLab(){
  const canSupplies=['Administrator','Medical Technologist'].includes(activeRole);
  if(!canSupplies) labActiveTab='orders';
  const addOrder=can('createLab')?'<button class="primary" onclick="openLabModal()">+ New Lab Order</button>':'';
  const tabs=canSupplies?`<div class="subtabs"><button class="subtab ${labActiveTab==='orders'?'active':''}" onclick="setLabTab('orders')">Orders</button><button class="subtab ${labActiveTab==='supplies'?'active':''}" onclick="setLabTab('supplies')">Lab Supplies</button></div>`:'';
  const target=document.getElementById('laboratory');
  if(labActiveTab==='supplies'&&canSupplies){
    const low=db.labSupplies.filter(i=>i.qty<=i.reorder).length;
    const expSoon=db.labSupplies.filter(i=>i.expiry&&daysUntil(i.expiry)>=0&&daysUntil(i.expiry)<=90).length;
    target.innerHTML=`${tabs}<div class="grid grid-3 kpi-strip">${stat('Supply Batches',db.labSupplies.length,'Tracked laboratory supply batches')}${stat('Low Stock',low,'At or below reorder level')}${stat('Expiring ≤90 Days',expSoon,'Batches needing attention')}</div><div class="section-head"><div><h2>Laboratory Supplies</h2></div>${can('addLabSupply')?'<button class="primary" onclick="openLabSupplyModal()">+ Add Supply Batch</button>':''}</div>${labSuppliesTable(db.labSupplies)}`;
    return;
  }
  target.innerHTML=`${tabs}<div class="section-head"><h2>Laboratory Orders</h2>${addOrder}</div>${labTable(db.labOrders)}`;
}
window.setLabTab=function(tab){labActiveTab=tab;renderLab()};
function labTable(rows){
  const showAmount=activeRole==='Administrator',showResult=['Administrator','Physician','Medical Technologist'].includes(activeRole);const hasActions=can('labStatus')||can('labResult')||can('sendResultEmail');
  const head=`<th>Order</th><th>Date</th><th>Patient</th><th>Tests</th>${showAmount?'<th>Amount</th>':''}<th>Status</th>${showResult?'<th>Result</th>':''}${hasActions?'<th>Actions</th>':''}`;
  return `<div class="table-wrap"><table class="responsive-table"><thead><tr>${head}</tr></thead><tbody>${rows.map(o=>{const email=patientEmail(o.patientId);return `<tr><td data-label="Order">${o.id}</td><td data-label="Date">${o.date}</td><td data-label="Patient"><strong>${esc(patientName(o.patientId))}</strong>${email?`<br><span class="muted">${esc(email)}</span>`:''}</td><td data-label="Tests">${o.tests.map(t=>`<span class="badge blue">${esc(t)}</span>`).join(' ')}</td>${showAmount?`<td data-label="Amount">${money(o.amount)}</td>`:''}<td data-label="Status"><span class="badge ${statusBadgeClass(o.status)}">${esc(o.status)}</span></td>${showResult?`<td data-label="Result">${(o.resultComponents||[]).length?`<strong>${o.resultComponents.length} structured result${o.resultComponents.length===1?'':'s'}</strong>${o.resultNote?`<br><span class="muted">${esc(o.resultNote)}</span>`:''}`:(o.resultNote?esc(o.resultNote):'<span class="muted">Not encoded</span>')}</td>`:''}${hasActions?`<td data-label="Actions"><div class="inline-actions">${can('labStatus')?labStatusControl(o):''}${can('labResult')?`<button class="small-btn" onclick="openLabResultModal('${o.id}')">Encode Result</button>`:''}${can('sendResultEmail')&&o.status==='Released'&&email?`<button class="small-btn" onclick="emailPatientResult('lab','${o.id}')">Email Result</button>`:''}</div></td>`:''}</tr>`}).join('')||'<tr><td colspan="8" class="empty">No laboratory orders.</td></tr>'}</tbody></table></div>`;
}
window.emailPatientResult=async function(kind,id){if(!guard('sendResultEmail'))return;const label=kind==='lab'?'laboratory result':'radiology report';if(!confirm(`Send this ${label} to the patient email on file?`))return;try{const r=await window.ACCUBackend.sendPatientResult(kind,id);alert(`Sent to ${r?.to||'patient email'}.`)}catch(e){alert(e.message||'Unable to send result email.')}};
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
  document.getElementById('radiology').innerHTML=`<div class="grid grid-3 kpi-strip">${stat('Open Orders',pending,'Not yet final')}${stat('For Reading',forReading,'Ready for interpretation')}${stat('Final Today',finalToday,'Reports completed today')}</div><div class="section-head"><div><h2>Radiology Worklist</h2></div>${add}</div>${radiologyTable(db.radiologyOrders)}`;
}
function radiologyTable(rows){
  const showReport=['Administrator','Physician','Radiologist'].includes(activeRole),hasActions=can('radiologyStatus')||can('radiologyReport')||can('sendResultEmail');
  const head=`<th>Order</th><th>Date</th><th>Patient</th><th>Study</th><th>Status</th>${showReport?'<th>Report</th>':''}${hasActions?'<th>Actions</th>':''}`;
  return `<div class="table-wrap"><table class="responsive-table"><thead><tr>${head}</tr></thead><tbody>${rows.map(o=>{const email=patientEmail(o.patientId);return `<tr><td data-label="Order"><strong>${esc(o.id)}</strong></td><td data-label="Date">${esc(o.date||'')}</td><td data-label="Patient"><strong>${esc(patientName(o.patientId))}</strong>${email?`<br><span class="muted">${esc(email)}</span>`:''}</td><td data-label="Study">${(o.tests||[]).map(t=>`<span class="badge blue">${esc(t)}</span>`).join(' ')}</td><td data-label="Status"><span class="badge ${o.status==='Final'?'green':o.status==='For Reading'||o.status==='Performed'?'amber':'blue'}">${esc(o.status)}</span></td>${showReport?`<td data-label="Report">${o.status==='Final'?`<strong>${esc(o.impression||'Final report')}</strong>${o.reportedBy?`<br><span class="muted">${esc(o.reportedBy)}</span>`:''}`:'<span class="muted">Not final</span>'}</td>`:''}${hasActions?`<td data-label="Actions"><div class="inline-actions">${can('radiologyStatus')?radiologyStatusControl(o):''}${o.status==='Final'&&showReport?`<button class="small-btn" onclick="openRadiologyViewModal('${o.id}')">View Report</button>`:''}${can('radiologyReport')?`<button class="small-btn" onclick="openRadiologyReportModal('${o.id}')">${o.status==='Final'?'Edit Report':'Report'}</button>`:''}${can('sendResultEmail')&&o.status==='Final'&&email?`<button class="small-btn" onclick="emailPatientResult('radiology','${o.id}')">Email Report</button>`:''}</div></td>`:''}</tr>`}).join('')||'<tr><td colspan="7" class="empty">No radiology orders.</td></tr>'}</tbody></table></div>`;
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
  const tabs=`<div class="subtabs"><button class="subtab ${pharmacyActiveTab==='inventory'?'active':''}" onclick="setPharmacyTab('inventory')">Products & Inventory</button><button class="subtab ${pharmacyActiveTab==='returns'?'active':''}" onclick="setPharmacyTab('returns')">Returns & Adjustments</button><button class="subtab ${pharmacyActiveTab==='online'?'active':''}" onclick="setPharmacyTab('online')">Online Orders</button></div>`;
  const target=document.getElementById('pharmacy');
  if(pharmacyActiveTab==='returns'){
    const returns=db.pharmacyReturns||[];
    const refunded=returns.reduce((a,b)=>a+Number(b.refundAmount||0),0);
    target.innerHTML=`${tabs}<div class="grid grid-3 kpi-strip">${stat('Return Records',returns.length,'Documented pharmacy returns')}${stat('Financial Adjustments',money(refunded),'Refund / store-credit value')}${stat('Restocked Units',returns.filter(r=>r.restock).reduce((a,b)=>a+Number(b.qty||0),0),'Returned to saleable inventory')}</div><div class="section-head"><div><h2>Pharmacy Returns</h2></div>${can('pharmacyReturn')?'<button class="primary" onclick="openPharmacyReturnModal()">+ Process Return</button>':''}</div>${pharmacyReturnsTable(returns)}`;
    return;
  }
  if(pharmacyActiveTab==='online'){
    const orders=db.onlineOrders||[];
    const active=orders.filter(o=>!['Completed','Cancelled'].includes(o.status));
    const rx=active.filter(o=>o.requiresPrescriptionReview&&!o.rxApproved).length;
    target.innerHTML=`${tabs}<div class="grid grid-3 kpi-strip">${stat('Active Online Orders',active.length,'Awaiting fulfillment')}${stat('Prescription Review',rx,'Requires pharmacist approval')}${stat('Completed',orders.filter(o=>o.status==='Completed').length,'Storefront orders completed')}</div><div class="section-head"><div><h2>Online Store Orders</h2></div><div class="inline-actions"><button class="secondary" onclick="refreshOnlineOrders()">Refresh Orders</button><a class="secondary button-link" href="store.html" target="_blank" rel="noopener">Open Public Store ↗</a></div></div>${onlineOrdersTable(orders)}`;
    return;
  }
  const add=can('addMedicine')?'<button class="primary" onclick="openMedicineModal()">+ Add Pharmacy Product</button>':'';
  const q=pharmacySearch.trim().toLowerCase();
  const rows=db.inventory.filter(i=>!q||[i.productName,i.generic,i.brand,i.category,i.strength,i.form,i.batch,i.sku,i.barcode,i.supplier].join(' ').toLowerCase().includes(q));
  const showCost=activeRole==='Administrator'||activeRole==='Pharmacist';
  const costHead=showCost?'<th>Cost</th>':'';
  const tableCols=showCost?11:10;
  target.innerHTML=`${tabs}<div class="section-head"><div><h2>Pharmacy Products & Inventory</h2></div><div class="toolbar"><input class="search-input" value="${esc(pharmacySearch)}" placeholder="Search product, generic, brand, category, SKU, batch…" oninput="setPharmacySearch(this.value)">${add}</div></div><div class="table-wrap"><table class="responsive-table"><thead><tr><th>Product</th><th>Type / Category</th><th>Batch / SKU</th><th>Supplier</th><th>Expiry</th><th>Stock</th>${costHead}<th>Selling Price</th><th>Online</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows.map(i=>{const days=i.expiry?daysUntil(i.expiry):9999;const low=i.qty<=i.reorder;const exp=i.expiry&&days<0;const soon=i.expiry&&days>=0&&days<=90;const costCell=showCost?`<td data-label="Cost">${money(i.cost)}</td>`:'';return `<tr><td data-label="Product"><strong>${esc(pharmacyProductName(i))}</strong><br><span class="muted">${esc(pharmacyProductMeta(i)||'—')}</span></td><td data-label="Type / Category"><span class="badge ${isMedicineProduct(i)?'blue':'green'}">${esc(i.productType||'Medicine')}</span><br><span class="muted">${esc(i.category||'—')}</span></td><td data-label="Batch / SKU">${esc(i.batch||i.sku||i.barcode||'—')}</td><td data-label="Supplier">${esc(i.supplier||'—')}</td><td data-label="Expiry">${i.expiry||'—'}</td><td data-label="Stock">${i.qty}<br><span class="muted">Reorder ${i.reorder}</span></td>${costCell}<td data-label="Selling Price">${money(i.sell)}</td><td data-label="Online">${i.onlineEnabled?`<span class="badge green">Published</span>${i.prescriptionRequired?'<br><span class="badge amber">Rx review</span>':''}`:'<span class="muted">Not listed</span>'}</td><td data-label="Status">${exp?'<span class="badge red">Expired</span>':low?'<span class="badge red">Low stock</span>':soon?'<span class="badge amber">Expiring soon</span>':'<span class="badge green">OK</span>'}</td><td data-label="Action">${can('addMedicine')?`<button class="small-btn" onclick="openMedicineModal('${i.id}')">Edit</button>`:'—'}</td></tr>`}).join('')||`<tr><td colspan="${tableCols}" class="empty">No pharmacy products match your search.</td></tr>`}</tbody></table></div>`;
}
window.setPharmacyTab=function(tab){pharmacyActiveTab=tab;showView('pharmacy');renderPharmacy();if(tab==='online')refreshOnlineOrders()};
window.refreshOnlineOrders=async function(){if(!window.ACCUBackend?.configured)return;try{const fresh=await window.ACCUBackend.refreshPharmacyState();db.inventory=fresh.inventory;db.onlineOrders=fresh.onlineOrders;renderPharmacy();updateRoleUI()}catch(e){console.error(e);alert(e.message||'Unable to refresh online orders.')}};
window.setPharmacySearch=function(value){pharmacySearch=value;renderPharmacy();const el=document.querySelector('#pharmacy .search-input');if(el){el.focus();el.setSelectionRange(el.value.length,el.value.length)}};
window.openMedicineModal=function(id=''){
  if(!guard('addMedicine'))return;const existing=id?db.inventory.find(x=>x.id===id):null,type=existing?.productType||'Medicine';
  modal(existing?'Edit Pharmacy Product':'Add Pharmacy Product',`<div class="form-grid"><div class="field"><label>Product type</label><select id="mProductType"><option ${type==='Medicine'?'selected':''}>Medicine</option><option ${type==='Vaccine'?'selected':''}>Vaccine</option><option ${type==='Merchandise'?'selected':''}>Merchandise</option></select></div>${field('Category','mCategory','text',existing?.category||(type==='Vaccine'?'Vaccines':'Medicine'))}${field('Product / display name','mProductName','text',existing?.productName||'')}${field('Generic name','mGeneric','text',existing?.generic||'')}${field('Brand name','mBrand','text',existing?.brand||'')}${field('Strength','mStrength','text',existing?.strength||'')}${field('Dosage form / presentation','mForm','text',existing?.form||'')}${field('Batch / Lot','mBatch','text',existing?.batch||'')}${field('SKU','mSku','text',existing?.sku||'')}${field('Barcode','mBarcode','text',existing?.barcode||'')}${field('Supplier','mSupplier','text',existing?.supplier||'')}${field('Expiry','mExpiry','date',existing?.expiry||'')}${field('Quantity','mQty','number',existing?.qty??0)}${field('Reorder level','mReorder','number',existing?.reorder??20)}${field('Cost per unit','mCost','number',existing?.cost??0)}${field('Selling price','mSell','number',existing?.sell??0)}${field('Storage requirement (vaccine)','mStorage','text',existing?.storageRequirement||'')}${field('Route (vaccine)','mRoute','text',existing?.route||'')}<div class="field"><label>Prescription required?</label><select id="mRx"><option value="no" ${!existing?.prescriptionRequired?'selected':''}>No</option><option value="yes" ${existing?.prescriptionRequired?'selected':''}>Yes</option></select></div><div class="field"><label>Online store</label><select id="mOnline"><option value="no" ${!existing?.onlineEnabled?'selected':''}>Not published</option><option value="yes" ${existing?.onlineEnabled?'selected':''}>Publish online</option></select></div><div class="field full"><label>Online description</label><textarea id="mDescription">${esc(existing?.onlineDescription||'')}</textarea></div><div class="field full"><label>Product image URL</label><input id="mImageUrl" type="url" value="${esc(existing?.imageUrl||'')}"></div></div>`,()=>{const productType=v('mProductType')||'Medicine',generic=v('mGeneric'),productName=v('mProductName')||(['Medicine','Vaccine'].includes(productType)?`${generic} ${v('mStrength')}`.trim():v('mBrand'));if(['Medicine','Vaccine'].includes(productType)&&!generic)return alert('Generic / vaccine name is required.');if(!productName)return alert('Product/display name is required.');const values={productType,productName,category:v('mCategory')||(productType==='Vaccine'?'Vaccines':productType==='Medicine'?'Medicine':'General Merchandise'),generic,brand:v('mBrand'),strength:v('mStrength'),form:v('mForm'),batch:v('mBatch'),sku:v('mSku'),barcode:v('mBarcode'),supplier:v('mSupplier'),expiry:v('mExpiry'),qty:+v('mQty')||0,reorder:+v('mReorder')||0,cost:+v('mCost')||0,sell:+v('mSell')||0,storageRequirement:v('mStorage')||(productType==='Vaccine'?'2–8°C':''),route:v('mRoute'),prescriptionRequired:v('mRx')==='yes',onlineEnabled:v('mOnline')==='yes',onlineDescription:v('mDescription'),imageUrl:v('mImageUrl')};if(existing){Object.assign(existing,values);save(`Updated pharmacy product: ${productName}`)}else{const pid=`PRD-${Date.now()}`;db.inventory.push({id:pid,uuid:newUuid(),localCode:pid,taxClass:'Unclassified',standardCodeSystem:'',standardCode:'',...values});save(`Added pharmacy product: ${productName}`)}closeModal()},existing?'Save Changes':'Add Product');
};
function onlineOrdersTable(rows){
  const sorted=[...rows].sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  return `<div class="table-wrap"><table class="responsive-table"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Fulfillment</th><th>Total</th><th>Rx</th><th>Status</th><th>Actions</th></tr></thead><tbody>${sorted.map(o=>`<tr><td data-label="Order"><strong>${esc(o.id)}</strong><br><span class="muted">${o.createdAt?new Date(o.createdAt).toLocaleString('en-PH'):''}</span></td><td data-label="Customer"><strong>${esc(o.customer?.name||'')}</strong><br><span class="muted">${esc(o.customer?.mobile||'')}</span></td><td data-label="Items">${(o.items||[]).map(i=>`${esc(i.name)} ×${i.qty}`).join('<br>')}</td><td data-label="Fulfillment">${esc(o.fulfillment||'Pickup')}<br><span class="muted">${esc(o.paymentMethod||'')}</span></td><td data-label="Total"><strong>${money(o.total)}</strong></td><td data-label="Rx">${o.requiresPrescriptionReview?(o.rxApproved?'<span class="badge green">Approved</span>':'<span class="badge amber">Review required</span>'):'<span class="muted">Not required</span>'}</td><td data-label="Status"><span class="badge ${o.status==='Completed'?'green':o.status==='Cancelled'?'red':o.status==='Received'?'blue':'amber'}">${esc(o.status||'Received')}</span></td><td data-label="Actions"><div class="inline-actions">${can('approveRxOrder')&&o.requiresPrescriptionReview&&!o.rxApproved?`<button class="small-btn" onclick="approveOnlineOrderRx('${o.id}')">Approve Rx</button>`:''}${can('onlineOrderStatus')?onlineOrderStatusControl(o):''}</div></td></tr>`).join('')||'<tr><td colspan="8" class="empty">No online orders yet.</td></tr>'}</tbody></table></div>`;
}
function onlineOrderStatusControl(o){
  const blocked=o.requiresPrescriptionReview&&!o.rxApproved;
  const statuses=blocked?['Received','Cancelled']:['Received','Preparing','Ready for Pickup','Out for Delivery','Completed','Cancelled'];
  return `<select class="small-select" onchange="setOnlineOrderStatus('${o.id}',this.value)">${statuses.map(s=>`<option ${o.status===s?'selected':''}>${s}</option>`).join('')}</select>`;
}
window.setOnlineOrderStatus=async function(id,status){
  if(!guard('onlineOrderStatus'))return;const o=db.onlineOrders.find(x=>x.id===id);if(!o)return;
  if(o.requiresPrescriptionReview&&!o.rxApproved&&!['Received','Cancelled'].includes(status))return alert('A pharmacist must approve the prescription before this order can move to fulfillment.');
  try{await window.ACCUBackend.updateOnlineOrderState(id,status,null);const fresh=await window.ACCUBackend.refreshPharmacyState();db.inventory=fresh.inventory;db.onlineOrders=fresh.onlineOrders;db.audit.unshift({ts:new Date().toISOString(),user:activeRole,action:`Online order ${id} changed to ${status}`});renderAll();updateRoleUI()}catch(e){alert(e.message||'Unable to update order.');renderPharmacy()}
};
window.approveOnlineOrderRx=async function(id){
  if(!guard('approveRxOrder'))return;const o=db.onlineOrders.find(x=>x.id===id);if(!o)return;if(!confirm('Confirm that an authorized pharmacist has reviewed the prescription requirement for this order?'))return;
  try{await window.ACCUBackend.updateOnlineOrderState(id,o.status||'Received',true);const fresh=await window.ACCUBackend.refreshPharmacyState();db.inventory=fresh.inventory;db.onlineOrders=fresh.onlineOrders;db.audit.unshift({ts:new Date().toISOString(),user:activeRole,action:`Approved prescription review for online order ${id}`});renderAll();updateRoleUI()}catch(e){alert(e.message||'Unable to approve prescription review.');renderPharmacy()}
};



function returnedQtyFor(txnId,refId){return (db.pharmacyReturns||[]).filter(r=>r.transactionId===txnId&&r.refId===refId).reduce((a,b)=>a+Number(b.qty||0),0)}
function pharmacyReturnsTable(rows){return `<div class="table-wrap"><table class="responsive-table"><thead><tr><th>Return Ref.</th><th>Date</th><th>Transaction</th><th>Product</th><th>Qty</th><th>Reason</th><th>Disposition</th><th>Financial Adjustment</th><th>Processed By</th></tr></thead><tbody>${rows.map(r=>`<tr><td data-label="Return Ref."><strong>${esc(r.id)}</strong></td><td data-label="Date">${new Date(r.createdAt).toLocaleString('en-PH')}</td><td data-label="Transaction">${esc(r.officialInvoiceRef||r.transactionId)}</td><td data-label="Product">${esc(r.itemName)}</td><td data-label="Qty">${r.qty}</td><td data-label="Reason">${esc(r.reason)}</td><td data-label="Disposition"><span class="badge ${r.restock?'green':'amber'}">${esc(r.disposition)}</span></td><td data-label="Financial">${r.financialAction==='No Refund'?esc(r.financialAction):`${esc(r.financialAction)} · ${money(r.refundAmount)}`}</td><td data-label="Processed By">${esc(r.operator||'—')}</td></tr>`).join('')||'<tr><td colspan="9" class="empty">No pharmacy returns recorded.</td></tr>'}</tbody></table></div>`}
function returnEligibleTransactions(){return db.transactions.filter(t=>t.entity==='pharmacy'&&(t.items||[]).some(i=>Number(i.qty||0)>returnedQtyFor(t.id,i.refId||i.ref)))}
window.populateReturnItems=function(){const txn=db.transactions.find(t=>t.id===v('retTxn'));const sel=document.getElementById('retItem');if(!sel)return;sel.innerHTML=txn?(txn.items||[]).map((i,idx)=>{const ref=i.refId||i.ref;const left=Math.max(0,Number(i.qty||0)-returnedQtyFor(txn.id,ref));return left?`<option value="${idx}">${esc(i.name)} · ${left} returnable</option>`:''}).join(''):'';updateReturnPreview()};
window.updateReturnPreview=function(){const txn=db.transactions.find(t=>t.id===v('retTxn'));const idx=Number(v('retItem')||0);const line=txn?.items?.[idx];const qty=Math.max(1,Number(v('retQty')||1));if(!txn||!line)return;const factor=Number(txn.subtotal||0)>0?Number(txn.total||0)/Number(txn.subtotal||1):1;const suggested=+(Number(line.price||0)*qty*factor).toFixed(2);const el=document.getElementById('retRefund');if(el&&!el.dataset.touched)el.value=suggested.toFixed(2);const left=Math.max(0,Number(line.qty||0)-returnedQtyFor(txn.id,line.refId||line.ref));const max=document.getElementById('retMax');if(max)max.textContent=`Maximum returnable: ${left}`};
window.openPharmacyReturnModal=function(transactionId=''){
  if(!guard('pharmacyReturn'))return;const eligible=returnEligibleTransactions();if(!eligible.length)return alert('No pharmacy transaction currently has returnable items.');
  const chosen=eligible.find(t=>t.id===transactionId)||eligible[0];
  modal('Process Pharmacy Return',`<div class="notice blue">Link every return to the original pharmacy transaction. Only restore stock when the returned product is verified as saleable under pharmacy policy. This internal return record does not replace any accounting or tax document required by the clinic's procedures.</div><div class="form-grid" style="margin-top:14px"><div class="field full"><label>Original pharmacy transaction</label><select id="retTxn" onchange="populateReturnItems()">${eligible.map(t=>`<option value="${t.id}" ${chosen.id===t.id?'selected':''}>${esc(t.officialInvoiceRef||t.id)} · ${esc(t.buyerName||patientName(t.patientId))} · ${money(t.total)}</option>`).join('')}</select></div><div class="field full"><label>Product</label><select id="retItem" onchange="updateReturnPreview()"></select><small id="retMax" class="muted"></small></div>${field('Quantity to return','retQty','number',1)}<div class="field"><label>Financial action</label><select id="retFinancial" onchange="updateReturnPreview()"><option>Refund</option><option>Store Credit</option><option>No Refund</option></select></div><div class="field"><label>Refund / credit amount</label><input id="retRefund" type="number" min="0" step="0.01" oninput="this.dataset.touched='1'"></div><div class="field"><label>Inventory disposition</label><select id="retDisposition"><option>Quarantine / Do Not Restock</option><option>Restock to Saleable Inventory</option><option>Dispose / Damaged</option></select></div><div class="field full"><label>Return reason</label><input id="retReason" placeholder="e.g. wrong item dispensed, approved unopened return"></div><div class="field full"><label>Notes</label><textarea id="retNotes" placeholder="Condition, authorization, replacement details, etc."></textarea></div></div>`,()=>{const txn=db.transactions.find(t=>t.id===v('retTxn'));const idx=Number(v('retItem')||0);const line=txn?.items?.[idx];if(!txn||!line)return alert('Select an invoice item.');const refId=line.refId||line.ref;const max=Math.max(0,Number(line.qty||0)-returnedQtyFor(txn.id,refId));const qty=Math.max(1,Number(v('retQty')||1));if(qty>max)return alert(`Only ${max} unit(s) remain returnable for this line.`);if(!v('retReason'))return alert('Return reason is required.');const financialAction=v('retFinancial');const refundAmount=financialAction==='No Refund'?0:Math.max(0,Number(v('retRefund')||0));const factor=Number(txn.subtotal||0)>0?Number(txn.total||0)/Number(txn.subtotal||1):1;const maxFinancial=+(Number(line.price||0)*qty*factor).toFixed(2);if(refundAmount>maxFinancial+0.01)return alert(`Financial adjustment cannot exceed ${money(maxFinancial)} for the returned quantity.`);const disposition=v('retDisposition');const restock=disposition==='Restock to Saleable Inventory';if(restock){const med=db.inventory.find(i=>i.id===refId);if(!med)return alert('Original pharmacy product was not found. Do not restock until the inventory record is reconciled.');med.qty+=qty;}const r={id:nextId('RET',db.pharmacyReturns),uuid:newUuid(),transactionId:txn.id,invoiceNo:txn.officialInvoiceRef||'',refId,itemName:line.name,qty,unitPrice:Number(line.price||0),reason:v('retReason'),notes:v('retNotes'),financialAction,refundAmount,disposition,restock,operator:window.ACCUBackend?.status?.profile?.full_name||activeRole,createdAt:new Date().toISOString()};db.pharmacyReturns.unshift(r);const totalSold=(txn.items||[]).reduce((a,i)=>a+Number(i.qty||0),0);const totalReturned=(txn.items||[]).reduce((a,i)=>a+returnedQtyFor(txn.id,i.refId||i.ref),0);txn.returnStatus=totalReturned>=totalSold?'Returned':'Partially Returned';save(`Processed pharmacy return ${r.id} for ${txn.officialInvoiceRef||txn.id}`);closeModal();pharmacyActiveTab='returns';showView('pharmacy')},'Record Return');
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
  const officialInvoiceRef=document.getElementById('officialInvoiceRef');
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
  if(officialInvoiceRef)saleDraft.officialInvoiceRef=officialInvoiceRef.value;
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
    <div class="field full"><label>Official BIR invoice no. <span class="muted">(optional)</span></label><input id="officialInvoiceRef" value="${esc(saleDraft.officialInvoiceRef||'')}" placeholder="Enter the separately issued official invoice number" oninput="saleDraft.officialInvoiceRef=this.value"></div>
  </div>`;
}
function buyerAndDiscountFields(){
  const p=db.patients.find(x=>x.id===saleDraft.patientId);
  return `<details class="invoice-details">
    <summary>Buyer & discount details</summary>
    <div class="form-grid invoice-form">
      <div class="field"><label>Buyer / patient name</label><input id="buyerName" value="${esc(saleDraft.buyerName||'')}" placeholder="${p?esc(p.name):'Optional'}" oninput="saleDraft.buyerName=this.value"></div>
      <div class="field"><label>Discount type</label><select id="discountType" onchange="changeDiscountType(this.value)">${['None','Senior Citizen','PWD','Custom'].map(x=>`<option ${saleDraft.discountType===x?'selected':''}>${x}</option>`).join('')}</select></div>
      <div class="field"><label>Discount ID / reference</label><input id="discountId" value="${esc(saleDraft.discountId||'')}" placeholder="If applicable" oninput="saleDraft.discountId=this.value"></div>
      <div class="field"><label>Discount %</label><input id="discountPercent" type="number" min="0" max="100" step="0.01" value="${esc(saleDraft.discountPercent||'0')}" onchange="saleDraft.discountPercent=this.value;renderPOS()"></div>
    </div>
  </details>`;
}
function renderPOS(){
  if(!canView('pos'))return;
  const entity=currentSaleEntity();
  saleDraft.entity=entity;
  const canChooseEntity=['Administrator','Cashier'].includes(activeRole);
  const services=entity==='clinic'?db.services:[];
  const mq=medicinePosSearch.trim().toLowerCase();
  const medicines=entity==='pharmacy'?db.inventory.filter(i=>i.qty>0&&(!i.expiry||daysUntil(i.expiry)>=0)&&(!mq||[i.productName,i.generic,i.brand,i.category,i.strength,i.form,i.batch,i.sku,i.barcode].join(' ').toLowerCase().includes(mq))).sort((a,b)=>(a.expiry||'9999').localeCompare(b.expiry||'9999')):[];
  const entitySelector=canChooseEntity?`<div class="entity-switch"><span>Transaction entity</span><div class="segmented"><button class="${entity==='clinic'?'active':''}" onclick="changeSaleEntity('clinic')">Clinic / Lab</button><button class="${entity==='pharmacy'?'active':''}" onclick="changeSaleEntity('pharmacy')">Pharmacy</button></div></div>`:`<div class="entity-chip">${entityLabel(entity)}</div>`;
  const serviceCard=services.length?`<div class="card"><div class="section-head"><h2>Clinic & Diagnostic Services</h2></div><div class="catalog">${services.map(s=>`<button class="catalog-item" onclick="addService('${s.id}')"><strong>${esc(s.name)}</strong><span>${s.type} · ${money(s.price)}</span></button>`).join('')}</div></div>`:'';
  const medicineCard=entity==='pharmacy'?`<div class="card"><div class="section-head"><div><h2>Pharmacy Products</h2></div></div><div class="field"><input class="search-input" value="${esc(medicinePosSearch)}" placeholder="Search product, generic, brand, category, SKU…" oninput="setMedicinePosSearch(this.value)"></div><div class="catalog">${medicines.map(i=>`<button class="catalog-item" onclick="addMedicine('${i.id}')"><strong>${esc(pharmacyProductName(i))}</strong><span>${esc(pharmacyProductMeta(i)||'Pharmacy product')}<br>${esc(i.batch||i.sku||'')} · Stock ${i.qty} · ${money(i.sell)}${i.prescriptionRequired?' · Rx':''}</span></button>`).join('')||'<div class="empty">No saleable pharmacy products match your search.</div>'}</div></div>`:'';
  const entityNotice=entity==='pharmacy'?`<div class="notice blue"><strong>Pharmacy transaction.</strong> Pharmacy products are recorded separately from clinic and diagnostic services.</div>`:`<div class="notice blue"><strong>Clinic / diagnostic transaction.</strong> Pharmacy products are recorded separately.</div>`;
  document.getElementById('pos').innerHTML=`${entitySelector}${entityNotice}<div class="pos-layout"><div>${serviceCard}${medicineCard}</div><div class="card"><div class="section-head"><div><h2>${entityLabel(entity)} Transaction</h2></div><button class="ghost" onclick="clearCart()">Clear</button></div><div class="field"><label>Patient / Buyer</label><select id="salePatient" onchange="changeSalePatient(this.value)"><option value="">Walk-in</option>${db.patients.map(p=>`<option value="${p.id}" ${saleDraft.patientId===p.id?'selected':''}>${esc(p.name)} (${p.id})</option>`).join('')}</select></div>${buyerAndDiscountFields()}<div id="cartLines">${cart.length?cart.map((x,idx)=>`<div class="cart-line"><div><strong>${esc(x.name)}</strong><br><span class="muted">${x.kind}</span></div><input type="number" min="1" value="${x.qty}" onchange="updateCartQty(${idx},this.value)"><div>${money(x.price*x.qty)}</div><button class="close-x" onclick="removeCartItem(${idx})">×</button></div>`).join(''):'<div class="empty">Add items to this transaction.</div>'}</div>${saleSummary()}${paymentFields()}<button class="primary checkout-btn" onclick="checkout()" ${cart.length?'':'disabled'}>Complete Transaction</button><p class="transaction-disclaimer">Internal record only. The official BIR invoice, when applicable, is issued separately by ACCU.</p></div></div>`;
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
window.addMedicine=function(id){if(!can('checkout'))return;captureSaleDraft();if(currentSaleEntity()!=='pharmacy')return alert('Switch to Pharmacy billing first.');const m=db.inventory.find(x=>x.id===id);addCartLine({kind:'Pharmacy',refId:m.id,name:pharmacyProductName(m),qty:1,price:m.sell,taxClass:m.taxClass||'Unclassified'});renderPOS()};
function addCartLine(line){const existing=cart.find(x=>x.kind===line.kind&&x.refId===line.refId);if(existing)existing.qty+=1;else cart.push(line)}
window.updateCartQty=function(idx,value){if(!can('checkout'))return;captureSaleDraft();cart[idx].qty=Math.max(1,+value||1);renderPOS()};
window.removeCartItem=function(idx){if(!can('checkout'))return;captureSaleDraft();cart.splice(idx,1);renderPOS()};
window.clearCart=function(){if(!can('checkout'))return;captureSaleDraft();cart=[];saleDraft.tendered='';renderPOS()};
function saleSummary(){
  const x=computeSale();
  return `<div class="summary-box" style="margin-top:14px"><div class="summary-row"><span>Subtotal</span><strong>${money(x.subtotal)}</strong></div>${x.discountAmount?`<div class="summary-row"><span>${esc(saleDraft.discountType)} discount (${Number(saleDraft.discountPercent||0)}%)</span><strong>− ${money(x.discountAmount)}</strong></div>`:''}<div class="summary-row total"><span>Total Amount Due</span><span>${money(x.total)}</span></div></div>`;
}
window.checkout=function(){
  if(!guard('checkout')||!cart.length)return;captureSaleDraft();
  for(const line of cart.filter(x=>x.kind==='Pharmacy')){const inv=db.inventory.find(i=>i.id===line.refId);if(!inv||inv.qty<line.qty)return alert(`Insufficient stock for ${line.name}.`)}
  const entity=currentSaleEntity();
  if(entity==='clinic'&&cart.some(x=>x.kind==='Pharmacy'))return alert('Pharmacy is a separate entity. Remove pharmacy products and record a separate pharmacy transaction.');
  if(entity==='pharmacy'&&cart.some(x=>x.kind!=='Pharmacy'))return alert('Pharmacy is a separate entity. Remove clinic/diagnostic services and record a separate clinic transaction.');
  const sale=computeSale();
  if((saleDraft.discountType==='Senior Citizen'||saleDraft.discountType==='PWD')&&!String(saleDraft.discountId||'').trim()){if(!confirm(`${saleDraft.discountType} discount selected without an ID/reference. Continue?`))return}
  const isCash=saleDraft.payment==='Cash';const tendered=isCash?Number(saleDraft.tendered||0):sale.total;
  if(isCash&&tendered<sale.total)return alert(`Amount tendered is ${money(tendered)}. Please enter at least ${money(sale.total)}.`);
  const change=isCash?Math.max(0,tendered-sale.total):0;
  const items=structuredClone(cart).map(x=>({...x,taxClass:x.taxClass||sourceTaxClass(x)}));
  for(const line of items.filter(x=>x.kind==='Pharmacy'))db.inventory.find(i=>i.id===line.refId).qty-=line.qty;
  const id=nextId('TXN',db.transactions);
  const txn={id,uuid:newUuid(),entity,date:today(),time:new Date().toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'}),patientId:saleDraft.patientId||null,buyerName:saleDraft.buyerName||patientName(saleDraft.patientId),discountType:saleDraft.discountType||'None',discountId:saleDraft.discountId||'',discountPercent:Number(saleDraft.discountPercent||0),subtotal:sale.subtotal,discountAmount:sale.discountAmount,payment:saleDraft.payment,total:sale.total,tendered,change,operator:currentStaffName(),operatorRole:activeRole,operatorUserId:currentStaffUserId(),items,officialInvoiceRef:String(saleDraft.officialInvoiceRef||'').trim(),documentType:'INTERNAL_TRANSACTION_RECORD'};
  db.transactions.unshift(txn);
  cart=[];
  saleDraft={entity:(['Pharmacist','Pharmacy Assistant'].includes(activeRole)?'pharmacy':'clinic'),patientId:'',payment:'Cash',tendered:'',buyerName:'',buyerTin:'',buyerAddress:'',discountType:'None',discountId:'',discountPercent:'0',officialInvoiceRef:''};
  save(`Completed internal transaction ${id} (${money(sale.total)})`);
  showTransactionSummary(txn);
};

function transactionSummaryBody(t){
  const entity=t.entity||'clinic';const org=entityCfg(entity);const buyer=t.buyerName||(t.patientId?patientName(t.patientId):'Walk-in');
  const tendered=Number.isFinite(Number(t.tendered))?Number(t.tendered):Number(t.total||0);const change=Number.isFinite(Number(t.change))?Number(t.change):0;
  return `<div class="internal-transaction-summary"><div class="internal-doc-warning"><strong>INTERNAL TRANSACTION RECORD</strong><span>NOT VALID FOR TAX PURPOSES</span></div><div class="internal-doc-brand">${entity==='clinic'?'<img src="accu-logo.jpeg" alt="ACCU">':''}<h3>${esc(org.name||entityLabel(entity))}</h3>${org.address?`<p>${esc(org.address)}</p>`:''}${org.contact?`<p>${esc(org.contact)}</p>`:''}</div><div class="internal-doc-grid"><div><span>Transaction Ref.</span><strong>${esc(t.id)}</strong></div><div><span>Date</span><strong>${esc(t.date)} ${esc(t.time||'')}</strong></div><div><span>Patient / Buyer</span><strong>${esc(buyer)}</strong></div><div><span>Processed by</span><strong>${esc(t.operator||'Clinic Staff')}</strong></div>${t.officialInvoiceRef?`<div class="wide"><span>Official BIR Invoice Ref.</span><strong>${esc(t.officialInvoiceRef)}</strong></div>`:''}</div><div class="internal-doc-items">${(t.items||[]).map(i=>`<div><span><strong>${esc(i.name)}</strong><small>${i.qty} × ${money(i.price)}</small></span><strong>${money(i.price*i.qty)}</strong></div>`).join('')}</div><div class="internal-doc-totals"><div><span>Subtotal</span><strong>${money(t.subtotal??(Number(t.total||0)+Number(t.discountAmount||0)))}</strong></div>${Number(t.discountAmount||0)>0?`<div><span>${esc(t.discountType||'Discount')} ${Number(t.discountPercent||0)}%</span><strong>− ${money(t.discountAmount)}</strong></div>`:''}<div class="grand"><span>TOTAL</span><strong>${money(t.total)}</strong></div><div><span>Payment</span><strong>${esc(t.payment)}</strong></div>${t.payment==='Cash'?`<div><span>Cash tendered</span><strong>${money(tendered)}</strong></div><div><span>Change</span><strong>${money(change)}</strong></div>`:''}</div><p class="internal-doc-footer">This record is for ACCU internal operations only. It does not replace the official BIR invoice issued separately by the business.</p></div>`;
}
function showTransactionSummary(t){modal(t.reprint?'Transaction Summary':'Transaction Saved',`${transactionSummaryBody(t)}`,null,'Close',`<button class="secondary no-print" onclick="printTransactionSummary('${t.id}')">Print / Save PDF</button>`) }
window.reprintReceipt=function(id){const t=db.transactions.find(x=>x.id===id);if(!t)return alert('Transaction not found.');showTransactionSummary({...t,reprint:true})};
window.printReceipt=function(id){return printTransactionSummary(id)};
window.printTransactionSummary=function(id){
  const t=db.transactions.find(x=>x.id===id);if(!t)return alert('Transaction not found.');const body=transactionSummaryBody(t);const w=window.open('','_blank','width=900,height=900');if(!w)return alert('The print window was blocked. Please allow pop-ups and try again.');
  w.document.open();w.document.write(`<!doctype html><html><head><meta charset="utf-8"><base href="${esc(location.href)}"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(t.id)} · Internal Transaction Summary</title><style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{margin:0;font-family:Arial,Helvetica,sans-serif;color:#122033}.internal-transaction-summary{max-width:760px;margin:0 auto}.internal-doc-warning{text-align:center;border:2px solid #b42318;padding:10px;margin-bottom:20px}.internal-doc-warning strong,.internal-doc-warning span{display:block}.internal-doc-warning span{font-size:12px;margin-top:4px}.internal-doc-brand{text-align:center;margin-bottom:20px}.internal-doc-brand img{max-width:240px;max-height:80px;object-fit:contain}.internal-doc-brand h3{margin:8px 0 3px}.internal-doc-brand p{margin:2px 0;font-size:12px}.internal-doc-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;border-top:1px solid #ccc;border-bottom:1px solid #ccc;padding:12px 0}.internal-doc-grid div{display:flex;justify-content:space-between;gap:12px}.internal-doc-grid .wide{grid-column:1/-1}.internal-doc-grid span{color:#5b6574}.internal-doc-items{margin:18px 0}.internal-doc-items>div{display:flex;justify-content:space-between;gap:20px;padding:8px 0;border-bottom:1px solid #eee}.internal-doc-items small{display:block;color:#5b6574;margin-top:3px}.internal-doc-totals{margin-left:auto;max-width:340px}.internal-doc-totals>div{display:flex;justify-content:space-between;gap:20px;padding:5px 0}.internal-doc-totals .grand{font-size:18px;font-weight:700;border-top:2px solid #122033;margin-top:5px;padding-top:10px}.internal-doc-footer{margin-top:30px;text-align:center;font-size:11px;color:#5b6574}</style></head><body>${body}<script>window.onload=()=>setTimeout(()=>window.print(),250)<\/script></body></html>`);w.document.close();
};

function cashierRowsForCurrentUser(rows){const uid=currentStaffUserId();return activeRole==='Cashier'&&uid?rows.filter(t=>t.operatorUserId===uid||(!t.operatorUserId&&t.operator===currentStaffName())):rows}
function cashierBreakdownTable(rows){const map=new Map();for(const t of rows){const name=t.operator||t.operatorRole||'Unknown';const r=map.get(name)||{name,count:0,total:0,hours:new Map()};r.count++;r.total+=Number(t.total||0);const tm=String(t.time||'');const mt=tm.match(/^(\d{1,2})(?::\d{2})?\s*(AM|PM)?/i);const hr=mt?`${mt[1]} ${String(mt[2]||'').toUpperCase()}`.trim():'--';r.hours.set(hr,(r.hours.get(hr)||0)+Number(t.total||0));map.set(name,r)}return `<div class="table-wrap"><table class="responsive-table"><thead><tr><th>Cashier / Staff</th><th>Transactions</th><th>Total</th><th>Hourly Breakdown</th></tr></thead><tbody>${[...map.values()].map(r=>`<tr><td><strong>${esc(r.name)}</strong></td><td>${r.count}</td><td>${money(r.total)}</td><td>${[...r.hours.entries()].map(([h,a])=>`${esc(h)} · ${money(a)}`).join('<br>')}</td></tr>`).join('')||'<tr><td colspan="4" class="empty">No cashier activity today.</td></tr>'}</tbody></table></div>`}
function renderReports(){
  if(!canView('reports'))return;const allToday=db.transactions.filter(t=>t.date===today()),rows=activeRole==='Cashier'?cashierRowsForCurrentUser(allToday):db.transactions;const todayForSummary=activeRole==='Cashier'?cashierRowsForCurrentUser(allToday):allToday;const rb=transactionRevenueBreakdown(todayForSummary);const txnIds=new Set(todayForSummary.map(t=>t.id));const returnsToday=(db.pharmacyReturns||[]).filter(r=>String(r.createdAt||'').slice(0,10)===today()&&(activeRole!=='Cashier'||txnIds.has(r.transactionId))).reduce((a,b)=>a+Number(b.refundAmount||0),0);rb.pharmacy=Math.max(0,rb.pharmacy-returnsToday);rb.total=Math.max(0,rb.total-returnsToday);
  const cards=`${stat('Consultation',money(rb.consultation),'Today')}${stat('Laboratory',money(rb.laboratory),'Today')}${stat('Radiology',money(rb.radiology),'Today')}${stat('Pharmacy',money(rb.pharmacy),'Net today')}${stat('General Total',money(rb.total),'Today')}`;
  document.getElementById('reports').innerHTML=`<div class="grid grid-5">${cards}</div>${activeRole==='Administrator'?`<div class="section-head"><h2>Cashier Activity · Today</h2></div>${cashierBreakdownTable(allToday)}`:''}<div class="section-head"><h2>${activeRole==='Cashier'?'My Daily Transaction Report':'Transaction Ledger'}</h2>${can('export')?'<div class="inline-actions"><button class="secondary" onclick="exportCSV()">Export CSV</button><button class="secondary" onclick="exportStructuredJSON()">Export JSON</button></div>':''}</div>${transactionsTable(rows)}`;
}
function transactionsTable(rows){return `<div class="table-wrap"><table class="responsive-table"><thead><tr><th>Entity</th><th>Transaction Ref.</th><th>Date</th><th>Buyer / Patient</th><th>Items</th><th>Cashier / Staff</th><th>Payment</th><th>Total</th><th>Actions</th></tr></thead><tbody>${rows.map(t=>`<tr><td><span class="badge ${t.entity==='pharmacy'?'green':'blue'}">${esc(entityLabel(t.entity||'clinic'))}</span></td><td><strong>${esc(t.id)}</strong>${t.officialInvoiceRef?`<br><span class="muted">BIR ref ${esc(t.officialInvoiceRef)}</span>`:''}</td><td>${t.date}<br><span class="muted">${t.time||''}</span></td><td>${esc(t.buyerName||patientName(t.patientId))}</td><td>${(t.items||[]).map(i=>`${esc(i.name)} ×${i.qty}`).join('<br>')}</td><td>${esc(t.operator||t.operatorRole||'—')}</td><td>${esc(t.payment)}</td><td><strong>${money(t.total)}</strong></td><td><div class="inline-actions"><button class="small-btn" onclick="reprintReceipt('${t.id}')">View Summary</button>${t.entity==='pharmacy'&&can('pharmacyReturn')?`<button class="small-btn" onclick="openPharmacyReturnModal('${t.id}')">Return</button>`:''}</div></td></tr>`).join('')||'<tr><td colspan="9" class="empty">No transactions yet.</td></tr>'}</tbody></table></div>`}
window.exportCSV=function(){if(!guard('export'))return;const rows=[['Entity','Transaction Ref','Official BIR Invoice Ref','Date','Buyer/Patient','Discount Type','Discount Amount','Payment','Total'],...db.transactions.map(t=>[entityLabel(t.entity||'clinic'),t.id,t.officialInvoiceRef||'',t.date,t.buyerName||patientName(t.patientId),t.discountType||'None',t.discountAmount||0,t.payment,t.total])];const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='accu-internal-transactions.csv';a.click()};
window.exportStructuredJSON=function(){if(!guard('export'))return;const payload={schema:'ACCU-INTERNAL-TRANSACTIONS-1.0',generatedAt:new Date().toISOString(),disclaimer:'Internal operational export. Not a BIR invoice or electronic-invoicing payload.',transactions:db.transactions.map(t=>({entity:t.entity||'clinic',internalReference:t.id,officialBirInvoiceReference:t.officialInvoiceRef||null,date:t.date,time:t.time,buyer:t.buyerName||patientName(t.patientId),items:t.items,subtotal:t.subtotal??t.total,discount:{type:t.discountType||'None',id:t.discountId||'',rate:Number(t.discountPercent||0),amount:Number(t.discountAmount||0)},total:t.total,payment:{method:t.payment,tendered:t.tendered,change:t.change},operator:t.operator}))};const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));a.download='accu-internal-transactions.json';a.click()};

function taxClassOptions(current){return ['Unclassified','VATable','VAT-exempt','Zero-rated','Non-VAT'].map(x=>`<option value="${x}" ${current===x?'selected':''}>${x}</option>`).join('')}
window.setTaxClass=function(kind,id,value){if(activeRole!=='Administrator')return alert('Administrator access required.');const list=kind==='medicine'?db.inventory:db.services;const row=list.find(x=>x.id===id);if(!row)return;row.taxClass=value;db.audit.unshift({ts:new Date().toISOString(),user:activeRole,action:`Set ${kind} tax classification for ${id} to ${value}`});localStorage.setItem(STORAGE_KEY,JSON.stringify(db))};
function renderTaxMatrix(){const rows=[...db.services.map(x=>({kind:'service',id:x.id,label:`${x.name} (${x.type})`,cls:x.taxClass||'Unclassified'})),...db.inventory.map(x=>({kind:'medicine',id:x.id,label:`${pharmacyProductName(x)} · ${x.batch||x.sku||x.category||''}`,cls:x.taxClass||'Unclassified'}))];return `<div class="table-wrap"><table class="responsive-table"><thead><tr><th>Item / Service</th><th>Type</th><th>Tax Classification</th></tr></thead><tbody>${rows.map(r=>`<tr><td data-label="Item">${esc(r.label)}</td><td data-label="Type">${r.kind==='medicine'?'Pharmacy Product':'Service'}</td><td data-label="Tax Classification"><select class="small-select" onchange="setTaxClass('${r.kind}','${r.id}',this.value)">${taxClassOptions(r.cls)}</select></td></tr>`).join('')}</tbody></table></div>`}

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

function physicianDirectoryPanelHtml(){const rows=activeDoctors().map(p=>`<tr><td><strong>${esc(p.name)}</strong><br><span class="muted">${esc(p.licenseNo||'')}</span></td><td>${esc(p.specialty||'—')}</td><td><span class="badge ${p.active!==false?'green':'red'}">${p.active!==false?'Active':'Inactive'}</span></td><td><button class="small-btn" onclick="openPractitionerModal('${p.id}')">Edit</button></td></tr>`).join('');return `<div class="card" style="margin-bottom:16px"><div class="section-head"><h2>Physician Directory</h2><button class="primary" onclick="openPractitionerModal()">+ Add Physician</button></div><div class="table-wrap"><table class="responsive-table"><thead><tr><th>Physician</th><th>Specialty</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows||'<tr><td colspan="4" class="empty">Add physicians so Reception can assign consultation queues.</td></tr>'}</tbody></table></div></div>`}
window.openPractitionerModal=function(id=''){if(activeRole!=='Administrator')return;const existing=id?db.practitioners.find(p=>p.id===id):null;modal(existing?'Edit Physician':'Add Physician',`<div class="form-grid">${field('Full name','drName','text',existing?.name||'')}<div class="field"><label>Specialty</label><select id="drSpecialty">${CONSULT_SPECIALTIES.map(x=>`<option ${existing?.specialty===x?'selected':''}>${x}</option>`).join('')}</select></div>${field('PRC / license no.','drLicense','text',existing?.licenseNo||'')}<div class="field"><label>Status</label><select id="drActive"><option value="yes" ${existing?.active!==false?'selected':''}>Active</option><option value="no" ${existing?.active===false?'selected':''}>Inactive</option></select></div></div>`,()=>{const name=v('drName');if(!name)return alert('Physician name is required.');const values={name,role:'Physician',specialty:v('drSpecialty'),licenseNo:v('drLicense'),active:v('drActive')==='yes'};if(existing){Object.assign(existing,values);save(`Updated physician ${name}`)}else{const id=`PRAC-${String(db.practitioners.length+1).padStart(3,'0')}`;db.practitioners.push({id,uuid:newUuid(),codeSystem:'',code:'',...values});save(`Added physician ${name}`)}closeModal()},existing?'Save Changes':'Add Physician')};
async function refreshAuthActivity(){const el=document.getElementById('authActivityBody');if(!el||activeRole!=='Administrator')return;try{const rows=await window.ACCUBackend.loadAuthActivity(200);el.innerHTML=rows.map(r=>`<tr><td>${new Date(r.created_at).toLocaleString('en-PH')}</td><td><strong>${esc(r.profile_name||r.profile_email||'Staff')}</strong><br><span class="muted">${esc(r.role||'')}</span></td><td><span class="badge ${r.event==='LOGIN'?'green':'blue'}">${esc(r.event)}</span></td><td>${esc(r.user_agent||'—')}</td></tr>`).join('')||'<tr><td colspan="4" class="empty">No login/logout activity recorded yet.</td></tr>'}catch(e){el.innerHTML=`<tr><td colspan="4"><div class="notice red">${esc(e.message||'Unable to load access history.')}</div></td></tr>`}}
function authActivityPanelHtml(){return `<div class="card" style="margin-bottom:16px"><div class="section-head"><h2>Login / Logout History</h2><button class="secondary" onclick="refreshAuthActivity()">Refresh</button></div><div class="table-wrap"><table class="responsive-table"><thead><tr><th>Time</th><th>Account</th><th>Event</th><th>Device / Browser</th></tr></thead><tbody id="authActivityBody"><tr><td colspan="4" class="muted">Loading…</td></tr></tbody></table></div></div>`}

function renderSettings(){
  if(!canView('settings'))return;
  const c=entityCfg('clinic'),p=entityCfg('pharmacy');
  document.getElementById('settings').innerHTML=`${staffAccountsPanelHtml()}${physicianDirectoryPanelHtml()}${authActivityPanelHtml()}${serviceCatalogPanelHtml()}<div class="grid grid-2"><div class="card"><h2>Clinic / Diagnostics Profile</h2><div class="form-grid"><div class="field full"><label>Display name</label><input id="cfgClinicName" value="${esc(c.name||'')}"></div><div class="field full"><label>Address</label><input id="cfgAddress" value="${esc(c.address||'')}"></div><div class="field full"><label>Contact</label><input id="cfgContact" value="${esc(c.contact||'')}"></div></div></div><div class="card"><h2>Pharmacy Profile</h2><div class="form-grid"><div class="field full"><label>Display name</label><input id="phName" value="${esc(p.name||'')}"></div><div class="field full"><label>Address</label><input id="phAddress" value="${esc(p.address||'')}"></div><div class="field full"><label>Contact</label><input id="phContact" value="${esc(p.contact||'')}"></div></div></div></div><div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="primary" onclick="saveBusinessProfile()">Save Business Profiles</button></div><div class="notice blue" style="margin-top:16px"><strong>Transaction records are internal only.</strong> ACCU issues its official BIR invoice separately. Staff may encode that invoice number as a reference on the internal transaction.</div><div class="section-head"><h2>Audit Log</h2></div><div class="table-wrap"><table class="responsive-table"><thead><tr><th>Timestamp</th><th>User / Role</th><th>Action</th></tr></thead><tbody>${db.audit.slice(0,100).map(a=>`<tr><td data-label="Timestamp">${new Date(a.ts).toLocaleString('en-PH')}</td><td data-label="Role">${esc(a.user)}</td><td data-label="Action">${esc(a.action)}</td></tr>`).join('')}</tbody></table></div>`;
  setTimeout(refreshStaffAccounts,0);setTimeout(refreshAuthActivity,0);
}
window.saveBusinessProfile=function(){
  const c=entityCfg('clinic'),p=entityCfg('pharmacy');
  c.name=v('cfgClinicName')||c.name||'ACCU Laboratory and Diagnostic Center';c.address=v('cfgAddress');c.contact=v('cfgContact');
  p.name=v('phName')||p.name||'ACCU Pharmacy';p.address=v('phAddress');p.contact=v('phContact');
  save('Updated clinic and pharmacy business profiles');alert('Business profiles saved.');
};

function coding(system,code,display){return code?{coding:[{system,code,display}]}:{text:display||''}}
function fhirPatient(p){return {resourceType:'Patient',id:p.uuid,identifier:[{system:'urn:accu:patient-id',value:p.id},...(p.identifiers||[]).filter(x=>x.value&&x.value!==p.id)],name:[{text:p.name}],gender:p.sex==='M'?'male':p.sex==='F'?'female':'unknown',...(p.dob?{birthDate:p.dob}:{}),...((p.phone||p.email)?{telecom:[...(p.phone?[{system:'phone',value:p.phone}]:[]),...(p.email?[{system:'email',value:p.email}]:[])]}:{}),...(p.address?{address:[{text:p.address}]}:{})}}
function fhirOrganization(entity='clinic'){const c=entityCfg(entity);return {resourceType:'Organization',id:c.uuid,identifier:[...(c.tin?[{system:'urn:philippines:bir:tin',value:c.tin+(c.branchCode?`-${c.branchCode}`:'')}]:[])],active:true,name:c.name||entityLabel(entity),alias:c.tradeName&&c.tradeName!==c.name?[c.tradeName]:undefined,telecom:c.contact?[{system:'phone',value:c.contact}]:undefined,address:c.address?[{text:c.address}]:undefined}}
function fhirPractitioner(pr){return {resourceType:'Practitioner',id:pr.uuid,identifier:[{system:'urn:accu:practitioner-id',value:pr.id},...(pr.licenseNo?[{system:'urn:philippines:professional-license',value:pr.licenseNo}]:[])],active:true,name:[{text:pr.name}]}}
function fhirEncounter(c){const p=db.patients.find(x=>x.id===c.patientId);const pr=db.practitioners.find(x=>x.id===c.practitionerId)||db.practitioners.find(x=>x.name===c.doctor);return {resourceType:'Encounter',id:c.uuid,status:c.status==='Completed'?'finished':'in-progress',class:{system:'http://terminology.hl7.org/CodeSystem/v3-ActCode',code:'AMB',display:'ambulatory'},subject:p?{reference:fhirRef('Patient',p.uuid),display:p.name}:undefined,participant:pr?[{individual:{reference:fhirRef('Practitioner',pr.uuid),display:pr.name}}]:undefined,period:{start:`${c.date}T08:00:00+08:00`},reasonCode:c.chief?[{text:c.chief}]:undefined,diagnosis:c.assessment?[{condition:{display:c.assessment},use:c.diagnosisCode?coding(c.diagnosisCodeSystem,c.diagnosisCode,c.assessment):undefined}]:undefined}}
function fhirServiceRequests(o){const p=db.patients.find(x=>x.id===o.patientId);return (o.serviceIds?.length?o.serviceIds.map(id=>db.services.find(s=>s.id===id)).filter(Boolean):(o.tests||[]).map(name=>db.services.find(s=>s.name===name)).filter(Boolean)).map((svc,i)=>({resourceType:'ServiceRequest',id:`${o.uuid}-${i+1}`,status:o.status==='Released'?'completed':'active',intent:'order',code:svc.standardCode?coding(svc.codeSystem||'http://loinc.org',svc.standardCode,svc.name):{text:svc.name},subject:p?{reference:fhirRef('Patient',p.uuid),display:p.name}:undefined,authoredOn:o.date,identifier:[{system:'urn:accu:lab-order',value:o.id}],performer:[{reference:fhirRef('Organization',entityCfg('clinic').uuid),display:entityCfg('clinic').name}] }))}
function fhirObservations(o){const p=db.patients.find(x=>x.id===o.patientId);return (o.resultComponents||[]).map((r,i)=>{const numeric=r.value!==''&&!Number.isNaN(Number(r.value));const obs={resourceType:'Observation',id:r.uuid||`${o.uuid}-obs-${i+1}`,status:o.status==='Released'?'final':'preliminary',code:r.code?coding(r.codeSystem||'http://loinc.org',r.code,r.name):{text:r.name||`Result ${i+1}`},subject:p?{reference:fhirRef('Patient',p.uuid),display:p.name}:undefined,effectiveDateTime:`${o.date}T08:00:00+08:00`,identifier:[{system:'urn:accu:lab-order',value:o.id}]};if(numeric)obs.valueQuantity={value:Number(r.value),...(r.unit?{unit:r.unit,system:'http://unitsofmeasure.org',code:r.unit}:{} )};else if(r.value)obs.valueString=r.value;if(r.low||r.high)obs.referenceRange=[{...(r.low?{low:{value:Number(r.low),unit:r.unit||undefined}}:{}),...(r.high?{high:{value:Number(r.high),unit:r.unit||undefined}}:{})}];if(r.flag)obs.interpretation=[{text:r.flag}];return obs})}
function fhirDiagnosticReport(o,obs,srs){const p=db.patients.find(x=>x.id===o.patientId);return {resourceType:'DiagnosticReport',id:o.uuid,status:o.status==='Released'?'final':'partial',code:{text:(o.tests||[]).join(', ')||'Laboratory report'},subject:p?{reference:fhirRef('Patient',p.uuid),display:p.name}:undefined,basedOn:srs.map(x=>({reference:fhirRef('ServiceRequest',x.id)})),effectiveDateTime:`${o.date}T08:00:00+08:00`,result:obs.map(x=>({reference:fhirRef('Observation',x.id)})),conclusion:o.resultNote||undefined}}
function fhirMedication(m){return {resourceType:'Medication',id:m.uuid,identifier:[{system:'urn:accu:medication-id',value:m.localCode||m.id}],code:m.standardCode?coding(m.standardCodeSystem||'urn:accu:medication-code',m.standardCode,`${m.generic} ${m.strength}`):{text:`${m.generic} ${m.strength}${m.brand?` (${m.brand})`:''}`},form:m.form?{text:m.form}:undefined,batch:{lotNumber:m.batch||undefined,expirationDate:m.expiry||undefined}}}
function buildPatientBundle(patientId){const p=db.patients.find(x=>x.id===patientId);if(!p)return null;const resources=[fhirPatient(p),fhirOrganization('clinic'),fhirOrganization('pharmacy')];const seen=new Set(resources.map(r=>`${r.resourceType}/${r.id}`));const add=r=>{if(r&&!seen.has(`${r.resourceType}/${r.id}`)){resources.push(r);seen.add(`${r.resourceType}/${r.id}`)}};db.consultations.filter(c=>c.patientId===patientId).forEach(c=>{const pr=db.practitioners.find(x=>x.id===c.practitionerId)||db.practitioners.find(x=>x.name===c.doctor);if(pr)add(fhirPractitioner(pr));add(fhirEncounter(c))});db.labOrders.filter(o=>o.patientId===patientId).forEach(o=>{const srs=fhirServiceRequests(o);srs.forEach(add);const obs=fhirObservations(o);obs.forEach(add);add(fhirDiagnosticReport(o,obs,srs))});db.radiologyOrders.filter(o=>o.patientId===patientId).forEach(o=>{(o.serviceIds||[]).map(id=>db.services.find(x=>x.id===id)).filter(Boolean).forEach((svc,i)=>add({resourceType:'ServiceRequest',id:`${o.uuid}-rad-${i+1}`,status:o.status==='Final'?'completed':'active',intent:'order',code:svc.standardCode?coding(svc.codeSystem||'http://loinc.org',svc.standardCode,svc.name):{text:svc.name},subject:{reference:fhirRef('Patient',p.uuid),display:p.name},authoredOn:o.date,identifier:[{system:'urn:accu:radiology-order',value:o.id}]}));if(o.status==='Final')add({resourceType:'DiagnosticReport',id:o.uuid,status:'final',code:{text:(o.tests||[]).join(', ')||'Radiology report'},subject:{reference:fhirRef('Patient',p.uuid),display:p.name},effectiveDateTime:o.reportDate||o.date,conclusion:o.impression||'',presentedForm:o.findings?[{contentType:'text/plain',data:btoa(unescape(encodeURIComponent(o.findings)))}]:undefined})});const meds=new Set;db.transactions.filter(t=>t.entity==='pharmacy'&&t.patientId===patientId).forEach(t=>(t.items||[]).forEach(item=>{const m=db.inventory.find(x=>x.id===(item.refId||item.ref));if(m&&isMedicineProduct(m)&&!meds.has(m.uuid)){add(fhirMedication(m));meds.add(m.uuid)}}));return {resourceType:'Bundle',id:newUuid(),type:'collection',timestamp:new Date().toISOString(),meta:{tag:[{system:'urn:accu:interop',code:'preview',display:'Interoperability preview — not a certified exchange payload'}]},entry:resources.map(resource=>({resource}))}}
function downloadJson(obj,filename){const blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/fhir+json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
let fhirPreviewPatientId='';
window.previewFhir=function(){const id=document.getElementById('interopPatient')?.value||fhirPreviewPatientId||db.patients[0]?.id;if(!id)return;fhirPreviewPatientId=id;const b=buildPatientBundle(id);document.getElementById('fhirPreview').textContent=JSON.stringify(b,null,2)};
window.exportFhir=function(){const id=document.getElementById('interopPatient')?.value||fhirPreviewPatientId||db.patients[0]?.id;const b=buildPatientBundle(id);if(b)downloadJson(b,`ACCU-FHIR-${id}.json`)};
window.saveTerminology=function(){if(!can('interopConfig'))return alert('Administrator access required.');db.services.forEach(x=>{const sys=document.getElementById(`svcSys-${x.id}`),code=document.getElementById(`svcCode-${x.id}`);if(sys)x.codeSystem=sys.value;if(code)x.standardCode=code.value.trim()});db.inventory.filter(isMedicineProduct).forEach(x=>{const sys=document.getElementById(`medSys-${x.id}`),code=document.getElementById(`medCode-${x.id}`);if(sys)x.standardCodeSystem=sys.value;if(code)x.standardCode=code.value.trim()});save('Updated interoperability terminology mappings')};
function renderInterop(){
 const root=document.getElementById('interop');if(!root)return;const pCount=db.patients.filter(x=>x.uuid).length;const svcMapped=db.services.filter(x=>x.standardCode).length;const medMapped=db.inventory.filter(x=>isMedicineProduct(x)&&x.standardCode).length;const structured=db.labOrders.reduce((a,o)=>a+(o.resultComponents||[]).length,0);const admin=can('interopConfig');const patientId=fhirPreviewPatientId||db.patients[0]?.id||'';
 const svcRows=db.services.map(x=>`<tr><td data-label="Local code"><span class="code-pill">${esc(x.localCode||x.id)}</span></td><td data-label="Service"><strong>${esc(x.name)}</strong><br><span class="muted">${esc(x.type)}</span></td><td data-label="Code system"><select id="svcSys-${x.id}" class="small-select" ${admin?'':'disabled'}><option value="" ${!x.codeSystem?'selected':''}>Unmapped / local only</option><option value="http://loinc.org" ${x.codeSystem==='http://loinc.org'?'selected':''}>LOINC</option><option value="http://snomed.info/sct" ${x.codeSystem==='http://snomed.info/sct'?'selected':''}>SNOMED CT</option></select></td><td data-label="Standard code"><input id="svcCode-${x.id}" value="${esc(x.standardCode||'')}" placeholder="Validate before entering" ${admin?'':'disabled'}></td></tr>`).join('');
 const medRows=db.inventory.filter(isMedicineProduct).map(x=>`<tr><td data-label="Local code"><span class="code-pill">${esc(x.localCode||x.id)}</span></td><td data-label="Product"><strong>${esc(x.generic)} ${esc(x.strength)}</strong><br><span class="muted">${esc(x.brand||'No brand')} · ${esc(x.form||'')}</span></td><td data-label="Code system"><select id="medSys-${x.id}" class="small-select" ${admin?'':'disabled'}><option value="" ${!x.standardCodeSystem?'selected':''}>Unmapped / local only</option><option value="http://www.nlm.nih.gov/research/umls/rxnorm" ${x.standardCodeSystem?.includes('rxnorm')?'selected':''}>RxNorm</option><option value="urn:accu:medication-code" ${x.standardCodeSystem==='urn:accu:medication-code'?'selected':''}>Local / other</option></select></td><td data-label="Standard code"><input id="medCode-${x.id}" value="${esc(x.standardCode||'')}" placeholder="Validated code" ${admin?'':'disabled'}></td></tr>`).join('');
 root.innerHTML=`<div class="notice blue"><strong>Interoperability-ready, not interoperability-certified.</strong> This interoperability workspace maps internal data to HL7 FHIR R4-style resources and keeps local + standard terminology fields. Philippine Core FHIR alignment should be validated against the current DOH implementation guide before production integration.</div><div class="grid grid-4" style="margin-top:16px">${stat('Stable Patient IDs',`${pCount}/${db.patients.length}`,'UUID + local MRN')}${stat('Mapped Services',`${svcMapped}/${db.services.length}`,'Standard terminology codes')}${stat('Mapped Medicines',`${medMapped}/${db.inventory.filter(isMedicineProduct).length}`,'Medication terminology')}${stat('Structured Results',structured,'Observation-ready components')}</div><div class="interop-grid" style="margin-top:16px"><div class="card entity-card"><div class="section-head"><div><h2>FHIR Patient Bundle Preview</h2></div></div><div class="field"><label>Patient</label><select id="interopPatient" onchange="fhirPreviewPatientId=this.value;previewFhir()">${db.patients.map(p=>`<option value="${p.id}" ${patientId===p.id?'selected':''}>${esc(p.name)} · ${p.id}</option>`).join('')}</select></div><div class="fhir-actions" style="margin:12px 0"><button class="primary" onclick="previewFhir()">Generate Preview</button><button class="secondary" onclick="exportFhir()">Export FHIR JSON</button></div><pre id="fhirPreview" class="fhir-preview">Select a patient and generate a preview.</pre></div><div class="card"><h2>Readiness Checklist</h2><div class="readiness-list"><div class="readiness-item"><span>Stable technical identifiers</span><strong class="badge green">Implemented</strong></div><div class="readiness-item"><span>Separate Organizations</span><strong class="badge green">Clinic + Pharmacy</strong></div><div class="readiness-item"><span>Patient / Encounter mapping</span><strong class="badge green">FHIR preview</strong></div><div class="readiness-item"><span>Lab ServiceRequest / DiagnosticReport</span><strong class="badge green">FHIR preview</strong></div><div class="readiness-item"><span>Structured Observation components</span><strong class="badge ${structured?'green':'amber'}">${structured?'Available':'Encode results'}</strong></div><div class="readiness-item"><span>Terminology mapping</span><strong class="badge ${svcMapped||medMapped?'amber':'blue'}">Local + optional standard</strong></div><div class="readiness-item"><span>Authenticated FHIR API</span><strong class="badge amber">Production phase</strong></div><div class="readiness-item"><span>DOH / HIE conformance testing</span><strong class="badge amber">Not yet validated</strong></div></div><div class="notice" style="margin-top:14px">The JSON export is for technical mapping review. It is not proof of DOH certification, NHDR integration, or conformance to a production exchange endpoint.</div></div></div><div class="card" style="margin-top:16px"><div class="section-head"><div><h2>Service Terminology Mapping</h2></div>${admin?'<button class="primary" onclick="saveTerminology()">Save Mappings</button>':''}</div><div class="table-wrap"><table class="responsive-table"><thead><tr><th>Local code</th><th>Service</th><th>Code system</th><th>Standard code</th></tr></thead><tbody>${svcRows}</tbody></table></div></div><div class="card" style="margin-top:16px"><div class="section-head"><div><h2>Medication Terminology Mapping</h2></div></div><div class="table-wrap"><table class="responsive-table"><thead><tr><th>Local code</th><th>Product</th><th>Code system</th><th>Standard code</th></tr></thead><tbody>${medRows}</tbody></table></div></div>`;setTimeout(()=>{if(canView('interop'))previewFhir()},0)
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
const communicationBell=document.getElementById('communicationBell');if(communicationBell)communicationBell.onclick=()=>openCommunications('notifications');
const notificationSoundToggle=document.getElementById('notificationSoundToggle');if(notificationSoundToggle)notificationSoundToggle.onclick=window.toggleNotificationSound;
document.addEventListener('pointerdown',unlockNotificationAudio,{once:true});
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
      const hasRemote=(remote.patients?.length||remote.consultations?.length||remote.labOrders?.length||remote.radiologyOrders?.length||remote.inventory?.length||remote.transactions?.length||remote.onlineOrders?.length);
      if(hasRemote){db={...structuredClone(seed),...remote,clinic:{...structuredClone(seed.clinic),...(remote.clinic||{})},pharmacyEntity:{...structuredClone(seed.pharmacyEntity),...(remote.pharmacyEntity||{})},meta:{...structuredClone(seed.meta),...(remote.meta||{})},audit:db.audit||[]};ensureInteropModel(db);}
      else if(activeRole==='Administrator'){await b.syncWorkspace(db,'Initial backend seed',activeRole)}
    }
    const rs=document.getElementById('roleSelect');if(rs){rs.value=activeRole;rs.disabled=true;}
    const reset=document.getElementById('resetLocalData');if(reset)reset.style.display='none';
    if(!document.getElementById('myPasswordBtn')){const btn=document.createElement('button');btn.id='myPasswordBtn';btn.className='ghost';btn.textContent='Change my password';btn.onclick=openMyPasswordModal;document.querySelector('.sidebar-footer').appendChild(btn)}
    if(!document.getElementById('signOutBtn')){const btn=document.createElement('button');btn.id='signOutBtn';btn.className='ghost';btn.textContent='Sign out';btn.onclick=async()=>{await b.unsubscribeCommunications?.();await b.signOut();localStorage.removeItem(STORAGE_KEY);location.reload()};document.querySelector('.sidebar-footer').appendChild(btn)}
    document.getElementById('authGate').hidden=true;renderAll();updateRoleUI();updateBackendBadge('Supabase connected','live');
    const bell=document.getElementById('communicationBell');if(bell)bell.hidden=false;
    const soundBtn=document.getElementById('notificationSoundToggle');if(soundBtn)soundBtn.hidden=false;updateNotificationSoundUI();
    await refreshCommunications({quiet:true});startCommunicationRealtime();
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
