/**
 * PROJETO: Escala de Extração - Citroescala
 * DESENVOLVEDOR: isisb
 * VERSÃO: 1.18
 * DESCRIÇÃO: Sistema de gestão de escalas, folgas e janta para o setor de operações.
 * TODOS OS DIREITOS RESERVADOS
 */

console.log(
  "%c🛡️ SISTEMA DE ESCALAS CITROESCALA\n%cDesenvolvido por: isisb\nStatus: Protegido", 
  "color: #10b981; font-size: 20px; font-weight: bold;",
  "color: #94a3b8; font-size: 14px;"
);

import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- FUNÇÃO DE MENU MOBILE ÚNICA ---
window.toggleMenu = function() {
  const nav = document.getElementById('mainNav');
  const btn = document.getElementById('menuBtn');
  if (!nav || !btn) return;

  const isOpen = nav.classList.contains('open');

  if (!isOpen) {
    nav.classList.add('open');
    btn.classList.add('open');
    document.body.style.overflow = 'hidden';
  } else {
    nav.classList.remove('open');
    btn.classList.remove('open');
    document.body.style.overflow = '';
  }
};

// 1. Definição Global de Funções
Object.assign(window, { 
    showSection, addPessoa, openEdit, closeEdit, updatePessoa, 
    abrirModalFalta, fecharModalFalta, salvarFalta, deletePessoa, 
    deletarFalta, toggleC, changeDate, renderFolgas, copyJanta,
    setAuxiliar
});

// 2. Inicialização do Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const equipeRef = collection(db, "equipe");
const faltasRef = collection(db, "faltas");

// 4. Estado da Aplicação
window.equipe = [];
window.todasFaltas = [];
window.currentJantaSlots = null;
window.auxiliarMaquinaId = null;
const listaCargos = ["Operador", "Mesa de escolha", "Máquinas", "SurgeBin", "Carregamento", "Laboratório", "Filtração"];
let cargosSel = [];
let editCargosSel = [];
let loadingEquipe = true;
let loadingFaltas = true;

// 5. PWA Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('Erro SW:', err));
  });
}

// 6. Listeners do Firebase
onSnapshot(equipeRef, (snapshot) => {
  window.equipe = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  loadingEquipe = false;
  renderPessoas();
  renderFolgas();
  updateCount();
}, (error) => {
  console.error("Erro Firebase:", error);
});

onSnapshot(faltasRef, (snapshot) => {
  window.todasFaltas = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  loadingFaltas = false;
  renderPessoas();
  renderFolgas();
  renderRelatorio();
}, (error) => {
  console.error("Erro Firebase:", error);
});

window.addEventListener('load', init);

function init() {
  const container = document.getElementById('cargoContainer');
  if(container) container.innerHTML = listaCargos.map(c => `<div class="cargo-chip" onclick="toggleC(this, '${c}', false)">${c}</div>`).join('');
  
  const config = { locale: "pt", dateFormat: "Y-m-d", altInput: true, altFormat: "d/m/Y", disableMobile: "true" };
  window.fpViewer = flatpickr("#viewerDate", { ...config, onChange: renderFolgas, defaultDate: "today" });
  window.fpAdmissao = flatpickr("#inputAdmissao", config);
  window.fpEditAdmissao = flatpickr("#editAdmissao", config);
  window.fpFalta = flatpickr("#dataFalta", config);

  renderPessoas();
  renderRelatorio();
}

function renderSkeletons(id) {
  const container = document.getElementById(id);
  if (!container) return;
  container.innerHTML = Array(4).fill(0).map(() => `
    <div class="p-5 flex items-center justify-between gap-6 animate-pulse">
      <div class="flex items-center gap-3 flex-1">
        <div class="w-10 h-10 bg-white/5 rounded-xl"></div>
        <div class="space-y-2 flex-1">
          <div class="h-4 w-1/2 bg-white/5 rounded"></div>
          <div class="h-3 w-1/3 bg-white/5 rounded"></div>
        </div>
      </div>
      <div class="h-10 w-24 bg-white/5 rounded-xl"></div>
    </div>
  `).join('');
}

