const crypto=require("crypto");
const json=(status,body)=>({statusCode:status,headers:{"content-type":"application/json","cache-control":"no-store"},body:JSON.stringify(body)});
function key(){
  const u="Adam", p=process.env.ADMIN_PASSWORD||"";
  return crypto.createHash("sha256").update("purebred-admin-v1:"+u+":"+p).digest();
}
function verify(token){
  if(!token||!process.env.ADMIN_PASSWORD)return false;
  const parts=token.split("."); if(parts.length!==2)return false;
  const p=parts[0], s=parts[1];
  const good=crypto.createHmac("sha256",key()).update(p).digest("base64url");
  if(s.length!==good.length||!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(good)))return false;
  try{return JSON.parse(Buffer.from(p,"base64url").toString()).exp>Date.now()}catch{return false}
}
exports.handler=async(event)=>{
  if(event.httpMethod!=="POST") return json(405,{error:"Method not allowed"});
  const token=(event.headers.authorization||"").replace(/^Bearer\s+/i,"");
  if(!verify(token)) return json(401,{error:"Please log in again"});
  let body; try{body=JSON.parse(event.body||"{}")}catch{return json(400,{error:"Invalid JSON"})}
  try{
    const mod=await import("@netlify/blobs");
    mod.connectLambda(event);
    const store=mod.getStore("purebred-admin");
    if(body.action==="save-timetable"){
      await store.setJSON("timetable",body.data||{days:[]});
      return json(200,{ok:true});
    }
    if(body.action==="save-events"){
      await store.setJSON("events",body.data||{events:[]});
      return json(200,{ok:true});
    }
    if(body.action==="upload-image"){
      const raw=String(body.base64||"").replace(/^data:[^;]+;base64,/,"");
      if(!raw)return json(400,{error:"No image supplied"});
      const bytes=Buffer.from(raw,"base64");
      if(bytes.length>3*1024*1024)return json(400,{error:"Image must be under 3 MB"});
      const ext=(String(body.ext||"jpg").toLowerCase().match(/^(jpg|jpeg|png|webp)$/)||["jpg"])[0];
      const contentType=ext==="png"?"image/png":ext==="webp"?"image/webp":"image/jpeg";
      const blobKey="event-images/"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+"."+ext;
      await store.set(blobKey,bytes,{metadata:{contentType}});
      return json(200,{ok:true,path:"/.netlify/functions/public-media?key="+encodeURIComponent(blobKey)});
    }
    return json(400,{error:"Unknown action"});
  }catch(e){return json(500,{error:e.message})}
};