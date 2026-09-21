'use strict';
const CHAPTERS = [
  ['封面与器材',1],['综述',3],['新建工程',11],['GPIO',15],['OLED',29],['外部中断',32],['定时器',41],['ADC 模数转换器',70],['DMA 直接存储器存取',79],['USART 串口',87],['I²C 通信',104],['SPI 通信',119]
].map(([title,start],i,a)=>({title,start,end:a[i+1]?a[i+1][1]-1:123,index:i}));
const KEY='stm32-spl-notebook-v1';
const $=id=>document.getElementById(id);
const NS='http://www.w3.org/2000/svg';
let data={version:1,document:'stm32-spl-123',lastPage:3,pages:{}}, storageOK=true;
try{const saved=localStorage.getItem(KEY);if(saved)data=validateData(JSON.parse(saved));}catch(e){storageOK=false;}
let page=data.lastPage||3, tool='read', color='#e5a000', zoom=1, selected=null, draft=null, timer;
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(timer);timer=setTimeout(()=>$('toast').hidden=true,4000);}
function save(){data.lastPage=page;try{localStorage.setItem(KEY,JSON.stringify(data));storageOK=true;$('saveStatus').textContent='已保存到此浏览器';}catch(e){storageOK=false;$('saveStatus').textContent='保存失败，请导出备份';toast('浏览器无法保存笔记，请立即导出备份。');}}
function state(){return data.pages[page]||(data.pages[page]={note:'',marks:[]});}
function chapterFor(p){return CHAPTERS.find(c=>p>=c.start&&p<=c.end);}
function svgEl(tag,attrs){const el=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);return el;}
function dimensions(){const [w,h]=window.PAGE_SIZES[page-1];return [1000,1000*h/w];}
function drawMark(m,preview=false){
  const attrs={stroke:m.color,'stroke-width':m.id===selected?4:2.5,'vector-effect':'non-scaling-stroke',class:'annotation','data-id':m.id};
  let node;
  if(m.type==='rect')node=svgEl('rect',{...attrs,x:m.x,y:m.y,width:m.w,height:m.h,fill:m.color,'fill-opacity':.12,rx:2});
  else node=svgEl('polyline',{...attrs,points:m.points.map(p=>p.join(',')).join(' '),fill:'none','stroke-linecap':'round','stroke-linejoin':'round'});
  if(!preview)node.addEventListener('click',()=>selectMark(m.id));
  $('overlay').appendChild(node);return node;
}
function renderOverlay(){const [w,h]=dimensions();$('overlay').setAttribute('viewBox',`0 0 ${w} ${h}`);$('overlay').replaceChildren();state().marks.forEach(m=>drawMark(m));}
function selectMark(id){selected=id;renderOverlay();document.querySelectorAll('.mark').forEach(e=>e.classList.toggle('selected',e.dataset.id===id));const card=document.querySelector(`.mark[data-id="${CSS.escape(id)}"]`);if(card){card.scrollIntoView({block:'nearest',behavior:'smooth'});card.querySelector('textarea').focus({preventScroll:true});}}
function renderMarks(){
  const container=$('marks');container.replaceChildren();$('markCount').textContent=state().marks.length;
  if(!state().marks.length){const empty=document.createElement('div');empty.className='empty';empty.textContent='还没有标注\n从上方选择「框选」或「画笔」';empty.style.whiteSpace='pre-line';container.appendChild(empty);return;}
  state().marks.forEach((m,i)=>{
    const card=document.createElement('div');card.className='mark'+(m.id===selected?' selected':'');card.dataset.id=m.id;card.style.setProperty('--mark-color',m.color);
    const top=document.createElement('div');top.className='mark-top';const locate=document.createElement('button');locate.textContent=`${String(i+1).padStart(2,'0')} · ${m.type==='rect'?'框选':'画笔'}标注`;locate.onclick=()=>{selected=m.id;renderOverlay();document.querySelectorAll('.mark').forEach(e=>e.classList.toggle('selected',e.dataset.id===m.id));const shape=[...$('overlay').children].find(e=>e.dataset.id===m.id);shape?.scrollIntoView({block:'center',inline:'nearest',behavior:'smooth'});};
    const del=document.createElement('button');del.textContent='删除';del.setAttribute('aria-label',`删除第 ${i+1} 个标注`);del.onclick=()=>{if(!confirm('删除这条标注及其备注？'))return;state().marks=state().marks.filter(x=>x.id!==m.id);selected=null;save();renderOverlay();renderMarks();};top.append(locate,del);
    const input=document.createElement('textarea');input.placeholder='给这处标注添加备注…';input.value=m.note;input.setAttribute('aria-label',`第 ${i+1} 个标注的备注`);input.addEventListener('input',()=>{m.note=input.value;save();});card.append(top,input);container.appendChild(card);
  });
}
function setTool(value){tool=value;document.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tool===tool));$('overlay').classList.toggle('drawing',tool!=='read');$('toolHint').textContent=tool==='read'?'在原图上框选或画线，再在这里写下理解。':tool==='rect'?'在图片上拖动，框出需要记录的区域。':'按住鼠标或手指，在图片上画线。';}
function setZoom(value){zoom=Math.max(.6,Math.min(2.5,value));$('paper').style.width=`${zoom*100}%`;$('paper').style.maxWidth='none';$('zoomLabel').textContent=`${Math.round(zoom*100)}%`;}
function go(p,updateHash=true){
  if(!Number.isInteger(p)||p<1||p>123)return false;
  draft=null;page=p;selected=null;const c=chapterFor(page);$('chapterNumber').textContent=c.index?`CHAPTER ${String(c.index).padStart(2,'0')}`:'INTRODUCTION';$('chapterTitle').textContent=c.title;$('chapterRange').textContent=`第 ${c.start}–${c.end} 页`;
  $('pageNumber').value=page;$('notePage').textContent=`第 ${page} 页`;$('pageNote').value=state().note;$('prev').disabled=page===1;$('next').disabled=page===123;
  document.querySelectorAll('.chapter-link').forEach((el,i)=>{if(i===c.index)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
  const img=$('pageImage');const [w,h]=window.PAGE_SIZES[page-1];img.width=w;img.height=h;img.alt=`${c.title}，原稿第 ${page} 页`;$('imageError').hidden=true;img.src=`pages/${String(page).padStart(3,'0')}.jpg`;
  renderOverlay();renderMarks();$('readingArea').scrollTo(0,0);save();if(updateHash)try{history.replaceState(null,'',`#page=${page}`);}catch(e){}return true;
}
CHAPTERS.forEach(c=>{const a=document.createElement('a');a.className='chapter-link';a.href=`#page=${c.start}`;const num=document.createElement('b');num.textContent=c.index?String(c.index).padStart(2,'0'):'序';const title=document.createElement('span');title.textContent=c.title;const range=document.createElement('small');range.textContent=`${c.start}–${c.end} 页`;title.appendChild(range);a.append(num,title);a.onclick=e=>{e.preventDefault();go(c.start);if(innerWidth<=850)$('tocPanel').open=false;};$('chapters').appendChild(a);});
$('pageImage').onerror=()=>{$('imageError').hidden=false;};
$('pageNote').oninput=()=>{state().note=$('pageNote').value;save();};
$('prev').onclick=()=>go(page-1);$('next').onclick=()=>go(page+1);
$('pageNumber').onchange=()=>{if(!go(Number($('pageNumber').value))){$('pageNumber').value=page;toast('请输入 1 至 123 的页码。');}};
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
document.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{color=b.dataset.color;document.querySelectorAll('[data-color]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
$('zoomIn').onclick=()=>setZoom(zoom+.2);$('zoomOut').onclick=()=>setZoom(zoom-.2);$('fit').onclick=()=>setZoom(1);
function point(e){const r=$('overlay').getBoundingClientRect(),[w,h]=dimensions();return [Math.max(0,Math.min(w,(e.clientX-r.left)/r.width*w)),Math.max(0,Math.min(h,(e.clientY-r.top)/r.height*h))];}
$('overlay').addEventListener('pointerdown',e=>{if(tool==='read'||e.button!==0||draft)return;e.preventDefault();const p=point(e);draft={id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),type:tool,color,note:'',start:p,x:p[0],y:p[1],w:0,h:0,points:[p],pointerId:e.pointerId};$('overlay').setPointerCapture(e.pointerId);});
$('overlay').addEventListener('pointermove',e=>{if(!draft||draft.pointerId!==e.pointerId)return;const p=point(e);if(draft.type==='rect'){draft.x=Math.min(draft.start[0],p[0]);draft.y=Math.min(draft.start[1],p[1]);draft.w=Math.abs(p[0]-draft.start[0]);draft.h=Math.abs(p[1]-draft.start[1]);}else draft.points.push(p);renderOverlay();drawMark(draft,true);});
function finish(e){if(!draft||draft.pointerId!==e.pointerId)return;const m=draft;draft=null;if($('overlay').hasPointerCapture(e.pointerId))$('overlay').releasePointerCapture(e.pointerId);if(m.type==='rect'?(m.w<3||m.h<3):m.points.length<2){renderOverlay();return;}delete m.start;delete m.pointerId;if(m.type==='rect')delete m.points;else{delete m.x;delete m.y;delete m.w;delete m.h;}state().marks.push(m);selected=m.id;save();renderOverlay();renderMarks();setTool('read');selectMark(m.id);}
$('overlay').addEventListener('pointerup',finish);$('overlay').addEventListener('pointercancel',()=>{draft=null;renderOverlay();});
document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT','BUTTON'].includes(document.activeElement.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;if(e.key==='ArrowLeft'){e.preventDefault();go(page-1);}if(e.key==='ArrowRight'){e.preventDefault();go(page+1);}if(e.key==='Escape'){draft=null;setTool('read');renderOverlay();}});
window.addEventListener('hashchange',()=>{const m=location.hash.match(/^#page=(\d+)$/);if(m)go(Number(m[1]),false);});
$('export').onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`STM32笔记-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);toast('笔记已导出，包含全部页码、框选、画线和备注。');};
function validateData(d){
  if(!d||d.version!==1||d.document!=='stm32-spl-123'||!d.pages||typeof d.pages!=='object'||Array.isArray(d.pages))throw Error('不是此阅读器的笔记文件');
  const out={version:1,document:'stm32-spl-123',lastPage:Number.isInteger(d.lastPage)&&d.lastPage>=1&&d.lastPage<=123?d.lastPage:3,pages:{}};
  const number=(n,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=max;
  for(const [k,v]of Object.entries(d.pages)){
    if(!/^\d+$/.test(k)||Number(k)<1||Number(k)>123||!v||typeof v.note!=='string'||!Array.isArray(v.marks)||v.marks.length>5000)throw Error('笔记内容格式不正确');
    const ids=new Set();const marks=v.marks.map(m=>{if(!m||typeof m.id!=='string'||!/^[a-zA-Z0-9-]{1,100}$/.test(m.id)||ids.has(m.id)||!/^#[0-9a-f]{6}$/i.test(m.color)||typeof m.note!=='string')throw Error('标注格式不正确');ids.add(m.id);const clean={id:m.id,type:m.type,color:m.color,note:m.note};if(m.type==='rect'){if(!['x','y','w','h'].every(x=>number(m[x],5000)))throw Error('框选坐标不正确');for(const x of ['x','y','w','h'])clean[x]=m[x];}else if(m.type==='pen'){if(!Array.isArray(m.points)||m.points.length<2||m.points.length>200000||!m.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(x=>number(x,5000))))throw Error('画线坐标不正确');clean.points=m.points.map(p=>[...p]);}else throw Error('未知标注类型');return clean;});out.pages[Number(k)]={note:v.note,marks};
  }return out;
}
$('import').onclick=()=>$('importFile').click();
$('importFile').onchange=async()=>{const f=$('importFile').files[0];if(!f)return;try{if(f.size>30*1024*1024)throw Error('文件过大，最多支持 30 MB');const incoming=validateData(JSON.parse(await f.text()));if(!confirm('导入会替换此浏览器现有的全部笔记。建议先导出备份。继续导入？'))return;data=incoming;go(data.lastPage);toast(storageOK?'笔记已恢复。':'笔记已载入，但无法保存到浏览器，请保留备份。');}catch(e){toast('导入失败：'+e.message);}finally{$('importFile').value='';}};
if(innerWidth<=850)$('tocPanel').open=false;
const hash=location.hash.match(/^#page=(\d+)$/);go(hash&&Number(hash[1])>=1&&Number(hash[1])<=123?Number(hash[1]):page);
if(!storageOK)toast('浏览器存储不可用，请使用导出笔记保留记录。');
if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'navigate_stm32_page',title:'跳转到笔记页',description:'在 STM32 阅读器中打开指定原稿页。',inputSchema:{type:'object',properties:{page:{type:'integer',minimum:1,maximum:123}},required:['page'],additionalProperties:false},annotations:{readOnlyHint:false},execute:async input=>{if(!go(input.page))throw Error('页码必须为 1 至 123 的整数');return {page,title:chapterFor(page).title};}})).catch(()=>{});}catch(e){}}
