'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { applyBusinessRules, calcISBN, getBaremo, getCargo, getIT, getEmpresaData, calcStatusProvaOnline, calcStatusProvaTeorica, calcStatusParcial, calcResultadoFinal, BASE_UO_REGIAO, PROCESSOS_MAP } from '../lib/business';

const BASES=["ANGRA DOS REIS","ARARUAMA","CABO FRIO","CAMPOS","CANTAGALO","ENEL RIO","ITAMBI","ITAPERUNA","MACAÉ","MAGÉ","NITERÓI","PÁDUA","PETRÓPOLIS","RESENDE","SÃO GONÇALO","SÃO PEDRO DA ALDEIA","TANGUÁ","TERESÓPOLIS"];
const PEDIDOS=["RENOVAÇÃO DA HAR","1ª AVALIAÇÃO","1ª REAVALIAÇÃO","2ª REAVALIAÇÃO","HI PO","NO SHOW","2ª VIA DE HAR"];
const AVALIADORES=["ADALBERTO","ALEXANDRE BENTER","ANDRÉ LUIZ","CARLOS ANTÔNIO","CARLOS HENRIQUE","DANIEL","EDELSON","FÁTIMA","GERALDO CESAR DE FARIA","GUILHERME","HEITOR LEMOS","IGOR","JOSEMÁRIO","JÚLIO SOLANO","MARCELO","MARCO AURÉLIO","MARCOS OLIVEIRA","PARDO","PAULO CASTRO","SÉRGIO"];
const MOTIVOS=["SEGURANÇA","QUALIDADE","BAREMO","SEGURANÇA + QUALIDADE","SEGURANÇA + BAREMO","QUALIDADE + BAREMO","SEGURANÇA + QUALIDADE + BAREMO"];
const STATUS_PRATICA=["APTO","NÃO APTO","PENDENTE","NÃO REALIZADO"];
const PROCESSOS=["LINHA_VIVA","CONSTRUÇÃO_E_MANUTENÇÃO_OBRA","APOIO_À_EMERGÊNCIA","APOIO_À_EMERGÊNCIA_G","ATENDIMENTO_DE_EMERGÊNCIA","ENCARREGADO","COMERCIAL_LIGAÇÃO_NOVA_CORTE_E_RELIGAÇÃO","INSPEÇÃO_E_NORMALIZAÇÃO_GRUPO_B_TRADICIONAL","INSPEÇÃO_E_NORMALIZAÇÃO_GRUPO_B_ELETRÔNICO","INSPEÇÃO_E_NORMALIZAÇÃO_GRUPO_A_COMERCIAL","INSPEÇÃO_E_NORMALIZAÇÃO_GRUPO_A_PERDAS","INSPEÇÃO_E_NORMALIZAÇÃO_GRUPO_A_MK6","PODA_COM_REDE_ENERGIZADA","PODA_COM_REDE_DESENERGIZADA","PODA_DESENERGIZADA_A_DISTANCIA","OPERADOR_DE_CESTA_AÉREA","OPERADOR_DE_GUINDAUTO","REDE_SUBTERRÂNEA","MANUTENÇÃO_CORRETIVA_E_PREVENTINA_EM_SE_DESENERGIZADA_EM_ATÉ_138_KV","ENCARREGADO_DE_SE_DESENERGIZADA_EM_ATÉ_138_KV","LIMPEZA_DE_REDE","OPERADOR_SE"];
const EMPRESAS_NOMES=["3C SERVICES-52L0002064","3C SERVICES-52L0002309","3C SERVICES-JA10098617","CENEGED - JA10134979","DÍNAMO LAGOS-JA10140367","ELLCA-52L0002379","ELLCA-JA10110696","ELLCA-JA10146796","ELLCA-JA10149890","ELLCA-JA10170084","ELLCA-JA10179591","EMA MAGÉ-JA10091870","EMA SG-52L0002365","ENGELMIG-JA10083461","ENGELMIG-JA10114811","ENGELMIG-JA10166038","INDICA-JA10110552","M&E-JA10072640","MEDRAL-JA10098645","PROGEN-JA10086153","PROGEN-JA10131908","PROGEN-JA10140365","PROGEN-JA10148049","PSE ENERGIA - 52L0002200","PSE-JA10135676","REENERGISA-JA10083849","STN-JA10087291","STN-JA100117257","TEES-JA10166037","COMPEL-JA10159368","POWER SOLUTION-JA10184918","VEMAN LAGOS-52L0002297","VEMAN SERRANA-JA10119303","ENEL","DINAMO LAGOS-52L0002141"];
const ROLES={SYSTEM:{label:'SYSTEM',bg:'rgba(139,92,246,.15)',color:'#A78BFA'},ADMIN:{label:'Administrador',bg:'rgba(59,130,246,.15)',color:'#60A5FA'},COLABORADOR:{label:'Colaborador',bg:'rgba(156,163,175,.15)',color:'#9CA3AF'},admin_cliente:{label:'Admin Cliente',bg:'rgba(16,185,129,.15)',color:'#34D399'},colaborador:{label:'Colaborador',bg:'rgba(156,163,175,.15)',color:'#9CA3AF'}};

