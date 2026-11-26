// ==================================================
// J.A.R.V.I.S. 2.0 - MEMORIA + CONVERSACIÓN
// ==================================================

const chat = document.getElementById("chat");
const input = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const micButton = document.getElementById("micButton");
const voiceButton = document.getElementById("voiceButton");
const clearButton = document.getElementById("clearButton");
const statusText = document.getElementById("status");
const statusDot = document.getElementById("statusDot");
const core = document.getElementById("core");
const assistantMessage = document.getElementById("assistantMessage");

let voiceEnabled = true;
let recognition = null;
let isListening = false;
let lastTopic = "";
let conversationHistory = [];

// ==================================================
// MEMORIA LOCAL
// ==================================================

const MEMORY_KEY = "jarvis_memory_v2";
const CHAT_KEY = "jarvis_chat_v2";

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

let memory = loadMemory();

function saveMemory() {
    try {
        localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
    } catch (error) {
        console.warn("No pude guardar la memoria.", error);
    }
}

function saveChat() {
    try {
        localStorage.setItem(
            CHAT_KEY,
            JSON.stringify(conversationHistory.slice(-40))
        );
    } catch (error) {
        console.warn("No pude guardar la conversación.", error);
    }
}

function loadChat() {
    try {
        return JSON.parse(localStorage.getItem(CHAT_KEY)) || [];
    } catch {
        return [];
    }
}

// ==================================================
// ESTADO DEL SISTEMA
// ==================================================

function setStatus(text, color) {
    if (statusText) {
        statusText.textContent = text;
    }

    if (statusDot && color) {
        statusDot.style.background = color;
        statusDot.style.boxShadow = "0 0 12px " + color;
    }
}

// ==================================================
// NORMALIZAR TEXTO
// ==================================================

function normalize(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

// ==================================================
// MENSAJES
// ==================================================

function addMessage(text, type, save = true) {
    if (!chat) return;

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

    if (save) {
        conversationHistory.push({
            text: text,
            type: type
        });

        conversationHistory = conversationHistory.slice(-40);
        saveChat();
    }
}

function addLink(text, url) {
    if (!chat) return;

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
    link.textContent = "ABRIR ENLACE";

    box.appendChild(speaker);
    box.appendChild(paragraph);
    box.appendChild(link);

    chat.appendChild(box);
    chat.scrollTop = chat.scrollHeight;

    conversationHistory.push({
        text: text,
        type: "jarvis"
    });

    conversationHistory = conversationHistory.slice(-40);
    saveChat();
}

// ==================================================
// VOZ
// ==================================================

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

// ==================================================
// RESPUESTAS
// ==================================================

function reply(text) {
    if (assistantMessage) {
        assistantMessage.textContent = text;
    }

    addMessage(text, "jarvis");
    speak(text);
}

function personalizedGreeting() {
    if (memory.name) {
        return "Saludos, " + memory.name +
            ". Todos mis sistemas están operativos. ¿Qué necesitas?";
    }

    return "Saludos. Todos mis sistemas están operativos. ¿Qué necesitas?";
}

// ==================================================
// ENLACES Y BÚSQUEDAS
// ==================================================

function showWebsite(name, url) {
    const text = "He preparado el acceso a " + name +
        ". Pulsa el enlace para abrirlo.";

    if (assistantMessage) {
        assistantMessage.textContent = text;
    }

    addLink(text, url);
    speak("He preparado el enlace a " + name);
}

function searchWeb(query) {
    lastTopic = query;

    const url =
        "https://www.google.com/search?q=" +
        encodeURIComponent(query);

    showWebsite("tu búsqueda: " + query, url);
}

function searchYouTube(query) {
    lastTopic = query;

    const url =
        "https://www.youtube.com/results?search_query=" +
        encodeURIComponent(query);

    showWebsite("YouTube: " + query, url);
}

// ==================================================
// MEMORIA PERSONAL
// ==================================================

function rememberSomething(text) {
    const note = text.trim();

    if (!note) {
        reply("No detecté qué información deseas que recuerde.");
        return;
    }

    memory.notes.push(note);
    memory.notes = memory.notes.slice(-30);

    saveMemory();

    reply("Información guardada en mi memoria local: " + note);
}

function showMemory() {
    let result = [];

    if (memory.name) {
        result.push("Tu nombre es " + memory.name + ".");
    }

    if (memory.notes.length > 0) {
        result.push("También recuerdo lo siguiente:");

        memory.notes.forEach((note, index) => {
            result.push((index + 1) + ". " + note);
        });
    }

    if (result.length === 0) {
        reply("Mi memoria todavía está vacía. Puedes decirme: recuerda que...");
        return;
    }

    reply(result.join(" "));
}

function forgetMemory() {
    memory = {
        name: "",
        notes: []
    };

    saveMemory();

    reply("Memoria personal eliminada. He borrado los datos que guardé.");
}

// ==================================================
// NOMBRE
// ==================================================

function setName(text) {
    const name = text.trim();

    if (!name) {
        reply("No escuché el nombre correctamente.");
        return;
    }

    memory.name = name;
    saveMemory();

    reply("Entendido. Te llamaré " + name + " a partir de ahora.");
}

// ==================================================
// CALCULADORA
// ==================================================

function calculate(text) {
    let expression = text
        .replace(/cuanto es/gi, "")
        .replace(/calcula/gi, "")
        .replace(/calculame/gi, "")
        .replace(/resuelve/gi, "")
        .replace(/cuanto da/gi, "")
        .replace(/mas/gi, "+")
        .replace(/menos/gi, "-")
        .replace(/por/gi, "*")
        .replace(/multiplicado por/gi, "*")
        .replace(/entre/gi, "/")
        .replace(/dividido entre/gi, "/")
        .replace(/%/g, "/100")
        .trim();

    // Solo permite operaciones matemáticas seguras.
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
        reply("No pude interpretar esa operación matemática.");
        return;
    }

    try {
        const result = Function(
            '"use strict"; return (' + expression + ')'
        )();

        if (!Number.isFinite(result)) {
            reply("El resultado no es válido.");
            return;
        }

        reply("El resultado es " + result);
    } catch {
        reply("No pude resolver esa operación.");
    }
}

