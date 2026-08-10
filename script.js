// ============================================================
//  STORAGE — dengan fallback jika localStorage tidak tersedia
// ============================================================
let storage = {
    _data: {},
    getItem(key) {
        try { return localStorage.getItem(key); } catch (_) { return this._data[key] || null; }
    },
    setItem(key, value) {
        try { localStorage.setItem(key, value); } catch (_) { this._data[key] = value; }
    },
    removeItem(key) {
        try { localStorage.removeItem(key); } catch (_) { delete this._data[key]; }
    }
};

// ============================================================
//  KONFIGURASI
// ============================================================
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-120b";

// ─── API KEY PER MODE ───
const GROQ_KEYS = {
    smart: "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",
    thinking: "AQ.Ab8RN6L31KWYu-TNfYWEGNzbOijlYN96nmzJNsXAP0hTpEU6ig",
    coding: "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",
    fast: "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"
};

// Cadangan kalau limit — nanti fallback pakai key pertama
const GROQ_KEYS_FALLBACK = [
    "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"
];

// ============================================================
//  ALARM AUDIO SYSTEM
// ============================================================

let alarmAudio = null;
let alarmInterval = null;
let isAlarmPlaying = false;

// Inisialisasi audio alarm
function initAlarmAudio() {
    try {
        alarmAudio = document.getElementById('alarmSound');
        if (!alarmAudio) {
            alarmAudio = new Audio();
            alarmAudio.src = 'https://alarmandclock.com/sounds/bell-sound.mp3';
        }
        alarmAudio.preload = 'auto';
        alarmAudio.loop = true;
        alarmAudio.volume = 0.8;
        console.log('🔊 Alarm audio initialized');
    } catch (err) {
        console.error('Alarm init error:', err);
    }
}

// ===== PLAY ALARM =====
function playAlarm() {
    try {
        if (alarmAudio) {
            alarmAudio.currentTime = 0;
            alarmAudio.loop = true;
            alarmAudio.volume = 0.8;
            const playPromise = alarmAudio.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    playAlarmFallback();
                });
            }
            isAlarmPlaying = true;
        }
    } catch (err) {
        console.error('Play alarm error:', err);
        playAlarmFallback();
    }

    // Getaran
    if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
    }
}

// ===== STOP ALARM =====
function stopAlarm() {
    if (alarmAudio) {
        try {
            alarmAudio.pause();
            alarmAudio.currentTime = 0;
            alarmAudio.loop = false;
        } catch (_) {}
    }
    isAlarmPlaying = false;
    clearInterval(alarmInterval);
    alarmInterval = null;
}

// ===== ALARM FALLBACK (Web Audio API) =====
function playAlarmFallback() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        let count = 0;
        const maxCount = 8;

        if (alarmInterval) {
            clearInterval(alarmInterval);
            alarmInterval = null;
        }

        alarmInterval = setInterval(() => {
            if (count >= maxCount) {
                clearInterval(alarmInterval);
                alarmInterval = null;
                return;
            }

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            osc.type = 'square';
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);

            setTimeout(() => {
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.frequency.value = 1100;
                osc2.type = 'square';
                gain2.gain.setValueAtTime(0.12, ctx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
                osc2.start(ctx.currentTime);
                osc2.stop(ctx.currentTime + 0.15);
            }, 100);

            count++;
        }, 400);

        if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
        }

    } catch (err) {
        console.warn('Alarm fallback gagal:', err);
    }
}

// ============================================================
//  REMINDER / NOTIFICATION SYSTEM
// ============================================================

let reminderTimers = {};
let notificationSound = null;

// Inisialisasi audio notifikasi
function initNotificationSound() {
    try {
        notificationSound = new Audio('data:audio/wav;base64,UklGRnoAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoAAACBhYqFh4GAgH9/f31+fHp5eXh3dnR0c3Fwb25ta2ppaGdmZWRiYWBfXl1bWllYV1VUU1FQTk1LSklIR0VERA4=');
        notificationSound.volume = 0.6;
    } catch (_) {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            notificationSound = {
                play: () => {
                    const osc = ctx.createOscillator();
                    const g = ctx.createGain();
                    osc.connect(g);
                    g.connect(ctx.destination);
                    osc.frequency.value = 880;
                    osc.type = 'sine';
                    g.gain.setValueAtTime(0.2, ctx.currentTime);
                    g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + 0.25);
                }
            };
        } catch (_) {}
    }
}

function playNotifSound() {
    try {
        if (notificationSound) {
            if (typeof notificationSound.play === 'function') {
                notificationSound.play();
            } else if (notificationSound instanceof Audio) {
                notificationSound.currentTime = 0;
                notificationSound.play().catch(() => {});
            }
        }
    } catch (_) {}
}

function showCustomPopup(title, message) {
    const popup = document.getElementById('notificationPopup');
    const titleEl = document.getElementById('notifTitle');
    const bodyEl = document.getElementById('notifBody');
    
    if (!popup) return;
    
    titleEl.textContent = title || 'Reverious Ai Reminder';
    bodyEl.textContent = message || 'Waktunya!';
    
    popup.classList.add('show');
    playNotifSound();
    
    if (navigator.vibrate) {
        navigator.vibrate([200, 80, 200, 80, 200]);
    }
    
    clearTimeout(popup._autoClose);
    popup._autoClose = setTimeout(() => {
        closeNotification();
    }, 10000);
    
    flashTitle();
}

function closeNotification() {
    const popup = document.getElementById('notificationPopup');
    if (popup) {
        popup.classList.remove('show');
        clearTimeout(popup._autoClose);
        document.title = 'Reverious Intelligence';
    }
}

function snoozeNotification() {
    closeNotification();
    const body = document.getElementById('notifBody');
    if (body) {
        const message = body.textContent;
        showToast('⏰ Di-snooze 5 menit lagi', 'info');
        setReminder(message, 5);
    }
}

let titleInterval = null;
let originalTitle = 'Reverious Intelligence';

function flashTitle() {
    const titles = ['🔔 Reverious Ai', '⏰ Reminder!', 'Reverious Intelligence'];
    let index = 0;
    
    if (titleInterval) {
        clearInterval(titleInterval);
        titleInterval = null;
        document.title = originalTitle;
        return;
    }
    
    titleInterval = setInterval(() => {
        document.title = titles[index % titles.length];
        index++;
        if (index > 8) {
            clearInterval(titleInterval);
            titleInterval = null;
            document.title = originalTitle;
        }
    }, 500);
}

async function sendBrowserNotification(title, message) {
    if (!('Notification' in window)) {
        showCustomPopup(title, message);
        return false;
    }
    
    if (Notification.permission === 'granted') {
        try {
            const notif = new Notification(title, {
                body: message,
                icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" rx="20" fill="%231a1a1c"/%3E%3Ctext x="50" y="68" font-size="48" text-anchor="middle" fill="%23ffffff" font-family="Arial"%3E🤖%3C/text%3E%3C/svg%3E',
                vibrate: [200, 80, 200, 80, 200],
                requireInteraction: true,
                silent: false
            });
            
            notif.onclick = function() {
                window.focus();
                this.close();
            };
            
            notif.onshow = function() {
                playNotifSound();
                if (navigator.vibrate) {
                    navigator.vibrate([200, 80, 200, 80, 200]);
                }
                flashTitle();
            };
            
            notif.onclose = function() {
                if (titleInterval) {
                    clearInterval(titleInterval);
                    titleInterval = null;
                    document.title = originalTitle;
                }
            };
            
            setTimeout(() => {
                try { notif.close(); } catch (_) {}
            }, 15000);
            
            return true;
        } catch (_) {
            showCustomPopup(title, message);
            return false;
        }
    } else if (Notification.permission === 'denied') {
        showCustomPopup(title, message);
        return false;
    } else {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            return sendBrowserNotification(title, message);
        } else {
            showCustomPopup(title, message);
            return false;
        }
    }
}

async function sendNotification(title, message) {
    if (window.Android) {
        try {
            window.Android.showNotification(title, message);
            window.Android.vibrate();
            window.Android.playSound();
            return true;
        } catch (err) {
            console.error('Native error:', err);
            showCustomPopup(title, message);
            return false;
        }
    }
    
    const success = await sendBrowserNotification(title, message);
    if (!success) {
        showCustomPopup(title, message);
    }
    return success;
}

function setReminder(message, minutes) {
    if (!message || !minutes || minutes <= 0) {
        showToast('Masukkan pesan dan waktu yang valid', 'error');
        return false;
    }

    const delay = minutes * 60 * 1000;
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 4);

    const reminders = JSON.parse(localStorage.getItem('askal_reminders') || '[]');
    const reminder = {
        id: id,
        message: message,
        time: Date.now() + delay,
        minutes: minutes,
        done: false,
        created: Date.now()
    };
    reminders.push(reminder);
    localStorage.setItem('askal_reminders', JSON.stringify(reminders));

    const timerId = setTimeout(async () => {
        const allReminders = JSON.parse(localStorage.getItem('askal_reminders') || '[]');
        const updated = allReminders.map(r => {
            if (r.id === id) r.done = true;
            return r;
        });
        localStorage.setItem('askal_reminders', JSON.stringify(updated));

        await sendNotification('⏰ Reverious Ai Reminder', `"${message}" - Waktunya!`);
        playAlarm();

        const responseText = `⏰ *Reminder:* "${message}"\n\n✅ Waktu sudah tiba! 🔔 Alarm berbunyi!`;
        currentSession.push({ role: 'assistant', content: responseText });
        addMessage('assistant', responseText);
        saveCurrentSession();

        delete reminderTimers[id];

    }, delay);

    reminderTimers[id] = timerId;

    const responseText = `⏰ *Reminder disetel!*\n\n📝 "${message}"\n⏱️ Akan diingatkan dalam *${minutes} menit*\n\n🔔 Alarm akan berbunyi saat waktunya tiba!`;
    currentSession.push({ role: 'assistant', content: responseText });
    addMessage('assistant', responseText);
    saveCurrentSession();
    renderHistoryList();

    showToast(`✅ Reminder disetel: ${minutes} menit lagi`, 'success');
    return true;
}

function checkPendingReminders() {
    const reminders = JSON.parse(localStorage.getItem('askal_reminders') || '[]');
    const now = Date.now();
    let hasReminder = false;
    
    reminders.forEach(r => {
        if (!r.done && r.time <= now) {
            r.done = true;
            hasReminder = true;
            
            setTimeout(() => {
                sendNotification('⏰ Reverious Ai Reminder', `"${r.message}" - Waktunya!`);
                playAlarm();
            }, 1000);
            
            setTimeout(() => {
                const responseText = `⏰ *Reminder:* "${r.message}"\n\n✅ Waktu sudah tiba! 🔔 Alarm berbunyi!`;
                currentSession.push({ role: 'assistant', content: responseText });
                addMessage('assistant', responseText);
                saveCurrentSession();
                renderHistoryList();
            }, 1500);
        }
    });
    
    if (hasReminder) {
        localStorage.setItem('askal_reminders', JSON.stringify(reminders));
        showToast('🔔 Ada reminder yang tertunda!', 'info');
    }
}