function api(path,opts={}){
  const token=typeof window!=='undefined'?localStorage.getItem('token'):null;
  return fetch('/api/'+path,{headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})}, ...opts})
    .then(r=>{
      if(r.status===401&&typeof window!=='undefined'){window.dispatchEvent(new CustomEvent('session-expired'));return{error:'Sessão expirada'};}
      return r.json();
    });
}
function safeApi(path,opts={}){
  return api(path,opts).catch(()=>null);
}

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#F4F5FB; --surface:#fff; --surface2:#EEF0F6; --surface3:#E8EAF2; --border:rgba(0,0,0,.06);
  --sidebar:#fff; --primary:#6C3BF5; --primary-l:#8B5CF6; --primary-d:#5B21B6; --primary-glow:rgba(108,59,245,.15);
  --success:#059669; --success-bg:#ECFDF5; --success-text:#065F46;
  --danger:#EF4444; --danger-bg:#FEF2F2; --danger-text:#991B1B;
  --warning:#F59E0B; --warning-bg:#FFFBEB; --warning-text:#92400E;
  --info:#3B82F6; --info-bg:#EFF6FF;
  --text:#0F172A; --text2:#475569; --text3:#94A3B8; --text4:#CBD5E1;
  --sh-sm:0 1px 2px rgba(0,0,0,.04),0 1px 1px rgba(0,0,0,.02);
  --sh:0 4px 6px -1px rgba(0,0,0,.05),0 2px 4px -2px rgba(0,0,0,.05);
  --sh-md:0 10px 15px -3px rgba(0,0,0,.08),0 4px 6px -4px rgba(0,0,0,.04);
  --sh-lg:0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.04);
  --sh-primary:0 4px 14px rgba(108,59,245,.25);
  --r:10px; --r-sm:6px; --r-lg:14px; --r-xl:18px;
  --font:'Inter',system-ui,-apple-system,sans-serif; --mono:'JetBrains Mono',monospace;
  --ease:cubic-bezier(.4,0,.2,1); --t:all .18s cubic-bezier(.4,0,.2,1);
  --sw:250px;
  --gpu:translateZ(0);
}
[data-theme="dark"]{
  --bg:#0B0D17; --surface:#151729; --surface2:#1C1F33; --surface3:#242742; --border:rgba(255,255,255,.06);
  --sidebar:#10121E;
  --success-bg:rgba(5,150,105,.12); --success-text:#34D399;
  --danger-bg:rgba(239,68,68,.12); --danger-text:#F87171;
  --warning-bg:rgba(245,158,11,.12); --warning-text:#FBBF24;
  --info-bg:rgba(59,130,246,.12);
  --text:#F1F5F9; --text2:#94A3B8; --text3:#64748B; --text4:#334155;
  --sh-sm:0 1px 2px rgba(0,0,0,.2); --sh:0 4px 6px rgba(0,0,0,.25);
  --sh-md:0 10px 15px rgba(0,0,0,.3); --sh-lg:0 20px 25px rgba(0,0,0,.4);
  --surface2:rgba(255,255,255,.03); --surface3:rgba(255,255,255,.05);
  --primary-glow:rgba(108,59,245,.3);
}
[data-theme="dark"] .field{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.08);color:#F1F5F9}
[data-theme="dark"] .field:focus{background:rgba(255,255,255,.07);border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-glow)}
[data-theme="dark"] .field.auto{background:rgba(255,255,255,.02);color:#475569;border-style:dashed}
[data-theme="dark"] .field option{background:#151729;color:#F1F5F9}
[data-theme="dark"] select.field{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2364748B' viewBox='0 0 24 24'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")}
[data-theme="dark"] .bn-item{color:rgba(255,255,255,.35)}
[data-theme="dark"] .bn-item.active{color:var(--primary)}
[data-theme="dark"] .th{background:rgba(255,255,255,.02);color:#64748B}
[data-theme="dark"] tr:hover .td{background:rgba(255,255,255,.025)}
[data-theme="dark"] .td{border-color:rgba(255,255,255,.04)}
[data-theme="dark"] .card,[data-theme="dark"] .card-lg{border-color:rgba(255,255,255,.06)}
[data-theme="dark"] .tab-bar{background:rgba(255,255,255,.03);border-color:rgba(255,255,255,.06)}
[data-theme="dark"] .tab.active{background:var(--surface);border-color:rgba(255,255,255,.08)}
[data-theme="dark"] .badge.gray{background:rgba(255,255,255,.05);color:#94A3B8}
[data-theme="dark"] .badge.blue{background:rgba(108,59,245,.12);color:#8B5CF6}
[data-theme="dark"] .progress{background:rgba(255,255,255,.06)}
[data-theme="dark"] input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(1)}
[data-theme="dark"] .modal{background:#151729;border-color:rgba(255,255,255,.08)}
[data-theme="dark"] .overlay{background:rgba(0,0,0,.7)}

html,body{height:100%;font-family:var(--font);background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;scroll-behavior:smooth}
::selection{background:rgba(108,59,245,.25);color:var(--primary)}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-thumb{background:var(--text4);border-radius:10px}
::-webkit-scrollbar-track{background:transparent}
input,select,textarea,button{font-family:var(--font)}

@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
@keyframes toastIn{from{opacity:0;transform:translateX(120%) scale(.9)}to{opacity:1;transform:translateX(0) scale(1)}}
@keyframes toastOut{from{opacity:1;transform:translateX(0) scale(1)}to{opacity:0;transform:translateX(120%) scale(.9)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmer{0%{background-position:200% 0}to{background-position:-200% 0}}
@keyframes breathe{0%,100%{box-shadow:0 0 0 0 rgba(108,59,245,.15)}50%{box-shadow:0 0 0 6px rgba(108,59,245,.05)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}

.fu{animation:fadeUp .35s var(--ease) both}
.fu1{animation:fadeUp .35s .05s var(--ease) both}
.fu2{animation:fadeUp .35s .1s var(--ease) both}
.fu3{animation:fadeUp .35s .15s var(--ease) both}
.fu4{animation:fadeUp .35s .2s var(--ease) both}
.si{animation:scaleIn .2s var(--ease) both}
.slide{animation:slideIn .3s var(--ease) both}
.toast-in{animation:toastIn .35s var(--ease) both}

.field{width:100%;border:1.5px solid var(--border);border-radius:var(--r-sm);padding:9px 13px;font-size:13px;background:var(--surface);color:var(--text);transition:var(--t);outline:none}
.field:focus{border-color:var(--primary);box-shadow:0 0 0 3px var(--primary-glow);animation:breathe 2s ease-in-out infinite}
.field.auto{background:var(--surface2);color:var(--text3);border-style:dashed;cursor:default}
.field:disabled,.field[readonly].auto{opacity:.7}
.field::placeholder{color:var(--text3);font-weight:400}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;border-radius:var(--r-sm);border:1.5px solid var(--border);background:var(--surface);color:var(--text2);padding:8px 16px;font-size:13px;font-weight:500;transition:var(--t);white-space:nowrap;text-decoration:none;position:relative;overflow:hidden}
.btn::after{content:'';position:absolute;inset:0;background:currentColor;opacity:0;transition:opacity .15s}
.btn:hover:not(:disabled)::after{opacity:.06}
.btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:var(--sh)}
.btn:active:not(:disabled){transform:translateY(0)}
.btn.primary{background:linear-gradient(135deg,var(--primary),var(--primary-l));color:#fff;border-color:transparent;box-shadow:var(--sh-primary)}
.btn.primary:hover:not(:disabled){box-shadow:0 6px 20px rgba(108,59,245,.35);transform:translateY(-2px)}
.btn.primary:active:not(:disabled){box-shadow:0 2px 10px rgba(108,59,245,.2);transform:translateY(0)}
.btn.danger{background:linear-gradient(135deg,var(--danger),#F87171);color:#fff;border-color:transparent}
.btn.danger:hover:not(:disabled){box-shadow:0 4px 16px rgba(239,68,68,.3);transform:translateY(-1px)}
.btn.success{background:linear-gradient(135deg,var(--success),#34D399);color:#fff;border-color:transparent}
.btn.success:hover:not(:disabled){box-shadow:0 4px 16px rgba(5,150,105,.3);transform:translateY(-1px)}
.btn.ghost{background:transparent;border-color:transparent;color:var(--text3)}
.btn.ghost:hover:not(:disabled){background:var(--surface2);color:var(--text2)}
.btn.amber-btn{background:var(--warning-bg);color:var(--warning-text);border-color:transparent}
.btn:disabled{opacity:.5;cursor:not-allowed;transform:none!important;box-shadow:none!important}
.btn.sm{padding:5px 11px;font-size:12px;border-radius:var(--r-sm)}
.btn.icon{padding:7px;border-radius:var(--r-sm)}
.btn.full{width:100%;justify-content:center}

.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);box-shadow:var(--sh);transition:var(--t)}
.card:hover{box-shadow:var(--sh-md)}
.card-lg{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-xl);box-shadow:var(--sh-md)}

.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;letter-spacing:.15px}
.badge.dot::before{content:'';width:5px;height:5px;border-radius:50%;background:currentColor;display:inline-block}
.badge.green{background:var(--success-bg);color:var(--success-text)}
.badge.red{background:var(--danger-bg);color:var(--danger-text)}
.badge.amber{background:var(--warning-bg);color:var(--warning-text)}
.badge.blue{background:rgba(108,59,245,.08);color:var(--primary)}
.badge.violet{background:rgba(139,92,246,.08);color:#7C3AED}
.badge.gray{background:var(--surface2);color:var(--text3)}

.nav-item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:var(--r-sm);cursor:pointer;font-size:13px;font-weight:500;color:var(--text3);transition:var(--t);position:relative}
.nav-item:hover{background:var(--surface2);color:var(--text2)}
.nav-item.active{background:linear-gradient(135deg,rgba(108,59,245,.08),rgba(139,92,246,.04));color:var(--primary);font-weight:600}
.nav-item.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:20px;background:var(--primary);border-radius:0 4px 4px 0}
.nav-item svg{flex-shrink:0}

.th{text-align:left;font-size:10.5px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;padding:10px 14px;border-bottom:1.5px solid var(--border);background:var(--surface2);position:sticky;top:0;z-index:1}
.td{padding:10px 14px;font-size:13px;border-bottom:1px solid var(--border);vertical-align:middle;transition:background .1s}
tr:last-child .td{border-bottom:none}
tr:hover .td{background:rgba(108,59,245,.025)}

.tab-bar{display:flex;gap:2px;background:var(--surface2);border-radius:var(--r);padding:3px;border:1px solid var(--border);overflow-x:auto}
.tab{padding:7px 14px;border-radius:var(--r-sm);font-size:12.5px;font-weight:500;cursor:pointer;border:none;background:transparent;color:var(--text3);white-space:nowrap;transition:var(--t)}
.tab:hover{color:var(--text)}
.tab.active{background:var(--surface);color:var(--text);box-shadow:0 1px 3px rgba(0,0,0,.06);font-weight:600}

.label{font-size:11px;font-weight:600;color:var(--text2);display:block;margin-bottom:3px;letter-spacing:.15px}
.label .req{color:var(--danger);margin-left:2px}
.err-msg{font-size:11px;color:var(--danger);margin-top:3px}

.fl{position:relative;margin-bottom:2px}
.fl .field{padding-top:16px;padding-bottom:5px;height:42px;transition:var(--t)}
.fl label{position:absolute;left:12px;top:12px;font-size:13px;color:var(--text3);pointer-events:none;transition:var(--t);font-weight:400}
.fl .field:focus~label,.fl .field:not(:placeholder-shown)~label,.fl .field.filled~label{top:5px;font-size:9px;color:var(--primary);font-weight:600}
.fl .field.auto~label{top:5px;font-size:9px;font-weight:600}
[data-theme="dark"] .fl .field:focus{background:rgba(255,255,255,.07)}
[data-theme="dark"] .fl label{color:rgba(255,255,255,.35)}
[data-theme="dark"] .fl .field:focus~label,[data-theme="dark"] .fl .field:not(:placeholder-shown)~label{color:var(--primary)}

.progress{height:6px;background:var(--surface2);border-radius:10px;overflow:hidden}
.progress-fill{height:100%;border-radius:10px;transition:width .6s var(--ease)}

.overlay{position:fixed;top:0;left:0;right:0;bottom:0;height:100vh;background:rgba(15,23,42,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn .15s both;overflow-y:auto}
.modal{background:var(--surface);border-radius:var(--r-xl);width:100%;max-width:500px;box-shadow:0 25px 50px -12px rgba(0,0,0,.25);border:1px solid var(--border);overflow-y:auto;animation:scaleIn .2s var(--ease) both;margin:auto;max-height:calc(100vh - 40px)}
.modal-hd{display:flex;align-items:center;justify-content:space-between;padding:1rem 1.5rem;border-bottom:1px solid var(--border)}
.modal-hd h3{font-size:15px;font-weight:700}
.modal-hd p{font-size:11.5px;margin-top:2px;color:var(--text3)}
.modal-bd{padding:1.25rem 1.5rem;display:flex;flex-direction:column;gap:14px}

.ph-block{border:1.5px solid var(--border);border-radius:var(--r);padding:14px;margin-bottom:10px;background:var(--surface);transition:var(--t)}
.ph-block:hover{border-color:var(--text3);box-shadow:var(--sh)}
.ph-title{font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;display:flex;align-items:center;gap:8px}
.ph-title::before{content:'';width:3px;height:14px;background:linear-gradient(180deg,var(--primary),var(--primary-l));border-radius:4px}

.bottom-nav{position:fixed;bottom:0;left:0;right:0;background:rgba(255,255,255,.8);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:1px solid var(--border);display:flex;z-index:200;padding-bottom:env(safe-area-inset-bottom,0)}
[data-theme="dark"] .bottom-nav{background:rgba(21,23,41,.85)}
.bn-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:7px 4px 6px;gap:2px;cursor:pointer;font-size:10px;font-weight:600;color:var(--text3);letter-spacing:.2px;transition:var(--t);position:relative}
.bn-item.active{color:var(--primary)}
.bn-item.active::after{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:20px;height:2.5px;background:var(--primary);border-radius:0 0 4px 4px}
.bn-item svg{transition:var(--t)}
.bn-item.active svg{transform:scale(1.1)}

.g2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.sec-h{font-size:10.5px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.7px;padding-bottom:6px;border-bottom:1.5px solid var(--border);margin-bottom:12px}
.divider{height:1px;background:var(--border);margin:10px 0}
.chart-row{display:flex;align-items:center;gap:8px;margin-bottom:8px}
.chart-lbl{font-size:12px;color:var(--text2);min-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.chart-track{flex:1;background:rgba(0,0,0,.04);height:8px;border-radius:6px;overflow:hidden}
.chart-bar{height:100%;border-radius:6px;transition:width .6s var(--ease)}
.chart-val{font-size:12px;font-weight:700;color:var(--text);min-width:24px;text-align:right}
@media(max-width:768px){.g2,.g3,.g4{grid-template-columns:1fr!important}.hide-mob{display:none!important}}
@media(max-width:1024px){.hide-tab{display:none!important}}
`;

const emptyForm=()=>({statusColaborador:'CANDIDATO',pedido:'',turma:'',dataRealizacao:'',nomes:'',matricula:'',cpf:'',empresa:'',estado:'',base:'',unidadeOperacional:'',regiao:'',avaliador:'',processo:'',processoPrincipal:'',testeOnline:'',avaliacaoOnline:'',statusProvaOnline:'',notaProva:'',statusProvaTeorica:'',avaliacao1:'',baremo1:'',statusProva1:'',motivo1:'',it1:'',detalhe1:'',avaliacao2:'',baremo2:'',statusProva2:'',motivo2:'',it2:'',detalhe2:'',avaliacao3:'',baremo3:'',statusProva3:'',motivo3:'',it3:'',detalhe3:'',avaliacao4:'',baremo4:'',statusProva4:'',motivo4:'',it4:'',detalhe4:'',avaliacao5:'',baremo5:'',statusProva5:'',motivo5:'',it5:'',detalhe5:'',avaliacao6:'',baremo6:'',statusProva6:'',motivo6:'',it6:'',detalhe6:'',reavaliacao:'',reavaliacaoBaremo:'',statusParcial:'',nivelamentoTeorico:'',nivelamentoPratico:'',reavaliacaoPratica:'',resultadoFinal:'',har:'',localAvaliacao:'',links:'',documentoHar:'',cargosProcessos:'',empresaAvaliadora:'',statusHarVencida:'',emailEmpresa:'',dataInicioAssinatura:'',dataFimAssinatura:'',associadoSindistal:'',docContratual:'',nRenovacao:'',isbn:'',fotoCandidato:''});

function Avatar({name,size=34}){
  const init=(name||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const c=['#6C3BF5','#0891B2','#059669','#D97706','#EF4444','#8B5CF6'][((name||'?').charCodeAt(0)||0)%6];
  return <div style={{width:size,height:size,borderRadius:'50%',background:`linear-gradient(135deg,${c},${c}dd)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.35,fontWeight:700,color:'#fff',flexShrink:0,boxShadow:`0 2px 8px ${c}44`}}>{init}</div>;
}

function Badge({v}){
  if(!v||v==='PENDENTE')return <span className="badge dot gray">{v||'PENDENTE'}</span>;
  if(v==='APROVADO'||v==='APROVADO 2')return <span className="badge dot green">{v}</span>;
  if(v==='REPROVADO')return <span className="badge dot red">{v}</span>;
  if(v==='AUSENTE')return <span className="badge dot amber">{v}</span>;
  return <span className="badge gray">{v}</span>;
}

function Spin({c='#fff'}){return <span style={{width:14,height:14,border:`2px solid ${c}33`,borderTopColor:c,borderRadius:'50%',display:'inline-block',animation:'spin .6s linear infinite'}}/>}

const LABELS={dashboard:'Dashboard','admin-dash':'Meu Painel',records:'Avaliações',form:'Nova Avaliação',cadastros:'Cadastros',reports:'Relatórios',users:'Usuários',clientes:'Clientes',licencas:'Minhas Licenças','gestao-licencas':'Gestão de Licenças'};

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
  reload:<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
};

export default function App(){
  const [user,setUser]=useState(null);
  const [view,setView]=useState('login');
  const [editRec,setEditRec]=useState(null);
  const [toasts,setToasts]=useState([]);
  const [mobile,setMobile]=useState(false);
  const [theme,setTheme]=useState('light');
  const [sidebarOpen,setSidebarOpen]=useState(true);
  useEffect(()=>{const c=()=>setMobile(window.innerWidth<768);c();window.addEventListener('resize',c);return()=>window.removeEventListener('resize',c);},[]);
  useEffect(()=>{
    const saved=localStorage.getItem('theme');
    const prefers=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';
    const t=saved||prefers;
    setTheme(t);document.documentElement.setAttribute('data-theme',t);
  },[]);
  useEffect(()=>{if(user){document.documentElement.setAttribute('data-theme',theme);localStorage.setItem('theme',theme);}},[theme]);
  useEffect(()=>{const u=localStorage.getItem('user'),t=localStorage.getItem('token');if(u&&t){setUser(JSON.parse(u));setView('dashboard');}},[]);
  useEffect(()=>{
    const h=()=>{localStorage.removeItem('user');localStorage.removeItem('token');setUser(null);setView('login');};
    window.addEventListener('session-expired',h);
    return()=>window.removeEventListener('session-expired',h);
  },[]);
  useEffect(()=>{
    if(!user)return;
    const h=e=>{
      if(e.ctrlKey&&e.key==='n'&&cw()){e.preventDefault();setEditRec(null);setView('form');}
      if(e.key==='g'&&e.ctrlKey)return;
      if(!e.ctrlKey&&!e.metaKey)return;
      const k=e.key.toLowerCase();
      const map={'d':'dashboard','a':'records','c':'cadastros','r':'reports','u':'users','l':'clientes'};
      if(map[k]){e.preventDefault();setView(map[k]);}
    };
    window.addEventListener('keydown',h);
    return()=>window.removeEventListener('keydown',h);
  },[user]);
  useEffect(()=>{
    const h=e=>{
      if(e.key==='Escape'){
        const overlays=document.querySelectorAll('.overlay');
        if(overlays.length)overlays[overlays.length-1].click();
      }
    };
    window.addEventListener('keydown',h);
    return()=>window.removeEventListener('keydown',h);
  },[]);
  const toggleTheme=()=>setTheme(p=>p==='light'?'dark':'light');
  const [navBadges,setNavBadges]=useState({});
  useEffect(()=>{
    if(!user||user.role!=='SYSTEM')return;
    const t=setInterval(()=>{api('licencas').then(r=>{if(Array.isArray(r))setNavBadges({clientes:r.filter(x=>x.status==='PENDENTE').length});}).catch(()=>{});},30000);
    api('licencas').then(r=>{if(Array.isArray(r))setNavBadges({clientes:r.filter(x=>x.status==='PENDENTE').length});}).catch(()=>{});
    return()=>clearInterval(t);
  },[user]);
  const toast_=(msg,type='success')=>{const id=Date.now();setToasts(p=>[...p,{id,msg,type}]);setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),4000);};
  const logout=()=>{
    localStorage.clear();sessionStorage.clear();
    if('caches' in window)caches.keys().then(n=>n.forEach(k=>caches.delete(k)));
    setUser(null);setView('login');
  };
  const cw=()=>user&&(user.role==='SYSTEM'||user.role==='ADMIN'||user.tipo==='admin_cliente'||(user.role==='COLABORADOR'&&user.permissions==='Leitura + Escrita'));
  const canDel=()=>user&&(user.role==='SYSTEM'||user.role==='ADMIN');
  const ia=()=>user&&(user.role==='SYSTEM'||user.role==='ADMIN'||user.tipo==='admin_cliente');
  const nav=user?(
    user.role==='SYSTEM'?[
      {k:'dashboard',i:'home',l:'Dashboard Comercial'},
      {k:'users',i:'users',l:'Usuários'},
      {k:'clientes',i:'shield',l:'Clientes'},
      {k:'gestao-licencas',i:'shield',l:'Gestão de Licenças'},
      {k:'audit',i:'list',l:'Auditoria'},
    ]:user.tipo==='admin_cliente'?[
      {k:'admin-dash',i:'chart',l:'Meu Painel'},
      {k:'records',i:'list',l:'Avaliações'},
      {k:'cadastros',i:'list',l:'Cadastros'},
      {k:'reports',i:'chart',l:'Relatórios'},
      {k:'users',i:'users',l:'Usuários'},
      {k:'licencas',i:'shield',l:'Licenças'},
    ]:[
      {k:'dashboard',i:'home',l:'Dashboard'},
      {k:'records',i:'list',l:'Avaliações'},
      {k:'cadastros',i:'list',l:'Cadastros'},
      {k:'reports',i:'chart',l:'Relatórios'},
    ]
  ):[];
  if(!user)return(<><style>{CSS}</style><Login onLogin={(u,t)=>{setUser(u);localStorage.setItem('user',JSON.stringify(u));localStorage.setItem('token',t);setView('dashboard');}}/></>);
  return(<>
    <style>{CSS}</style>
    {toasts.map(t=><div key={t.id} className="toast-in" style={{position:'fixed',top:20+toasts.indexOf(t)*56,right:20,zIndex:9999,background:t.type==='error'?'var(--danger-bg)':'var(--success-bg)',color:t.type==='error'?'var(--danger-text)':'var(--success-text)',border:`1px solid ${t.type==='error'?'#FECACA':'#A7F3D0'}`,padding:'11px 18px',borderRadius:12,fontSize:13.5,fontWeight:500,maxWidth:340,boxShadow:'0 8px 24px rgba(0,0,0,.12)',display:'flex',alignItems:'center',gap:8}}>
      {t.type==='error'?ICON.x:ICON.check}{t.msg}</div>)}
    <div style={{display:'flex',minHeight:'100vh'}}>
      {!mobile&&<nav style={{width:sidebarOpen?'var(--sw)':0,background:'var(--sidebar)',position:'fixed',top:0,bottom:0,left:0,zIndex:100,display:'flex',flexDirection:'column',overflow:'hidden',transition:'width .25s cubic-bezier(.4,0,.2,1)',borderRight:sidebarOpen?'1px solid var(--border)':'none'}}>
        <div style={{padding:'1.5rem 1.25rem 1rem',borderBottom:'1px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:38,height:38,background:'linear-gradient(135deg,#5930E2,#7C5CFF)',borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 14px rgba(89,48,226,.45)'}}>
              {ICON.bolt}
            </div>
            <div>
              <p style={{fontSize:14,fontWeight:700,color:'var(--text)',lineHeight:1.2}}>Lançamentos</p>
              <p style={{fontSize:11,color:'var(--text3)',fontWeight:400}}>Notas · CEO 2026</p>
            </div>
          </div>
        </div>
        <div style={{padding:'1rem .75rem',flex:1,display:'flex',flexDirection:'column',gap:3}}>
          <p style={{fontSize:10,fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.8px',padding:'0 10px',marginBottom:6}}>Menu</p>
          {nav.map(x=>{
            const atalhos={dashboard:'Ctrl+D',records:'Ctrl+A',form:'Ctrl+N',cadastros:'Ctrl+C',reports:'Ctrl+R'};
            return <div key={x.k} className={`nav-item${view===x.k?' active':''}`} onClick={()=>setView(x.k)} style={{position:'relative'}} title={atalhos[x.k]?`${x.l} (${atalhos[x.k]})`:x.l}>
            {ICON[x.i]}<span>{x.l}</span>
            {atalhos[x.k]&&<span style={{marginLeft:'auto',fontSize:9,color:'var(--text3)',opacity:.4,fontFamily:'var(--mono)'}}>{atalhos[x.k]}</span>}
            {navBadges[x.k]?<span className="badge dot red" style={{marginLeft:4,fontSize:10,padding:'1px 6px'}}>{navBadges[x.k]}</span>:null}
          </div>;})}
        </div>
          <div style={{padding:'1rem',borderTop:'1px solid var(--border)'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:10,background:'var(--surface2)'}}>
              <Avatar name={user.nome} size={32}/>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:13,fontWeight:600,color:'var(--text)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.nome}</p>
                <p style={{fontSize:11,color:'var(--text3)'}}>{ROLES[user.role]?.label}</p>
              </div>
              <button className="btn ghost icon" style={{color:'var(--text3)',padding:5,borderRadius:8}} onClick={toggleTheme} title={theme==='light'?'Modo escuro':'Modo claro'}>{theme==='light'?<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>:<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>}</button>
              <button className="btn ghost icon" style={{color:'var(--text3)',padding:5,borderRadius:8}} onClick={logout} title="Sair">{ICON.logout}</button>
            </div>
          </div>
      </nav>}
      <main style={{flex:1,marginLeft:mobile||!sidebarOpen?0:'var(--sw)',padding:mobile?'1.25rem 1rem 90px':'5rem 2.5rem 2.5rem',minHeight:'100vh'}}>
        {!mobile&&user&&<div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20,fontSize:12.5,color:'var(--text3)'}}>
          <span style={{cursor:'pointer',transition:'var(--t)',padding:'4px 6px',borderRadius:6}} onClick={()=>setSidebarOpen(!sidebarOpen)} title="Toggle sidebar">{ICON.list}</span>
          <span style={{color:'var(--text3)',opacity:.4}}>/</span>
          {['dashboard','admin-dash','records','cadastros','reports','users','clientes','licencas'].includes(view)?<span style={{fontWeight:500,color:'var(--text2)'}}>{LABELS[view]||view}</span>:<><span style={{cursor:'pointer',color:'var(--primary)'}} onClick={()=>setView('records')}>{LABELS.records}</span><span style={{color:'var(--text3)',opacity:.4}}>/</span><span style={{fontWeight:500,color:'var(--text2)'}}>{view==='form'?(editRec?'Editar':'Nova')+' Avaliação':view}</span></>}
        </div>}
        {mobile&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:9}}>
            <div style={{width:32,height:32,background:'linear-gradient(135deg,#5930E2,#7C3AED)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center'}}>{ICON.bolt}</div>
            <div><p style={{fontSize:14,fontWeight:700}}>Lançamentos Notas</p><p style={{fontSize:11,color:'var(--text3)'}}>CEO Cabo Frio 2026</p></div>
          </div>
          <Avatar name={user.nome} size={34}/>
        </div>}
        <div key={view} className="si" style={{animation:'scaleIn .2s cubic-bezier(.4,0,.2,1) both'}}>
        {view==='dashboard'&&<Dash mobile={mobile} user={user}/>}
        {view==='admin-dash'&&<AdminDash mobile={mobile} user={user} toast_={toast_}/>}
        {view==='records'&&<RecList cw={cw()} ia={ia()} mobile={mobile} user={user} onEdit={r=>{setEditRec(r);setView('form');}} onNew={()=>{setEditRec(null);setView('form');}} toast_={toast_}/>}
        {view==='form'&&<RecForm rec={editRec} user={user} cw={cw()} mobile={mobile} onSave={()=>{toast_('Avaliação salva com sucesso!');setView('records');}} onCancel={()=>setView('records')} toast_={toast_}/>}
        {view==='cadastros'&&<Cadastros mobile={mobile} toast_={toast_} cw={cw()} canDel={canDel()}/>}
        {view==='reports'&&<Reports mobile={mobile}/>}
        {view==='users'&&ia()&&<Users user={user} toast_={toast_}/>}
        {view==='clientes'&&user.role==='SYSTEM'&&<Clientes user={user} toast_={toast_}/>}
        {view==='licencas'&&user.tipo==='admin_cliente'&&<Licencas user={user} toast_={toast_}/>}
        {view==='audit'&&ia()&&<AuditLog toast_={toast_}/>}
        {view==='gestao-licencas'&&user.role==='SYSTEM'&&<GestaoLicencas user={user} mobile={mobile} toast_={toast_}/>}
        </div>
      </main>
      {mobile&&<nav className="bottom-nav">{nav.slice(0,5).map(x=><div key={x.k} className={`bn-item${view===x.k?' active':''}`} onClick={()=>setView(x.k)} style={{position:'relative'}}>
        {ICON[x.i]}
        {navBadges[x.k]?<span className="badge dot red" style={{position:'absolute',top:2,right:'50%',marginRight:-18,fontSize:9,padding:'1px 4px',minWidth:16,textAlign:'center'}}>{navBadges[x.k]}</span>:null}
        <span>{x.l}</span>
      </div>)}</nav>}
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
  return(<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',padding:16,position:'relative',overflow:'hidden'}}>
    <div style={{position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none'}}>
      <div style={{position:'absolute',top:'-20%',right:'-5%',width:600,height:600,background:'radial-gradient(circle,rgba(89,48,226,.08) 0%,transparent 70%)',borderRadius:'50%'}}/>
      <div style={{position:'absolute',bottom:'-20%',left:'-5%',width:500,height:500,background:'radial-gradient(circle,rgba(124,58,237,.06) 0%,transparent 70%)',borderRadius:'50%'}}/>
    </div>
    <div className="fu" style={{width:'100%',maxWidth:420,position:'relative',zIndex:1}}>
      <div style={{textAlign:'center',marginBottom:'2rem'}}>
        <div style={{width:72,height:72,background:'linear-gradient(135deg,#5930E2,#7C5CFF)',borderRadius:24,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',boxShadow:'0 12px 40px rgba(89,48,226,.35)'}}>
          <svg width="28" height="28" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <h1 style={{fontSize:28,fontWeight:700,color:'var(--text)',marginBottom:4}}>Lançamentos Notas</h1>
        <p style={{fontSize:14,color:'var(--text3)',fontWeight:400}}>CEO Cabo Frio · Sistema de Avaliações 2026</p>
      </div>
      <div className="card-lg" style={{padding:'2rem'}}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="fl">
            <input className="field" id="login-user" value={u} onChange={e=>setU(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go()} placeholder=" "/>
            <label htmlFor="login-user" style={{color:'var(--text3)'}}>Usuário</label>
          </div>
          <div className="fl">
            <input className="field" id="login-pass" type="password" value={p} onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==='Enter'&&go()} placeholder=" "/>
            <label htmlFor="login-pass" style={{color:'var(--text3)'}}>Senha</label>
          </div>
          {err&&<div style={{background:'var(--danger-bg)',border:'1px solid rgba(229,57,53,.3)',borderRadius:10,padding:'10px 14px',fontSize:13,color:'var(--danger-text)',display:'flex',gap:8,alignItems:'center'}}>{ICON.x}{err}</div>}
          <button className="btn primary" style={{width:'100%',justifyContent:'center',padding:'12px 0',fontSize:15,marginTop:4}} onClick={go} disabled={loading}>
            {loading?<><Spin/>Entrando...</>:<>{ICON.shield}Entrar no Sistema</>}
          </button>
        </div>
      </div>
      <p style={{textAlign:'center',fontSize:12,color:'var(--text3)',marginTop:16,opacity:.5}}>system · system@2026</p>
    </div>
  </div>);
}

function Skeleton({h=14,w='100%',r=6,m='0 0 10px 0'}){return <div style={{height:h,width:w,borderRadius:r,background:'linear-gradient(90deg,var(--surface2) 25%,var(--surface3) 50%,var(--surface2) 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.5s infinite',margin:m}}/>}
function EmptyState({icon,title,desc}){return <div style={{textAlign:'center',padding:'3rem 1rem',color:'var(--text3)'}}><div style={{fontSize:40,marginBottom:12,opacity:.3}}>{icon||ICON.list}</div><p style={{fontSize:15,fontWeight:600,color:'var(--text2)',marginBottom:4}}>{title||'Nenhum dado'}</p><p style={{fontSize:13}}>{desc||'Nenhum registro encontrado'}</p></div>}
function ErrorState({onRetry,msg}){return <div style={{textAlign:'center',padding:'3rem 1rem',color:'var(--text3)'}}>
  <div style={{fontSize:40,marginBottom:12,opacity:.3}}><svg width="40" height="40" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 8v4M12 16h.01"/></svg></div>
  <p style={{fontSize:15,fontWeight:600,color:'var(--danger-text)',marginBottom:4}}>Erro ao carregar</p>
  <p style={{fontSize:13,marginBottom:12}}>{msg||'Não foi possível carregar os dados. Verifique sua conexão.'}</p>
  {onRetry&&<button className="btn primary sm" onClick={onRetry}>{ICON.reload||'↻'} Tentar novamente</button>}
</div>}

function Dash({mobile,user}){
  const [data,setData]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState(null);
  const [clientes,setClientes]=useState([]);const [licRequests,setLicRequests]=useState([]);
  const load=()=>{
    setLoading(true);setError(null);
    if(user?.role==='SYSTEM'){
      Promise.all([api('records'),api('clientes'),api('licencas')]).then(([r,c,l])=>{
        if(Array.isArray(r))setData(r);
        if(Array.isArray(c))setClientes(c);
        if(Array.isArray(l))setLicRequests(l.filter(x=>x.status==='PENDENTE'));
        setLoading(false);
      }).catch(()=>{setError('Erro de conexão');setLoading(false);});
    }else{
      api('records').then(r=>{if(Array.isArray(r))setData(r);else setError('Erro ao carregar');setLoading(false);}).catch(()=>{setError('Erro de conexão');setLoading(false);});
    }
  };
  useEffect(()=>{load();},[]);
  const total=data.length,aprov=data.filter(r=>r.resultadoFinal==='APROVADO'||r.resultadoFinal==='APROVADO 2').length,reprov=data.filter(r=>r.resultadoFinal==='REPROVADO').length,pend=total-aprov-reprov,tx=total?Math.round(aprov/total*100):0;
  const byBase={};data.forEach(r=>{if(r.base)byBase[r.base]=(byBase[r.base]||0)+1;});
  const topB=Object.entries(byBase).sort((a,b)=>b[1]-a[1]).slice(0,6),maxB=topB[0]?.[1]||1;
  const rec=[...data].reverse().slice(0,5);
  const stats=[{n:total,l:'Total',c:'#5930E2',bg:'linear-gradient(135deg,#5930E2,#7C5CFF)',sh:'rgba(89,48,226,.3)'},{n:aprov,l:'Aprovados',c:'#059669',bg:'linear-gradient(135deg,#059669,#2EAA5C)',sh:'rgba(5,150,105,.3)'},{n:reprov,l:'Reprovados',c:'#DC2626',bg:'linear-gradient(135deg,#DC2626,#EF4444)',sh:'rgba(220,38,38,.3)'},{n:pend,l:'Pendentes',c:'#D97706',bg:'linear-gradient(135deg,#D97706,#F59E0B)',sh:'rgba(217,119,6,.3)'}];
  if(error)return <div><div className="fu" style={{marginBottom:24}}><h1 style={{fontSize:24,fontWeight:700}}>Dashboard</h1></div><div className="fu1"><ErrorState msg={error} onRetry={load}/></div></div>;

  // SYSTEM Dashboard Comercial
  if(user?.role==='SYSTEM'){
    const receitaTotal=clientes.reduce((s,c)=>s+((c.slotsTotal||0)*(c.valorSlot||0)),0);
    const slotsTotal=clientes.reduce((s,c)=>s+(c.slotsTotal||0),0);
    const slotsUsados=clientes.reduce((s,c)=>s+(c.slotsUsados||0),0);
    const slotsDisponiveis=slotsTotal-slotsUsados;
    const receitaMedia=clientes.length?receitaTotal/clientes.length:0;
    const clientesAtivos=clientes.filter(c=>c.status==='ATIVO').length;
    const totalAvaliacoes=data.length;
    return(<div>
      <div className="fu" style={{marginBottom:24}}><h1 style={{fontSize:24,fontWeight:700}}>Dashboard Comercial</h1><p style={{fontSize:14,color:'var(--text3)',marginTop:3}}>Visão financeira · {clientes.length} clientes · {slotsTotal} slots contratados</p></div>
      {loading?<div className="fu1" style={{display:'grid',gridTemplateColumns:mobile?'1fr 1fr 1fr':'repeat(6,1fr)',gap:13,marginBottom:20}}>
        {[1,2,3,4,5,6].map(i=><div key={i} style={{background:'var(--surface)',borderRadius:'var(--r)',padding:'1.25rem',border:'1px solid var(--border)'}}><Skeleton h={36} w="60px" m="0 0 8px 0"/><Skeleton h={14} w="80px" m="0"/></div>)}
      </div>:<div className="fu1" style={{display:'grid',gridTemplateColumns:mobile?'1fr 1fr 1fr':'repeat(3,1fr)',gap:13,marginBottom:20}}>
        <div style={{background:'linear-gradient(135deg,#6C3BF5,#8B5CF6)',borderRadius:'var(--r)',padding:'1.25rem',boxShadow:'0 6px 20px rgba(108,59,245,.3)',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',right:-10,top:-10,width:66,height:66,background:'rgba(255,255,255,.08)',borderRadius:'50%'}}/>
          <div style={{fontSize:20,fontWeight:800,color:'#fff'}}>{clientes.length}</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.7)',marginTop:3,fontWeight:500}}>Clientes · {clientesAtivos} ativos</div>
          <div style={{marginTop:6,display:'flex',gap:8}}>
            <span className="badge" style={{background:'rgba(255,255,255,.15)',color:'#fff',fontSize:10}}>{totalAvaliacoes} avaliações</span>
          </div>
        </div>
        <div style={{background:'linear-gradient(135deg,#059669,#34D399)',borderRadius:'var(--r)',padding:'1.25rem',boxShadow:'0 6px 20px rgba(5,150,105,.3)',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',right:-10,top:-10,width:66,height:66,background:'rgba(255,255,255,.08)',borderRadius:'50%'}}/>
          <div style={{fontSize:20,fontWeight:800,color:'#fff'}}>R$ {receitaTotal.toFixed(2)}</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.7)',marginTop:3,fontWeight:500}}>Receita Total</div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.5)',marginTop:2}}>Média R$ {receitaMedia.toFixed(2)}/cliente</div>
        </div>
        <div style={{background:'linear-gradient(135deg,#7C3AED,#A78BFA)',borderRadius:'var(--r)',padding:'1.25rem',boxShadow:'0 6px 20px rgba(124,58,237,.3)',position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',right:-10,top:-10,width:66,height:66,background:'rgba(255,255,255,.08)',borderRadius:'50%'}}/>
          <div style={{fontSize:20,fontWeight:800,color:'#fff'}}>{slotsUsados}<span style={{fontSize:14}}>/{slotsTotal}</span></div>
          <div style={{fontSize:11,color:'rgba(255,255,255,.7)',marginTop:3,fontWeight:500}}>Slots · {slotsDisponiveis} disponíveis</div>
          <div className="progress" style={{marginTop:6,height:4,background:'rgba(255,255,255,.15)'}}>
            <div className="progress-fill" style={{width:slotsTotal?Math.round(slotsUsados/slotsTotal*100)+'%':'0%',background:'rgba(255,255,255,.5)'}}/>
          </div>
        </div>
      </div>}
      {licRequests.length>0&&<div className="card fu2" style={{padding:0,overflow:'hidden',marginBottom:20,cursor:'pointer'}} onClick={()=>setView('gestao-licencas')}>
        <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <p className="sec-h" style={{marginBottom:0}}>Solicitações de Licenças</p>
          <span className="badge amber">{licRequests.length} pendentes</span>
        </div>
        {licRequests.slice(0,5).map(r=><div key={r.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 1.25rem',borderBottom:'1px solid var(--border)'}}>
          <div><p style={{fontSize:14,fontWeight:600}}>{r.clienteNome||'—'}</p><p style={{fontSize:12,color:'var(--text3)'}}>+{r.quantidade} licenças · {r.motivo||'—'} · {new Date(r.createdAt).toLocaleDateString('pt-BR')}</p></div>
          <span className="badge dot amber">PENDENTE</span>
        </div>)}
      </div>}
      <div className="fu3" style={{display:'grid',gridTemplateColumns:mobile?'1fr':'1fr 1fr',gap:16}}>
        <div className="card" style={{padding:'1.25rem'}}>
          <p className="sec-h">Clientes por Receita</p>
          {clientes.sort((a,b)=>((b.slotsTotal||0)*(b.valorSlot||0))-((a.slotsTotal||0)*(a.valorSlot||0))).slice(0,6).map((c,i)=>{
            const maxR=Math.max(...clientes.map(x=>(x.slotsTotal||0)*(x.valorSlot||0)),1);
            return <div key={c.id} className="chart-row">
              <span className="chart-lbl" style={{minWidth:100}}>{c.nome?.length>18?c.nome.slice(0,18)+'…':c.nome}</span>
              <div className="chart-track"><div className="chart-bar" style={{width:Math.round(((c.slotsTotal||0)*(c.valorSlot||0))/maxR*100)+'%',background:'linear-gradient(90deg,#5930E2,#9B7FFF)'}}/></div>
              <span className="chart-val">R$ {((c.slotsTotal||0)*(c.valorSlot||0)).toFixed(0)}</span>
            </div>;
          })}
          {!clientes.length&&<p style={{fontSize:13,color:'var(--text3)'}}>Nenhum cliente cadastrado.</p>}
        </div>
        <div className="card" style={{padding:'1.25rem'}}>
          <p className="sec-h">Últimas Avaliações</p>
          {rec.map((r,i)=><div key={r.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:i<rec.length-1?'1px solid var(--border)':'none'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <Avatar name={r.nomes} size={28}/>
              <div><p style={{fontSize:13,fontWeight:600}}>{r.nomes||'—'}</p><p style={{fontSize:11,color:'var(--text3)'}}>{r.empresa||'—'}</p></div>
            </div>
            <Badge v={r.resultadoFinal}/>
          </div>)}
          {!rec.length&&<p style={{fontSize:13,color:'var(--text3)',textAlign:'center',padding:'1rem'}}>Nenhuma avaliação.</p>}
        </div>
      </div>
    </div>);
  }

  // Dashboard padrão (admin_cliente, colaborador)
  return(<div>
    <div className="fu" style={{marginBottom:24}}><h1 style={{fontSize:24,fontWeight:700}}>Dashboard</h1><p style={{fontSize:14,color:'var(--text3)',marginTop:3}}>Visão geral das avaliações</p></div>
    {loading?<div className="fu1" style={{display:'grid',gridTemplateColumns:mobile?'1fr 1fr':'repeat(4,1fr)',gap:13,marginBottom:20}}>
      {[1,2,3,4].map(i=><div key={i} style={{background:'var(--surface)',borderRadius:'var(--r)',padding:'1.25rem',border:'1px solid var(--border)'}}><Skeleton h={36} w="60px" m="0 0 8px 0"/><Skeleton h={14} w="80px" m="0"/></div>)}
    </div>:<div className="fu1" style={{display:'grid',gridTemplateColumns:mobile?'1fr 1fr':'repeat(4,1fr)',gap:13,marginBottom:20}}>
      {stats.map((s,i)=><div key={i} style={{background:s.bg,borderRadius:'var(--r)',padding:'1.25rem',boxShadow:`0 6px 20px ${s.sh}`,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:-10,top:-10,width:66,height:66,background:'rgba(255,255,255,.1)',borderRadius:'50%'}}/>
        <div style={{fontSize:32,fontWeight:800,color:'#fff',lineHeight:1}}>{s.n}</div>
        <div style={{fontSize:12.5,color:'rgba(255,255,255,.75)',marginTop:5,fontWeight:500}}>{s.l}</div>
      </div>)}
    </div>}
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
          <div className="chart-track"><div className="chart-bar" style={{width:Math.round(n/maxB*100)+'%',background:'linear-gradient(90deg,#5930E2,#9B7FFF)'}}/></div>
          <span className="chart-val">{n}</span>
        </div>)}
        {!topB.length&&<p style={{fontSize:13,color:'var(--text3)'}}>{loading?'Carregando...':'Importe os registros históricos.'}</p>}
      </div>
    </div>
    <div className="card fu3">
      <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid var(--border)'}}><p className="sec-h" style={{marginBottom:0}}>Últimas Avaliações</p></div>
      {loading?[1,2,3].map(i=><div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 1.25rem',borderBottom:i<3?'1px solid var(--border)':'none'}}>
        <Skeleton h={34} w="34px" r="50%" m="0"/><div style={{flex:1}}><Skeleton h={14} w="140px" m="0 0 6px 0"/><Skeleton h={12} w="200px" m="0"/></div>
      </div>):rec.map((r,i)=><div key={r.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 1.25rem',borderBottom:i<rec.length-1?'1px solid var(--border)':'none'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <Avatar name={r.nomes} size={34}/>
          <div><p style={{fontSize:14,fontWeight:600}}>{r.nomes||'—'}</p><p style={{fontSize:12,color:'var(--text3)'}}>{r.empresa||'—'} · {r.dataRealizacao||''}</p></div>
        </div>
        <Badge v={r.resultadoFinal}/>
      </div>)}
      {!loading&&!rec.length&&<EmptyState title="Nenhum registro" desc="Nenhuma avaliação cadastrada ainda."/>}
    </div>
  </div>);
}

function ConfirmModal({show,title,msg,onConfirm,onCancel}){
  if(!show)return null;
  return <div className="overlay" onClick={onCancel}>
    <div className="modal" style={{maxWidth:400}} onClick={e=>e.stopPropagation()}>
      <div className="modal-hd"><h3 style={{fontSize:16,fontWeight:700}}>{title||'Confirmação'}</h3><button className="btn ghost icon" onClick={onCancel}>{ICON.x}</button></div>
      <div className="modal-bd"><p style={{fontSize:14,color:'var(--text2)',lineHeight:1.5}}>{msg||'Tem certeza?'}</p>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:8}}>
        <button className="btn" onClick={onCancel}>Cancelar</button>
        <button className="btn danger" onClick={onConfirm}>{ICON.trash}Excluir</button>
      </div></div>
    </div>
  </div>;
}

function RecList({cw,ia,mobile,onEdit,onNew,toast_,user}){
  const [data,setData]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState(null);
  const [q,setQ]=useState('');const [base,setBase]=useState('');const [res,setRes]=useState('');const [page,setPage]=useState(0);
  const [confirmDel,setConfirmDel]=useState(null);
  const   [sortKey,setSortKey]=useState(null);const [sortDir,setSortDir]=useState('asc');
  const [selected,setSelected]=useState(new Set());
  const [basesOpts,setBasesOpts]=useState(BASES);
  useEffect(()=>{api('cadastros?tipo=bases').then(r=>{if(Array.isArray(r)&&r.length)setBasesOpts(r.map(p=>p.base));}).catch(()=>{});api('cadastros?tipo=empresas').then(r=>{if(Array.isArray(r)&&r.length)setEmpresasFiltro(r.map(p=>p.nome));}).catch(()=>{});},[]);
  const [empresasFiltro,setEmpresasFiltro]=useState(EMPRESAS_NOMES);
  const PER=20;const fileRef=useRef(null);const searchTimer=useRef(null);
  const load=useCallback(()=>{setLoading(true);setError(null);api('records?'+new URLSearchParams({q,base,resultado:res})).then(r=>{if(Array.isArray(r))setData(r);else setError('Erro ao carregar');setLoading(false);}).catch(()=>{setError('Erro de conexão');setLoading(false);});},[q,base,res]);
  const imp=async f=>{
    try{
      const txt=await f.text();
      const arr=JSON.parse(txt);
      if(!Array.isArray(arr))return toast_('Arquivo deve conter uma lista','error');
      const r=await api('records',{method:'POST',body:JSON.stringify(arr)});
      if(r.error)return toast_(r.error,'error');
      toast_(`${r.imported||arr.length} registros importados!`);
      load();
    }catch(e){toast_('Erro ao importar: '+e,'error');}
  };
  const setQDebounced=v=>{
    setQ(v);setPage(0);
    if(searchTimer.current)clearTimeout(searchTimer.current);
    searchTimer.current=setTimeout(()=>{
      setLoading(true);setError(null);
      api('records?'+new URLSearchParams({q:v,base,resultado:res})).then(r=>{if(Array.isArray(r))setData(r);setLoading(false);}).catch(()=>setLoading(false));
    },300);
  };
  const toggleSort=k=>{if(sortKey===k){setSortDir(d=>d==='asc'?'desc':'asc');}else{setSortKey(k);setSortDir('asc');}};
  const sorted=[...data].sort((a,b)=>{
    if(!sortKey)return 0;
    const va=(a[sortKey]||'').toString().toLowerCase(),vb=(b[sortKey]||'').toString().toLowerCase();
    return sortDir==='asc'?va.localeCompare(vb):vb.localeCompare(va);
  });
  const pages=Math.ceil(sorted.length/PER),paged=sorted.slice(page*PER,(page+1)*PER);
  const SortIcon=({k})=><span style={{fontSize:10,marginLeft:4,opacity:sortKey===k?1:.2}}>{sortKey===k?(sortDir==='asc'?'▲':'▼'):'▼'}</span>;
  if(error)return <div className="fu"><ErrorState msg={error} onRetry={load}/></div>;
  if(mobile)return(<div
    onTouchStart={e=>{const start=e.touches[0].clientY;const handler=e2=>{const diff=e2.changedTouches[0].clientY-start;if(diff>100){load();document.removeEventListener('touchend',handler);}};document.addEventListener('touchend',handler,{once:true});}}
  >
    <div className="fu" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
      <div><h1 style={{fontSize:20,fontWeight:700}}>Avaliações</h1><p style={{fontSize:13,color:'var(--text3)'}}>{data.length} registros</p></div>
      {cw&&<button className="btn primary sm" onClick={onNew}>{ICON.plus}Nova</button>}
    </div>
    <div style={{position:'relative',marginBottom:14}}>
      <div style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)',pointerEvents:'none'}}>{ICON.search}</div>
      <input className="field" style={{paddingLeft:36}} placeholder="Buscar nome, empresa, CPF..." value={q} onChange={e=>setQDebounced(e.target.value)}/>
    </div>
    {loading?[1,2,3].map(i=><div key={i} className="card fu" style={{padding:14,marginBottom:10}}>
      <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:8}}><Skeleton h={40} w="40px" r="50%" m="0"/><div style={{flex:1}}><Skeleton h={14} w="140px" m="0 0 6px 0"/><Skeleton h={12} w="100px" m="0"/></div></div>
      <Skeleton h={12} w="80px" m="0"/>
    </div>):paged.map(r=><div key={r.id} className="card fu" style={{padding:14,marginBottom:10,cursor:'pointer'}} onClick={()=>cw&&onEdit(r)}>
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
    {!loading&&!paged.length&&<EmptyState title="Nenhum registro" desc="Nenhuma avaliação encontrada com esses filtros."/>}
    {pages>1&&<div style={{display:'flex',justifyContent:'center',gap:8,marginTop:16,alignItems:'center'}}>
      <button className="btn sm" disabled={page===0} onClick={()=>setPage(p=>p-1)}>‹ Ant</button>
      <span style={{fontSize:13,color:'var(--text3)'}}>{page+1}/{pages}</span>
      <button className="btn sm" disabled={page>=pages-1} onClick={()=>setPage(p=>p+1)}>Prox ›</button>
    </div>}
  </div>);
  // Desktop view
  const bulkDel=async()=>{
    if(!selected.size)return;
    if(!confirm(`Excluir ${selected.size} registro(s)?`))return;
    for(const id of selected){await api('records/'+id,{method:'DELETE'});}
    toast_(`${selected.size} registro(s) excluído(s)`);
    setSelected(new Set());load();
  };
  return(<div>
    <div className="fu" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,flexWrap:'wrap',gap:12}}>
      <div><h1 style={{fontSize:24,fontWeight:700}}>Avaliações</h1><p style={{fontSize:14,color:'var(--text3)',marginTop:4}}>{sorted.length} registros</p></div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <button className="btn" onClick={()=>window.location.href='/api/export?'+new URLSearchParams({q,base,resultado:res}).toString()}>{ICON.down}CSV</button>
        <button className="btn success" onClick={()=>window.location.href='/api/export-excel?'+new URLSearchParams({q,base,resultado:res}).toString()}>{ICON.down}Excel</button>
        {selected.size>0&&<button className="btn danger" onClick={bulkDel}>{ICON.trash}Excluir {selected.size}</button>}
        {cw&&<><input ref={fileRef} type="file" accept=".json" style={{display:'none'}} onChange={e=>{if(e.target.files[0])imp(e.target.files[0]);e.target.value='';}}/>
        <button className="btn amber-btn" onClick={()=>fileRef.current.click()}>{ICON.up}Importar JSON</button></>}
        {ia&&<button className="btn ghost" onClick={()=>{
          const s={nomes:'Nome Completo',cpf:'00000000000',matricula:'123',pedido:'1ª AVALIAÇÃO',empresa:EMPRESAS_NOMES[0],base:BASES[0],processo:PROCESSOS[0],dataRealizacao:new Date().toISOString().slice(0,10),turma:'T01-2026',avaliador:AVALIADORES[0],localAvaliacao:'Cabo Frio'};
          const blob=new Blob([JSON.stringify([s],null,2)],{type:'application/json'});
          const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='template_avaliacao.json';a.click();URL.revokeObjectURL(a.href);
        }}>{ICON.down}Template</button>}
        {cw&&<button className="btn primary" onClick={onNew}>{ICON.plus}Nova Avaliação</button>}
      </div>
    </div>
    <div className="card fu1" style={{padding:'1rem 1.25rem',marginBottom:16,display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
      <div style={{position:'relative',flex:2,minWidth:200}}>
        <div style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)',pointerEvents:'none'}}>{ICON.search}</div>
        <input className="field" style={{paddingLeft:36}} placeholder="Buscar nome, empresa, CPF, turma..." value={q} onChange={e=>setQDebounced(e.target.value)} list="rec-suggest"/>
        <datalist id="rec-suggest">{data.slice(0,20).flatMap(r=>[r.nomes,r.empresa].filter(Boolean)).filter((v,i,a)=>a.indexOf(v)===i).map(s=><option key={s} value={s}/>)}</datalist>
      </div>
      <select className="field" style={{flex:1,minWidth:140}} value={base} onChange={e=>{setBase(e.target.value);setPage(0);}}>
        <option value="">Todas as Bases</option>{basesOpts.map(b=><option key={b}>{b}</option>)}
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
            <th className="th" style={{width:36}}>
              <input type="checkbox" style={{cursor:'pointer'}} checked={paged.length>0&&selected.size===sorted.length} onChange={e=>setSelected(e.target.checked?new Set(sorted.map(r=>r.id)):new Set())}/>
            </th>
            <th className="th" style={{width:50}}></th>
            <th className="th" style={{cursor:'pointer'}} onClick={()=>toggleSort('nomes')}>Nome<SortIcon k="nomes"/></th>
            <th className="th hide-tab" style={{cursor:'pointer'}} onClick={()=>toggleSort('empresa')}>Empresa<SortIcon k="empresa"/></th>
            <th className="th hide-mob">Base</th>
            <th className="th hide-tab">Processo</th>
            <th className="th hide-mob" style={{cursor:'pointer'}} onClick={()=>toggleSort('dataRealizacao')}>Data<SortIcon k="dataRealizacao"/></th>
            <th className="th" style={{cursor:'pointer'}} onClick={()=>toggleSort('resultadoFinal')}>Resultado<SortIcon k="resultadoFinal"/></th>
            {cw&&<th className="th" style={{textAlign:'right'}}>Ações</th>}
          </tr></thead>
          <tbody>
            {loading?[1,2,3,4,5].map(i=><tr key={i}>{[0,1,2,3,4,5,6,7,8].slice(0,cw?9:8).map(j=><td key={j} className="td"><Skeleton h={14} w={j===0?'16px':j===1?'32px':j===3?'100px':j===5?'120px':j===7?'70px':'140px'} r="4" m="0"/></td>)}</tr>):paged.map(r=><tr key={r.id} style={{background:selected.has(r.id)?'rgba(89,48,226,.04)':''}}>
              <td className="td"><input type="checkbox" checked={selected.has(r.id)} onChange={e=>{const s=new Set(selected);e.target.checked?s.add(r.id):s.delete(r.id);setSelected(s);}}/></td>
              <td className="td">{r.fotoCandidato?<img src={r.fotoCandidato} style={{width:32,height:32,borderRadius:'50%',objectFit:'cover'}}/>:<Avatar name={r.nomes} size={32}/>}</td>
              <td className="td" style={{fontWeight:600}}>{r.nomes||'—'}</td>
              <td className="td hide-tab" style={{fontSize:13,color:'var(--text2)'}}>{r.empresa||'—'}</td>
              <td className="td hide-mob">{r.base?<span className="badge blue">{r.base}</span>:'—'}</td>
              <td className="td hide-tab" style={{fontSize:12,color:'var(--text3)',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{(r.processo||'—').replace(/_/g,' ')}</td>
              <td className="td hide-mob" style={{fontSize:12,fontFamily:'var(--mono)'}}>{r.dataRealizacao||'—'}</td>
              <td className="td"><Badge v={r.resultadoFinal}/></td>
              {cw&&<td className="td" style={{textAlign:'right'}}>
                <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                  <button className="btn sm icon" onClick={()=>onEdit(r)} title="Editar">{ICON.edit}</button>
                  <button className="btn sm icon" style={{color:'#E53935'}} onClick={()=>window.open('/api/export-pdf?id='+r.id,'_blank')} title="PDF">{ICON.down}</button>
                  {canDel()&&<button className="btn sm icon danger" onClick={()=>setConfirmDel(r)} title="Excluir">{ICON.trash}</button>}
                </div>
              </td>}
            </tr>)}
            {!loading&&!paged.length&&<tr><td colSpan={cw?9:8} style={{textAlign:'center',padding:'3rem',color:'var(--text3)'}}>
              <EmptyState title="Nenhum registro" desc="Importe dados via JSON ou crie uma nova avaliação."/>
            </td></tr>}
          </tbody>
        </table>
      </div>
    </div>
    {pages>1&&<div className="fu3" style={{display:'flex',justifyContent:'center',alignItems:'center',gap:10,marginTop:16}}>
      <button className="btn sm" disabled={page===0} onClick={()=>setPage(p=>p-1)}>‹ Anterior</button>
      <span style={{fontSize:13,color:'var(--text3)',fontFamily:'var(--mono)'}}>Página {page+1} de {pages}</span>
      <button className="btn sm" disabled={page>=pages-1} onClick={()=>setPage(p=>p+1)}>Próxima ›</button>
    </div>}
    <ConfirmModal show={confirmDel} title="Excluir Avaliação" msg={`Excluir permanentemente a avaliação de "${confirmDel?.nomes||'?'}"?`} onConfirm={()=>del(confirmDel.id)} onCancel={()=>setConfirmDel(null)}/>
  </div>);
}

function AuditLog({toast_}){
  const [log,setLog]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState(null);
  const load=()=>{setLoading(true);setError(null);api('audit').then(r=>{if(Array.isArray(r))setLog(r);else setError('Erro ao carregar');setLoading(false);}).catch(()=>{setError('Erro de conexão');setLoading(false);});};
  useEffect(()=>{load();},[]);
  if(error)return <div className="fu"><ErrorState msg={error} onRetry={load}/></div>;
  return(<div>
    <div className="fu" style={{marginBottom:24}}><h1 style={{fontSize:24,fontWeight:700}}>Auditoria</h1><p style={{fontSize:14,color:'var(--text3)',marginTop:4}}>Histórico de ações no sistema</p></div>
    <div className="card fu1" style={{padding:0,overflow:'hidden'}}>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:600}}>
          <thead><tr>
            <th className="th">Data/Hora</th><th className="th">Usuário</th><th className="th">Ação</th><th className="th">Detalhe</th>
          </tr></thead>
          <tbody>
            {loading?[1,2,3].map(i=><tr key={i}>{[1,2,3,4].map(j=><td key={j} className="td"><Skeleton h={14} w={j===0?'140px':j===1?'100px':j===2?'80px':'200px'} r="4" m="0"/></td>)}</tr>):!log.length?<tr><td colSpan={4} style={{textAlign:'center',padding:'3rem'}}><EmptyState title="Nenhum registro" desc="Nenhuma ação registrada ainda."/></td></tr>:log.map((e,i)=><tr key={e.id||i}>
              <td className="td" style={{fontFamily:'var(--mono)',fontSize:11.5}}>{new Date(e.ts||e.createdAt).toLocaleString('pt-BR')}</td>
              <td className="td" style={{fontWeight:600}}>{e.username||e.createdBy||'—'}</td>
              <td className="td"><span className="badge" style={{background:'rgba(89,48,226,.1)',color:'#5930E2'}}>{e.action||'—'}</span></td>
              <td className="td" style={{fontSize:13,color:'var(--text2)'}}>{e.detail||e.id||''}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  </div>);
}

function RecForm({rec,user,cw,mobile,onSave,onCancel,toast_}){
  const draftKey=rec?.id?'draft_'+rec.id:'draft_new';
  const [form,setForm]=useState(()=>{
    if(rec)return{...emptyForm(),...rec};
    try{const d=localStorage.getItem(draftKey);if(d){const p=JSON.parse(d);if(p&&p.nomes)return{...emptyForm(),...p};}}catch{}
    return emptyForm();
  });
  const [tab,setTab]=useState(0);const [errors,setErrors]=useState({});const [saving,setSaving]=useState(false);
  const [draftSaved,setDraftSaved]=useState(false);
  const [processosOpts,setProcessosOpts]=useState([]);
  const [empresasOpts,setEmpresasOpts]=useState([]);
  const [basesOpts,setBasesOpts]=useState([]);
  const [avaliadoresOpts,setAvaliadoresOpts]=useState([]);
  const [pedidosOpts,setPedidosOpts]=useState([]);
  const [motivosOpts,setMotivosOpts]=useState([]);
  const [candidatosList,setCandidatosList]=useState([]);
  const [candSearch,setCandSearch]=useState('');
  const selecionarCandidato=id=>{
    const c=candidatosList.find(x=>x.id===id);
    if(!c)return;
    upd('nomes',c.nome||'');
    upd('cpf',(c.cpf||'').replace(/\D/g,''));
    upd('emailEmpresa',c.email||'');
    if(c.foto)upd('fotoCandidato',c.foto);
    setCandSearch(c.nome||'');
  };
  useEffect(()=>{
    api('cadastros?tipo=processos').then(r=>{if(Array.isArray(r)&&r.length){setProcessosOpts(r.map(p=>p.processo));}}).catch(()=>{});
    api('cadastros?tipo=empresas').then(r=>{if(Array.isArray(r)&&r.length){setEmpresasOpts(r.map(p=>p.nome));}}).catch(()=>{});
    api('cadastros?tipo=bases').then(r=>{if(Array.isArray(r)&&r.length){setBasesOpts(r.map(p=>p.base));}}).catch(()=>{});
    api('cadastros?tipo=avaliadores').then(r=>{if(Array.isArray(r)&&r.length){setAvaliadoresOpts(r.map(p=>p.nome));}}).catch(()=>{});
    api('cadastros?tipo=pedidos').then(r=>{if(Array.isArray(r)&&r.length){setPedidosOpts(r.map(p=>p.nome));}}).catch(()=>{});
    api('cadastros?tipo=motivos').then(r=>{if(Array.isArray(r)&&r.length){setMotivosOpts(r.map(p=>p.nome));}}).catch(()=>{});
    api('cadastros?tipo=candidatos').then(r=>{if(Array.isArray(r)&&r.length)setCandidatosList(r);}).catch(()=>{});
  },[]);
  const photoRef=useRef(null);
  const draftTimer=useRef(null);
  useEffect(()=>{
    if(rec||form===emptyForm())return;
    if(draftTimer.current)clearTimeout(draftTimer.current);
    draftTimer.current=setTimeout(()=>{
      const s={};Object.keys(emptyForm()).forEach(k=>{if(k!=='fotoCandidato'&&form[k])s[k]=form[k];});
      localStorage.setItem(draftKey,JSON.stringify(s));
      setDraftSaved(true);
      setTimeout(()=>setDraftSaved(false),2000);
    },2000);
    return()=>{if(draftTimer.current)clearTimeout(draftTimer.current);};
  },[form,rec]);
  const limparDraft=()=>{localStorage.removeItem(draftKey);toast_('Rascunho descartado');};
  const upd=(f,v)=>setForm(p=>{
    const n={...p,[f]:v};
    if(f==='cpf')n.isbn=calcISBN(v);
    if(f==='empresa'){const ed=getEmpresaData(v);if(ed){n.emailEmpresa=ed.email;n.dataInicioAssinatura=ed.dataInicio;n.dataFimAssinatura=ed.dataFim;n.associadoSindistal=ed.associado?'SIM':'NÃO';n.docContratual=ed.docContratual;n.nRenovacao=String(ed.valor);}n.estado='RJ';}
    if(f==='base'){const m=BASE_UO_REGIAO[v];if(m){n.unidadeOperacional=m.UO;n.regiao=m.REGIAO;}}
    if(f==='processo'){n.cargosProcessos=getCargo(v);['1','2','3','4','5','6'].forEach(x=>{n['it'+x]=getIT(v);});['1','2','3','4','5','6'].forEach(x=>{if(n['avaliacao'+x])n['baremo'+x]=getBaremo(v,n['avaliacao'+x]);});}
    if(f.startsWith('avaliacao')&&f.length===10){const idx=f.slice(-1);n['baremo'+idx]=getBaremo(n.processo,v);}
    if(f==='avaliacaoOnline')n.statusProvaOnline=calcStatusProvaOnline(v);
    if(f==='notaProva')n.statusProvaTeorica=calcStatusProvaTeorica(v);
    ['1','2','3','4','5','6'].forEach(x=>{if(f==='statusProva'+x)n.statusParcial=calcStatusParcial(n);});
    if(f==='statusProvaTeorica'||f==='pedido'){n.statusParcial=calcStatusParcial(n);n.resultadoFinal=calcResultadoFinal(n);}
    if(n.statusParcial&&f!=='pedido'&&f!=='statusProvaTeorica')n.resultadoFinal=calcResultadoFinal(n);
    return n;
  });
  useEffect(()=>{if(!errors)return;const e={...errors};let changed=false;['nomes','pedido','empresa','base','processo'].forEach(k=>{if(e[k]&&form[k]){delete e[k];changed=true;}});if(changed)setErrors(e);},[form.nomes,form.pedido,form.empresa,form.base,form.processo]);
  useEffect(()=>{
    if(!rec&&Object.values(form).some(v=>v&&v!=='')){
      const h=e=>{e.preventDefault();e.returnValue='';};
      window.addEventListener('beforeunload',h);
      return()=>window.removeEventListener('beforeunload',h);
    }
  },[form,rec]);
  const confirmCancel=()=>{
    if(!rec&&Object.values(form).some(v=>v&&v!=='')){
      if(!confirm('Há dados não salvos. Deseja realmente sair?'))return;
    }
    localStorage.removeItem(draftKey);onCancel();
  };
  const save=async()=>{
    const e={};if(!form.nomes)e.nomes='Obrigatório';if(!form.pedido)e.pedido='Obrigatório';if(!form.empresa)e.empresa='Obrigatório';if(!form.base)e.base='Obrigatório';if(!form.processo)e.processo='Obrigatório';
    setErrors(e);if(Object.keys(e).length){toast_('Preencha os campos obrigatórios','error');return;}
    setSaving(true);
    const r=rec?.id?await api('records/'+rec.id,{method:'PUT',body:JSON.stringify({...form,updatedBy:user.nome})}):await api('records',{method:'POST',body:JSON.stringify({...form,createdBy:user.nome})});
    setSaving(false);
    if(r.error)toast_(r.error,'error');else{localStorage.removeItem(draftKey);onSave();}
  };
  const photo=e=>{
    const f=e.target.files[0];if(!f)return;
    const img=new Image();const url=URL.createObjectURL(f);
    img.onload=()=>{
      const max=600;let w=img.width,h=img.height;
      if(w>max||h>max){const r=Math.min(max/w,max/h);w*=r;h*=r;}
      const c=document.createElement('canvas');c.width=w;c.height=h;
      const ctx=c.getContext('2d');ctx.drawImage(img,0,0,w,h);
      upd('fotoCandidato',c.toDataURL('image/jpeg',.7));
      URL.revokeObjectURL(url);
    };
    img.src=url;
  };
  const errStyle=field=>errors[field]?{borderColor:'var(--danger)',background:'var(--danger-bg)'}:{};
  const F=({label,field,type='text',opts,auto,req,ph})=>(<div className="fl" style={mobile?{}:{}}>
    {opts?<><select className={`field${auto?' auto':''}${form[field]?' filled':''}`} style={errStyle(field)} value={form[field]||''} onChange={e=>upd(field,e.target.value)} disabled={auto}>
      <option value="">{auto?'—':'Selecionar...'}</option>{opts.map(o=><option key={o} value={o}>{typeof o==='string'?o.replace(/_/g,' '):o}</option>)}
    </select><label style={{color:errors[field]?'var(--danger)':auto?'var(--text3)':''}}>{label}{req&&<span className="req">*</span>}</label></>:<><input className={`field${auto?' auto':''}${form[field]?' filled':''}`} style={errStyle(field)} type={type} value={form[field]||''} onChange={e=>upd(field,e.target.value)} readOnly={auto} placeholder={ph||' '}/>
    <label style={{color:errors[field]?'var(--danger)':auto?'var(--text3)':''}}>{label}{req&&<span className="req">*</span>}</label></>}
    {errors[field]&&<p className="err-msg">{errors[field]}</p>}
  </div>);
  const ativOpts=useMemo(()=>{
    const p=PROCESSOS_MAP[form.processo];
    return p?p.atividades.map(a=>({label:a.a.replace(/_/g,' '),value:a.a})):[];
  },[form.processo]);
  const PB=({n})=>(<div className="ph-block">
    <div className="ph-title">Avaliação Prática {n}</div>
    <div style={{display:'grid',gridTemplateColumns:mobile?'1fr':'1fr 1fr 1fr',gap:12,marginBottom:10}}>
      <div><label className="label">Atividade {n}</label><select className="field" value={form['avaliacao'+n]||''} onChange={e=>upd('avaliacao'+n,e.target.value)}><option value="">Selecionar...</option>{ativOpts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
      <F label="Baremo K" field={`baremo${n}`} auto/>
      <div><label className="label">Status {n}</label><select className="field" value={form['statusProva'+n]||''} onChange={e=>upd('statusProva'+n,e.target.value)}><option value="">—</option>{STATUS_PRATICA.map(s=><option key={s}>{s}</option>)}</select></div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:mobile?'1fr':'1fr 1fr',gap:12,marginBottom:10}}>
      <div><label className="label">Motivo(s)</label><select className="field" value={form['motivo'+n]||''} onChange={e=>upd('motivo'+n,e.target.value)}><option value="">—</option>{motivosOpts.map(m=><option key={m}>{m}</option>)}</select></div>
      <F label="IT (auto)" field={`it${n}`} auto/>
    </div>
    <div><label className="label">Detalhamento</label><textarea className="field" rows={2} value={form['detalhe'+n]||''} onChange={e=>upd('detalhe'+n,e.target.value)} style={{resize:'vertical'}}/></div>
  </div>);
  const g2={display:'grid',gridTemplateColumns:mobile?'1fr':'1fr 1fr',gap:13};
  const g3={display:'grid',gridTemplateColumns:mobile?'1fr':'1fr 1fr 1fr',gap:13};
  const tabs=['Identificação','Avaliação','Práticas 1–3','Práticas 4–6','Resultado'];
  return(<div>
    <div className="fu" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,flexWrap:'wrap',gap:12}}>
      <div><h1 style={{fontSize:22,fontWeight:700}}>{rec?'Editar':'Nova'} Avaliação</h1>
        <div style={{display:'flex',alignItems:'center',gap:8,marginTop:2}}>
          {rec&&<p style={{fontSize:11,color:'var(--text3)',fontFamily:'var(--mono)'}}>ID: {rec.id}</p>}
          {draftSaved&&<span className="badge green" style={{fontSize:10}}>Rascunho salvo</span>}
          {!rec&&!draftSaved&&localStorage.getItem(draftKey)&&<button className="btn ghost sm" style={{fontSize:10,color:'var(--text3)',padding:'2px 8px'}} onClick={limparDraft}>{ICON.x}Descartar rascunho</button>}
        </div>
      </div>
      <div style={{display:'flex',gap:8}}>
        <button className="btn" onClick={confirmCancel}>Cancelar</button>
        {cw&&<button className="btn primary" onClick={save} disabled={saving}>{saving?<><Spin/>Salvando...</>:<>{ICON.save}Salvar Avaliação</>}</button>}
      </div>
    </div>
    <div className="tab-bar fu1" style={{marginBottom:16}}>
      {tabs.map((t,i)=><button key={i} className={`tab${tab===i?' active':''}`} onClick={()=>setTab(i)}>{t}</button>)}
    </div>
    <div className="card fu2" style={{padding:'1.5rem'}}>
      {tab===0&&<div style={{display:'flex',flexDirection:'column',gap:16}}>
        {!rec&&candidatosList.length>0&&<div style={{padding:'12px 16px',background:'linear-gradient(135deg,rgba(89,48,226,.06),rgba(124,92,255,.04))',borderRadius:'var(--r-sm)',border:'1px solid rgba(89,48,226,.12)',position:'relative'}}>
          <label className="label" style={{color:'var(--primary)',fontSize:12}}>Buscar Candidato <span style={{fontWeight:400,color:'var(--text3)'}}>(digite nome ou CPF para preencher automaticamente)</span></label>
          <input className="field" list="cand-list" value={candSearch} onChange={e=>{const v=e.target.value;setCandSearch(v);const match=candidatosList.find(c=>c.nome===v||c.cpf===v.replace(/\D/g,''));if(match)selecionarCandidato(match.id);}} placeholder="Ex: João Silva ou 000.000.000-00" style={{fontSize:13,marginTop:4}}/>
          <datalist id="cand-list">{candidatosList.filter(c=>!candSearch||(c.nome||'').toLowerCase().includes(candSearch.toLowerCase())||(c.cpf||'').includes(candSearch.replace(/\D/g,''))).slice(0,30).map(c=><option key={c.id} value={c.nome||''} label={`${c.cpf||'---'} · ${c.email||''}`}/>)}</datalist>
        </div>}
        <div style={{display:'flex',gap:20,alignItems:'flex-start',flexWrap:'wrap'}}>
          <div style={{textAlign:'center',flexShrink:0}}>
            {form.fotoCandidato?<img src={form.fotoCandidato} style={{width:80,height:80,borderRadius:'50%',objectFit:'cover',border:'3px solid var(--primary)',boxShadow:'0 0 0 4px var(--primary-glow)'}}/>
            :<div style={{width:80,height:80,borderRadius:'50%',background:'linear-gradient(135deg,#5930E2,#7C3AED)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,color:'#fff',boxShadow:'0 4px 16px rgba(89,48,226,.3)'}}>{(form.nomes||'?')[0]?.toUpperCase()||'👤'}</div>}
            <button className="btn ghost sm" style={{marginTop:8,fontSize:12}} onClick={()=>photoRef.current.click()}>{ICON.cam}Foto</button>
            {form.fotoCandidato&&<button className="btn ghost sm" style={{marginTop:4,color:'var(--danger)',fontSize:11,display:'block',width:'100%'}} onClick={()=>upd('fotoCandidato','')}>Remover</button>}
            <input ref={photoRef} type="file" accept="image/*" style={{display:'none'}} onChange={photo}/>
          </div>
          <div style={{flex:1,minWidth:200}}>
            <div style={g3}>
              <F label="Status" field="statusColaborador" opts={['CANDIDATO','ATIVO','DESLIGADO']}/>
              <F label="Pedido" field="pedido" opts={pedidosOpts} req/>
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
        <div style={g3}><F label="Empresa" field="empresa" opts={empresasOpts} req/><F label="Base" field="base" opts={basesOpts} req/><F label="UO (auto)" field="unidadeOperacional" auto/></div>
        <div style={g3}><F label="Região (auto)" field="regiao" auto/><F label="Avaliador" field="avaliador" opts={avaliadoresOpts}/><F label="Local de Avaliação" field="localAvaliacao"/></div>
        <div style={g2}><F label="Processo" field="processo" opts={processosOpts} req/><F label="Cargo (auto)" field="cargosProcessos" auto/></div>
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
  const [data,setData]=useState([]);const [loading,setLoading]=useState(false);
  const [dtIni,setDtIni]=useState('');const [dtFim,setDtFim]=useState('');const [fb,setFb]=useState('');const [fProc,setFProc]=useState('');const [fEmp,setFEmp]=useState('');
  const [filtrosAplicados,setFiltrosAplicados]=useState(false);
  const [basesRpt,setBasesRpt]=useState(BASES);
  const [procsRpt,setProcsRpt]=useState(PROCESSOS);
  const [empsRpt,setEmpsRpt]=useState(EMPRESAS_NOMES);
  useEffect(()=>{api('cadastros?tipo=bases').then(r=>{if(Array.isArray(r)&&r.length)setBasesRpt(r.map(p=>p.base));}).catch(()=>{});api('cadastros?tipo=processos').then(r=>{if(Array.isArray(r)&&r.length)setProcsRpt(r.map(p=>p.processo));}).catch(()=>{});api('cadastros?tipo=empresas').then(r=>{if(Array.isArray(r)&&r.length)setEmpsRpt(r.map(p=>p.nome));}).catch(()=>{});},[]);
  const aplicarFiltros=()=>{
    setLoading(true);setFiltrosAplicados(true);
    api('records?'+new URLSearchParams({dtIni,dtFim,base:fb,empresa:fProc,q:fEmp})).then(r=>{if(Array.isArray(r))setData(r);setLoading(false);});
  };
  useEffect(()=>{aplicarFiltros();},[]);
  const total=data.length,aprov=data.filter(r=>r.resultadoFinal==='APROVADO'||r.resultadoFinal==='APROVADO 2').length,reprov=data.filter(r=>r.resultadoFinal==='REPROVADO').length,ausente=data.filter(r=>r.resultadoFinal==='AUSENTE').length,pend=total-aprov-reprov-ausente,tx=total?Math.round(aprov/total*100):0;
  const byBase={};data.forEach(r=>{if(r.base)byBase[r.base]=(byBase[r.base]||0)+1;});
  const topB=Object.entries(byBase).sort((a,b)=>b[1]-a[1]).slice(0,7);
  const byP={};data.forEach(r=>{if(r.processo){const k=r.processo.replace(/_/g,' ').slice(0,26);byP[k]=(byP[k]||0)+1;}});
  const topP=Object.entries(byP).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const byEmp={};data.forEach(r=>{if(r.empresa)byEmp[r.empresa]=(byEmp[r.empresa]||0)+1;});
  const topE=Object.entries(byEmp).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const pieData=[{name:'Aprovados',value:aprov,fill:'#059669'},{name:'Reprovados',value:reprov,fill:'#DC2626'},{name:'Ausentes',value:ausente,fill:'#D97706'},{name:'Pendentes',value:pend,fill:'#94A3B8'}].filter(d=>d.value>0);
  const exportCSV=()=>{
    const h=['Nome','CPF','Pedido','Empresa','Base','Processo','Data','Resultado'];
    const rows=data.map(r=>[r.nomes||'',r.cpf||'',r.pedido||'',r.empresa||'',r.base||'',r.processo||'',r.dataRealizacao||'',r.resultadoFinal||'']);
    const csv=[h.join(';'),...rows.map(r=>r.map(v=>'"'+v.replace(/"/g,'""')+'"').join(';'))].join('\n');
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='relatorio_avaliacoes.csv';a.click();URL.revokeObjectURL(a.href);
  };
  return(<div>
    <div className="fu" style={{marginBottom:24}}><h1 style={{fontSize:24,fontWeight:700}}>Relatórios</h1><p style={{fontSize:14,color:'var(--text3)',marginTop:3}}>Análise por período e filtros</p></div>
    <div className="card fu1" style={{padding:'1.25rem',marginBottom:20}}>
      <p className="sec-h">Filtros</p>
      <div style={{display:'grid',gridTemplateColumns:mobile?'1fr 1fr':'1fr 1fr 1fr 1fr 1fr auto',gap:12,alignItems:'end'}}>
        <div><label className="label">Data Início</label><input className="field" type="date" value={dtIni} onChange={e=>setDtIni(e.target.value)} onKeyDown={e=>e.key==='Enter'&&aplicarFiltros()}/></div>
        <div><label className="label">Data Fim</label><input className="field" type="date" value={dtFim} onChange={e=>setDtFim(e.target.value)} onKeyDown={e=>e.key==='Enter'&&aplicarFiltros()}/></div>
        <div><label className="label">Base</label><select className="field" value={fb} onChange={e=>setFb(e.target.value)}><option value="">Todas</option>{basesRpt.map(b=><option key={b}>{b}</option>)}</select></div>
        <div><label className="label">Processo</label><select className="field" value={fProc} onChange={e=>setFProc(e.target.value)}><option value="">Todos</option>{procsRpt.map(p=><option key={p}>{p}</option>)}</select></div>
        <div><label className="label">Empresa</label><select className="field" value={fEmp} onChange={e=>setFEmp(e.target.value)}><option value="">Todas</option>{empsRpt.map(e=><option key={e}>{e}</option>)}</select></div>
        <button className="btn primary" onClick={aplicarFiltros} style={{marginBottom:1}}>{ICON.search}Filtrar</button>
        {filtrosAplicados&&<button className="btn ghost sm" onClick={()=>{setDtIni('');setDtFim('');setFb('');setFProc('');setFEmp('');setTimeout(()=>aplicarFiltros(),0);}}>{ICON.x}Limpar</button>}
      </div>
      {!mobile&&<div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
        {[['7d','7 dias'],['30d','30 dias'],['90d','90 dias'],['ano','Este ano']].map(([k,l])=><button key={k} className={`btn sm ${(dtIni||dtFim)?'ghost':'ghost'}`} style={{fontSize:11.5,padding:'4px 10px',background:k==='7d'&&!dtIni&&!dtFim?'var(--primary)':'',color:k==='7d'&&!dtIni&&!dtFim?'#fff':''}} onClick={()=>{
          const h=new Date();
          if(k==='7d'){h.setDate(h.getDate()-7);setDtIni(h.toISOString().slice(0,10));setDtFim('');}
          else if(k==='30d'){h.setDate(h.getDate()-30);setDtIni(h.toISOString().slice(0,10));setDtFim('');}
          else if(k==='90d'){h.setDate(h.getDate()-90);setDtIni(h.toISOString().slice(0,10));setDtFim('');}
          else{setDtIni(h.getFullYear()+'-01-01');setDtFim('');}
          setTimeout(()=>aplicarFiltros(),0);
        }}>{l}</button>)}
      </div>}
    </div>
    <div className="fu2" style={{display:'grid',gridTemplateColumns:mobile?'1fr 1fr':'repeat(4,1fr)',gap:13,marginBottom:20}}>
      {[{n:total,l:'No Período',c:'#5930E2',bg:'linear-gradient(135deg,#5930E2,#7C5CFF)'},{n:aprov,l:'Aprovados',c:'#059669',bg:'linear-gradient(135deg,#059669,#2EAA5C)'},{n:reprov,l:'Reprovados',c:'#DC2626',bg:'linear-gradient(135deg,#DC2626,#EF4444)'},{n:ausente,l:'Ausentes',c:'#D97706',bg:'linear-gradient(135deg,#D97706,#F59E0B)'}].map((s,i)=><div key={i} style={{background:s.bg,borderRadius:'var(--r)',padding:'1.25rem',boxShadow:`0 5px 18px ${s.c}33`,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:-8,top:-8,width:58,height:58,background:'rgba(255,255,255,.1)',borderRadius:'50%'}}/>
        <div style={{fontSize:30,fontWeight:800,color:'#fff'}}>{s.n}</div>
        <div style={{fontSize:12.5,color:'rgba(255,255,255,.75)',fontWeight:500}}>{s.l}</div>
      </div>)}
    </div>
    {loading?<div className="fu3" style={{display:'grid',gridTemplateColumns:mobile?'1fr':'1fr 1fr',gap:16}}>
      {[1,2].map(i=><div key={i} className="card" style={{padding:'1.25rem'}}><Skeleton h={14} w="100px" m="0 0 16px 0"/>{[1,2,3,4,5].map(j=><div key={j} className="chart-row"><Skeleton h={9} w="100%" r="6" m="0"/></div>)}</div>)}
      <div className="card" style={{padding:'1.25rem'}}><Skeleton h={14} w="140px" m="0 0 16px 0"/>{[1,2,3,4].map(j=><div key={j} className="chart-row"><Skeleton h={9} w="100%" r="6" m="0"/></div>)}</div>
      <div className="card" style={{padding:'1.25rem',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}><Skeleton h={64} w="100px" r="8" m="0 0 16px 0"/><Skeleton h={14} w="160px" m="0"/></div>
    </div>:<div className="fu3" style={{display:'grid',gridTemplateColumns:mobile?'1fr':'1fr 1fr',gap:16}}>
      <div className="card" style={{padding:'1.25rem'}}>
        <p className="sec-h">Por Base</p>
        <div style={{height:Math.max(200,topB.length*36)}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topB.map(([b,n])=>({name:b.split(' ')[0],total:n}))} layout="vertical" margin={{left:10,right:10,top:5,bottom:5}}>
              <XAxis type="number" hide/>
              <YAxis type="category" dataKey="name" tick={{fontSize:11,fill:'var(--text2)'}} width={80}/>
              <Tooltip contentStyle={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}}/>
              <Bar dataKey="total" fill="#5930E2" radius={[0,4,4,0]} maxBarSize={16}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card" style={{padding:'1.25rem'}}>
        <p className="sec-h">Distribuição</p>
        <div style={{height:220,display:'flex',alignItems:'center',justifyContent:'center'}}>
          {pieData.length?<ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {pieData.map((e,i)=><Cell key={i} fill={e.fill}/>)}
              </Pie>
              <Tooltip contentStyle={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}}/>
            </PieChart>
          </ResponsiveContainer>:<p style={{fontSize:13,color:'var(--text3)'}}>Sem dados</p>}
        </div>
        <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap',marginTop:8}}>
          {pieData.map(d=><div key={d.name} style={{display:'flex',alignItems:'center',gap:4,fontSize:11.5,color:'var(--text3)'}}>
            <span style={{width:10,height:10,borderRadius:3,background:d.fill}}/>
            <span>{d.name} ({d.value})</span>
          </div>)}
        </div>
      </div>
      <div className="card" style={{padding:'1.25rem'}}>
        <p className="sec-h">Top Processos</p>
        <div style={{height:Math.max(180,topP.length*30)}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topP.map(([p,n])=>({name:p.length>20?p.slice(0,20)+'…':p,total:n}))} layout="vertical" margin={{left:10,right:10,top:5,bottom:5}}>
              <XAxis type="number" hide/>
              <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:'var(--text2)'}} width={90}/>
              <Tooltip contentStyle={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}}/>
              <Bar dataKey="total" fill="#059669" radius={[0,4,4,0]} maxBarSize={16}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card" style={{padding:'1.25rem'}}>
        <p className="sec-h">Por Empresa</p>
        <div style={{height:Math.max(180,topE.length*30)}}>
          {topE.length?<ResponsiveContainer width="100%" height="100%">
            <BarChart data={topE.map(([e,n])=>({name:e.length>18?e.slice(0,18)+'…':e,total:n}))} layout="vertical" margin={{left:10,right:10,top:5,bottom:5}}>
              <XAxis type="number" hide/>
              <YAxis type="category" dataKey="name" tick={{fontSize:10,fill:'var(--text2)'}} width={100}/>
              <Tooltip contentStyle={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,fontSize:12}}/>
              <Bar dataKey="total" fill="#7C3AED" radius={[0,4,4,0]} maxBarSize={16}/>
            </BarChart>
          </ResponsiveContainer>:<p style={{fontSize:13,color:'var(--text3)',textAlign:'center',paddingTop:40}}>Sem dados</p>}
        </div>
      </div>
      <div className="card" style={{padding:'1.25rem',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <p className="sec-h" style={{alignSelf:'flex-start',width:'100%'}}>Taxa de Aprovação</p>
        <div style={{textAlign:'center',marginTop:12}}>
          <div style={{fontSize:64,fontWeight:800,background:'linear-gradient(135deg,#059669,#34D399)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',lineHeight:1}}>{tx}<span style={{fontSize:32}}>%</span></div>
          <div className="progress" style={{width:200,margin:'14px auto 10px'}}><div className="progress-fill" style={{width:tx+'%',background:'linear-gradient(90deg,#059669,#34D399)'}}/></div>
          <p style={{fontSize:13,color:'var(--text3)'}}>{aprov} aprovados de {total}</p>
        </div>
      </div>
    </div>}
    {total>0&&<div className="fu3" style={{display:'flex',justifyContent:'flex-end',marginTop:12}}>
      <button className="btn ghost" onClick={exportCSV}>{ICON.down}Exportar CSV</button>
    </div>}
  </div>);
}

function Users({user,toast_}){
  const [users,setUsers]=useState([]);const [loading,setLoading]=useState(true);
  const [show,setShow]=useState(false);const [editU,setEditU]=useState(null);
  const [form,setForm]=useState({username:'',password:'',nome:'',role:'COLABORADOR',tipo:'colaborador',permissions:'Leitura + Escrita'});
  const [clientesList,setClientesList]=useState([]);
  const [err,setErr]=useState('');const [saving,setSaving]=useState(false);
  const [confirmDel,setConfirmDel]=useState(null);
  const slotsInfo=form.clienteId?clientesList.find(c=>c.id===form.clienteId):null;
  const slotsRestantes=slotsInfo?(slotsInfo.slotsTotal||0)-(slotsInfo.slotsUsados||0):0;
  useEffect(()=>{
    const p1=api('users');
    const p2=user.role==='SYSTEM'?api('clientes'):user.clienteId?api('clientes?id='+user.clienteId).then(r=>r&&!r.error?[r]:[]):Promise.resolve([]);
    Promise.all([p1,p2]).then(([u,c])=>{if(Array.isArray(u))setUsers(u);if(Array.isArray(c))setClientesList(c);setLoading(false);}).catch(()=>setLoading(false));
  },[]);
  const open=u=>{
    if(u){setForm({...u,password:''});setEditU(u);}
    else{
      const base=user.tipo==='admin_cliente'?{role:'COLABORADOR',tipo:'colaborador',clienteId:user.clienteId}:{role:'admin_cliente',tipo:'admin_cliente'};
      setForm({username:'',password:'',nome:'',permissions:'Leitura + Escrita',...base});
      setEditU(null);
    }
    setErr('');setShow(true);
  };
  const save=async()=>{
    if(!form.username||!form.nome)return setErr('Usuário e nome obrigatórios');
    if(!editU&&!form.password)return setErr('Senha obrigatória');
    setSaving(true);
    const payload={...form};
    if(user.role==='SYSTEM'&&form.role==='admin_cliente'){payload.tipo='admin_cliente';payload.role='ADMIN';}
    const r=await api('users',{method:editU?'PUT':'POST',body:JSON.stringify(editU?{id:editU.id,...payload}:payload)});
    setSaving(false);
    if(r.error)return setErr(r.error);
    toast_(editU?'Usuário atualizado!':'Usuário criado!');
    setShow(false);
    if(!editU)window.location.reload();
  };
  const toggle=async u=>{await api('users',{method:'PUT',body:JSON.stringify({id:u.id,active:!u.active})});setUsers(us=>us.map(x=>x.id===u.id?{...x,active:!x.active}:x));};
  const del=async()=>{
    if(!confirmDel)return;
    const r=await api('users?id='+confirmDel.id,{method:'DELETE'});
    if(r.error)return toast_(r.error,'error');
    toast_('Usuário excluído');setConfirmDel(null);setUsers(us=>us.filter(x=>x.id!==confirmDel.id));
  };
  return(<div>
    <div className="fu" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
      <div><h1 style={{fontSize:24,fontWeight:700}}>Usuários</h1><p style={{fontSize:14,color:'var(--text3)',marginTop:3}}>{users.length} usuários cadastrados</p></div>
      <button className="btn primary" onClick={()=>open(null)}>{ICON.uplus}Novo Usuário</button>
    </div>
    <div className="card fu1" style={{padding:0,overflow:'hidden',marginTop:6}}>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:600}}>
          <thead><tr><th className="th" style={{width:48}}></th><th className="th">Nome</th><th className="th">Usuário</th><th className="th">Perfil</th><th className="th">Empresa</th><th className="th">Status</th><th className="th" style={{textAlign:'right'}}>Ações</th></tr></thead>
          <tbody>{loading?[1,2,3].map(i=><tr key={i}>{[0,1,2,3,4,5,6].map(j=><td key={j} className="td"><Skeleton h={14} w={j===0?'32px':j===6?'80px':'120px'} r="4" m="0"/></td>)}</tr>):users.length?users.map(u=><tr key={u.id}>
            <td className="td"><Avatar name={u.nome} size={32}/></td>
            <td className="td" style={{fontWeight:600}}>{u.nome}</td>
            <td className="td" style={{fontFamily:'var(--mono)',fontSize:12.5,color:'var(--text2)'}}>{u.username}</td>
            <td className="td"><span className="badge" style={{background:ROLES[u.role]?.bg,color:ROLES[u.role]?.color}}>{ROLES[u.role]?.label}</span></td>
            <td className="td" style={{fontSize:13,color:'var(--text2)'}}>{u.clienteNome||'—'}</td>
            <td className="td"><span className={`badge dot ${u.active?'green':'gray'}`}>{u.active?'Ativo':'Inativo'}</span></td>
            <td className="td" style={{textAlign:'right'}}>
              <div style={{display:'flex',gap:6,justifyContent:'flex-end'}}>
                <button className="btn sm icon" onClick={()=>open(u)}>{ICON.edit}</button>
                {u.id!==user.id&&u.role!=='SYSTEM'&&<button className={`btn sm ${u.active?'danger':'success'}`} style={{fontSize:12,padding:'4px 10px'}} onClick={()=>toggle(u)}>{u.active?'Inativar':'Ativar'}</button>}
                {(user.role==='SYSTEM'||user.tipo==='admin_cliente')&&u.role!=='SYSTEM'&&u.tipo!=='admin_cliente'&&<button className="btn sm icon danger" onClick={()=>setConfirmDel(u)}>{ICON.trash}</button>}
              </div>
            </td>
          </tr>):<tr><td colSpan={7} style={{textAlign:'center',padding:'3rem',color:'var(--text3)'}}><EmptyState title="Nenhum usuário" desc="Nenhum usuário cadastrado ainda."/></td></tr>}</tbody>
        </table>
      </div>
    </div>
    <ConfirmModal show={confirmDel} title="Excluir Usuário" msg={`Excluir "${confirmDel?.nome}" permanentemente?`} onConfirm={del} onCancel={()=>setConfirmDel(null)}/>
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
          {user.role==='SYSTEM'&&!editU&&<div><label className="label">Tipo de Usuário</label>
            <select className="field" value={form.role||'admin_cliente'} onChange={e=>setForm(f=>({...f,role:e.target.value,clienteId:e.target.value==='admin_cliente'?f.clienteId:''}))}>
              <option value="admin_cliente">Administrador (vinculado a empresa)</option>
            </select>
          </div>}
          {user.tipo==='admin_cliente'&&<div style={{padding:'8px 10px',background:'var(--info-bg)',borderRadius:'var(--r-sm)',fontSize:12,color:'var(--text2)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span>Empresa: <strong>{clientesList.find(c=>c.id===user.clienteId)?.nome||'—'}</strong></span>
            <span>Slots: <strong>{slotsRestantes}</strong> disponíveis</span>
          </div>}
          {user.role==='SYSTEM'&&form.role==='admin_cliente'&&<div><label className="label">Vincular à Empresa *</label>
            <select className="field" value={form.clienteId||''} onChange={e=>setForm(f=>({...f,clienteId:e.target.value}))}>
              <option value="">Selecionar empresa...</option>
              {clientesList.map(c=><option key={c.id} value={c.id}>{c.nome} · Slots: {c.slotsUsados||0}/{c.slotsTotal||0}</option>)}
            </select>
          </div>}
          {form.role==='COLABORADOR'&&<div><label className="label">Permissão</label>
            <select className="field" value={form.permissions||'Leitura + Escrita'} onChange={e=>setForm(f=>({...f,permissions:e.target.value}))}>
              <option value="Somente Leitura">Somente Leitura</option><option value="Leitura + Escrita">Leitura + Escrita</option>
            </select>
          </div>}
          {err&&<div style={{background:'var(--danger-bg)',border:'1px solid #FECACA',borderRadius:8,padding:'9px 12px',fontSize:13,color:'var(--danger)',display:'flex',gap:7}}>{ICON.x}{err}</div>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:4}}>
            <button className="btn" onClick={()=>setShow(false)} disabled={saving}>Cancelar</button>
            <button className="btn primary" onClick={save} disabled={saving}>{saving?<><Spin/>Salvando...</>:<>{ICON.save}Salvar</>}</button>
          </div>
        </div>
      </div>
    </div>}
  </div>);
}

const CAD_ICON={pedidos:'📋',empresas:'🏢',processos:'⚙️',bases:'📍',avaliadores:'👤',motivos:'📌',candidatos:'🧑'};
const CAD_COLS={
  pedidos:[{k:'nome',l:'Pedido'}],
  empresas:[{k:'nome',l:'Empresa'},{k:'valor',l:'Valor R$'},{k:'email',l:'Email'},{k:'dataInicio',l:'Início'},{k:'dataFim',l:'Fim'}],
  processos:[{k:'processo',l:'Processo'},{k:'cargo',l:'Cargo'},{k:'atividade',l:'Atividade'},{k:'valorBaremo',l:'Baremo'},{k:'it',l:'IT'},{k:'unicos',l:'Únicos'}],
  bases:[{k:'base',l:'Base'},{k:'uo',l:'UO'},{k:'regiao',l:'Região'}],
  avaliadores:[{k:'nome',l:'Avaliador'}],
  motivos:[{k:'nome',l:'Motivo'}],
  candidatos:[{k:'foto',l:'Foto'},{k:'nome',l:'Nome'},{k:'cpf',l:'CPF'},{k:'email',l:'E-mail'},{k:'estado',l:'UF'},{k:'cidade',l:'Cidade'}]
};
const CAD_FORMS={
  pedidos:[{k:'nome',l:'Nome do Pedido',req:true}],
  empresas:[{k:'nome',l:'Nome da Empresa',req:true},{k:'valor',l:'Valor Renovação (R$)',type:'number'},{k:'email',l:'Email de Contato'},{k:'dataInicio',l:'Data Início',type:'date'},{k:'dataFim',l:'Data Fim',type:'date'},{k:'associado',l:'Associado Sindistal',opts:['SIM','NÃO']},{k:'docContratual',l:'Doc Contratual'}],
  processos:[{k:'processo',l:'Nome do Processo',req:true},{k:'cargo',l:'Cargo',req:true},{k:'atividade',l:'Atividade',req:true},{k:'valorBaremo',l:'Valor Baremo',type:'number',req:true},{k:'it',l:'IT do Processo'},{k:'unicos',l:'Únicos'}],
  bases:[{k:'base',l:'Base',req:true},{k:'uo',l:'Unidade Operacional'},{k:'regiao',l:'Região'}],
  avaliadores:[{k:'nome',l:'Nome do Avaliador',req:true}],
  motivos:[{k:'nome',l:'Motivo',req:true}],
  candidatos:[{k:'nome',l:'Nome Completo',req:true},{k:'cpf',l:'CPF/Matrícula',req:true},{k:'email',l:'E-mail',req:true,type:'email'},{k:'estado',l:'Estado',req:true},{k:'cidade',l:'Cidade',req:true}]
};

function Cadastros({mobile,toast_,cw,canDel}){
  const [tab,setTab]=useState(0);
  const [data,setData]=useState({});
  const [loading,setLoading]=useState({});
  const [showModal,setShowModal]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);
  const [confirmBulkDel,setConfirmBulkDel]=useState(null);
  const [saving,setSaving]=useState(false);
  const [sortKey,setSortKey]=useState(null);const [sortDir,setSortDir]=useState('asc');
  const [page,setPage]=useState(0);const PER=20;
  const toggleSort=k=>{if(sortKey===k){setSortDir(d=>d==='asc'?'desc':'asc');}else{setSortKey(k);setSortDir('asc');}};
  const SortIcon=({k})=><span style={{fontSize:10,marginLeft:4,opacity:sortKey===k?1:.2}}>{sortKey===k?(sortDir==='asc'?'▲':'▼'):'▼'}</span>;
  const [selected,setSelected]=useState(new Set());
  const bulkDel=async()=>{
    const ids=[...selected];
    if(!ids.length)return;
    setConfirmBulkDel(null);
    const r=await api('cadastros',{method:'POST',body:JSON.stringify({_bulkDelete:ids})});
    if(r.ok)toast_(`${r.ok} registro(s) excluído(s)`);
    if(r.err)toast_(`${r.err} erro(s) ao excluir`,'error');
    setSelected(new Set());load(tipo);
  };
  const importRef=useRef(null);
  const photoRef=useRef(null);
  const [importProg,setImportProg]=useState(null);
  const [duplicatas,setDuplicatas]=useState(null);
  const acharDuplicatas=()=>{
    const itens=data[tipo]||[];
    const grupos={};
    itens.forEach(item=>{
      if(tipo==='candidatos'){
        const chave=(item.nome||'')+'|'+(item.cpf||'');
        if(!grupos[chave])grupos[chave]=[];
        grupos[chave].push(item);
      }else if(tipo==='processos'){
        const chave=(item.processo||'')+'|'+(item.atividade||'');
        if(!grupos[chave])grupos[chave]=[];
        grupos[chave].push(item);
      }else{
        const chave=tipo==='bases'?item.base||'':tipo==='empresas'?item.nome||'':item.nome||'';
        if(!grupos[chave])grupos[chave]=[];
        grupos[chave].push(item);
      }
    });
    const dups=Object.values(grupos).filter(g=>g.length>1);
    if(!dups.length)return toast_('Nenhuma duplicata encontrada');
    setDuplicatas(dups);
  };
  const excluirDuplicatas=async()=>{
    if(!duplicatas)return;
    const ids=duplicatas.flat().map(i=>i.id);
    setDuplicatas(null);
    const r=await api('cadastros',{method:'POST',body:JSON.stringify({_bulkDelete:ids})});
    if(r.ok)toast_(`${r.ok} duplicata(s) excluída(s)`);
    if(r.err)toast_(`${r.err} erro(s)`,'error');
    load(tipo);
  };
  const tipos=Object.keys(CAD_ICON);
  const importCad=async f=>{
    try{
      const txt=await f.text();
      const arr=JSON.parse(txt);
      if(!Array.isArray(arr))return toast_('Arquivo deve conter uma lista','error');
      const total=arr.length;setImportProg({current:0,total});
      let ok=0,fail=0;
      for(const item of arr){
        try{
          const r=await api('cadastros',{method:'POST',body:JSON.stringify({tipo,...item})});
          if(!r.error)ok++;else{fail++;console.warn('Import error:',r.error,item);}
        }catch(e){fail++;console.warn('Import exception:',e,item);}
        setImportProg(p=>({...p,current:p.current+1}));
      }
      setImportProg(null);
      if(fail)toast_(`${ok} importado(s), ${fail} falha(s). Verifique o console (F12)`,'error');
      else toast_(`${ok} registros importados!`);
      load(tipo);
    }catch(e){toast_('Erro ao importar: '+e,'error');setImportProg(null);}
  };
  const downloadTemplate=()=>{
    const sample={};
    CAD_FORMS[tipo]?.forEach(c=>{sample[c.k]=c.type==='number'?'0':c.opts?c.opts[0]:'exemplo';});
    const blob=new Blob([JSON.stringify([sample],null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`template_${tipo}.json`;a.click();URL.revokeObjectURL(a.href);
  };
  const tipo=tipos[tab];

  const load=useCallback(async t=>{
    setLoading(p=>({...p,[t]:true}));
    const r=await api('cadastros?tipo='+t);
    if(Array.isArray(r))setData(p=>({...p,[t]:r}));
    setLoading(p=>({...p,[t]:false}));
  },[]);

  useEffect(()=>{load(tipo);setPage(0);setSelected(new Set());},[tipo]);

  const [form,setForm]=useState({});
  const photoCad=e=>{
    const f=e.target.files[0];if(!f)return;
    const img=new Image();const url=URL.createObjectURL(f);
    img.onload=()=>{
      const max=600;let w=img.width,h=img.height;
      if(w>max||h>max){const r=Math.min(max/w,max/h);w*=r;h*=r;}
      const c=document.createElement('canvas');c.width=w;c.height=h;
      const ctx=c.getContext('2d');ctx.drawImage(img,0,0,w,h);
      setForm(p=>({...p,foto:c.toDataURL('image/jpeg',.7)}));
      URL.revokeObjectURL(url);
    };
    img.src=url;
  };
  const openForm=(item)=>{
    if(item){
      const f={};
      CAD_FORMS[tipo].forEach(c=>{f[c.k]=item[c.k]||'';});
      if(tipo==='candidatos')f.foto=item.foto||'';
      f._id=item.id;
      setEditItem(item);
      setForm(f);
    }else{
      const f={};CAD_FORMS[tipo].forEach(c=>{f[c.k]='';});
      if(tipo==='candidatos')f.foto='';
      setEditItem(null);
      setForm(f);
    }
    setShowModal(true);
  };

  const save=async()=>{
    if(tipo==='candidatos'){
      if(!form.nome||!form.cpf||!form.email||!form.estado||!form.cidade)return toast_('Preencha todos os campos obrigatórios','error');
    }else if(tipo==='processos'){
      if(!form.processo||!form.cargo||!form.atividade||!form.valorBaremo)return toast_('Preencha todos os campos obrigatórios (Processo, Cargo, Atividade, Baremo)','error');
    }else if(!form.nome&&tipo!=='empresas'&&tipo!=='bases')return toast_('Preencha o nome','error');
    setSaving(true);
    const body=editItem?{id:editItem.id,...form}:{tipo,...form};
    const method=editItem?'PUT':'POST';
    const r=await api('cadastros',{method,body:JSON.stringify(body)});
    setSaving(false);
    if(r.error)return toast_(r.error,'error');
    toast_(editItem?'Cadastro atualizado!':'Cadastro criado!');
    setShowModal(false);
    load(tipo);
  };

  const del=async()=>{
    if(!confirmDel)return;
    const r=await api('cadastros?id='+confirmDel.id,{method:'DELETE'});
    if(r.error)return toast_(r.error,'error');
    toast_('Cadastro excluído');
    setConfirmDel(null);
    load(tipo);
  };

  const formatVal=(item,col)=>{
    if(col.k==='valor')return item.valor!==undefined&&item.valor!==''?`R$ ${parseFloat(item.valor).toFixed(2)}`:'—';
    if(col.k==='associado')return item.associado==='SIM'||item.associado===true?'SIM':'NÃO';
    if(col.k==='atividades')return Array.isArray(item.atividades)?`${item.atividades.length} atividades`:'—';
    if(col.k==='foto')return item.foto?<img src={item.foto} style={{width:32,height:32,borderRadius:'50%',objectFit:'cover'}}/>:'—';
    if(col.k==='valorBaremo')return item.valorBaremo!==undefined&&item.valorBaremo!==''?parseFloat(item.valorBaremo).toFixed(2):'—';
    return item[col.k]||'—';
  };

  const [q,setQ]=useState('');
  const sortedData=useMemo(()=>{
    const arr=data[tipo]||[];
    if(!sortKey)return arr;
    return[...arr].sort((a,b)=>{
      const va=(a[sortKey]||'').toString().toLowerCase(),vb=(b[sortKey]||'').toString().toLowerCase();
      return sortDir==='asc'?va.localeCompare(vb):vb.localeCompare(va);
    });
  },[data[tipo],sortKey,sortDir]);
  const filteredData=useMemo(()=>{
    if(!q)return sortedData;
    const lq=q.toLowerCase();
    return sortedData.filter(item=>CAD_COLS[tipo].some(c=>(item[c.k]||'').toString().toLowerCase().includes(lq)));
  },[sortedData,q,tipo]);
  const pages=Math.ceil(filteredData.length/PER);
  const pagedData=filteredData.slice(page*PER,(page+1)*PER);
  const [paginaInput,setPaginaInput]=useState('');
  const goToPage=v=>{const p=Math.max(0,Math.min(pages-1,(parseInt(v)||1)-1));setPage(p);setPaginaInput('');};
  const paginacao=<div className="fu3" style={{display:'flex',justifyContent:'center',alignItems:'center',gap:6,margin:'8px 0'}}>
    <button className="btn sm" disabled={page===0} onClick={()=>setPage(0)}>««</button>
    <button className="btn sm" disabled={page===0} onClick={()=>setPage(p=>p-1)}>‹ Anterior</button>
    <span style={{fontSize:13,color:'var(--text3)',fontFamily:'var(--mono)',display:'flex',alignItems:'center',gap:4}}>
      Página <input className="field" style={{width:44,textAlign:'center',padding:'2px 4px',fontSize:12,minHeight:0,height:24,fontFamily:'var(--mono)'}} value={paginaInput} onChange={e=>setPaginaInput(e.target.value.replace(/\D/g,''))} onKeyDown={e=>{if(e.key==='Enter')goToPage(paginaInput);if(e.key==='Escape')setPaginaInput('');}} onBlur={()=>paginaInput&&goToPage(paginaInput)} placeholder={page+1}/> de {pages}
    </span>
    <button className="btn sm" disabled={page>=pages-1} onClick={()=>setPage(p=>p+1)}>Próxima ›</button>
    <button className="btn sm" disabled={page>=pages-1} onClick={()=>setPage(pages-1)}>»»</button>
  </div>;
  return(<div>
    <div className="fu" style={{marginBottom:24}}>
      <h1 style={{fontSize:24,fontWeight:700}}>Cadastros</h1>
      <p style={{fontSize:14,color:'var(--text3)',marginTop:4}}>Gerenciar tabelas auxiliares</p>
    </div>
    <div className="tab-bar fu1" style={{marginBottom:20,flexWrap:'wrap'}}>
      {tipos.map((t,i)=><button key={t} className={`tab${tab===i?' active':''}`} onClick={()=>setTab(i)}>
        <span style={{marginRight:6}}>{CAD_ICON[t]}</span>{t.charAt(0).toUpperCase()+t.slice(1)}
      </button>)}
    </div>
    {importProg&&<div className="fu2" style={{padding:'12px 16px',background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--r)',marginBottom:16,display:'flex',alignItems:'center',gap:12}}>
      <div className="progress" style={{flex:1,height:8}}><div className="progress-fill" style={{width:Math.round(importProg.current/importProg.total*100)+'%',background:'linear-gradient(90deg,#5930E2,#9B7FFF)',transition:'width .3s ease'}}/></div>
      <span style={{fontSize:12,fontWeight:600,color:'var(--text2)',whiteSpace:'nowrap',fontFamily:'var(--mono)'}}>{importProg.current}/{importProg.total}</span>
    </div>}
    <div className="card fu2" style={{padding:0,overflow:'hidden'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'1rem 1.25rem',borderBottom:'1px solid var(--border)'}}>
        <p style={{fontSize:13,fontWeight:600,color:'var(--text2)'}}>
          {CAD_ICON[tipo]} {tipo.charAt(0).toUpperCase()+tipo.slice(1)}
          <span style={{fontWeight:400,color:'var(--text3)',marginLeft:8}}>{filteredData.length?`${page*PER+1}-${Math.min((page+1)*PER,filteredData.length)} de `:''}{filteredData.length} registros</span>
        </p>
        <div style={{position:'relative',flex:1,maxWidth:260,minWidth:140,margin:'0 12px'}}>
          <div style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--text3)',pointerEvents:'none',fontSize:13}}>{ICON.search}</div>
          <input className="field" style={{paddingLeft:30,fontSize:13,height:34}} placeholder="Buscar..." value={q} onChange={e=>{setQ(e.target.value);setPage(0);}}/>
          {q&&<button className="btn ghost icon" style={{position:'absolute',right:4,top:'50%',transform:'translateY(-50%)',padding:2}} onClick={()=>{setQ('');setPage(0);}}>{ICON.x}</button>}
        </div>
        <div style={{display:'flex',gap:6}}>
          {cw&&<>{selected.size>0&&canDel&&<button className="btn sm danger" onClick={()=>setConfirmBulkDel(selected.size)}>{ICON.trash}Excluir {selected.size}</button>}
          <input ref={importRef} type="file" accept=".json" style={{display:'none'}} onChange={e=>{if(e.target.files[0])importCad(e.target.files[0]);e.target.value='';}}/>
          <input ref={photoRef} type="file" accept="image/*" style={{display:'none'}} onChange={photoCad}/>
          <button className="btn sm amber-btn" onClick={()=>importRef.current?.click()}>{ICON.up}Importar</button>
          <button className="btn sm ghost" onClick={downloadTemplate}>{ICON.down}Template</button>
          {sortedData.length>0&&<button className="btn sm ghost" onClick={()=>{const blob=new Blob([JSON.stringify(sortedData,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`export_${tipo}.json`;a.click();URL.revokeObjectURL(a.href);}}>{ICON.down}Exportar</button>}
          {canDel&&sortedData.length>0&&<button className="btn sm ghost" style={{color:'var(--warning)'}} onClick={acharDuplicatas}>{ICON.search}Duplicatas</button>}</>}
          {cw&&<button className="btn primary sm" onClick={()=>openForm(null)}>{ICON.plus}Adicionar</button>}
        </div>
      </div>
      {pages>1&&paginacao}
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            {canDel&&<th className="th" style={{width:36}}>
              <input type="checkbox" style={{cursor:'pointer'}} checked={pagedData.length>0&&selected.size===pagedData.length&&selected.size===filteredData.length} onChange={e=>setSelected(e.target.checked?new Set(filteredData.map(r=>r.id)):new Set())}/>
            </th>}
            {CAD_COLS[tipo].map(c=>{
              const w=c.k==='nome'||c.k==='empresa'||c.k==='processo'||c.k==='base'||c.k==='atividade'?{minWidth:120}:c.k==='valor'?{width:90}:c.k==='valorBaremo'?{width:70}:c.k==='it'?{minWidth:100}:c.k==='unicos'?{minWidth:120}:c.k==='foto'?{width:50}:c.k==='cpf'?{minWidth:100}:c.k==='email'?{minWidth:140}:c.k==='estado'?{width:40}:{};
              return <th key={c.k} className="th" style={{...w,cursor:'pointer',fontSize:12}} onClick={()=>toggleSort(c.k)}>{c.l}<SortIcon k={c.k}/></th>;
            })}
            <th className="th" style={{width:80,textAlign:'right'}}>Ações</th>
          </tr></thead>
          <tbody>
            {loading[tipo]?[1,2,3].map(i=><tr key={i}>
              {canDel&&<td className="td"><Skeleton h={14} w="16px" r="4" m="0"/></td>}
              {CAD_COLS[tipo].map(c=><td key={c.k} className="td"><Skeleton h={14} w={c.k==='valor'||c.k==='valorBaremo'?'60px':c.k==='foto'?'32px':'140px'} r={c.k==='foto'?'50%':'4'} m="0"/></td>)}
              <td className="td"><Skeleton h={14} w="60px" r="4" m="0"/></td>
            </tr>):filteredData.length?pagedData.map(item=><tr key={item.id} style={{background:selected.has(item.id)?'rgba(89,48,226,.04)':''}}>
              {canDel&&<td className="td" style={{width:36}}><input type="checkbox" checked={selected.has(item.id)} onChange={e=>{const s=new Set(selected);e.target.checked?s.add(item.id):s.delete(item.id);setSelected(s);}}/></td>}
              {CAD_COLS[tipo].map(c=><td key={c.k} className="td" style={{fontWeight:c.k==='nome'||c.k==='empresa'||c.k==='processo'||c.k==='atividade'||c.k==='base'?600:400,fontSize:12,textAlign:c.k==='foto'||c.k==='valorBaremo'?'center':'left',maxWidth:c.k==='nome'||c.k==='empresa'||c.k==='processo'||c.k==='base'||c.k==='atividade'?160:c.k==='it'?120:c.k==='unicos'?140:void 0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{formatVal(item,c)}</td>)}
              <td className="td" style={{textAlign:'right'}}>
                <div style={{display:'flex',gap:4,justifyContent:'flex-end'}}>
                  {cw&&<button className="btn sm icon" onClick={()=>openForm(item)}>{ICON.edit}</button>}
                  {canDel&&<button className="btn sm icon danger" onClick={()=>setConfirmDel(item)}>{ICON.trash}</button>}
                </div>
              </td>
            </tr>):<tr><td colSpan={CAD_COLS[tipo].length+1+(canDel?1:0)} style={{textAlign:'center',padding:'3rem'}}>
              <EmptyState title="Nenhum registro" desc={`Nenhum cadastro de ${tipo} encontrado.`}/>
            </td></tr>}
          </tbody>
        </table>
      </div>
    </div>
    {pages>1&&paginacao}
    {duplicatas&&<div className="overlay" onClick={e=>e.target===e.currentTarget&&setDuplicatas(null)}>
      <div className="modal" style={{maxWidth:600}}>
        <div className="modal-hd"><h3 style={{fontSize:16,fontWeight:700}}>Duplicatas Encontradas</h3><button className="btn ghost icon" onClick={()=>setDuplicatas(null)}>{ICON.x}</button></div>
        <div className="modal-bd" style={{maxHeight:400,overflowY:'auto'}}>
          <p style={{fontSize:13,color:'var(--text2)',marginBottom:12}}>{duplicatas.length} grupo(s) com {duplicatas.flat().length} registros duplicados no total.</p>
          {duplicatas.map((g,i)=><div key={i} style={{padding:'8px 12px',marginBottom:8,background:'var(--surface2)',borderRadius:'var(--r-sm)',border:'1px solid var(--border)'}}>
            <p style={{fontSize:12,fontWeight:600,color:'var(--warning)',marginBottom:4}}>Grupo {i+1} · {g.length} registros</p>
            {g.map((item,j)=><p key={j} style={{fontSize:12,color:'var(--text2)',fontFamily:'var(--mono)',paddingLeft:8}}>{item.nome||item.processo||item.base||item.nome||'?'}{item.cpf?` (CPF: ${item.cpf})`:''}{item.atividade?` · ${item.atividade}`:''}</p>)}
          </div>)}
        </div>
        <div className="modal-bd" style={{display:'flex',gap:8,justifyContent:'flex-end',borderTop:'1px solid var(--border)',paddingTop:12}}>
          <button className="btn" onClick={()=>setDuplicatas(null)}>Cancelar</button>
          <button className="btn danger" onClick={excluirDuplicatas}>{ICON.trash}Excluir {duplicatas.flat().length} duplicatas</button>
        </div>
      </div>
    </div>}
    <ConfirmModal show={confirmDel} title="Excluir Cadastro" msg={`Excluir "${confirmDel?.nome||confirmDel?.processo||confirmDel?.base||confirmDel?.[Object.keys(confirmDel||{})[0]]||'?'}"?`} onConfirm={del} onCancel={()=>setConfirmDel(null)}/>
    <ConfirmModal show={confirmBulkDel} title="Excluir Cadastros" msg={`Excluir ${confirmBulkDel} registro(s) permanentemente?`} onConfirm={bulkDel} onCancel={()=>setConfirmBulkDel(null)}/>
    {showModal&&<div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
      <div className="modal">
        <div className="modal-hd">
          <div><h3 style={{fontSize:16,fontWeight:700}}>{editItem?'Editar':'Novo'} {tipo.charAt(0).toUpperCase()+tipo.slice(1)}</h3></div>
          <button className="btn ghost icon" onClick={()=>setShowModal(false)}>{ICON.x}</button>
        </div>
        <div className="modal-bd">
          {CAD_FORMS[tipo].map(c=>(
            c.opts?<div key={c.k}>
              <label className="label">{c.l}{c.req&&<span className="req">*</span>}</label>
              <select className="field" value={form[c.k]||''} onChange={e=>setForm(p=>({...p,[c.k]:e.target.value}))}>
                <option value="">Selecionar...</option>
                {c.opts.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            </div>:<div key={c.k}>
              <label className="label">{c.l}{c.req&&<span className="req">*</span>}</label>
              <input className="field" type={c.type||'text'} value={form[c.k]||''} onChange={e=>{const v=e.target.value;setForm(p=>({...p,[c.k]:c.k==='cpf'?v.replace(/\D/g,''):v}))}} placeholder={c.l}/>
            </div>
          ))}
          {tipo==='candidatos'&&<div>
            <label className="label">Foto <span style={{fontSize:11,color:'var(--text3)',fontWeight:400}}>(opcional)</span></label>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              {form.foto?<img src={form.foto} style={{width:56,height:56,borderRadius:'50%',objectFit:'cover',border:'2px solid var(--primary)'}}/>:<div style={{width:56,height:56,borderRadius:'50%',background:'var(--surface2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,color:'var(--text3)'}}>📷</div>}
              <div>
                <button className="btn sm" onClick={()=>photoRef.current.click()}>{ICON.cam}Selecionar Foto</button>
                {form.foto&&<button className="btn ghost sm" style={{color:'var(--danger)',fontSize:12}} onClick={()=>setForm(p=>({...p,foto:''}))}>Remover</button>}
              </div>
            </div>
          </div>}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:8}}>
            <button className="btn" onClick={()=>setShowModal(false)} disabled={saving}>Cancelar</button>
            <button className="btn primary" onClick={save} disabled={saving}>{saving?<><Spin/>Salvando...</>:<>{ICON.save}Salvar</>}</button>
          </div>
        </div>
      </div>
    </div>}
  </div>);
}

function AdminDash({mobile,user,toast_}){
  const [data,setData]=useState([]);const [loading,setLoading]=useState(true);
  const [cliente,setCliente]=useState(null);const [requests,setRequests]=useState([]);
  const [showSolicitar,setShowSolicitar]=useState(false);const [qtdSolicitar,setQtdSolicitar]=useState(1);const [motivoSolicitar,setMotivoSolicitar]=useState('');

  useEffect(()=>{
    Promise.all([
      api('records'),
      user.clienteId?api('clientes?id='+user.clienteId):null,
      api('licencas'),
    ]).then(([recs,cli,reqs])=>{
      if(Array.isArray(recs))setData(recs);
      if(cli)setCliente(cli);
      if(Array.isArray(reqs))setRequests(reqs);
      setLoading(false);
    });
  },[]);

  const slotsLivres=cliente?(cliente.slotsTotal||0)-(cliente.slotsUsados||0):0;
  const baixaLicenca=slotsLivres<=3&&slotsLivres>0;

  const solicitar=async()=>{
    const r=await api('licencas',{method:'POST',body:JSON.stringify({quantidade:qtdSolicitar,motivo:motivoSolicitar})});
    if(r.error)return toast_(r.error,'error');
    toast_('Solicitação enviada com sucesso!');
    setShowSolicitar(false);setQtdSolicitar(1);setMotivoSolicitar('');
    const r2=await api('licencas');if(Array.isArray(r2))setRequests(r2);
  };

  const total=data.length,aprov=data.filter(r=>r.resultadoFinal==='APROVADO'||r.resultadoFinal==='APROVADO 2').length,reprov=data.filter(r=>r.resultadoFinal==='REPROVADO').length,pend=total-aprov-reprov,tx=total?Math.round(aprov/total*100):0;

  return(<div>
    <div className="fu" style={{marginBottom:24}}><h1 style={{fontSize:24,fontWeight:700}}>Meu Painel</h1><p style={{fontSize:14,color:'var(--text3)',marginTop:4}}>Visão geral do seu cliente</p></div>

    {loading?<div className="fu1" style={{display:'grid',gridTemplateColumns:mobile?'1fr 1fr':'repeat(4,1fr)',gap:13,marginBottom:20}}>
      {[1,2,3,4].map(i=><div key={i} style={{background:'var(--surface)',borderRadius:'var(--r)',padding:'1.25rem',border:'1px solid var(--border)'}}><Skeleton h={32} w="50px" m="0 0 6px 0"/><Skeleton h={14} w="80px" m="0"/></div>)}
    </div>:<><div className="fu1" style={{display:'grid',gridTemplateColumns:mobile?'1fr 1fr 1fr':'repeat(4,1fr)',gap:13,marginBottom:20}}>
      <div style={{background:'linear-gradient(135deg,#059669,#2EAA5C)',borderRadius:'var(--r)',padding:'1.25rem',boxShadow:'0 6px 20px rgba(5,150,105,.3)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:-10,top:-10,width:66,height:66,background:'rgba(255,255,255,.1)',borderRadius:'50%'}}/>
        <div style={{fontSize:28,fontWeight:800,color:'#fff'}}>{cliente?.slotsUsados||0}<span style={{fontSize:16}}>/{cliente?.slotsTotal||0}</span></div>
        <div style={{fontSize:12.5,color:'rgba(255,255,255,.75)',marginTop:3,fontWeight:500}}>Slots Utilizados</div>
      </div>
      <div style={{background:baixaLicenca?'linear-gradient(135deg,#D97706,#F59E0B)':'linear-gradient(135deg,#5930E2,#7C5CFF)',borderRadius:'var(--r)',padding:'1.25rem',boxShadow:baixaLicenca?'0 6px 20px rgba(217,119,6,.3)':'0 6px 20px rgba(89,48,226,.3)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:-10,top:-10,width:66,height:66,background:'rgba(255,255,255,.1)',borderRadius:'50%'}}/>
        <div style={{fontSize:28,fontWeight:800,color:'#fff'}}>{slotsLivres}</div>
        <div style={{fontSize:12.5,color:'rgba(255,255,255,.75)',marginTop:3,fontWeight:500}}>Slots Disponíveis</div>
      </div>
      <div style={{background:'linear-gradient(135deg,#DC2626,#EF4444)',borderRadius:'var(--r)',padding:'1.25rem',boxShadow:'0 6px 20px rgba(220,38,38,.3)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:-10,top:-10,width:66,height:66,background:'rgba(255,255,255,.1)',borderRadius:'50%'}}/>
        <div style={{fontSize:28,fontWeight:800,color:'#fff'}}>{total}</div>
        <div style={{fontSize:12.5,color:'rgba(255,255,255,.75)',marginTop:3,fontWeight:500}}>Avaliações</div>
      </div>
      <div style={{background:'linear-gradient(135deg,#7C3AED,#8B5CF6)',borderRadius:'var(--r)',padding:'1.25rem',boxShadow:'0 6px 20px rgba(124,58,237,.3)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:-10,top:-10,width:66,height:66,background:'rgba(255,255,255,.1)',borderRadius:'50%'}}/>
        <div style={{fontSize:28,fontWeight:800,color:'#fff'}}>{tx}<span style={{fontSize:16}}>%</span></div>
        <div style={{fontSize:12.5,color:'rgba(255,255,255,.75)',marginTop:3,fontWeight:500}}>Aprovação</div>
      </div>
    </div>
    {baixaLicenca&&<div className="fu2" style={{background:'var(--warning-bg)',border:'1px solid #FDE68A',borderRadius:'var(--r)',padding:'1rem 1.25rem',marginBottom:20,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:24}}>⚠️</span>
        <div><p style={{fontSize:14,fontWeight:600,color:'var(--warning)'}}>Restam apenas {slotsLivres} licenças</p><p style={{fontSize:12,color:'var(--text3)'}}>Solicite mais licenças para continuar cadastrando colaboradores.</p></div>
      </div>
      <button className="btn amber-btn" onClick={()=>setShowSolicitar(true)}>Solicitar Licenças</button>
    </div>}</>}

    {requests.length>0&&<div className="card fu3" style={{padding:0,overflow:'hidden',marginBottom:20}}>
      <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid var(--border)'}}><p className="sec-h" style={{marginBottom:0}}>Solicitações Recentes</p></div>
      {requests.slice(0,5).map(r=><div key={r.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 1.25rem',borderBottom:'1px solid var(--border)'}}>
        <div><p style={{fontSize:13.5,fontWeight:600}}>+{r.quantidade} licenças</p><p style={{fontSize:12,color:'var(--text3)'}}>{new Date(r.createdAt).toLocaleDateString('pt-BR')} · {r.status}</p></div>
        <span className={`badge dot ${r.status==='APROVADO'?'green':r.status==='NEGADO'?'red':'amber'}`}>{r.status}</span>
      </div>)}
    </div>}

    <div className="card fu3">
      <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid var(--border)'}}><p className="sec-h" style={{marginBottom:0}}>Métricas de Avaliações</p></div>
      <div style={{display:'grid',gridTemplateColumns:mobile?'1fr':'1fr 1fr',gap:13,padding:'1.25rem'}}>
        <div><p style={{fontSize:13,color:'var(--text3)',marginBottom:8}}>Resultados</p>
          {[['APROVADO',aprov,'#059669'],['REPROVADO',reprov,'#DC2626'],['PENDENTE',pend,'#D97706']].map(([l,n,c])=><div key={l} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:13.5}}>
            <span>{l}</span><span style={{fontWeight:700,color:c}}>{n}</span>
          </div>)}
        </div>
        <div><p style={{fontSize:13,color:'var(--text3)',marginBottom:8}}>Progresso</p>
          <div style={{display:'flex',flexDirection:'column',justifyContent:'center',height:'80%'}}>
            <div style={{fontSize:48,fontWeight:800,color:'#059669',lineHeight:1}}>{tx}<span style={{fontSize:24}}>%</span></div>
            <div className="progress" style={{marginTop:12,height:10}}><div className="progress-fill" style={{width:tx+'%',background:'linear-gradient(90deg,#059669,#34D399)'}}/></div>
            <p style={{fontSize:12,color:'var(--text3)',marginTop:6}}>{aprov} aprovados de {total}</p>
          </div>
        </div>
      </div>
    </div>

    {showSolicitar&&<div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowSolicitar(false)}>
      <div className="modal" style={{maxWidth:420}}>
        <div className="modal-hd"><h3 style={{fontSize:16,fontWeight:700}}>Solicitar Licenças</h3><button className="btn ghost icon" onClick={()=>setShowSolicitar(false)}>{ICON.x}</button></div>
        <div className="modal-bd">
          <p style={{fontSize:13,color:'var(--text2)',marginBottom:8}}>Atualmente você possui <strong>{slotsLivres}</strong> slots disponíveis de <strong>{cliente?.slotsTotal||0}</strong>.</p>
          <div><label className="label">Quantidade</label>
            <input className="field" type="number" min="1" value={qtdSolicitar} onChange={e=>setQtdSolicitar(Math.max(1,parseInt(e.target.value)||1))}/>
          </div>
          <div><label className="label">Motivo</label>
            <textarea className="field" rows={3} value={motivoSolicitar} onChange={e=>setMotivoSolicitar(e.target.value)} placeholder="Descreva o motivo da solicitação..." style={{resize:'vertical'}}/>
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button className="btn" onClick={()=>setShowSolicitar(false)}>Cancelar</button>
            <button className="btn primary" onClick={solicitar}>{ICON.save}Enviar Solicitação</button>
          </div>
        </div>
      </div>
    </div>}
  </div>);
}

function Clientes({user,toast_}){
  const [data,setData]=useState([]);const [loading,setLoading]=useState(true);
  const [show,setShow]=useState(false);const [editItem,setEditItem]=useState(null);const [saving,setSaving]=useState(false);
  const [confirmDel,setConfirmDel]=useState(null);
  const [form,setForm]=useState({nome:'',documento:'',email:'',contato:'',slotsTotal:5,valorSlot:0});

  const load=()=>{setLoading(true);api('clientes').then(r=>{if(Array.isArray(r))setData(r);setLoading(false);});};
  useEffect(()=>{load();},[]);

  const openForm=item=>{
    if(item){setForm({nome:item.nome,documento:item.documento||'',email:item.email||'',contato:item.contato||'',slotsTotal:item.slotsTotal||0,valorSlot:item.valorSlot||0});setEditItem(item);}
    else{setForm({nome:'',documento:'',email:'',contato:'',slotsTotal:5,valorSlot:0});setEditItem(null);}
    setShow(true);
  };

  const save=async()=>{
    if(!form.nome)return toast_('Nome do cliente obrigatório','error');
    setSaving(true);
    const body=editItem?{id:editItem.id,...form}:form;
    const method=editItem?'PUT':'POST';
    const r=await api('clientes',{method,body:JSON.stringify(body)});
    setSaving(false);
    if(r.error)return toast_(r.error,'error');
    if(editItem)setData(prev=>prev.map(x=>x.id===editItem.id?{...x,...r}:x));
    else if(r.id)setData(prev=>[...prev,r]);
    toast_(editItem?'Cliente atualizado!':'Cliente criado!');
    setShow(false);
  };

  const del=async()=>{
    if(!confirmDel)return;
    await api('clientes?id='+confirmDel.id,{method:'DELETE'});
    toast_('Cliente excluído');setConfirmDel(null);load();
  };

  const receitaTotal=data.reduce((s,c)=>s+((c.slotsTotal||0)*(c.valorSlot||0)),0);

  return(<div>
    <div className="fu" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,flexWrap:'wrap',gap:12}}>
      <div><h1 style={{fontSize:24,fontWeight:700}}>Clientes</h1><p style={{fontSize:14,color:'var(--text3)',marginTop:4}}>{data.length} clientes · Receita Total: <strong style={{color:'#059669'}}>R$ {receitaTotal.toFixed(2)}</strong></p></div>
      <button className="btn primary" onClick={()=>openForm(null)}>{ICON.uplus}Novo Cliente</button>
    </div>
    <div className="card fu1" style={{padding:0,overflow:'hidden',marginTop:4}}>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:700}}>
          <thead><tr>
            <th className="th">Cliente</th><th className="th">Documento</th><th className="th">Contato</th>
            <th className="th" style={{textAlign:'center'}}>Slots</th><th className="th" style={{textAlign:'center'}}>Usados</th>
            <th className="th" style={{textAlign:'right'}}>Valor/Slot</th><th className="th" style={{textAlign:'right'}}>Receita</th>
            <th className="th" style={{textAlign:'center'}}>Status</th><th className="th" style={{textAlign:'right',width:80}}>Ações</th>
          </tr></thead>
          <tbody>
            {loading?[1,2,3].map(i=><tr key={i}>{[1,2,3,4,5,6,7,8,9].map(j=><td key={j} className="td"><Skeleton h={14} w={j===3||j===4?'40px':j>=5?'70px':'120px'} r="4" m="0"/></td>)}</tr>):data.map(c=><tr key={c.id}>
              <td className="td" style={{fontWeight:600}}>{c.nome}</td>
              <td className="td" style={{fontSize:12,fontFamily:'var(--mono)'}}>{c.documento||'—'}</td>
              <td className="td" style={{fontSize:13,color:'var(--text2)'}}>{c.email||'—'}<br/>{c.contato||''}</td>
              <td className="td" style={{textAlign:'center',fontWeight:700,fontSize:15}}>{c.slotsTotal||0}</td>
              <td className="td" style={{textAlign:'center'}}>
                <span style={{color:c.slotsUsados>=(c.slotsTotal||1)*0.9?'var(--danger)':'var(--text2)',fontWeight:600}}>{c.slotsUsados||0}</span>
                {c.slotsTotal>0&&<div className="progress" style={{marginTop:4,height:5,maxWidth:80,marginLeft:'auto',marginRight:'auto'}}>
                  <div className="progress-fill" style={{width:Math.min(100,((c.slotsUsados||0)/(c.slotsTotal||1)*100))+'%',background:((c.slotsUsados||0)>=c.slotsTotal)?'#DC2626':'linear-gradient(90deg,#5930E2,#9B7FFF)'}}/>
                </div>}
              </td>
              <td className="td" style={{textAlign:'right',fontSize:13}}>R$ {parseFloat(c.valorSlot||0).toFixed(2)}</td>
              <td className="td" style={{textAlign:'right',fontWeight:700,color:'#059669'}}>R$ {((c.slotsTotal||0)*(c.valorSlot||0)).toFixed(2)}</td>
              <td className="td" style={{textAlign:'center'}}><span className={`badge dot ${c.status==='ATIVO'?'green':'gray'}`}>{c.status||'ATIVO'}</span></td>
              <td className="td" style={{textAlign:'right'}}>
                <div style={{display:'flex',gap:4,justifyContent:'flex-end'}}>
                  <button className="btn sm icon" onClick={()=>openForm(c)}>{ICON.edit}</button>
                  <button className="btn sm icon danger" onClick={()=>setConfirmDel(c)}>{ICON.trash}</button>
                </div>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
    <ConfirmModal show={confirmDel} title="Excluir Cliente" msg={`Excluir "${confirmDel?.nome}" e todos os seus usuários?`} onConfirm={del} onCancel={()=>setConfirmDel(null)}/>
    {show&&<div className="overlay" onClick={e=>e.target===e.currentTarget&&setShow(false)}>
      <div className="modal">
        <div className="modal-hd">
          <div><h3 style={{fontSize:16,fontWeight:700}}>{editItem?'Editar':'Novo'} Cliente</h3></div>
          <button className="btn ghost icon" onClick={()=>setShow(false)}>{ICON.x}</button>
        </div>
        <div className="modal-bd">
          <div><label className="label">Nome do Cliente *</label><input className="field" value={form.nome} onChange={e=>setForm(p=>({...p,nome:e.target.value}))} placeholder="Razão social"/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:13}}>
            <div><label className="label">Documento (CNPJ/CPF)</label><input className="field" value={form.documento} onChange={e=>setForm(p=>({...p,documento:e.target.value}))} placeholder="Apenas números"/></div>
            <div><label className="label">Contato</label><input className="field" value={form.contato} onChange={e=>setForm(p=>({...p,contato:e.target.value}))} placeholder="Nome do contato"/></div>
          </div>
          <div><label className="label">Email</label><input className="field" type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="email@cliente.com"/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:13}}>
            <div><label className="label">Total de Slots (Licenças) *</label><input className="field" type="number" min="1" value={form.slotsTotal} onChange={e=>setForm(p=>({...p,slotsTotal:parseInt(e.target.value)||0}))}/></div>
            <div><label className="label">Valor por Slot (R$)</label><input className="field" type="number" step="0.01" min="0" value={form.valorSlot} onChange={e=>setForm(p=>({...p,valorSlot:parseFloat(e.target.value)||0}))}/></div>
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:8}}>
            <button className="btn" onClick={()=>setShow(false)} disabled={saving}>Cancelar</button>
            <button className="btn primary" onClick={save} disabled={saving}>{saving?<><Spin/>Salvando...</>:<>{ICON.save}Salvar</>}</button>
          </div>
        </div>
      </div>
    </div>}
  </div>);
}

function Licencas({user,toast_}){
  const [requests,setRequests]=useState([]);const [cliente,setCliente]=useState(null);
  const [loading,setLoading]=useState(true);
  const [showSolicitar,setShowSolicitar]=useState(false);
  const [qtdSolicitar,setQtdSolicitar]=useState(1);const [motivoSolicitar,setMotivoSolicitar]=useState('');

  const load=()=>{Promise.all([api('licencas'),user.clienteId?api('clientes?id='+user.clienteId):null]).then(([r,c])=>{if(Array.isArray(r))setRequests(r);if(c)setCliente(c);setLoading(false);});};
  useEffect(()=>{load();},[]);

  const slotsLivres=(cliente?.slotsTotal||0)-(cliente?.slotsUsados||0);

  const solicitar=async()=>{
    if(!qtdSolicitar||qtdSolicitar<1)return toast_('Informe a quantidade','error');
    const r=await api('licencas',{method:'POST',body:JSON.stringify({quantidade:qtdSolicitar,motivo:motivoSolicitar})});
    if(r.error)return toast_(r.error,'error');
    toast_('Solicitação enviada!');setShowSolicitar(false);setQtdSolicitar(1);setMotivoSolicitar('');load();
  };

  return(<div>
    <div className="fu" style={{marginBottom:24}}><h1 style={{fontSize:24,fontWeight:700}}>Minhas Licenças</h1><p style={{fontSize:14,color:'var(--text3)',marginTop:4}}>Gerencie suas licenças e solicitações</p></div>
    <div className="fu1" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:13,marginBottom:20}}>
      <div style={{background:'linear-gradient(135deg,#6C3BF5,#8B5CF6)',borderRadius:'var(--r)',padding:'1.25rem',boxShadow:'0 6px 20px rgba(108,59,245,.3)'}}>
        <div style={{fontSize:28,fontWeight:800,color:'#fff'}}>{cliente?.slotsTotal||0}</div>
        <div style={{fontSize:12.5,color:'rgba(255,255,255,.75)'}}>Total de Licenças</div>
      </div>
      <div style={{background:'linear-gradient(135deg,#059669,#34D399)',borderRadius:'var(--r)',padding:'1.25rem',boxShadow:'0 6px 20px rgba(5,150,105,.3)'}}>
        <div style={{fontSize:28,fontWeight:800,color:'#fff'}}>{cliente?.slotsUsados||0}</div>
        <div style={{fontSize:12.5,color:'rgba(255,255,255,.75)'}}>Em Uso</div>
      </div>
      <div style={{background:slotsLivres<=3?'linear-gradient(135deg,#F59E0B,#FBBF24)':'linear-gradient(135deg,#059669,#34D399)',borderRadius:'var(--r)',padding:'1.25rem',boxShadow:'0 6px 20px rgba(245,158,11,.3)'}}>
        <div style={{fontSize:28,fontWeight:800,color:'#fff'}}>{slotsLivres}</div>
        <div style={{fontSize:12.5,color:'rgba(255,255,255,.75)'}}>Disponíveis</div>
      </div>
    </div>
    <div className="fu2" style={{display:'flex',justifyContent:'flex-end',marginBottom:16,gap:8}}>
      <button className="btn primary" onClick={()=>setShowSolicitar(true)} disabled={slotsLivres>=cliente?.slotsTotal}>{ICON.plus}Solicitar Mais Licenças</button>
    </div>
    <div className="card fu3" style={{padding:0,overflow:'hidden'}}>
      <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid var(--border)'}}><p className="sec-h" style={{marginBottom:0}}>Histórico de Solicitações</p></div>
      {loading?<div style={{padding:'1rem'}}><Skeleton h={14} w="100%" r="4" m="0 0 8px 0"/><Skeleton h={14} w="80%" r="4" m="0"/></div>:requests.length?requests.map((r,i)=><div key={r.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 1.25rem',borderBottom:i<requests.length-1?'1px solid var(--border)':'none'}}>
        <div><p style={{fontSize:14,fontWeight:600}}>+{r.quantidade} licenças</p><p style={{fontSize:12,color:'var(--text3)'}}>{new Date(r.createdAt).toLocaleDateString('pt-BR')} · {r.motivo||'—'}</p></div>
        <span className={`badge dot ${r.status==='APROVADO'?'green':r.status==='NEGADO'?'red':'amber'}`}>{r.status}</span>
      </div>):<div style={{padding:'1.5rem',textAlign:'center',color:'var(--text3)',fontSize:13}}>Nenhuma solicitação ainda.</div>}
    </div>
    {showSolicitar&&<div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowSolicitar(false)}>
      <div className="modal" style={{maxWidth:440}}>
        <div className="modal-hd"><h3 style={{fontSize:16,fontWeight:700}}>Solicitar Mais Licenças</h3><button className="btn ghost icon" onClick={()=>setShowSolicitar(false)}>{ICON.x}</button></div>
        <div className="modal-bd">
          <p style={{fontSize:13,color:'var(--text2)',marginBottom:4}}>Situação atual: <strong>{slotsLivres}</strong> slots disponíveis de <strong>{cliente?.slotsTotal||0}</strong> contratados · <strong>{cliente?.slotsUsados||0}</strong> em uso.</p>
          <div style={{height:6,background:'var(--surface2)',borderRadius:10,marginBottom:12,overflow:'hidden'}}>
            <div style={{height:'100%',width:cliente?.slotsTotal?Math.min(100,(cliente?.slotsUsados||0)/cliente?.slotsTotal*100)+'%':'0%',background:'linear-gradient(90deg,#6C3BF5,#8B5CF6)',borderRadius:10,transition:'width .5s'}}/>
          </div>
          <div><label className="label">Quantidade desejada *</label><input className="field" type="number" min="1" value={qtdSolicitar} onChange={e=>setQtdSolicitar(Math.max(1,parseInt(e.target.value)||1))}/></div>
          <div><label className="label">Motivo da solicitação *</label><textarea className="field" rows={3} value={motivoSolicitar} onChange={e=>setMotivoSolicitar(e.target.value)} placeholder="Descreva o motivo..." style={{resize:'vertical'}}/></div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:4}}>
            <button className="btn" onClick={()=>setShowSolicitar(false)}>Cancelar</button>
            <button className="btn primary" onClick={solicitar}>{ICON.save}Enviar Solicitação</button>
          </div>
        </div>
      </div>
    </div>}
  </div>);
}

function GestaoLicencas({user,toast_}){
  const [requests,setRequests]=useState([]);const [loading,setLoading]=useState(true);
  const [clientes,setClientes]=useState([]);
  const [actionId,setActionId]=useState(null);
  const [editarQtd,setEditarQtd]=useState(null);
  const [novaQtd,setNovaQtd]=useState(1);
  const load=()=>{setLoading(true);Promise.all([api('licencas'),api('clientes')]).then(([r,c])=>{if(Array.isArray(r))setRequests(r);if(Array.isArray(c))setClientes(c);setLoading(false);}).catch(()=>{setLoading(false);toast_('Erro ao carregar dados','error');});};
  useEffect(()=>{load();},[]);
  const aprovar=async id=>{
    setActionId(id);
    const r=await api('licencas',{method:'PUT',body:JSON.stringify({id,status:'APROVADO',observacao:'Aprovado por '+user.nome})});
    setActionId(null);
    if(r.error)return toast_(r.error,'error');
    toast_('Solicitação aprovada!');load();
  };
  const aprovarComQtd=async()=>{
    if(!editarQtd||novaQtd<1)return;
    setActionId('edit');
    const r=await api('licencas',{method:'PUT',body:JSON.stringify({id:editarQtd.id,status:'APROVADO',quantidade:novaQtd,observacao:`Aprovado por ${user.nome} (qtd ajustada: ${novaQtd})`})});
    setActionId(null);setEditarQtd(null);
    if(r.error)return toast_(r.error,'error');
    toast_(`Aprovado com ${novaQtd} licenças!`);load();
  };
  const negar=async id=>{
    const obs=prompt('Motivo da recusa:');
    if(!obs)return;
    setActionId(id);
    const r=await api('licencas',{method:'PUT',body:JSON.stringify({id,status:'NEGADO',observacao:obs})});
    setActionId(null);
    if(r.error)return toast_(r.error,'error');
    toast_('Solicitação negada.');load();
  };
  if(loading)return <div className="fu"><Skeleton h={14} w="200px" m="0 0 12px 0"/>{[1,2,3].map(i=><Skeleton key={i} h={50} w="100%" r="8" m="0 0 8px 0"/>)}</div>;
  const pendentes=requests.filter(r=>r.status==='PENDENTE');
  const historico=requests.filter(r=>r.status!=='PENDENTE');
  const slotsTotal=clientes.reduce((s,c)=>s+(c.slotsTotal||0),0);
  const slotsUsados=clientes.reduce((s,c)=>s+(c.slotsUsados||0),0);
  return(<div>
    <div className="fu" style={{marginBottom:24}}><h1 style={{fontSize:24,fontWeight:700}}>Gestão de Licenças</h1><p style={{fontSize:14,color:'var(--text3)',marginTop:3}}>{clientes.length} clientes · {slotsTotal} slots contratados · {pendentes.length} pendentes</p></div>
    <div className="fu1" style={{display:'grid',gridTemplateColumns:mobile?'1fr 1fr':'repeat(4,1fr)',gap:13,marginBottom:20}}>
      <div style={{background:'linear-gradient(135deg,#6C3BF5,#8B5CF6)',borderRadius:'var(--r)',padding:'1.25rem',boxShadow:'0 6px 20px rgba(108,59,245,.3)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:-10,top:-10,width:66,height:66,background:'rgba(255,255,255,.08)',borderRadius:'50%'}}/>
        <div style={{fontSize:28,fontWeight:800,color:'#fff'}}>{clientes.length}</div>
        <div style={{fontSize:12.5,color:'rgba(255,255,255,.75)',marginTop:3,fontWeight:500}}>Clientes</div>
      </div>
      <div style={{background:'linear-gradient(135deg,#059669,#34D399)',borderRadius:'var(--r)',padding:'1.25rem',boxShadow:'0 6px 20px rgba(5,150,105,.3)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:-10,top:-10,width:66,height:66,background:'rgba(255,255,255,.08)',borderRadius:'50%'}}/>
        <div style={{fontSize:28,fontWeight:800,color:'#fff'}}>{slotsTotal}</div>
        <div style={{fontSize:12.5,color:'rgba(255,255,255,.75)',marginTop:3,fontWeight:500}}>Slots Contratados</div>
      </div>
      <div style={{background:'linear-gradient(135deg,#7C3AED,#A78BFA)',borderRadius:'var(--r)',padding:'1.25rem',boxShadow:'0 6px 20px rgba(124,58,237,.3)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:-10,top:-10,width:66,height:66,background:'rgba(255,255,255,.08)',borderRadius:'50%'}}/>
        <div style={{fontSize:28,fontWeight:800,color:'#fff'}}>{slotsUsados}<span style={{fontSize:16}}>/{slotsTotal}</span></div>
        <div style={{fontSize:12.5,color:'rgba(255,255,255,.75)',marginTop:3,fontWeight:500}}>Slots Consumidos</div>
        {slotsTotal>0&&<div className="progress" style={{marginTop:6,height:4,background:'rgba(255,255,255,.15)'}}><div className="progress-fill" style={{width:Math.round(slotsUsados/slotsTotal*100)+'%',background:'rgba(255,255,255,.5)'}}/></div>}
      </div>
      <div style={{background:'linear-gradient(135deg,#F59E0B,#FBBF24)',borderRadius:'var(--r)',padding:'1.25rem',boxShadow:'0 6px 20px rgba(245,158,11,.3)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:-10,top:-10,width:66,height:66,background:'rgba(255,255,255,.08)',borderRadius:'50%'}}/>
        <div style={{fontSize:28,fontWeight:800,color:'#fff'}}>{pendentes.length}</div>
        <div style={{fontSize:12.5,color:'rgba(255,255,255,.75)',marginTop:3,fontWeight:500}}>Solicitações Pendentes</div>
      </div>
    </div>
    <div className="fu2" style={{display:'grid',gridTemplateColumns:mobile?'1fr':'1fr 1fr',gap:16,marginBottom:20}}>
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid var(--border)'}}><p className="sec-h" style={{marginBottom:0}}>Clientes · Slots</p></div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr><th className="th">Cliente</th><th className="th" style={{textAlign:'center'}}>Slots</th><th className="th" style={{textAlign:'center'}}>Usados</th><th className="th" style={{textAlign:'center'}}>Disponíveis</th><th className="th" style={{textAlign:'right'}}>Receita</th></tr></thead>
            <tbody>{clientes.map(c=><tr key={c.id}>
              <td className="td" style={{fontWeight:600}}>{c.nome}</td>
              <td className="td" style={{textAlign:'center',fontWeight:700}}>{c.slotsTotal||0}</td>
              <td className="td" style={{textAlign:'center'}}>
                <span style={{color:c.slotsUsados>=(c.slotsTotal||1)*0.9?'var(--danger)':'var(--text2)',fontWeight:600}}>{c.slotsUsados||0}</span>
                {c.slotsTotal>0&&<div className="progress" style={{marginTop:3,height:4,maxWidth:60,marginLeft:'auto',marginRight:'auto'}}><div className="progress-fill" style={{width:Math.min(100,((c.slotsUsados||0)/(c.slotsTotal||1)*100))+'%',background:'linear-gradient(90deg,#6C3BF5,#A78BFA)'}}/></div>}
              </td>
              <td className="td" style={{textAlign:'center',fontWeight:600,color:(c.slotsTotal||0)-(c.slotsUsados||0)<=3?'var(--warning)':'var(--success)'}}>{(c.slotsTotal||0)-(c.slotsUsados||0)}</td>
              <td className="td" style={{textAlign:'right',fontWeight:700,color:'var(--success)'}}>R$ {((c.slotsTotal||0)*(c.valorSlot||0)).toFixed(2)}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <p className="sec-h" style={{marginBottom:0}}>Solicitações Pendentes</p>
          <span className="badge amber">{pendentes.length}</span>
        </div>
        {pendentes.length?pendentes.map(r=><div key={r.id} style={{padding:'12px 1.25rem',borderBottom:'1px solid var(--border)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:8}}>
            <div style={{flex:1,minWidth:180}}>
              <p style={{fontSize:13.5,fontWeight:600}}>{r.clienteNome||'—'}</p>
              <p style={{fontSize:12.5,color:'var(--text2)',marginTop:2}}><strong>+{r.quantidade}</strong> licenças{r.motivo?` · ${r.motivo}`:''}</p>
              <p style={{fontSize:11,color:'var(--text3)',marginTop:2}}>{r.solicitadoPor||'—'} · {new Date(r.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
            <div style={{display:'flex',gap:4,flexShrink:0,alignItems:'center'}}>
              <button className="btn sm ghost" style={{fontSize:11}} onClick={()=>{setEditarQtd(r);setNovaQtd(parseInt(r.quantidade)||1);}} disabled={actionId!==null}>{ICON.edit}{r.quantidade}</button>
              <button className="btn success sm" onClick={()=>aprovar(r.id)} disabled={actionId!==null}>{actionId===r.id?<Spin c="#fff"/>:ICON.check}Aprovar</button>
              <button className="btn danger sm" onClick={()=>negar(r.id)} disabled={actionId!==null}>{ICON.x}</button>
            </div>
          </div>
        </div>):<div style={{padding:'2rem',textAlign:'center',color:'var(--text3)',fontSize:13}}>Nenhuma solicitação pendente.</div>}
      </div>
    </div>
    {editarQtd&&<div className="overlay" onClick={e=>e.target===e.currentTarget&&setEditarQtd(null)}>
      <div className="modal" style={{maxWidth:380}}>
        <div className="modal-hd"><h3 style={{fontSize:16,fontWeight:700}}>Aprovar com Ajuste</h3><button className="btn ghost icon" onClick={()=>setEditarQtd(null)}>{ICON.x}</button></div>
        <div className="modal-bd">
          <p style={{fontSize:13,color:'var(--text2)'}}>Cliente: <strong>{editarQtd.clienteNome}</strong> solicitou <strong>{editarQtd.quantidade}</strong> licenças.</p>
          <div><label className="label">Aprovar quantidade</label><input className="field" type="number" min="1" value={novaQtd} onChange={e=>setNovaQtd(Math.max(1,parseInt(e.target.value)||1))}/></div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:4}}>
            <button className="btn" onClick={()=>setEditarQtd(null)}>Cancelar</button>
            <button className="btn primary" onClick={aprovarComQtd} disabled={actionId!==null}>{actionId==='edit'?<Spin/>:ICON.check}Aprovar {novaQtd} licenças</button>
          </div>
        </div>
      </div>
    </div>}
    {historico.length>0&&<div className="card fu3" style={{padding:0,overflow:'hidden'}}>
      <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid var(--border)'}}><p className="sec-h" style={{marginBottom:0}}>Histórico Completo</p></div>
      {historico.slice(0,30).map(r=><div key={r.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 1.25rem',borderBottom:'1px solid var(--border)'}}>
        <div style={{flex:1}}>
          <p style={{fontSize:13,fontWeight:600}}>{r.clienteNome||'—'} · +{r.quantidade} licenças</p>
          <p style={{fontSize:11.5,color:'var(--text3)'}}>{new Date(r.createdAt).toLocaleDateString('pt-BR')} · {r.observacao||r.analisadoPor||''}</p>
        </div>
        <span className={`badge dot ${r.status==='APROVADO'?'green':r.status==='NEGADO'?'red':'amber'}`}>{r.status}</span>
      </div>)}
    </div>}
  </div>);
}
