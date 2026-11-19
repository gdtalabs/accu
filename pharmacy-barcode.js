(function(){
  'use strict';

  const CFG = {
    minCodeLength: 4,
    scannerGapMs: 75,
    scanResetMs: 180,
    toastMs: 1800
  };

  let scanBuffer = '';
  let lastKeyAt = 0;
  let resetTimer = null;

  function isPharmacyPosVisible(){
    const pos = document.getElementById('pos');
    if(!pos) return false;
    const style = window.getComputedStyle(pos);
    if(style.display === 'none' || style.visibility === 'hidden') return false;
    return /Pharmacy Products/i.test(pos.textContent || '');
  }

  function scannerInput(){
    return document.getElementById('pharmacyBarcodeScan');
  }

  function posSearchInput(){
    const pos = document.getElementById('pos');
    if(!pos) return null;
    const headings = [...pos.querySelectorAll('h2')];
    const pharmacyHeading = headings.find(h => /Pharmacy Products/i.test(h.textContent || ''));
    const card = pharmacyHeading?.closest('.card');
    return card?.querySelector('input.search-input') || null;
  }

  function productButtons(){
    const pos = document.getElementById('pos');
    if(!pos) return [];
    const headings = [...pos.querySelectorAll('h2')];
    const pharmacyHeading = headings.find(h => /Pharmacy Products/i.test(h.textContent || ''));
    const card = pharmacyHeading?.closest('.card');
    return card ? [...card.querySelectorAll('.catalog .catalog-item')] : [];
  }

  function toast(message, kind='ok'){
    let box = document.getElementById('barcodeScannerToast');
    if(!box){
      box = document.createElement('div');
      box.id = 'barcodeScannerToast';
      box.className = 'barcode-scanner-toast';
      document.body.appendChild(box);
    }
    box.className = `barcode-scanner-toast ${kind}`;
    box.textContent = message;
    box.classList.add('show');
    clearTimeout(box._hideTimer);
    box._hideTimer = setTimeout(()=>box.classList.remove('show'), CFG.toastMs);
  }

  function setSearchValue(code){
    const search = posSearchInput();
    if(!search) return false;
    search.value = code;
    search.dispatchEvent(new Event('input', {bubbles:true}));
    return true;
  }

  function normalizeCode(value){
    return String(value || '').trim().replace(/\s+/g,'');
  }

  function processBarcode(rawCode){
    const code = normalizeCode(rawCode);
    if(code.length < CFG.minCodeLength){
      toast('Barcode is too short.', 'warn');
      return;
    }
    if(!isPharmacyPosVisible()){
      toast('Open Pharmacy POS before scanning.', 'warn');
      return;
    }
    if(!setSearchValue(code)){
      toast('Pharmacy search is not ready yet.', 'warn');
      return;
    }

    // renderPOS() rebuilds the Pharmacy product list after the search input event.
    // Wait one frame, then auto-add if there is exactly one matching product.
    setTimeout(()=>{
      const buttons = productButtons();
      if(buttons.length === 1){
        const label = (buttons[0].querySelector('strong')?.textContent || 'Product').trim();
        buttons[0].click();
        toast(`${label} added to cart.`, 'ok');
        const scan = scannerInput();
        if(scan){ scan.value=''; scan.focus({preventScroll:true}); }
        return;
      }
      if(buttons.length === 0){
        toast(`No product found for barcode ${code}.`, 'error');
      }else{
        toast(`Barcode ${code} matched ${buttons.length} products. Check for duplicate barcode records.`, 'warn');
      }
    }, 90);
  }

  window.scanPharmacyBarcode = function(value){
    const input = scannerInput();
    processBarcode(value ?? input?.value ?? '');
  };

  function injectScannerUI(){
    if(!isPharmacyPosVisible()) return;
    if(document.getElementById('pharmacyBarcodePanel')) return;

    const search = posSearchInput();
    if(!search) return;
    const field = search.closest('.field') || search.parentElement;
    if(!field) return;

    const panel = document.createElement('div');
    panel.id = 'pharmacyBarcodePanel';
    panel.className = 'barcode-scanner-panel';
    panel.innerHTML = `
      <div class="barcode-scanner-title">
        <span aria-hidden="true">▥</span>
        <div><strong>Barcode Scanner</strong><small>Scan product barcode or type the code</small></div>
      </div>
      <div class="barcode-scanner-controls">
        <input id="pharmacyBarcodeScan" inputmode="numeric" autocomplete="off" enterkeyhint="done" placeholder="Scan barcode…" aria-label="Scan pharmacy product barcode">
        <button type="button" class="primary" id="pharmacyBarcodeAddBtn">Add</button>
      </div>
    `;
    field.parentElement?.insertBefore(panel, field);

    const input = scannerInput();
    input?.addEventListener('keydown', e=>{
      if(e.key === 'Enter'){
        e.preventDefault();
        processBarcode(input.value);
      }
    });
    document.getElementById('pharmacyBarcodeAddBtn')?.addEventListener('click', ()=>processBarcode(input?.value));
  }

  function injectStyles(){
    if(document.getElementById('barcodeScannerStyles')) return;
    const style = document.createElement('style');
    style.id = 'barcodeScannerStyles';
    style.textContent = `
      .barcode-scanner-panel{border:1px solid #dbe4ee;background:#f8fbff;border-radius:14px;padding:12px;margin:0 0 14px;display:grid;gap:10px}
      .barcode-scanner-title{display:flex;gap:9px;align-items:center;color:#153b66}.barcode-scanner-title>span{font-size:22px}.barcode-scanner-title strong{display:block;font-size:14px}.barcode-scanner-title small{display:block;color:#64748b;margin-top:2px}
      .barcode-scanner-controls{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.barcode-scanner-controls input{min-width:0;width:100%;min-height:44px;border:1px solid #cbd5e1;border-radius:10px;padding:9px 11px;background:#fff;font:inherit}
      .barcode-scanner-toast{position:fixed;left:50%;bottom:88px;transform:translate(-50%,18px);z-index:99999;max-width:min(92vw,520px);padding:11px 14px;border-radius:12px;color:#fff;background:#163b66;box-shadow:0 12px 30px rgba(15,23,42,.28);opacity:0;pointer-events:none;transition:.18s ease;text-align:center;font-size:14px}.barcode-scanner-toast.show{opacity:1;transform:translate(-50%,0)}.barcode-scanner-toast.warn{background:#9a6700}.barcode-scanner-toast.error{background:#a61b1b}.barcode-scanner-toast.ok{background:#146c43}
      @media(max-width:640px){.barcode-scanner-controls{grid-template-columns:1fr}.barcode-scanner-controls .primary{width:100%}.barcode-scanner-toast{bottom:78px}}
    `;
    document.head.appendChild(style);
  }

  // Keyboard-wedge scanners usually type the barcode very quickly and send Enter.
  // Detect that pattern when focus is not inside an editable field.
  document.addEventListener('keydown', e=>{
    if(!isPharmacyPosVisible()) return;
    const target = e.target;
    const editable = target && (target.matches?.('input,textarea,select,[contenteditable="true"]'));
    if(editable) return;

    const now = performance.now();
    if(e.key === 'Enter'){
      if(scanBuffer.length >= CFG.minCodeLength){
        e.preventDefault();
        const code = scanBuffer;
        scanBuffer = '';
        processBarcode(code);
      }
      return;
    }
    if(e.key.length !== 1) return;
    if(now - lastKeyAt > CFG.scannerGapMs) scanBuffer = '';
    scanBuffer += e.key;
    lastKeyAt = now;
    clearTimeout(resetTimer);
    resetTimer = setTimeout(()=>{scanBuffer='';}, CFG.scanResetMs);
  }, true);

  injectStyles();
  const observer = new MutationObserver(()=>injectScannerUI());
  observer.observe(document.documentElement, {subtree:true, childList:true});
  document.addEventListener('DOMContentLoaded', injectScannerUI);
  setTimeout(injectScannerUI, 250);
})();
