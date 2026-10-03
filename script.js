const C = window.EUFROSINE || {};
const API_URL = C.apiUrl || "";
const DEMO = !API_URL;
const EMOJI = C.emoji || "💙";
const NOME = C.nome || "";

// Sem data configurada, a demonstração conta 30 dias a partir de hoje.
const EVENT_DATE = C.data
  ? new Date(C.data)
  : (() => {
      const d = new Date(Date.now() + 30 * 86400000);
      d.setHours(20, 0, 0, 0);
      return d;
    })();

// Faixas de preço usadas para agrupar o menu. Cada número é o teto de uma faixa: a 1ª vai de 0 até
// o 1º valor, a 2ª do 1º ao 2º, e assim por diante. Acima do último, tudo cai num grupo "acima de".
const PRICE_BRACKETS = Array.isArray(C.faixasDePreco) && C.faixasDePreco.length ? C.faixasDePreco : [100, 200, 300, 500];

// ---------- aplica a configuração na página ----------

function applyConfig() {
  const root = document.documentElement;
  const cores = C.cores || {};
  const isDark = root.getAttribute("data-theme") === "dark";
  const set = (name, light, dark) => {
    const value = isDark ? dark : light;
    if (value) root.style.setProperty(name, value);
    else root.style.removeProperty(name);
  };
  set("--cor", cores.principal, cores.principalNoEscuro);
  set("--cor-escura", cores.principalEscura, cores.principalEscuraNoEscuro);
  set("--cor-suave", cores.suave, cores.suaveNoEscuro);
}

function renderStatic() {
  const titulo = C.titulo || "";
  document.title = [titulo, NOME].filter(Boolean).join(" — ") || document.title;

  document.getElementById("address").textContent = C.local || "";
  document.getElementById("hero-title").textContent = titulo;
  document.getElementById("intro-text").textContent = C.mensagem || "";
  document.getElementById("signature").textContent = [C.assinatura, NOME].filter(Boolean).join(", ");
  document.getElementById("my-gift-title").textContent = `o presente que você escolheu ${EMOJI}`;

  const dia = String(EVENT_DATE.getDate()).padStart(2, "0");
  const mes = String(EVENT_DATE.getMonth() + 1).padStart(2, "0");
  document.getElementById("event-date").innerHTML = `${dia} <span class="event-meta__sep">|</span> ${mes}`;
  const h = EVENT_DATE.getHours();
  const m = EVENT_DATE.getMinutes();
  document.getElementById("event-time").textContent = m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;

  const crest = document.getElementById("crest");
  if (C.imagem) {
    const img = document.createElement("img");
    img.src = C.imagem;
    img.alt = [NOME, titulo].filter(Boolean).join(" — ");
    img.className = "crest__img";
    crest.appendChild(img);
  } else {
    const mono = document.createElement("div");
    mono.className = "crest__monogram";
    mono.setAttribute("aria-hidden", "true");
    mono.textContent = (NOME.trim()[0] || "✦").toUpperCase();
    crest.appendChild(mono);
  }

  document.getElementById("demo-banner").hidden = !DEMO;
}

applyConfig();
renderStatic();

// ---------- comunicação com a planilha (ou com a demonstração) ----------

const demoState = { gifts: null };

async function apiGet() {
  if (!DEMO) {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("falha ao buscar a lista");
    return res.json();
  }
  if (!demoState.gifts) {
    const res = await fetch("exemplo-presentes.json");
    demoState.gifts = await res.json();
  }
  return demoState.gifts.map((g) => ({ ...g }));
}

async function apiPost(body) {
  if (!DEMO) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(body),
    });
    return res.json();
  }
  // Demonstração: nada sai do navegador; a reserva vale só até recarregar a página.
  await new Promise((r) => setTimeout(r, 400));
  if (body.type === "rsvp") return { ok: true };
  const gift = demoState.gifts.find((g) => String(g.id) === String(body.id));
  if (!gift) return { ok: false, reason: "nao_encontrado" };
  if (gift.status !== "disponivel") return { ok: false, reason: "ja_reservado" };
  gift.status = "reservado";
  return { ok: true };
}