// ==================================================
// COMANDOS INTELIGENTES
// ==================================================

function processCommand(rawText) {
    const original = rawText.trim();
    const command = normalize(original);

    if (!command) return;

    addMessage(original, "user");
    setStatus("ANALIZANDO", "#ffaa00");

    // ----------------------------------------------
    // RECORDAR NOMBRE
    // ----------------------------------------------

    if (
        command.startsWith("me llamo ") ||
        command.startsWith("mi nombre es ") ||
        command.startsWith("llamame ")
    ) {
        let name = original
            .replace(/^me llamo /i, "")
            .replace(/^mi nombre es /i, "")
            .replace(/^llámame /i, "")
            .replace(/^llamame /i, "")
            .trim();

        setName(name);
        return;
    }

    // ----------------------------------------------
    // MEMORIA
    // ----------------------------------------------

    if (
        command.startsWith("recuerda que ") ||
        command.startsWith("recuerda ")
    ) {
        const note = original
            .replace(/^recuerda que /i, "")
            .replace(/^recuerda /i, "")
            .trim();

        rememberSomething(note);
        return;
    }

    if (
        command.includes("que recuerdas") ||
        command.includes("que tienes en tu memoria") ||
        command.includes("mis recuerdos") ||
        command.includes("muestra tu memoria")
    ) {
        showMemory();
        return;
    }

    if (
        command.includes("borra tu memoria") ||
        command.includes("olvida todo lo que recuerdas") ||
        command.includes("elimina tus recuerdos")
    ) {
        forgetMemory();
        return;
    }

    // ----------------------------------------------
    // SALUDOS
    // ----------------------------------------------

    if (
        command === "hola" ||
        command.startsWith("hola jarvis") ||
        command.includes("buenos dias") ||
        command.includes("buenas tardes") ||
        command.includes("buenas noches") ||
        command === "hey" ||
        command === "que onda"
    ) {
        reply(personalizedGreeting());
        return;
    }

    // ----------------------------------------------
    // IDENTIDAD
    // ----------------------------------------------

    if (
        command.includes("quien eres") ||
        command.includes("como te llamas") ||
        command.includes("tu nombre")
    ) {
        reply(
            "Soy JARVIS, Just a Rather Very Intelligent System. " +
            "Tu asistente personal. Mi sistema de memoria está activo."
        );
        return;
    }

    // ----------------------------------------------
    // HORA
    // ----------------------------------------------

    if (
        command.includes("hora") ||
        command.includes("que horario es")
    ) {
        const time = new Date().toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit"
        });

        reply("La hora actual es " + time);
        return;
    }

    // ----------------------------------------------
    // FECHA
    // ----------------------------------------------

    if (
        command.includes("fecha") ||
        command.includes("que dia es hoy")
    ) {
        const date = new Date().toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        reply("Hoy es " + date);
        return;
    }

    // ----------------------------------------------
    // CALCULADORA
    // ----------------------------------------------

    if (
        command.startsWith("cuanto es ") ||
        command.startsWith("cuanto da ") ||
        command.startsWith("calcula ") ||
        command.startsWith("calculame ") ||
        command.startsWith("resuelve ")
    ) {
        calculate(command);
        return;
    }

    // ----------------------------------------------
    // ESTADO
    // ----------------------------------------------

    if (
        command.includes("como estas") ||
        command.includes("estado del sistema") ||
        command.includes("sistemas operativos")
    ) {
        reply(
            "Funcionando dentro de parámetros normales. " +
            "Memoria local activa. Interfaz operativa. " +
            "Estoy listo para ayudarte."
        );
        return;
    }

    // ----------------------------------------------
    // BUSCAR
    // ----------------------------------------------

    if (
        command.startsWith("busca ") ||
        command.startsWith("buscar ") ||
        command.startsWith("investiga ") ||
        command.startsWith("googlea ")
    ) {
        const query = original
            .replace(/^busca(r)?\s+/i, "")
            .replace(/^investiga\s+/i, "")
            .replace(/^googlea\s+/i, "")
            .trim();

        searchWeb(query);
        return;
    }

    // ----------------------------------------------
    // YOUTUBE
    // ----------------------------------------------

    if (
        command.startsWith("busca en youtube ") ||
        command.startsWith("youtube busca ")
    ) {
        const query = original
            .replace(/^busca en youtube /i, "")
            .replace(/^youtube busca /i, "")
            .trim();

        searchYouTube(query);
        return;
    }

    if (command.includes("youtube")) {
        showWebsite("YouTube", "https://www.youtube.com/");
        return;
    }

    // ----------------------------------------------
    // SITIOS WEB
    // ----------------------------------------------

    if (command.includes("spotify")) {
        showWebsite("Spotify", "https://open.spotify.com/");
        return;
    }

    if (command.includes("chatgpt") || command.includes("chat gpt")) {
        showWebsite("ChatGPT", "https://chatgpt.com/");
        return;
    }

    if (command.includes("instagram")) {
        showWebsite("Instagram", "https://www.instagram.com/");
        return;
    }

    if (command.includes("facebook")) {
        showWebsite("Facebook", "https://www.facebook.com/");
        return;
    }

    if (command.includes("tiktok")) {
        showWebsite("TikTok", "https://www.tiktok.com/");
        return;
    }

    if (command.includes("google")) {
        showWebsite("Google", "https://www.google.com/");
        return;
    }

    // ----------------------------------------------
    // AYUDA
    // ----------------------------------------------

    if (
        command.includes("ayuda") ||
        command.includes("que puedes hacer") ||
        command.includes("tus funciones")
    ) {
        reply(
            "Mis funciones actuales son: conversar mediante comandos, " +
            "recordar datos, guardar tu nombre, decirte la hora y fecha, " +
            "resolver operaciones matemáticas, preparar búsquedas, " +
            "abrir sitios web y utilizar reconocimiento y síntesis de voz. " +
            "Mi IA generativa todavía no está conectada."
        );
        return;
    }

    // ----------------------------------------------
    // GRACIAS
    // ----------------------------------------------

    if (
        command.includes("gracias") ||
        command.includes("te lo agradezco")
    ) {
        reply("Siempre a tus órdenes" +
            (memory.name ? ", " + memory.name : "") + ".");
        return;
    }

    // ----------------------------------------------
    // DESPEDIDA
    // ----------------------------------------------

    if (
        command.includes("adios") ||
        command.includes("hasta luego") ||
        command.includes("nos vemos")
    ) {
        reply("Hasta luego. Estaré disponible cuando me necesites.");
        return;
    }

    // ----------------------------------------------
    // REINICIAR CHAT
    // ----------------------------------------------

    if (
        command.includes("reinicia conversacion") ||
        command.includes("reiniciar conversacion") ||
        command === "limpia chat"
    ) {
        clearChat();
        return;
    }

    // ----------------------------------------------
    // CONTEXTO DE CONVERSACIÓN
    // ----------------------------------------------

    if (
        command.startsWith("y ") ||
        command.startsWith("tambien ") ||
        command.startsWith("ahora busca ")
    ) {
        if (lastTopic) {
            const followUp = original.replace(/^y /i, "");
            searchWeb(lastTopic + " " + followUp);
            return;
        }
    }

    if (
        command.includes("cuentame mas") ||
        command.includes("dime mas") ||
        command.includes("continua")
    ) {
        if (lastTopic) {
            searchWeb("más información sobre " + lastTopic);
            return;
        }
    }

    // ----------------------------------------------
    // RESPUESTA GENERAL
    // ----------------------------------------------

    if (command.includes("quien es")) {
        searchWeb(original);
        return;
    }

    if (
        command.includes("que es ") ||
        command.includes("como funciona ") ||
        command.includes("por que ")
    ) {
        searchWeb(original);
        return;
    }

    // ----------------------------------------------
    // RESPUESTA PERSONALIZADA
    // ----------------------------------------------

    reply(
        "Entiendo tu solicitud" +
        (memory.name ? ", " + memory.name : "") +
        ". Todavía no tengo un modelo de inteligencia artificial " +
        "conectado para generar respuestas abiertas. " +
        "Puedo ayudarte a buscar información o ejecutar mis funciones. " +
        "Si quieres, dime 'busca " + original + "'."
    );
}

