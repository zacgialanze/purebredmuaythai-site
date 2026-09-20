const crypto=require("crypto");
const json=(status,body)=>({statusCode:status,headers:{"content-type":"application/json","cache-control":"no-store"},body:JSON.stringify(body)});
function key(){
  const u=process.env.ADMIN_USERNAME||"", p=process.env.ADMIN_PASSWORD||"";
  return crypto.createHash("sha256").update("purebred-admin-v1:"+u+":"+p).digest();
}
function b64(s){return Buffer.from(s).toString("base64url")}
function sign(payload){return crypto.createHmac("sha256",key()).update(payload).digest("base64url")}
exports.handler=async(event)=>{
  if(event.httpMethod!=="POST") return json(405,{error:"Method not allowed"});
  const expectedPass=process.env.ADMIN_PASSWORD, expectedUser=process.env.ADMIN_USERNAME;
  if(!expectedPass||!expectedUser) return json(500,{error:"Admin username/password are not configured"});
  let body={}; try{body=JSON.parse(event.body||"{}")}catch{}
  const user=String(body.username||""), pass=String(body.password||"");
  const userOk=user===expectedUser;
  const a=Buffer.from(pass), b=Buffer.from(expectedPass);
  const passOk=a.length===b.length && crypto.timingSafeEqual(a,b);
  if(!userOk||!passOk) return json(401,{error:"Incorrect username or password"});
  const payload=b64(JSON.stringify({exp:Date.now()+12*60*60*1000,user}));
  return json(200,{token:payload+"."+sign(payload)});
};