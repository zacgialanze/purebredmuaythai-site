const json=(status,body)=>({statusCode:status,headers:{"content-type":"application/json","cache-control":"no-store"},body:JSON.stringify(body)});
exports.handler=async(event)=>{
  if(event.httpMethod!=="GET") return json(405,{error:"Method not allowed"});
  const type=(event.queryStringParameters||{}).type;
  if(type!=="timetable"&&type!=="events") return json(400,{error:"Invalid type"});
  try{
    const mod=await import("@netlify/blobs");
    mod.connectLambda(event);
    const store=mod.getStore({name:"purebred-admin",consistency:"strong"});
    const saved=await store.get(type,{type:"json"});
    if(saved) return json(200,saved);
  }catch(e){}
  try{
    const fallback=type==="timetable"?require("../../data/timetable.json"):require("../../data/events.json");
    return json(200,fallback);
  }catch(e){
    return json(200,type==="timetable"?{days:[]}:{events:[]});
  }
};