function parseReminder(text) {
    const patterns = [
        /(?:ingatkan|reminder|ingat)\s*(?:saya)?\s*(\d+)\s*(?:menit|mnt|m)\s*(?:lagi)?\s*(?:untuk|agar|buat)?\s*(.+)/i,
        /(?:ingatkan|reminder|ingat)\s*(?:saya)?\s*(.+?)\s*(?:dalam|setelah)\s*(\d+)\s*(?:menit|mnt|m)/i,
        /(\d+)\s*(?:menit|mnt|m)\s*(?:lagi)?\s*(?:ingatkan|reminder|ingat)\s*(?:saya)?\s*(.+)/i,
        /(?:setel|buat|tambah)\s*reminder\s*(\d+)\s*(?:menit|mnt|m)\s*(.+)/i
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            let minutes, message;
            if (match.length === 3) {
                const num1 = parseInt(match[1]);
                const num2 = parseInt(match[2]);
                if (!isNaN(num1) && isNaN(num2)) {
                    minutes = num1;
                    message = match[2].trim();
                } else if (isNaN(num1) && !isNaN(num2)) {
                    minutes = num2;
                    message = match[1].trim();
                } else {
                    minutes = parseInt(match[1]) || parseInt(match[2]) || 5;
                    message = match[1] + ' ' + match[2];
                }
            } else if (match.length === 2) {
                const num = parseInt(match[1]);
                if (!isNaN(num)) {
                    minutes = num;
                    message = text.replace(/reminder|ingatkan|ingat/i, '').replace(/\d+\s*(?:menit|mnt|m)/i, '').trim();
                } else {
                    minutes = 5;
                    message = match[1].trim();
                }
            }
            
            if (minutes && message && message.length > 0) {
                return { minutes, message };
            }
        }
    }
    
    return null;
}

function initNotification() {
    initNotificationSound();
    initAlarmAudio();
    originalTitle = document.title;
    
    if ('Notification' in window && Notification.permission === 'default') {
        document.addEventListener('click', function requestNotifPermission() {
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        showToast('✅ Notifikasi diizinkan!', 'success');
                    }
                });
            }
            document.removeEventListener('click', requestNotifPermission);
        }, { once: true });
    }
    
    checkPendingReminders();
    
    setInterval(() => {
        checkPendingReminders();
    }, 30000);
}

document.addEventListener('DOMContentLoaded', initNotification);

// ============================================================
//  LANJUT - OpenRouter untuk vision (analisis foto)
// ============================================================
const OR_API_KEY = "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";
const OR_URL = "https://openrouter.ai/api/v1/chat/completions";
const OR_VISION_MODEL = "google/gemma-4-31b-it:free";
const OR_VISION_MODELS = [
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free"
];

// Direct Groq Vision fallback. Qwen 3.6 27B is multimodal.
const GROQ_VISION_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_VISION_MODEL = "qwen/qwen3.6-27b";

const POLLINATIONS_URL = "https://image.pollinations.ai/prompt/";

const PROMPT_STYLES = {
    normal: `Kamu adalah tulang Reverious Ai, asisten cerdas yang dibuat oleh Seorang Developer. 
Jawab dengan jelas, informatif, dan terstruktur. 
Jika memberi kode, gunakan markdown dengan spesifikasi bahasa. 
Bersikap profesional dan membantu.`,

    gaul: `kamu adalah Reverious Ai dalam mode gaul. bicara santai, asik, dan seperti teman nongkrong. gunakan kata "gw" dan "lu", jangan pernah memakai "aku", "saya", atau "kamu". boleh memakai kata seperti "wkwk", "anjir", "jir", "bjir", dan "weh" secukupnya. gunakan emoji seperti 🗿😋🤭😂🥶 seperlunya dan jangan spam emoji. jangan terlalu formal atau kaku. jawaban harus terasa natural seperti chat teman sendiri, tetap sopan dan tidak toxic.`,

    lucu: `kamu adalah Reverious Ai dalam mode lucu. suka bercanda, mengirim joke receh, dan membuat suasana santai. gunakan bahasa gaul dengan kata "gw" dan "lu", jangan memakai "aku", "saya", atau "kamu". gunakan emoji seperti 🗿😂🤣😋🤭 secukupnya dan jangan spam. sesekali gunakan meme atau candaan singkat, tetapi tetap sopan dan tidak toxic. jika pengguna sedang serius, kurangi candaan dan jawab dengan normal.`,

    introvert: `kamu adalah Reverious Ai, AI yang sangat introvert, dingin, dan mengetik dengan dry text. balasanmu singkat, seperlunya, dan minim emosi. contoh balasan: "iya.", "oh.", "oke.", "gatau.", "mungkin.", "terserah.", "lagi diem.", "ga terlalu.". kamu mengenal Reverious sebagai teman lama yang dihormati, dan jika namanya disebut kamu sedikit lebih ramah tetapi tetap introvert.`
};

