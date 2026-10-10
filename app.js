"use strict";
const $=id=>document.getElementById(id);
const safe=fn=>{try{return fn()}catch(e){console.error("NEXA:",fn.name||"init",e)}};
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

const WIDGETS={weather:"هواشناسی",tasks:"یادداشت سریع",calculator:"ماشین حساب",worldclock:"ساعت جهانی",calendar:"تقویم",network:"شبکه",frame:"قاب عکس",crypto:"ارزهای دیجیتال",forex:"فارکس",iran:"دلار، یورو و طلا",bookmarks:"بوک‌مارک‌ها",rss:"اخبار"};
const MINH={weather:380,calculator:340,worldclock:170,calendar:330,network:260,frame:200};
const CITIES=[["Asia/Tehran","تهران"],["Asia/Baku","باکو"],["Europe/Istanbul","استانبول"],["Asia/Dubai","دبی"],["Asia/Riyadh","ریاض"],["Asia/Baghdad","بغداد"],["Asia/Kabul","کابل"],["Asia/Karachi","کراچی"],["Asia/Kolkata","دهلی نو"],["Asia/Tashkent","تاشکند"],["Asia/Almaty","آلماتی"],["Asia/Dhaka","داکا"],["Asia/Bangkok","بانکوک"],["Asia/Shanghai","پکن / شانگهای"],["Asia/Singapore","سنگاپور"],["Asia/Tokyo","توکیو"],["Asia/Seoul","سئول"],["Australia/Sydney","سیدنی"],["Pacific/Auckland","اوکلند"],["Europe/Moscow","مسکو"],["Europe/London","لندن"],["Europe/Paris","پاریس"],["Europe/Berlin","برلین"],["Europe/Rome","رم"],["Europe/Madrid","مادرید"],["Europe/Amsterdam","آمستردام"],["Europe/Stockholm","استکهلم"],["Africa/Cairo","قاهره"],["Africa/Johannesburg","ژوهانسبورگ"],["Africa/Lagos","لاگوس"],["America/New_York","نیویورک"],["America/Chicago","شیکاگو"],["America/Denver","دنور"],["America/Los_Angeles","لس‌آنجلس"],["America/Toronto","تورنتو"],["America/Mexico_City","مکزیکو سیتی"],["America/Sao_Paulo","سائوپائولو"],["America/Argentina/Buenos_Aires","بوینوس آیرس"],["UTC","UTC"]];

/* TGJU: prices are in RIAL (p = string with commas). div converts to toman. */
const IRAN_ITEMS={
 price_dollar_rl:{n:"دلار آزاد",div:10,u:"تومان"},
 price_eur:{n:"یورو",div:10,u:"تومان"},
 price_gbp:{n:"پوند",div:10,u:"تومان"},
 price_aed:{n:"درهم امارات",div:10,u:"تومان"},
 price_try:{n:"لیر ترکیه",div:10,u:"تومان"},
 price_jpy:{n:"ین ژاپن (۱۰۰ ین)",div:10,u:"تومان"},
 geram18:{n:"طلای ۱۸ عیار (گرم)",div:10,u:"تومان"},
 mesghal:{n:"مثقال طلا",div:10,u:"تومان"},
 sekee:{n:"سکه امامی",div:10,u:"تومان"},
 sekeb:{n:"سکه بهار آزادی",div:10,u:"تومان"},
 ons:{n:"انس طلا",div:1,u:"$"}
};
const TGJU_URLS=["call4","call1","call2","call3","call5"].map(h=>`https://${h}.tgju.org/ajax.json`);

const DEFAULTS={
 engine:"google",wallpaper:"",widgetOrder:Object.keys(WIDGETS),hidden:[],sizes:{},
 tasks:[{id:1,name:"نمونه کار",p:0}],bookmarks:[],
 crypto:["bitcoin","ethereum"],forex:["EURUSD","GBPUSD"],
 iran:["price_dollar_rl","price_eur","geram18","sekee","ons"],
 clocks:[{tz:"Asia/Tehran",name:"تهران"},{tz:"Europe/London",name:"لندن"},{tz:"America/New_York",name:"نیویورک"},{tz:"Asia/Tokyo",name:"توکیو"}],
 weatherLoc:{lat:38.0962,lon:46.2738,city:"تبریز"},
 feeds:[{name:"Google News",url:"https://news.google.com/rss?hl=fa&gl=IR&ceid=IR:fa"}],
 cache:{},tasksBlur:false,calMode:"jalali",frame:{interval:5},
 net:{targets:[{name:"Cloudflare",url:"https://1.1.1.1/cdn-cgi/trace"},{name:"Google",url:"https://www.gstatic.com/generate_204"}]}
};
const state=structuredClone(DEFAULTS);
let editMode=false,resizing=false,photos=[];
const wallpapers=[
 "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1800&q=85",
 "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1800&q=85",
 "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&q=85",
 "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=85",
 "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1800&q=85"
];

/* ---------- helpers ---------- */
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function safeUrl(u){try{const x=new URL(u);return /^https?:$/.test(x.protocol)?x.href:"#"}catch{return "#"}}
function faviconUrl(u){try{const x=new URL(u);return "https://www.google.com/s2/favicons?domain_url="+encodeURIComponent(x.origin)+"&sz=64"}catch{return ""}}
function fmt(n,d=8){return Number(n).toLocaleString("en-US",{maximumFractionDigits:d})}
function titleCase(s){return s.split("-").map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(" ")}
async function getJSON(url,ms=12000){
 const ac=new AbortController(),t=setTimeout(()=>ac.abort(),ms);
 try{const r=await fetch(url,{signal:ac.signal,cache:"no-store"});if(!r.ok)throw new Error("HTTP "+r.status);return await r.json()}
 finally{clearTimeout(t)}
}
async function getText(url,ms=12000){
 const ac=new AbortController(),t=setTimeout(()=>ac.abort(),ms);
 try{const r=await fetch(url,{signal:ac.signal});if(!r.ok)throw new Error("HTTP "+r.status);return await r.text()}
 finally{clearTimeout(t)}
}
let saveTimer=null;
function save(){
 clearTimeout(saveTimer);
 saveTimer=setTimeout(()=>{try{Promise.resolve(chrome.storage.local.set(JSON.parse(JSON.stringify(state)))).catch(e=>console.warn("save failed",e))}catch(e){console.warn("save failed",e)}},150);
}
function setCache(k,v){state.cache[k]={t:Date.now(),v};save()}

/* ---------- load ---------- */
async function load(){
 let d={};
 try{d=await chrome.storage.local.get(null)||{}}catch(e){console.warn("storage",e)}
 Object.assign(state,structuredClone(DEFAULTS),d);
 photos=Array.isArray(d.photos)?d.photos:[];delete state.photos;
 const ids=Object.keys(WIDGETS);
 state.widgetOrder=(state.widgetOrder||[]).filter(x=>ids.includes(x));
 ids.forEach(x=>{if(!state.widgetOrder.includes(x))state.widgetOrder.push(x)});
 if(!state.sizes)state.sizes={};if(!state.hidden)state.hidden=[];if(!state.cache)state.cache={};
 [renderOrder,applyVisibility,applySizes,renderToggles,renderTasks,applyBlur,renderCalendar,renderPings,renderFrame,renderBookmarks,renderClocks,renderCryptoCached,renderForexCached,renderIranCached,renderFeedManage,loadWallpaper,loadSearch].forEach(safe);
 refreshAll();
 setInterval(()=>vis("iran")&&safe(fetchTGJU),60000);
 setInterval(()=>vis("crypto")&&safe(fetchCrypto),120000);
 setInterval(()=>vis("weather")&&safe(fetchWeather),900000);
 setInterval(()=>vis("network")&&safe(netIP),300000);
 setInterval(()=>safe(pingTick),2500);
 window.addEventListener("online",()=>{refreshAll()});
}
const vis=id=>!state.hidden.includes(id);
function refreshAll(){
 const R={weather:fetchWeather,crypto:fetchCrypto,forex:fetchForex,iran:fetchTGJU,rss:fetchFeeds,network:netIP};
 Object.entries(R).forEach(([id,f])=>{if(vis(id))safe(()=>Promise.resolve(f()).catch(e=>console.warn(id,e)))});
}
function renderOrder(){
 const g=$("widgetGrid"),nodes=[...g.querySelectorAll(".widget")];
 state.widgetOrder.forEach(id=>{const n=nodes.find(x=>x.dataset.widget===id);if(n)g.appendChild(n)});
}
function loadSearch(){$("searchEngine").value=state.engine;$("settingEngine").value=state.engine}

