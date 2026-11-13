(function(){
  const cfg=window.ACCU_CONFIG||{};
  const configured=!!(cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY&&window.supabase?.createClient);
  const client=configured?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
  const status={mode:configured?'supabase':'unconfigured',user:null,profile:null,lastSync:null,error:null};
  async function getProfile(){
    if(!client)return null;
    const {data:{user},error}=await client.auth.getUser(); if(error||!user){status.user=null;status.profile=null;return null}
    status.user=user;
    const {data,error:pe}=await client.from('profiles').select('*').eq('user_id',user.id).single();
    if(pe) throw pe;
    if(data && data.active===false){
      await client.auth.signOut();
      status.user=null;status.profile=null;
      throw new Error('This staff account is disabled. Contact the administrator.');
    }
    status.profile=data; return data;
  }
  async function logAuthActivity(event,metadata={}){
    if(!client||!status.user||!status.profile)return false;
    const row={user_id:status.user.id,profile_email:status.profile.email||status.user.email||'',profile_name:status.profile.full_name||'',role:status.profile.role||'',event,user_agent:navigator.userAgent||'',metadata};
    const {error}=await client.from('auth_activity_logs').insert(row);if(error){console.warn('Auth activity log skipped',error.message);return false}return true;
  }
  async function signIn(email,password){
    const {error}=await client.auth.signInWithPassword({email,password});
    if(error)throw error;
    const profile=await getProfile();
    await logAuthActivity('LOGIN',{source:'web'});
    return profile;
  }
  async function signOut(){if(client&&status.user){await logAuthActivity('LOGOUT',{source:'web'});await client.auth.signOut()}status.user=null;status.profile=null}
  async function fetchMedicineRows(){
    const role=status.profile?.role||'';
    if(role==='Pharmacy Assistant'){
      const {data,error}=await client.rpc('get_pharmacy_inventory_for_current_user');
      if(error)throw error;
      return data||[];
    }
    const {data,error}=await client.from('medicines').select('*').order('created_at',{ascending:true});
    if(error)throw error;
    return data||[];
  }
  async function loadWorkspace(){
    if(!client)return null;
    const tables=['patients','practitioners','encounters','lab_orders','radiology_orders','services','lab_supplies','lab_supply_movements','transactions','pharmacy_returns','online_orders'];
    const out={};
    for(const t of tables){const {data,error}=await client.from(t).select('*').order('created_at',{ascending:true});if(error){out[t]=[];continue}out[t]=data||[]}
    try{out.medicines=await fetchMedicineRows()}catch(e){console.warn('Medicine inventory load skipped',e.message);out.medicines=[]}
    const {data:settings,error:se}=await client.from('app_settings').select('*');if(se)throw se;
    const get=(k,fallback)=>settings?.find(x=>x.key===k)?.value||fallback;
    return {
      patients:out.patients.map(x=>x.data), practitioners:out.practitioners.map(x=>x.data), consultations:out.encounters.map(x=>x.data), labOrders:out.lab_orders.map(x=>x.data), radiologyOrders:out.radiology_orders.map(x=>x.data), services:out.services.map(x=>x.data), inventory:out.medicines.map(x=>x.data), labSupplies:out.lab_supplies.map(x=>x.data), labSupplyMovements:out.lab_supply_movements.map(x=>x.data), transactions:out.transactions.map(x=>x.data), pharmacyReturns:out.pharmacy_returns.map(x=>x.data), onlineOrders:out.online_orders.map(x=>x.data), clinic:get('clinic',{}), pharmacyEntity:get('pharmacyEntity',{}), meta:get('meta',{}), audit:[]
    };
  }
  async function upsertRows(table,rows,options={}){
    if(!rows.length)return true;
    const {error}=await client.from(table).upsert(rows,{onConflict:'local_id',ignoreDuplicates:!!options.ignoreDuplicates});
    if(error){console.warn('Supabase sync skipped',table,error.message);return false}
    return true;
  }
  async function syncStoreCatalog(inventory){
    if(!client)return;
    const rows=(inventory||[]).map(p=>({
      inventory_local_id:p.id,
      name:(p.productType||'Medicine')==='Medicine'?`${p.generic||p.productName||''}${p.strength?` ${p.strength}`:''}`.trim():(p.productName||p.brand||p.generic||p.id),
      generic_name:p.generic||'', brand_name:p.brand||'', category:p.category||'', product_type:p.productType||'Medicine',
      price:Number(p.sell||0), image_url:p.imageUrl||'', description:p.onlineDescription||'', prescription_required:!!p.prescriptionRequired,
      online_enabled:!!p.onlineEnabled, available:Number(p.qty||0)>0&&(!p.expiry||new Date(`${p.expiry}T23:59:59`)>=new Date()), updated_at:new Date().toISOString()
    }));
    if(!rows.length)return;
    const {error}=await client.from('store_products').upsert(rows,{onConflict:'inventory_local_id'});
    if(error)console.warn('Store catalog sync skipped',error.message);
  }
  async function syncStockQuantities(inventory){
    for(const p of inventory||[]){
      const {error}=await client.rpc('update_pharmacy_stock_qty',{p_local_id:p.id,p_qty:Number(p.qty||0)});
      if(error)console.warn('Stock quantity sync skipped',p.id,error.message);
    }
  }
  async function updateOnlineOrderState(orderId,statusValue,rxApproved=null){
    if(!client)throw new Error('Supabase is not configured.');
    const {data,error}=await client.rpc('update_online_order_state',{p_local_id:orderId,p_status:statusValue,p_rx_approved:rxApproved});
    if(error)throw error;
    return data||null;
  }
  async function refreshPharmacyState(){
    if(!client)throw new Error('Supabase is not configured.');
    const [medicineRows,o]=await Promise.all([
      fetchMedicineRows(),
      client.from('online_orders').select('*').order('created_at',{ascending:true})
    ]);
    if(o.error)throw o.error;
    return {inventory:(medicineRows||[]).map(x=>x.data),onlineOrders:(o.data||[]).map(x=>x.data)};
  }
  async function syncWorkspace(db,action,role){
    if(!client)return;
    const appRole=role||status.profile?.role||'Unknown';
    const rows=(arr,extra={})=>(arr||[]).map(x=>({local_id:x.id||x.localId||crypto.randomUUID(),stable_uuid:x.uuid||null,data:x,...extra}));
    const full=(table,arr)=>upsertRows(table,rows(arr));
    const insertOnly=(table,arr)=>upsertRows(table,rows(arr),{ignoreDuplicates:true});

    if(appRole==='Administrator'){
      await full('patients',db.patients); await full('practitioners',db.practitioners); await full('encounters',db.consultations);
      await full('lab_orders',db.labOrders); await full('radiology_orders',db.radiologyOrders); await full('services',db.services);
      await full('medicines',db.inventory); await full('lab_supplies',db.labSupplies); await full('lab_supply_movements',db.labSupplyMovements);
      await full('transactions',db.transactions); await full('pharmacy_returns',db.pharmacyReturns); await syncStoreCatalog(db.inventory);
      for(const [key,value] of Object.entries({clinic:db.clinic,pharmacyEntity:db.pharmacyEntity,meta:db.meta})){
        const {error}=await client.from('app_settings').upsert({key,value},{onConflict:'key'}); if(error)console.warn('Settings sync skipped',key,error.message);
      }
    }else if(appRole==='Receptionist'){
      await full('patients',db.patients); await insertOnly('encounters',db.consultations); await insertOnly('lab_orders',db.labOrders); await insertOnly('radiology_orders',db.radiologyOrders);
    }else if(appRole==='Physician'){
      await full('encounters',db.consultations); await insertOnly('lab_orders',db.labOrders); await insertOnly('radiology_orders',db.radiologyOrders);
    }else if(appRole==='Medical Technologist'){
      await full('lab_orders',db.labOrders); await full('lab_supplies',db.labSupplies); await full('lab_supply_movements',db.labSupplyMovements);
    }else if(appRole==='Radiologic Technologist'||appRole==='Radiologist'){
      await full('radiology_orders',db.radiologyOrders);
    }else if(appRole==='Pharmacist'){
      await full('medicines',db.inventory); await insertOnly('transactions',db.transactions); await insertOnly('pharmacy_returns',db.pharmacyReturns); await syncStoreCatalog(db.inventory);
    }else if(appRole==='Pharmacy Assistant'){
      await syncStockQuantities(db.inventory); await insertOnly('transactions',db.transactions); await insertOnly('pharmacy_returns',db.pharmacyReturns);
    }else if(appRole==='Cashier'){
      await full('transactions',db.transactions);
    }
    if(action){const {error}=await client.from('audit_logs').insert({action,actor_role:appRole});if(error)console.warn('Audit sync failed',error.message)}
    status.lastSync=new Date().toISOString(); status.error=null;
  }
  async function listProfiles(){
    if(!client)return [];
    const {data,error}=await client.from('profiles')
      .select('user_id,email,full_name,role,active,must_change_password,password_changed_at,created_at,updated_at')
      .order('full_name',{ascending:true});
    if(error)throw error;
    return data||[];
  }
  async function invokeStaffManager(payload){
    if(!client)throw new Error('Supabase is not configured.');
    const {data,error}=await client.functions.invoke('manage-staff-user',{body:payload});
    if(error)throw error;
    if(data?.error)throw new Error(data.error);
    return data;
  }
  async function createStaffUser({email,fullName,role,temporaryPassword}){
    return invokeStaffManager({action:'create',email,fullName,role,temporaryPassword});
  }
  async function resetStaffPassword(userId,temporaryPassword){
    return invokeStaffManager({action:'reset-password',userId,temporaryPassword});
  }
  async function updateStaffProfile(userId,patch){
    if(!client)throw new Error('Supabase is not configured.');
    const allowed={};
    if(typeof patch.full_name==='string')allowed.full_name=patch.full_name;
    if(typeof patch.role==='string')allowed.role=patch.role;
    if(typeof patch.active==='boolean')allowed.active=patch.active;
    allowed.updated_at=new Date().toISOString();
    const {error}=await client.from('profiles').update(allowed).eq('user_id',userId);
    if(error)throw error;
    return true;
  }
  async function changeOwnPassword(newPassword,currentPassword){
    if(!client)throw new Error('Supabase is not configured.');
    if(!newPassword || newPassword.length<10)throw new Error('New password must be at least 10 characters.');
    const attributes={password:newPassword};
    if(currentPassword)attributes.current_password=currentPassword;
    const {error}=await client.auth.updateUser(attributes);
    if(error)throw error;
    const {error:rpcError}=await client.rpc('complete_first_login_password_change');
    if(rpcError)throw rpcError;
    if(status.profile){
      status.profile.must_change_password=false;
      status.profile.password_changed_at=new Date().toISOString();
    }
    return true;
  }
  async function updateConsultQueue({localId,specialty,practitionerId,doctor,status:queueStatus,queueNo}){
    if(!client)throw new Error('Backend not connected.');
    const {data,error}=await client.rpc('reception_update_encounter_queue',{p_local_id:localId,p_specialty:specialty,p_practitioner_id:practitionerId||'',p_doctor:doctor||'',p_status:queueStatus,p_queue_no:queueNo||''});
    if(error)throw error;return data;
  }
  async function updateConsultIntake({localId,specialty,practitionerId,doctor,status:queueStatus,queueNo,chief,vitals}){
    if(!client)throw new Error('Backend not connected.');
    const {data,error}=await client.rpc('reception_update_encounter_intake',{p_local_id:localId,p_specialty:specialty,p_practitioner_id:practitionerId||'',p_doctor:doctor||'',p_status:queueStatus,p_queue_no:queueNo||'',p_chief:chief||'',p_vitals:vitals||{}});
    if(error)throw error;return data;
  }
  async function loadAuthActivity(limit=200){
    if(!client)return [];
    const {data,error}=await client.from('auth_activity_logs').select('*').order('created_at',{ascending:false}).limit(limit);
    if(error)throw error;return data||[];
  }
  async function sendPatientResult(kind,localId){
    if(!client)throw new Error('Backend not connected.');
    const {data,error}=await client.functions.invoke('send-patient-result',{body:{kind,localId}});
    if(error)throw error;if(data?.error)throw new Error(data.error);return data;
  }
  async function loadCommunications(){
    if(!client||!status.user)return {notifications:[],reads:[],messages:[]};
    const [n,r,m]=await Promise.all([
      client.from('notifications').select('*').order('created_at',{ascending:false}).limit(120),
      client.from('notification_reads').select('*').eq('user_id',status.user.id),
      client.from('department_messages').select('*').order('created_at',{ascending:false}).limit(120)
    ]);
    if(n.error)throw n.error;if(r.error)throw r.error;if(m.error)throw m.error;
    return {notifications:n.data||[],reads:r.data||[],messages:m.data||[]};
  }
  async function markNotificationRead(notificationId,acknowledge=false){
    if(!client||!status.user)throw new Error('Sign in required.');
    const now=new Date().toISOString();
    const row={notification_id:notificationId,user_id:status.user.id,read_at:now};
    if(acknowledge)row.acknowledged_at=now;
    const {error}=await client.from('notification_reads').upsert(row,{onConflict:'notification_id,user_id'});
    if(error)throw error;return true;
  }
  async function markAllNotificationsRead(notificationIds=[]){
    if(!client||!status.user)return false;
    const now=new Date().toISOString();
    const rows=(notificationIds||[]).map(id=>({notification_id:id,user_id:status.user.id,read_at:now}));
    if(!rows.length)return true;
    const {error}=await client.from('notification_reads').upsert(rows,{onConflict:'notification_id,user_id'});
    if(error)throw error;return true;
  }
  async function sendDepartmentMessage({targetDepartment,subject,body,contextType='',contextLocalId='',replyTo=null}){
    if(!client||!status.user||!status.profile)throw new Error('Sign in required.');
    const payload={target_department:targetDepartment,sender_user_id:status.user.id,sender_role:status.profile.role,subject:subject||'',body:body||'',context_type:contextType||'',context_local_id:contextLocalId||'',reply_to:replyTo||null};
    const {data,error}=await client.from('department_messages').insert(payload).select().single();
    if(error)throw error;return data;
  }
  let communicationsChannel=null;
  function subscribeCommunications(onChange){
    if(!client||communicationsChannel)return communicationsChannel;
    communicationsChannel=client.channel(`accu-communications-${status.user?.id||'staff'}`)
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications'},payload=>onChange?.('notification',payload.new))
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'department_messages'},payload=>onChange?.('message',payload.new))
      .subscribe();
    return communicationsChannel;
  }
  async function unsubscribeCommunications(){if(client&&communicationsChannel){await client.removeChannel(communicationsChannel);communicationsChannel=null}}
  window.ACCUBackend={configured,client,status,getProfile,signIn,signOut,loadWorkspace,syncWorkspace,listProfiles,createStaffUser,resetStaffPassword,updateStaffProfile,changeOwnPassword,updateOnlineOrderState,refreshPharmacyState,updateConsultQueue,updateConsultIntake,loadAuthActivity,sendPatientResult,loadCommunications,markNotificationRead,markAllNotificationsRead,sendDepartmentMessage,subscribeCommunications,unsubscribeCommunications};
})();
