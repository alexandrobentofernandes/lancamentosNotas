'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const BASES=["ANGRA DOS REIS","ARARUAMA","CABO FRIO","CAMPOS","CANTAGALO","ENEL RIO","ITAMBI","ITAPERUNA","MACAÉ","MAGÉ","NITERÓI","PÁDUA","PETRÓPOLIS","RESENDE","SÃO GONÇALO","SÃO PEDRO DA ALDEIA","TANGUÁ","TERESÓPOLIS"];
const PEDIDOS=["RENOVAÇÃO DA HAR","1ª AVALIAÇÃO","1ª REAVALIAÇÃO","2ª REAVALIAÇÃO","HI PO","NO SHOW","2ª VIA DE HAR"];
const AVALIADORES=["ADALBERTO","ALEXANDRE BENTER","ANDRÉ LUIZ","CARLOS ANTÔNIO","CARLOS HENRIQUE","DANIEL","EDELSON","FÁTIMA","GERALDO CESAR DE FARIA","GUILHERME","HEITOR LEMOS","IGOR","JOSEMÁRIO","JÚLIO SOLANO","MARCELO","MARCO AURÉLIO","MARCOS OLIVEIRA","PARDO","PAULO CASTRO","SÉRGIO"];
const MOTIVOS=["SEGURANÇA","QUALIDADE","BAREMO","SEGURANÇA + QUALIDADE","SEGURANÇA + BAREMO","QUALIDADE + BAREMO","SEGURANÇA + QUALIDADE + BAREMO"];
const STATUS_PRATICA=["APTO","NÃO APTO","PENDENTE","NÃO REALIZADO"];
const PROCESSOS=["LINHA_VIVA","CONSTRUÇÃO_E_MANUTENÇÃO_OBRA","APOIO_À_EMERGÊNCIA","APOIO_À_EMERGÊNCIA_G","ATENDIMENTO_DE_EMERGÊNCIA","ENCARREGADO","COMERCIAL_LIGAÇÃO_NOVA_CORTE_E_RELIGAÇÃO","INSPEÇÃO_E_NORMALIZAÇÃO_GRUPO_B_TRADICIONAL","INSPEÇÃO_E_NORMALIZAÇÃO_GRUPO_B_ELETRÔNICO","INSPEÇÃO_E_NORMALIZAÇÃO_GRUPO_A_COMERCIAL","INSPEÇÃO_E_NORMALIZAÇÃO_GRUPO_A_PERDAS","INSPEÇÃO_E_NORMALIZAÇÃO_GRUPO_A_MK6","PODA_COM_REDE_ENERGIZADA","PODA_COM_REDE_DESENERGIZADA","PODA_DESENERGIZADA_A_DISTANCIA","OPERADOR_DE_CESTA_AÉREA","OPERADOR_DE_GUINDAUTO","REDE_SUBTERRÂNEA","MANUTENÇÃO_CORRETIVA_E_PREVENTINA_EM_SE_DESENERGIZADA_EM_ATÉ_138_KV","ENCARREGADO_DE_SE_DESENERGIZADA_EM_ATÉ_138_KV","LIMPEZA_DE_REDE","OPERADOR_SE"];
const EMPRESAS_NOMES=["3C SERVICES-52L0002064","3C SERVICES-52L0002309","3C SERVICES-JA10098617","CENEGED - JA10134979","DÍNAMO LAGOS-JA10140367","ELLCA-52L0002379","ELLCA-JA10110696","ELLCA-JA10146796","ELLCA-JA10149890","ELLCA-JA10170084","ELLCA-JA10179591","EMA MAGÉ-JA10091870","EMA SG-52L0002365","ENGELMIG-JA10083461","ENGELMIG-JA10114811","ENGELMIG-JA10166038","INDICA-JA10110552","M&E-JA10072640","MEDRAL-JA10098645","PROGEN-JA10086153","PROGEN-JA10131908","PROGEN-JA10140365","PROGEN-JA10148049","PSE ENERGIA - 52L0002200","PSE-JA10135676","REENERGISA-JA10083849","STN-JA10087291","STN-JA100117257","TEES-JA10166037","COMPEL-JA10159368","POWER SOLUTION-JA10184918","VEMAN LAGOS-52L0002297","VEMAN SERRANA-JA10119303","ENEL","DINAMO LAGOS-52L0002141"];
const ROLES={SYSTEM:{label:'SYSTEM',bg:'rgba(139,92,246,.15)',color:'#A78BFA'},ADMIN:{label:'Administrador',bg:'rgba(59,130,246,.15)',color:'#60A5FA'},COLABORADOR:{label:'Colaborador',bg:'rgba(156,163,175,.15)',color:'#9CA3AF'}};