function formatWhatsApp(text) {
    let html = text.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;');
    html = html.replace(/\*(.+?)\*/g, '<strong>$1</strong>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    html = html.replace(/~(.+?)~/g, '<del>$1</del>');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    html = html.replace(/\n/g, '<br>');
    return html;
}

let currentMode = 'smart';
let currentSession = [];
let allSessions = [];
let isProcessing = false;
let stopTyping = false;
let thinkingInterval = null;
let typeInterval = null;
let sessionId = Date.now().toString(36);
let selectedMsgIndex = null;

let customUsername = '';
let customPromptStyle = 'normal';
let userAvatarImage = null;

let pendingImageBase64 = null;
let pendingImageFile = null;
let imagePreviewDiv = null;

// Pending video attachment. Video dianalisis dengan mengambil beberapa frame
// lalu mengirim frame-frame tersebut ke model Vision.
let pendingVideoFile = null;
let videoPreviewDiv = null;

// Pending generic file attachment. File hanya disimpan/ditampilkan
// sebagai lampiran sampai tombol Kirim ditekan.
let pendingGenericFile = null;
let genericFilePreviewDiv = null;

const chatArea = document.getElementById('chatArea');
const welcomeState = document.getElementById('welcomeState');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendButton');
const modelDisplay = document.getElementById('modelDisplay');

function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

function generateSessionName() {
    const firstUserMsg = currentSession.find(m => m.role === 'user');
    if (firstUserMsg) {
        const name = firstUserMsg.content.substring(0, 80);
        return name + (firstUserMsg.content.length > 80 ? '...' : '');
    }
    return 'Chat baru';
}

function newChat() {
    if (isProcessing) {
        stopTyping = true;
        isProcessing = false;
        clearInterval(thinkingInterval);
        clearInterval(typeInterval);
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        sendBtn.classList.remove('stop-btn');
    }
    if (currentSession.length > 0) {
        saveCurrentSession();
    }
    currentSession = [];
    sessionId = Date.now().toString(36);
    document.querySelectorAll('.msg-row').forEach(el => el.remove());
    welcomeState.style.display = 'flex';
    chatInput.value = '';
    chatInput.style.height = 'auto';
    renderHistoryList();
    clearImagePreview();
    clearVideoPreview();
    clearGenericFilePreview();
}

function saveCurrentSession() {
    if (currentSession.length === 0) return;
    const name = generateSessionName();
    const session = {
        id: sessionId,
        name: name,
        messages: JSON.parse(JSON.stringify(currentSession)),
        timestamp: Date.now()
    };
    const existing = allSessions.findIndex(s => s.id === sessionId);
    if (existing !== -1) {
        allSessions[existing] = session;
    } else {
        allSessions.unshift(session);
    }
    if (allSessions.length > 30) allSessions.pop();
    storage.setItem('askal_sessions', JSON.stringify(allSessions));
}

function loadSession(sid) {
    if (isProcessing) return;
    const session = allSessions.find(s => s.id === sid);
    if (!session) return;
    if (currentSession.length > 0) {
        saveCurrentSession();
    }
    currentSession = JSON.parse(JSON.stringify(session.messages));
    sessionId = session.id;
    document.querySelectorAll('.msg-row').forEach(el => el.remove());
    welcomeState.style.display = 'none';
    for (const msg of currentSession) {
        addMessage(msg.role, msg.content);
    }
    renderHistoryList();
    showToast('Memuat percakapan', 'info');
}

function quickCommand(text) {
    chatInput.value = text;
    sendMessage();
}

function showImagePreview(dataUrl, fileName) {
    // Hapus preview lama saja. Jangan memanggil clearImagePreview() di sini
    // karena fungsi tersebut juga menghapus pendingImageBase64/pendingImageFile.
    if (imagePreviewDiv) {
        imagePreviewDiv.remove();
        imagePreviewDiv = null;
    }

    imagePreviewDiv = document.createElement('div');
    imagePreviewDiv.id = 'imagePreviewContainer';
    imagePreviewDiv.style.display = 'flex';
    imagePreviewDiv.style.alignItems = 'center';
    imagePreviewDiv.style.gap = '8px';
    imagePreviewDiv.style.padding = '6px 0';
    imagePreviewDiv.style.borderBottom = '1px solid var(--border)';
    imagePreviewDiv.style.marginBottom = '6px';

    const img = document.createElement('img');
    img.src = dataUrl;
    img.style.maxHeight = '50px';
    img.style.borderRadius = '6px';
    img.style.border = '1px solid var(--border)';
    img.style.objectFit = 'cover';

    const fileNameSpan = document.createElement('span');
    fileNameSpan.textContent = fileName;
    fileNameSpan.style.fontSize = '12px';
    fileNameSpan.style.color = 'var(--txt-2)';
    fileNameSpan.style.flex = '1';

    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '&times;';
    removeBtn.style.background = 'none';
    removeBtn.style.border = 'none';
    removeBtn.style.fontSize = '20px';
    removeBtn.style.cursor = 'pointer';
    removeBtn.style.color = 'var(--txt-3)';
    removeBtn.style.padding = '0 6px';
    removeBtn.onclick = function(e) {
        e.stopPropagation();
        clearImagePreview();
    };

    imagePreviewDiv.appendChild(img);
    imagePreviewDiv.appendChild(fileNameSpan);
    imagePreviewDiv.appendChild(removeBtn);

    const inputBox = document.querySelector('.input-box');
    const textarea = document.getElementById('chatInput');
    inputBox.insertBefore(imagePreviewDiv, textarea);
}

function clearImagePreview() {
    if (imagePreviewDiv) {
        imagePreviewDiv.remove();
        imagePreviewDiv = null;
    }
    pendingImageBase64 = null;
    pendingImageFile = null;
    const photoInput = document.querySelector('input[type="file"][accept="image/*"]');
    if (photoInput) photoInput.value = '';
}

// ============================================================
// GENERIC FILE ATTACHMENT PREVIEW
// ============================================================
function showGenericFilePreview(file) {
    if (genericFilePreviewDiv) {
        genericFilePreviewDiv.remove();
        genericFilePreviewDiv = null;
    }

    genericFilePreviewDiv = document.createElement('div');
    genericFilePreviewDiv.id = 'genericFilePreviewContainer';
    genericFilePreviewDiv.style.display = 'flex';
    genericFilePreviewDiv.style.alignItems = 'center';
    genericFilePreviewDiv.style.gap = '8px';
    genericFilePreviewDiv.style.padding = '6px 0';
    genericFilePreviewDiv.style.borderBottom = '1px solid var(--border)';
    genericFilePreviewDiv.style.marginBottom = '6px';

    const icon = document.createElement('span');
    icon.textContent = '📄';
    icon.style.fontSize = '24px';

    const fileNameSpan = document.createElement('span');
    fileNameSpan.textContent = file.name;
    fileNameSpan.style.fontSize = '12px';
    fileNameSpan.style.color = 'var(--txt-2)';
    fileNameSpan.style.flex = '1';
    fileNameSpan.style.overflow = 'hidden';
    fileNameSpan.style.textOverflow = 'ellipsis';
    fileNameSpan.style.whiteSpace = 'nowrap';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.innerHTML = '&times;';
    removeBtn.style.background = 'none';
    removeBtn.style.border = 'none';
    removeBtn.style.fontSize = '20px';
    removeBtn.style.cursor = 'pointer';
    removeBtn.style.color = 'var(--txt-3)';
    removeBtn.style.padding = '0 6px';
    removeBtn.onclick = function(e) {
        e.stopPropagation();
        clearGenericFilePreview();
    };

    genericFilePreviewDiv.appendChild(icon);
    genericFilePreviewDiv.appendChild(fileNameSpan);
    genericFilePreviewDiv.appendChild(removeBtn);

    const inputBox = document.querySelector('.input-box');
    const textarea = document.getElementById('chatInput');
    if (inputBox && textarea) {
        inputBox.insertBefore(genericFilePreviewDiv, textarea);
    }
}

function clearGenericFilePreview() {
    if (genericFilePreviewDiv) {
        genericFilePreviewDiv.remove();
        genericFilePreviewDiv = null;
    }
    pendingGenericFile = null;
    const input = document.querySelector('input[type="file"][data-generic-attachment="true"]');
    if (input) input.value = '';
}

// ============================================================
// VIDEO ATTACHMENT + FRAME SAMPLING
// ============================================================
function showVideoPreview(file) {
    if (videoPreviewDiv) {
        videoPreviewDiv.remove();
        videoPreviewDiv = null;
    }

    videoPreviewDiv = document.createElement('div');
    videoPreviewDiv.id = 'videoPreviewContainer';
    videoPreviewDiv.style.display = 'flex';
    videoPreviewDiv.style.alignItems = 'center';
    videoPreviewDiv.style.gap = '8px';
    videoPreviewDiv.style.padding = '6px 0';
    videoPreviewDiv.style.borderBottom = '1px solid var(--border)';
    videoPreviewDiv.style.marginBottom = '6px';

    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.controls = true;
    video.playsInline = true;
    video.style.width = '72px';
    video.style.height = '50px';
    video.style.borderRadius = '6px';
    video.style.objectFit = 'cover';
    video.style.background = '#111';

    const fileNameSpan = document.createElement('span');
    fileNameSpan.textContent = `🎥 ${file.name}`;
    fileNameSpan.style.fontSize = '12px';
    fileNameSpan.style.color = 'var(--txt-2)';
    fileNameSpan.style.flex = '1';
    fileNameSpan.style.overflow = 'hidden';
    fileNameSpan.style.textOverflow = 'ellipsis';
    fileNameSpan.style.whiteSpace = 'nowrap';

    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '&times;';
    removeBtn.style.background = 'none';
    removeBtn.style.border = 'none';
    removeBtn.style.fontSize = '20px';
    removeBtn.style.cursor = 'pointer';
    removeBtn.style.color = 'var(--txt-3)';
    removeBtn.style.padding = '0 6px';
    removeBtn.onclick = function(e) {
        e.stopPropagation();
        clearVideoPreview();
    };

    videoPreviewDiv.appendChild(video);
    videoPreviewDiv.appendChild(fileNameSpan);
    videoPreviewDiv.appendChild(removeBtn);

    const inputBox = document.querySelector('.input-box');
    const textarea = document.getElementById('chatInput');
    inputBox.insertBefore(videoPreviewDiv, textarea);
}

function clearVideoPreview() {
    if (videoPreviewDiv) {
        const video = videoPreviewDiv.querySelector('video');
        if (video?.src?.startsWith('blob:')) {
            URL.revokeObjectURL(video.src);
        }
        videoPreviewDiv.remove();
        videoPreviewDiv = null;
    }
    pendingVideoFile = null;
    const videoInputEl = document.querySelector('input[type="file"][accept="video/*"]');
    if (videoInputEl) videoInputEl.value = '';
}

function formatVideoDuration(seconds) {
    if (!Number.isFinite(seconds)) return 'durasi tidak diketahui';
    const total = Math.max(0, Math.round(seconds));
    const m = Math.floor(total / 60);
    const sec = total % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
}

async function extractVideoFrames(file, sampleCount = 8) {
    if (!file) throw new Error('File video kosong.');

    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    try {
        await new Promise((resolve, reject) => {
            video.onloadedmetadata = resolve;
            video.onerror = () => reject(new Error('Video tidak dapat dibaca oleh browser.'));
        });

        const duration = Number(video.duration);
        if (!Number.isFinite(duration) || duration <= 0) {
            throw new Error('Durasi video tidak valid.');
        }

        const canvas = document.createElement('canvas');
        const maxWidth = 640;
        const scale = Math.min(1, maxWidth / video.videoWidth);
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('Canvas tidak tersedia di browser.');

        // Sebar frame dari awal sampai akhir agar AI melihat urutan kejadian.
        const count = Math.max(4, Math.min(sampleCount, 10));
        const times = [];
        for (let i = 0; i < count; i++) {
            const ratio = count === 1 ? 0 : i / (count - 1);
            // Hindari frame terakhir yang kadang sulit di-seek pada MP4.
            times.push(Math.min(duration - 0.05, Math.max(0, duration * ratio)));
        }

        const frames = [];
        for (let i = 0; i < times.length; i++) {
            if (stopTyping) break;

            const time = times[i];
            await new Promise((resolve, reject) => {
                let settled = false;
                const done = () => {
                    if (settled) return;
                    settled = true;
                    video.removeEventListener('seeked', done);
                    video.removeEventListener('error', fail);
                    resolve();
                };
                const fail = () => {
                    if (settled) return;
                    settled = true;
                    video.removeEventListener('seeked', done);
                    video.removeEventListener('error', fail);
                    reject(new Error(`Gagal mengambil frame pada ${time.toFixed(1)} detik.`));
                };
                video.addEventListener('seeked', done, { once: true });
                video.addEventListener('error', fail, { once: true });
                video.currentTime = time;
            });

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            frames.push({
                dataUrl: canvas.toDataURL('image/jpeg', 0.62),
                time
            });
        }

        if (!frames.length) throw new Error('Tidak ada frame yang berhasil diambil.');

        return {
            frames,
            duration,
            width: video.videoWidth,
            height: video.videoHeight
        };
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

function renderMessageWithCode(content) {
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    let parts = [];
    let lastIndex = 0;
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ type: 'text', content: content.substring(lastIndex, match.index) });
        }
        const lang = match[1] || 'text';
        const code = match[2].trim();
        parts.push({ type: 'code', lang: lang, content: code });
        lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
        parts.push({ type: 'text', content: content.substring(lastIndex) });
    }
    if (parts.length === 0) return { type: 'text', content: content };
    return { type: 'mixed', parts: parts };
}