// ==================================================
// ENVÍO
// ==================================================

function sendMessage() {
    if (!input) return;

    const text = input.value.trim();

    if (!text) return;

    input.value = "";
    processCommand(text);
}

if (sendButton) {
    sendButton.addEventListener("click", sendMessage);
}

if (input) {
    input.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            sendMessage();
        }
    });
}

// ==================================================
// RECONOCIMIENTO DE VOZ
// ==================================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (SpeechRecognition && micButton) {
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

        if (input) {
            input.value = transcript;
        }

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

} else if (micButton) {
    micButton.disabled = true;
    micButton.textContent = "MICRÓFONO NO COMPATIBLE";
}

// Botón micrófono

if (micButton) {
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
}

// ==================================================
// VOZ ON / OFF
// ==================================================

if (voiceButton) {
    voiceButton.addEventListener("click", function () {
        voiceEnabled = !voiceEnabled;

        if (voiceEnabled) {
            voiceButton.textContent = "🔊 VOZ ON";
            reply("Sistema de voz activado.");
        } else {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }

            voiceButton.textContent = "🔇 VOZ OFF";
            setStatus("SISTEMA EN LÍNEA", "#00ff88");
            addMessage("Voz desactivada.", "jarvis");
        }
    });
}

// ==================================================
// LIMPIAR CONVERSACIÓN
// ==================================================

