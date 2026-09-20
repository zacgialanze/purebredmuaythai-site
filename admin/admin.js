const $=s=>document.querySelector(s);
// Keep login usable when a browser blocks session storage.
let token="";
try{token=sessionStorage.getItem("purebred_admin_token")||""}catch{}
function rememberToken(value){
  token=value;
  try{if(value)sessionStorage.setItem("purebred_admin_token",value);else sessionStorage.removeItem("purebred_admin_token")}catch{}
}
async function request(path,options={}){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),20000);
  try{
    const r=await fetch(path,{...options,signal:controller.signal});
    const d=await r.json().catch(()=>{throw new Error("The server returned an unexpected response. Please try again.")});
    if(!r.ok)throw new Error(d.error||"Request failed. Please try again.");
    return d;
  }catch(err){
    if(err.name==="AbortError")throw new Error("The connection timed out. Please try again.");
    throw err;
  }finally{clearTimeout(timeout)}
}
let timetable={days:[]},events={events:[]};
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
function status(m,ok=true){const e=$("#status");e.textContent=m;e.className="status show "+(ok?"ok":"bad");setTimeout(()=>e.classList.remove("show"),3500)}
async function api(path,body){
  return request(path,{method:"POST",headers:{"content-type":"application/json",...(token?{authorization:"Bearer "+token}:{})},body:JSON.stringify(body)});
}
async function login(e){
  e.preventDefault();
  const button=$("#loginForm button");
  if(button.disabled)return;
  button.disabled=true;button.textContent="Signing in…";
  $("#loginMsg").textContent="Checking your login…";
  try{
    const d=await api("/.netlify/functions/admin-auth",{username:$("#username").value.trim(),password:$("#password").value});
    if(!d.token)throw new Error("Sign-in did not complete. Please try again.");
    rememberToken(d.token);
    $("#loginMsg").textContent="Signed in. Loading dashboard…";
    await start();
    $("#password").value="";
    $("#loginMsg").textContent="";
  }catch(err){$("#loginMsg").textContent=err.message}
  finally{button.disabled=false;button.textContent="Log in"}
}
async function start(){
  const pair=await Promise.all([
    request("/.netlify/functions/public-data?type=timetable&"+Date.now()),
    request("/.netlify/functions/public-data?type=events&"+Date.now())
  ]);
  if(!Array.isArray(pair[0]?.days)||!Array.isArray(pair[1]?.events)){
    throw new Error("Dashboard data could not be loaded. Please try again.");
  }
  timetable=pair[0];events=pair[1];
  renderTimetable();renderEvents();
  $("#loginView").hidden=true;$("#dashboard").hidden=false;
}
function classRow(c,ci){
  return '<div class="class-row" data-class="'+ci+'">'+
    '<input class="c-time" placeholder="Time" value="'+esc(c.time)+'">'+
    '<input class="c-name" placeholder="Class name" value="'+esc(c.name)+'">'+
    '<select class="c-cat">'+
      '<option value="all"'+(c.category==="all"?' selected':'')+'>All levels</option>'+
      '<option value="kids"'+(c.category==="kids"?' selected':'')+'>Kids 4–7</option>'+
      '<option value="juniors"'+(c.category==="juniors"?' selected':'')+'>Juniors 8–12</option>'+
      '<option value="beginners"'+(c.category==="beginners"?' selected':'')+'>Beginners</option>'+
      '<option value="advanced"'+(c.category==="advanced"?' selected':'')+'>Advanced</option>'+
    '</select><button class="danger del-class">Delete</button></div>';
}
function renderTimetable(){
  $("#timetableEditor").innerHTML=timetable.days.map((d,di)=>
    '<div class="day-card" data-day="'+di+'"><div class="day-head"><h3>'+esc(d.day)+'</h3><button class="ghost add-class">+ Add class</button></div><div class="classes">'+
    (d.classes||[]).map((c,ci)=>classRow(c,ci)).join("")+'</div></div>'
  ).join("");
  bindTimetable();
}
function readTimetable(){
  document.querySelectorAll(".day-card").forEach(card=>{
    const di=+card.dataset.day;
    timetable.days[di].classes=Array.from(card.querySelectorAll(".class-row")).map(r=>({
      time:r.querySelector(".c-time").value.trim(),
      name:r.querySelector(".c-name").value.trim(),
      category:r.querySelector(".c-cat").value
    }));
  });
}
function bindTimetable(){
  document.querySelectorAll(".add-class").forEach(b=>b.onclick=()=>{
    readTimetable();const di=+b.closest(".day-card").dataset.day;
    timetable.days[di].classes.push({time:"",name:"",category:"all"});renderTimetable();
  });
  document.querySelectorAll(".del-class").forEach(b=>b.onclick=()=>{
    readTimetable();const card=b.closest(".day-card"),di=+card.dataset.day,ci=+b.closest(".class-row").dataset.class;
    timetable.days[di].classes.splice(ci,1);renderTimetable();
  });
}
function eventCard(e,i){
  return '<div class="event-edit" data-event="'+i+'">'+
    '<div class="section-head"><h3>Event '+(i+1)+'</h3><button class="danger del-event">Delete</button></div>'+
    '<div class="event-grid"><label>Event name<input class="e-title" value="'+esc(e.title)+'"></label><label>Date<input class="e-date" type="date" value="'+esc(e.date)+'"></label></div>'+
    '<label>Information<textarea class="e-desc">'+esc(e.description)+'</textarea></label>'+
    '<label>Poster image<input class="e-file" type="file" accept="image/jpeg,image/png,image/webp"></label>'+
    (e.poster?'<img class="event-preview" src="'+esc(e.poster)+'" alt=""><div class="small">'+esc(e.poster)+'</div>':'')+
    '<label class="check"><input class="e-show" type="checkbox"'+(e.show!==false?' checked':'')+'> Show this event on the website</label>'+
    '<input class="e-poster" type="hidden" value="'+esc(e.poster||"")+'"></div>';
}
function renderEvents(){
  const list=events.events||[];
  $("#eventsEditor").innerHTML=list.length?list.map(eventCard).join(""):'<p class="small">No events yet. Click “Add event”.</p>';
  bindEvents();
}
function readEvents(){
  events.events=Array.from(document.querySelectorAll(".event-edit")).map(r=>{
    const old=events.events[+r.dataset.event]||{};
    return {id:old.id||uid(),title:r.querySelector(".e-title").value.trim(),date:r.querySelector(".e-date").value,description:r.querySelector(".e-desc").value.trim(),poster:r.querySelector(".e-poster").value,show:r.querySelector(".e-show").checked};
  });
}
async function upload(input,hidden){
  const f=input.files[0];if(!f)return;
  if(f.size>3*1024*1024){status("Image must be under 3 MB",false);input.value="";return}
  const b64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f)});
  status("Uploading image…");
  const ext=(f.name.split(".").pop()||"jpg").toLowerCase();
  const d=await api("/.netlify/functions/admin-save",{action:"upload-image",base64:b64,ext});
  hidden.value=d.path;readEvents();renderEvents();status("Image uploaded");
}
function bindEvents(){
  document.querySelectorAll(".del-event").forEach(b=>b.onclick=()=>{readEvents();events.events.splice(+b.closest(".event-edit").dataset.event,1);renderEvents()});
  document.querySelectorAll(".e-file").forEach(i=>i.onchange=()=>upload(i,i.closest(".event-edit").querySelector(".e-poster")).catch(e=>status(e.message,false)));
}
$("#loginForm").addEventListener("submit",login);
$("#logoutBtn").onclick=()=>{rememberToken("");location.reload()};
$("#addEvent").onclick=()=>{readEvents();events.events.push({id:uid(),title:"",date:"",description:"",poster:"",show:true});renderEvents()};
$("#saveTimetable").onclick=async()=>{readTimetable();try{status("Saving timetable…");await api("/.netlify/functions/admin-save",{action:"save-timetable",data:timetable});status("Timetable saved.")}catch(e){status(e.message,false)}};
$("#saveEvents").onclick=async()=>{readEvents();try{status("Saving events…");await api("/.netlify/functions/admin-save",{action:"save-events",data:events});status("Events saved.")}catch(e){status(e.message,false)}};
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));$("#timetablePanel").hidden=b.dataset.tab!=="timetable";$("#eventsPanel").hidden=b.dataset.tab!=="events"});
$("#loginForm button").disabled=false;
$("#loginMsg").textContent="";
if(token)start().catch(err=>{$("#loginMsg").textContent=err.message});