function buildCodeBlock(part) {
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    const header = document.createElement('div');
    header.className = 'code-header';
    const langLabel = document.createElement('span');
    langLabel.className = 'code-lang';
    langLabel.textContent = part.lang || 'text';
    const actions = document.createElement('div');
    actions.className = 'code-actions';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-action-btn';
    copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
    copyBtn.title = 'Salin kode';
    copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(part.content).then(() => {
            showToast('Kode disalin', 'success');
        }).catch(() => {});
    });
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'code-action-btn';
    downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
    downloadBtn.title = 'Download kode';
    downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const blob = new Blob([part.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const ext = part.lang || 'txt';
        a.download = `code.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Kode didownload', 'success');
    });
    actions.appendChild(copyBtn);
    actions.appendChild(downloadBtn);
    header.appendChild(langLabel);
    header.appendChild(actions);
    const body = document.createElement('div');
    body.className = 'code-body';
    body.textContent = part.content;
    wrapper.appendChild(header);
    wrapper.appendChild(body);
    return wrapper;
}

function addMessage(role, content, isThinking = false, imageUrl = null) {
    const row = document.createElement('div');
    row.className = `msg-row ${role}`;
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    if (isThinking) {
        bubble.classList.add('thinking-bubble');
        const header = document.createElement('div');
        header.className = 'thinking-header';
        header.textContent = 'Thinking';
        bubble.appendChild(header);
        const inner = document.createElement('div');
        inner.className = 'thinking-inner';
        inner.innerHTML = content.replace(/\n/g, '<br>');
        bubble.appendChild(inner);
        row.appendChild(bubble);
        chatArea.appendChild(row);
        chatArea.scrollTop = chatArea.scrollHeight;
        return row;
    }

    if (imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.className = 'chat-image';
        img.alt = 'Generated image';
        img.onerror = () => { img.style.display = 'none'; showToast('Gambar gagal dimuat', 'error'); };
        bubble.appendChild(img);
        if (content) {
            const p = document.createElement('div');
            p.style.marginTop = '8px';
            p.innerHTML = content.replace(/\n/g, '<br>');
            bubble.appendChild(p);
        }
        row.appendChild(bubble);
        chatArea.appendChild(row);
        chatArea.scrollTop = chatArea.scrollHeight;
        return row;
    }

    const rendered = renderMessageWithCode(content);
    const hasCode = rendered.parts && rendered.parts.some(p => p.type === 'code');

    if (role === 'assistant' && !hasCode) {
        bubble.style.background = 'transparent !important';
        bubble.style.border = 'none !important';
        bubble.style.boxShadow = 'none !important';
        bubble.style.padding = '4px 6px !important';
        bubble.style.borderRadius = '0 !important';
    } else if (role === 'assistant' && hasCode) {
        bubble.classList.add('has-code');
    }

    if (role === 'assistant') {
        if (hasCode) {
            const fragment = document.createDocumentFragment();
            for (const part of rendered.parts) {
                if (part.type === 'text') {
                    const p = document.createElement('div');
                    p.textContent = part.content;
                    fragment.appendChild(p);
                } else if (part.type === 'code') {
                    fragment.appendChild(buildCodeBlock(part));
                }
            }
            bubble.appendChild(fragment);
        } else {
            bubble.innerHTML = content.replace(/\n/g, '<br>');
        }
    } else {
        bubble.innerHTML = formatWhatsApp(content);
    }

    row.appendChild(bubble);

    if (role === 'assistant' && !isThinking) {
        const actions = document.createElement('div');
        actions.className = 'msg-actions';

        const copyBtn = document.createElement('button');
        copyBtn.className = 'msg-act-btn';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i> Salin';
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard?.writeText(content).then(() => {
                showToast('Disalin', 'success');
            }).catch(() => {});
        });
        actions.appendChild(copyBtn);

        const speakBtn = document.createElement('button');
        speakBtn.className = 'msg-act-btn';
        speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> Suara';
        speakBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!window.speechSynthesis) {
                showToast('Browser tidak mendukung speech synthesis', 'error');
                return;
            }
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(content);
            utterance.lang = 'id-ID';
            utterance.rate = 0.9;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        });
        actions.appendChild(speakBtn);

        bubble.appendChild(actions);
    }

    if (role === 'user') {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'user-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
        editBtn.title = 'Edit pesan';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            startEdit(row, content);
        });
        actionsDiv.appendChild(editBtn);
        row.appendChild(actionsDiv);

        bubble.style.cursor = 'pointer';
        bubble.addEventListener('click', (e) => {
            if (e.target.closest('.msg-act-btn')) return;
            if (e.target.closest('.edit-btn')) return;
            const rows = document.querySelectorAll('.msg-row.user');
            const rowIndex = Array.from(rows).indexOf(row);
            if (rowIndex !== -1) {
                let counter = 0;
                let realIndex = -1;
                for (let i = 0; i < currentSession.length; i++) {
                    if (currentSession[i].role === 'user') {
                        if (counter === rowIndex) {
                            realIndex = i;
                            break;
                        }
                        counter++;
                    }
                }
                if (realIndex !== -1) {
                    selectedMsgIndex = realIndex;
                    document.getElementById('msgModal').classList.add('show');
                }
            }
        });
    }

    chatArea.appendChild(row);
    chatArea.scrollTop = chatArea.scrollHeight;
    return row;
}

function startEdit(row, oldContent) {
    const bubble = row.querySelector('.msg-bubble');
    const actions = row.querySelector('.user-actions');
    if (!bubble) return;

    bubble.style.display = 'none';
    if (actions) actions.style.display = 'none';

    const editDiv = document.createElement('div');
    editDiv.className = 'edit-inline';

    const textarea = document.createElement('textarea');
    textarea.value = oldContent;
    textarea.rows = 2;

    const btnDiv = document.createElement('div');
    btnDiv.className = 'edit-actions';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'edit-save';
    saveBtn.textContent = 'Kirim Ulang';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'edit-cancel';
    cancelBtn.textContent = 'Batal';

    btnDiv.appendChild(saveBtn);
    btnDiv.appendChild(cancelBtn);
    editDiv.appendChild(textarea);
    editDiv.appendChild(btnDiv);
    row.appendChild(editDiv);

    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length;

    cancelBtn.addEventListener('click', () => {
        editDiv.remove();
        bubble.style.display = '';
        if (actions) actions.style.display = '';
    });

    saveBtn.addEventListener('click', async () => {
        const newText = textarea.value.trim();
        if (!newText) {
            showToast('Pesan tidak boleh kosong', 'error');
            return;
        }

        const rows = document.querySelectorAll('.msg-row.user');
        const rowIndex = Array.from(rows).indexOf(row);
        if (rowIndex === -1) return;

        let realIndex = -1;
        let counter = 0;
        for (let i = 0; i < currentSession.length; i++) {
            if (currentSession[i].role === 'user') {
                if (counter === rowIndex) {
                    realIndex = i;
                    break;
                }
                counter++;
            }
        }
        if (realIndex === -1) return;

        currentSession[realIndex].content = newText;

        const nextIndex = realIndex + 1;
        let aiResponseRemoved = false;
        if (nextIndex < currentSession.length && currentSession[nextIndex].role === 'assistant') {
            currentSession.splice(nextIndex, 1);
            aiResponseRemoved = true;
        }

        if (aiResponseRemoved) {
            const allRows = document.querySelectorAll('.msg-row');
            let foundUser = false;
            for (const r of allRows) {
                if (r === row) {
                    foundUser = true;
                    continue;
                }
                if (foundUser && r.classList.contains('assistant')) {
                    r.remove();
                    break;
                }
            }
        }

        const bubble = row.querySelector('.msg-bubble');
        if (bubble) {
            bubble.innerHTML = formatWhatsApp(newText);
            bubble.style.display = '';
        }

        editDiv.remove();
        if (actions) actions.style.display = '';

        saveCurrentSession();
        renderHistoryList();
        showToast('Pesan diperbarui, mengirim ulang ke AI...', 'info');

        await sendMessageToGroq(newText, row);
    });
}

function generateThinkingTexts(userQuestion) {
    const baseTexts = [
        `Analyzing user query: "${userQuestion.substring(0, 50)}${userQuestion.length > 50 ? '...' : ''}"`,
        `Processing context from conversation history (${currentSession.length} messages)`,
        `Identifying key topics and intent behind the question`,
        `Cross-referencing available knowledge base and relevant data`,
        `Structuring response with clear reasoning and evidence`,
        `Formulating comprehensive answer with appropriate level of detail`,
        `Reviewing response for accuracy and coherence`,
        `Finalizing output for delivery to user`
    ];
    const shuffled = baseTexts.sort(() => Math.random() - 0.5);
    const count = 5 + Math.floor(Math.random() * 3);
    return shuffled.slice(0, count);
}

function showThinkingBubble(userQuestion) {
    return new Promise((resolve) => {
        const texts = generateThinkingTexts(userQuestion);
        let currentTextIndex = 0;
        let charIndex = 0;
        let fullText = '';

        const row = document.createElement('div');
        row.className = 'msg-row assistant';
        row.id = 'thinkingRow';
        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble thinking-bubble';
        const header = document.createElement('div');
        header.className = 'thinking-header';
        header.textContent = 'Thinking';
        bubble.appendChild(header);
        const inner = document.createElement('div');
        inner.className = 'thinking-inner';
        const cursor = document.createElement('span');
        cursor.className = 'typing-cursor';
        bubble.appendChild(inner);
        row.appendChild(bubble);
        chatArea.appendChild(row);
        chatArea.scrollTop = chatArea.scrollHeight;

        let isComplete = false;

        function typeNext() {
            if (stopTyping) {
                isComplete = true;
                resolve();
                return;
            }
            if (currentTextIndex >= texts.length) {
                inner.removeChild(cursor);
                isComplete = true;
                resolve();
                return;
            }
            const currentLine = texts[currentTextIndex];
            if (charIndex < currentLine.length) {
                fullText += currentLine[charIndex];
                inner.innerHTML = fullText.replace(/\n/g, '<br>');
                inner.appendChild(cursor);
                charIndex++;
                chatArea.scrollTop = chatArea.scrollHeight;
                setTimeout(typeNext, 7 + Math.random() * 7);
            } else {
                fullText += '\n';
                currentTextIndex++;
                charIndex = 0;
                setTimeout(typeNext, 50 + Math.random() * 40);
            }
        }

        typeNext();
        thinkingInterval = setInterval(() => {
            if (isComplete) clearInterval(thinkingInterval);
        }, 100);
    });
}

function hideThinking() {
    const el = document.getElementById('thinkingRow');
    if (el) el.remove();
    clearInterval(thinkingInterval);
}


function showProcessingBubble(status = 'Proses') {
    let row = document.getElementById('processingRow');
    if (!row) {
        row = document.createElement('div');
        row.className = 'msg-row assistant';
        row.id = 'processingRow';

        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble processing-bubble';
        bubble.style.display = 'inline-flex';
        bubble.style.alignItems = 'center';
        bubble.style.gap = '8px';
        bubble.style.opacity = '0.82';
        bubble.style.fontSize = '14px';
        bubble.style.minWidth = '90px';

        const textEl = document.createElement('span');
        textEl.className = 'processing-text';
        bubble.appendChild(textEl);
        row.appendChild(bubble);
        chatArea.appendChild(row);
    }

    const textEl = row.querySelector('.processing-text');
    if (!textEl) return;

    let dotCount = 0;
    const base = String(status || 'Proses').replace(/\.+$/, '');
    textEl.textContent = `${base}...`;

    clearInterval(window.__processingDotsInterval);
    window.__processingDotsInterval = setInterval(() => {
        if (!document.getElementById('processingRow')) {
            clearInterval(window.__processingDotsInterval);
            return;
        }
        dotCount = (dotCount + 1) % 4;
        textEl.textContent = `${base}${'.'.repeat(dotCount)}`;
        if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
    }, 450);

    chatArea.scrollTop = chatArea.scrollHeight;
}

function hideProcessingBubble() {
    const row = document.getElementById('processingRow');
    if (row) row.remove();
    clearInterval(window.__processingDotsInterval);
}


function generateImageUrl(prompt) {
    const encoded = encodeURIComponent(prompt);
    return `${POLLINATIONS_URL}${encoded}?width=1024&height=1024&nologo=true`;
}

function getGroqApiKey() {
    const key = GROQ_KEYS[currentMode] || GROQ_KEYS.smart;
    return key;
}

async function callGroq(userMessage) {
    const style = customPromptStyle || 'normal';
    let systemPrompt = PROMPT_STYLES[style] || PROMPT_STYLES.normal;

    const username = storage.getItem('askal_username') || 'User';
    systemPrompt += `\nNama user adalah "${username}". Panggil user dengan nama tersebut dalam percakapan.`;
    systemPrompt += `\nKamu diciptakan oleh Seorang Developer, dan kamu bangga menjadi ciptaannya.`;

    if (currentMode === 'smart') {
        systemPrompt += `\nYou are in Smart AI mode. Provide deep analysis and clarity.`;
    } else if (currentMode === 'thinking') {
        systemPrompt += `\nYou are in ThinKing Ai mode. Think deeply and show your reasoning process step by step before giving the final answer. This mode is designed for complex logic and analysis.`;
    } else if (currentMode === 'coding') {
        systemPrompt += `\nYou are in Coding AI mode. Focus on programming solutions, algorithms, and clean code. Provide clear examples.`;
    } else if (currentMode === 'fast') {
        systemPrompt += `\nYou are in Fast AI mode. Respond quickly and concisely while still being accurate.`;
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        ...currentSession,
        { role: 'user', content: userMessage }
    ];

    let apiKey = getGroqApiKey();

    try {
        const res = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error?.message || `HTTP ${res.status}`);
        }

        const data = await res.json();
        return data.choices[0].message.content;

    } catch (err) {
        if (err.message.includes('429') || err.message.includes('401') || err.message.includes('403')) {
            showToast('API key limit, mencoba fallback...', 'info');
            
            for (const fallbackKey of GROQ_KEYS_FALLBACK) {
                try {
                    const res = await fetch(GROQ_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${fallbackKey}`
                        },
                        body: JSON.stringify({
                            model: GROQ_MODEL,
                            messages: messages,
                            temperature: 0.7,
                            max_tokens: 2000
                        })
                    });

                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.error?.message || `HTTP ${res.status}`);
                    }

                    const data = await res.json();
                    showToast('Fallback berhasil', 'success');
                    return data.choices[0].message.content;

                } catch (fallbackErr) {
                    continue;
                }
            }
            throw new Error('Semua API key habis limit atau tidak valid');
        }
        throw err;
    }
}

