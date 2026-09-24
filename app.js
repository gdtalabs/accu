const STORAGE_KEY = 'accuClinicMvpV1';

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

let db = load();
let cart = [];

function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw){ localStorage.setItem(STORAGE_KEY, JSON.stringify(seed)); return structuredClone(seed); }
  try{return JSON.parse(raw)}catch{return structuredClone(seed)}
}
function save(action){
  if(action) db.audit.unshift({ts:new Date().toISOString(),user:document.getElementById('roleSelect')?.value || 'Administrator',action});
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  renderAll();
}
function money(n){return new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(Number(n||0))}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function today(){return new Date().toISOString().slice(0,10)}
function patientName(id){return db.patients.find(p=>p.id===id)?.name || 'Walk-in'}
function nextId(prefix,list){return `${prefix}-${String(list.length+1).padStart(4,'0')}`}

const titles={dashboard:'Dashboard',patients:'Patient Registry',consultations:'Consultations',laboratory:'Laboratory',pharmacy:'Pharmacy Inventory',pos:'POS / Billing',reports:'Reports',settings:'Admin & Audit Log'};
document.getElementById('todayLabel').textContent = new Date().toLocaleDateString('en-PH',{weekday:'short',year:'numeric',month:'short',day:'numeric'});

document.querySelectorAll('.nav-item').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.view)));
function showView(id){
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));
  document.getElementById('pageTitle').textContent=titles[id];
  if(id==='pos') renderPOS();
}

document.getElementById('quickSaleBtn').onclick=()=>showView('pos');
document.getElementById('resetDemo').onclick=()=>{if(confirm('Reset all demo data?')){localStorage.removeItem(STORAGE_KEY);db=load();cart=[];renderAll();showView('dashboard')}};

function renderDashboard(){
  const revenueToday=db.transactions.filter(t=>t.date===today()).reduce((a,b)=>a+b.total,0);
  const patientsToday=new Set(db.transactions.filter(t=>t.date===today()).map(t=>t.patientId).filter(Boolean)).size;
  const low=db.inventory.filter(i=>i.qty<=i.reorder);
  const soon=db.inventory.filter(i=>{const d=(new Date(i.expiry)-new Date())/86400000; return d>=0&&d<=90});
  const pendingLabs=db.labOrders.filter(o=>o.status!=='Released').length;
  document.getElementById('dashboard').innerHTML=`
    <div class="grid grid-4 kpi-strip">
      ${stat('Today’s Revenue',money(revenueToday),'Across consultation, lab & pharmacy')}
      ${stat('Patients Today',patientsToday,'Unique billed patients')}
      ${stat('Pending Lab Orders',pendingLabs,'Not yet released')}
      ${stat('Low-stock Items',low.length,'At or below reorder level')}
    </div>
    <div class="grid grid-2">
      <div class="card"><div class="section-head"><h2>Operational Alerts</h2></div>
        ${low.length?`<div class="notice red"><strong>Low stock:</strong> ${low.map(x=>`${esc(x.generic)} (${x.qty})`).join(', ')}</div>`:''}
        ${soon.length?`<div class="notice" style="margin-top:10px"><strong>Expiring within 90 days:</strong> ${soon.map(x=>`${esc(x.generic)} – ${x.expiry}`).join(', ')}</div>`:''}
        ${!low.length&&!soon.length?'<div class="empty">No urgent stock or expiry alerts.</div>':''}
      </div>
      <div class="card"><div class="section-head"><h2>Today’s Workflow</h2></div>
        <div class="summary-row"><span>Consultations</span><strong>${db.consultations.filter(c=>c.date===today()).length}</strong></div>
        <div class="summary-row"><span>Lab orders</span><strong>${db.labOrders.filter(c=>c.date===today()).length}</strong></div>
        <div class="summary-row"><span>Transactions</span><strong>${db.transactions.filter(c=>c.date===today()).length}</strong></div>
        <div class="summary-row"><span>Inventory units</span><strong>${db.inventory.reduce((a,b)=>a+b.qty,0)}</strong></div>
      </div>
    </div>
    <div class="section-head"><h2>Recent Transactions</h2><button class="secondary" onclick="showView('pos')">Open POS</button></div>
    ${transactionsTable(db.transactions.slice(0,8))}`;
}
function stat(label,value,sub){return `<div class="card"><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-sub">${sub}</div></div>`}

