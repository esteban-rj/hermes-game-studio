// Original anime-inspired vector portraits: pointed silhouettes, cel shading and
// layered irises. No external assets, fonts, IDs or user-provided SVG enter here.
export function animeHead(id, p) {
  const ink = '#25263e';
  const iris = {lina:'#b08ed8',atlas:'#997bea',pixel:'#63b6f4',prisma:'#c47462',ux:'#56c5bd',nodo:'#94b783',lupa:'#d6a94f',player:'#7997b6'}[id];
  const shapes = {
    lina:'M-21-76Q-24-103-3-107 21-108 22-80L16-72 14-88 8-84 2-95-4-86-9-94-16-82-17-74Z',
    atlas:'M-21-77-23-89-18-99-9-101-4-110 7-104 17-105 23-94 21-77 15-88 9-85 4-96-1-86-8-92-13-82-17-85Z',
    pixel:'M-22-76-23-91-17-97-20-103-7-102-3-111 7-104 17-107 16-100 25-97 21-77 15-88 8-83 4-94-3-84-8-91-15-80-17-88Z',
    prisma:'M-21-77Q-25-103-3-107 20-111 22-82L17-72 14-89 9-83 4-94-2-86-5-96-12-85-16-88Z',
    ux:'M-21-73Q-28-100-4-106 23-109 23-78L17-68 15-87 11-81 4-96-1-87-5-94-12-82-16-85-17-72Z',
    nodo:'M-21-76Q-27-96-11-103L3-107 19-100 22-91 20-76 14-87 10-85 4-93-1-88-10-91-14-82-17-85Z',
    lupa:'M-21-76-24-87-20-96-13-97-12-105-3-103 4-109 11-103 20-102 22-94 26-90 20-76 15-88 10-84 4-93-1-86-7-93-12-83-16-87Z',
    player:'M-20-76-23-91-16-102-5-102 1-108 12-103 20-97 22-78 16-88 9-85 3-94-3-87-10-93-14-82Z',
  };
  const back = id === 'prisma' ? '<path d="M-18-94q-13 17-9 44l12-6 6 3 21-2 14 5q4-29-8-45Z"/>' : id === 'ux' ? '<path d="M14-95q14-13 20-2 4 7-6 18l-4-4-3 9-5-18Z"/><path d="M-19-89q-10 17-3 35l9-7 24 1 12 6q6-23-4-36Z"/>' : '';
  const glasses = ['atlas','player'].includes(id) ? `<g fill="none" stroke="${ink}" stroke-width="1.1"><path d="M-17-79h14v10H-15Zm20 0h14l-2 10H3ZM-3-76h6m-23-1h3m34 0h3"/><path d="m-14-77 5 5m15-5 5 5" stroke="#fff" opacity=".45"/></g>` : '';
  const eyes = [-8,8].map(x=>`<g transform="translate(${x} -75)"><path d="M-5-4q5-5 10 0l-1 8q-4 3-8 0Z" fill="#fff6eb"/><ellipse cy=".5" rx="3.4" ry="5.5" fill="${iris}"/><path d="M-3-2q3-4 6 0v3H-3Z" fill="${ink}" opacity=".5"/><ellipse cy=".5" rx="1.4" ry="3.6" fill="${ink}"/><circle cx="-1.3" cy="-2.2" r="1.4" fill="#fff"/><circle cx="1.4" cy="3" r=".7" fill="#fff5cc"/><path d="M-5-4q5-5 10 0l2-1" stroke="${ink}" stroke-width="1.8" fill="none"/><path d="M-4 5q4 2 8 0" stroke="${p.shade}" stroke-width=".8" fill="none"/></g>`).join('');
  return `<g class="anime-face"><g fill="${p.hair}" stroke="${ink}" stroke-width=".8">${back}</g>
    <path d="M-5-63h10v14l-5 4-5-4Z" fill="${p.skin}"/><path d="M-5-61h10v7l-5 3-5-3Z" fill="${p.shade}"/>
    <path d="M-19-79q-6-5-5 3t7 9m36-12q6-5 5 3t-7 9" fill="${p.skin}" stroke="${p.shade}" stroke-width=".8"/>
    <path d="M-20-88q2-16 20-16t20 16l-2 17-5 9L0-53l-13-9-5-9Z" fill="${p.skin}" stroke="${p.shade}" stroke-width=".8"/>
    <path d="M-19-88-15-70-8-61 0-54-13-62-18-71Z" fill="${p.shade}" opacity=".6"/><path d="m4-90 11 4 3 14-6 9 8-8 1-17-8-10Z" fill="#fff6df" opacity=".16"/>
    <g class="sprite-eyes">${eyes}</g>
    <path class="sprite-closed-eyes" d="M-14-74q6 5 12-1m-13 0-2-2m19 2q6 5 12-1m0 0 2-2" stroke="${ink}" stroke-width="1.7" fill="none"/>
    <path d="m-13-85 10 1m6 0 10-1" stroke="${p.hair}" stroke-width="1.5" fill="none"/><path d="m0-74-2 8 3 .4" fill="none" stroke="${p.shade}" stroke-width=".8"/>
    <path d="m-15-66 1 2m2-2 1 2m22-2 1 2m2-2 1 2" stroke="#d57675" stroke-width=".8" opacity=".65"/>
    ${id==='player'?`<path d="m-14-65 5 1 4 3h10l4-3 5-1-3 7L0-52l-11-6Z" fill="${p.hair}"/>`:''}
    <path d="M-3-60q3 2 6 0" stroke="${id==='player'?'#efc9a9':'#995c61'}" fill="none" stroke-width="1"/>
    <path d="${shapes[id]}" fill="${p.hair}" stroke="${ink}" stroke-width="1"/>
    <path d="M-13-97q10-9 24-1l-8-2-10 4Z" fill="${p.light}" opacity=".25"/>
    ${glasses}
    ${id==='prisma'?'<path d="M-23-98q2-16 22-15t23 15l-14 3-25-1Z" fill="#b95b68" stroke="#733f59" stroke-width="1"/><path d="m0-112 2-4" stroke="#e4a6a1" stroke-width="3"/><path d="m-16-99 22 1" stroke="#f3b7a8" stroke-width="1.5"/>':''}
    ${id==='pixel'?'<path d="M-24-78v-10q1-20 24-20t24 20v10" fill="none" stroke="#315382" stroke-width="4"/><path d="M-22-91q3-15 22-15t22 15" stroke="#a6d5f5" stroke-width="1.4" fill="none"/><rect x="-26" y="-85" width="8" height="17" rx="3" fill="#5482bf"/><rect x="18" y="-85" width="8" height="17" rx="3" fill="#5482bf"/><path d="M23-69q-2 7-13 7" stroke="#7fc5e8" fill="none" stroke-width="1.5"/>':''}
    ${id==='ux'?'<path d="m-17-87 5 3m-5 1 5 3" stroke="#9ee7d7" stroke-width="2"/>':''}
  </g>`;
}
