(() => {
  const cfg=window.ACCU_CONFIG||{};
  const ready=!!(cfg.SUPABASE_URL&&cfg.SUPABASE_ANON_KEY&&window.supabase?.createClient);
  const client=ready?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
  const peso=n=>new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(Number(n||0));
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const CART_KEY='accuOnlineStoreCartV1';
  let products=[];
  let cart=[];
  try{cart=JSON.parse(localStorage.getItem(CART_KEY)||'[]')}catch{cart=[]}

  const el=id=>document.getElementById(id);
  const saveCart=()=>{localStorage.setItem(CART_KEY,JSON.stringify(cart));renderCart();};
  const productById=id=>products.find(p=>p.inventory_local_id===id);

  async function loadProducts(){
    if(!ready){showNotice('Online store is not configured yet. Add the Supabase Project URL and publishable key in config.js.');return}
    el('productGrid').innerHTML='<div class="empty">Loading pharmacy products…</div>';
    const {data,error}=await client.from('store_products').select('*').eq('online_enabled',true).eq('available',true).order('category',{ascending:true}).order('name',{ascending:true});
    if(error){showNotice('Unable to load the online catalog. Please try again later.');el('productGrid').innerHTML='';return}
    products=data||[];
    cart=cart.filter(c=>products.some(p=>p.inventory_local_id===c.inventoryRef));
    saveCart();
    populateCategories();
    renderProducts();
  }
  function showNotice(msg){const n=el('storeNotice');n.hidden=false;n.textContent=msg}
  function populateCategories(){
    const cats=[...new Set(products.map(p=>p.category).filter(Boolean))].sort();
    el('categoryFilter').innerHTML='<option value="">All categories</option>'+cats.map(c=>`<option>${esc(c)}</option>`).join('');
  }
  function renderProducts(){
    const q=el('storeSearch').value.trim().toLowerCase(),cat=el('categoryFilter').value;
    const rows=products.filter(p=>(!cat||p.category===cat)&&(!q||[p.name,p.generic_name,p.brand_name,p.category,p.product_type,p.description].join(' ').toLowerCase().includes(q)));
    el('productGrid').innerHTML=rows.map(p=>`<article class="product-card"><div class="product-image">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=&quot;product-placeholder&quot;>🛍️</div>'">`:`<div class="product-placeholder">${p.product_type==='Medicine'?'💊':'🛍️'}</div>`}</div><div class="product-body"><div class="product-meta"><span class="tag">${esc(p.category||p.product_type)}</span>${p.prescription_required?'<span class="tag rx">Rx review</span>':''}</div><h3>${esc(p.name)}</h3><div class="brand">${esc([p.generic_name,p.brand_name].filter(Boolean).join(' · ')||p.product_type)}</div><div class="description">${esc(p.description||'Available from ACCU Pharmacy.')}</div><div class="product-footer"><span class="price">${peso(p.price)}</span><button class="add-btn" onclick="addStoreProduct('${p.inventory_local_id}')">Add</button></div></div></article>`).join('')||'<div class="empty">No products match your search.</div>';
  }
  window.addStoreProduct=id=>{const p=productById(id);if(!p)return;const line=cart.find(x=>x.inventoryRef===id);if(line)line.qty=Math.min(50,line.qty+1);else cart.push({inventoryRef:id,qty:1});saveCart();openCart()};
  window.changeStoreQty=(id,delta)=>{const line=cart.find(x=>x.inventoryRef===id);if(!line)return;line.qty+=delta;if(line.qty<=0)cart=cart.filter(x=>x.inventoryRef!==id);saveCart()};
  window.removeStoreLine=id=>{cart=cart.filter(x=>x.inventoryRef!==id);saveCart()};
  function cartTotal(){return cart.reduce((sum,line)=>sum+Number(productById(line.inventoryRef)?.price||0)*line.qty,0)}
  function hasRx(){return cart.some(line=>productById(line.inventoryRef)?.prescription_required)}
  function renderCart(){
    const count=cart.reduce((a,b)=>a+b.qty,0);el('cartCount').textContent=count;el('cartSubtitle').textContent=`${count} item${count===1?'':'s'}`;
    el('cartLines').innerHTML=cart.map(line=>{const p=productById(line.inventoryRef);if(!p)return'';return `<div class="cart-line"><div><h4>${esc(p.name)}</h4><small>${peso(p.price)} each${p.prescription_required?' · Rx review':''}</small></div><div class="qty-controls"><button onclick="changeStoreQty('${line.inventoryRef}',-1)">−</button><strong>${line.qty}</strong><button onclick="changeStoreQty('${line.inventoryRef}',1)">+</button><button class="remove" onclick="removeStoreLine('${line.inventoryRef}')">×</button></div></div>`}).join('')||'<div class="empty">Your cart is empty.</div>';
    el('cartSubtotal').textContent=peso(cartTotal());el('checkoutButton').disabled=!cart.length;
  }
  function openCart(){el('cartDrawer').classList.add('open');el('cartDrawer').setAttribute('aria-hidden','false');el('drawerBackdrop').hidden=false}
  function closeCart(){el('cartDrawer').classList.remove('open');el('cartDrawer').setAttribute('aria-hidden','true');el('drawerBackdrop').hidden=true}
  function openCheckout(){if(!cart.length)return;closeCart();el('checkoutTotal').textContent=peso(cartTotal());el('rxCheckoutNotice').hidden=!hasRx();el('prescriptionField').hidden=!hasRx();el('checkoutModal').hidden=false}
  function closeCheckout(){el('checkoutModal').hidden=true;el('checkoutError').textContent=''}
  async function placeOrder(){
    const btn=el('placeOrderButton'),error=el('checkoutError');error.textContent='';
    const fulfillment=el('fulfillment').value;
    const payload={customer:{name:el('customerName').value.trim(),mobile:el('customerMobile').value.trim(),email:el('customerEmail').value.trim(),address:el('customerAddress').value.trim()},fulfillment,paymentMethod:el('paymentMethod').value,notes:el('orderNotes').value.trim(),prescriptionNote:el('prescriptionNote').value.trim(),website:el('website').value,items:cart.map(x=>({inventoryRef:x.inventoryRef,qty:x.qty}))};
    if(!payload.customer.name)return error.textContent='Enter your full name.';
    if(!payload.customer.mobile)return error.textContent='Enter your mobile number.';
    if(fulfillment==='Delivery'&&!payload.customer.address)return error.textContent='Enter the delivery address.';
    btn.disabled=true;btn.textContent='Submitting…';
    try{
      const {data,error:invokeError}=await client.functions.invoke('place-online-order',{body:payload});
      if(invokeError)throw invokeError;if(data?.error)throw new Error(data.error);
      cart=[];saveCart();closeCheckout();el('successOrderNo').textContent=data.orderNo;el('successMessage').textContent=data.message||'Your order has been received by ACCU Pharmacy.';el('successModal').hidden=false;
    }catch(e){error.textContent=e.message||'Unable to place order. Please contact the pharmacy.'}
    finally{btn.disabled=false;btn.textContent='Place Order'}
  }

  el('storeSearch').addEventListener('input',renderProducts);el('categoryFilter').addEventListener('change',renderProducts);el('cartButton').onclick=openCart;el('closeCart').onclick=closeCart;el('drawerBackdrop').onclick=closeCart;el('checkoutButton').onclick=openCheckout;el('closeCheckout').onclick=closeCheckout;el('placeOrderButton').onclick=placeOrder;el('fulfillment').onchange=()=>{el('addressField').hidden=el('fulfillment').value!=='Delivery'};el('successClose').onclick=()=>{el('successModal').hidden=true};
  renderCart();loadProducts();
})();
