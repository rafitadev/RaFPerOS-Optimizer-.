const ctl = '/data/adb/modules/rafperos_extreme_optimizer/common/rafperctl';
let nativeExec;
const groups = [
  { id: 'cpu', title: 'CPU / scheduler / frequência', keys: ['CPU_GOV','CPU_SCHEDUTIL','CPU_UCLAMP','CPU_CPUSET','CPU_STUNE','CPU_SOFT_FREQ_LOCK','CPU_ANTI_OSC','CPU_TOUCH_BOOST'] },
  { id: 'memory', title: 'Memória', keys: ['MEMORY_VM','MEMORY_ZRAM','MEMORY_DIRTY','MEMORY_LMKD','MEMORY_EXTREME'] },
  { id: 'render', title: 'Renderização / animações / compositor', keys: ['RENDER_HWUI','RENDER_SF','RENDER_ADVANCED','RENDER_ANIMATIONS'] },
  { id: 'gpu', title: 'GPU', keys: ['GPU_GOV','GPU_BOOST'] },
  { id: 'io', title: 'I/O e storage', keys: ['IO_SCHED','IO_LATENCY'] },
  { id: 'input', title: 'Input / toque / fingerprint', keys: ['INPUT_TOUCH','INPUT_FINGERPRINT'] },
  { id: 'advanced', title: 'Avançado', keys: ['ADV_BACKGROUND','ADV_THERMAL','APPLY_ON_BOOT'] },
  { id: 'experience', title: 'Experience Enhancers', keys: ['EXP_STEREO','EXP_SMOOTHNESS','EXP_TOUCH_RESPONSE','EXP_ANIMATION_BURST','EXP_GAME_SESSION','EXP_FOREGROUND_PRIORITY','EXP_AUDIO_BASS','EXP_AUDIO_VOICE','EXP_AUDIO_NORMALIZE','EXP_AUDIO_LIMITER','EXP_AUDIO_GAMING','EXP_VISUAL_CONSISTENCY','EXP_SESSION_BOOST','EXP_APP_LAUNCH','EXP_HAPTIC','EXP_BRIGHTNESS_RESPONSE','EXP_NETWORK_LATENCY'] },
];
const descriptions = {
  CPU_GOV:'Seleciona governor suportado para reduzir ramp-up lento.', CPU_SCHEDUTIL:'Ajusta rate limits de schedutil/interactive para bursts curtos.', CPU_UCLAMP:'Eleva utilização mínima de foreground/top-app.', CPU_CPUSET:'Afina afinidade foreground/top-app/background.', CPU_STUNE:'Boost legacy schedtune quando disponível.', CPU_SOFT_FREQ_LOCK:'Mantém piso temporário de frequência com timeout; não trava no máximo.', CPU_ANTI_OSC:'Aumenta down-rate-limit para reduzir sobe/desce de clocks.', CPU_TOUCH_BOOST:'Boost curto em interação.',
  MEMORY_VM:'Swappiness, watermarks e cache pressure.', MEMORY_ZRAM:'Read-ahead da fila zRAM.', MEMORY_DIRTY:'Dirty ratios, expiry e writeback.', MEMORY_LMKD:'LMK clássico e cache do ActivityManager.', MEMORY_EXTREME:'Gate manual para memória extrema; use com cautela.',
  RENDER_HWUI:'Hints reais de HWUI/RenderEngine.', RENDER_SF:'Hints de frame pacing SurfaceFlinger.', RENDER_ADVANCED:'Overrides debug de composição; risco de instabilidade visual.', RENDER_ANIMATIONS:'Escalas de animação Android por perfil.',
  GPU_GOV:'Governor devfreq/KGSL/Mali quando exposto.', GPU_BOOST:'Pwrlevel/clock boost GPU por endpoints reais.', IO_SCHED:'Scheduler de bloco suportado.', IO_LATENCY:'Read-ahead, iostats e low_latency quando disponíveis.', INPUT_TOUCH:'Touch boost curto.', INPUT_FINGERPRINT:'Boost de unlock/fingerprint sem burlar autenticação.', ADV_BACKGROUND:'Retenção de processos em cache.', ADV_THERMAL:'Modo performance vendor reversível; não desativa proteções.', APPLY_ON_BOOT:'Consentimento para reaplicar toggles ativos no boot.',
  EXP_STEREO:'Stereo Enhancer por tinymix quando o codec expõe controle real; níveis por perfil.', EXP_AUDIO_BASS:'Bass boost controlado via mixer real quando disponível.', EXP_AUDIO_VOICE:'Clareza de voz/diálogo via controle de codec/DSP exposto.', EXP_AUDIO_NORMALIZE:'Normalização/DRC de volume se houver controle real.', EXP_AUDIO_LIMITER:'Limiter para reduzir clipping quando exposto pelo áudio.', EXP_AUDIO_GAMING:'Caminho de áudio game/low-latency se o stack expõe controle.', EXP_SMOOTHNESS:'Hints de smoothness/frame pacing para reduzir sensação de travamento.', EXP_TOUCH_RESPONSE:'Touch response smoothing com boost curto em endpoints reais.', EXP_ANIMATION_BURST:'Burst para launcher, recents, shade e transições intensas.', EXP_GAME_SESSION:'Game Session Mode manual com boost de CPU/GPU/scheduler detectado.', EXP_FOREGROUND_PRIORITY:'Favorece UI/foreground via cpuset/uclamp/stune.', EXP_VISUAL_CONSISTENCY:'Prioriza consistência de frames sobre pico bruto via render hints.', EXP_SESSION_BOOST:'Boost forte durante sessão ativa com relaxamento por timeout.', EXP_APP_LAUNCH:'Abertura de apps mais rápida via burst de input/scheduler.', EXP_HAPTIC:'Haptic boost controlado se vibrator sysfs existir.', EXP_BRIGHTNESS_RESPONSE:'Tuning seguro de resposta visual/backlight apenas em endpoints próprios.', EXP_NETWORK_LATENCY:'Preferência de latência TCP para uso interativo sem quebrar conectividade.'
};
const risky = new Set(['MEMORY_EXTREME','RENDER_ADVANCED','ADV_THERMAL','APPLY_ON_BOOT','CPU_SOFT_FREQ_LOCK','GPU_BOOST','EXP_STEREO','EXP_AUDIO_BASS','EXP_AUDIO_GAMING','EXP_GAME_SESSION','EXP_SESSION_BOOST','EXP_BRIGHTNESS_RESPONSE']);
async function getExec(){
  if (nativeExec) return nativeExec;
  try { const mod = await import('kernelsu'); if (mod?.exec) return nativeExec = mod.exec; } catch (_) {}
  if (window.ksu?.exec) return nativeExec = window.ksu.exec.bind(window.ksu);
  if (window.KSU?.exec) return nativeExec = window.KSU.exec.bind(window.KSU);
  throw new Error('KernelSU exec API indisponível. Abra pela WebUI do KernelSU/APatch compatível.');
}
async function execCmd(cmd){
  try {
    const run = await getExec();
    const result = await run(cmd);
    if (typeof result === 'string') return result;
    const errno = result?.errno ?? result?.code ?? 0;
    const out = `${result?.stdout || ''}${result?.stderr ? `\n${result.stderr}` : ''}`.trim();
    if (errno && errno !== 0) return `[ERROR errno=${errno}]\n${out}`;
    return out || '[OK] comando executado sem saída';
  } catch (e) { return `[WEBUI ERROR] ${e.message || e}`; }
}
function setAction(text){ document.getElementById('action').textContent = text || ''; }
function parse(text){ const values={}, support={}; text.split('\n').forEach(line=>{ if(line.includes('=')&&!line.startsWith('---')&&!line.startsWith('#')){const [k,...v]=line.split('=');values[k]=v.join('=');} if(line.includes(':')){const [k,s,...rest]=line.split(':');support[k]={state:s,note:rest.join(':')};} }); return {values,support}; }
function badgeState(s){ return ['supported','partial','manual','advanced','unsupported'].includes(s)?s:'unknown'; }
function isAvailable(s){ return s && s !== 'unsupported' && s !== 'unknown'; }
function build(values,support){ const root=document.getElementById('featureSections'); root.innerHTML=''; groups.forEach(g=>{ const sec=document.createElement('section'); sec.innerHTML=`<div class="section-head"><h2>${g.title}</h2><button class="secondary" data-reset="${g.id}">Restaurar seção</button></div><div class="cards"></div>`; const cards=sec.querySelector('.cards'); g.keys.forEach(k=>{ const sup=support[k]||{state:'unknown',note:'Sem detecção ainda'}; const checked=values[k]==='1'; const disabled=!isAvailable(sup.state); const card=document.createElement('div'); card.className='feature-card'+(risky.has(k)?' risky':''); card.innerHTML=`<div class="feature-head"><label><input type="checkbox" ${checked?'checked':''} ${disabled?'disabled':''}>${k}</label><span class="badge ${badgeState(sup.state)}">${sup.state}</span></div><p>${sup.note}</p><p class="impact">${descriptions[k]||''}</p>${disabled?'<p class="risk">Indisponível neste kernel/device.</p>':''}${risky.has(k)?'<p class="risk">⚠️ Opção agressiva/manual. Ative apenas se entender o risco.</p>':''}`; card.querySelector('input').onchange=async e=>{ if(e.target.checked&&risky.has(k)&&!confirm(`${k} é agressivo. Ativar e aplicar agora?`)){ e.target.checked=false; return; } setAction(await execCmd(`${ctl} toggle ${k} ${e.target.checked?1:0} apply`)); await refresh(false); }; cards.appendChild(card); }); sec.querySelector('[data-reset]').onclick=async()=>{ setAction(await execCmd(`${ctl} reset-section ${g.id}`)); await refresh(false); }; root.appendChild(sec); }); }
async function refresh(clearAction=true){ const st=await execCmd(`${ctl} status`); document.getElementById('status').textContent=st; const {values,support}=parse(st); document.querySelectorAll('[data-profile]').forEach(b=>b.classList.toggle('active',b.dataset.profile===values.profile)); build(values,support); document.getElementById('logs').textContent=await execCmd(`${ctl} logs 260`); if(clearAction && !document.getElementById('action').textContent) setAction('Pronto. Status carregado do backend.'); }
document.querySelectorAll('[data-profile]').forEach(b=>b.onclick=async()=>{ setAction(await execCmd(`${ctl} profile ${b.dataset.profile}`)); await refresh(false); });
document.getElementById('apply').onclick=async()=>{ setAction(await execCmd(`${ctl} apply webui`)); await refresh(false); };
document.getElementById('boost').onclick=async()=>{ setAction(await execCmd(`${ctl} boost`)); await refresh(false); };
document.getElementById('reset').onclick=async()=>{ if(confirm('Reset total e restauração dos valores originais?')){ setAction(await execCmd(`${ctl} reset webui`)); await refresh(false); } };
refresh(); setInterval(()=>refresh(false),5000);