function renderPatients(){
  document.getElementById('patients').innerHTML=`
    <div class="section-head"><h2>${db.patients.length} registered patients</h2><div class="toolbar"><input id="patientSearch" placeholder="Search patient…"><button class="primary" onclick="openPatientModal()">+ Add Patient</button></div></div>
    <div id="patientsTable">${patientsTable(db.patients)}</div>`;
  document.getElementById('patientSearch').oninput=e=>document.getElementById('patientsTable').innerHTML=patientsTable(db.patients.filter(p=>Object.values(p).join(' ').toLowerCase().includes(e.target.value.toLowerCase())));
}
function patientsTable(rows){return `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Sex</th><th>DOB</th><th>Phone</th><th>Address</th><th>Discount</th></tr></thead><tbody>${rows.map(p=>`<tr><td>${p.id}</td><td><strong>${esc(p.name)}</strong></td><td>${p.sex}</td><td>${p.dob||''}</td><td>${esc(p.phone||'')}</td><td>${esc(p.address||'')}</td><td><span class="badge blue">${esc(p.discount||'None')}</span></td></tr>`).join('')||'<tr><td colspan="7" class="empty">No patients found.</td></tr>'}</tbody></table></div>`}

window.openPatientModal=()=>modal('Add Patient',`
  <div class="form-grid">
    ${field('Full name','pName','text','e.g. Ana Dela Cruz')}${field('Sex','pSex','select',['F','M'])}
    ${field('Date of birth','pDob','date')}${field('Phone','pPhone')}
    <div class="field full"><label>Address</label><input id="pAddress"></div>
    ${field('Discount','pDiscount','select',['None','Senior','PWD'])}
  </div>`,()=>{
    const name=v('pName'); if(!name)return alert('Name is required.');
    db.patients.push({id:nextId('P',db.patients),name,sex:v('pSex'),dob:v('pDob'),phone:v('pPhone'),address:v('pAddress'),discount:v('pDiscount')});save(`Added patient ${name}`);closeModal();
  });

function renderConsultations(){
  document.getElementById('consultations').innerHTML=`<div class="section-head"><h2>Consultation Queue & Encounters</h2><button class="primary" onclick="openConsultModal()">+ New Consultation</button></div>
    <div class="table-wrap"><table><thead><tr><th>Encounter</th><th>Date</th><th>Patient</th><th>Doctor</th><th>Chief Complaint</th><th>Assessment</th><th>Fee</th><th>Status</th></tr></thead><tbody>${db.consultations.map(c=>`<tr><td>${c.id}</td><td>${c.date}</td><td><strong>${esc(patientName(c.patientId))}</strong></td><td>${esc(c.doctor)}</td><td>${esc(c.chief)}</td><td>${esc(c.assessment||'—')}</td><td>${money(c.fee)}</td><td><span class="badge ${c.status==='Completed'?'green':'amber'}">${c.status}</span></td></tr>`).join('')}</tbody></table></div>`;
}
window.openConsultModal=()=>modal('New Consultation',`
  <div class="form-grid">
    ${patientSelect('cPatient')}${field('Doctor','cDoctor','text','Dr. Name')}${field('Date','cDate','date',today())}${field('Consultation fee','cFee','number',500)}
    <div class="field full"><label>Chief complaint</label><input id="cChief"></div>
    <div class="field full"><label>Vitals</label><input id="cVitals" placeholder="BP, PR, RR, Temp"></div>
    <div class="field full"><label>Assessment / Diagnosis</label><textarea id="cAssessment"></textarea></div>
  </div>`,()=>{db.consultations.unshift({id:nextId('C',db.consultations),patientId:v('cPatient'),doctor:v('cDoctor'),date:v('cDate')||today(),chief:v('cChief'),vitals:v('cVitals'),assessment:v('cAssessment'),fee:+v('cFee')||0,status:'Completed'});save('Added consultation encounter');closeModal()});

