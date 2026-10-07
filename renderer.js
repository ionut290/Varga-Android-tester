let selected=null;
const $=id=>document.getElementById(id);
$('check').onclick=async()=>{const r=await window.varga.checkTools();$('tools').innerHTML=Object.entries(r).map(([k,v])=>'<div class="'+(v.ok?'ok':'bad')+'">'+(v.ok?'✓ ':'✕ ')+k+'</div>').join('');};
$('refresh').onclick=async()=>{const r=await window.varga.listAvds();$('avd').innerHTML='';if(r.items.length)r.items.forEach(x=>$('avd').add(new Option(x,x)));else $('avd').add(new Option('Nessun AVD trovato',''));$('avdStatus').textContent=r.ok?'Dispositivi aggiornati':r.error;};
$('start').onclick=async()=>{const n=$('avd').value;if(!n)return;$('avdStatus').textContent='Avvio in corso…';const r=await window.varga.startAvd(n);$('avdStatus').textContent=r.ok?'Emulatore avviato. Attendi la schermata Android.':r.error;};
$('pick').onclick=async()=>{selected=await window.varga.pickBuild();$('file').textContent=selected||'Nessun file selezionato';};
$('install').onclick=async()=>{if(!selected){$('installStatus').textContent='Prima scegli una build.';return;}$('installStatus').textContent='Installazione…';const r=await window.varga.installBuild(selected);$('installStatus').textContent=r.ok?r.text:r.error;};
$('shot').onclick=async()=>{$('shotStatus').textContent='Acquisizione…';const r=await window.varga.screenshot();$('shotStatus').textContent=r.ok?'Screenshot salvato: '+r.path:r.error;};