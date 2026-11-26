/* ==========================================
   J.A.R.V.I.S. 3.1
   MEMORIA + VOZ + CALCULADORA + IA + BÚSQUEDA
========================================== */

const WORKER_URL = "https://jarvis-brain.patriciovaladez37.workers.dev";

const chat = document.getElementById("chat");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const micButton = document.getElementById("micButton");
const voiceButton = document.getElementById("voiceButton");
const clearButton = document.getElementById("clearButton");
const statusElement = document.getElementById("status");
const statusDot = document.getElementById("statusDot");
const core = document.getElementById("core");

const MEMORY_KEY = "jarvis_memory_v2";
const CHAT_KEY = "jarvis_chat_v2";

let voiceEnabled = true;
let recognition = null;
let busy = false;

let memory = loadMemory();
let conversation = loadConversation();

/* ==========================================
   MEMORIA
========================================== */

function loadMemory() {
  try {
    return JSON.parse(localStorage.getItem(MEMORY_KEY)) || {
      name: "",
      notes: []
    };
  } catch {
    return { name: "", notes: [] };
  }
}

function loadConversation() {
  try {
    const saved = JSON.parse(localStorage.getItem(CHAT_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveMemory() {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
}

function saveConversation() {
  conversation = conversation.slice(-40);
  localStorage.setItem(CHAT_KEY, JSON.stringify(conversation));
}

function normalize(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿?¡!.,;:]/g, "")
    .trim();
}

/* ==========================================
   ESTADO
========================================== */

function setStatus(message, online = true) {
  if (statusElement) statusElement.textContent = message;

  if (statusDot) {
    statusDot.style.background = online ? "#00e5ff" : "#ff4444";
  }
}

/* ==========================================
   CHAT
========================================== */

function addMessage(text, sender = "assistant", save = true) {
  if (!chat) return;

  const message = document.createElement("div");

  message.classList.add("message");
  message.classList.add(
    sender === "user" ? "user-message" : "assistant-message"
  );

  message.textContent = text;
  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;

  if (save) {
    conversation.push({
      role: sender === "user" ? "user" : "assistant",
      content: text
    });

    saveConversation();
  }
}

/* ==========================================
   VOZ
========================================== */

function speak(text) {
  if (!voiceEnabled || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = "es-MX";
  utterance.rate = 1;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();

  const spanishVoice = voices.find(v =>
    v.lang.toLowerCase().startsWith("es-mx")
  ) || voices.find(v =>
    v.lang.toLowerCase().startsWith("es")
  );

  if (spanishVoice) {
    utterance.voice = spanishVoice;
  }

  window.speechSynthesis.speak(utterance);
}

function reply(text) {
  addMessage(text, "assistant");
  speak(text);
}

function getName() {
  return memory.name || "Pato";
}

/* ==========================================
   CALCULADORA
========================================== */

function calculate(text) {
  let expression = normalize(text);

  expression = expression
    .replace(/^cuanto es /, "")
    .replace(/^cuanto da /, "")
    .replace(/^calcula /, "")
    .replace(/^calculame /, "")
    .replace(/^resuelve /, "")
    .replace(/multiplicado por/g, "*")
    .replace(/por/g, "*")
    .replace(/dividido entre/g, "/")
    .replace(/entre/g, "/")
    .replace(/mas/g, "+")
    .replace(/menos/g, "-")
    .replace(/x/g, "*")
    .replace(/,/g, ".")
    .replace(/\s+/g, "");

  if (!/^[0-9+\-*/().%]+$/.test(expression)) return null;
  if (!/[+\-*/]/.test(expression)) return null;

  try {
    const result = Function('"use strict"; return (' + expression + ')')();

    if (typeof result !== "number" || !Number.isFinite(result)) {
      return "No puedo calcular esa operación.";
    }

    return `El resultado es ${result}.`;

  } catch {
    return null;
  }
}

/* ==========================================
   COMANDOS LOCALES
========================================== */

function localCommand(original) {
  const text = normalize(original);

  // Nombre del usuario
  const nameMatch = original.match(/me llamo\s+(.+)/i);

  if (nameMatch) {
    memory.name = nameMatch[1].trim().replace(/[.!?]+$/, "");
    saveMemory();

    return `Entendido. Te llamaré ${memory.name} a partir de ahora.`;
  }

  // Saludos
  if (
    text === "hola" ||
    text.includes("hola jarvis") ||
    text.includes("buenos dias") ||
    text.includes("buenas tardes") ||
    text.includes("buenas noches")
  ) {
    return `Saludos, ${getName()}. Todos mis sistemas están operativos. ¿Qué necesitas?`;
  }

  // Hora
  if (text.includes("que hora") || text === "hora") {
    return `Son las ${new Date().toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit"
    })}.`;
  }

  // Fecha
  if (text.includes("que fecha") || text.includes("que dia es")) {
    return `Hoy es ${new Date().toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    })}.`;
  }

  // Guardar recuerdos
  const rememberMatch = original.match(/recuerda que\s+(.+)/i);

  if (rememberMatch) {
    const note = rememberMatch[1].trim();

    memory.notes.push(note);
    saveMemory();

    return `Lo recordaré, ${getName()}: ${note}`;
  }

  // Consultar recuerdos
  if (
    text.includes("que recuerdas") ||
    text.includes("que recuerdas de mi") ||
    text.includes("que sabes de mi")
  ) {
    const notes = memory.notes.length
      ? memory.notes.map((n, i) => `${i + 1}. ${n}`).join("\n")
      : "Todavía no tengo recuerdos guardados.";

    return `Recuerdo que te llamas ${getName()}.\n${notes}`;
  }

  // Borrar recuerdos
  if (text.includes("borra tu memoria") || text.includes("olvida todo")) {
    memory.notes = [];
    memory.name = "";
    saveMemory();

    return "He borrado mis recuerdos guardados.";
  }

  // Calculadora
  if (
    text.startsWith("cuanto es") ||
    text.startsWith("cuanto da") ||
    text.startsWith("calcula") ||
    text.startsWith("calculame") ||
    text.startsWith("resuelve")
  ) {
    const result = calculate(original);

    if (result) return result;
  }

  // YouTube: se mantiene como comando directo
  if (text.startsWith("busca en youtube ")) {
    const query = original
      .replace(/busca en youtube /i, "")
      .trim();

    window.open(
      "https://www.youtube.com/results?search_query=" +
      encodeURIComponent(query),
      "_blank"
    );

    return `Buscando ${query} en YouTube.`;
  }

  // Abrir páginas directamente
  const sites = {
    spotify: "https://open.spotify.com",
    google: "https://www.google.com",
    youtube: "https://www.youtube.com",
    instagram: "https://www.instagram.com",
    facebook: "https://www.facebook.com",
    tiktok: "https://www.tiktok.com",
    chatgpt: "https://chatgpt.com"
  };

  for (const [name, url] of Object.entries(sites)) {
    if (text === `abre ${name}` || text === `abrir ${name}`) {
      window.open(url, "_blank");

      return `Abriendo ${name}.`;
    }
  }

  // IMPORTANTE:
  // Ya no interceptamos "busca..." para abrir Google.
  // Ahora las búsquedas se envían al cerebro de JARVIS.

  return null;
}

/* ==========================================
   CEREBRO DE CLOUDFLARE
========================================== */

async function askCloudflare(message) {
  setStatus("Consultando inteligencia artificial...", true);

  const history = conversation
    .slice(-8, -1)
    .filter(item =>
      item &&
      ["user", "assistant"].includes(item.role) &&
      typeof item.content === "string"
    );

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        history,
        name: getName()
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Error del servidor: ${response.status}`);
    }

    if (!data.reply) {
      throw new Error("El servidor no devolvió una respuesta.");
    }

    setStatus(
      data.searched
        ? "Consulta de búsqueda procesada"
        : "JARVIS en línea",
      true
    );

    return data.reply;

  } catch (error) {
    console.error("Error conectando con JARVIS:", error);

    setStatus("Error de conexión", false);

    return "No pude conectar con mi cerebro de inteligencia artificial. " +
      "Comprueba que Cloudflare esté disponible y que la conexión no esté bloqueada. " +
      "Detalle: " + error.message;
  }
}

/* ==========================================
   ENVÍO DE MENSAJES
========================================== */

async function sendMessage() {
  if (busy || !userInput) return;

  const original = userInput.value.trim();

  if (!original) return;

  userInput.value = "";

  addMessage(original, "user");

  const localResponse = localCommand(original);

  if (localResponse !== null) {
    reply(localResponse);
    return;
  }

  busy = true;

  if (sendButton) {
    sendButton.disabled = true;
  }

  try {
    const response = await askCloudflare(original);

    reply(response);

  } finally {
    busy = false;

    if (sendButton) {
      sendButton.disabled = false;
    }

    if (userInput) {
      userInput.focus();
    }
  }
}

/* ==========================================
   RECONOCIMIENTO DE VOZ
========================================== */

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();

  recognition.lang = "es-MX";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    setStatus("Escuchando...", true);
  };

  recognition.onresult = event => {
    const transcript = event.results[0][0].transcript;

    if (userInput) {
      userInput.value = transcript;
      sendMessage();
    }
  };

  recognition.onerror = () => {
    setStatus("No pude reconocer tu voz", false);
  };

  recognition.onend = () => {
    setStatus("JARVIS en línea", true);
  };
}

if (micButton) {
  micButton.addEventListener("click", () => {
    if (!recognition) {
      reply("Tu navegador no permite reconocimiento de voz.");
      return;
    }

    try {
      recognition.start();
    } catch (error) {
      console.log(error);
    }
  });
}

/* ==========================================
   BOTONES
========================================== */

if (sendButton) {
  sendButton.addEventListener("click", sendMessage);
}

if (userInput) {
  userInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  });
}

if (voiceButton) {
  voiceButton.addEventListener("click", () => {
    voiceEnabled = !voiceEnabled;

    if (!voiceEnabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    voiceButton.textContent = voiceEnabled
      ? "Voz activada"
      : "Voz desactivada";
  });
}

if (clearButton) {
  clearButton.addEventListener("click", () => {
    conversation = [];
    saveConversation();

    if (chat) {
      chat.innerHTML = "";
    }

    reply("Conversación limpiada. Estoy listo para continuar.");
  });
}

/* ==========================================
   INICIO
========================================== */

if (chat && conversation.length > 0) {
  conversation.forEach(item => {
    addMessage(item.content, item.role, false);
  });
}

setStatus("JARVIS en línea", true);

console.log("J.A.R.V.I.S. 3.1 iniciado correctamente.");
