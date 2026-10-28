import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { makeMedia, vectorImage, sniffMedia, byteRange, MAX_MEDIA_BYTES } from '../lib/media.mjs';
import { createStudioServer } from '../server.mjs';
import { findPath, walkable, cameraTransform } from '../public/navigation.js';

const drawing = {title:'Plan del estudio',elements:[{type:'text',x:60,y:100,text:'<script>alert(1)</script> & plan',fill:'#ffffff'}]};
test('gráficos declarativos: texto escapado y sin HTML, scripts o referencias externas',()=>{
  const svg=vectorImage(drawing).toString();
  assert.match(svg,/&lt;script&gt;/);assert.ok(!svg.includes('<script>'));
  assert.throws(()=>vectorImage({...drawing,elements:[{type:'image',href:'https://example.invalid/private'}]}),/no permitido/);
  assert.throws(()=>vectorImage({...drawing,elements:[{type:'rect',fill:'url(https://example.invalid)'}]}),/Color/);
  assert.throws(()=>sniffMedia(Buffer.from('<svg onload="alert(1)"></svg>')),/externos/);
  assert.throws(()=>sniffMedia(Buffer.alloc(MAX_MEDIA_BYTES+1)),/25 MB/);
});
test('publicación desde Hermes persiste imágenes y atribución real; bloques inválidos no crean archivos',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'studio-media-'));
  const media=await makeMedia({root});const fence=String.fromCharCode(96).repeat(3);
  const result=await media.fromReply('Mi propuesta.\n'+fence+'studio-media\n'+JSON.stringify(drawing)+'\n'+fence,{agentId:'prisma',runId:'test-run'});
  assert.equal(result.reply,'Mi propuesta.');assert.equal(result.assets.length,1);
  assert.equal(result.assets[0].source,'hermes');assert.equal(result.assets[0].agentId,'prisma');
  const restored=await makeMedia({root});assert.equal(restored.list()[0].id,result.assets[0].id);
  assert.match((await restored.content(result.assets[0].id)).bytes.toString(),/<svg/);
  const failed=await media.fromReply(fence+'studio-media\n{"elements":[{"type":"script"}]}\n'+fence,{agentId:'prisma'});
  assert.equal(failed.assets.length,0);assert.equal(failed.warnings.length,1);assert.equal(media.list().length,1);
  await assert.rejects(media.content('../index.local.json'),/no encontrado/);
});
test('HTTP de medios: subida real, tipos, rangos de vídeo, origen y archivos privados',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'studio-media-http-'));const media=await makeMedia({root});
  const notifications=[];const runtime={snapshot:()=>({mode:'real'}),events:[],listeners:new Set(),notifyArtifact:asset=>notifications.push(asset)};
  const {server}=createStudioServer({port:0,runtime,media});server.listen(0,'127.0.0.1');await once(server,'listening');
  const base='http://127.0.0.1:'+server.address().port;
  const bytes=Buffer.concat([Buffer.from([0,0,0,24]),Buffer.from('ftypisom'),Buffer.alloc(32)]);
  try{
    const response=await fetch(base+'/api/media?agentId=prisma&title=Clip',{method:'POST',body:bytes});assert.equal(response.status,201);
    const {asset}=await response.json();assert.equal(asset.kind,'video');assert.equal(asset.source,'upload');assert.equal(notifications.length,1);
    const partial=await fetch(base+asset.url,{headers:{Range:'bytes=4-11'}});assert.equal(partial.status,206);assert.equal(partial.headers.get('content-range'),'bytes 4-11/'+bytes.length);assert.equal(await partial.text(),'ftypisom');
    const invalid=await fetch(base+asset.url,{headers:{Range:'bytes=1000-'}});assert.equal(invalid.status,416);assert.equal(invalid.headers.get('content-range'),'bytes */'+bytes.length);
    assert.equal((await fetch(base+'/api/media?agentId=prisma&title=HTML',{method:'POST',body:'<html>no</html>'})).status,415);
    assert.equal((await fetch(base+'/api/media?agentId=prisma&title=Clip',{method:'POST',headers:{Origin:'https://example.invalid'},body:bytes})).status,403);
    assert.equal((await fetch(base+'/.runtime/hermes-office/media/index.local.json')).status,404);
    assert.ok(!JSON.stringify(await(await fetch(base+'/api/media')).json()).includes(root));
    assert.deepEqual(byteRange('bytes=-4',bytes.length),{start:bytes.length-4,end:bytes.length-1});
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
test('rutas entre oficina y TV evitan muebles; la cámara mantiene el mundo dentro de sus límites',()=>{
  const route=findPath({x:500,y:900},{x:1320,y:530});assert.ok(route.length>0);
  assert.ok(route.every(point=>walkable(point.x,point.y)));assert.deepEqual(route.at(-1),{x:1320,y:530});
  assert.equal(findPath({x:500,y:900},{x:1200,y:650}).length,0);
  const transform=cameraTransform({x:1600,y:1080,zoom:1,width:390,height:550});assert.equal(transform.x,390-1660);assert.equal(transform.y,550-1080);
  const fit=cameraTransform({x:500,y:900,zoom:.2,width:390,height:550});assert.ok(fit.x>0&&fit.y>0);
});
