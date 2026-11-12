import OBR, { buildShape } from "https://cdn.jsdelivr.net/npm/@owlbear-rodeo/sdk@1.5.3/+esm";

const NS = "com.cris-character-link";
const KEY = `${NS}/character`;
const OVERLAY = `${NS}/overlay`;
const $ = (id) => document.getElementById(id);
let selectedIds = [];
let rendering = false;

function say(message) { $("message").textContent = message; }
function readForm() {
  const n = (id) => Math.max(0, Number($(id).value) || 0);
  return {
    name: $("character-name").value.trim() || "Personagem",
    crisUrl: $("cris-url").value.trim(),
    pv: n("pv"), pvMax: Math.max(1,n("pv-max")),
    san: n("san"), sanMax: Math.max(1,n("san-max")),
    pe: n("pe"), peMax: Math.max(1,n("pe-max")),
    visible: $("show-bars").checked,
    showValues: true
  };
}
function writeForm(d) {
  $("character-name").value = d.name || "";
  $("cris-url").value = d.crisUrl || "";
  for (const k of ["pv","pvMax","san","sanMax","pe","peMax"]) {
    const id = ({pvMax:"pv-max",sanMax:"san-max",peMax:"pe-max"})[k] || k;
    if (d[k] != null) $(id).value = d[k];
  }
  $("show-bars").checked = d.visible !== false;
}
async function getSelection() {
  selectedIds = (await OBR.player.getSelection()) || [];
  $("selection").textContent = selectedIds.length ? `${selectedIds.length} token(s) selecionado(s).` : "Nenhum token selecionado.";
}
async function updateSelected(data) {
  if (!selectedIds.length) { say("Selecione um token primeiro."); return; }
  await OBR.scene.items.updateItems(selectedIds, items => {
    for (const item of items) item.metadata = { ...(item.metadata || {}), [KEY]: data };
  });
  say(`Ficha “${data.name}” vinculada ao token.`);
  await renderAll();
}
async function bindSelected() { await updateSelected(readForm()); }
async function unbindSelected() {
  if (!selectedIds.length) { say("Selecione um token primeiro."); return; }
  await OBR.scene.items.updateItems(selectedIds, items => {
    for (const item of items) if (item.metadata) delete item.metadata[KEY];
  });
  say("Vínculo removido.");
  await renderAll();
}
function registerMenus() {
  OBR.contextMenu.create({
    id: `${NS}/bind-menu`,
    icons: [{ icon: "/icons/icon.svg", label: "Definir como meu personagem", filter: { every: [{ key: "layer", value: "CHARACTER" }] } }],
    onClick: async (context) => {
      selectedIds = context.items.map(item => item.id);
      await OBR.notification.show("Abra o painel CRIS Link para importar/vincular a ficha ao token selecionado.", "INFO");
    }
  });
  OBR.contextMenu.create({
    id: `${NS}/visibility-menu`,
    icons: [{ icon: "/icons/eye.svg", label: "Mostrar/ocultar barras PV • SAN • PE", filter: { every: [{ key: "layer", value: "CHARACTER" }] } }],
    onClick: async (context) => {
      const ids = context.items.map(item => item.id);
      await OBR.scene.items.updateItems(ids, items => {
        for (const item of items) {
          const d = item.metadata?.[KEY];
          if (d) item.metadata[KEY] = { ...d, visible: d.visible === false };
        }
      });
      await renderAll();
    }
  });
}
function makeBar(token, bounds, y, ratio, color, index) {
  const width = Math.max(54, Math.min(bounds.width * 0.78, 210));
  const height = Math.max(5, Math.min(9, width * 0.035));
  const gap = height + 3;
  const centerX = token.position.x;
  const startX = centerX - width/2;
  const safeRatio = Math.max(0, Math.min(1, ratio));
  const base = buildShape()
    .shapeType("RECTANGLE").width(width).height(height)
    .position({x:centerX, y})
    .fillColor("#242833").fillOpacity(0.96)
    .strokeColor("#697080").strokeOpacity(0.45).strokeWidth(1)
    .layer("ATTACHMENT").attachedTo(token.id).locked(true).disableHit(true)
    .metadata({[OVERLAY]: {tokenId:token.id,index,kind:"track"}}).build();
  const fillWidth = Math.max(0.5, width * safeRatio);
  const fill = buildShape()
    .shapeType("RECTANGLE").width(fillWidth).height(height)
    .position({x:startX + fillWidth/2, y})
    .fillColor(color).fillOpacity(1)
    .strokeColor(color).strokeOpacity(0).strokeWidth(0)
    .layer("ATTACHMENT").attachedTo(token.id).locked(true).disableHit(true)
    .metadata({[OVERLAY]: {tokenId:token.id,index,kind:"fill"}}).build();
  return [base, ...(safeRatio > 0 ? [fill] : [])];
}
async function renderAll() {
  if (rendering) return;
  rendering = true;
  try {
    const all = await OBR.scene.items.getItems();
    const old = all.filter(i => i.metadata?.[OVERLAY]);
    if (old.length) await OBR.scene.items.deleteItems(old.map(i=>i.id));
    const linked = all.filter(i => i.layer === "CHARACTER" && i.metadata?.[KEY] && i.metadata[KEY].visible !== false);
    const overlays = [];
    for (const token of linked) {
      const d = token.metadata[KEY];
      const bounds = await OBR.scene.items.getItemBounds([token.id]);
      const b = Array.isArray(bounds) ? bounds[0] : bounds;
      if (!b || !Number.isFinite(b.width) || !Number.isFinite(b.height)) continue;
      const topY = token.position.y + b.height/2 + 10;
      const width = Math.max(54, Math.min(b.width * 0.78, 210));
      const h = Math.max(5, Math.min(9, width * 0.035));
      const rows = [
        {v:d.pv,m:d.pvMax,c:"#d94350"},
        {v:d.san,m:d.sanMax,c:"#438bd8"},
        {v:d.pe,m:d.peMax,c:"#d6a13a"}
      ];
      rows.forEach((r,i)=>overlays.push(...makeBar(token,b,topY+i*(h+3),r.m? r.v/r.m:0,r.c,i)));
    }
    if (overlays.length) await OBR.scene.items.addItems(overlays);
    const total = all.filter(i => i.layer === "CHARACTER" && i.metadata?.[KEY]).length;
    say(`${total} ficha(s) vinculada(s); barras atualizadas na cena.`);
  } catch (e) {
    console.error(e);
    say(`Não foi possível desenhar as barras: ${e.message}`);
  } finally { rendering = false; }
}
async function init() {
  $("obr-status").textContent = "Conectando…";
  await getSelection();
  OBR.player.onChange(() => getSelection().catch(console.error));
  OBR.scene.items.onChange(() => {
    if (!rendering) renderAll().catch(console.error);
  });
  $("save").addEventListener("click", bindSelected);
  $("bind").addEventListener("click", bindSelected);
  $("unbind").addEventListener("click", unbindSelected);
  $("import").addEventListener("click", ()=>$("json-file").click());
  $("json-file").addEventListener("change", async e => {
    const f = e.target.files?.[0]; if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      writeForm(data);
      say("JSON importado. Selecione o token e clique em Salvar dados.");
    } catch { say("JSON inválido. Verifique o arquivo."); }
  });
  $("show-bars").addEventListener("change", () => selectedIds.length ? bindSelected() : say("Selecione o token para alterar as barras."));
  registerMenus();
  await renderAll();
  $("obr-status").textContent = "Conectado";
  say("Conectado ao Owlbear. Selecione um token para começar.");
}
OBR.onReady(() => init().catch(err => {
  console.error(err);
  $("obr-status").textContent = "Erro";
  say(`Falha ao iniciar: ${err.message}`);
}));