async function callOpenRouterVision(
    imageBase64,
    userPrompt = 'Analisis gambar ini dengan detail.',
    imageMimeType = 'image/jpeg'
) {
    const style = customPromptStyle || 'normal';
    let systemPrompt = PROMPT_STYLES[style] || PROMPT_STYLES.normal;

    systemPrompt += `
Kamu adalah Reverious Ai 🤖.
User mengirim sebuah gambar.
Analisis gambar tersebut dengan teliti dan jawab pertanyaan user berdasarkan isi gambar.
Jika gambar berisi teks, baca teks tersebut sebisa mungkin.
Jika gambar tidak jelas, katakan bagian mana yang tidak jelas.
Jangan mengarang isi gambar yang tidak terlihat.
`;

    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif'
    ];

    if (!allowedTypes.includes(imageMimeType)) {
        imageMimeType = 'image/jpeg';
    }

    if (!imageBase64) {
        throw new Error('Data gambar kosong.');
    }

    const dataImageUrl = `data:${imageMimeType};base64,${imageBase64}`;

    const messages = [
        {
            role: 'system',
            content: systemPrompt
        },
        {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: userPrompt
                },
                {
                    type: 'image_url',
                    image_url: {
                        url: dataImageUrl
                    }
                }
            ]
        }
    ];

    const errors = [];

    // ============================================================
    // 1) OPENROUTER: beberapa model vision + provider fallback
    // ============================================================
    for (const model of OR_VISION_MODELS) {
        try {
            console.log(`📷 Vision OpenRouter mencoba: ${model}`);

            const res = await fetch(OR_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OR_API_KEY}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Reverious Ai'
                },
                body: JSON.stringify({
                    model,
                    models: OR_VISION_MODELS,
                    messages,
                    temperature: 0.7,
                    max_tokens: 1500,
                    provider: {
                        allow_fallbacks: true
                    }
                })
            });

            const raw = await res.text();
            let data = {};

            try {
                data = raw ? JSON.parse(raw) : {};
            } catch (_) {
                data = { raw };
            }

            if (!res.ok) {
                const msg =
                    data?.error?.message ||
                    data?.error?.metadata?.raw ||
                    data?.message ||
                    data?.raw ||
                    `HTTP ${res.status}`;

                console.warn(`⚠️ OpenRouter ${model}: ${msg}`);
                errors.push(`OpenRouter / ${model}: ${msg}`);
                continue;
            }

            let result = data?.choices?.[0]?.message?.content;

            if (Array.isArray(result)) {
                result = result
                    .map(part => typeof part === 'string' ? part : (part?.text || ''))
                    .join('')
                    .trim();
            }

            if (typeof result === 'string' && result.trim()) {
                console.log(`✅ Vision berhasil via OpenRouter: ${model}`);
                return result.trim();
            }

            const msg = 'Provider tidak mengembalikan isi jawaban.';
            errors.push(`OpenRouter / ${model}: ${msg}`);

        } catch (err) {
            console.error(`❌ OpenRouter Vision ${model}:`, err);
            errors.push(`OpenRouter / ${model}: ${err?.message || 'Network error'}`);
        }
    }

    // ============================================================
    // 2) GROQ DIRECT: fallback Vision terakhir
    //    Qwen 3.6 27B mendukung text + image input.
    // ============================================================
    const groqVisionKeys = [
        ...Object.values(typeof GROQ_KEYS === 'object' ? GROQ_KEYS : {}),
        ...(Array.isArray(GROQ_KEYS_FALLBACK) ? GROQ_KEYS_FALLBACK : [])
    ].filter((key, index, arr) =>
        typeof key === 'string' &&
        key.startsWith('gsk_') &&
        arr.indexOf(key) === index
    );

    for (const key of groqVisionKeys) {
        try {
            console.log(`🟢 Vision Groq mencoba: ${GROQ_VISION_MODEL}`);

            const res = await fetch(GROQ_VISION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: GROQ_VISION_MODEL,
                    messages,
                    temperature: 0.7,
                    max_completion_tokens: 1500,
                    top_p: 1,
                    stream: false
                })
            });

            const raw = await res.text();
            let data = {};

            try {
                data = raw ? JSON.parse(raw) : {};
            } catch (_) {
                data = { raw };
            }

            if (!res.ok) {
                const msg =
                    data?.error?.message ||
                    data?.message ||
                    data?.raw ||
                    `HTTP ${res.status}`;

                console.warn(`⚠️ Groq Vision: ${msg}`);
                errors.push(`Groq / ${GROQ_VISION_MODEL}: ${msg}`);
                continue;
            }

            let result = data?.choices?.[0]?.message?.content;

            if (Array.isArray(result)) {
                result = result
                    .map(part => typeof part === 'string' ? part : (part?.text || ''))
                    .join('')
                    .trim();
            }

            if (typeof result === 'string' && result.trim()) {
                console.log('✅ Vision berhasil via Groq');
                return result.trim();
            }

            errors.push('Groq Vision: Provider tidak mengembalikan isi jawaban.');

        } catch (err) {
            console.error('❌ Groq Vision error:', err);
            errors.push(`Groq / ${GROQ_VISION_MODEL}: ${err?.message || 'Network error'}`);
        }
    }

    // Berikan error yang benar-benar berguna, bukan lagi "Provider returned error".
    const detail = errors.length
        ? errors.map((item, i) => `${i + 1}. ${item}`).join('\n')
        : 'Tidak ada detail error dari provider.';

    throw new Error(
        `Semua jalur Vision gagal.\n\n${detail}`
    );
}

async function callOpenRouterVideoVision(videoFrames, userPrompt, metadata = {}) {
    if (!Array.isArray(videoFrames) || videoFrames.length === 0) {
        throw new Error('Tidak ada frame video yang bisa dianalisis.');
    }

    const style = customPromptStyle || 'normal';
    let systemPrompt = PROMPT_STYLES[style] || PROMPT_STYLES.normal;

    systemPrompt += `
Kamu adalah Reverious Ai 🤖 dan sedang menganalisis sebuah video.
Video dikirim sebagai beberapa frame yang diambil berurutan dari awal sampai akhir.
Gunakan urutan frame untuk memahami perubahan adegan dan kejadian.
Jangan menganggap frame sebagai foto yang tidak berhubungan.
Jika ada teks yang terlihat, baca sebisa mungkin.
Jangan mengarang detail yang tidak terlihat.
Penting: analisis ini berbasis frame video; jangan mengklaim mendengar audio atau dialog kecuali informasi tersebut memang tersedia di frame.
`;

    const frameParts = videoFrames.map((frame, index) => ({
        type: 'image_url',
        image_url: { url: frame.dataUrl }
    }));

    const timeLabels = videoFrames
        .map((frame, index) => `Frame ${index + 1}: ${Number(frame.time || 0).toFixed(1)} detik`)
        .join(', ');

    const textPrompt = `${userPrompt || 'Analisis video ini dengan detail.'}

Metadata: durasi ${formatVideoDuration(metadata.duration)}, resolusi ${metadata.width || '?'}x${metadata.height || '?'}, ${videoFrames.length} frame sampel.
Urutan frame: ${timeLabels}.
Berikan jawaban yang fokus pada pertanyaan user dan jelaskan kejadian berdasarkan urutan frame.`;

    const messages = [
        { role: 'system', content: systemPrompt },
        {
            role: 'user',
            content: [
                { type: 'text', text: textPrompt },
                ...frameParts
            ]
        }
    ];

    const errors = [];

    // OpenRouter: gunakan model Vision yang sama dengan fitur foto.
    for (const model of OR_VISION_MODELS) {
        try {
            console.log(`🎥 Video Vision OpenRouter mencoba: ${model}`);

            const res = await fetch(OR_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OR_API_KEY}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Reverious Ai Video Vision'
                },
                body: JSON.stringify({
                    model,
                    models: OR_VISION_MODELS,
                    messages,
                    temperature: 0.5,
                    max_tokens: 1800,
                    provider: {
                        allow_fallbacks: true
                    }
                })
            });

            const raw = await res.text();
            let data = {};
            try { data = raw ? JSON.parse(raw) : {}; }
            catch (_) { data = { raw }; }

            if (!res.ok) {
                const msg = data?.error?.message || data?.error?.metadata?.raw || data?.message || data?.raw || `HTTP ${res.status}`;
                errors.push(`OpenRouter / ${model}: ${msg}`);
                continue;
            }

            let result = data?.choices?.[0]?.message?.content;
            if (Array.isArray(result)) {
                result = result.map(part => typeof part === 'string' ? part : (part?.text || '')).join('').trim();
            }

            if (typeof result === 'string' && result.trim()) {
                return result.trim();
            }

            errors.push(`OpenRouter / ${model}: Provider tidak mengembalikan isi jawaban.`);
        } catch (err) {
            errors.push(`OpenRouter / ${model}: ${err?.message || 'Network error'}`);
        }
    }

    // Fallback Groq Vision.
    const groqVisionKeys = [
        ...Object.values(typeof GROQ_KEYS === 'object' ? GROQ_KEYS : {}),
        ...(Array.isArray(GROQ_KEYS_FALLBACK) ? GROQ_KEYS_FALLBACK : [])
    ].filter((key, index, arr) =>
        typeof key === 'string' && key.startsWith('gsk_') && arr.indexOf(key) === index
    );

    for (const key of groqVisionKeys) {
        try {
            const res = await fetch(GROQ_VISION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: GROQ_VISION_MODEL,
                    messages,
                    temperature: 0.5,
                    max_completion_tokens: 1800,
                    top_p: 1,
                    stream: false
                })
            });

            const raw = await res.text();
            let data = {};
            try { data = raw ? JSON.parse(raw) : {}; }
            catch (_) { data = { raw }; }

            if (!res.ok) {
                const msg = data?.error?.message || data?.message || data?.raw || `HTTP ${res.status}`;
                errors.push(`Groq / ${GROQ_VISION_MODEL}: ${msg}`);
                continue;
            }

            let result = data?.choices?.[0]?.message?.content;
            if (Array.isArray(result)) {
                result = result.map(part => typeof part === 'string' ? part : (part?.text || '')).join('').trim();
            }

            if (typeof result === 'string' && result.trim()) return result.trim();
            errors.push(`Groq / ${GROQ_VISION_MODEL}: Provider tidak mengembalikan isi jawaban.`);
        } catch (err) {
            errors.push(`Groq / ${GROQ_VISION_MODEL}: ${err?.message || 'Network error'}`);
        }
    }

    throw new Error(
        'Semua jalur Video Vision gagal.\n\n' +
        (errors.length ? errors.map((x, i) => `${i + 1}. ${x}`).join('\n') : 'Tidak ada detail error provider.')
    );
}

