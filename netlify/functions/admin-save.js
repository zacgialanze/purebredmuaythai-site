const crypto=require("crypto");
const OWNER="zacgialanze",REPO="purebredmuaythai-site",BRANCH="main";
const json=(status,body)=>({statusCode:status,headers:{"content-type":"application/json","cache-control":"no-store"},body:JSON.stringify(body)});
function verify(token){
  const secret=process.env.ADMIN_SECRET;if(!secret||!token)return false;
  const [p,s]=token.split(".");if(!p||!s)return false;
  const good=crypto.createHmac("sha256",secret).update(p).digest("base64url");
  if(s.length!==good.length||!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(good)))return false;
  try{return JSON.parse(Buffer.from(p,"base64url").toString()).exp>Date.now()}catch{return false}
}
async function gh(path,opts={}){
  const token=process.env.GITHUB_TOKEN;if(!token)throw new Error("GITHUB_TOKEN is not configured");
  const r=await fetch("https://api.github.com/repos/"+OWNER+"/"+REPO+"/contents/"+path,{
    ...opts,headers:{accept:"application/vnd.github+json",authorization:"Bearer "+token,"x-github-api-version":"2022-11-28",...(opts.headers||{})}
  });
  if(!r.ok)throw new Error("GitHub "+r.status+": "+await r.text()); return r.json();
}
async function writeText(path,content,message){
  let sha; try{sha=(await gh(path+"?ref="+BRANCH)).sha}catch{}
  return gh(path,{method:"PUT",body:JSON.stringify({message,content:Buffer.from(content).toString("base64"),branch:BRANCH,...(sha?{sha}:{})})});
}
exports.handler=async(event)=>{
  if(event.httpMethod!=="POST")return json(405,{error:"Method not allowed"});
  const token=(event.headers.authorization||"").replace(/^Bearer\s+/i,"");
  if(!verify(token))return json(401,{error:"Please log in again"});
  let body;try{body=JSON.parse(event.body||"{}")}catch{return json(400,{error:"Invalid JSON"})}
  try{
    if(body.action==="save-timetable"){
      await writeText("data/timetable.json",JSON.stringify(body.data,null,2),"Admin: update timetable");
      return json(200,{ok:true});
    }
    if(body.action==="save-events"){
      await writeText("data/events.json",JSON.stringify(body.data,null,2),"Admin: update events");
      return json(200,{ok:true});
    }
    if(body.action==="upload-image"){
      const raw=String(body.base64||"").replace(/^data:[^;]+;base64,/,"");
      if(!raw)return json(400,{error:"No image supplied"});
      const bytes=Buffer.from(raw,"base64");
      if(bytes.length>3*1024*1024)return json(400,{error:"Image must be under 3 MB"});
      const ext=(String(body.ext||"jpg").toLowerCase().match(/^(jpg|jpeg|png|webp)$/)||["jpg"])[0];
      const path="assets/events/"+Date.now()+"."+ext;
      await gh(path,{method:"PUT",body:JSON.stringify({message:"Admin: upload event image",content:bytes.toString("base64"),branch:BRANCH})});
      return json(200,{ok:true,path:"/"+path});
    }
    return json(400,{error:"Unknown action"});
  }catch(e){return json(500,{error:e.message})}
};