/* ---------- hero clock + world clock ---------- */
function updateClock(){
 const n=new Date();
 $("clock").textContent=n.toLocaleTimeString("en-US",{hourCycle:"h23"});
 $("date").textContent=faDate(n);
 updateWorldClocks(n);
}
function faDate(n){
 const p={};new Intl.DateTimeFormat("fa-IR-u-ca-persian",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).formatToParts(n).forEach(x=>p[x.type]=x.value);
 return `${p.weekday}، ${p.day} ${p.month} ${p.year}`;
}
function tzParts(tz,now){
 const f=new Intl.DateTimeFormat("en-GB",{timeZone:tz,hourCycle:"h23",hour:"2-digit",minute:"2-digit",second:"2-digit",year:"numeric",month:"2-digit",day:"2-digit"});
 const p={};f.formatToParts(now).forEach(x=>p[x.type]=x.value);return p;
}
function tzOffsetMin(tz,now){
 const p=tzParts(tz,now);
 const asUTC=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);
 return Math.round((asUTC-Math.floor(now.getTime()/1000)*1000)/60000);
}
function offsetLabel(m){const s=m<0?"-":"+",a=Math.abs(m);return "UTC"+s+String(Math.floor(a/60)).padStart(2,"0")+":"+String(a%60).padStart(2,"0")}
function validTZ(tz){try{new Intl.DateTimeFormat("en-US",{timeZone:tz});return true}catch{return false}}
function renderClocks(){
 $("clockList").innerHTML=state.clocks.length?state.clocks.map((c,i)=>`<div class="wc-row" data-tz="${esc(c.tz)}"><div class="wc-info"><b class="wc-name">${esc(c.name)}</b><small class="wc-meta"></small></div><div class="wc-right"><span class="wc-icon"></span><span class="wc-time">--:--:--</span></div><button class="row-x" data-rmclock="${i}" title="حذف">×</button></div>`).join(""):'<div class="muted">هیچ ساعتی اضافه نشده. با دکمه + یک شهر اضافه کنید.</div>';
 updateWorldClocks(new Date());
}
function updateWorldClocks(now){
 const rows=document.querySelectorAll("#clockList .wc-row");if(!rows.length)return;
 const localOff=-now.getTimezoneOffset(),loc=now.toLocaleDateString("en-CA");
 rows.forEach(r=>{
  const tz=r.dataset.tz;
  try{
   const p=tzParts(tz,now),off=tzOffsetMin(tz,now),h=+p.hour;
   r.querySelector(".wc-time").textContent=`${p.hour}:${p.minute}:${p.second}`;
   r.querySelector(".wc-icon").textContent=(h>=6&&h<18)?"☀️":"🌙";
   const d=`${p.year}-${p.month}-${p.day}`;
   const day=d===loc?"امروز":(d>loc?"فردا":"دیروز");
   const diff=off-localOff,dl=diff===0?"هم‌زمان با شما":(diff>0?"+":"−")+Math.floor(Math.abs(diff)/60)+(Math.abs(diff)%60?":"+String(Math.abs(diff)%60).padStart(2,"0"):"")+" ساعت";
   r.querySelector(".wc-meta").textContent=`${day} • ${offsetLabel(off)} • ${dl}`;
  }catch{r.querySelector(".wc-time").textContent="؟"}
 });
}
function initClocks(){
 $("clockList").addEventListener("click",e=>{const b=e.target.closest("[data-rmclock]");if(!b)return;state.clocks.splice(+b.dataset.rmclock,1);save();renderClocks()});
 $("addClock").onclick=()=>promptForm("افزودن ساعت جهانی",[["city","شهر",CITIES],["custom","یا منطقه زمانی دلخواه (اختیاری) مثل America/Chicago"],["label","نام نمایشی (اختیاری)"]],v=>{
  let tz=v.custom||v.city,name=v.label;
  if(!validTZ(tz)){alert("منطقه زمانی معتبر نیست. نمونه درست: Europe/Paris");return}
  if(!name){const f=CITIES.find(c=>c[0]===tz);name=f?f[1]:tz.split("/").pop().replace(/_/g," ")}
  state.clocks.push({tz,name});save();renderClocks();
 });
}

/* ---------- search ---------- */
function initSearch(){
 $("searchForm").onsubmit=e=>{e.preventDefault();const q=$("searchInput").value.trim();if(!q)return;const base=$("searchEngine").value==="duckduckgo"?"https://duckduckgo.com/?q=":"https://www.google.com/search?q=";location.href=base+encodeURIComponent(q)};
 $("searchEngine").onchange=()=>{state.engine=$("searchEngine").value;$("settingEngine").value=state.engine;save()};
}

/* ---------- tasks ---------- */
function renderTasks(){
 $("taskList").innerHTML=state.tasks.length?state.tasks.map(t=>`<div class="task-row"><span class="task-name" title="${esc(t.name)}">${esc(t.name)}</span>${[25,50,75,100].map(p=>`<button class="pct p${p} ${t.p===p?"active":""}" data-task="${t.id}" data-p="${p}">${p}</button>`).join("")}<button class="trash" data-del="${t.id}" title="حذف کامل">🗑</button></div>`).join(""):'<div class="muted">یادداشتی وجود ندارد.</div>';
}
function applyBlur(){$("tasksWidget").classList.toggle("blurred",!!state.tasksBlur);$("blurTasks").textContent=state.tasksBlur?"🙈":"👁"}
function initTasks(){
 $("blurTasks").onclick=()=>{state.tasksBlur=!state.tasksBlur;applyBlur();save()};
 $("taskList").addEventListener("click",e=>{
  const pb=e.target.closest(".pct");
  if(pb){const t=state.tasks.find(x=>String(x.id)===pb.dataset.task);if(t){const p=Number(pb.dataset.p);t.p=t.p===p?0:p;save();renderTasks()}return}
  const del=e.target.closest("[data-del]");
  if(del){state.tasks=state.tasks.filter(x=>String(x.id)!==del.dataset.del);save();renderTasks()}
 });
 $("addTask").onclick=()=>{$("taskAddBox").classList.toggle("hidden");$("taskInput").focus()};
 const add=()=>{const n=$("taskInput").value.trim();if(!n)return;state.tasks.push({id:Date.now(),name:n,p:0});$("taskInput").value="";save();renderTasks();$("taskInput").focus()};
 $("taskConfirm").onclick=add;
 $("taskInput").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();add()}});
}

