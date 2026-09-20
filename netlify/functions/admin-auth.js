const crypto=require("crypto");
const json=(status,body)=>({statusCode:status,headers:{"content-type":"application/json","cache-control":"no-store"},body:JSON.stringify(body)});
function b64(s){return Buffer.from(s).toString("base64url")}
function sign(payload,secret){return crypto.createHmac("sha256",secret).update(payload).digest("base64url")}
exports.handler=async(event)=>{
  if(event.httpMethod!=="POST") return json(405,{error:"Method not allowed"});
  const secret=process.env.ADMIN_SECRET, expectedPass=process.env.ADMIN_PASSWORD, expectedUser=process.env.ADMIN_USERNAME;
  if(!secret||!expectedPass||!expectedUser) return json(500,{error:"Admin environment variables are not configured"});
  let body={}; try{body=JSON.parse(event.body||"{}")}catch{}
  const user=String(body.username||""), pass=String(body.password||"");
  const userOk=user===expectedUser;
  const a=Buffer.from(pass), b=Buffer.from(expectedPass);
  const passOk=a.length===b.length && crypto.timingSafeEqual(a,b);
  if(!userOk||!passOk) return json(401,{error:"Incorrect username or password"});
  const payload=b64(JSON.stringify({exp:Date.now()+12*60*60*1000,user}));
  return json(200,{token:payload+"."+sign(payload,secret)});
};