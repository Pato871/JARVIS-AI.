// ============================================
// J.A.R.V.I.S. AI - PROTOTYPE 2.0
// ============================================

const chat = document.getElementById("chat");
const input = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const micButton = document.getElementById("micButton");
const voiceButton = document.getElementById("voiceButton");
const clearButton = document.getElementById("clearButton");
const statusText = document.getElementById("status");
const statusDot = document.getElementById("statusDot");
const core = document.getElementById("core");

let voiceEnabled = true;
let recognition = null;
let isListening = false;


// ============================================
// ESTADO
// ============================================

function setStatus(text, color) {
  statusText.textContent = text;

  if (color) {
    statusDot.style.background = color;
    statusDot.style.boxShadow = "0 0 12px " + color;
  }
}


// ============================================
// MENSAJES
// ============================================

function addMessage(text, type) {
  const box = document.createElement("div");
  box.className = "message " + type;

  const speaker = document.createElement("span");
  speaker.className = "speaker";
  speaker.textContent = type === "jarvis" ? "JARVIS" : "TÚ";

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  box.appendChild(speaker);
  box.appendChild(paragraph);

  chat.appendChild(box);
  chat.scrollTop = chat.scrollHeight;
}


// Mensaje con enlace seguro y clicable
function addLink(text, url) {
  const box = document.createElement("div");
  box.className = "message jarvis";

  const speaker = document.createElement("span");
  speaker.className = "speaker";
  speaker.textContent = "JARVIS";

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "ABRIR " + url;

  box.appendChild(speaker);
  box.appendChild(paragraph);
  box.appendChild(link);

  chat.appendChild(box);
  chat.scrollTop = chat.scrollHeight;
}


// ============================================
// VOZ SINTETIZADA
// ============================================

function speak(text) {
  if (!voiceEnabled) return;

  if (!window.speechSynthesis) {
    setStatus("VOZ NO DISPONIBLE", "#ffaa00");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = "es-MX";
  utterance.rate = 0.92;
  utterance.pitch = 0.78;
  utterance.volume = 1;

  utterance.onstart = function () {
    setStatus("JARVIS HABLANDO", "#00eaff");
  };

  utterance.onend = function () {
    setStatus("SISTEMA EN LÍNEA", "#00ff88");
  };

  utterance.onerror = function () {
    setStatus("SISTEMA EN LÍNEA", "#00ff88");
  };

  window.speechSynthesis.speak(utterance);
}


// ============================================
// RESPONDER
// ============================================

function reply(text) {
  document.getElementById("assistantMessage").textContent = text;
  addMessage(text, "jarvis");
  speak(text);
}


// ============================================
// ENLACES
// ============================================

function showWebsite(name, url) {
  const text = "He preparado el acceso a " + name +
    ". Pulsa el enlace para abrirlo.";

  document.getElementById("assistantMessage").textContent = text;

  addLink(text, url);
  speak("He preparado el enlace a " + name);
}


function searchWeb(query) {
  const url =
    "https://www.google.com/search?q=" +
    encodeURIComponent(query);

  showWebsite("tu búsqueda: " + query, url);
}


// ============================================
// COMANDOS
// ============================================

function processCommand(rawText) {
  const command = rawText.toLowerCase().trim();

  if (!command) return;

  addMessage(rawText, "user");

  setStatus("ANALIZANDO", "#ffaa00");

  // SALUDOS
  if (
    command.includes("hola") ||
    command.includes("buenos días") ||
    command.includes("buenas tardes") ||
    command.includes("buenas noches")
  ) {
    reply("Saludos. Todos mis sistemas están operativos. ¿Qué necesitas?");
  }

  // IDENTIDAD
  else if (
    command.includes("quién eres") ||
    command.includes("quien eres") ||
    command.includes("cómo te llamas") ||
    command.includes("tu nombre")
  ) {
    reply("Soy JARVIS, Just a Rather Very Intelligent System. Tu asistente personal.");
  }

  // HORA
  else if (command.includes("hora")) {
    const time = new Date().toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit"
    });

    reply("La hora actual es " + time);
  }

  // FECHA
  else if (command.includes("fecha")) {
    const date = new Date().toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    reply("Hoy es " + date);
  }

  // ESTADO
  else if (
    command.includes("cómo estás") ||
    command.includes("como estas") ||
    command.includes("estado del sistema")
  ) {
    reply("Funcionando dentro de parámetros normales. Estoy listo.");
  }

  // BUSCAR
  else if (
    command.startsWith("busca ") ||
    command.startsWith("buscar ") ||
    command.startsWith("investiga ")
  ) {
    let query = command
      .replace(/^busca(r)?\s+/, "")
      .replace(/^investiga\s+/, "");

    searchWeb(query);
  }

  // YOUTUBE
  else if (command.includes("youtube")) {
    showWebsite("YouTube", "https://www.youtube.com/");
  }

  // GOOGLE
  else if (command.includes("google")) {
    showWebsite("Google", "https://www.google.com/");
  }

  // SPOTIFY
  else if (command.includes("spotify")) {
    showWebsite("Spotify", "https://open.spotify.com/");
  }

  // CHATGPT
  else if (command.includes("chatgpt") || command.includes("chat gpt")) {
    showWebsite("ChatGPT", "https://chatgpt.com/");
  }

  // INSTAGRAM
  else if (command.includes("instagram")) {
    showWebsite("Instagram", "https://www.instagram.com/");
  }

  // FACEBOOK
  else if (command.includes("facebook")) {
    showWebsite("Facebook", "https://www.facebook.com/");
  }

  // TIKTOK
  else if (command.includes("tiktok")) {
    showWebsite("TikTok", "https://www.tiktok.com/");
  }

  // AYUDA
  else if (
    command.includes("ayuda") ||
    command.includes("qué puedes hacer") ||
    command.includes("que puedes hacer")
  ) {
    reply("Puedo conversar mediante comandos, decirte la hora y fecha, preparar búsquedas, mostrar enlaces, abrir sitios mediante enlaces y responder a comandos básicos. Mi inteligencia artificial avanzada todavía está pendiente de conexión.");
  }

  // GRACIAS
  else if (command.includes("gracias")) {
    reply("Siempre a tus órdenes.");
  }

  // DESPEDIDA
  else if (
    command.includes("adiós") ||
    command.includes("adios") ||
    command.includes("hasta luego")
  ) {
    reply("Hasta luego. Estaré disponible cuando me necesites.");
  }

  // REINICIAR
  else if (
    command.includes("reinicia conversación") ||
    command.includes("reiniciar conversación")
  ) {
    clearChat();
  }

  // DESCONOCIDO
  else {
    reply("He recibido tu instrucción. Aún no tengo conectado mi cerebro de inteligencia artificial para responder preguntas abiertas. Podemos agregarlo en el siguiente módulo.");
  }
}


