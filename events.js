(() => {
  const emptyEl=document.getElementById("events-empty");
  const list=document.getElementById("events-list");
  if(!list) return;
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const fmt=d=>{
    if(!d) return "";
    const x=new Date(d+"T00:00:00");
    return isNaN(x)?d:x.toLocaleDateString("en-AU",{weekday:"short",day:"numeric",month:"long",year:"numeric"});
  };
  fetch("data/events.json",{cache:"no-store"})
    .then(r=>{if(!r.ok) throw new Error("Unable to load events");return r.json()})
    .then(data=>{
      const events=(data.events||[]).filter(e=>e.show!==false).sort((a,b)=>String(a.date||"").localeCompare(String(b.date||"")));
      if(!events.length) return;
      emptyEl.style.display="none";
      list.innerHTML=events.map(e=>{
        const poster=e.poster?'<div class="event-poster"><img src="'+esc(e.poster)+'" alt="'+esc(e.title||"Event")+' poster"></div>':"";
        const date=e.date?'<div class="event-date">'+esc(fmt(e.date))+'</div>':"";
        return '<article class="event-card">'+poster+'<div class="event-content">'+date+'<h2>'+esc(e.title||"Event")+'</h2><p class="muted">'+esc(e.description||"")+'</p></div></article>';
      }).join("");
    }).catch(()=>{});
})();