function renderPessoas() {
  const container = document.getElementById('listaPessoas');
  if(!container) return;
  if(loadingEquipe) return renderSkeletons('listaPessoas');

  container.innerHTML = '';
  const hoje = new Date().toISOString().split('T')[0];
  const faltasHoje = (window.todasFaltas || []).filter(f => f.data === hoje).map(f => f.funcId);
  
  if (window.equipe.length === 0) {
    container.innerHTML = '<p class="p-10 text-center text-gray-500 text-xs">Nenhum colaborador cadastrado.</p>';
    return;
  }

  (window.equipe || []).sort((a,b) => a.nome.localeCompare(b.nome)).forEach(p => {
    const estaFaltando = faltasHoje.includes(p.id);
    const dataAdm = p.admissao ? p.admissao.split('-').reverse().join('/') : '---';
    container.innerHTML += `
      <div class="p-5 sm:px-8 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 group transition-all ${estaFaltando ? 'status-falta-hoje bg-red-900/10' : 'hover:bg-white/[0.02]'}">
        <div class="flex flex-col min-w-0 flex-1">
          <div class="flex items-center gap-3">
            <div class="hidden sm:flex w-10 h-10 rounded-xl bg-white/5 items-center justify-center font-bold text-xs text-gray-400 border border-white/5 group-hover:border-emerald-500/30 transition-all">${p.nome.charAt(0)}</div>
            <div class="font-bold text-lg sm:text-base text-white uppercase truncate tracking-tight">
              ${p.nome} ${estaFaltando ? '<span class="text-red-500 ml-1">●</span>' : ''}
            </div>
          </div>
          <div class="text-[11px] sm:text-xs text-emerald-500/60 sm:text-gray-500 uppercase font-bold tracking-widest truncate mt-1 sm:ml-13">
            ${(p.cargos || []).join(' • ')}
          </div>
        </div>
        <div class="flex items-center justify-between sm:justify-end gap-4 sm:gap-12 bg-white/[0.03] sm:bg-transparent p-3 sm:p-0 rounded-2xl border border-white/5 sm:border-none">
          <div class="flex flex-col sm:items-center">
            <span class="text-[9px] sm:text-[10px] text-gray-500 uppercase font-black tracking-tighter">Admissão</span>
            <span class="text-xs sm:text-sm font-bold text-gray-300">${dataAdm}</span>
          </div>
          <div class="flex flex-col items-center">
            <span class="text-[9px] sm:text-[10px] text-gray-500 uppercase font-black tracking-tighter">Letra</span>
            <span class="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 text-sm font-black border border-emerald-500/20">${p.letra}</span>
          </div>
        </div>
        <div class="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0">
          <button onclick="abrirModalFalta('${p.id}', '${p.nome}')" class="flex-1 sm:flex-none h-12 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xl" title="Falta">🚨</button>
          <button onclick="openEdit('${p.id}')" class="flex-1 sm:flex-none h-12 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all text-xl" title="Editar">✎</button>
          <button onclick="deletePessoa('${p.id}')" class="flex-1 sm:flex-none h-12 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-white/5 text-gray-500 hover:text-red-500 transition-all text-xl" title="Remover">✖</button>
        </div>
      </div>`;
  });
}