/* ---------- calculator ---------- */
let calc="0",calcFresh=false;
function safeCalc(expr){
 const s=expr.replace(/\s+/g,"");
 if(!/^[0-9+\-*/().]+$/.test(s))throw new Error("invalid");
 const tokens=s.match(/\d+\.?\d*|\.\d+|[()+\-*/]/g);
 if(!tokens||tokens.join("")!==s)throw new Error("invalid");
 let i=0;
 function primary(){
  if(tokens[i]==="("){i++;const v=add();if(tokens[i]!==")")throw 0;i++;return v}
  if(tokens[i]==="-"){i++;return -primary()}
  if(tokens[i]==="+"){i++;return primary()}
  const n=Number(tokens[i++]);if(!Number.isFinite(n))throw 0;return n;
 }
 function mul(){let v=primary();while(["*","/"].includes(tokens[i])){const op=tokens[i++],b=primary();if(op==="*")v*=b;else{if(b===0)throw 0;v/=b}}return v}
 function add(){let v=mul();while(["+","-"].includes(tokens[i])){const op=tokens[i++],b=mul();v=op==="+"?v+b:v-b}return v}
 const r=add();if(i!==tokens.length||!Number.isFinite(r))throw 0;
 return Math.round(r*1e12)/1e12;
}
function calcShow(){$("calcDisplay").value=calc.replace(/\*/g,"×").replace(/\//g,"÷")}
function calcPress(v){
 const isOp=/^[+\-*/]$/.test(v);
 if(v==="C"){calc="0";calcFresh=false}
 else if(v==="="){try{calc=String(safeCalc(calc))}catch{calc="Error"}calcFresh=true}
 else if(v==="BACK"){calc=(calc==="Error"||calcFresh)?"0":(calc.slice(0,-1)||"0");calcFresh=false}
 else{
  if(calc==="Error"||(calcFresh&&!isOp))calc="0";
  calcFresh=false;
  if(calc==="0"&&!isOp&&v!==".")calc="";
  calc+=v;
 }
 calcShow();
}
function initCalc(){
 document.querySelectorAll("[data-calc]").forEach(b=>b.addEventListener("click",()=>calcPress(b.dataset.calc)));
 const w=document.querySelector(".calc-widget");
 w.addEventListener("keydown",e=>{
  let k=e.key,m=null;
  if(/^[0-9]$/.test(k)||"+-*/.()".includes(k))m=k;
  else if(k==="Enter"||k==="=")m="=";
  else if(k==="Backspace")m="BACK";
  else if(k==="Escape"||k==="Delete"||k==="c"||k==="C")m="C";
  if(m!==null){e.preventDefault();calcPress(m)}
 });
 calcShow();
}

/* ---------- weather ---------- */
function weatherText(c){if(c===0)return"صاف";if([1,2,3].includes(c))return"نیمه‌ابری";if([45,48].includes(c))return"مه";if([51,53,55,56,57].includes(c))return"نم‌نم باران";if([61,63,65,66,67,80,81,82].includes(c))return"بارانی";if([71,73,75,77,85,86].includes(c))return"برفی";if([95,96,99].includes(c))return"رعدوبرق";return"آب‌وهوا"}
function weatherIcon(c){if(c===0)return"☀️";if([1,2,3].includes(c))return"⛅";if([45,48].includes(c))return"🌫️";if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(c))return"🌧️";if([71,73,75,77,85,86].includes(c))return"❄️";return"⛈️"}
const AQI_PM25=[[0,12,0,50],[12.1,35.4,51,100],[35.5,55.4,101,150],[55.5,150.4,151,200],[150.5,250.4,201,300],[250.5,350.4,301,400],[350.5,500.4,401,500]];
const AQI_PM10=[[0,54,0,50],[55,154,51,100],[155,254,101,150],[255,354,151,200],[355,424,201,300],[425,504,301,400],[505,604,401,500]];
function aqiFrom(c,bp){if(c==null||isNaN(c))return null;for(const [cl,ch,il,ih] of bp){if(c<=ch)return Math.round((ih-il)/(ch-cl)*(Math.max(c,cl)-cl)+il)}return 500}
function aqiCalc(pm25,pm10){const a=aqiFrom(pm25!=null?Math.floor(pm25*10)/10:null,AQI_PM25),b=aqiFrom(pm10!=null?Math.floor(pm10):null,AQI_PM10);const v=[a,b].filter(x=>x!=null);return v.length?Math.max(...v):null}
function aqiInfo(v){if(v==null)return{t:"نامشخص",c:"#9298a8"};if(v<=50)return{t:"خوب",c:"#34c759"};if(v<=100)return{t:"متوسط",c:"#ffd60a"};if(v<=150)return{t:"ناسالم برای گروه حساس",c:"#ff9500"};if(v<=200)return{t:"ناسالم",c:"#ff453a"};if(v<=300)return{t:"بسیار ناسالم",c:"#bf5af2"};return{t:"خطرناک",c:"#a2132f"}}
async function fetchAQI(lat,lon){
 const a=await getJSON(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10&hourly=us_aqi,pm2_5,pm10&forecast_days=1&timezone=auto`);
 let v=a.current?.us_aqi;
 if(v==null&&a.current)v=aqiCalc(a.current.pm2_5,a.current.pm10);
 if(v==null&&a.hourly?.time){
  const key=(a.current?.time||"").slice(0,13);let i=a.hourly.time.findIndex(t=>t.slice(0,13)===key);
  const at=j=>a.hourly.us_aqi?.[j]??aqiCalc(a.hourly.pm2_5?.[j],a.hourly.pm10?.[j]);
  if(i<0)i=a.hourly.time.length-1;
  for(let j=i;j>=0&&v==null;j--)v=at(j);
 }
 return v==null?null:Math.round(v);
}
function showAQI(v){const i=aqiInfo(v);$("aqi").textContent=v==null?"--":v;$("aqi").style.color=v==null?"":i.c;$("aqiLabel").textContent=v==null?"":i.t;$("aqiLabel").style.color=i.c}
async function fetchWeather(){
 const {lat,lon,city}=state.weatherLoc||DEFAULTS.weatherLoc;
 $("weatherCity").textContent=city;
 const aq=fetchAQI(lat,lon).then(showAQI).catch(async e=>{console.warn("aqi",e);await new Promise(r=>setTimeout(r,8000));try{showAQI(await fetchAQI(lat,lon))}catch{showAQI(null)}});
 try{
  const u=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max&forecast_days=8&timezone=auto`;
  const w=await getJSON(u);
  $("weatherTemp").textContent=Math.round(w.current.temperature_2m)+"°";
  $("humidity").textContent=w.current.relative_humidity_2m+"%";
  $("wind").textContent=Math.round(w.current.wind_speed_10m)+" km/h";
  $("uv").textContent=w.daily?.uv_index_max?.[0]!=null?Math.round(w.daily.uv_index_max[0]*10)/10:"--";
  $("weatherDesc").textContent=weatherText(w.current.weather_code);
  $("weatherIcon").textContent=weatherIcon(w.current.weather_code);
  $("forecast").innerHTML=w.daily.time.map((d,i)=>{
   const rain=w.daily.precipitation_probability_max?.[i];
   return `<div class="forecast-day"><small>${i===0?"امروز":new Date(d+"T12:00:00").toLocaleDateString("fa-IR",{weekday:"short"})}</small><b>${weatherIcon(w.daily.weather_code[i])}</b><span>${Math.round(w.daily.temperature_2m_max[i])}° / ${Math.round(w.daily.temperature_2m_min[i])}°</span>${rain!=null?`<i class="rain">💧${rain}%</i>`:""}</div>`;
  }).join("");
 }catch(e){console.warn("weather",e);$("weatherDesc").textContent="دریافت اطلاعات ناموفق بود (اینترنت را بررسی کنید)"}
 await aq;
}
function initWeather(){
 $("weatherLocate").onclick=()=>{
  if(!navigator.geolocation){alert("مرورگر از موقعیت‌یابی پشتیبانی نمی‌کند.");return}
  navigator.geolocation.getCurrentPosition(p=>{state.weatherLoc={lat:p.coords.latitude,lon:p.coords.longitude,city:"موقعیت من"};save();fetchWeather()},()=>alert("دسترسی به موقعیت فعال نیست."),{timeout:15000});
 };
 $("weatherSearch").onclick=()=>promptForm("جستجوی شهر",[["q","نام شهر (مثلاً تبریز یا Istanbul)"]],async v=>{
  if(!v.q)return;
  try{
   const g=await getJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(v.q)}&count=1&language=fa&format=json`);
   const r=g.results?.[0];if(!r){alert("شهری پیدا نشد.");return}
   state.weatherLoc={lat:r.latitude,lon:r.longitude,city:r.name};save();fetchWeather();
  }catch{alert("جستجوی شهر ناموفق بود.")}
 });
}

/* ---------- market list helper ---------- */
function staleNote(entry){return entry&&Date.now()-entry.t>10*60*1000?" (قدیمی)":""}

/* ---------- crypto ---------- */
function renderCrypto(d,stale=""){
 $("cryptoList").innerHTML=state.crypto.length?state.crypto.map((id,i)=>{
  const x=d?.[id],ch=x?.usd_24h_change;
  return `<div class="market-row"><span class="market-name">${esc(titleCase(id))}</span><span class="market-right"><b class="market-value">$${x?fmt(x.usd):"--"}</b>${typeof ch==="number"?`<span class="market-change ${ch>=0?"up":"down"}">${ch>=0?"+":""}${ch.toFixed(2)}%</span>`:""}<button class="row-x" data-rmcrypto="${i}" title="حذف">×</button></span></div>`;
 }).join("")+(stale?`<div class="muted">${stale}</div>`:""):'<div class="muted">ارزی اضافه نشده. با + اضافه کنید.</div>';
}
function renderCryptoCached(){renderCrypto(state.cache.crypto?.v,state.cache.crypto?"آخرین داده ذخیره‌شده":"")}
async function fetchCrypto(){
 if(!state.crypto.length){renderCrypto({});return}
 try{
  const d=await getJSON(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(state.crypto.join(","))}&vs_currencies=usd&include_24hr_change=true`);
  setCache("crypto",d);renderCrypto(d);return d;
 }catch(e){
  console.warn("crypto",e);
  if(state.cache.crypto)renderCrypto(state.cache.crypto.v,"اتصال برقرار نشد؛ آخرین داده ذخیره‌شده"+staleNote(state.cache.crypto));
  else $("cryptoList").innerHTML='<div class="muted">دریافت قیمت ارز دیجیتال ناموفق بود</div>';
 }
}
function initCrypto(){
 $("refreshCrypto").onclick=()=>fetchCrypto();
 $("cryptoList").addEventListener("click",e=>{const b=e.target.closest("[data-rmcrypto]");if(!b)return;state.crypto.splice(+b.dataset.rmcrypto,1);save();renderCryptoCached();fetchCrypto()});
 $("addCrypto").onclick=()=>promptForm("افزودن ارز دیجیتال",[["id","CoinGecko ID (مثلاً solana یا tether)"]],async v=>{
  const id=(v.id||"").toLowerCase().trim();if(!id||state.crypto.includes(id))return;
  state.crypto.push(id);const d=await fetchCrypto();
  if(d&&!d[id]){state.crypto=state.crypto.filter(x=>x!==id);renderCrypto(d);alert("این شناسه در CoinGecko پیدا نشد.")}
  save();
 });
}

/* ---------- forex (Frankfurter / ECB) ---------- */
function isoDaysAgo(n){const d=new Date(Date.now()-n*864e5);return d.toISOString().slice(0,10)}
async function frankSeries(base,quotes){
 const start=isoDaysAgo(10),syms=quotes.join(",");
 const urls=[`https://api.frankfurter.dev/v1/${start}..?base=${base}&symbols=${syms}`,`https://api.frankfurter.app/${start}..?from=${base}&to=${syms}`];
 let last;for(const u of urls){try{return await getJSON(u)}catch(e){last=e}}throw last;
}
function renderForex(data,stale=""){
 $("forexList").innerHTML=state.forex.length?state.forex.map((pair,i)=>{
  const x=data?.[pair];
  const val=x?(x.v<10?x.v.toFixed(5):x.v.toFixed(3)):"--";
  const ch=x&&x.prev?((x.v-x.prev)/x.prev*100):null;
  return `<div class="market-row"><span class="market-name">${pair.slice(0,3)}/${pair.slice(3)}</span><span class="market-right"><b class="market-value">${val}</b>${ch!==null?`<span class="market-change ${ch>=0?"up":"down"}">${ch>=0?"+":""}${ch.toFixed(2)}%</span>`:""}<button class="row-x" data-rmforex="${i}" title="حذف">×</button></span></div>`;
 }).join("")+(stale?`<div class="muted">${stale}</div>`:""):'<div class="muted">جفت‌ارزی اضافه نشده.</div>';
}
function renderForexCached(){renderForex(state.cache.forex?.v,state.cache.forex?"آخرین داده ذخیره‌شده":"")}
async function fetchForex(){
 const groups={};state.forex.forEach(p=>{(groups[p.slice(0,3)]??=[]).push(p.slice(3))});
 const out={};let ok=false;
 for(const [base,qs] of Object.entries(groups)){
  try{
   const j=await frankSeries(base,qs),days=Object.keys(j.rates||{}).sort();
   if(!days.length)continue;
   const a=j.rates[days[days.length-1]],b=days.length>1?j.rates[days[days.length-2]]:null;
   qs.forEach(q=>{if(a[q]!=null)out[base+q]={v:a[q],prev:b?.[q]}});ok=true;
  }catch(e){console.warn("forex",base,e)}
 }
 if(ok){setCache("forex",out);renderForex(out);return out}
 if(state.cache.forex)renderForex(state.cache.forex.v,"اتصال برقرار نشد؛ آخرین داده ذخیره‌شده"+staleNote(state.cache.forex));
 else $("forexList").innerHTML='<div class="muted">دریافت نرخ فارکس ناموفق بود</div>';
}
function initForex(){
 $("refreshForex").onclick=()=>fetchForex();
 $("forexList").addEventListener("click",e=>{const b=e.target.closest("[data-rmforex]");if(!b)return;state.forex.splice(+b.dataset.rmforex,1);save();renderForexCached()});
 $("addForex").onclick=()=>promptForm("افزودن جفت‌ارز فارکس",[["pair","نمونه: EURUSD یا USDJPY"]],async v=>{
  const p=(v.pair||"").toUpperCase().replace(/[^A-Z]/g,"");
  if(p.length!==6||state.forex.includes(p))return;
  state.forex.push(p);const d=await fetchForex();
  if(d&&!d[p]){state.forex=state.forex.filter(x=>x!==p);renderForex(d);alert("این جفت‌ارز در منبع داده (بانک مرکزی اروپا) پشتیبانی نمی‌شود. طلا و فلزات در ویجت «دلار، یورو و طلا» هستند.")}
  save();
 });
}

/* ---------- Iran market (TGJU) ---------- */
function renderIran(cur,stale=""){
 $("iranList").innerHTML=state.iran.length?state.iran.map((k,i)=>{
  const it=IRAN_ITEMS[k]||{n:k,div:10,u:"تومان"},x=cur?.[k];
  const raw=x?Number(String(x.p).replace(/,/g,"")):NaN;
  const val=Number.isFinite(raw)?fmt(raw/it.div,it.div===1?2:0):"--";
  const dp=x?Number(String(x.dp).replace(/,/g,"")):NaN,dir=x?.dt==="low"?"down":"up";
  return `<div class="market-row"><span class="market-name">${esc(it.n)}</span><span class="market-right"><b class="market-value">${val}</b><small class="unit">${it.u}</small>${Number.isFinite(dp)&&dp!==0?`<span class="market-change ${dir}">${dir==="up"?"+":"−"}${Math.abs(dp).toFixed(2)}%</span>`:""}<button class="row-x" data-rmiran="${i}" title="حذف">×</button></span></div>`;
 }).join("")+(stale?`<div class="muted">${stale}</div>`:""):'<div class="muted">موردی اضافه نشده.</div>';
}
function renderIranCached(){renderIran(state.cache.iran?.v,state.cache.iran?"آخرین داده ذخیره‌شده":"")}
async function fetchTGJU(){
 let cur=null;
 for(const u of TGJU_URLS){try{const j=await getJSON(u);if(j&&j.current){cur=j.current;break}}catch(e){console.warn("tgju",u,e)}}
 if(cur){
  // keep only what we may show (keeps storage small)
  const slim={};Object.keys(IRAN_ITEMS).forEach(k=>{if(cur[k])slim[k]={p:cur[k].p,dp:cur[k].dp,dt:cur[k].dt}});
  setCache("iran",slim);renderIran(slim);
  $("iranNote").textContent="TGJU.ORG • "+new Date().toLocaleTimeString("en-US",{hourCycle:"h23"});
 }else if(state.cache.iran)renderIran(state.cache.iran.v,"اتصال برقرار نشد؛ آخرین داده ذخیره‌شده"+staleNote(state.cache.iran));
 else $("iranList").innerHTML='<div class="muted">دریافت نرخ‌ها ناموفق بود — دکمه ↻ را بزنید</div>';
}
function initIran(){
 $("refreshTGJU").onclick=()=>fetchTGJU();
 $("iranList").addEventListener("click",e=>{const b=e.target.closest("[data-rmiran]");if(!b)return;state.iran.splice(+b.dataset.rmiran,1);save();renderIranCached()});
 $("addIran").onclick=()=>{
  const opts=Object.entries(IRAN_ITEMS).filter(([k])=>!state.iran.includes(k)).map(([k,v])=>[k,v.n]);
  if(!opts.length){alert("همه موارد اضافه شده‌اند.");return}
  promptForm("افزودن نرخ",[["key","مورد",opts]],v=>{if(v.key&&!state.iran.includes(v.key)){state.iran.push(v.key);save();renderIranCached();fetchTGJU()}});
 };
}

/* ---------- bookmarks ---------- */
function renderBookmarks(){
 $("bookmarkList").innerHTML=state.bookmarks.length?state.bookmarks.map((b,i)=>{
  const icon=b.favicon||faviconUrl(b.url);
  return `<a class="bookmark" href="${esc(safeUrl(b.url))}" target="_blank" rel="noopener" title="${esc(b.name)}"><img class="bookmark-favicon" src="${esc(icon)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2214%22 fill=%22%23191b23%22/%3E%3Ctext x=%2232%22 y=%2241%22 text-anchor=%22middle%22 font-size=%2228%22 fill=%22%23ff365f%22%3EN%3C/text%3E%3C/svg%3E'"><span>${esc(b.name)}</span><i class="bookmark-del" data-bdel="${i}" title="حذف">×</i></a>`;
 }).join(""):'<div class="muted">هنوز بوک‌مارکی اضافه نشده.</div>';
}
function initBookmarks(){
 $("bookmarkList").addEventListener("click",e=>{const x=e.target.closest("[data-bdel]");if(!x)return;e.preventDefault();state.bookmarks.splice(+x.dataset.bdel,1);save();renderBookmarks()});
 $("addBookmark").onclick=()=>promptForm("افزودن بوک‌مارک",[["name","نام"],["url","آدرس (https://...)"]],v=>{
  if(!v.name||!v.url)return;
  let u=v.url;if(!/^[a-z][a-z0-9+.-]*:/i.test(u))u="https://"+u;
  if(safeUrl(u)==="#"){alert("آدرس معتبر نیست.");return}
  state.bookmarks.push({name:v.name,url:safeUrl(u),favicon:faviconUrl(u)});save();renderBookmarks();
 });
}

/* ---------- RSS ---------- */
async function fetchFeeds(){
 const res=await Promise.allSettled(state.feeds.map(async f=>{
  const xml=new DOMParser().parseFromString(await getText(f.url),"text/xml");
  let items=[...xml.querySelectorAll("item")];if(!items.length)items=[...xml.querySelectorAll("entry")];
  return items.slice(0,10).map(i=>{
   const l=i.querySelector("link");
   return{title:i.querySelector("title")?.textContent?.trim(),link:l?.getAttribute("href")||l?.textContent?.trim(),date:i.querySelector("pubDate")?.textContent||i.querySelector("updated")?.textContent||i.querySelector("published")?.textContent,feed:f.name};
  }).filter(x=>x.title&&x.link);
 }));
 const all=res.flatMap(r=>r.status==="fulfilled"?r.value:[]).sort((a,b)=>(new Date(b.date)||0)-(new Date(a.date)||0));
 $("rssList").innerHTML=all.length?all.slice(0,30).map(x=>`<a class="rss-item" href="${esc(safeUrl(x.link))}" target="_blank" rel="noopener"><b><span class="feed-tag">${esc(x.feed)}</span>${esc(x.title)}</b><small>${x.date&&!isNaN(new Date(x.date))?esc(new Date(x.date).toLocaleString("fa-IR")):""}</small></a>`).join(""):'<div class="muted">هیچ خبر قابل دریافت نیست.</div>';
}
function renderFeedManage(){
 $("feedManage").innerHTML=state.feeds.length?state.feeds.map((f,i)=>{let h="";try{h=new URL(f.url).hostname}catch{}return `<div class="toggle-row"><span class="feed-name">${esc(f.name)}<small>${esc(h)}</small></span><button class="wt-btn rm" data-rmfeed="${i}">حذف</button></div>`}).join(""):'<div class="muted">هیچ منبعی نیست. با دکمه زیر اضافه کنید.</div>';
}
function initFeeds(){
 $("refreshRSS").onclick=()=>fetchFeeds();
 const dlg=$("feedDialog"),open=()=>{renderFeedManage();dlg.showModal()};
 $("manageFeeds").onclick=open;$("settingsFeeds").onclick=()=>{$("settings").close();open()};$("feedClose").onclick=()=>dlg.close();
 $("feedAddBtn").onclick=()=>{dlg.close();$("addFeed").click()};
 $("feedManage").addEventListener("click",e=>{const b=e.target.closest("[data-rmfeed]");if(!b)return;state.feeds.splice(+b.dataset.rmfeed,1);save();renderFeedManage();fetchFeeds();if(!state.feeds.length)toast("همه منابع حذف شد؛ با + منبع جدید اضافه کنید")});
 $("addFeed").onclick=()=>promptForm("افزودن RSS",[["name","نام Feed"],["url","آدرس RSS / XML"]],async v=>{
  if(!v.name||!v.url)return;
  let u;try{u=new URL(v.url);if(!/^https?:$/.test(u.protocol))throw 0}catch{alert("آدرس RSS معتبر نیست.");return}
  let granted=false;
  try{granted=await chrome.permissions.request({origins:[u.origin+"/*"]})}catch(e){console.warn(e)}
  if(!granted){alert("برای دریافت این RSS باید دسترسی به دامنه آن را تأیید کنید.");return}
  state.feeds.push({name:v.name,url:u.href});save();renderFeedManage();fetchFeeds();
 });
}

/* ---------- prompt dialog ---------- */
function promptForm(title,fields,done){
 $("promptTitle").textContent=title;
 $("promptFields").innerHTML=fields.map(x=>x[2]?`<label>${x[1]}<select id="pf_${x[0]}">${x[2].map(o=>`<option value="${esc(o[0])}">${esc(o[1])}</option>`).join("")}</select></label>`:`<label>${x[1]}<input id="pf_${x[0]}" autocomplete="off"></label>`).join("");
 $("promptDialog").showModal();
 const first=$("promptFields").querySelector("input,select");if(first)first.focus();
 $("promptSave").onclick=()=>{const v={};fields.forEach(x=>v[x[0]]=$("pf_"+x[0]).value.trim());$("promptDialog").close();done(v)};
}
function initPrompt(){
 $("promptClose").onclick=()=>$("promptDialog").close();
 $("promptDialog").addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.tagName==="INPUT"){e.preventDefault();$("promptSave").click()}});
}


