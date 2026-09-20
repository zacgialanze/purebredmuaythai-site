const crypto=require("crypto");
const json=(status,body)=>({statusCode:status,headers:{"content-type":"application/json","cache-control":"no-store"},body:JSON.stringify(body)});
function b64(s){return Buffer.from(s).toString("base64url")}
function sign(payload,secret){return crypto.createHmac("sha256",secret).update(payload).digest("base64url")}
exports.handler=async(event)=>{
  if(event.httpMethod!=="POST") return json(405,{error:"Method not allowed"});
  const secret=process.env.ADMIN_SECRET, expected=process.env.ADMIN_PASSWORD;
  if(!secret||!expected) return json(500,{error:"Admin environment variables are not configured"});
  let body={}; try{body=JSON.parse(event.body||"{}")}catch{}
  const supplied=String(body.password||"");
  const a=Buffer.from(supplied), b=Buffer.from(expected);
  if(a.length!==b.length || !crypto.timingSafeEqual(a,b)) return json(401,{error:"Incorrect password"});
  const payload=b64(JSON.stringify({exp:Date.now()+12*60*60*1000}));
  return json(200,{token:payload+"."+sign(payload,secret)});
};