function renderLab(){
  document.getElementById('laboratory').innerHTML=`<div class="section-head"><h2>Laboratory Orders</h2><button class="primary" onclick="openLabModal()">+ New Lab Order</button></div>
  <div class="table-wrap"><table><thead><tr><th>Order</th><th>Date</th><th>Patient</th><th>Tests</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>${db.labOrders.map(o=>`<tr><td>${o.id}</td><td>${o.date}</td><td><strong>${esc(patientName(o.patientId))}</strong></td><td>${o.tests.map(t=>`<span class="badge blue">${esc(t)}</span>`).join(' ')}</td><td>${money(o.amount)}</td><td><span class="badge ${o.status==='Released'?'green':o.status==='Processing'?'amber':'blue'}">${o.status}</span></td><td><div class="inline-actions">${['For Collection','Collected','Processing','For Validation','Released'].map(s=>`<button class="small-btn" onclick="setLabStatus('${o.id}','${s}')">${s}</button>`).join('')}</div></td></tr>`).join('')}</tbody></table></div>`;
}
window.setLabStatus=(id,status)=>{const o=db.labOrders.find(x=>x.id===id);if(o){o.status=status;save(`Lab order ${id} changed to ${status}`)}};
window.openLabModal=()=>{
  const labServices=db.services.filter(s=>['Laboratory','Diagnostic'].includes(s.type));
  modal('New Laboratory / Diagnostic Order',`<div class="form-grid">${patientSelect('lPatient')}${field('Date','lDate','date',today())}<div class="field full"><label>Tests</label>${labServices.map(s=>`<label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input style="width:auto" type="checkbox" class="labTest" value="${s.id}"> ${esc(s.name)} — ${money(s.price)}</label>`).join('')}</div></div>`,()=>{const ids=[...document.querySelectorAll('.labTest:checked')].map(x=>x.value);if(!ids.length)return alert('Select at least one test.');const tests=ids.map(id=>db.services.find(s=>s.id===id));db.labOrders.unshift({id:nextId('LAB',db.labOrders),patientId:v('lPatient'),date:v('lDate')||today(),tests:tests.map(x=>x.name),status:'For Collection',amount:tests.reduce((a,b)=>a+b.price,0),resultNote:''});save('Created lab order');closeModal()});
};

function renderPharmacy(){
  document.getElementById('pharmacy').innerHTML=`<div class="section-head"><h2>Medicine Inventory</h2><button class="primary" onclick="openMedicineModal()">+ Add Medicine Batch</button></div>
  <div class="table-wrap"><table><thead><tr><th>Medicine</th><th>Batch</th><th>Expiry</th><th>Stock</th><th>Reorder</th><th>Cost</th><th>Selling Price</th><th>Status</th></tr></thead><tbody>${db.inventory.map(i=>{const days=Math.ceil((new Date(i.expiry)-new Date())/86400000);const low=i.qty<=i.reorder;const exp=days<0;const soon=days>=0&&days<=90;return `<tr><td><strong>${esc(i.generic)} ${esc(i.strength)}</strong><br><span class="muted">${esc(i.brand)} · ${esc(i.form)}</span></td><td>${esc(i.batch)}</td><td>${i.expiry}</td><td>${i.qty}</td><td>${i.reorder}</td><td>${money(i.cost)}</td><td>${money(i.sell)}</td><td>${exp?'<span class="badge red">Expired</span>':low?'<span class="badge red">Low stock</span>':soon?'<span class="badge amber">Expiring soon</span>':'<span class="badge green">OK</span>'}</td></tr>`}).join('')}</tbody></table></div>`;
}
window.openMedicineModal=()=>modal('Add Medicine Batch',`<div class="form-grid">${field('Generic name','mGeneric')}${field('Brand','mBrand')}${field('Strength','mStrength')}${field('Dosage form','mForm')}${field('Batch / Lot','mBatch')}${field('Expiry','mExpiry','date')}${field('Quantity','mQty','number',0)}${field('Reorder level','mReorder','number',20)}${field('Cost per unit','mCost','number',0)}${field('Selling price','mSell','number',0)}</div>`,()=>{db.inventory.push({id:`MED-${Date.now()}`,generic:v('mGeneric'),brand:v('mBrand'),strength:v('mStrength'),form:v('mForm'),batch:v('mBatch'),expiry:v('mExpiry'),qty:+v('mQty')||0,reorder:+v('mReorder')||0,cost:+v('mCost')||0,sell:+v('mSell')||0});save('Added medicine batch');closeModal()});