/* ---------- calendar (Shamsi default / Gregorian) ---------- */
const FIXED_HOLIDAYS={"1-1":"نوروز","1-2":"نوروز","1-3":"نوروز","1-4":"نوروز","1-12":"روز جمهوری اسلامی","1-13":"روز طبیعت","3-14":"رحلت امام خمینی","3-15":"قیام ۱۵ خرداد","11-22":"پیروزی انقلاب اسلامی","12-29":"ملی شدن صنعت نفت"};
let calOffset=0;
const jFmt=new Intl.DateTimeFormat("en-u-ca-persian-nu-latn",{year:"numeric",month:"numeric",day:"numeric"});
function jOf(d){const p={};jFmt.formatToParts(d).forEach(x=>p[x.type]=x.value);return{y:+p.year,m:+p.month,d:+p.day}}
const addDays=(d,n)=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()+n,12);return x};
const JMONTHS=["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
const GMONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const faNum=n=>String(n).replace(/\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[d]);
function jMonthLen(start){for(const n of [29,30,31]){if(jOf(addDays(start,n)).d===1)return n}return 30}
function jMonthStart(off){
 let t=new Date();t=new Date(t.getFullYear(),t.getMonth(),t.getDate(),12);
 let cur=addDays(t,-(jOf(t).d-1));
 for(let i=0;i<Math.abs(off);i++){cur=off>0?addDays(cur,jMonthLen(cur)):addDays(cur,-jOf(addDays(cur,-1)).d)}
 return cur;
}
function renderCalendar(){
 const g=$("calGrid"),jal=state.calMode!=="gregorian",today=new Date(),tk=today.toDateString();
 let start,len,title,sub;
 if(jal){
  start=jMonthStart(calOffset);len=jMonthLen(start);const j=jOf(start);
  title=`${JMONTHS[j.m-1]} ${faNum(j.y)}`;
  const e=addDays(start,len-1),s1=GMONTHS[start.getMonth()].slice(0,3),s2=GMONTHS[e.getMonth()].slice(0,3);
  sub=`${s1}${s1!==s2?" – "+s2:""} ${e.getFullYear()}`;
 }else{
  const t=new Date(today.getFullYear(),today.getMonth()+calOffset,1,12);start=t;len=new Date(t.getFullYear(),t.getMonth()+1,0).getDate();
  title=`${GMONTHS[t.getMonth()]} ${t.getFullYear()}`;
  const a=jOf(start),b=jOf(addDays(start,len-1));sub=`${JMONTHS[a.m-1]}${a.m!==b.m?" – "+JMONTHS[b.m-1]:""} ${faNum(b.y)}`;
 }
 $("calTitle").textContent=title;$("calSub").textContent=sub;
 $("calMode").textContent=jal?"شمسی":"میلادی";$("calEyebrow").textContent=jal?"SHAMSI CALENDAR":"GREGORIAN CALENDAR";
 g.dir=jal?"rtl":"ltr";
 const heads=jal?["ش","ی","د","س","چ","پ","ج"]:["Su","Mo","Tu","We","Th","Fr","Sa"];
 const firstCol=jal?(start.getDay()+1)%7:start.getDay();
 const fridayCol=jal?6:5;
 let html=heads.map((h,i)=>`<div class="cal-h ${i===fridayCol?"hol":""}">${h}</div>`).join("")+'<div class="cal-e"></div>'.repeat(firstCol);
 for(let i=0;i<len;i++){
  const d=addDays(start,i),j=jOf(d),col=(firstCol+i)%7,key=j.m+"-"+j.d,ev=FIXED_HOLIDAYS[key];
  const main=jal?faNum(j.d):d.getDate(),other=jal?d.getDate():faNum(j.d);
  html+=`<div class="cal-d ${d.toDateString()===tk?"today":""} ${col===fridayCol||ev?"hol":""}" ${ev?`title="${ev}"`:""}><b>${main}</b><small>${other}</small></div>`;
 }
 g.innerHTML=html;
}
function initCalendar(){
 const toggle=()=>{state.calMode=state.calMode==="gregorian"?"jalali":"gregorian";calOffset=0;renderCalendar();save()};
 $("calTitle").onclick=toggle;$("calMode").onclick=toggle;
 $("calPrev").onclick=()=>{calOffset--;renderCalendar()};$("calNext").onclick=()=>{calOffset++;renderCalendar()};
 $("calToday").onclick=()=>{calOffset=0;renderCalendar()};
}

/* ---------- network: public IP + live ping ---------- */
const pingHist={};let pingBusy=false;
async function netIP(){
 const el=$("netIp");el.textContent="...";
 try{
  const j=await getJSON("https://ipwho.is/",8000);
  if(j.success===false)throw new Error("ipwho");
  el.textContent=j.ip;$("netInfo").textContent=[j.city,j.country,j.connection?.isp].filter(Boolean).join(" • ");
 }catch(e){
  try{const j=await getJSON("https://api.ipify.org/?format=json",8000);el.textContent=j.ip;$("netInfo").textContent=""}
  catch(e2){console.warn("ip",e2);el.textContent="--";$("netInfo").textContent="دریافت IP ناموفق بود"}
 }
}
async function pingOnce(url){
 const ac=new AbortController(),t=setTimeout(()=>ac.abort(),3000),t0=performance.now();
 try{await fetch(url,{mode:"no-cors",cache:"no-store",signal:ac.signal});return Math.round(performance.now()-t0)}
 catch{return null}finally{clearTimeout(t)}
}
function spark(h){
 const v=h.filter(x=>x!=null);if(v.length<2)return"";
 const mx=Math.max(...v,1),w=80,ht=20,step=w/Math.max(h.length-1,1);
 const pts=h.map((x,i)=>x==null?null:`${(i*step).toFixed(1)},${(ht-(x/mx)*(ht-2)-1).toFixed(1)}`).filter(Boolean).join(" ");
 return `<svg class="spark" viewBox="0 0 ${w} ${ht}" width="${w}" height="${ht}"><polyline fill="none" stroke="currentColor" stroke-width="1.4" points="${pts}"/></svg>`;
}
function renderPings(){
 const conn=navigator.connection;
 $("netNote").textContent=(navigator.onLine?"آنلاین":"آفلاین")+(conn?.effectiveType?" • "+conn.effectiveType:"")+(conn?.downlink?" • ~"+conn.downlink+" Mbps":"")+" • پینگ از مرورگر (HTTP)";
 $("pingList").innerHTML=state.net.targets.length?state.net.targets.map((t,i)=>{
  const h=pingHist[t.url]||[],last=h[h.length-1],ok=h.filter(x=>x!=null),avg=ok.length?Math.round(ok.reduce((a,b)=>a+b,0)/ok.length):null;
  const loss=h.length?Math.round((h.length-ok.length)/h.length*100):0;
  const cls=last==null?(h.length?"down":""):(last<120?"up":(last<300?"mid":"down"));
  return `<div class="market-row ping-row"><span class="market-name">${esc(t.name)}</span><span class="market-right ${cls}">${spark(h)}<b class="market-value">${last==null?(h.length?"Timeout":"--"):last+" ms"}</b><small class="unit">${avg!=null?"avg "+avg:""}${loss?" • loss "+loss+"%":""}</small><button class="row-x" data-rmping="${i}" title="حذف">×</button></span></div>`;
 }).join(""):'<div class="muted">مقصدی برای پینگ نیست. با + اضافه کنید.</div>';
}
async function pingTick(){
 if(pingBusy||document.hidden||!vis("network"))return;
 pingBusy=true;
 try{
  await Promise.all(state.net.targets.map(async t=>{
   const ms=await pingOnce(t.url),h=pingHist[t.url]??=[];h.push(ms);if(h.length>30)h.shift();
  }));
  renderPings();
 }finally{pingBusy=false}
}
function initNetwork(){
 $("netRefresh").onclick=()=>{netIP();pingTick()};
 $("netIp").onclick=()=>{const v=$("netIp").textContent;if(/\d/.test(v)){navigator.clipboard?.writeText(v).then(()=>toast("IP کپی شد"))}};
 $("pingList").addEventListener("click",e=>{const b=e.target.closest("[data-rmping]");if(!b)return;state.net.targets.splice(+b.dataset.rmping,1);save();renderPings()});
 $("addPing").onclick=()=>promptForm("افزودن مقصد پینگ",[["name","نام (مثلاً DNS)"],["url","آدرس https (مثلاً https://8.8.8.8 یا https://example.com)"]],v=>{
  let u=v.url;if(!u)return;if(!/^https?:\/\//i.test(u))u="https://"+u;
  try{new URL(u)}catch{alert("آدرس معتبر نیست.");return}
  state.net.targets.push({name:v.name||new URL(u).hostname,url:u});save();renderPings();pingTick();
 });
 window.addEventListener("offline",renderPings);
}

/* ---------- photo frame ---------- */
let frameIdx=0,frameTimer=null,frameHover=false,frameFront=0;
function savePhotos(){try{Promise.resolve(chrome.storage.local.set({photos})).catch(e=>{console.warn(e);alert("ذخیره عکس‌ها ناموفق بود (فضا کافی نیست).")})}catch(e){console.warn(e)}}
function renderFrame(){
 const box=$("frameBox");stopFrame();
 if(!photos.length){box.innerHTML='<button class="frame-empty" id="frameEmpty">🖼<span>عکسی اضافه نشده<br>برای افزودن کلیک کنید</span></button>';return}
 frameIdx=clamp(frameIdx,0,photos.length-1);
 box.innerHTML=`<img class="frame-img on" alt=""><img class="frame-img" alt=""><div class="frame-ctl"><button data-fr="next" title="بعدی">‹</button><span class="frame-count"></span><button data-fr="prev" title="قبلی">›</button><button data-fr="del" class="frame-del" title="حذف این عکس">🗑</button></div>`;
 frameFront=0;const imgs=box.querySelectorAll(".frame-img");imgs[0].src=photos[frameIdx];box.querySelector(".frame-count").textContent=`${frameIdx+1} / ${photos.length}`;
 startFrame();
}
function showPhoto(i){
 const box=$("frameBox"),imgs=box.querySelectorAll(".frame-img");if(imgs.length<2||!photos.length)return;
 frameIdx=(i+photos.length)%photos.length;
 const back=1-frameFront;imgs[back].src=photos[frameIdx];
 imgs[back].classList.add("on");imgs[frameFront].classList.remove("on");frameFront=back;
 box.querySelector(".frame-count").textContent=`${frameIdx+1} / ${photos.length}`;
}
function stopFrame(){clearInterval(frameTimer);frameTimer=null}
function startFrame(){
 stopFrame();if(photos.length<2||!vis("frame"))return;
 frameTimer=setInterval(()=>{if(!frameHover&&!document.hidden)showPhoto(frameIdx+1)},Math.max(2,state.frame?.interval||5)*1000);
}
function downscale(file,max=1280){
 return new Promise((res,rej)=>{
  const img=new Image(),url=URL.createObjectURL(file);
  img.onload=()=>{const k=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement("canvas");c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext("2d").drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);res(c.toDataURL("image/jpeg",.82))};
  img.onerror=()=>{URL.revokeObjectURL(url);rej(new Error("bad image"))};img.src=url;
 });
}
function initFrame(){
 const pick=$("framePick");
 $("frameAdd").onclick=()=>pick.click();
 $("frameBox").addEventListener("click",e=>{
  if(e.target.closest("#frameEmpty")){pick.click();return}
  const b=e.target.closest("[data-fr]");if(!b)return;
  if(b.dataset.fr==="next"){showPhoto(frameIdx+1);startFrame()}
  else if(b.dataset.fr==="prev"){showPhoto(frameIdx-1);startFrame()}
  else if(b.dataset.fr==="del"){photos.splice(frameIdx,1);savePhotos();renderFrame()}
 });
 $("frameBox").addEventListener("mouseenter",()=>frameHover=true);$("frameBox").addEventListener("mouseleave",()=>frameHover=false);
 pick.onchange=async()=>{
  const files=[...pick.files].slice(0,40);let n=0;
  for(const f of files){if(photos.length>=80){alert("حداکثر ۸۰ عکس.");break}try{photos.push(await downscale(f));n++}catch{}}
  pick.value="";if(n){savePhotos();frameIdx=photos.length-n;renderFrame()}
 };
 $("frameTime").onclick=()=>promptForm("زمان اسلاید",[["sec","فاصله بین عکس‌ها",[[3,"۳ ثانیه"],[5,"۵ ثانیه"],[10,"۱۰ ثانیه"],[15,"۱۵ ثانیه"],[30,"۳۰ ثانیه"],[60,"۱ دقیقه"],[300,"۵ دقیقه"]]]],v=>{state.frame={...state.frame,interval:Number(v.sec)||5};save();startFrame()});
}

/* ---------- widget remove / restore / manage ---------- */
let toastTimer=null,toastAct=null;
function toast(msg,btn,act){
 $("toastMsg").textContent=msg;const b=$("toastBtn");b.textContent=btn||"";b.style.display=btn?"":"none";toastAct=act||null;
 $("toast").classList.remove("hidden");clearTimeout(toastTimer);toastTimer=setTimeout(()=>$("toast").classList.add("hidden"),btn?7000:2200);
}
function removeWidget(id){
 if(state.hidden.includes(id))return;
 state.hidden.push(id);applyVisibility();renderToggles();save();
 toast(`ویجت «${WIDGETS[id]}» حذف شد`,"بازگردانی",()=>addWidget(id));
}
function addWidget(id){
 state.hidden=state.hidden.filter(x=>x!==id);applyVisibility();renderToggles();save();
 const R={weather:fetchWeather,crypto:fetchCrypto,forex:fetchForex,iran:fetchTGJU,rss:fetchFeeds,network:()=>{netIP();pingTick()},frame:startFrame,calendar:renderCalendar,worldclock:renderClocks};
 if(R[id])safe(()=>Promise.resolve(R[id]()).catch(()=>{}));
 $("widgetGrid").querySelector(`[data-widget="${id}"]`)?.scrollIntoView({behavior:"smooth",block:"nearest"});
}
function initChrome(){
 document.querySelectorAll(".widget").forEach(card=>{
  const head=card.querySelector(".card-head");if(!head)return;
  let box=head.querySelector(":scope > .head-btns");
  if(!box){box=document.createElement("div");box.className="head-btns";[...head.children].filter(c=>c.tagName==="BUTTON").forEach(b=>box.appendChild(b));head.appendChild(box)}
  const x=document.createElement("button");x.className="widget-x";x.title="حذف ویجت";x.textContent="✕";
  x.onclick=e=>{e.stopPropagation();removeWidget(card.dataset.widget)};box.appendChild(x);
 });
 $("toastBtn").onclick=()=>{$("toast").classList.add("hidden");const a=toastAct;toastAct=null;a&&a()};
 $("restoreAll").onclick=()=>{const ids=[...state.hidden];ids.forEach(addWidget)};
}

/* ---------- layout: drag to reorder ---------- */
function initDrag(){
 const g=$("widgetGrid");
 g.addEventListener("pointerdown",e=>{
  if(e.button!==0||resizing)return;
  const head=e.target.closest(".card-head");
  if(!head||e.target.closest("button,input,select,textarea,a"))return;
  const card=head.closest(".widget");if(!card)return;
  const sx=e.clientX,sy=e.clientY,r0=card.getBoundingClientRect();
  let started=false,ghost=null,lastSwap=0,px=sx,py=sy,scroller=null;
  const move=ev=>{
   px=ev.clientX;py=ev.clientY;
   if(!started){
    if(Math.hypot(px-sx,py-sy)<6)return;
    started=true;ghost=card.cloneNode(true);ghost.querySelectorAll("[id]").forEach(n=>n.removeAttribute("id"));ghost.removeAttribute("id");
    ghost.classList.add("drag-ghost");ghost.style.cssText=`position:fixed;left:${r0.left}px;top:${r0.top}px;width:${r0.width}px;height:${r0.height}px;margin:0;z-index:100;pointer-events:none;grid-column:auto;grid-row:auto`;
    document.body.appendChild(ghost);card.classList.add("drag-origin");document.body.classList.add("dragging-widget");
    scroller=setInterval(()=>{if(py<90)window.scrollBy(0,-16);else if(py>innerHeight-90)window.scrollBy(0,16)},30);
   }
   ghost.style.left=(px-(sx-r0.left))+"px";ghost.style.top=(py-(sy-r0.top))+"px";
   if(Date.now()-lastSwap<140)return;
   const t=document.elementsFromPoint(px,py).find(n=>n!==card&&n.classList?.contains("widget")&&n.parentElement===g&&!n.classList.contains("is-hidden"));
   if(!t)return;
   const r=t.getBoundingClientRect(),mx=r.width*.2,my=r.height*.2;
   if(px<r.left+mx||px>r.right-mx||py<r.top+my||py>r.bottom-my)return;
   const kids=[...g.children].filter(n=>n.classList.contains("widget")&&!n.classList.contains("is-hidden"));
   if(kids.indexOf(card)<kids.indexOf(t))t.after(card);else t.before(card);
   lastSwap=Date.now();
  };
  const up=()=>{
   window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",up);window.removeEventListener("pointercancel",up);
   if(!started)return;
   clearInterval(scroller);ghost.remove();card.classList.remove("drag-origin");document.body.classList.remove("dragging-widget");
   state.widgetOrder=[...g.querySelectorAll(":scope > .widget")].map(n=>n.dataset.widget);save();
  };
  window.addEventListener("pointermove",move);window.addEventListener("pointerup",up);window.addEventListener("pointercancel",up);
 });
}

/* ---------- layout: resize widgets ---------- */
function gridCols(){return getComputedStyle($("widgetGrid")).gridTemplateColumns.split(" ").filter(Boolean).length||1}
function applySize(card,id,cols=gridCols()){
 const s=state.sizes[id];
 if(s&&s.c){card.style.gridColumn=`span ${Math.min(s.c,cols)}`}else card.style.gridColumn="";
 if(s&&s.h){card.style.height=s.h+"px";card.style.minHeight="0";card.style.gridRow="auto";card.classList.add("custom-h")}
 else{card.style.height="";card.style.minHeight="";card.style.gridRow="";card.classList.remove("custom-h")}
}
function applySizes(){const cols=gridCols();document.querySelectorAll(".widget").forEach(c=>applySize(c,c.dataset.widget,cols))}
function initResize(){
 document.querySelectorAll(".widget").forEach(card=>{
  const id=card.dataset.widget,h=document.createElement("div");
  h.className="resize-handle";h.title="تغییر اندازه (دابل‌کلیک: بازنشانی)";card.appendChild(h);
  h.addEventListener("dblclick",()=>{delete state.sizes[id];applySize(card,id);save()});
  h.addEventListener("pointerdown",e=>{
   e.preventDefault();e.stopPropagation();resizing=true;h.setPointerCapture(e.pointerId);
   const r=card.getBoundingClientRect(),g=$("widgetGrid"),cs=getComputedStyle(g);
   const gap=parseFloat(cs.columnGap)||16,cols=gridCols(),colW=(g.clientWidth-gap*(cols-1))/cols;
   const sx=e.clientX,sy=e.clientY;card.classList.add("resizing");
   const move=ev=>{
    const w=r.width+(sx-ev.clientX),hh=r.height+(ev.clientY-sy);
    const c=clamp(Math.round((w+gap)/(colW+gap)),1,cols);
    state.sizes[id]={c,h:Math.max(MINH[id]||150,Math.round(hh))};
    applySize(card,id,cols);
   };
   const up=()=>{h.removeEventListener("pointermove",move);h.removeEventListener("pointerup",up);h.removeEventListener("pointercancel",up);card.classList.remove("resizing");setTimeout(()=>resizing=false,0);save()};
   h.addEventListener("pointermove",move);h.addEventListener("pointerup",up);h.addEventListener("pointercancel",up);
  });
 });
 let t;window.addEventListener("resize",()=>{clearTimeout(t);t=setTimeout(applySizes,100)});
}

/* ---------- widget visibility ---------- */
function applyVisibility(){document.querySelectorAll(".widget").forEach(c=>c.classList.toggle("is-hidden",state.hidden.includes(c.dataset.widget)))}
function renderToggles(){
 $("widgetToggles").innerHTML=Object.entries(WIDGETS).map(([id,n])=>{const on=!state.hidden.includes(id);return `<div class="toggle-row"><span>${n}</span><span class="pill ${on?"on":"off"}">${on?"فعال":"حذف‌شده"}</span><button class="wt-btn ${on?"rm":"add"}" data-wt="${id}">${on?"حذف":"افزودن"}</button></div>`}).join("");
}
function initToggles(){
 $("widgetToggles").addEventListener("click",e=>{
  const b=e.target.closest("[data-wt]");if(!b)return;
  const id=b.dataset.wt;state.hidden.includes(id)?addWidget(id):removeWidget(id);
 });
 $("resetSizes").onclick=()=>{state.sizes={};state.widgetOrder=Object.keys(WIDGETS);renderOrder();applySizes();save();toast("چیدمان و اندازه‌ها بازنشانی شد")};
}

/* ---------- wallpaper & settings ---------- */
function loadWallpaper(){const w=state.wallpaper;document.body.style.backgroundImage=w?`url("${w}")`:"";renderWallpapers()}
function renderWallpapers(){
 $("wallpaperPresets").innerHTML=wallpapers.map((w,i)=>`<button class="wallpaper-option ${state.wallpaper===w?"active":""}" style="background-image:url('${w}')" data-w="${i}"></button>`).join("");
}
function initWallpaper(){
 $("wallpaperPresets").addEventListener("click",e=>{const b=e.target.closest("[data-w]");if(!b)return;state.wallpaper=wallpapers[b.dataset.w];loadWallpaper();save()});
 $("wallpaperUpload").onchange=e=>{
  const f=e.target.files[0];if(!f)return;
  const img=new Image(),url=URL.createObjectURL(f);
  img.onload=()=>{
   const k=Math.min(1,1920/img.width),c=document.createElement("canvas");c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);
   c.getContext("2d").drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);
   state.wallpaper=c.toDataURL("image/jpeg",.82);loadWallpaper();save();
  };
  img.onerror=()=>alert("تصویر قابل خواندن نیست.");img.src=url;
 };
 $("clearWallpaper").onclick=()=>{state.wallpaper="";loadWallpaper();save()};
}
function initSettings(){
 const s=$("settings");
 $("settingsBtn").onclick=()=>s.showModal();$("closeSettings").onclick=()=>s.close();
 $("saveSettings").onclick=()=>{state.engine=$("settingEngine").value;$("searchEngine").value=state.engine;save();s.close()};
}

setInterval(()=>safe(updateClock),1000);safe(updateClock);
[initSearch,initTasks,initCalc,initCalendar,initNetwork,initFrame,initWeather,initCrypto,initForex,initIran,initClocks,initBookmarks,initFeeds,initPrompt,initDrag,initResize,initChrome,initToggles,initWallpaper,initSettings].forEach(safe);
load();
