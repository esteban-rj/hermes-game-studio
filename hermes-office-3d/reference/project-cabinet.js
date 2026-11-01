import { characterMarkup } from './vector-characters.js';

const el = (tag, cls, text) => { const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node; };
export function createCabinet({ getState, onSelect }) {
  const dialog=document.querySelector('#projects-dialog');
  const list=document.querySelector('#project-folders');
  const status=document.querySelector('#project-status');
  const open=()=>{render();if(!dialog.open)dialog.showModal();};
  document.querySelector('#open-projects').addEventListener('click',open);
  document.querySelector('#close-projects').addEventListener('click',()=>dialog.close());
  document.querySelector('#office-cabinet').addEventListener('click',event=>{event.stopPropagation();open();});
  document.querySelector('#office-cabinet').addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();event.stopPropagation();open();}});
  async function choose(id) {
    status.textContent='';
    try { await onSelect(id);dialog.close(); } catch(error){status.textContent=error.message;}
  }
  document.querySelector('#general-conversation').addEventListener('click',()=>choose('studio'));
  function render() {
    const state=getState();
    const projects=state.projects.filter(project=>project.id!=='studio');
    const active=state.projects.find(project=>project.id===state.projectId);
    document.querySelector('#active-project-name').textContent=active?.name || 'Conversación general';
    document.querySelector('#project-counter').textContent=projects.filter(project=>project.available).length+' PROYECTOS CONECTADOS';
    list.replaceChildren(...projects.map((project,index)=>{
      const card=el('article','project-folder'+(project.id===state.projectId?' selected':''));
      const heading=el('div','project-heading');const title=el('div');title.append(el('small',null,'CARPETA '+String(index+1).padStart(2,'0')),el('h3',null,project.name));
      heading.append(el('span','folder-symbol','▱'),title,el('span','project-access-badge',project.available?(project.permissions==='read-write'?'LECTURA + EDICIÓN':'SÓLO LECTURA'):'SIN CONEXIÓN'));card.append(heading);
      const locations=el('dl','project-locations');
      for(const [label,value] of [['Espacio de trabajo de los agentes',project.workspace||'Sin configurar'],['Carpeta original',project.root||'Sin configurar']]){const row=el('div');row.append(el('dt',null,label),el('dd',null,value));locations.append(row);}card.append(locations);
      if(project.baseCommit)card.append(el('p','project-commit','WORKTREE · '+project.baseCommit.slice(0,8)+' · '+(project.sourceUncommittedEntries||0)+' cambios originales excluidos al crearlo'));
      const team=el('div','project-team');team.setAttribute('aria-label','Agentes con acceso a '+project.name);
      for(const agent of state.agents){const allowed=project.available&&project.agents.includes(agent.id);const person=el('div','project-person');person.dataset.allowed=String(allowed);const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','-36 -126 78 132');svg.setAttribute('aria-hidden','true');svg.innerHTML=characterMarkup(agent.id,{portrait:true,activity:'portrait'});person.append(svg,el('strong',null,agent.name),el('small',null,allowed?'Con acceso':'Sin acceso'));team.append(person);}card.append(team);
      const button=el('button','primary-button',project.id===state.projectId?'Proyecto seleccionado ✓':'Trabajar en este proyecto →');button.type='button';button.disabled=!project.available||Boolean(state.busy)||state.sending;button.addEventListener('click',()=>choose(project.id));card.append(button);return card;
    }));
    if(!projects.length)list.append(el('p','muted','No hay carpetas conectadas. Configura el registro privado .runtime/projects.local.json.'));
    document.querySelector('#general-conversation').disabled=Boolean(state.busy)||state.sending;
  }
  return { open, render };
}