function api(path,opts={}){
  const token=typeof window!=='undefined'?localStorage.getItem('token'):null;
  return fetch('/api/'+path,{headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})}, ...opts}).then(r=>r.json());
}

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=DM+Mono:ital,wght@0,400;0,500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#F0F2F5; --surface:#fff; --surface2:#F8F9FB; --border:rgba(0,0,0,.07);
  --sidebar:#0B1120; --primary:#4F46E5; --primary-l:#6366F1; --primary-glow:rgba(99,102,241,.25);
  --success:#059669; --success-bg:#ECFDF5; --success-text:#065F46;
  --danger:#DC2626; --danger-bg:#FEF2F2; --danger-text:#991B1B;
  --warning:#D97706; --warning-bg:#FFFBEB; --warning-text:#92400E;
  --text:#0F172A; --text2:#475569; --text3:#94A3B8;
  --sh-sm:0 1px 3px rgba(0,0,0,.06),0 1px 2px rgba(0,0,0,.04);
  --sh:0 4px 16px rgba(0,0,0,.08),0 1px 4px rgba(0,0,0,.04);
  --sh-lg:0 10px 40px rgba(0,0,0,.12),0 2px 8px rgba(0,0,0,.06);
  --sh-primary:0 8px 24px rgba(99,102,241,.3);
  --r:14px; --r-sm:8px; --r-lg:20px;
  --font:'Outfit',sans-serif; --mono:'DM Mono',monospace;
  --ease:cubic-bezier(.4,0,.2,1); --t:all .2s cubic-bezier(.4,0,.2,1);
  --sw:240px;
}
html,body{height:100%;font-family:var(--font);background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}
::selection{background:var(--primary);color:#fff}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:10px}
input,select,textarea,button{font-family:var(--font)}

@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@keyframes toastIn{from{opacity:0;transform:translateX(110%)}to{opacity:1;transform:translateX(0)}}
@keyframes spin{to{transform:rotate(360deg)}}

.fu{animation:fadeUp .4s var(--ease) both}
.fu1{animation:fadeUp .4s .06s var(--ease) both}
.fu2{animation:fadeUp .4s .12s var(--ease) both}
.fu3{animation:fadeUp .4s .18s var(--ease) both}
.fu4{animation:fadeUp .4s .24s var(--ease) both}
.si{animation:scaleIn .22s var(--ease) both}
.toast-in{animation:toastIn .3s var(--ease) both}

.field{width:100%;border:1.5px solid var(--border);border-radius:var(--r-sm);padding:10px 13px;font-size:14px;background:var(--surface2);color:var(--text);transition:var(--t);outline:none}
.field:focus{border-color:var(--primary);background:#fff;box-shadow:0 0 0 3px var(--primary-glow)}
.field.auto{background:#F8FAFC;color:var(--text3);border-style:dashed;cursor:default}
.field:disabled,.field[readonly].auto{opacity:1}

.btn{display:inline-flex;align-items:center;gap:7px;cursor:pointer;border-radius:var(--r-sm);border:1.5px solid var(--border);background:var(--surface);color:var(--text2);padding:8px 16px;font-size:13.5px;font-weight:500;transition:var(--t);white-space:nowrap;text-decoration:none}
.btn:hover:not(:disabled){background:var(--surface2);border-color:#CBD5E1;color:var(--text);transform:translateY(-1px);box-shadow:var(--sh-sm)}
.btn.primary{background:var(--primary);color:#fff;border-color:var(--primary);box-shadow:var(--sh-primary)}
.btn.primary:hover:not(:disabled){background:var(--primary-l);box-shadow:0 12px 28px rgba(99,102,241,.4);transform:translateY(-2px)}
.btn.danger{background:var(--danger);color:#fff;border-color:var(--danger)}
.btn.danger:hover:not(:disabled){background:#B91C1C;transform:translateY(-1px)}
.btn.success{background:var(--success);color:#fff;border-color:var(--success)}
.btn.success:hover:not(:disabled){background:#047857;transform:translateY(-1px)}
.btn.ghost{background:transparent;border-color:transparent;color:var(--text3)}
.btn.ghost:hover:not(:disabled){background:var(--surface2);color:var(--text);border-color:var(--border)}
.btn.amber-btn{background:var(--warning-bg);color:var(--warning);border-color:#FDE68A}
.btn:disabled{opacity:.55;cursor:not-allowed}
.btn.sm{padding:5px 11px;font-size:12.5px;border-radius:6px}
.btn.icon{padding:7px;border-radius:var(--r-sm)}

.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);box-shadow:var(--sh-sm)}
.card-lg{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);box-shadow:var(--sh)}

.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:600;letter-spacing:.2px}
.badge.dot::before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor;display:inline-block}
.badge.green{background:var(--success-bg);color:var(--success-text)}
.badge.red{background:var(--danger-bg);color:var(--danger-text)}
.badge.amber{background:var(--warning-bg);color:var(--warning-text)}
.badge.blue{background:rgba(59,130,246,.1);color:#1D4ED8}
.badge.violet{background:rgba(139,92,246,.1);color:#6D28D9}
.badge.gray{background:#F1F5F9;color:#64748B}

.nav-item{display:flex;align-items:center;gap:10px;padding:9px 13px;border-radius:var(--r-sm);cursor:pointer;font-size:13.5px;font-weight:500;color:rgba(255,255,255,.5);transition:var(--t)}
.nav-item:hover{background:rgba(255,255,255,.06);color:rgba(255,255,255,.85)}
.nav-item.active{background:rgba(99,102,241,.2);color:#fff}

.th{text-align:left;font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.7px;padding:10px 16px;border-bottom:1.5px solid var(--border);background:var(--surface2)}
.td{padding:11px 16px;font-size:13.5px;border-bottom:1px solid var(--border);vertical-align:middle;transition:background .12s}
tr:last-child .td{border-bottom:none}
tr:hover .td{background:#F8FAFF}

.tab-bar{display:flex;gap:2px;background:var(--surface2);border-radius:10px;padding:3px;border:1px solid var(--border);overflow-x:auto}
.tab{padding:7px 14px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;border:none;background:transparent;color:var(--text3);white-space:nowrap;transition:var(--t)}
.tab:hover{color:var(--text2)}
.tab.active{background:var(--surface);color:var(--text);box-shadow:var(--sh-sm)}

.label{font-size:12.5px;font-weight:600;color:var(--text2);display:block;margin-bottom:5px}
.label .req{color:var(--danger);margin-left:2px}
.err-msg{font-size:11.5px;color:var(--danger);margin-top:4px}

.progress{height:7px;background:rgba(0,0,0,.06);border-radius:10px;overflow:hidden}
.progress-fill{height:100%;border-radius:10px;transition:width .5s var(--ease)}

.overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn .2s both}
.modal{background:var(--surface);border-radius:var(--r-lg);width:100%;max-width:480px;box-shadow:var(--sh-lg);border:1px solid var(--border);overflow:hidden;animation:scaleIn .22s var(--ease) both}
.modal-hd{display:flex;align-items:center;justify-content:space-between;padding:1.25rem 1.5rem;border-bottom:1px solid var(--border)}
.modal-bd{padding:1.5rem;display:flex;flex-direction:column;gap:14px}

.ph-block{border:1.5px solid var(--border);border-radius:var(--r);padding:14px;margin-bottom:12px;background:var(--surface2)}
.ph-block:hover{border-color:#CBD5E1}
.ph-title{font-size:11.5px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.6px;margin-bottom:12px;display:flex;align-items:center;gap:6px}
.ph-title::before{content:'';width:3px;height:14px;background:var(--primary);border-radius:3px}

.bottom-nav{position:fixed;bottom:0;left:0;right:0;background:rgba(255,255,255,.92);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:1px solid var(--border);display:flex;z-index:200}
.bn-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:9px 4px 8px;gap:3px;cursor:pointer;font-size:10px;font-weight:600;color:var(--text3);letter-spacing:.3px;transition:var(--t)}
.bn-item.active{color:var(--primary)}

.g2{display:grid;grid-template-columns:1fr 1fr;gap:13px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:13px}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:13px}
.sec-h{font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.8px;padding-bottom:8px;border-bottom:1.5px solid var(--border);margin-bottom:14px}
.divider{height:1px;background:var(--border);margin:12px 0}
.chart-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.chart-lbl{font-size:12px;color:var(--text2);min-width:115px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.chart-track{flex:1;background:rgba(0,0,0,.05);height:9px;border-radius:6px;overflow:hidden}
.chart-bar{height:100%;border-radius:6px;transition:width .6s var(--ease)}
.chart-val{font-size:12px;font-weight:700;color:var(--text);min-width:24px;text-align:right}
@media(max-width:768px){.g2,.g3,.g4{grid-template-columns:1fr!important}}
`;

const emptyForm=()=>({statusColaborador:'CANDIDATO',pedido:'',turma:'',dataRealizacao:'',nomes:'',matricula:'',cpf:'',empresa:'',estado:'',base:'',unidadeOperacional:'',regiao:'',avaliador:'',processo:'',processoPrincipal:'',testeOnline:'',avaliacaoOnline:'',statusProvaOnline:'',notaProva:'',statusProvaTeorica:'',avaliacao1:'',baremo1:'',statusProva1:'',motivo1:'',it1:'',detalhe1:'',avaliacao2:'',baremo2:'',statusProva2:'',motivo2:'',it2:'',detalhe2:'',avaliacao3:'',baremo3:'',statusProva3:'',motivo3:'',it3:'',detalhe3:'',avaliacao4:'',baremo4:'',statusProva4:'',motivo4:'',it4:'',detalhe4:'',avaliacao5:'',baremo5:'',statusProva5:'',motivo5:'',it5:'',detalhe5:'',avaliacao6:'',baremo6:'',statusProva6:'',motivo6:'',it6:'',detalhe6:'',reavaliacao:'',reavaliacaoBaremo:'',statusParcial:'',nivelamentoTeorico:'',nivelamentoPratico:'',reavaliacaoPratica:'',resultadoFinal:'',har:'',localAvaliacao:'',links:'',documentoHar:'',cargosProcessos:'',empresaAvaliadora:'',statusHarVencida:'',emailEmpresa:'',dataInicioAssinatura:'',dataFimAssinatura:'',associadoSindistal:'',docContratual:'',nRenovacao:'',isbn:'',fotoCandidato:''});

function Avatar({name,size=34}){
  const init=(name||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const c=['#4F46E5','#0891B2','#059669','#D97706','#DC2626','#7C3AED'][((name||'?').charCodeAt(0)||0)%6];
  return <div style={{width:size,height:size,borderRadius:'50%',background:c,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.35,fontWeight:700,color:'#fff',flexShrink:0}}>{init}</div>;
}

function Badge({v}){
  if(!v||v==='PENDENTE')return <span className="badge dot gray">{v||'PENDENTE'}</span>;
  if(v==='APROVADO'||v==='APROVADO 2')return <span className="badge dot green">{v}</span>;
  if(v==='REPROVADO')return <span className="badge dot red">{v}</span>;
  if(v==='AUSENTE')return <span className="badge dot amber">{v}</span>;
  return <span className="badge gray">{v}</span>;
}

function Spin(){return <span style={{width:15,height:15,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite'}}/>}

const ICON = {
  home:<svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>,
  list:<svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>,
  plus:<svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 5v14m-7-7h14"/></svg>,
  chart:<svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M3 3v18h18M7 16l4-4 4 4 4-6"/></svg>,
  users:<svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  logout:<svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  edit:<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>,
  trash:<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>,
  save:<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8"/></svg>,
  x:<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M18 6 6 18M6 6l12 12"/></svg>,
  search:<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4.35-4.35"/></svg>,
  cam:<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  bolt:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  shield:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  down:<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
  up:<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>,
  check:<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M20 6 9 17l-5-5"/></svg>,
  uplus:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14" strokeLinecap="round"/><line x1="22" y1="11" x2="16" y2="11" strokeLinecap="round"/></svg>,
};

export default function App(){
  const [user,setUser]=useState(null);
  const [view,setView]=useState('login');
  const [editRec,setEditRec]=useState(null);
  const [toast,setToast]=useState(null);
  const [mobile,setMobile]=useState(false);
  useEffect(()=>{const c=()=>setMobile(window.innerWidth<768);c();window.addEventListener('resize',c);return()=>window.removeEventListener('resize',c);},[]);
  useEffect(()=>{const u=localStorage.getItem('user'),t=localStorage.getItem('token');if(u&&t){setUser(JSON.parse(u));setView('dashboard');}},[]);
  const toast_=( msg,type='success')=>{setToast({msg,type});setTimeout(()=>setToast(null),3500);};
  const logout=()=>{localStorage.clear();setUser(null);setView('login');};
  const cw=()=>user&&(user.role==='SYSTEM'||user.role==='ADMIN'||(user.role==='COLABORADOR'&&user.permissions==='Leitura + Escrita'));
  const ia=()=>user&&(user.role==='SYSTEM'||user.role==='ADMIN');
  const nav=[{k:'dashboard',i:'home',l:'Dashboard'},{k:'records',i:'list',l:'Avaliações'},...(cw()?[{k:'form',i:'plus',l:'Nova'}]:[]),{k:'reports',i:'chart',l:'Relatórios'},...(ia()?[{k:'users',i:'users',l:'Usuários'}]:[])];
  if(!user)return(<><style>{CSS}</style><Login onLogin={(u,t)=>{setUser(u);localStorage.setItem('user',JSON.stringify(u));localStorage.setItem('token',t);setView('dashboard');}}/></>);
  return(<>
    <style>{CSS}</style>
    {toast&&<div className="toast-in" style={{position:'fixed',top:20,right:20,zIndex:9999,background:toast.type==='error'?'#FEF2F2':'#ECFDF5',color:toast.type==='error'?'#991B1B':'#065F46',border:`1px solid ${toast.type==='error'?'#FECACA':'#A7F3D0'}`,padding:'11px 18px',borderRadius:12,fontSize:13.5,fontWeight:500,maxWidth:340,boxShadow:'0 8px 24px rgba(0,0,0,.12)',display:'flex',alignItems:'center',gap:8}}>
      {toast.type==='error'?ICON.x:ICON.check}{toast.msg}</div>}
    <div style={{display:'flex',minHeight:'100vh'}}>
      {!mobile&&<nav style={{width:'var(--sw)',background:'var(--sidebar)',position:'fixed',top:0,bottom:0,left:0,zIndex:100,display:'flex',flexDirection:'column',overflowY:'auto'}}>
        <div style={{padding:'1.5rem 1.25rem 1rem',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:38,height:38,background:'linear-gradient(135deg,#4F46E5,#7C3AED)',borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 14px rgba(99,102,241,.45)'}}>
              {ICON.bolt}
            </div>
            <div>
              <p style={{fontSize:14,fontWeight:700,color:'#fff',lineHeight:1.2}}>Lançamentos</p>
              <p style={{fontSize:11,color:'rgba(255,255,255,.35)',fontWeight:400}}>Notas · CEO 2026</p>
            </div>
          </div>
        </div>
        <div style={{padding:'1rem .75rem',flex:1,display:'flex',flexDirection:'column',gap:3}}>
          <p style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,.2)',textTransform:'uppercase',letterSpacing:'.8px',padding:'0 10px',marginBottom:6}}>Menu</p>
          {nav.map(x=><div key={x.k} className={`nav-item${view===x.k?' active':''}`} onClick={()=>setView(x.k)}>
            {ICON[x.i]}<span>{x.l}</span>
            {view===x.k&&<div style={{marginLeft:'auto',width:6,height:6,borderRadius:'50%',background:'#818CF8'}}/>}
          </div>)}
        </div>
        <div style={{padding:'1rem',borderTop:'1px solid rgba(255,255,255,.06)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:10,background:'rgba(255,255,255,.04)'}}>
            <Avatar name={user.nome} size={32}/>
            <div style={{flex:1,minWidth:0}}>
              <p style={{fontSize:13,fontWeight:600,color:'rgba(255,255,255,.9)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.nome}</p>
              <p style={{fontSize:11,color:'rgba(255,255,255,.3)'}}>{ROLES[user.role]?.label}</p>
            </div>
            <button className="btn ghost icon" style={{color:'rgba(255,255,255,.3)',padding:5,borderRadius:8}} onClick={logout} title="Sair">{ICON.logout}</button>
          </div>
        </div>
      </nav>}
      <main style={{flex:1,marginLeft:mobile?0:'var(--sw)',padding:mobile?'1rem 1rem 90px':'2rem 2rem 2.5rem',minHeight:'100vh'}}>
        {mobile&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:9}}>
            <div style={{width:32,height:32,background:'linear-gradient(135deg,#4F46E5,#7C3AED)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center'}}>{ICON.bolt}</div>
            <div><p style={{fontSize:14,fontWeight:700}}>Lançamentos Notas</p><p style={{fontSize:11,color:'var(--text3)'}}>CEO Cabo Frio 2026</p></div>
          </div>
          <Avatar name={user.nome} size={34}/>
        </div>}
        {view==='dashboard'&&<Dash mobile={mobile}/>}
        {view==='records'&&<RecList cw={cw()} ia={ia()} mobile={mobile} onEdit={r=>{setEditRec(r);setView('form');}} onNew={()=>{setEditRec(null);setView('form');}} toast_={toast_}/>}
        {view==='form'&&<RecForm rec={editRec} user={user} cw={cw()} mobile={mobile} onSave={()=>{toast_('Avaliação salva com sucesso!');setView('records');}} onCancel={()=>setView('records')} toast_={toast_}/>}
        {view==='reports'&&<Reports mobile={mobile}/>}
        {view==='users'&&ia()&&<Users user={user} toast_={toast_}/>}
      </main>
      {mobile&&<nav className="bottom-nav">{nav.map(x=><div key={x.k} className={`bn-item${view===x.k?' active':''}`} onClick={()=>setView(x.k)}>{ICON[x.i]}<span>{x.l}</span></div>)}</nav>}
    </div>
  </>);
}

function Login({onLogin}){
  const [u,setU]=useState('');const [p,setP]=useState('');const [err,setErr]=useState('');const [loading,setLoading]=useState(false);
  const go=async()=>{
    if(!u||!p)return setErr('Preencha usuário e senha');
    setLoading(true);setErr('');
    const res=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});
    const d=await res.json();
    if(res.ok)onLogin(d.user,d.token);else{setErr(d.error||'Credenciais inválidas');setLoading(false);}
  };
  return(<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--sidebar)',padding:16,position:'relative',overflow:'hidden'}}>
    <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
      <div style={{position:'absolute',top:'-15%',right:'-10%',width:500,height:500,background:'radial-gradient(circle,rgba(99,102,241,.15) 0%,transparent 70%)',borderRadius:'50%'}}/>
      <div style={{position:'absolute',bottom:'-15%',left:'-10%',width:400,height:400,background:'radial-gradient(circle,rgba(124,58,237,.1) 0%,transparent 70%)',borderRadius:'50%'}}/>
      <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(rgba(255,255,255,.025) 1px,transparent 1px)',backgroundSize:'30px 30px'}}/>
    </div>
    <div className="fu" style={{width:'100%',maxWidth:420,position:'relative',zIndex:1}}>
      <div style={{textAlign:'center',marginBottom:'2.5rem'}}>
        <div style={{width:68,height:68,background:'linear-gradient(135deg,#4F46E5,#7C3AED)',borderRadius:22,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 10px 36px rgba(99,102,241,.55)'}}>{ICON.bolt}</div>
        <h1 style={{fontSize:27,fontWeight:700,color:'#fff',marginBottom:6}}>Lançamentos Notas</h1>
        <p style={{fontSize:14,color:'rgba(255,255,255,.38)',fontWeight:400}}>CEO Cabo Frio · Sistema de Avaliações 2026</p>
      </div>
      <div style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:22,padding:'2rem',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)'}}>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <label style={{fontSize:12.5,fontWeight:600,color:'rgba(255,255,255,.45)',display:'block',marginBottom:6}}>Usuário</label>
            <input className="field" value={u} onChange={e=>setU(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go()} placeholder="Digite seu usuário" style={{background:'rgba(255,255,255,.06)',border:'1.5px solid rgba(255,255,255,.08)',color:'#fff'}}/>
          </div>
          <div>
            <label style={{fontSize:12.5,fontWeight:600,color:'rgba(255,255,255,.45)',display:'block',marginBottom:6}}>Senha</label>
            <input className="field" type="password" value={p} onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go()} placeholder="••••••••" style={{background:'rgba(255,255,255,.06)',border:'1.5px solid rgba(255,255,255,.08)',color:'#fff'}}/>
          </div>
          {err&&<div style={{background:'rgba(220,38,38,.15)',border:'1px solid rgba(220,38,38,.3)',borderRadius:8,padding:'9px 12px',fontSize:13,color:'#FCA5A5',display:'flex',gap:7,alignItems:'center'}}>{ICON.x}{err}</div>}
          <button className="btn primary" style={{width:'100%',justifyContent:'center',padding:'11px 0',fontSize:15,marginTop:4}} onClick={go} disabled={loading}>
            {loading?<><Spin/>Entrando...</>:<>{ICON.shield}Entrar no Sistema</>}
          </button>
        </div>
      </div>
      <p style={{textAlign:'center',fontSize:12,color:'rgba(255,255,255,.18)',marginTop:16}}>system · system@2026</p>
    </div>
  </div>);
}

function Dash({mobile}){
  const [data,setData]=useState([]);const [loading,setLoading]=useState(true);
  useEffect(()=>{api('records').then(r=>{if(Array.isArray(r))setData(r);setLoading(false);});},[]);
  const total=data.length,aprov=data.filter(r=>r.resultadoFinal==='APROVADO'||r.resultadoFinal==='APROVADO 2').length,reprov=data.filter(r=>r.resultadoFinal==='REPROVADO').length,pend=total-aprov-reprov,tx=total?Math.round(aprov/total*100):0;
  const byBase={};data.forEach(r=>{if(r.base)byBase[r.base]=(byBase[r.base]||0)+1;});
  const topB=Object.entries(byBase).sort((a,b)=>b[1]-a[1]).slice(0,6),maxB=topB[0]?.[1]||1;
  const rec=[...data].reverse().slice(0,5);
  const stats=[{n:total,l:'Total',c:'#4F46E5',bg:'linear-gradient(135deg,#4F46E5,#6366F1)',sh:'rgba(99,102,241,.3)'},{n:aprov,l:'Aprovados',c:'#059669',bg:'linear-gradient(135deg,#059669,#10B981)',sh:'rgba(5,150,105,.3)'},{n:reprov,l:'Reprovados',c:'#DC2626',bg:'linear-gradient(135deg,#DC2626,#EF4444)',sh:'rgba(220,38,38,.3)'},{n:pend,l:'Pendentes',c:'#D97706',bg:'linear-gradient(135deg,#D97706,#F59E0B)',sh:'rgba(217,119,6,.3)'}];
  return(<div>
    <div className="fu" style={{marginBottom:24}}><h1 style={{fontSize:24,fontWeight:700}}>Dashboard</h1><p style={{fontSize:14,color:'var(--text3)',marginTop:3}}>Visão geral das avaliações</p></div>
    <div className="fu1" style={{display:'grid',gridTemplateColumns:mobile?'1fr 1fr':'repeat(4,1fr)',gap:13,marginBottom:20}}>
      {stats.map((s,i)=><div key={i} style={{background:s.bg,borderRadius:'var(--r)',padding:'1.25rem',boxShadow:`0 6px 20px ${s.sh}`,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:-10,top:-10,width:66,height:66,background:'rgba(255,255,255,.1)',borderRadius:'50%'}}/>
        <div style={{fontSize:32,fontWeight:800,color:'#fff',lineHeight:1}}>{s.n}</div>
        <div style={{fontSize:12.5,color:'rgba(255,255,255,.75)',marginTop:5,fontWeight:500}}>{s.l}</div>
      </div>)}
    </div>
    <div className="fu2" style={{display:'grid',gridTemplateColumns:mobile?'1fr':'1fr 1fr',gap:16,marginBottom:16}}>
      <div className="card" style={{padding:'1.25rem'}}>
        <p className="sec-h">Taxa de Aprovação</p>
        <div style={{display:'flex',alignItems:'center',gap:16,marginTop:8}}>
          <div style={{fontSize:42,fontWeight:800,color:'#059669',lineHeight:1}}>{tx}<span style={{fontSize:22}}>%</span></div>
          <div style={{flex:1}}>
            <div className="progress"><div className="progress-fill" style={{width:tx+'%',background:'linear-gradient(90deg,#059669,#34D399)'}}/></div>
            <p style={{fontSize:12,color:'var(--text3)',marginTop:6}}>{aprov} aprovados de {total} avaliações</p>
          </div>
        </div>
        <div style={{display:'flex',gap:16,marginTop:16,paddingTop:14,borderTop:'1px solid var(--border)'}}>
          {[['Aprovados',aprov,'#059669'],['Reprovados',reprov,'#DC2626'],['Pendentes',pend,'#D97706']].map(([l,n,c])=><div key={l} style={{flex:1,textAlign:'center'}}>
            <div style={{fontSize:22,fontWeight:700,color:c}}>{n}</div>
            <div style={{fontSize:11.5,color:'var(--text3)',marginTop:2}}>{l}</div>
          </div>)}
        </div>
      </div>
      <div className="card" style={{padding:'1.25rem'}}>
        <p className="sec-h">Por Base</p>
        {topB.map(([b,n])=><div key={b} className="chart-row">
          <span className="chart-lbl">{b}</span>
          <div className="chart-track"><div className="chart-bar" style={{width:Math.round(n/maxB*100)+'%',background:'linear-gradient(90deg,#4F46E5,#818CF8)'}}/></div>
          <span className="chart-val">{n}</span>
        </div>)}
        {!topB.length&&<p style={{fontSize:13,color:'var(--text3)'}}>{loading?'Carregando...':'Importe os registros históricos.'}</p>}
      </div>
    </div>
    <div className="card fu3">
      <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid var(--border)'}}><p className="sec-h" style={{marginBottom:0}}>Últimas Avaliações</p></div>
      {rec.map((r,i)=><div key={r.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 1.25rem',borderBottom:i<rec.length-1?'1px solid var(--border)':'none'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <Avatar name={r.nomes} size={34}/>
          <div><p style={{fontSize:14,fontWeight:600}}>{r.nomes||'—'}</p><p style={{fontSize:12,color:'var(--text3)'}}>{r.empresa||'—'} · {r.dataRealizacao||''}</p></div>
        </div>
        <Badge v={r.resultadoFinal}/>
      </div>)}
      {!rec.length&&<p style={{fontSize:13,color:'var(--text3)',padding:'1.5rem 1.25rem',textAlign:'center'}}>{loading?'Carregando...':'Nenhum registro ainda.'}</p>}
    </div>
  </div>);
}

function RecList({cw,ia,mobile,onEdit,onNew,toast_}){
  const [data,setData]=useState([]);const [loading,setLoading]=useState(true);
  const [q,setQ]=useState('');const [base,setBase]=useState('');const [res,setRes]=useState('');const [page,setPage]=useState(0);
  const PER=20;const fileRef=useRef(null);
  const load=useCallback(()=>{setLoading(true);api('records?'+new URLSearchParams({q,base,resultado:res})).then(r=>{if(Array.isArray(r))setData(r);setLoading(false);});},[q,base,res]);
  useEffect(()=>{load();},[load]);
  const del=async id=>{if(!confirm('Excluir este registro permanentemente?'))return;await api('records/'+id,{method:'DELETE'});toast_('Registro excluído');load();};
  const imp=async f=>{const t=await f.text();const a=JSON.parse(t);const r=await api('records',{method:'POST',body:JSON.stringify(Array.isArray(a)?a:[a])});toast_(`${r.imported||0} registros importados!`);load();};
  const pages=Math.ceil(data.length/PER),paged=data.slice(page*PER,(page+1)*PER);
  if(mobile)return(<div>
    <div className="fu" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
      <div><h1 style={{fontSize:20,fontWeight:700}}>Avaliações</h1><p style={{fontSize:13,color:'var(--text3)'}}>{data.length} registros</p></div>
      {cw&&<button className="btn primary sm" onClick={onNew}>{ICON.plus}Nova</button>}
    </div>
    <div style={{position:'relative',marginBottom:14}}>
      <div style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)',pointerEvents:'none'}}>{ICON.search}</div>
      <input className="field" style={{paddingLeft:36}} placeholder="Buscar nome, empresa, CPF..." value={q} onChange={e=>{setQ(e.target.value);setPage(0);}}/>
    </div>
    {paged.map(r=><div key={r.id} className="card fu" style={{padding:14,marginBottom:10,cursor:'pointer'}} onClick={()=>cw&&onEdit(r)}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          {r.fotoCandidato?<img src={r.fotoCandidato} style={{width:40,height:40,borderRadius:'50%',objectFit:'cover'}}/>:<Avatar name={r.nomes} size={40}/>}
          <div><p style={{fontWeight:600,fontSize:14}}>{r.nomes||'—'}</p><p style={{fontSize:12,color:'var(--text3)'}}>{r.empresa||'—'}</p></div>
        </div>
        <Badge v={r.resultadoFinal}/>
      </div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
        {r.base&&<span className="badge blue">{r.base}</span>}
        {r.dataRealizacao&&<span className="badge gray">{r.dataRealizacao}</span>}
      </div>
    </div>)}
    {!paged.length&&!loading&&<div style={{textAlign:'center',padding:'3rem 0',color:'var(--text3)'}}>Nenhum registro encontrado</div>}
    {pages>1&&<div style={{display:'flex',justifyContent:'center',gap:8,marginTop:16,alignItems:'center'}}>
      <button className="btn sm" disabled={page===0} onClick={()=>setPage(p=>p-1)}>‹ Ant</button>
      <span style={{fontSize:13,color:'var(--text3)'}}>{page+1}/{pages}</span>
      <button className="btn sm" disabled={page>=pages-1} onClick={()=>setPage(p=>p+1)}>Prox ›</button>
    </div>}
  </div>);
  return(<div>
    <div className="fu" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
      <div><h1 style={{fontSize:24,fontWeight:700}}>Avaliações</h1><p style={{fontSize:14,color:'var(--text3)',marginTop:3}}>{data.length} registros</p></div>
      <div style={{display:'flex',gap:8}}>
        <button className="btn" onClick={()=>window.location.href='/api/export'}>{ICON.down}CSV</button>
        {cw&&<><input ref={fileRef} type="file" accept=".json" style={{display:'none'}} onChange={e=>{if(e.target.files[0])imp(e.target.files[0]);e.target.value='';}}/>
        <button className="btn amber-btn" onClick={()=>fileRef.current.click()}>{ICON.up}Importar JSON</button>
        <button className="btn primary" onClick={onNew}>{ICON.plus}Nova Avaliação</button></>}
      </div>
    </div>
    <div className="card fu1" style={{padding:'1rem 1.25rem',marginBottom:16,display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
      <div style={{position:'relative',flex:2,minWidth:200}}>
        <div style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)',pointerEvents:'none'}}>{ICON.search}</div>
        <input className="field" style={{paddingLeft:36}} placeholder="Buscar nome, empresa, CPF, turma..." value={q} onChange={e=>{setQ(e.target.value);setPage(0);}}/>
      </div>
      <select className="field" style={{flex:1,minWidth:140}} value={base} onChange={e=>{setBase(e.target.value);setPage(0);}}>
        <option value="">Todas as Bases</option>{BASES.map(b=><option key={b}>{b}</option>)}
      </select>
      <select className="field" style={{flex:1,minWidth:140}} value={res} onChange={e=>{setRes(e.target.value);setPage(0);}}>
        <option value="">Todos Resultados</option>
        {['APROVADO','APROVADO 2','REPROVADO','AUSENTE','PENDENTE'].map(r=><option key={r}>{r}</option>)}
      </select>
      {(q||base||res)&&<button className="btn ghost sm" onClick={()=>{setQ('');setBase('');setRes('');setPage(0);}}>Limpar</button>}
    </div>
    <div className="card fu2" style={{padding:0,overflow:'hidden'}}>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:750}}>
          <thead><tr>
            <th className="th" style={{width:50}}></th>
            <th className="th">Nome</th><th className="th">Empresa</th><th className="th">Base</th>
            <th className="th">Processo</th><th className="th">Data</th><th className="th">Resultado</th>
            {cw&&<th className="th" style={{textAlign:'right'}}>Ações</th>}
          </tr></thead>
          <tbody>
            {paged.map(r=><tr key={r.id}>
              <td className="td">{r.fotoCandidato?<img src={r.fotoCandidato} style={{width:32,height:32,borderRadius:'50%',objectFit:'cover'}}/>:<Avatar name={r.nomes} size={32}/>}</td>
              <td className="td" style={{fontWeight:600}}>{r.nomes||'—'}</td>
              <td className="td" style={{fontSize:13,color:'var(--text2)'}}>{r.empresa||'—'}</td>
              <td className="td">{r.base?<span className="badge blue">{r.base}</span>:'—'}</td>
              <td className="td" style={{fontSize:12,color:'var(--text3)',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{(r.processo||'—').replace(/_/g,' ')}</td>
              <td className="td" style={{fontSize:12,fontFamily:'var(--mono)'}}>{r.dataRealizacao||'—'}</td>
              <td className="td"><Badge v={r.resultadoFinal}/></td>
              {cw&&<td className="td" style={{textAlign:'right'}}>
                <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                  <button className="btn sm icon" onClick={()=>onEdit(r)}>{ICON.edit}</button>
                  {ia&&<button className="btn sm icon danger" onClick={()=>del(r.id)}>{ICON.trash}</button>}
                </div>
              </td>}
            </tr>)}
            {!paged.length&&<tr><td colSpan="8" style={{textAlign:'center',padding:'3rem',color:'var(--text3)'}}>{loading?'Carregando...':'Nenhum registro. Importe dados ou crie uma nova avaliação.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
    {pages>1&&<div className="fu3" style={{display:'flex',justifyContent:'center',alignItems:'center',gap:10,marginTop:16}}>
      <button className="btn sm" disabled={page===0} onClick={()=>setPage(p=>p-1)}>‹ Anterior</button>
      <span style={{fontSize:13,color:'var(--text3)',fontFamily:'var(--mono)'}}>Página {page+1} de {pages}</span>
      <button className="btn sm" disabled={page>=pages-1} onClick={()=>setPage(p=>p+1)}>Próxima ›</button>
    </div>}
  </div>);
}

function RecForm({rec,user,cw,mobile,onSave,onCancel,toast_}){
  const [form,setForm]=useState(()=>rec?{...emptyForm(),...rec}:emptyForm());
  const [tab,setTab]=useState(0);const [errors,setErrors]=useState({});const [saving,setSaving]=useState(false);
  const photoRef=useRef(null);
  const upd=(f,v)=>setForm(p=>{const n={...p,[f]:v};if(f==='cpf')n.isbn=v.replace(/\D/g,'').length===11?'721449704000116'+v.replace(/\D/g,''):'';return n;});
  const save=async()=>{
    const e={};if(!form.nomes)e.nomes='Obrigatório';if(!form.pedido)e.pedido='Obrigatório';if(!form.empresa)e.empresa='Obrigatório';if(!form.base)e.base='Obrigatório';if(!form.processo)e.processo='Obrigatório';
    setErrors(e);if(Object.keys(e).length){toast_('Preencha os campos obrigatórios','error');return;}
    setSaving(true);
    const r=rec?.id?await api('records/'+rec.id,{method:'PUT',body:JSON.stringify({...form,updatedBy:user.nome})}):await api('records',{method:'POST',body:JSON.stringify({...form,createdBy:user.nome})});
    setSaving(false);
    if(r.error)toast_(r.error,'error');else onSave();
  };
  const photo=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>upd('fotoCandidato',ev.target.result);r.readAsDataURL(f);};
  const F=({label,field,type='text',opts,auto,req,ph})=>(<div>
    <label className="label">{label}{req&&<span className="req">*</span>}</label>
    {opts?<select className={`field${auto?' auto':''}`} value={form[field]||''} onChange={e=>upd(field,e.target.value)} disabled={auto}>
      <option value="">Selecionar...</option>{opts.map(o=><option key={o} value={o}>{typeof o==='string'?o.replace(/_/g,' '):o}</option>)}
    </select>:<input className={`field${auto?' auto':''}`} type={type} value={form[field]||''} onChange={e=>upd(field,e.target.value)} readOnly={auto} placeholder={ph}/>}
    {errors[field]&&<p className="err-msg">{errors[field]}</p>}
  </div>);
  const PB=({n})=>(<div className="ph-block">
    <div className="ph-title">Avaliação Prática {n}</div>
    <div style={{display:'grid',gridTemplateColumns:mobile?'1fr':'1fr 1fr 1fr',gap:12,marginBottom:10}}>
      <div><label className="label">Atividade {n}</label><select className="field" value={form['avaliacao'+n]||''} onChange={e=>upd('avaliacao'+n,e.target.value)}><option value="">Selecionar...</option></select></div>
      <F label="Baremo K" field={`baremo${n}`} auto/>
      <div><label className="label">Status {n}</label><select className="field" value={form['statusProva'+n]||''} onChange={e=>upd('statusProva'+n,e.target.value)}><option value="">—</option>{STATUS_PRATICA.map(s=><option key={s}>{s}</option>)}</select></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:mobile?'1fr':'1fr 1fr',gap:12,marginBottom:10}}>
      <div><label className="label">Motivo(s)</label><select className="field" value={form['motivo'+n]||''} onChange={e=>upd('motivo'+n,e.target.value)}><option value="">—</option>{MOTIVOS.map(m=><option key={m}>{m}</option>)}</select></div>
      <F label="IT (auto)" field={`it${n}`} auto/>
    </div>
    <div><label className="label">Detalhamento</label><textarea className="field" rows={2} value={form['detalhe'+n]||''} onChange={e=>upd('detalhe'+n,e.target.value)} style={{resize:'vertical'}}/></div>
  </div>);
  const g2={display:'grid',gridTemplateColumns:mobile?'1fr':'1fr 1fr',gap:13};
  const g3={display:'grid',gridTemplateColumns:mobile?'1fr':'1fr 1fr 1fr',gap:13};
  const tabs=['Identificação','Avaliação','Práticas 1–3','Práticas 4–6','Resultado'];
  return(<div>
    <div className="fu" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,flexWrap:'wrap',gap:12}}>
      <div><h1 style={{fontSize:22,fontWeight:700}}>{rec?'Editar':'Nova'} Avaliação</h1>{rec&&<p style={{fontSize:11,color:'var(--text3)',marginTop:3,fontFamily:'var(--mono)'}}>ID: {rec.id}</p>}</div>
      <div style={{display:'flex',gap:8}}>
        <button className="btn" onClick={onCancel}>Cancelar</button>
        {cw&&<button className="btn primary" onClick={save} disabled={saving}>{saving?<><Spin/>Salvando...</>:<>{ICON.save}Salvar Avaliação</>}</button>}
      </div>
    </div>
    <div className="tab-bar fu1" style={{marginBottom:16}}>
      {tabs.map((t,i)=><button key={i} className={`tab${tab===i?' active':''}`} onClick={()=>setTab(i)}>{t}</button>)}
    </div>
    <div className="card fu2" style={{padding:'1.5rem'}}>
      {tab===0&&<div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div style={{display:'flex',gap:20,alignItems:'flex-start',flexWrap:'wrap'}}>
          <div style={{textAlign:'center',flexShrink:0}}>
            {form.fotoCandidato?<img src={form.fotoCandidato} style={{width:80,height:80,borderRadius:'50%',objectFit:'cover',border:'3px solid var(--primary)',boxShadow:'0 0 0 4px var(--primary-glow)'}}/>
            :<div style={{width:80,height:80,borderRadius:'50%',background:'linear-gradient(135deg,#4F46E5,#7C3AED)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,color:'#fff',boxShadow:'0 4px 16px rgba(99,102,241,.3)'}}>{(form.nomes||'?')[0]?.toUpperCase()||'👤'}</div>}
            <button className="btn ghost sm" style={{marginTop:8,fontSize:12}} onClick={()=>photoRef.current.click()}>{ICON.cam}Foto</button>
            {form.fotoCandidato&&<button className="btn ghost sm" style={{marginTop:4,color:'var(--danger)',fontSize:11,display:'block',width:'100%'}} onClick={()=>upd('fotoCandidato','')}>Remover</button>}
            <input ref={photoRef} type="file" accept="image/*" style={{display:'none'}} onChange={photo}/>
          </div>
          <div style={{flex:1,minWidth:200}}>
            <div style={g3}>
              <F label="Status" field="statusColaborador" opts={['CANDIDATO','ATIVO','DESLIGADO']}/>
              <F label="Pedido" field="pedido" opts={PEDIDOS} req/>
              <F label="Turma" field="turma" ph="Ex: T01-2026"/>
            </div>
          </div>
        </div>
        <div className="divider"/>
        <p className="sec-h">Dados Pessoais</p>
        <div style={g3}><F label="Data de Realização" field="dataRealizacao" type="date"/><F label="Nome Completo" field="nomes" req ph="Nome completo"/><F label="Matrícula" field="matricula" ph="Nº matrícula"/></div>
        <div style={g3}>
          <div><label className="label">CPF</label><input className="field" value={form.cpf||''} onChange={e=>upd('cpf',e.target.value.replace(/\D/g,'').slice(0,11))} placeholder="Somente números"/></div>
          <F label="ISBN (auto)" field="isbn" auto/><F label="Estado (auto)" field="estado" auto/>
        </div>
        <div className="divider"/>
        <p className="sec-h">Localização & Avaliação</p>
        <div style={g3}><F label="Empresa" field="empresa" opts={EMPRESAS_NOMES} req/><F label="Base" field="base" opts={BASES} req/><F label="UO (auto)" field="unidadeOperacional" auto/></div>
        <div style={g3}><F label="Região (auto)" field="regiao" auto/><F label="Avaliador" field="avaliador" opts={AVALIADORES}/><F label="Local de Avaliação" field="localAvaliacao"/></div>
        <div style={g2}><F label="Processo" field="processo" opts={PROCESSOS} req/><F label="Cargo (auto)" field="cargosProcessos" auto/></div>
      </div>}
      {tab===1&&<div style={{display:'flex',flexDirection:'column',gap:16}}>
        <p className="sec-h">Teste Online</p>
        <div style={g2}><F label="Avaliação Online" field="avaliacaoOnline" opts={['NÃO REALIZADO','REALIZADO']}/>
          <div><label className="label">Status Online (auto)</label><div style={{display:'flex',alignItems:'center',gap:8}}><input className="field auto" value={form.statusProvaOnline||''} readOnly/>
          {form.statusProvaOnline==='OK'&&<span className="badge green">OK</span>}{form.statusProvaOnline==='NOK'&&<span className="badge red">NOK</span>}</div></div>
        </div>
        <div className="divider"/>
        <p className="sec-h">Prova Teórica</p>
        <div style={g2}>
          <div><label className="label">Nota <span style={{fontSize:11,color:'var(--text3)',fontWeight:400}}>(0–10, mín. 6,9)</span></label><input className="field" type="number" min="0" max="10" step="0.1" value={form.notaProva||''} onChange={e=>upd('notaProva',e.target.value)}/></div>
          <div><label className="label">Status Teórica (auto)</label><div style={{display:'flex',alignItems:'center',gap:8}}><input className="field auto" value={form.statusProvaTeorica||''} readOnly/>
          {form.statusProvaTeorica==='APROVADO'&&<span className="badge green dot">APROVADO</span>}{form.statusProvaTeorica==='NÃO APTO'&&<span className="badge red dot">NÃO APTO</span>}</div></div>
        </div>
        <div className="divider"/>
        <p className="sec-h">Nivelamento</p>
        <div style={g3}><F label="Nivelamento Teórico" field="nivelamentoTeorico"/><F label="Niv. Prático × Baremo" field="nivelamentoPratico"/><F label="Reavaliação Prática × Baremo" field="reavaliacaoPratica"/></div>
      </div>}
      {tab===2&&<div><PB n="1"/><PB n="2"/><PB n="3"/></div>}
      {tab===3&&<div><PB n="4"/><PB n="5"/><PB n="6"/><div className="divider"/><p className="sec-h">Reavaliação</p><div style={g2}><F label="Reavaliação" field="reavaliacao"/><F label="Reavaliação × Baremo" field="reavaliacaoBaremo"/></div></div>}
      {tab===4&&<div style={{display:'flex',flexDirection:'column',gap:16}}>
        <p className="sec-h">Resultado Final</p>
        <div style={g3}>
          <div><label className="label">Status Parcial (auto)</label><input className="field auto" value={form.statusParcial||''} readOnly/></div>
          <div><label className="label">Resultado Final (auto)</label><div style={{display:'flex',alignItems:'center',gap:8}}><input className="field auto" value={form.resultadoFinal||''} readOnly/>{form.resultadoFinal&&<Badge v={form.resultadoFinal}/>}</div></div>
          <F label="Empresa Avaliadora" field="empresaAvaliadora"/>
        </div>
        <div className="divider"/>
        <p className="sec-h">HAR</p>
        <div style={g3}><F label="HAR" field="har"/><F label="Documento HAR" field="documentoHar"/><F label="Status HAR Vencida" field="statusHarVencida" opts={['','SIM','NÃO','DESLIGADO']}/></div>
        <F label="Link do Documento" field="links" ph="https://..."/>
        <div className="divider"/>
        <p className="sec-h">Dados Contratuais (auto)</p>
        <div style={g2}><F label="E-mail Empresa" field="emailEmpresa" auto/><F label="Valor Renovação R$" field="nRenovacao" auto/></div>
        <div style={g3}><F label="Início Assinatura" field="dataInicioAssinatura" auto/><F label="Fim Assinatura" field="dataFimAssinatura" auto/><F label="Associado Sindistal" field="associadoSindistal" auto/></div>
        <F label="Doc Contratual" field="docContratual" auto/>
        {form.createdBy&&<p style={{fontSize:11,color:'var(--text3)',fontFamily:'var(--mono)'}}>Criado por {form.createdBy} · {form.createdAt?.slice(0,10)}{form.updatedBy?` | Editado por ${form.updatedBy} · ${form.updatedAt?.slice(0,10)}`:''}</p>}
      </div>}
    </div>
  </div>);
}

function Reports({mobile}){
  const [data,setData]=useState([]);const [dtIni,setDtIni]=useState('');const [dtFim,setDtFim]=useState('');const [fb,setFb]=useState('');
  useEffect(()=>{api('records?'+new URLSearchParams({dtIni,dtFim,base:fb})).then(r=>{if(Array.isArray(r))setData(r);});},[dtIni,dtFim,fb]);
  const total=data.length,aprov=data.filter(r=>r.resultadoFinal==='APROVADO'||r.resultadoFinal==='APROVADO 2').length,reprov=data.filter(r=>r.resultadoFinal==='REPROVADO').length,ausente=data.filter(r=>r.resultadoFinal==='AUSENTE').length,pend=total-aprov-reprov-ausente,tx=total?Math.round(aprov/total*100):0;
  const byBase={};data.forEach(r=>{if(r.base)byBase[r.base]=(byBase[r.base]||0)+1;});
  const topB=Object.entries(byBase).sort((a,b)=>b[1]-a[1]).slice(0,7),maxB=topB[0]?.[1]||1;
  const byP={};data.forEach(r=>{if(r.processo){const k=r.processo.replace(/_/g,' ').slice(0,26);byP[k]=(byP[k]||0)+1;}});
  const topP=Object.entries(byP).sort((a,b)=>b[1]-a[1]).slice(0,6),maxP=topP[0]?.[1]||1;
  return(<div>
    <div className="fu" style={{marginBottom:24}}><h1 style={{fontSize:24,fontWeight:700}}>Relatórios</h1><p style={{fontSize:14,color:'var(--text3)',marginTop:3}}>Análise por período e filtros</p></div>
    <div className="card fu1" style={{padding:'1.25rem',marginBottom:20}}>
      <p className="sec-h">Filtros</p>
      <div style={{display:'grid',gridTemplateColumns:mobile?'1fr':'1fr 1fr 1fr auto',gap:12,alignItems:'end'}}>
        <div><label className="label">Data Início</label><input className="field" type="date" value={dtIni} onChange={e=>setDtIni(e.target.value)}/></div>
        <div><label className="label">Data Fim</label><input className="field" type="date" value={dtFim} onChange={e=>setDtFim(e.target.value)}/></div>
        <div><label className="label">Base</label><select className="field" value={fb} onChange={e=>setFb(e.target.value)}><option value="">Todas</option>{BASES.map(b=><option key={b}>{b}</option>)}</select></div>
        {(dtIni||dtFim||fb)&&<button className="btn ghost sm" onClick={()=>{setDtIni('');setDtFim('');setFb('');}}>Limpar</button>}
      </div>
    </div>
    <div className="fu2" style={{display:'grid',gridTemplateColumns:mobile?'1fr 1fr':'repeat(4,1fr)',gap:13,marginBottom:20}}>
      {[{n:total,l:'No Período',c:'#4F46E5',bg:'linear-gradient(135deg,#4F46E5,#6366F1)'},{n:aprov,l:'Aprovados',c:'#059669',bg:'linear-gradient(135deg,#059669,#10B981)'},{n:reprov,l:'Reprovados',c:'#DC2626',bg:'linear-gradient(135deg,#DC2626,#EF4444)'},{n:ausente,l:'Ausentes',c:'#D97706',bg:'linear-gradient(135deg,#D97706,#F59E0B)'}].map((s,i)=><div key={i} style={{background:s.bg,borderRadius:'var(--r)',padding:'1.25rem',boxShadow:`0 5px 18px ${s.c}33`,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:-8,top:-8,width:58,height:58,background:'rgba(255,255,255,.1)',borderRadius:'50%'}}/>
        <div style={{fontSize:30,fontWeight:800,color:'#fff'}}>{s.n}</div>
        <div style={{fontSize:12.5,color:'rgba(255,255,255,.75)',fontWeight:500}}>{s.l}</div>
      </div>)}
    </div>
    <div className="fu3" style={{display:'grid',gridTemplateColumns:mobile?'1fr':'1fr 1fr',gap:16}}>
      <div className="card" style={{padding:'1.25rem'}}>
        <p className="sec-h">Por Base</p>
        {topB.map(([b,n])=><div key={b} className="chart-row"><span className="chart-lbl">{b}</span><div className="chart-track"><div className="chart-bar" style={{width:Math.round(n/maxB*100)+'%',background:'linear-gradient(90deg,#4F46E5,#818CF8)'}}/></div><span className="chart-val">{n}</span></div>)}
        {!topB.length&&<p style={{fontSize:13,color:'var(--text3)'}}>Sem dados</p>}
      </div>
      <div className="card" style={{padding:'1.25rem'}}>
        <p className="sec-h">Top Processos</p>
        {topP.map(([p,n])=><div key={p} className="chart-row"><span className="chart-lbl">{p}</span><div className="chart-track"><div className="chart-bar" style={{width:Math.round(n/maxP*100)+'%',background:'linear-gradient(90deg,#059669,#34D399)'}}/></div><span className="chart-val">{n}</span></div>)}
        {!topP.length&&<p style={{fontSize:13,color:'var(--text3)'}}>Sem dados</p>}
      </div>
      <div className="card" style={{padding:'1.25rem'}}>
        <p className="sec-h">Distribuição de Resultados</p>
        {[['APROVADO',aprov,'#059669'],['REPROVADO',reprov,'#DC2626'],['AUSENTE',ausente,'#D97706'],['PENDENTE',pend,'#94A3B8']].map(([l,n,c])=><div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
          <span style={{fontSize:13.5,fontWeight:500}}>{l}</span>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:88,height:7,background:'rgba(0,0,0,.05)',borderRadius:5,overflow:'hidden'}}><div style={{height:'100%',borderRadius:5,background:c,width:total?Math.round(n/total*100)+'%':'0%',transition:'width .5s'}}/></div>
            <span style={{fontSize:13,fontWeight:700,minWidth:28,textAlign:'right'}}>{n}</span>
            <span style={{fontSize:11.5,color:'var(--text3)',fontFamily:'var(--mono)',minWidth:34}}>{total?Math.round(n/total*100):0}%</span>
          </div>
        </div>)}
      </div>
      <div className="card" style={{padding:'1.25rem',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <p className="sec-h" style={{alignSelf:'flex-start',width:'100%'}}>Taxa de Aprovação</p>
        <div style={{textAlign:'center',marginTop:12}}>
          <div style={{fontSize:64,fontWeight:800,background:'linear-gradient(135deg,#059669,#34D399)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',lineHeight:1}}>{tx}<span style={{fontSize:32}}>%</span></div>
          <div className="progress" style={{width:200,margin:'14px auto 10px'}}><div className="progress-fill" style={{width:tx+'%',background:'linear-gradient(90deg,#059669,#34D399)'}}/></div>
          <p style={{fontSize:13,color:'var(--text3)'}}>{aprov} aprovados de {total}</p>
        </div>
      </div>
    </div>
  </div>);
}

function Users({user,toast_}){
  const [users,setUsers]=useState([]);const [show,setShow]=useState(false);const [editU,setEditU]=useState(null);
  const [form,setForm]=useState({username:'',password:'',nome:'',role:'COLABORADOR',permissions:'Somente Leitura'});const [err,setErr]=useState('');
  useEffect(()=>{api('users').then(r=>{if(Array.isArray(r))setUsers(r);});},[]);
  const open=u=>{setForm(u?{...u,password:''}:{username:'',password:'',nome:'',role:'COLABORADOR',permissions:'Somente Leitura'});setEditU(u||null);setErr('');setShow(true);};
  const save=async()=>{
    if(!form.username||!form.nome)return setErr('Usuário e nome obrigatórios');
    if(!editU&&!form.password)return setErr('Senha obrigatória');
    const r=await api('users',{method:editU?'PUT':'POST',body:JSON.stringify(editU?{id:editU.id,...form}:form)});
    if(r.error)return setErr(r.error);
    const u=await api('users');if(Array.isArray(u))setUsers(u);
    setShow(false);toast_(editU?'Usuário atualizado!':'Usuário criado!');
  };
  const toggle=async u=>{await api('users',{method:'PUT',body:JSON.stringify({id:u.id,active:!u.active})});setUsers(us=>us.map(x=>x.id===u.id?{...x,active:!x.active}:x));};
  return(<div>
    <div className="fu" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
      <div><h1 style={{fontSize:24,fontWeight:700}}>Usuários</h1><p style={{fontSize:14,color:'var(--text3)',marginTop:3}}>{users.length} usuários cadastrados</p></div>
      <button className="btn primary" onClick={()=>open(null)}>{ICON.uplus}Novo Usuário</button>
    </div>
    <div className="card fu1" style={{padding:0,overflow:'hidden'}}>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:600}}>
          <thead><tr><th className="th" style={{width:48}}></th><th className="th">Nome</th><th className="th">Usuário</th><th className="th">Perfil</th><th className="th">Permissão</th><th className="th">Status</th><th className="th" style={{textAlign:'right'}}>Ações</th></tr></thead>
          <tbody>{users.map(u=><tr key={u.id}>
            <td className="td"><Avatar name={u.nome} size={32}/></td>
            <td className="td" style={{fontWeight:600}}>{u.nome}</td>
            <td className="td" style={{fontFamily:'var(--mono)',fontSize:12.5,color:'var(--text2)'}}>{u.username}</td>
            <td className="td"><span className="badge" style={{background:ROLES[u.role]?.bg,color:ROLES[u.role]?.color}}>{ROLES[u.role]?.label}</span></td>
            <td className="td" style={{fontSize:13,color:'var(--text3)'}}>{u.role==='COLABORADOR'?u.permissions:'— Total —'}</td>
            <td className="td"><span className={`badge dot ${u.active?'green':'gray'}`}>{u.active?'Ativo':'Inativo'}</span></td>
            <td className="td" style={{textAlign:'right'}}>
              <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                <button className="btn sm icon" onClick={()=>open(u)}>{ICON.edit}</button>
                {u.id!==user.id&&u.role!=='SYSTEM'&&<button className={`btn sm ${u.active?'danger':'success'}`} style={{fontSize:12,padding:'4px 10px'}} onClick={()=>toggle(u)}>{u.active?'Inativar':'Ativar'}</button>}
              </div>
            </td>
          </tr>)}</tbody>
        </table>
      </div>
    </div>
    {show&&<div className="overlay" onClick={e=>e.target===e.currentTarget&&setShow(false)}>
      <div className="modal">
        <div className="modal-hd">
          <div><h3 style={{fontSize:16,fontWeight:700}}>{editU?'Editar Usuário':'Novo Usuário'}</h3><p style={{fontSize:12,color:'var(--text3)',marginTop:2}}>{editU?`Editando ${editU.username}`:'Preencha os dados'}</p></div>
          <button className="btn ghost icon" onClick={()=>setShow(false)}>{ICON.x}</button>
        </div>
        <div className="modal-bd">
          <div><label className="label">Nome Completo *</label><input className="field" value={form.nome||''} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="Nome completo"/></div>
          <div><label className="label">Usuário (login) *</label><input className="field" value={form.username||''} onChange={e=>setForm(f=>({...f,username:e.target.value}))} placeholder="nome.sobrenome"/></div>
          <div><label className="label">Senha {editU&&<span style={{fontSize:11,color:'var(--text3)',fontWeight:400}}>(em branco = manter)</span>}</label><input className="field" type="password" value={form.password||''} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="••••••••"/></div>
          <div><label className="label">Perfil</label>
            <select className="field" value={form.role||'COLABORADOR'} onChange={e=>setForm(f=>({...f,role:e.target.value}))} disabled={editU?.role==='SYSTEM'}>
              {user.role==='SYSTEM'&&<option value="SYSTEM">SYSTEM (Master)</option>}
              <option value="ADMIN">Administrador</option><option value="COLABORADOR">Colaborador</option>
            </select>
          </div>
          {form.role==='COLABORADOR'&&<div><label className="label">Permissão</label>
            <select className="field" value={form.permissions||'Somente Leitura'} onChange={e=>setForm(f=>({...f,permissions:e.target.value}))}>
              <option value="Somente Leitura">Somente Leitura</option><option value="Leitura + Escrita">Leitura + Escrita</option>
            </select>
          </div>}
          {err&&<div style={{background:'var(--danger-bg)',border:'1px solid #FECACA',borderRadius:8,padding:'9px 12px',fontSize:13,color:'var(--danger)',display:'flex',gap:7}}>{ICON.x}{err}</div>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:4}}>
            <button className="btn" onClick={()=>setShow(false)}>Cancelar</button>
            <button className="btn primary" onClick={save}>{ICON.save}Salvar</button>
          </div>
        </div>
      </div>
    </div>}
  </div>);
}