function renderPOS(){
  const services=db.services;
  const medicines=db.inventory.filter(i=>i.qty>0 && new Date(i.expiry)>=new Date());
  document.getElementById('pos').innerHTML=`<div class="pos-layout"><div>
    <div class="card"><div class="section-head"><h2>Services</h2></div><div class="catalog">${services.map(s=>`<button class="catalog-item" onclick="addService('${s.id}')"><strong>${esc(s.name)}</strong><span>${s.type} · ${money(s.price)}</span></button>`).join('')}</div></div>
    <div class="card" style="margin-top:16px"><div class="section-head"><h2>Pharmacy</h2></div><div class="catalog">${medicines.map(i=>`<button class="catalog-item" onclick="addMedicine('${i.id}')"><strong>${esc(i.generic)} ${esc(i.strength)}</strong><span>${esc(i.brand)} · Stock ${i.qty} · ${money(i.sell)}</span></button>`).join('')}</div></div>
  </div><div class="card"><div class="section-head"><h2>Current Bill</h2><button class="ghost" onclick="cart=[];renderPOS()">Clear</button></div>
    <div class="field"><label>Patient</label><select id="salePatient"><option value="">Walk-in</option>${db.patients.map(p=>`<option value="${p.id}">${esc(p.name)} (${p.id})</option>`).join('')}</select></div>
    <div id="cartLines">${cart.length?cart.map((x,idx)=>`<div class="cart-line"><div><strong>${esc(x.name)}</strong><br><span class="muted">${x.kind}</span></div><input type="number" min="1" value="${x.qty}" onchange="cart[${idx}].qty=Math.max(1,+this.value||1);renderPOS()"><div>${money(x.price*x.qty)}</div><button class="close-x" onclick="cart.splice(${idx},1);renderPOS()">×</button></div>`).join(''):'<div class="empty">Add services or medicines to the bill.</div>'}</div>
    ${saleSummary()}
    <div class="field" style="margin-top:12px"><label>Payment method</label><select id="payMethod"><option>Cash</option><option>GCash</option><option>Maya</option><option>Bank Transfer</option><option>Other</option></select></div>
    <button class="primary" style="width:100%;margin-top:12px" onclick="checkout()" ${cart.length?'':'disabled'}>Complete Transaction</button>
  </div></div>`;
}
window.addService=id=>{const s=db.services.find(x=>x.id===id);cart.push({kind:s.type,refId:s.id,name:s.name,qty:1,price:s.price});renderPOS()};
window.addMedicine=id=>{const m=db.inventory.find(x=>x.id===id);cart.push({kind:'Pharmacy',refId:m.id,name:`${m.generic} ${m.strength}`,qty:1,price:m.sell});renderPOS()};
function saleSummary(){const sub=cart.reduce((a,b)=>a+b.price*b.qty,0);return `<div class="summary-box" style="margin-top:14px"><div class="summary-row"><span>Subtotal</span><strong>${money(sub)}</strong></div><div class="summary-row"><span>Discount</span><strong>${money(0)}</strong></div><div class="summary-row total"><span>Total</span><span>${money(sub)}</span></div></div>`}
window.checkout=()=>{
  if(!cart.length)return;
  for(const line of cart.filter(x=>x.kind==='Pharmacy')){const inv=db.inventory.find(i=>i.id===line.refId);if(inv.qty<line.qty)return alert(`Insufficient stock for ${line.name}.`)}
  for(const line of cart.filter(x=>x.kind==='Pharmacy')) db.inventory.find(i=>i.id===line.refId).qty-=line.qty;
  const total=cart.reduce((a,b)=>a+b.price*b.qty,0), id=nextId('TXN',db.transactions);
  const txn={id,date:today(),time:new Date().toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'}),patientId:document.getElementById('salePatient').value||null,payment:document.getElementById('payMethod').value,total,items:structuredClone(cart)};
  db.transactions.unshift(txn);save(`Completed transaction ${id} (${money(total)})`);cart=[];showReceipt(txn);
};
function showReceipt(t){modal('Transaction Complete',`<div class="receipt"><h3>ACCU LABORATORY AND DIAGNOSTIC CENTER</h3><p>Clinic POS Receipt</p><p>${t.date} ${t.time}</p><p>${t.id}</p><hr><p style="text-align:left"><strong>Patient:</strong> ${esc(patientName(t.patientId))}</p><hr>${t.items.map(i=>`<div class="summary-row"><span>${esc(i.name)} ×${i.qty}</span><span>${money(i.price*i.qty)}</span></div>`).join('')}<hr><div class="summary-row total"><span>TOTAL</span><span>${money(t.total)}</span></div><p>Paid via ${esc(t.payment)}</p><p>Thank you.</p></div>`,null,'Close',`<button class="secondary no-print" onclick="window.print()">Print Receipt</button>`)}

function renderReports(){
  const rev=db.transactions.reduce((a,b)=>a+b.total,0);
  const consult=db.transactions.flatMap(t=>t.items).filter(i=>i.kind==='Consultation').reduce((a,b)=>a+b.price*b.qty,0);
  const lab=db.transactions.flatMap(t=>t.items).filter(i=>['Laboratory','Diagnostic'].includes(i.kind)).reduce((a,b)=>a+b.price*b.qty,0);
  const pharm=db.transactions.flatMap(t=>t.items).filter(i=>i.kind==='Pharmacy').reduce((a,b)=>a+b.price*b.qty,0);
  document.getElementById('reports').innerHTML=`<div class="grid grid-4">${stat('Total Revenue',money(rev),'All recorded transactions')}${stat('Consultation',money(consult),'Billed consultation services')}${stat('Laboratory',money(lab),'Lab & diagnostic services')}${stat('Pharmacy',money(pharm),'Dispensed medicines')}</div><div class="section-head"><h2>Transaction Ledger</h2><button class="secondary" onclick="exportCSV()">Export CSV</button></div>${transactionsTable(db.transactions)}`;
}
function transactionsTable(rows){return `<div class="table-wrap"><table><thead><tr><th>Transaction</th><th>Date</th><th>Patient</th><th>Items</th><th>Payment</th><th>Total</th></tr></thead><tbody>${rows.map(t=>`<tr><td>${t.id}</td><td>${t.date}<br><span class="muted">${t.time||''}</span></td><td>${esc(patientName(t.patientId))}</td><td>${t.items.map(i=>`${esc(i.name)} ×${i.qty}`).join('<br>')}</td><td>${esc(t.payment)}</td><td><strong>${money(t.total)}</strong></td></tr>`).join('')||'<tr><td colspan="6" class="empty">No transactions yet.</td></tr>'}</tbody></table></div>`}
window.exportCSV=()=>{const rows=[['Transaction','Date','Patient','Payment','Total'],...db.transactions.map(t=>[t.id,t.date,patientName(t.patientId),t.payment,t.total])];const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='accu-transactions.csv';a.click()};

function renderSettings(){
  document.getElementById('settings').innerHTML=`<div class="grid grid-2"><div class="card"><h2>Clinic Configuration</h2><p class="muted">This MVP stores data in this browser using localStorage. For production, move authentication and data to a secure server/database.</p><div class="summary-row"><span>Patients</span><strong>${db.patients.length}</strong></div><div class="summary-row"><span>Services</span><strong>${db.services.length}</strong></div><div class="summary-row"><span>Medicine batches</span><strong>${db.inventory.length}</strong></div><div class="summary-row"><span>Transactions</span><strong>${db.transactions.length}</strong></div></div><div class="card"><h2>Role Model</h2><p class="muted">Administrator · Receptionist · Physician · Medical Technologist · Pharmacist · Cashier</p><div class="notice">Role switching in this MVP is for interface testing only. Production must enforce permissions server-side.</div></div></div><div class="section-head"><h2>Audit Log</h2></div><div class="table-wrap"><table><thead><tr><th>Timestamp</th><th>User / Role</th><th>Action</th></tr></thead><tbody>${db.audit.slice(0,100).map(a=>`<tr><td>${new Date(a.ts).toLocaleString('en-PH')}</td><td>${esc(a.user)}</td><td>${esc(a.action)}</td></tr>`).join('')}</tbody></table></div>`;
}

function patientSelect(id){return `<div class="field"><label>Patient</label><select id="${id}">${db.patients.map(p=>`<option value="${p.id}">${esc(p.name)} (${p.id})</option>`).join('')}</select></div>`}
function field(label,id,type='text',arg=''){
  if(type==='select') return `<div class="field"><label>${label}</label><select id="${id}">${arg.map(o=>`<option>${o}</option>`).join('')}</select></div>`;
  return `<div class="field"><label>${label}</label><input id="${id}" type="${type}" ${arg!==''?`value="${esc(arg)}"`:''}></div>`
}
function v(id){return document.getElementById(id)?.value?.trim()||''}
function modal(title,body,onSave,saveText='Save',extra=''){
  document.getElementById('modalRoot').innerHTML=`<div class="modal-backdrop" onclick="if(event.target===this)closeModal()"><div class="modal"><div class="modal-head"><h3>${title}</h3><button class="close-x" onclick="closeModal()">×</button></div><div class="modal-body">${body}</div><div class="modal-foot">${extra}<button class="ghost" onclick="closeModal()">${onSave?'Cancel':saveText}</button>${onSave?`<button id="modalSave" class="primary">${saveText}</button>`:''}</div></div></div>`;
  if(onSave)document.getElementById('modalSave').onclick=onSave;
}
window.closeModal=()=>document.getElementById('modalRoot').innerHTML='';

function renderAll(){renderDashboard();renderPatients();renderConsultations();renderLab();renderPharmacy();renderPOS();renderReports();renderSettings()}
renderAll();
