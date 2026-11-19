const CACHE_NAME='accu-static-v2-sound';
const STATIC_ASSETS=['./','./index.html','./style.css','./app.js','./backend.js','./accu-logo.jpeg','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./sounds/notification.wav','./sounds/urgent.wav'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(STATIC_ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  event.respondWith(fetch(req).then(res=>{if(res&&res.ok){const copy=res.clone();caches.open(CACHE_NAME).then(c=>c.put(req,copy))}return res}).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));
});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const client of list){if('focus' in client)return client.focus()}return clients.openWindow('./index.html')}))});
// Future-ready: a later Web Push backend can send JSON {title, body, severity} here.
self.addEventListener('push',event=>{
  if(!event.data)return;
  let data={};try{data=event.data.json()}catch{data={body:event.data.text()}}
  const warning=data.severity==='warning'||data.requires_ack;
  event.waitUntil(self.registration.showNotification(data.title||'ACCU Notification',{body:data.body||data.message||'',icon:'./icons/icon-192.png',badge:'./icons/icon-192.png',vibrate:warning?[180,80,220]:[120,60,120],data:data.data||{}}));
});
