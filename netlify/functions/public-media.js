exports.handler=async(event)=>{
  if(event.httpMethod!=="GET") return {statusCode:405,body:"Method not allowed"};
  const key=(event.queryStringParameters||{}).key;
  if(!key||!key.startsWith("event-images/")) return {statusCode:400,body:"Invalid key"};
  try{
    const mod=await import("@netlify/blobs");
    mod.connectLambda(event);
    const store=mod.getStore("purebred-admin");
    const entry=await store.getWithMetadata(key,{type:"arrayBuffer"});
    if(!entry||!entry.data) return {statusCode:404,body:"Not found"};
    const contentType=(entry.metadata&&entry.metadata.contentType)||"application/octet-stream";
    return {statusCode:200,headers:{"content-type":contentType,"cache-control":"public, max-age=31536000, immutable"},isBase64Encoded:true,body:Buffer.from(entry.data).toString("base64")};
  }catch(e){return {statusCode:500,body:"Unable to load image"}}
};