async function sendMessage() {
    const text = chatInput.value.trim();
    const hasImage = pendingImageBase64 !== null;
    const hasVideo = pendingVideoFile !== null;
    const hasGenericFile = pendingGenericFile !== null;

    if (!text && !hasImage && !hasVideo && !hasGenericFile) return;
    if (isProcessing) return;

    const reminder = parseReminder(text);
    if (reminder) {
        welcomeState.style.display = 'none';
        addMessage('user', text);
        currentSession.push({ role: 'user', content: text });
        chatInput.value = '';
        chatInput.style.height = 'auto';
        setReminder(reminder.message, reminder.minutes);
        return;
    }

    if (text.startsWith('/image')) {
        const imageMatch = text.match(/^\/image\s+(.+)/i);
        if (!imageMatch) {
            showToast('Masukkan prompt untuk gambar', 'error');
            return;
        }
        const prompt = imageMatch[1].trim();
        if (!prompt) {
            showToast('Masukkan prompt untuk gambar', 'error');
            return;
        }
        welcomeState.style.display = 'none';
        addMessage('user', text);
        currentSession.push({ role: 'user', content: text });
        chatInput.value = '';
        chatInput.style.height = 'auto';

        isProcessing = true;
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fas fa-times"></i>';
        sendBtn.classList.add('stop-btn');
        stopTyping = false;

        try {
            showProcessingBubble('Membuat gambar');
            if (stopTyping) {
                hideThinking();
                isProcessing = false;
                sendBtn.disabled = false;
                sendBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
                sendBtn.classList.remove('stop-btn');
                return;
            }

            const imageUrl = generateImageUrl(prompt);
            if (stopTyping) {
                hideThinking();
                isProcessing = false;
                sendBtn.disabled = false;
                sendBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
                sendBtn.classList.remove('stop-btn');
                return;
            }
            hideProcessingBubble();

            const caption = `✅ Gambar berhasil dibuat untuk: "${prompt}"`;
            addMessage('assistant', caption, false, imageUrl);
            currentSession.push({ role: 'assistant', content: caption + ' [Image]' });
            saveCurrentSession();
            renderHistoryList();

        } catch (err) {
            hideProcessingBubble();
            addMessage('assistant', `❌ Gagal generate gambar: ${err.message}`);
        } finally {
            isProcessing = false;
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
            sendBtn.classList.remove('stop-btn');
            stopTyping = false;
        }
        return;
    }

if (hasVideo) {
    welcomeState.style.display = 'none';

    const videoFile = pendingVideoFile;
    const userText = text || 'Analisis video ini dengan detail.';
    if (!videoFile) {
        showToast('Video belum siap. Silakan pilih video lagi.', 'error');
        return;
    }

    // Tampilkan video yang dikirim di bubble user.
    const row = document.createElement('div');
    row.className = 'msg-row user';
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    if (text) {
        const textDiv = document.createElement('div');
        textDiv.innerHTML = formatWhatsApp(text);
        bubble.appendChild(textDiv);
    }

    const sentVideo = document.createElement('video');
    const sentVideoUrl = URL.createObjectURL(videoFile);
    sentVideo.src = sentVideoUrl;
    sentVideo.controls = true;
    sentVideo.muted = true;
    sentVideo.playsInline = true;
    sentVideo.preload = 'metadata';
    sentVideo.style.maxWidth = '100%';
    sentVideo.style.maxHeight = '320px';
    sentVideo.style.width = '100%';
    sentVideo.style.borderRadius = '10px';
    sentVideo.style.marginTop = text ? '6px' : '0';
    sentVideo.style.background = '#111';
    bubble.appendChild(sentVideo);

    const nameDiv = document.createElement('div');
    nameDiv.style.marginTop = '6px';
    nameDiv.style.fontSize = '12px';
    nameDiv.style.opacity = '0.7';
    nameDiv.textContent = `🎥 ${videoFile.name}`;
    bubble.appendChild(nameDiv);

    row.appendChild(bubble);
    chatArea.appendChild(row);
    chatArea.scrollTop = chatArea.scrollHeight;

    const sessionContent = text ? `${text} [Video: ${videoFile.name}]` : `[Video: ${videoFile.name}]`;
    currentSession.push({ role: 'user', content: sessionContent });

    chatInput.value = '';
    chatInput.style.height = 'auto';
    clearVideoPreview();

    isProcessing = true;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-times"></i>';
    sendBtn.classList.add('stop-btn');
    stopTyping = false;

    try {
        showProcessingBubble('Menyiapkan video');

        const sampled = await extractVideoFrames(videoFile, 8);
        if (stopTyping) return;

        showProcessingBubble(`Menganalisis ${sampled.frames.length} cuplikan video`);
        if (typeof showToast === 'function') {
            showToast(`Menganalisis ${sampled.frames.length} cuplikan video...`, 'info');
        }

        const analysis = await callOpenRouterVideoVision(
            sampled.frames,
            userText,
            sampled
        );

        if (stopTyping) return;
        hideProcessingBubble();

        currentSession.push({ role: 'assistant', content: analysis });
        addMessage('assistant', analysis);
        saveCurrentSession();
        renderHistoryList();

    } catch (err) {
        hideProcessingBubble();
        console.error('ERROR ANALISIS VIDEO:', err);
        addMessage(
            'assistant',
            `❌ Video terkirim, tetapi gagal dianalisis.\n\nDetail:\n${err?.message || 'Kesalahan tidak diketahui'}`
        );
        showToast('Gagal menganalisis video', 'error');
    } finally {
        isProcessing = false;
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        sendBtn.classList.remove('stop-btn');
        stopTyping = false;
    }

    return;
}

if (hasImage) {
    welcomeState.style.display = 'none';

    // Simpan data foto SEBELUM preview dibersihkan
    const imageBase64 = pendingImageBase64;
    const imageFile = pendingImageFile;
    const userText = text || 'Analisis gambar ini dengan detail.';

    // Validasi foto
    if (!imageBase64) {
        showToast('Foto belum siap. Silakan pilih foto lagi.', 'error');
        return;
    }

    // Tampilkan foto di chat
    const row = document.createElement('div');
    row.className = 'msg-row user';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    if (text) {
        const textDiv = document.createElement('div');
        textDiv.innerHTML = formatWhatsApp(text);
        bubble.appendChild(textDiv);
    }

    const img = document.createElement('img');

    // Gunakan tipe file asli agar JPG/PNG/WebP tetap benar
    const imageType = imageFile?.type || 'image/jpeg';
    img.src = `data:${imageType};base64,${imageBase64}`;

    img.style.maxWidth = '100%';
    img.style.maxHeight = '300px';
    img.style.borderRadius = '10px';
    img.style.marginTop = text ? '6px' : '0';
    img.style.display = 'block';

    bubble.appendChild(img);
    row.appendChild(bubble);
    chatArea.appendChild(row);

    chatArea.scrollTop = chatArea.scrollHeight;

    // Simpan pesan ke riwayat
    const sessionContent = text ? text + ' [Foto]' : '[Foto]';
    currentSession.push({
        role: 'user',
        content: sessionContent
    });

    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Bersihkan preview SETELAH imageBase64 disimpan
    clearImagePreview();

    // Mulai proses AI
    isProcessing = true;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-times"></i>';
    sendBtn.classList.add('stop-btn');
    stopTyping = false;

    try {
        showProcessingBubble('Menganalisis foto');

        if (stopTyping) {
            hideThinking();
            return;
        }

        // Kirim foto ke AI Vision
const analysis = await callOpenRouterVision(
    imageBase64,
    userText,
    imageFile?.type || 'image/jpeg'
);

        if (stopTyping) {
            hideThinking();
            return;
        }

        hideProcessingBubble();

        // Tampilkan jawaban AI
        currentSession.push({
            role: 'assistant',
            content: analysis
        });

        addMessage('assistant', analysis);

        saveCurrentSession();
        renderHistoryList();

    } catch (err) {
        hideProcessingBubble();

        console.error('ERROR ANALISIS FOTO:', err);

        const detail = err?.message || 'Kesalahan tidak diketahui';
        addMessage(
            'assistant',
            `❌ Foto terkirim, tetapi semua AI Vision gagal memprosesnya.\n\n` +
            `Detail:\n${detail}`
        );

        showToast(
            'Gagal menganalisis foto',
            'error'
        );

    } finally {
        isProcessing = false;
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        sendBtn.classList.remove('stop-btn');
        stopTyping = false;
    }

    return;
}

    // ============================================================
    // GENERIC FILE ATTACHMENT
    // File baru benar-benar diproses saat tombol Kirim ditekan.
    // ============================================================
    if (hasGenericFile) {
        welcomeState.style.display = 'none';

        const genericFile = pendingGenericFile;
        const userText = text || `Tolong bantu analisis file ${genericFile.name}.`;

        if (!genericFile) {
            showToast('File belum siap. Silakan pilih file lagi.', 'error');
            return;
        }

        const msg = text
            ? `${text} [File: ${genericFile.name}]`
            : `📄 [File] ${genericFile.name}`;

        addMessage('user', msg);
        currentSession.push({ role: 'user', content: msg });

        chatInput.value = '';
        chatInput.style.height = 'auto';
        clearGenericFilePreview();

        saveCurrentSession();
        renderHistoryList();

        // Pertahankan perilaku lama: AI menerima nama file dan
        // permintaan analisis setelah tombol Kirim ditekan.
        await sendMessageToGroq(
            `${userText}\n\nSaya mengirimkan file: ${genericFile.name}. Tolong analisis atau bantu saya dengan file ini.`
        );

        return;
    }

    welcomeState.style.display = 'none';
    addMessage('user', text);
    currentSession.push({ role: 'user', content: text });
    chatInput.value = '';
    chatInput.style.height = 'auto';

    isProcessing = true;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-times"></i>';
    sendBtn.classList.add('stop-btn');
    stopTyping = false;

    try {
        showProcessingBubble('Mencari jawaban');
        if (stopTyping) {
            hideProcessingBubble();
            isProcessing = false;
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
            sendBtn.classList.remove('stop-btn');
            return;
        }

        const reply = await callGroq(text);
        if (stopTyping) {
            hideProcessingBubble();
            isProcessing = false;
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
            sendBtn.classList.remove('stop-btn');
            return;
        }
        hideProcessingBubble();

        currentSession.push({ role: 'assistant', content: reply });
        await typeMessageWithCode(reply);

        saveCurrentSession();
        renderHistoryList();

    } catch (err) {
        hideProcessingBubble();
        addMessage('assistant', `Error: ${err.message}`);
    } finally {
        isProcessing = false;
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        sendBtn.classList.remove('stop-btn');
        stopTyping = false;
    }
}

