let TOKEN=localStorage.getItem('campAdminToken')||'';const H=()=>({'x-admin-token':TOKEN});
const dateInput=document.getElementById('dateInput');
const hebrewDatePreview=document.getElementById('hebrewDatePreview');
function formatHebrewDate(value){
  if(!value)return '';
  const [year,month,day]=value.split('-').map(Number);
  const date=new Date(Date.UTC(year,month-1,day,12));
  return new Intl.DateTimeFormat('he-IL-u-ca-hebrew',{day:'numeric',month:'long',year:'numeric'}).format(date);
}
if(dateInput&&hebrewDatePreview){
  const updateHebrewDate=()=>{hebrewDatePreview.value=formatHebrewDate(dateInput.value)};
  dateInput.addEventListener('input',updateHebrewDate);
  dateInput.addEventListener('change',updateHebrewDate);
}

async function check(){if(!TOKEN)return;const r=await fetch('/api/admin/check',{headers:H()});if(r.ok){login.classList.add('hidden');dashboard.classList.remove('hidden');await refresh()}}
loginForm.onsubmit=async e=>{e.preventDefault();TOKEN=token.value;localStorage.setItem('campAdminToken',TOKEN);const r=await fetch('/api/admin/check',{headers:H()});loginStatus.textContent=r.ok?'נכנסת בהצלחה':'קוד שגוי';if(r.ok){login.classList.add('hidden');dashboard.classList.remove('hidden');refresh()}};
async function refresh(){const [dr,mr]=await Promise.all([fetch('/api/admin/days',{headers:H()}),fetch('/api/admin/media',{headers:H()})]);const ds=(await dr.json()).days||[];const ms=(await mr.json()).media||[];daySelect.innerHTML='<option value="">בחר יום</option>'+ds.map(d=>`<option value="${d.id}">${d.title}</option>`).join('');adminMedia.innerHTML=ms.map(m=>`<div><span>${m.kind==='image'?'🖼️':m.kind==='video'?'🎥':'🎵'} ${m.title||m.object_key}</span><small>${m.day_title||'ללא יום'}</small><button data-id="${m.id}">מחק</button></div>`).join('');adminMedia.querySelectorAll('button').forEach(b=>b.onclick=async()=>{if(!confirm('למחוק?'))return;await fetch('/api/admin/media',{method:'DELETE',headers:{...H(),'content-type':'application/json'},body:JSON.stringify({id:Number(b.dataset.id)})});refresh()})}
dayForm.onsubmit=async e=>{e.preventDefault();dayStatus.textContent='יוצר…';const body=Object.fromEntries(new FormData(e.target));const r=await fetch('/api/admin/days',{method:'POST',headers:{...H(),'content-type':'application/json'},body:JSON.stringify(body)});dayStatus.textContent=r.ok?'היום נוצר בהצלחה':'שגיאה ביצירה';if(r.ok){e.target.reset();refresh()}};
uploadForm.onsubmit=e=>{e.preventDefault();uploadStatus.textContent='מעלה…';const x=new XMLHttpRequest();x.open('POST','/api/admin/upload');x.setRequestHeader('x-admin-token',TOKEN);x.upload.onprogress=v=>{if(v.lengthComputable)progress.value=v.loaded/v.total*100};x.onload=()=>{uploadStatus.textContent=x.status<300?'הקובץ עלה בהצלחה':'ההעלאה נכשלה';if(x.status<300){e.target.reset();progress.value=0;refresh()}};x.send(new FormData(e.target))};check();