function clearChat() {
    if (chat) {
        chat.innerHTML = "";
    }

    conversationHistory = [];
    saveChat();

    addMessage(
        "Conversación reiniciada. Mi memoria personal permanece intacta.",
        "jarvis"
    );

    if (assistantMessage) {
        assistantMessage.textContent =
            "Sistemas reiniciados. Esperando instrucciones.";
    }

    setStatus("SISTEMA EN LÍNEA", "#00ff88");
}

if (clearButton) {
    clearButton.addEventListener("click", clearChat);
}

// ==================================================
// RECUPERAR CHAT AL ABRIR
// ==================================================

function restoreChat() {
    const saved = loadChat();

    if (saved.length === 0) {
        addMessage(
            "Sistemas en línea. Memoria local activa. Esperando instrucciones.",
            "jarvis"
        );
        return;
    }

    conversationHistory = [];

    saved.forEach(message => {
        addMessage(message.text, message.type, false);
    });

    conversationHistory = saved.slice(-40);
}

restoreChat();

// ==================================================
// INICIO
// ==================================================

console.log("JARVIS 2.0 iniciado.");
console.log("Memoria local:", memory);
console.log("Interfaz cargada.");
console.log("Módulo de voz:", recognition ? "disponible" : "no disponible");
console.log("Sistema listo.");