// ---------- lista de presentes ----------

const select = document.getElementById("gift-select");
const confirmBtn = document.getElementById("confirm-btn");
const statusEl = document.getElementById("status");
const receiptEl = document.getElementById("receipt");
const receiptItem = document.getElementById("receipt-item");
const receiptSize = document.getElementById("receipt-size");
const receiptColor = document.getElementById("receipt-color");
const receiptLink = document.getElementById("receipt-link");

const myGiftEl = document.getElementById("my-gift");
const myGiftItem = document.getElementById("my-gift-item");
const myGiftMeta = document.getElementById("my-gift-meta");
const myGiftLink = document.getElementById("my-gift-link");
const myGiftWa = document.getElementById("my-gift-wa");

const rsvpNameInput = document.getElementById("rsvp-name");
const rsvpBtn = document.getElementById("rsvp-btn");
const rsvpStatusEl = document.getElementById("rsvp-status");

// O presente escolhido e o nome ficam guardados no navegador do convidado, para ele rever o que
// escolheu (e o link da loja) se fechar a página e voltar depois. Nada disso vai para servidor.
const STORAGE_GIFT = "meuPresente";
const STORAGE_NAME = "meuNome";

let gifts = [];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function formatPrice(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function bracketLabel(min, max) {
  if (min == null) return `até ${formatPrice(max)}`;
  if (max == null) return `acima de ${formatPrice(min)}`;
  return `de ${formatPrice(min)} a ${formatPrice(max)}`;
}

function groupByPriceBracket(list) {
  const groups = PRICE_BRACKETS.map((max, i) => ({
    min: i === 0 ? null : PRICE_BRACKETS[i - 1],
    max,
    items: [],
  }));
  groups.push({ min: PRICE_BRACKETS[PRICE_BRACKETS.length - 1], max: null, items: [] });

  list.forEach((g) => {
    const price = Number(g.preco);
    const group =
      groups.find((b) => (b.max == null || price <= b.max) && (b.min == null || price > b.min)) ||
      groups[groups.length - 1];
    group.items.push(g);
  });

  return groups.filter((g) => g.items.length > 0);
}

function saveName(nome) {
  try {
    localStorage.setItem(STORAGE_NAME, nome);
  } catch (err) {
    // navegador sem localStorage (aba anônima, por ex.): segue sem guardar
  }
}

function restoreName() {
  try {
    const nome = localStorage.getItem(STORAGE_NAME);
    if (nome && !rsvpNameInput.value) rsvpNameInput.value = nome;
  } catch (err) {
    // idem
  }
}

function saveMyGift(gift) {
  try {
    localStorage.setItem(
      STORAGE_GIFT,
      JSON.stringify({
        presente: gift.presente,
        tamanho: gift.tamanho || "",
        cor: gift.cor || "",
        link: gift.link || "",
      })
    );
  } catch (err) {
    // idem
  }
  renderMyGift();
}

function renderMyGift() {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_GIFT) || "null");
  } catch (err) {
    saved = null;
  }

  if (!saved || !saved.presente) {
    myGiftEl.hidden = true;
    return;
  }

  const meta = [
    saved.tamanho && saved.tamanho !== "-" ? `tamanho ${saved.tamanho}` : "",
    saved.cor ? `cor ${saved.cor}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  myGiftItem.textContent = saved.presente;
  myGiftMeta.textContent = meta;

  if (saved.link) {
    myGiftLink.href = saved.link;
    myGiftLink.hidden = false;
    const para = NOME ? ` pro aniversário de ${NOME}` : "";
    const texto = `Presente que escolhi${para}: ${saved.presente}${meta ? ` (${meta})` : ""} — ${saved.link}`;
    myGiftWa.href = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    myGiftWa.hidden = false;
  } else {
    myGiftLink.hidden = true;
    myGiftWa.hidden = true;
  }

  myGiftEl.hidden = false;
}

function setStatus(message, state) {
  statusEl.textContent = message;
  if (state) statusEl.setAttribute("data-state", state);
  else statusEl.removeAttribute("data-state");
}

async function loadGifts() {
  select.disabled = true;
  select.innerHTML = "<option value=''>carregando lista...</option>";
  setStatus("");

  try {
    const data = await apiGet();
    gifts = data.filter((g) => g.status === "disponivel" && g.presente);

    if (gifts.length === 0) {
      select.innerHTML = `<option value=''>todos os presentes já foram escolhidos ${EMOJI}</option>`;
      confirmBtn.disabled = true;
      return;
    }

    select.innerHTML =
      "<option value=''>selecione um presente</option>" +
      groupByPriceBracket(gifts)
        .map((group) => {
          const options = group.items
            .slice()
            .sort((a, b) => Number(a.preco) - Number(b.preco))
            .map((g) => `<option value="${escapeHtml(g.id)}">${escapeHtml(g.presente)}</option>`)
            .join("");
          return `<optgroup label="${escapeHtml(bracketLabel(group.min, group.max))}">${options}</optgroup>`;
        })
        .join("");
    select.disabled = false;
  } catch (err) {
    select.innerHTML = "<option value=''>não foi possível carregar a lista</option>";
    setStatus("Erro ao carregar a lista. Tente atualizar a página.", "err");
  }
}

select.addEventListener("change", () => {
  const chosen = gifts.find((g) => String(g.id) === select.value);
  if (!chosen) {
    receiptEl.hidden = true;
    confirmBtn.disabled = true;
    receiptItem.textContent = "—";
    receiptSize.textContent = "—";
    receiptColor.textContent = "—";
    receiptLink.removeAttribute("href");
    receiptLink.textContent = "—";
    receiptLink.classList.add("receipt__link--empty");
    return;
  }
  receiptItem.textContent = chosen.presente;
  receiptSize.textContent = chosen.tamanho || "—";
  receiptColor.textContent = chosen.cor || "—";

  if (chosen.link) {
    receiptLink.href = chosen.link;
    receiptLink.textContent = "link para a compra na loja ↗";
    receiptLink.classList.remove("receipt__link--empty");
  } else {
    receiptLink.removeAttribute("href");
    receiptLink.textContent = "—";
    receiptLink.classList.add("receipt__link--empty");
  }

  receiptEl.hidden = false;
  confirmBtn.disabled = false;
  setStatus("");
});

confirmBtn.addEventListener("click", async () => {
  const chosen = gifts.find((g) => String(g.id) === select.value);
  if (!chosen) return;

  // Reaproveita o nome já digitado na confirmação de presença, para não pedir duas vezes.
  const quem = rsvpNameInput.value.trim();
  if (!quem) {
    setStatus(`escreve seu nome ali em cima${NOME ? ` pra ${NOME} saber de quem veio` : ""} ${EMOJI}`, "err");
    rsvpNameInput.focus();
    rsvpNameInput.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  confirmBtn.disabled = true;
  setStatus("Reservando...");

  try {
    const result = await apiPost({ id: chosen.id, quem });

    if (result.ok) {
      saveName(quem);
      saveMyGift(chosen);
      receiptEl.hidden = true;
      select.value = "";
      launchConfetti();
      await loadGifts();
      // Depois de recarregar a lista, que limpa a linha de status.
      setStatus(`"${chosen.presente}" reservado com sucesso. Obrigado! ${EMOJI}`, "ok");
    } else {
      setStatus("Ops, alguém acabou de escolher esse presente. Atualizando a lista...", "err");
      await loadGifts();
    }
  } catch (err) {
    setStatus("Erro ao confirmar. Tente novamente.", "err");
    confirmBtn.disabled = false;
  }
});

// ---------- confirmação de presença ----------

function setRsvpStatus(message, state) {
  rsvpStatusEl.textContent = message;
  if (state) rsvpStatusEl.setAttribute("data-state", state);
  else rsvpStatusEl.removeAttribute("data-state");
}

rsvpBtn.addEventListener("click", async () => {
  const nome = rsvpNameInput.value.trim();
  if (!nome) {
    setRsvpStatus("escreve seu nome antes de confirmar.", "err");
    return;
  }
  const acompanhado = document.querySelector('input[name="rsvp-companion"]:checked').value === "with-company";

  rsvpBtn.disabled = true;
  setRsvpStatus("enviando...");

  try {
    const result = await apiPost({ type: "rsvp", nome, acompanhado });

    if (result.ok) {
      saveName(nome);
      setRsvpStatus(`presença confirmada, ${nome}. Te espero lá! ${EMOJI}`, "ok");
    } else {
      setRsvpStatus("não deu pra confirmar. Tenta de novo.", "err");
      rsvpBtn.disabled = false;
    }
  } catch (err) {
    setRsvpStatus("erro ao confirmar. Tenta de novo.", "err");
    rsvpBtn.disabled = false;
  }
});

loadGifts();
restoreName();
renderMyGift();

// ---------- contagem regressiva ----------

const countdownEl = document.getElementById("countdown");
const cdDays = document.getElementById("cd-days");
const cdHours = document.getElementById("cd-hours");
const cdMin = document.getElementById("cd-min");
const cdSec = document.getElementById("cd-sec");

let countdownTimer;

function updateCountdown() {
  const diff = EVENT_DATE.getTime() - Date.now();

  if (diff <= 0) {
    clearInterval(countdownTimer);
    countdownEl.classList.add("countdown--done");
    countdownEl.innerHTML = "<p>é hoje! 🎉</p>";
    return;
  }

  const totalSeconds = Math.floor(diff / 1000);
  cdDays.textContent = String(Math.floor(totalSeconds / 86400)).padStart(2, "0");
  cdHours.textContent = String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, "0");
  cdMin.textContent = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  cdSec.textContent = String(totalSeconds % 60).padStart(2, "0");
}

updateCountdown();
countdownTimer = setInterval(updateCountdown, 1000);

// ---------- modo claro/escuro ----------

const themeBtn = document.getElementById("theme-btn");

function updateThemeLabel() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  themeBtn.setAttribute("aria-label", isDark ? "mudar para modo claro" : "mudar para modo escuro");
}

updateThemeLabel();

themeBtn.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  if (isDark) document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", "dark");
  try {
    localStorage.setItem("theme", isDark ? "light" : "dark");
  } catch (err) {}
  applyConfig();
  updateThemeLabel();
});

// ---------- compartilhar ----------

const shareBtn = document.getElementById("share-btn");
const shareFeedback = document.getElementById("share-feedback");
let shareFeedbackTimeout;

function showShareFeedback(message) {
  clearTimeout(shareFeedbackTimeout);
  shareFeedback.textContent = message;
  shareFeedback.setAttribute("data-visible", "true");
  shareFeedbackTimeout = setTimeout(() => {
    shareFeedback.removeAttribute("data-visible");
  }, 2200);
}

shareBtn.addEventListener("click", async () => {
  const url = window.location.href;

  if (navigator.share) {
    try {
      await navigator.share({ title: document.title, url });
    } catch (err) {
      // convidado cancelou o compartilhamento
    }
    return;
  }

  try {
    await navigator.clipboard.writeText(url);
    showShareFeedback(`link copiado! ${EMOJI}`);
  } catch (err) {
    showShareFeedback("não foi possível copiar o link");
  }
});

// ---------- confete ----------

function launchConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  const css = getComputedStyle(document.documentElement);
  const colors = [
    css.getPropertyValue("--cor").trim() || "#1800AC",
    css.getPropertyValue("--cor-suave").trim() || "#ECE9FB",
    css.getPropertyValue("--muted").trim() || "#6E64A6",
    "#FFD166",
    "#FFFFFF",
  ];
  const particles = Array.from({ length: 140 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.3,
    size: 6 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    speedY: 2 + Math.random() * 3,
    speedX: -1.5 + Math.random() * 3,
    rotation: Math.random() * 360,
    spin: -6 + Math.random() * 12,
  }));

  const start = performance.now();
  const duration = 3200;

  function frame(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.rotation += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    });
    if (elapsed < duration) requestAnimationFrame(frame);
    else canvas.remove();
  }

  requestAnimationFrame(frame);
}