// ============================================
// ENVÍO DE TEXTO
// ============================================

function sendMessage() {
  const text = input.value.trim();

  if (!text) return;

  input.value = "";
  processCommand(text);
}

sendButton.addEventListener("click", sendMessage);

input.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    sendMessage();
  }
});


// ============================================
// RECONOCIMIENTO DE VOZ
// ============================================

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();

  recognition.lang = "es-MX";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = function () {
    isListening = true;

    document.body.classList.add("listening");

    micButton.textContent = "🛑 DETENER";
    setStatus("ESCUCHANDO", "#00ffcc");
  };

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;

    input.value = transcript;

    processCommand(transcript);
  };

  recognition.onerror = function (event) {
    console.log("Micrófono:", event.error);

    if (event.error === "not-allowed") {
      reply("El navegador ha bloqueado el micrófono. Puedes seguir escribiéndome.");
    } else if (event.error === "network") {
      reply("El reconocimiento de voz necesita conexión a Internet.");
    } else {
      setStatus("MICRÓFONO NO DISPONIBLE", "#ffaa00");
    }
  };

  recognition.onend = function () {
    isListening = false;

    document.body.classList.remove("listening");

    micButton.textContent = "🎤 HABLAR";
    setStatus("SISTEMA EN LÍNEA", "#00ff88");
  };

} else {
  micButton.disabled = true;
  micButton.textContent = "MICRÓFONO NO COMPATIBLE";
}


// BOTÓN DE MICRÓFONO
micButton.addEventListener("click", function () {
  if (!recognition) {
    reply("El reconocimiento de voz no es compatible con este entorno.");
    return;
  }

  if (isListening) {
    recognition.stop();
  } else {
    try {
      recognition.start();
    } catch (error) {
      console.log(error);
      reply("No pude iniciar el micrófono. Comprueba los permisos.");
    }
  }
});


// ============================================
// VOZ ON / OFF
// ============================================

voiceButton.addEventListener("click", function () {
  voiceEnabled = !voiceEnabled;

  if (voiceEnabled) {
    voiceButton.textContent = "🔊 VOZ ON";
    reply("Sistema de voz activado.");
  } else {
    window.speechSynthesis.cancel();
    voiceButton.textContent = "🔇 VOZ OFF";
    setStatus("SISTEMA EN LÍNEA", "#00ff88");
    addMessage("Voz desactivada.", "jarvis");
  }
});


// ============================================
// LIMPIAR CONVERSACIÓN
// ============================================

function clearChat() {
  chat.innerHTML = "";

  addMessage(
    "Conversación reiniciada. Estoy listo para recibir instrucciones.",
    "jarvis"
  );

  document.getElementById("assistantMessage").textContent =
    "Sistemas reiniciados. Esperando instrucciones.";

  setStatus("SISTEMA EN LÍNEA", "#00ff88");
}

clearButton.addEventListener("click", clearChat);


// ============================================
// INICIO
// ============================================

console.log("JARVIS 2.0 iniciado.");
console.log("Interfaz cargada.");
console.log("Módulo de voz:", recognition ? "disponible" : "no disponible");
console.log("Sistema listo.");