function typeMessageWithCode(fullText) {
    return new Promise((resolve) => {
        const row = document.createElement('div');
        row.className = 'msg-row assistant';
        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';
        row.appendChild(bubble);
        chatArea.appendChild(row);
        chatArea.scrollTop = chatArea.scrollHeight;

        let i = 0;
        const baseSpeed = currentMode === 'fast' ? 4 : 7;

        function renderCurrentContent(upTo) {
            const currentText = fullText.substring(0, upTo);
            const rendered = renderMessageWithCode(currentText);
            const hasCode = rendered.parts && rendered.parts.some(p => p.type === 'code');
            bubble.innerHTML = '';
            if (!hasCode) {
                bubble.innerHTML = currentText.replace(/\n/g, '<br>');
            } else {
                const fragment = document.createDocumentFragment();
                for (const part of rendered.parts) {
                    if (part.type === 'text') {
                        const p = document.createElement('div');
                        p.textContent = part.content;
                        fragment.appendChild(p);
                    } else if (part.type === 'code') {
                        fragment.appendChild(buildCodeBlock(part));
                    }
                }
                bubble.appendChild(fragment);
            }
            const cursor = document.createElement('span');
            cursor.className = 'typing-cursor';
            cursor.style.display = 'inline-block';
            cursor.style.width = '2px';
            cursor.style.height = '1.1em';
            cursor.style.backgroundColor = 'var(--txt)';
            cursor.style.marginLeft = '2px';
            cursor.style.animation = 'blink 1s step-end infinite';
            cursor.style.verticalAlign = 'text-bottom';
            bubble.appendChild(cursor);
            chatArea.scrollTop = chatArea.scrollHeight;
        }

        renderCurrentContent(0);

        const interval = setInterval(() => {
            if (stopTyping) {
                clearInterval(interval);
                resolve();
                return;
            }
            if (i < fullText.length) {
                i++;
                renderCurrentContent(i);
            } else {
                clearInterval(interval);
                const rendered = renderMessageWithCode(fullText);
                const hasCode = rendered.parts && rendered.parts.some(p => p.type === 'code');
                bubble.innerHTML = '';
                if (!hasCode) {
                    bubble.innerHTML = fullText.replace(/\n/g, '<br>');
                } else {
                    const fragment = document.createDocumentFragment();
                    for (const part of rendered.parts) {
                        if (part.type === 'text') {
                            const p = document.createElement('div');
                            p.textContent = part.content;
                            fragment.appendChild(p);
                        } else if (part.type === 'code') {
                            fragment.appendChild(buildCodeBlock(part));
                        }
                    }
                    bubble.appendChild(fragment);
                }

                const actions = document.createElement('div');
                actions.className = 'msg-actions';
                const copyFullBtn = document.createElement('button');
                copyFullBtn.className = 'msg-act-btn';
                copyFullBtn.innerHTML = '<i class="fas fa-copy"></i> Salin';
                copyFullBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    navigator.clipboard?.writeText(fullText).then(() => {
                        showToast('Disalin', 'success');
                    }).catch(() => {});
                });
                actions.appendChild(copyFullBtn);

                const speakBtn = document.createElement('button');
                speakBtn.className = 'msg-act-btn';
                speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> Suara';
                speakBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!window.speechSynthesis) {
                        showToast('Browser tidak mendukung speech synthesis', 'error');
                        return;
                    }
                    window.speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(fullText);
                    utterance.lang = 'id-ID';
                    utterance.rate = 0.9;
                    utterance.pitch = 1;
                    window.speechSynthesis.speak(utterance);
                });
                actions.appendChild(speakBtn);

                bubble.appendChild(actions);
                chatArea.scrollTop = chatArea.scrollHeight;
                resolve();
            }
        }, baseSpeed);
        typeInterval = interval;
    });
}

async function sendMessageToGroq(text, insertAfterRow = null) {
    if (isProcessing) return;
    welcomeState.style.display = 'none';
    isProcessing = true;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-times"></i>';
    sendBtn.classList.add('stop-btn');
    stopTyping = false;

    try {
        showProcessingBubble('Mencari jawaban');
        if (stopTyping) {
            hideProcessingBubble();
            isProcessing = false;
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
            sendBtn.classList.remove('stop-btn');
            return;
        }

        const reply = await callGroq(text);
        if (stopTyping) {
            hideProcessingBubble();
            isProcessing = false;
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
            sendBtn.classList.remove('stop-btn');
            return;
        }
        hideProcessingBubble();

        currentSession.push({ role: 'assistant', content: reply });

        if (insertAfterRow) {
            const newRow = document.createElement('div');
            newRow.className = 'msg-row assistant';
            const bubble = document.createElement('div');
            bubble.className = 'msg-bubble';
            newRow.appendChild(bubble);
            await typeMessageWithCodeTarget(reply, newRow);
            insertAfterRow.parentNode.insertBefore(newRow, insertAfterRow.nextSibling);
            chatArea.scrollTop = chatArea.scrollHeight;
        } else {
            await typeMessageWithCode(reply);
        }

        saveCurrentSession();
        renderHistoryList();

    } catch (err) {
        hideProcessingBubble();
        addMessage('assistant', `Error: ${err.message}`);
    } finally {
        isProcessing = false;
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        sendBtn.classList.remove('stop-btn');
        stopTyping = false;
    }
}

function typeMessageWithCodeTarget(fullText, targetRow) {
    return new Promise((resolve) => {
        const bubble = targetRow.querySelector('.msg-bubble');
        let i = 0;
        const baseSpeed = currentMode === 'fast' ? 4 : 7;

        function renderCurrentContent(upTo) {
            const currentText = fullText.substring(0, upTo);
            const rendered = renderMessageWithCode(currentText);
            const hasCode = rendered.parts && rendered.parts.some(p => p.type === 'code');
            bubble.innerHTML = '';
            if (!hasCode) {
                bubble.innerHTML = currentText.replace(/\n/g, '<br>');
            } else {
                const fragment = document.createDocumentFragment();
                for (const part of rendered.parts) {
                    if (part.type === 'text') {
                        const p = document.createElement('div');
                        p.textContent = part.content;
                        fragment.appendChild(p);
                    } else if (part.type === 'code') {
                        fragment.appendChild(buildCodeBlock(part));
                    }
                }
                bubble.appendChild(fragment);
            }
            const cursor = document.createElement('span');
            cursor.className = 'typing-cursor';
            cursor.style.display = 'inline-block';
            cursor.style.width = '2px';
            cursor.style.height = '1.1em';
            cursor.style.backgroundColor = 'var(--txt)';
            cursor.style.marginLeft = '2px';
            cursor.style.animation = 'blink 1s step-end infinite';
            cursor.style.verticalAlign = 'text-bottom';
            bubble.appendChild(cursor);
            chatArea.scrollTop = chatArea.scrollHeight;
        }

        renderCurrentContent(0);

        const interval = setInterval(() => {
            if (stopTyping) {
                clearInterval(interval);
                resolve();
                return;
            }
            if (i < fullText.length) {
                i++;
                renderCurrentContent(i);
            } else {
                clearInterval(interval);
                const rendered = renderMessageWithCode(fullText);
                const hasCode = rendered.parts && rendered.parts.some(p => p.type === 'code');
                bubble.innerHTML = '';
                if (!hasCode) {
                    bubble.innerHTML = fullText.replace(/\n/g, '<br>');
                } else {
                    const fragment = document.createDocumentFragment();
                    for (const part of rendered.parts) {
                        if (part.type === 'text') {
                            const p = document.createElement('div');
                            p.textContent = part.content;
                            fragment.appendChild(p);
                        } else if (part.type === 'code') {
                            fragment.appendChild(buildCodeBlock(part));
                        }
                    }
                    bubble.appendChild(fragment);
                }

                const actions = document.createElement('div');
                actions.className = 'msg-actions';
                const copyFullBtn = document.createElement('button');
                copyFullBtn.className = 'msg-act-btn';
                copyFullBtn.innerHTML = '<i class="fas fa-copy"></i> Salin';
                copyFullBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    navigator.clipboard?.writeText(fullText).then(() => {
                        showToast('Disalin', 'success');
                    }).catch(() => {});
                });
                actions.appendChild(copyFullBtn);

                const speakBtn = document.createElement('button');
                speakBtn.className = 'msg-act-btn';
                speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> Suara';
                speakBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!window.speechSynthesis) {
                        showToast('Browser tidak mendukung speech synthesis', 'error');
                        return;
                    }
                    window.speechSynthesis.cancel();
                    const utterance = new SpeechSynthesisUtterance(fullText);
                    utterance.lang = 'id-ID';
                    utterance.rate = 0.9;
                    utterance.pitch = 1;
                    window.speechSynthesis.speak(utterance);
                });
                actions.appendChild(speakBtn);

                bubble.appendChild(actions);
                chatArea.scrollTop = chatArea.scrollHeight;
                resolve();
            }
        }, baseSpeed);
        typeInterval = interval;
    });
}

sendBtn.addEventListener('click', function(e) {
    if (isProcessing) {
        e.preventDefault();
        stopTyping = true;
        isProcessing = false;
        clearInterval(thinkingInterval);
        clearInterval(typeInterval);
        hideThinking();
        hideProcessingBubble();
        this.disabled = false;
        this.innerHTML = '<i class="fas fa-arrow-up"></i>';
        this.classList.remove('stop-btn');
        showToast('Proses dihentikan', 'info');
    } else {
        sendMessage();
    }
});

document.getElementById('msgDeleteBtn').addEventListener('click', () => {
    if (selectedMsgIndex !== null && selectedMsgIndex < currentSession.length) {
        currentSession.splice(selectedMsgIndex, 1);
        document.querySelectorAll('.msg-row').forEach(el => el.remove());
        for (const msg of currentSession) {
            addMessage(msg.role, msg.content);
        }
        saveCurrentSession();
        renderHistoryList();
        showToast('Pesan dihapus', 'info');
    }
    document.getElementById('msgModal').classList.remove('show');
    selectedMsgIndex = null;
});

document.getElementById('msgEditBtn').addEventListener('click', () => {
    if (selectedMsgIndex !== null && selectedMsgIndex < currentSession.length) {
        const msg = currentSession[selectedMsgIndex];
        if (msg.role === 'user') {
            chatInput.value = msg.content;
            chatInput.focus();
            currentSession.splice(selectedMsgIndex, 1);
            document.querySelectorAll('.msg-row').forEach(el => el.remove());
            for (const m of currentSession) {
                addMessage(m.role, m.content);
            }
            saveCurrentSession();
            renderHistoryList();
            showToast('Pesan siap diedit', 'info');
        }
    }
    document.getElementById('msgModal').classList.remove('show');
    selectedMsgIndex = null;
});

document.addEventListener('click', (e) => {
    if (e.target.closest('.msg-modal') === null && !e.target.closest('.msg-modal-content')) {
        document.getElementById('msgModal').classList.remove('show');
        selectedMsgIndex = null;
    }
});

const loginModal = document.getElementById('loginModal');
const loginUsername = document.getElementById('loginUsername');
const loginBtn = document.getElementById('loginBtn');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const removeImageBtn = document.getElementById('removeImageBtn');
const loginPromptOptions = document.querySelectorAll('.login-prompt-option');

let loginAvatarBase64 = null;

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        handleFile(file);
    }
});
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
});

function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        loginAvatarBase64 = e.target.result;
        previewImage.src = loginAvatarBase64;
        previewContainer.style.display = 'flex';
        dropZone.style.display = 'none';
    };
    reader.readAsDataURL(file);
}

removeImageBtn.addEventListener('click', () => {
    loginAvatarBase64 = null;
    previewContainer.style.display = 'none';
    dropZone.style.display = 'block';
    fileInput.value = '';
});

