export const voiceProfiles = Object.freeze({
  atlas:{voice:'davefx',rate:.94,label:'Masculina · pausada'},
  pixel:{voice:'davefx',rate:1.08,label:'Masculina · ágil'},
  prisma:{voice:'daniela',rate:1.03,label:'Femenina · expresiva'},
  ux:{voice:'daniela',rate:.96,label:'Femenina · serena'},
  nodo:{voice:'davefx',rate:1,label:'Masculina · cercana'},
  lupa:{voice:'davefx',rate:.98,label:'Masculina · precisa'},
});
const aliases={atlas:['camilo'],pixel:['santi','santiago','santy'],prisma:['cata','catalina'],ux:['vale','valentina'],nodo:['nico','nicolas'],lupa:['pipe','felipe']};
const norm=text=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function routeVoice(text, activeAgent=null) {
  const original=String(text||'').trim();const tokens=[...original.matchAll(/[\p{L}\p{N}]+/gu)];
  const words=tokens.map(match=>norm(match[0]));
  if(!words.length)return {type:'empty'};
  const command=words.join(' ');
  if(activeAgent&&activeAgent!=='ux'&&/^(vale|vale gracias|vale de acuerdo)$/.test(command))return {type:'message',agentId:activeAgent,message:original};
  if(/^(?:lina )?(?:apaga(?:r)? (?:el )?microfono|desactiva(?:r)? (?:el )?microfono|deja de escuchar)$/.test(command))return {type:'off'};
  if(/^(?:lina )?(?:cuelga|termina(?:r)? (?:la )?llamada|finaliza(?:r)? (?:la )?llamada|silencio)$/.test(command))return {type:'hangup'};
  let index=0;while(['hola','oye','hey','lina','por','favor','llama','llamar','llamame','conecta','conectame','quiero','hablar','con','a','al','el','agente'].includes(words[index]))index++;
  const matches=Object.entries(aliases).filter(([,names])=>names.includes(words[index]));
  if(matches.length){
    if(['y','o'].includes(words[index+1])&&Object.values(aliases).flat().includes(words[index+2]))return {type:'ambiguous'};
    const agentId=matches[0][0];let message=original.slice(tokens[index].index+tokens[index][0].length).replace(/^[\s,.:;!?¡¿—-]+/u,'').trim();
    if(/^(por favor|gracias)$/i.test(message))message='';
    return {type:message?'message':'call',agentId,message};
  }
  if(words.slice(0,2).includes('lina'))return {type:'help'};
  if(activeAgent&&Object.hasOwn(aliases,activeAgent))return {type:'message',agentId:activeAgent,message:original};
  return {type:'unaddressed'};
}
export function spokenReply(text) {
  return String(text||'').replace(/```[\s\S]*?```/g,' Hay un bloque de código en el chat. ').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/https?:\/\/\S+/g,' enlace en el chat ').replace(/[#*_`>|]/g,'').replace(/\s+/g,' ').trim().slice(0,1600);
}