function renderRelatorio() {
  const container = document.getElementById('corpoRelatorio');
  if(!container) return;
  if(loadingFaltas) return renderSkeletons('corpoRelatorio');

  if (window.todasFaltas.length === 0) {
    container.innerHTML = '<p class="p-10 text-center text-gray-500 text-xs">Nenhum histórico encontrado.</p>';
    return;
  }

  container.innerHTML = (window.todasFaltas || []).sort((a,b) => b.data.localeCompare(a.data)).map(f => `
      <div class="p-5 sm:px-8 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 group transition-all hover:bg-white/[0.02]">
        <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-10 flex-1 min-w-0">
          <div class="text-xs sm:text-[13px] font-bold text-gray-400 tracking-tighter uppercase sm:w-24">
            ${f.data.split('-').reverse().join('/')}
          </div>
          <div class="font-bold text-[15px] sm:text-sm text-white uppercase truncate tracking-tight">
            ${f.nome}
          </div>
        </div>
        <div class="flex items-center justify-between sm:justify-end gap-4 sm:gap-8">
          <span class="px-4 py-1.5 sm:py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${f.atestado === 'Sim' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}">
            ${f.atestado === 'Sim' ? '✓ Justificada' : '✗ Falta Direta'}
          </span>
          <button onclick="deletarFalta('${f.id}')" class="h-11 sm:h-auto px-4 sm:px-0 bg-red-500/5 sm:bg-transparent rounded-xl text-[10px] text-red-500/40 hover:text-red-500 font-black uppercase tracking-[0.2em] transition-all">
            Excluir
          </button>
        </div>
      </div>`).join('');
}

function calculateLetra(dateString) {
    const viewerDate = new Date(dateString + 'T00:00:00');
    const baseDate = new Date('2025-11-17T00:00:00');
    const diffDays = Math.floor((viewerDate - baseDate) / 86400000);
    return ['A', 'B', 'C', 'D', 'E', 'F'][((diffDays % 6) + 6) % 6];
}

async function addPessoa() {
  const inputNome = document.getElementById('inputNome');
  const nome = inputNome.value.trim();
  const cargoContainer = document.getElementById('cargoContainer');
  removeError(inputNome); removeError(cargoContainer);
  if(!nome) return setError(inputNome, 'O nome é obrigatório');
  if(cargosSel.length === 0) return setError(cargoContainer, 'Selecione ao menos um cargo');

  await addDoc(equipeRef, {
    nome: nome.toUpperCase(),
    letra: document.getElementById('selectLetra').value,
    admissao: document.getElementById('inputAdmissao').value || null,
    cargos: cargosSel
  });
  showToast('Colaborador salvo!');
  inputNome.value = ''; window.fpAdmissao.clear(); cargosSel = [];
  document.querySelectorAll('#cargoContainer .cargo-chip').forEach(el => el.classList.remove('selected'));
}

async function updatePessoa() {
  const id = document.getElementById('editId').value;
  const inputNome = document.getElementById('editNome');
  if(!inputNome.value.trim()) return setError(inputNome, 'Nome obrigatório');
  await updateDoc(doc(db, "equipe", id), {
    nome: inputNome.value.toUpperCase(),
    admissao: document.getElementById('editAdmissao').value,
    letra: document.getElementById('editLetra').value,
    cargos: editCargosSel
  });
  showToast('Atualizado!'); closeEdit();
}

async function salvarFalta() {
  const dataInput = document.getElementById('dataFalta');
  if(!dataInput.value) return setError(dataInput, 'Data obrigatória');
  await addDoc(faltasRef, { 
    funcId: document.getElementById('faltaId').value, 
    nome: document.getElementById('faltaNome').innerText, 
    data: dataInput.value, 
    atestado: document.getElementById('atestadoFalta').value 
  });
  showToast('Falta registrada!'); fecharModalFalta();
}