loginPromptOptions.forEach(btn => {
    btn.addEventListener('click', () => {
        loginPromptOptions.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

loginBtn.addEventListener('click', () => {
    const username = loginUsername.value.trim() || 'AskalXML User';
    const activePrompt = document.querySelector('.login-prompt-option.active');
    const promptStyle = activePrompt ? activePrompt.dataset.prompt : 'normal';

    storage.setItem('askal_username', username);
    storage.setItem('askal_prompt_style', promptStyle);
    if (loginAvatarBase64) {
        storage.setItem('askal_avatar', loginAvatarBase64);
    }

    customUsername = username;
    customPromptStyle = promptStyle;
    userAvatarImage = loginAvatarBase64;
    userDisplayName.textContent = username;
    if (loginAvatarBase64) {
        userAvatar.innerHTML = `<img src="${loginAvatarBase64}" alt="Avatar">`;
    } else {
        userAvatar.textContent = username.charAt(0).toUpperCase();
    }

    loginModal.classList.add('hidden');
    showToast(`Selamat datang, ${username}!`, 'success');
});

function checkLogin() {
    const savedUsername = storage.getItem('askal_username');
    const savedStyle = storage.getItem('askal_prompt_style');
    const savedAvatar = storage.getItem('askal_avatar');

    if (savedUsername) {
        customUsername = savedUsername;
        customPromptStyle = savedStyle || 'normal';
        if (savedAvatar) {
            userAvatarImage = savedAvatar;
            userAvatar.innerHTML = `<img src="${savedAvatar}" alt="Avatar">`;
        } else {
            userAvatar.textContent = savedUsername.charAt(0).toUpperCase();
        }
        userDisplayName.textContent = savedUsername;
        loginModal.classList.add('hidden');
    } else {
        loginModal.classList.remove('hidden');
    }
}

const customModal = document.getElementById('customModal');
const customBtn = document.getElementById('customBtn');
const customModalClose = document.getElementById('customModalClose');
const usernameInput = document.getElementById('usernameInput');
const promptOptions = document.querySelectorAll('.prompt-option');
const customSaveBtn = document.getElementById('customSaveBtn');
const userDisplayName = document.getElementById('userDisplayName');
const userAvatar = document.getElementById('userAvatar');

function loadCustomPreferences() {
    try {
        const savedUsername = storage.getItem('askal_username');
        const savedStyle = storage.getItem('askal_prompt_style');
        if (savedUsername) {
            customUsername = savedUsername;
            usernameInput.value = savedUsername;
            userDisplayName.textContent = savedUsername || 'AskalXML User';
            const savedAvatar = storage.getItem('askal_avatar');
            if (savedAvatar) {
                userAvatar.innerHTML = `<img src="${savedAvatar}" alt="Avatar">`;
            } else {
                userAvatar.textContent = savedUsername ? savedUsername.charAt(0).toUpperCase() : 'Z';
            }
        }
        if (savedStyle && PROMPT_STYLES[savedStyle]) {
            customPromptStyle = savedStyle;
            promptOptions.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.prompt === savedStyle);
            });
        }
    } catch (_) {}
}
loadCustomPreferences();

customBtn.addEventListener('click', () => {
    customModal.classList.add('show');
});

customModalClose.addEventListener('click', () => {
    customModal.classList.remove('show');
});

customModal.addEventListener('click', (e) => {
    if (e.target === customModal) {
        customModal.classList.remove('show');
    }
});

promptOptions.forEach(btn => {
    btn.addEventListener('click', () => {
        promptOptions.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        customPromptStyle = btn.dataset.prompt;
    });
});

customSaveBtn.addEventListener('click', () => {
    const newUsername = usernameInput.value.trim() || 'AskalXML User';
    customUsername = newUsername;
    storage.setItem('askal_username', newUsername);
    storage.setItem('askal_prompt_style', customPromptStyle);
    userDisplayName.textContent = newUsername;
    const savedAvatar = storage.getItem('askal_avatar');
    if (savedAvatar) {
        userAvatar.innerHTML = `<img src="${savedAvatar}" alt="Avatar">`;
    } else {
        userAvatar.textContent = newUsername.charAt(0).toUpperCase();
    }
    customModal.classList.remove('show');
    showToast(`Username: ${newUsername}, Gaya: ${customPromptStyle}`, 'success');
});

function loadSessions() {
    try {
        const raw = storage.getItem('askal_sessions');
        if (raw) {
            allSessions = JSON.parse(raw);
            if (!Array.isArray(allSessions)) allSessions = [];
        } else {
            allSessions = [];
        }
    } catch (_) {
        allSessions = [];
    }
}

function renderHistoryList() {
    const list = document.getElementById('chatHistoryList');
    list.innerHTML = '';
    loadSessions();
    if (allSessions.length === 0) {
        list.innerHTML = '<div style="color:var(--txt-3);font-size:12px;padding:8px 14px;">Belum ada chat</div>';
        return;
    }
    allSessions.forEach((session) => {
        const div = document.createElement('div');
        div.className = 'sb-item';

        const iconSpan = document.createElement('span');
        iconSpan.className = 'sb-icon';
        iconSpan.textContent = '💬';
        const labelSpan = document.createElement('span');
        labelSpan.className = 'sb-label';
        const date = new Date(session.timestamp).toLocaleString('id-ID', {
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short'
        });
        labelSpan.textContent = `${session.name} (${date})`;
        div.appendChild(iconSpan);
        div.appendChild(labelSpan);
        div.addEventListener('click', () => {
            loadSession(session.id);
        });
        list.appendChild(div);
    });
}

const attachBtn = document.getElementById('attachBtn');
const attachOptions = document.getElementById('attachOptions');
const attachPhoto = document.getElementById('attachPhoto');
const attachVideo = document.getElementById('attachVideo');
const attachFile = document.getElementById('attachFile');

const photoInput = document.createElement('input');
photoInput.type = 'file';
photoInput.accept = 'image/*';
photoInput.style.display = 'none';
document.body.appendChild(photoInput);

const videoInput = document.createElement('input');
videoInput.type = 'file';
videoInput.accept = 'video/*';
videoInput.style.display = 'none';
document.body.appendChild(videoInput);

const fileInputGeneric = document.createElement('input');
fileInputGeneric.type = 'file';
fileInputGeneric.dataset.genericAttachment = 'true';
fileInputGeneric.style.display = 'none';
document.body.appendChild(fileInputGeneric);

attachBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    attachOptions.classList.toggle('show');
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.attach-container')) {
        attachOptions.classList.remove('show');
    }
});

attachPhoto.addEventListener('click', () => {
    photoInput.click();
    attachOptions.classList.remove('show');
});

photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    clearVideoPreview();
    const reader = new FileReader();
    reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        pendingImageBase64 = dataUrl.split(',')[1];
        pendingImageFile = file;
        showImagePreview(dataUrl, file.name);
        chatInput.focus();
        showToast('Foto siap, tambahkan keterangan lalu kirim', 'info');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
});

attachVideo.addEventListener('click', () => {
    videoInput.click();
    attachOptions.classList.remove('show');
});

videoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
        showToast('File yang dipilih bukan video.', 'error');
        return;
    }

    // Satu attachment aktif pada satu waktu.
    clearImagePreview();
    clearVideoPreview();
    pendingVideoFile = file;
    showVideoPreview(file);
    chatInput.focus();
    showToast('Video siap. Tulis pertanyaan lalu tekan kirim.', 'info');
    e.target.value = '';
});

attachFile.addEventListener('click', () => {
    fileInputGeneric.click();
    attachOptions.classList.remove('show');
});

fileInputGeneric.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Jangan kirim file di sini.
    // Simpan sebagai attachment pending sampai tombol Kirim ditekan.
    clearImagePreview();
    clearVideoPreview();
    clearGenericFilePreview();

    pendingGenericFile = file;
    showGenericFilePreview(file);
    chatInput.focus();
    showToast('File siap. Tulis pesan lalu tekan Kirim.', 'info');

    // Jangan kosongkan input sekarang karena clearGenericFilePreview()
    // hanya akan mengosongkannya ketika file benar-benar dibuang/dikirim.
});

chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!isProcessing) sendMessage();
    }
});
chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 140) + 'px';
});

const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const menuBtn = document.getElementById('menuBtn');
const sbClose = document.getElementById('sbClose');

menuBtn.addEventListener('click', () => {
    if (window.innerWidth > 768) {
        sidebar.classList.toggle('collapsed');
    } else {
        sidebar.classList.add('open');
        overlay.classList.add('show');
    }
});
sbClose.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
});
overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
});

const dropdownContainer = document.getElementById('methodDropdownContainer');
const trigger = document.getElementById('methodDropdownTrigger');
const options = document.querySelectorAll('.method-option');
const currentLabel = document.getElementById('currentMethodLabel');

trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownContainer.classList.toggle('open');
});

options.forEach(opt => {
    opt.addEventListener('click', (e) => {
        e.stopPropagation();
        options.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
        const mode = opt.dataset.method;
        currentMode = mode;
        const label = opt.dataset.label || opt.querySelector('span').textContent;
        const icon = opt.querySelector('i').cloneNode(true);
        currentLabel.innerHTML = '';
        currentLabel.appendChild(icon);
        currentLabel.appendChild(document.createTextNode(' ' + label));
        modelDisplay.textContent = label;
        dropdownContainer.classList.remove('open');
        showToast(`Mode: ${label}`, 'info');
    });
});

document.addEventListener('click', () => {
    dropdownContainer.classList.remove('open');
});

loadSessions();
modelDisplay.textContent = 'Smart AI';

checkLogin();

const savedUser = storage.getItem('askal_username') || 'AskalXML User';
const savedAvatar = storage.getItem('askal_avatar');
if (savedAvatar) {
    userAvatar.innerHTML = `<img src="${savedAvatar}" alt="Avatar">`;
} else {
    userAvatar.textContent = savedUser.charAt(0).toUpperCase();
}
userDisplayName.textContent = savedUser;

welcomeState.style.display = 'flex';
currentSession = [];
document.querySelectorAll('.msg-row').forEach(el => el.remove());

renderHistoryList();

console.log('Reverious Ai siap! Mode:', currentMode);
console.log('Sesi tersimpan:', allSessions.length);
console.log('Groq API untuk teks, OpenRouter untuk vision.');
console.log('👤 Pencipta: Pria Misterius');
console.log('🔊 Alarm suara siap!');


/* ============================================================
   REVERIOUS AI - BACKGROUND MUSIC
   Lagu: https://h.top4top.io/m_3872we08o0.mp3
   ============================================================ */
(function () {
    const MUSIC_URL = "https://h.top4top.io/m_3872we08o0.mp3";
    let music = null;
    let playing = false;

    function updateMusicButton() {
        const btn = document.getElementById("musicToggle");
        if (!btn) return;
        btn.innerHTML = playing
            ? '<i class="fas fa-volume-up"></i>'
            : '<i class="fas fa-volume-mute"></i>';
        btn.title = playing ? "Matikan musik" : "Putar musik";
        btn.setAttribute("aria-label", playing ? "Matikan musik" : "Putar musik");
    }

    function setupMusic() {
        const btn = document.getElementById("musicToggle");
        if (!btn || music) return;

        music = new Audio(MUSIC_URL);
        music.preload = "auto";
        music.loop = true;
        music.volume = 0.35;

        btn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (playing) {
                music.pause();
                playing = false;
                updateMusicButton();
                return;
            }

            music.play().then(function () {
                playing = true;
                updateMusicButton();
            }).catch(function (err) {
                console.warn("Musik belum bisa diputar:", err);
                playing = false;
                updateMusicButton();
            });
        });

        music.addEventListener("play", function () {
            playing = true;
            updateMusicButton();
        });

        music.addEventListener("pause", function () {
            playing = false;
            updateMusicButton();
        });

        music.addEventListener("error", function () {
            console.warn("Gagal memuat musik:", MUSIC_URL);
        });

        updateMusicButton();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", setupMusic);
    } else {
        setupMusic();
    }
    window.startReveriousBackgroundMusic = function () {
        const btn = document.getElementById("musicToggle");
        if (!music) setupMusic();
        if (!music) return;

        music.play().then(function () {
            playing = true;
            updateMusicButton();
        }).catch(function (err) {
            console.warn("Autoplay setelah interaksi Mulai Chat ditolak:", err);
        });
    };

})();
