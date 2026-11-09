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
  async function signIn(email,password){
    const {error}=await client.auth.signInWithPassword({email,password});
    if(error)throw error;
    return getProfile();
  }
  async function signOut(){if(client)await client.auth.signOut();status.user=null;status.profile=null}
  async function loadWorkspace(){
    if(!client)return null;
    const tables=['patients','practitioners','encounters','lab_orders','radiology_orders','services','medicines','lab_supplies','lab_supply_movements','transactions','pharmacy_returns'];
    const out={};
    for(const t of tables){const {data,error}=await client.from(t).select('*').order('created_at',{ascending:true});if(error){out[t]=[];continue}out[t]=data||[]}
    const {data:settings,error:se}=await client.from('app_settings').select('*');if(se)throw se;
    const get=(k,fallback)=>settings?.find(x=>x.key===k)?.value||fallback;
    return {
      patients:out.patients.map(x=>x.data), practitioners:out.practitioners.map(x=>x.data), consultations:out.encounters.map(x=>x.data), labOrders:out.lab_orders.map(x=>x.data), radiologyOrders:out.radiology_orders.map(x=>x.data), services:out.services.map(x=>x.data), inventory:out.medicines.map(x=>x.data), labSupplies:out.lab_supplies.map(x=>x.data), labSupplyMovements:out.lab_supply_movements.map(x=>x.data), transactions:out.transactions.map(x=>x.data), pharmacyReturns:out.pharmacy_returns.map(x=>x.data), clinic:get('clinic',{}), pharmacyEntity:get('pharmacyEntity',{}), meta:get('meta',{}), audit:[]
    };
  }
  async function upsertRows(table,rows,options={}){
    if(!rows.length)return true;
    const {error}=await client.from(table).upsert(rows,{onConflict:'local_id',ignoreDuplicates:!!options.ignoreDuplicates});
    if(error){console.warn('Supabase sync skipped',table,error.message);return false}
    return true;
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
      await full('transactions',db.transactions); await full('pharmacy_returns',db.pharmacyReturns);
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
      await full('medicines',db.inventory); await full('transactions',db.transactions); await insertOnly('pharmacy_returns',db.pharmacyReturns);
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
  window.ACCUBackend={configured,client,status,getProfile,signIn,signOut,loadWorkspace,syncWorkspace,listProfiles,createStaffUser,resetStaffPassword,updateStaffProfile,changeOwnPassword};
})();