function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${msg}`;
  container.appendChild(t);
  setTimeout(() => t.classList.add('show'), 100);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); }, 3000);
}

function setError(element, message) {
  element.classList.add('input-error');
  let error = element.parentElement.querySelector('.error-message');
  if (!error) { error = document.createElement('p'); error.className = 'error-message'; element.parentElement.appendChild(error); }
  error.innerText = message;
}

function removeError(element) {
  element.classList.remove('input-error');
  const error = element.parentElement.querySelector('.error-message');
  if (error) error.remove();
}

function showSection(id) { 
    ['cadastro', 'hoje', 'janta', 'relatorio'].forEach(s => {
      document.getElementById('section-'+s)?.classList.toggle('hidden', s !== id);
      document.getElementById('nav-'+s)?.classList.toggle('active', s === id);
    }); 
    const nav = document.getElementById('mainNav');
    if (nav && nav.classList.contains('open')) window.toggleMenu();
    const isDaily = (id === 'hoje' || id === 'janta');
    document.getElementById('shared-date-picker')?.classList.toggle('hidden', !isDaily);
    if(isDaily) renderFolgas(); 
}

function changeDate(days) { 
    const current = window.fpViewer.selectedDates[0] || new Date();
    const next = new Date(current); next.setDate(next.getDate() + days);
    window.fpViewer.setDate(next, true);
}

function toggleC(el, c, isEdit) {
  el.classList.toggle('selected');
  const targetList = isEdit ? editCargosSel : cargosSel;
  const idx = targetList.indexOf(c);
  if(idx > -1) targetList.splice(idx, 1); else targetList.push(c);
  removeError(isEdit ? document.getElementById('editCargoContainer') : document.getElementById('cargoContainer'));
}

function openEdit(id) {
  const p = window.equipe.find(x => x.id === id);
  document.getElementById('editId').value = p.id;
  document.getElementById('editNome').value = p.nome;
  window.fpEditAdmissao.setDate(p.admissao || "");
  document.getElementById('editLetra').value = p.letra;
  editCargosSel = [...(p.cargos || [])];
  document.getElementById('editCargoContainer').innerHTML = listaCargos.map(c => `<div class="cargo-chip ${editCargosSel.includes(c) ? 'selected' : ''}" onclick="toggleC(this, '${c}', true)">${c}</div>`).join('');
  document.getElementById('modalEdit').style.display = 'flex';
}

function closeEdit() { document.getElementById('modalEdit').style.display = 'none'; }
function abrirModalFalta(id, nome) { document.getElementById('faltaId').value = id; document.getElementById('faltaNome').innerText = nome; window.fpFalta.setDate(new Date()); document.getElementById('modalFalta').style.display = 'flex'; }
function fecharModalFalta() { document.getElementById('modalFalta').style.display = 'none'; }
async function deletePessoa(id) { if(await customConfirm('Remover?', 'Esta ação é permanente.')) { await deleteDoc(doc(db, "equipe", id)); showToast('Removido.'); } }
async function deletarFalta(id) { if(await customConfirm('Excluir?', 'Deseja remover do histórico?')) { await deleteDoc(doc(db, "faltas", id)); showToast('Excluído.'); } }
function updateCount() { if(document.getElementById('countEquipe')) document.getElementById('countEquipe').textContent = window.equipe.length; }

function renderFolgas() {
  const v = document.getElementById('viewerDate')?.value; if(!v) return;
  const letra = calculateLetra(v);
  const equipe = window.equipe || [];
  const faltasDoDia = (window.todasFaltas || []).filter(f => f.data === v);
  const idsFaltaram = faltasDoDia.map(f => f.funcId);
  const folguistas = equipe.filter(p => p.letra === letra);
  const presentes = equipe.filter(p => p.letra !== letra && !idsFaltaram.includes(p.id));
  const ausentes = faltasDoDia;
  const res = document.getElementById('resultadoFolga'); if(!res) return;
  res.innerHTML = `
    <div class="mb-10 inline-flex flex-col items-center">
      <div class="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] bg-emerald-500 flex items-center justify-center shadow-lg relative">
         <span class="text-5xl sm:text-7xl font-black text-white leading-none">${letra}</span>
         <div class="absolute -bottom-3 bg-gray-900 px-4 py-1 rounded-full border border-emerald-500/30 text-[10px] font-black text-emerald-500 uppercase tracking-widest">Folga</div>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
      <div class="glass p-5 rounded-2xl border-t-4 border-blue-500/50 bg-blue-500/[0.02]">
        <h3 class="text-blue-400 font-black uppercase mb-4 text-[10px] flex justify-between items-center tracking-widest"><span>Folga</span><span>${folguistas.length}</span></h3>
        <div class="space-y-2">${folguistas.map(p => `<div class="bg-blue-500/5 p-3 rounded-xl text-xs font-bold text-blue-100 uppercase border border-blue-500/10">${p.nome}</div>`).join('') || '<p class="text-gray-600 text-center py-4 text-xs">Ninguém</p>'}</div>
      </div>
      <div class="glass p-5 rounded-2xl border-t-4 border-emerald-500/50 bg-emerald-500/[0.02]">
        <h3 class="text-emerald-400 font-black uppercase mb-4 text-[10px] flex justify-between items-center tracking-widest"><span>Presentes</span><span>${presentes.length}</span></h3>
        <div class="space-y-2">${presentes.map(p => `<div class="bg-emerald-500/5 p-3 rounded-xl text-xs font-bold text-emerald-100 uppercase border border-emerald-500/10">${p.nome}</div>`).join('') || '<p class="text-gray-600 text-center py-4 text-xs">Vazio</p>'}</div>
      </div>
      <div class="glass p-5 rounded-2xl border-t-4 border-red-500/50 bg-red-500/[0.02]">
        <h3 class="text-red-400 font-black uppercase mb-4 text-[10px] flex justify-between items-center tracking-widest"><span>Ausentes</span><span>${ausentes.length}</span></h3>
        <div class="space-y-2">${ausentes.map(f => `<div class="bg-red-500/5 p-3 rounded-xl text-xs font-bold text-red-100 uppercase border border-red-500/10">${f.nome}<br><span class="text-[8px] opacity-50">${f.atestado === 'Sim' ? 'Atestado' : 'Falta Direta'}</span></div>`).join('') || '<p class="text-gray-600 text-center py-4 text-xs">Sem faltas</p>'}</div>
      </div>
    </div>`;
  renderJanta(presentes);
}

function renderJanta(presentes) {
  const container = document.getElementById('resultadoJanta');
  if (!container) return;

  const fixasPresentes = [];
  const mesaEscolhaPresente = [];
  const maquinasBase = [];

  presentes.forEach(p => {
    const nome = p.nome.toUpperCase();
    const isEliandra = nome.includes("ELIANDRA");
    const isClarisse = nome.includes("CLARISSE") || nome.includes("CLARICE");
    const isMaquina = ["SIDNEY", "LUCAS", "LUIS"].some(n => nome.includes(n));
    
    if (isEliandra || isClarisse) fixasPresentes.push(p);
    else if (isMaquina) maquinasBase.push(p);
    else {
      if (!(p.cargos || []).includes("Operador") && !nome.includes("JEFERSON W") && !nome.includes("MAIRA")) mesaEscolhaPresente.push(p);
    }
  });

  const slots = { "17:30": [], "18:30": [], "19:30": [] };
  fixasPresentes.forEach(p => slots["17:30"].push(p));

  const auxiliar = mesaEscolhaPresente.find(p => p.id === window.auxiliarMaquinaId);
  const grupoEspecial = [...maquinasBase];
  if (auxiliar) grupoEspecial.push(auxiliar);

  const temposEspeciais = ["17:30", "18:30", "19:30"].sort(() => Math.random() - 0.5);
  grupoEspecial.forEach((p, i) => { slots[temposEspeciais[i % 3]].push(p); });

  const restantes = mesaEscolhaPresente.filter(p => p.id !== window.auxiliarMaquinaId);
  restantes.sort(() => Math.random() - 0.5).forEach(p => {
    let options = Object.keys(slots);
    if (p.nome.toUpperCase().includes("ELENILDA")) options = options.filter(s => s !== "19:30");
    options.sort((a, b) => slots[a].length - slots[b].length);
    slots[options[0]].push(p);
  });

  window.currentJantaSlots = slots;

  container.innerHTML = `
    <div class="flex flex-col gap-8 mb-10">
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 class="text-emerald-400 font-extrabold uppercase text-[10px] tracking-[0.2em] flex items-center gap-2">
          <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Escala de Janta
        </h3>
        <button onclick="copyJanta()" class="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 px-6 py-2 rounded-xl text-[10px] font-black uppercase border border-emerald-500/20 flex items-center gap-2">Copiar WhatsApp</button>
      </div>
      <div class="glass p-5 rounded-2xl border border-white/5 text-left">
        <label class="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2">Auxiliar de Máquina</label>
        <select onchange="setAuxiliar(this.value)" class="w-full bg-gray-900 border border-white/10 rounded-xl text-xs font-bold uppercase py-3 px-4 text-white">
          <option value="">Selecionar...</option>
          ${mesaEscolhaPresente.map(p => `<option value="${p.id}" ${window.auxiliarMaquinaId === p.id ? 'selected' : ''}>${p.nome}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
      ${Object.entries(slots).map(([time, lista]) => `
        <div class="glass p-5 rounded-2xl border-t-4 border-emerald-500/30 bg-white/[0.01]">
          <h4 class="text-emerald-500 font-black mb-4 text-xs flex justify-between items-center"><span>${time}</span><span class="bg-emerald-500/10 px-2 py-0.5 rounded text-[10px]">${lista.length}</span></h4>
          <div class="space-y-2">
            ${lista.map(p => {
              const isEsp = grupoEspecial.some(e => e.id === p.id);
              return `<div class="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                <div class="w-1.5 h-1.5 rounded-full ${isEsp ? 'bg-amber-500' : 'bg-emerald-500/50'}"></div>
                <span class="text-[11px] font-bold ${isEsp ? 'text-amber-500' : 'text-gray-300'} uppercase truncate">${p.nome}</span>
              </div>`;
            }).join('') || '<p class="text-gray-600 text-center py-2 text-[10px]">Vazio</p>'}
          </div>
        </div>
      `).join('')}
    </div>`;
}

function setAuxiliar(id) {
  window.auxiliarMaquinaId = id || null;
  renderFolgas();
}

function copyJanta() {
  if (!window.currentJantaSlots) return showToast("Nenhuma escala para copiar", "error");
  const v = document.getElementById('viewerDate')?.value;
  const dataFormatada = v ? v.split('-').reverse().join('/') : "";
  let text = `*ESCALA DE JANTA - ${dataFormatada}*\n\n`;
  const m = []; const mes = [];
  Object.entries(window.currentJantaSlots).forEach(([time, lista]) => {
    lista.forEach(p => {
      const isAux = p.id === window.auxiliarMaquinaId;
      const isBaseM = ["SIDNEY", "LUCAS", "LUIS"].some(n => p.nome.toUpperCase().includes(n));
      if (isBaseM || isAux) m.push({ nome: p.nome, time });
      else mes.push({ nome: p.nome, time });
    });
  });
  text += `*MÁQUINAS:*\n`;
  if (m.length > 0) m.forEach(p => { text += `• ${p.nome} - ${p.time}\n`; });
  else text += `(Ninguém hoje)\n`;
  text += `\n*MESA DE ESCOLHA:*\n`;
  if (mes.length > 0) {
    mes.sort((a, b) => a.time.localeCompare(b.time) || a.nome.localeCompare(b.nome));
    let last = "";
    mes.forEach(p => { if (last && last !== p.time) text += `\n`; text += `• ${p.nome} - ${p.time}\n`; last = p.time; });
  } else text += `(Ninguém hoje)\n`;
  navigator.clipboard.writeText(text).then(() => showToast("Escala copiada!")).catch(() => showToast("Erro ao copiar", "error"));
}

function customConfirm(title, text) {
  return new Promise((resolve) => {
    const modal = document.getElementById('modalConfirm');
    if(!modal) return resolve(confirm(text));
    document.getElementById('confirmTitle').innerText = title;
    document.getElementById('confirmText').innerText = text;
    modal.style.display = 'flex';
    const card = modal.querySelector('.confirm-card');
    setTimeout(() => card.classList.add('open'), 10);
    const close = (res) => { card.classList.remove('open'); setTimeout(() => { modal.style.display = 'none'; resolve(res); }, 300); };
    document.getElementById('btnConfirmCancel').onclick = () => close(false);
    document.getElementById('btnConfirmOk').onclick = () => close(true);
  });
}
