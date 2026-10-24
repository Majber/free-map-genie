import {spawn} from 'node:child_process';
import {mkdtemp,readFile} from 'node:fs/promises';
export const delay=ms=>new Promise(r=>setTimeout(r,ms));
export async function launchVivaldi(existingProfile){
 const profile=existingProfile ?? await mkdtemp('/home/laptop/.hermes/cache/scratch/vivaldi-test-');
 const proc=spawn('/usr/bin/vivaldi',[`--user-data-dir=${profile}`,'--remote-debugging-port=0','--enable-unsafe-extension-debugging','--no-first-run','about:blank'],{stdio:'ignore'});
 let socket;
 try{
  let port;for(let i=0;i<100;i++){try{port=(await readFile(profile+'/DevToolsActivePort','utf8')).split('\n')[0];break;}catch{}await delay(100);}
  const meta=await(await fetch(`http://127.0.0.1:${port}/json/version`)).json();
  socket=new WebSocket(meta.webSocketDebuggerUrl);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j;});
  let id=0;const pending=new Map();const events=[];
  socket.onmessage=e=>{const d=JSON.parse(e.data);if(d.id){const p=pending.get(d.id);pending.delete(d.id);d.error?p?.reject(Error(JSON.stringify(d.error))):p?.resolve(d.result);}else events.push(d);};
  const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});socket.send(JSON.stringify({id:n,method,params,...(sessionId?{sessionId}:{})}));setTimeout(()=>{if(pending.delete(n))reject(Error('Timeout '+method));},20000).unref();});
  const attach=async targetId=>(await send('Target.attachToTarget',{targetId,flatten:true})).sessionId;
  const evaluate=async(sessionId,expression)=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId);if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  const close=async()=>{try{await send('Browser.close');}catch{}socket.close();proc.kill();};
  return {send,attach,evaluate,close,events,meta,profile};
 }catch(e){socket?.close();proc.kill();throw e;}
}
