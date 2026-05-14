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
    .then(r=>r.json());
}
function safeApi(path,opts={}){
  return api(path,opts).catch(()=>null);
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
[data-theme="dark"]{
  --bg:#0B1120; --surface:#1E293B; --surface2:#0F172A; --border:rgba(255,255,255,.06);
  --sidebar:#020617;
  --success-bg:rgba(5,150,105,.15); --success-text:#34D399;
  --danger-bg:rgba(220,38,38,.15); --danger-text:#FCA5A5;
  --warning-bg:rgba(217,119,6,.15); --warning-text:#FBBF24;
  --text:#F1F5F9; --text2:#94A3B8; --text3:#64748B;
  --sh-sm:0 1px 3px rgba(0,0,0,.3),0 1px 2px rgba(0,0,0,.2);
  --sh:0 4px 16px rgba(0,0,0,.4),0 1px 4px rgba(0,0,0,.2);
  --sh-lg:0 10px 40px rgba(0,0,0,.5),0 2px 8px rgba(0,0,0,.25);
  --surface2:rgba(255,255,255,.03);
  --primary-glow:rgba(99,102,241,.4);
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
@keyframes shimmer{0%{background-position:200% 0}to{background-position:-200% 0}}

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

.fl{position:relative;margin-bottom:4px}
.fl .field{padding-top:18px;padding-bottom:6px;height:48px;transition:var(--t)}
.fl label{position:absolute;left:13px;top:14px;font-size:14px;color:var(--text3);pointer-events:none;transition:var(--t);font-weight:400}
.fl .field:focus~label,.fl .field:not(:placeholder-shown)~label,.fl .field.filled~label{top:6px;font-size:10.5px;color:var(--primary);font-weight:600}
.fl .field:focus{border-color:var(--primary);background:#fff;box-shadow:0 0 0 3px var(--primary-glow)}
.fl .field.auto~label{top:6px;font-size:10.5px;font-weight:600}
[data-theme="dark"] .fl .field:focus{background:var(--surface2)}

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
@media(max-width:768px){.g2,.g3,.g4{grid-template-columns:1fr!important}.hide-mob{display:none!important}}
@media(max-width:1024px){.hide-tab{display:none!important}}
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

const LABELS={dashboard:'Dashboard','admin-dash':'Meu Painel',records:'Avaliações',form:'Nova Avaliação',cadastros:'Cadastros',reports:'Relatórios',users:'Usuários',clientes:'Clientes',licencas:'Licenças'};

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
  const [toast,setToast]=useState(null);
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
  const toggleTheme=()=>setTheme(p=>p==='light'?'dark':'light');
  const toast_=( msg,type='success')=>{setToast({msg,type});setTimeout(()=>setToast(null),3500);};
  const logout=()=>{localStorage.clear();setUser(null);setView('login');};
  const cw=()=>user&&(user.role==='SYSTEM'||user.role==='ADMIN'||user.tipo==='admin_cliente'||(user.role==='COLABORADOR'&&user.permissions==='Leitura + Escrita'));
  const ia=()=>user&&(user.role==='SYSTEM'||user.role==='ADMIN'||user.tipo==='admin_cliente');
  const nav=user?[
    {k:'dashboard',i:'home',l:'Dashboard'},
    ...(user.tipo==='admin_cliente'?[{k:'admin-dash',i:'chart',l:'Meu Painel'}]:[]),
    {k:'records',i:'list',l:'Avaliações'},
    ...(cw()?[{k:'form',i:'plus',l:'Nova'}]:[]),
    {k:'cadastros',i:'list',l:'Cadastros'},
    {k:'reports',i:'chart',l:'Relatórios'},
    ...(ia()?[{k:'users',i:'users',l:'Usuários'}]:[]),
    ...(user.role==='SYSTEM'?[{k:'clientes',i:'users',l:'Clientes'}]:[]),
    ...(user.tipo==='admin_cliente'?[{k:'licencas',i:'shield',l:'Licenças'}]:[]),
    ...(ia()?[{k:'audit',i:'list',l:'Auditoria'}]:[]),
  ]:[];
  if(!user)return(<><style>{CSS}</style><Login onLogin={(u,t)=>{setUser(u);localStorage.setItem('user',JSON.stringify(u));localStorage.setItem('token',t);setView('dashboard');}}/></>);
  return(<>
    <style>{CSS}</style>
    {toast&&<div className="toast-in" style={{position:'fixed',top:20,right:20,zIndex:9999,background:toast.type==='error'?'#FEF2F2':'#ECFDF5',color:toast.type==='error'?'#991B1B':'#065F46',border:`1px solid ${toast.type==='error'?'#FECACA':'#A7F3D0'}`,padding:'11px 18px',borderRadius:12,fontSize:13.5,fontWeight:500,maxWidth:340,boxShadow:'0 8px 24px rgba(0,0,0,.12)',display:'flex',alignItems:'center',gap:8}}>
      {toast.type==='error'?ICON.x:ICON.check}{toast.msg}</div>}
    <div style={{display:'flex',minHeight:'100vh'}}>
      {!mobile&&<nav style={{width:sidebarOpen?'var(--sw)':0,background:'var(--sidebar)',position:'fixed',top:0,bottom:0,left:0,zIndex:100,display:'flex',flexDirection:'column',overflow:'hidden',transition:'width .25s cubic-bezier(.4,0,.2,1)',borderRight:sidebarOpen?'1px solid rgba(255,255,255,.06)':'none'}}>
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
            <button className="btn ghost icon" style={{color:'rgba(255,255,255,.3)',padding:5,borderRadius:8}} onClick={toggleTheme} title={theme==='light'?'Modo escuro':'Modo claro'}>{theme==='light'?<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>:<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>}</button>
            <button className="btn ghost icon" style={{color:'rgba(255,255,255,.3)',padding:5,borderRadius:8}} onClick={logout} title="Sair">{ICON.logout}</button>
          </div>
        </div>
      </nav>}
      <main style={{flex:1,marginLeft:mobile||!sidebarOpen?0:'var(--sw)',padding:mobile?'1rem 1rem 90px':'2rem 2rem 2.5rem',minHeight:'100vh'}}>
        {!mobile&&user&&<div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16,fontSize:12.5,color:'var(--text3)'}}>
          <span style={{cursor:'pointer',transition:'var(--t)',padding:'4px 6px',borderRadius:6}} onClick={()=>setSidebarOpen(!sidebarOpen)} title="Toggle sidebar">{ICON.list}</span>
          <span style={{color:'var(--text3)',opacity:.4}}>/</span>
          {['dashboard','admin-dash','records','cadastros','reports','users','clientes','licencas'].includes(view)?<span style={{fontWeight:500,color:'var(--text2)'}}>{LABELS[view]||view}</span>:<><span style={{cursor:'pointer',color:'var(--primary)'}} onClick={()=>setView('records')}>{LABELS.records}</span><span style={{color:'var(--text3)',opacity:.4}}>/</span><span style={{fontWeight:500,color:'var(--text2)'}}>{view==='form'?(editRec?'Editar':'Nova')+' Avaliação':view}</span></>}
        </div>}
        {mobile&&<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',gap:9}}>
            <div style={{width:32,height:32,background:'linear-gradient(135deg,#4F46E5,#7C3AED)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center'}}>{ICON.bolt}</div>
            <div><p style={{fontSize:14,fontWeight:700}}>Lançamentos Notas</p><p style={{fontSize:11,color:'var(--text3)'}}>CEO Cabo Frio 2026</p></div>
          </div>
          <Avatar name={user.nome} size={34}/>
        </div>}
        <div key={view} className="si" style={{animation:'scaleIn .2s cubic-bezier(.4,0,.2,1) both'}}>
        {view==='dashboard'&&<Dash mobile={mobile} user={user}/>}
        {view==='admin-dash'&&<AdminDash mobile={mobile} user={user} toast_={toast_}/>}
        {view==='records'&&<RecList cw={cw()} ia={ia()} mobile={mobile} user={user} onEdit={r=>{setEditRec(r);setView('form');}} onNew={()=>{setEditRec(null);setView('form');}} toast_={toast_}/>}
        {view==='form'&&<RecForm rec={editRec} user={user} cw={cw()} mobile={mobile} onSave={()=>{toast_('Avaliação salva com sucesso!');setView('records');}} onCancel={()=>setView('records')} toast_={toast_}/>}
        {view==='cadastros'&&<Cadastros mobile={mobile} toast_={toast_}/>}
        {view==='reports'&&<Reports mobile={mobile}/>}
        {view==='users'&&ia()&&<Users user={user} toast_={toast_}/>}
        {view==='clientes'&&user.role==='SYSTEM'&&<Clientes user={user} toast_={toast_}/>}
        {view==='licencas'&&user.tipo==='admin_cliente'&&<Licencas user={user} toast_={toast_}/>}
        {view==='audit'&&ia()&&<AuditLog toast_={toast_}/>}
        </div>
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

function Skeleton({h=14,w='100%',r=6,m='0 0 10px 0'}){return <div style={{height:h,width:w,borderRadius:r,background:'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.5s infinite',margin:m}}/>}
function EmptyState({icon,title,desc}){return <div style={{textAlign:'center',padding:'3rem 1rem',color:'var(--text3)'}}><div style={{fontSize:40,marginBottom:12,opacity:.3}}>{icon||ICON.list}</div><p style={{fontSize:15,fontWeight:600,color:'var(--text2)',marginBottom:4}}>{title||'Nenhum dado'}</p><p style={{fontSize:13}}>{desc||'Nenhum registro encontrado'}</p></div>}
function ErrorState({onRetry,msg}){return <div style={{textAlign:'center',padding:'3rem 1rem',color:'var(--text3)'}}>
  <div style={{fontSize:40,marginBottom:12,opacity:.3}}><svg width="40" height="40" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 8v4M12 16h.01"/></svg></div>
  <p style={{fontSize:15,fontWeight:600,color:'var(--danger-text)',marginBottom:4}}>Erro ao carregar</p>
  <p style={{fontSize:13,marginBottom:12}}>{msg||'Não foi possível carregar os dados. Verifique sua conexão.'}</p>
  {onRetry&&<button className="btn primary sm" onClick={onRetry}>{ICON.reload||'↻'} Tentar novamente</button>}
</div>}

function Dash({mobile,user}){
  const [data,setData]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState(null);
  const load=()=>{setLoading(true);setError(null);api('records').then(r=>{if(Array.isArray(r))setData(r);else setError('Erro ao carregar');setLoading(false);}).catch(()=>{setError('Erro de conexão');setLoading(false);});};
  useEffect(()=>{load();},[]);
  const total=data.length,aprov=data.filter(r=>r.resultadoFinal==='APROVADO'||r.resultadoFinal==='APROVADO 2').length,reprov=data.filter(r=>r.resultadoFinal==='REPROVADO').length,pend=total-aprov-reprov,tx=total?Math.round(aprov/total*100):0;
  const byBase={};data.forEach(r=>{if(r.base)byBase[r.base]=(byBase[r.base]||0)+1;});
  const topB=Object.entries(byBase).sort((a,b)=>b[1]-a[1]).slice(0,6),maxB=topB[0]?.[1]||1;
  const rec=[...data].reverse().slice(0,5);
  const stats=[{n:total,l:'Total',c:'#4F46E5',bg:'linear-gradient(135deg,#4F46E5,#6366F1)',sh:'rgba(99,102,241,.3)'},{n:aprov,l:'Aprovados',c:'#059669',bg:'linear-gradient(135deg,#059669,#10B981)',sh:'rgba(5,150,105,.3)'},{n:reprov,l:'Reprovados',c:'#DC2626',bg:'linear-gradient(135deg,#DC2626,#EF4444)',sh:'rgba(220,38,38,.3)'},{n:pend,l:'Pendentes',c:'#D97706',bg:'linear-gradient(135deg,#D97706,#F59E0B)',sh:'rgba(217,119,6,.3)'}];
  if(error)return <div><div className="fu" style={{marginBottom:24}}><h1 style={{fontSize:24,fontWeight:700}}>Dashboard</h1></div><div className="fu1"><ErrorState msg={error} onRetry={load}/></div></div>;
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
          <div className="chart-track"><div className="chart-bar" style={{width:Math.round(n/maxB*100)+'%',background:'linear-gradient(90deg,#4F46E5,#818CF8)'}}/></div>
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
  const PER=20;const fileRef=useRef(null);
  const load=useCallback(()=>{setLoading(true);setError(null);api('records?'+new URLSearchParams({q,base,resultado:res})).then(r=>{if(Array.isArray(r))setData(r);else setError('Erro ao carregar');setLoading(false);}).catch(()=>{setError('Erro de conexão');setLoading(false);});},[q,base,res]);
  useEffect(()=>{load();},[load]);
  const del=async id=>{await api('records/'+id,{method:'DELETE'});toast_('Registro excluído');setConfirmDel(null);load();};
  const imp=async f=>{const t=await f.text();const a=JSON.parse(t);const r=await api('records',{method:'POST',body:JSON.stringify(Array.isArray(a)?a:[a])});toast_(`${r.imported||0} registros importados!`);load();};
  const pages=Math.ceil(data.length/PER),paged=data.slice(page*PER,(page+1)*PER);
  if(error)return <div className="fu"><ErrorState msg={error} onRetry={load}/></div>;
  if(mobile)return(<div>
    <div className="fu" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
      <div><h1 style={{fontSize:20,fontWeight:700}}>Avaliações</h1><p style={{fontSize:13,color:'var(--text3)'}}>{data.length} registros</p></div>
      {cw&&<button className="btn primary sm" onClick={onNew}>{ICON.plus}Nova</button>}
    </div>
    <div style={{position:'relative',marginBottom:14}}>
      <div style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--text3)',pointerEvents:'none'}}>{ICON.search}</div>
      <input className="field" style={{paddingLeft:36}} placeholder="Buscar nome, empresa, CPF..." value={q} onChange={e=>{setQ(e.target.value);setPage(0);}}/>
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
}

function AuditLog({toast_}){
  const [log,setLog]=useState([]);const [loading,setLoading]=useState(true);const [error,setError]=useState(null);
  const load=()=>{setLoading(true);setError(null);api('audit').then(r=>{if(Array.isArray(r))setLog(r);else setError('Erro ao carregar');setLoading(false);}).catch(()=>{setError('Erro de conexão');setLoading(false);});};
  useEffect(()=>{load();},[]);
  if(error)return <div className="fu"><ErrorState msg={error} onRetry={load}/></div>;
  return(<div>
    <div className="fu"><h1 style={{fontSize:22,fontWeight:700}}>Auditoria</h1><p style={{fontSize:13,color:'var(--text3)',marginTop:2}}>Histórico de ações no sistema</p></div>
    <div className="card fu1" style={{padding:0,overflow:'hidden'}}>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:600}}>
          <thead><tr>
            <th className="th">Data/Hora</th><th className="th">Usuário</th><th className="th">Ação</th><th className="th">Detalhe</th>
          </tr></thead>
          <tbody>
            {loading?[1,2,3].map(i=><tr key={i}>{[1,2,3,4].map(j=><td key={j} className="td"><Skeleton h={14} w={j===0?'140px':j===1?'100px':j===2?'80px':'200px'} r="4" m="0"/></td>)}</tr>):log.map((e,i)=><tr key={e.id||i}>
              <td className="td" style={{fontFamily:'var(--mono)',fontSize:11.5}}>{new Date(e.ts||e.createdAt).toLocaleString('pt-BR')}</td>
              <td className="td" style={{fontWeight:600}}>{e.username||e.createdBy||'—'}</td>
              <td className="td"><span className="badge" style={{background:'rgba(99,102,241,.1)',color:'#4F46E5'}}>{e.action||'—'}</span></td>
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
  const save=async()=>{
    const e={};if(!form.nomes)e.nomes='Obrigatório';if(!form.pedido)e.pedido='Obrigatório';if(!form.empresa)e.empresa='Obrigatório';if(!form.base)e.base='Obrigatório';if(!form.processo)e.processo='Obrigatório';
    setErrors(e);if(Object.keys(e).length){toast_('Preencha os campos obrigatórios','error');return;}
    setSaving(true);
    const r=rec?.id?await api('records/'+rec.id,{method:'PUT',body:JSON.stringify({...form,updatedBy:user.nome})}):await api('records',{method:'POST',body:JSON.stringify({...form,createdBy:user.nome})});
    setSaving(false);
    if(r.error)toast_(r.error,'error');else{localStorage.removeItem(draftKey);onSave();}
  };
  const photo=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>upd('fotoCandidato',ev.target.result);r.readAsDataURL(f);};
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
      <div><h1 style={{fontSize:22,fontWeight:700}}>{rec?'Editar':'Nova'} Avaliação</h1>
        <div style={{display:'flex',alignItems:'center',gap:8,marginTop:2}}>
          {rec&&<p style={{fontSize:11,color:'var(--text3)',fontFamily:'var(--mono)'}}>ID: {rec.id}</p>}
          {draftSaved&&<span className="badge green" style={{fontSize:10}}>Rascunho salvo</span>}
          {!rec&&!draftSaved&&localStorage.getItem(draftKey)&&<button className="btn ghost sm" style={{fontSize:10,color:'var(--text3)',padding:'2px 8px'}} onClick={limparDraft}>{ICON.x}Descartar rascunho</button>}
        </div>
      </div>
      <div style={{display:'flex',gap:8}}>
        <button className="btn" onClick={()=>{localStorage.removeItem(draftKey);onCancel();}}>Cancelar</button>
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
  const [data,setData]=useState([]);const [loading,setLoading]=useState(false);
  const [dtIni,setDtIni]=useState('');const [dtFim,setDtFim]=useState('');const [fb,setFb]=useState('');
  const [filtrosAplicados,setFiltrosAplicados]=useState(false);
  const aplicarFiltros=()=>{
    setLoading(true);setFiltrosAplicados(true);
    api('records?'+new URLSearchParams({dtIni,dtFim,base:fb})).then(r=>{if(Array.isArray(r))setData(r);setLoading(false);});
  };
  useEffect(()=>{aplicarFiltros();},[]);
  const total=data.length,aprov=data.filter(r=>r.resultadoFinal==='APROVADO'||r.resultadoFinal==='APROVADO 2').length,reprov=data.filter(r=>r.resultadoFinal==='REPROVADO').length,ausente=data.filter(r=>r.resultadoFinal==='AUSENTE').length,pend=total-aprov-reprov-ausente,tx=total?Math.round(aprov/total*100):0;
  const byBase={};data.forEach(r=>{if(r.base)byBase[r.base]=(byBase[r.base]||0)+1;});
  const topB=Object.entries(byBase).sort((a,b)=>b[1]-a[1]).slice(0,7);
  const byP={};data.forEach(r=>{if(r.processo){const k=r.processo.replace(/_/g,' ').slice(0,26);byP[k]=(byP[k]||0)+1;}});
  const topP=Object.entries(byP).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const pieData=[{name:'Aprovados',value:aprov,fill:'#059669'},{name:'Reprovados',value:reprov,fill:'#DC2626'},{name:'Ausentes',value:ausente,fill:'#D97706'},{name:'Pendentes',value:pend,fill:'#94A3B8'}].filter(d=>d.value>0);
  return(<div>
    <div className="fu" style={{marginBottom:24}}><h1 style={{fontSize:24,fontWeight:700}}>Relatórios</h1><p style={{fontSize:14,color:'var(--text3)',marginTop:3}}>Análise por período e filtros</p></div>
    <div className="card fu1" style={{padding:'1.25rem',marginBottom:20}}>
      <p className="sec-h">Filtros</p>
      <div style={{display:'grid',gridTemplateColumns:mobile?'1fr':'1fr 1fr 1fr auto auto',gap:12,alignItems:'end'}}>
        <div><label className="label">Data Início</label><input className="field" type="date" value={dtIni} onChange={e=>setDtIni(e.target.value)} onKeyDown={e=>e.key==='Enter'&&aplicarFiltros()}/></div>
        <div><label className="label">Data Fim</label><input className="field" type="date" value={dtFim} onChange={e=>setDtFim(e.target.value)} onKeyDown={e=>e.key==='Enter'&&aplicarFiltros()}/></div>
        <div><label className="label">Base</label><select className="field" value={fb} onChange={e=>setFb(e.target.value)}><option value="">Todas</option>{BASES.map(b=><option key={b}>{b}</option>)}</select></div>
        <button className="btn primary" onClick={aplicarFiltros} style={{marginBottom:1}}>{ICON.search}Filtrar</button>
        {filtrosAplicados&&<button className="btn ghost sm" onClick={()=>{setDtIni('');setDtFim('');setFb('');setTimeout(()=>aplicarFiltros(),0);}}>{ICON.x}Limpar</button>}
      </div>
    </div>
    <div className="fu2" style={{display:'grid',gridTemplateColumns:mobile?'1fr 1fr':'repeat(4,1fr)',gap:13,marginBottom:20}}>
      {[{n:total,l:'No Período',c:'#4F46E5',bg:'linear-gradient(135deg,#4F46E5,#6366F1)'},{n:aprov,l:'Aprovados',c:'#059669',bg:'linear-gradient(135deg,#059669,#10B981)'},{n:reprov,l:'Reprovados',c:'#DC2626',bg:'linear-gradient(135deg,#DC2626,#EF4444)'},{n:ausente,l:'Ausentes',c:'#D97706',bg:'linear-gradient(135deg,#D97706,#F59E0B)'}].map((s,i)=><div key={i} style={{background:s.bg,borderRadius:'var(--r)',padding:'1.25rem',boxShadow:`0 5px 18px ${s.c}33`,position:'relative',overflow:'hidden'}}>
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
              <Bar dataKey="total" fill="#4F46E5" radius={[0,4,4,0]} maxBarSize={16}/>
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
      <div className="card" style={{padding:'1.25rem',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <p className="sec-h" style={{alignSelf:'flex-start',width:'100%'}}>Taxa de Aprovação</p>
        <div style={{textAlign:'center',marginTop:12}}>
          <div style={{fontSize:64,fontWeight:800,background:'linear-gradient(135deg,#059669,#34D399)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',lineHeight:1}}>{tx}<span style={{fontSize:32}}>%</span></div>
          <div className="progress" style={{width:200,margin:'14px auto 10px'}}><div className="progress-fill" style={{width:tx+'%',background:'linear-gradient(90deg,#059669,#34D399)'}}/></div>
          <p style={{fontSize:13,color:'var(--text3)'}}>{aprov} aprovados de {total}</p>
        </div>
      </div>
    </div>}
  </div>);
}

function Users({user,toast_}){
  const [users,setUsers]=useState([]);const [loading,setLoading]=useState(true);const [show,setShow]=useState(false);const [editU,setEditU]=useState(null);
  const [form,setForm]=useState({username:'',password:'',nome:'',role:'COLABORADOR',permissions:'Somente Leitura'});const [err,setErr]=useState('');
  useEffect(()=>{api('users').then(r=>{if(Array.isArray(r))setUsers(r);setLoading(false);});},[]);
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
          <tbody>{loading?[1,2,3].map(i=><tr key={i}>{[0,1,2,3,4,5,6].map(j=><td key={j} className="td"><Skeleton h={14} w={j===0?'32px':j===6?'80px':'120px'} r="4" m="0"/></td>)}</tr>):users.length?users.map(u=><tr key={u.id}>
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
          </tr>):<tr><td colSpan={7} style={{textAlign:'center',padding:'3rem',color:'var(--text3)'}}><EmptyState title="Nenhum usuário" desc="Nenhum usuário cadastrado ainda."/></td></tr>}</tbody>
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

const CAD_ICON={pedidos:'📋',empresas:'🏢',processos:'⚙️',bases:'📍',avaliadores:'👤',motivos:'📌'};
const CAD_COLS={
  pedidos:[{k:'nome',l:'Pedido'}],
  empresas:[{k:'nome',l:'Empresa'},{k:'valor',l:'Valor R$'},{k:'email',l:'Email'},{k:'dataInicio',l:'Início'},{k:'dataFim',l:'Fim'}],
  processos:[{k:'processo',l:'Processo'},{k:'cargo',l:'Cargo'},{k:'atividades',l:'Atividades'}],
  bases:[{k:'base',l:'Base'},{k:'uo',l:'UO'},{k:'regiao',l:'Região'}],
  avaliadores:[{k:'nome',l:'Avaliador'}],
  motivos:[{k:'nome',l:'Motivo'}]
};
const CAD_FORMS={
  pedidos:[{k:'nome',l:'Nome do Pedido',req:true}],
  empresas:[{k:'nome',l:'Nome da Empresa',req:true},{k:'valor',l:'Valor Renovação (R$)',type:'number'},{k:'email',l:'Email de Contato'},{k:'dataInicio',l:'Data Início',type:'date'},{k:'dataFim',l:'Data Fim',type:'date'},{k:'associado',l:'Associado Sindistal',opts:['SIM','NÃO']},{k:'docContratual',l:'Doc Contratual'}],
  processos:[{k:'processo',l:'Nome do Processo',req:true},{k:'cargo',l:'Cargo'}],
  bases:[{k:'base',l:'Base',req:true},{k:'uo',l:'Unidade Operacional'},{k:'regiao',l:'Região'}],
  avaliadores:[{k:'nome',l:'Nome do Avaliador',req:true}],
  motivos:[{k:'nome',l:'Motivo',req:true}]
};

function Cadastros({mobile,toast_}){
  const [tab,setTab]=useState(0);
  const [data,setData]=useState({});
  const [loading,setLoading]=useState({});
  const [showModal,setShowModal]=useState(false);
  const [editItem,setEditItem]=useState(null);
  const [confirmDel,setConfirmDel]=useState(null);
  const importRef=useRef(null);
  const tipos=Object.keys(CAD_ICON);
  const importCad=async f=>{
    try{
      const txt=await f.text();
      const arr=JSON.parse(txt);
      if(!Array.isArray(arr))return toast_('Arquivo deve conter uma lista','error');
      let ok=0;
      for(const item of arr){
        const r=await api('cadastros',{method:'POST',body:JSON.stringify({tipo,...item})});
        if(!r.error)ok++;
      }
      toast_(`${ok} registros importados!`);
      load(tipo);
    }catch(e){toast_('Erro ao importar: '+e,'error');}
  };
  const tipo=tipos[tab];

  const load=useCallback(async t=>{
    setLoading(p=>({...p,[t]:true}));
    const r=await api('cadastros?tipo='+t);
    if(Array.isArray(r))setData(p=>({...p,[t]:r}));
    setLoading(p=>({...p,[t]:false}));
  },[]);

  useEffect(()=>{load(tipo);},[tipo]);

  const [form,setForm]=useState({});
  const openForm=(item)=>{
    if(item){
      const f={};
      CAD_FORMS[tipo].forEach(c=>{f[c.k]=item[c.k]||'';});
      f._id=item.id;
      setEditItem(item);
      setForm(f);
    }else{
      const f={};CAD_FORMS[tipo].forEach(c=>{f[c.k]='';});
      setEditItem(null);
      setForm(f);
    }
    setShowModal(true);
  };

  const save=async()=>{
    if(!form.nome&&tipo!=='empresas'&&tipo!=='processos'&&tipo!=='bases')return toast_('Preencha o nome','error');
    const body=editItem?{id:editItem.id,...form}:{tipo,...form};
    const method=editItem?'PUT':'POST';
    const r=await api('cadastros',{method,body:JSON.stringify(body)});
    if(r.error)return toast_(r.error,'error');
    toast_(editItem?'Cadastro atualizado!':'Cadastro criado!');
    setShowModal(false);
    load(tipo);
  };

  const del=async()=>{
    if(!confirmDel)return;
    await api('cadastros?id='+confirmDel.id,{method:'DELETE'});
    toast_('Cadastro excluído');
    setConfirmDel(null);
    load(tipo);
  };

  const formatVal=(item,col)=>{
    if(col.k==='valor')return item.valor?`R$ ${parseFloat(item.valor).toFixed(2)}`:'—';
    if(col.k==='associado')return item.associado==='SIM'||item.associado===true?'SIM':'NÃO';
    if(col.k==='atividades')return Array.isArray(item.atividades)?`${item.atividades.length} atividades`:'—';
    return item[col.k]||'—';
  };

  return(<div>
    <div className="fu" style={{marginBottom:20}}>
      <h1 style={{fontSize:22,fontWeight:700}}>Cadastros</h1>
      <p style={{fontSize:13,color:'var(--text3)',marginTop:2}}>Gerenciar tabelas auxiliares</p>
    </div>
    <div className="tab-bar fu1" style={{marginBottom:16,flexWrap:'wrap'}}>
      {tipos.map((t,i)=><button key={t} className={`tab${tab===i?' active':''}`} onClick={()=>setTab(i)}>
        <span style={{marginRight:6}}>{CAD_ICON[t]}</span>{t.charAt(0).toUpperCase()+t.slice(1)}
      </button>)}
    </div>
    <div className="card fu2" style={{padding:0,overflow:'hidden'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'1rem 1.25rem',borderBottom:'1px solid var(--border)'}}>
        <p style={{fontSize:13,fontWeight:600,color:'var(--text2)'}}>
          {CAD_ICON[tipo]} {tipo.charAt(0).toUpperCase()+tipo.slice(1)}
          <span style={{fontWeight:400,color:'var(--text3)',marginLeft:8}}>{data[tipo]?.length||0} registros</span>
        </p>
        <div style={{display:'flex',gap:6}}>
          <input ref={importRef} type="file" accept=".json" style={{display:'none'}} onChange={e=>{if(e.target.files[0])importCad(e.target.files[0]);e.target.value='';}}/>
          <button className="btn sm amber-btn" onClick={()=>importRef.current?.click()}>{ICON.up}Importar</button>
          <button className="btn primary sm" onClick={()=>openForm(null)}>{ICON.plus}Adicionar</button>
        </div>
      </div>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:500}}>
          <thead><tr>
            {CAD_COLS[tipo].map(c=>{
              const w=c.k==='nome'||c.k==='empresa'||c.k==='processo'||c.k==='base'?{minWidth:200}:c.k==='valor'?{width:120}:c.k==='atividades'?{width:120}:{};
              return <th key={c.k} className="th" style={w}>{c.l}</th>;
            })}
            <th className="th" style={{width:80,textAlign:'right'}}>Ações</th>
          </tr></thead>
          <tbody>
            {loading[tipo]?[1,2,3].map(i=><tr key={i}>
              {CAD_COLS[tipo].map(c=><td key={c.k} className="td"><Skeleton h={14} w={c.k==='valor'?'60px':'140px'} r="4" m="0"/></td>)}
              <td className="td"><Skeleton h={14} w="60px" r="4" m="0"/></td>
            </tr>):data[tipo]?.length?data[tipo].map(item=><tr key={item.id}>
              {CAD_COLS[tipo].map(c=><td key={c.k} className="td" style={{fontWeight:c.k==='nome'||c.k==='empresa'||c.k==='processo'||c.k==='base'?600:400,fontSize:13}}>{formatVal(item,c)}</td>)}
              <td className="td" style={{textAlign:'right'}}>
                <div style={{display:'flex',gap:4,justifyContent:'flex-end'}}>
                  <button className="btn sm icon" onClick={()=>openForm(item)}>{ICON.edit}</button>
                  <button className="btn sm icon danger" onClick={()=>setConfirmDel(item)}>{ICON.trash}</button>
                </div>
              </td>
            </tr>):<tr><td colSpan={CAD_COLS[tipo].length+1} style={{textAlign:'center',padding:'3rem'}}>
              <EmptyState title="Nenhum registro" desc={`Nenhum cadastro de ${tipo} encontrado.`}/>
            </td></tr>}
          </tbody>
        </table>
      </div>
    </div>
    <ConfirmModal show={confirmDel} title="Excluir Cadastro" msg={`Excluir "${confirmDel?.nome||confirmDel?.processo||confirmDel?.base||confirmDel?.[Object.keys(confirmDel||{})[0]]||'?'}"?`} onConfirm={del} onCancel={()=>setConfirmDel(null)}/>
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
              <input className="field" type={c.type||'text'} value={form[c.k]||''} onChange={e=>setForm(p=>({...p,[c.k]:e.target.value}))} placeholder={c.l}/>
            </div>
          ))}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:8}}>
            <button className="btn" onClick={()=>setShowModal(false)}>Cancelar</button>
            <button className="btn primary" onClick={save}>{ICON.save}Salvar</button>
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
    <div className="fu"><h1 style={{fontSize:22,fontWeight:700}}>Meu Painel</h1><p style={{fontSize:13,color:'var(--text3)',marginTop:2}}>Visão geral do seu cliente</p></div>

    {loading?<div className="fu1" style={{display:'grid',gridTemplateColumns:mobile?'1fr 1fr':'repeat(4,1fr)',gap:13,marginBottom:20}}>
      {[1,2,3,4].map(i=><div key={i} style={{background:'var(--surface)',borderRadius:'var(--r)',padding:'1.25rem',border:'1px solid var(--border)'}}><Skeleton h={32} w="50px" m="0 0 6px 0"/><Skeleton h={14} w="80px" m="0"/></div>)}
    </div>:<><div className="fu1" style={{display:'grid',gridTemplateColumns:mobile?'1fr 1fr 1fr':'repeat(4,1fr)',gap:13,marginBottom:20}}>
      <div style={{background:'linear-gradient(135deg,#059669,#10B981)',borderRadius:'var(--r)',padding:'1.25rem',boxShadow:'0 6px 20px rgba(5,150,105,.3)',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',right:-10,top:-10,width:66,height:66,background:'rgba(255,255,255,.1)',borderRadius:'50%'}}/>
        <div style={{fontSize:28,fontWeight:800,color:'#fff'}}>{cliente?.slotsUsados||0}<span style={{fontSize:16}}>/{cliente?.slotsTotal||0}</span></div>
        <div style={{fontSize:12.5,color:'rgba(255,255,255,.75)',marginTop:3,fontWeight:500}}>Slots Utilizados</div>
      </div>
      <div style={{background:baixaLicenca?'linear-gradient(135deg,#D97706,#F59E0B)':'linear-gradient(135deg,#4F46E5,#6366F1)',borderRadius:'var(--r)',padding:'1.25rem',boxShadow:baixaLicenca?'0 6px 20px rgba(217,119,6,.3)':'0 6px 20px rgba(99,102,241,.3)',position:'relative',overflow:'hidden'}}>
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
  const [show,setShow]=useState(false);const [editItem,setEditItem]=useState(null);
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
    const body=editItem?{id:editItem.id,...form}:form;
    const method=editItem?'PUT':'POST';
    const r=await api('clientes',{method,body:JSON.stringify(body)});
    if(r.error)return toast_(r.error,'error');
    toast_(editItem?'Cliente atualizado!':'Cliente criado!');
    setShow(false);load();
  };

  const del=async()=>{
    if(!confirmDel)return;
    await api('clientes?id='+confirmDel.id,{method:'DELETE'});
    toast_('Cliente excluído');setConfirmDel(null);load();
  };

  const receitaTotal=data.reduce((s,c)=>s+((c.slotsTotal||0)*(c.valorSlot||0)),0);

  return(<div>
    <div className="fu" style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,flexWrap:'wrap',gap:12}}>
      <div><h1 style={{fontSize:22,fontWeight:700}}>Clientes</h1><p style={{fontSize:13,color:'var(--text3)',marginTop:2}}>{data.length} clientes · Receita Total: <strong style={{color:'#059669'}}>R$ {receitaTotal.toFixed(2)}</strong></p></div>
      <button className="btn primary" onClick={()=>openForm(null)}>{ICON.uplus}Novo Cliente</button>
    </div>
    <div className="card fu1" style={{padding:0,overflow:'hidden'}}>
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
                  <div className="progress-fill" style={{width:Math.min(100,((c.slotsUsados||0)/(c.slotsTotal||1)*100))+'%',background:((c.slotsUsados||0)>=c.slotsTotal)?'#DC2626':'linear-gradient(90deg,#4F46E5,#818CF8)'}}/>
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
            <button className="btn" onClick={()=>setShow(false)}>Cancelar</button>
            <button className="btn primary" onClick={save}>{ICON.save}Salvar</button>
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
    const r=await api('licencas',{method:'POST',body:JSON.stringify({quantidade:qtdSolicitar,motivo:motivoSolicitar})});
    if(r.error)return toast_(r.error,'error');
    toast_('Solicitação enviada!');setShowSolicitar(false);setQtdSolicitar(1);setMotivoSolicitar('');load();
  };

  return(<div>
    <div className="fu"><h1 style={{fontSize:22,fontWeight:700}}>Licenças</h1><p style={{fontSize:13,color:'var(--text3)',marginTop:2}}>Gerencie suas licenças e solicitações</p></div>
    <div className="fu1" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:13,marginBottom:20}}>
      <div style={{background:'linear-gradient(135deg,#4F46E5,#6366F1)',borderRadius:'var(--r)',padding:'1.25rem',boxShadow:'0 6px 20px rgba(99,102,241,.3)'}}>
        <div style={{fontSize:28,fontWeight:800,color:'#fff'}}>{cliente?.slotsTotal||0}</div>
        <div style={{fontSize:12.5,color:'rgba(255,255,255,.75)'}}>Total de Licenças</div>
      </div>
      <div style={{background:'linear-gradient(135deg,#059669,#10B981)',borderRadius:'var(--r)',padding:'1.25rem',boxShadow:'0 6px 20px rgba(5,150,105,.3)'}}>
        <div style={{fontSize:28,fontWeight:800,color:'#fff'}}>{cliente?.slotsUsados||0}</div>
        <div style={{fontSize:12.5,color:'rgba(255,255,255,.75)'}}>Em Uso</div>
      </div>
      <div style={{background:slotsLivres<=3?'linear-gradient(135deg,#D97706,#F59E0B)':'linear-gradient(135deg,#059669,#10B981)',borderRadius:'var(--r)',padding:'1.25rem',boxShadow:'0 6px 20px rgba(217,119,6,.3)'}}>
        <div style={{fontSize:28,fontWeight:800,color:'#fff'}}>{slotsLivres}</div>
        <div style={{fontSize:12.5,color:'rgba(255,255,255,.75)'}}>Disponíveis</div>
      </div>
    </div>
    <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
      <button className="btn primary" onClick={()=>setShowSolicitar(true)}>{ICON.plus}Solicitar Licenças</button>
    </div>
    <div className="card fu2" style={{padding:0,overflow:'hidden'}}>
      <div style={{padding:'1rem 1.25rem',borderBottom:'1px solid var(--border)'}}><p className="sec-h" style={{marginBottom:0}}>Histórico de Solicitações</p></div>
      {loading?<div style={{padding:'1rem'}}><Skeleton h={14} w="100%" r="4" m="0 0 8px 0"/><Skeleton h={14} w="80%" r="4" m="0"/></div>:requests.map((r,i)=><div key={r.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 1.25rem',borderBottom:i<requests.length-1?'1px solid var(--border)':'none'}}>
        <div><p style={{fontSize:14,fontWeight:600}}>+{r.quantidade} licenças</p><p style={{fontSize:12,color:'var(--text3)'}}>{new Date(r.createdAt).toLocaleDateString('pt-BR')} · {r.motivo||'—'}</p></div>
        <span className={`badge dot ${r.status==='APROVADO'?'green':r.status==='NEGADO'?'red':'amber'}`}>{r.status}</span>
      </div>)}
    </div>
    {showSolicitar&&<div className="overlay" onClick={e=>e.target===e.currentTarget&&setShowSolicitar(false)}>
      <div className="modal" style={{maxWidth:420}}>
        <div className="modal-hd"><h3 style={{fontSize:16,fontWeight:700}}>Solicitar Licenças</h3><button className="btn ghost icon" onClick={()=>setShowSolicitar(false)}>{ICON.x}</button></div>
        <div className="modal-bd">
          <p style={{fontSize:13,color:'var(--text2)',marginBottom:8}}>Slots disponíveis: <strong>{slotsLivres}</strong> de <strong>{cliente?.slotsTotal||0}</strong></p>
          <div><label className="label">Quantidade</label><input className="field" type="number" min="1" value={qtdSolicitar} onChange={e=>setQtdSolicitar(Math.max(1,parseInt(e.target.value)||1))}/></div>
          <div><label className="label">Motivo</label><textarea className="field" rows={3} value={motivoSolicitar} onChange={e=>setMotivoSolicitar(e.target.value)} placeholder="Descreva o motivo..." style={{resize:'vertical'}}/></div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button className="btn" onClick={()=>setShowSolicitar(false)}>Cancelar</button>
            <button className="btn primary" onClick={solicitar}>{ICON.save}Enviar</button>
          </div>
        </div>
      </div>
    </div>}
  </div>);
}
