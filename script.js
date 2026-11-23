// script.js mis à jour et corrigé

// Éléments UI
const btnRecord = document.getElementById('btnRecord');
const micIcon = document.getElementById('micIcon');
const micContainer = document.querySelector('.mic-container');
const status = document.getElementById('status');
const rawText = document.getElementById('rawText');
const btnProcess = document.getElementById('btnProcess');
const btnClear = document.getElementById('btnClear');
const btnSaveDraft = document.getElementById('btnSaveDraft');

// Éléments de l'Assistant IA
const aiAssistContainer = document.getElementById('aiAssistContainer');
const imcBadge = document.getElementById('imcBadge');
const diagList = document.getElementById('diagList');
const alertBox = document.getElementById('alertBox');
const alertText = document.getElementById('alertText');

// Modal
const overlay = document.getElementById('resultOverlay');
const closeModal = document.getElementById('closeModal');
const docTitle = document.getElementById('docTitle');
const docContent = document.getElementById('docContent');

// --- 1. CHARGEMENT AUTOMATIQUE DEPUIS L'HISTORIQUE ---
window.onload = () => {
    const savedDoc = localStorage.getItem('editDoc');
    if (savedDoc) {
        const data = JSON.parse(savedDoc);
        rawText.value = data.contenu;
        status.innerText = "Document chargé : " + data.titre;
        status.style.color = "#009C96"; 
        btnProcess.disabled = false;
        localStorage.removeItem('editDoc');
    }
};

// --- 2. RECONNAISSANCE VOCALE ---
// Fonctionne avec Google Chrome et Microsoft Edge (ordinateur et Android).
// Firefox, Brave et Safari ne fournissent pas (ou mal) la reconnaissance vocale.
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const langSelect = document.getElementById('langSelect');
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

function setStatus(message, color) {
    status.innerText = message;
    status.style.color = color || "#95A5A6";
}

function showError(message) {
    status.innerHTML = '';
    const span = document.createElement('span');
    span.style.color = '#E74C3C';
    span.textContent = message;
    status.appendChild(span);
}

const ERROR_MESSAGES = {
    'not-allowed': "Micro bloqué. Cliquez sur l'icône 🔒 à gauche de l'adresse du site, autorisez le micro, puis réessayez.",
    'service-not-allowed': "La reconnaissance vocale est bloquée par ce navigateur. Utilisez Google Chrome ou Microsoft Edge.",
    'audio-capture': "Aucun micro détecté. Branchez un micro ou vérifiez les réglages de votre appareil.",
    'network': "Service de reconnaissance vocale injoignable. Utilisez Google Chrome ou Microsoft Edge (Brave et Opera ne sont pas compatibles) et vérifiez votre connexion.",
    'language-not-supported': "Langue non prise en charge par ce navigateur. Choisissez une autre langue.",
};

if (!SpeechRecognition) {
    showError("Dictée vocale non disponible dans ce navigateur. Ouvrez MedVox dans Google Chrome ou Microsoft Edge (ou tapez le texte directement).");
    btnRecord.style.opacity = '0.4';
    btnRecord.style.cursor = 'not-allowed';
} else {
    if (navigator.brave) {
        showError("Brave bloque la dictée vocale. Ouvrez MedVox dans Google Chrome ou Microsoft Edge.");
    }

    const recognition = new SpeechRecognition();
    // Sur mobile, le mode continu répète les mots : on écoute phrase par phrase et on relance.
    recognition.continuous = !isMobile;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let wantRecording = false;   // l'utilisateur veut dicter
    let isListening = false;     // le navigateur écoute réellement
    let committedText = '';      // texte déjà validé dans la zone
    let fatalError = false;

    function startAnimation() {
        micContainer.classList.add('recording');
        micIcon.classList.replace('fa-microphone', 'fa-stop');
        setStatus("Écoute active... parlez maintenant.", "#E74C3C");
        btnProcess.disabled = true;
    }

    function stopAnimation(message) {
        micContainer.classList.remove('recording');
        micIcon.classList.replace('fa-stop', 'fa-microphone');
        if (message !== null) setStatus(message || "Pause. Cliquez pour reprendre.");
        btnProcess.disabled = rawText.value.trim() === '';
    }

    function startListening() {
        recognition.lang = (langSelect && langSelect.value) || 'fr-FR';
        try {
            recognition.start();
        } catch (e) {
            // Déjà démarré : on ignore
        }
    }

    // --- Indicateur de niveau du micro + diagnostic ---
    const levelBar = document.getElementById('micLevelBar');
    let meterStream = null, audioCtx = null, meterRaf = null;
    let peakLevel = 0, gotResult = false, watchdog = null;

    function startMeter(stream) {
        meterStream = stream;
        peakLevel = 0;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 512;
            audioCtx.createMediaStreamSource(stream).connect(analyser);
            const data = new Uint8Array(analyser.fftSize);
            const tick = () => {
                analyser.getByteTimeDomainData(data);
                let sum = 0;
                for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
                const level = Math.min(1, Math.sqrt(sum / data.length) * 4);
                peakLevel = Math.max(peakLevel, level);
                if (levelBar) levelBar.style.width = Math.round(level * 100) + '%';
                meterRaf = requestAnimationFrame(tick);
            };
            tick();
        } catch (e) { /* l'indicateur est facultatif */ }
    }

    function stopMeter() {
        cancelAnimationFrame(meterRaf);
        if (meterStream) meterStream.getTracks().forEach(t => t.stop());
        if (audioCtx) audioCtx.close().catch(() => {});
        meterStream = null; audioCtx = null;
        if (levelBar) levelBar.style.width = '0%';
        clearTimeout(watchdog);
    }

    function armWatchdog() {
        clearTimeout(watchdog);
        gotResult = false;
        watchdog = setTimeout(() => {
            if (!wantRecording || gotResult) return;
            if (peakLevel < 0.08) {
                showError("Le micro ne capte aucun son. Dans Chrome, ouvrez chrome://settings/content/microphone et choisissez le bon micro (et vérifiez qu'il n'est pas coupé dans Windows), puis réessayez.");
            } else {
                showError("Le micro capte votre voix mais le service de dictée de Chrome ne répond pas. Vérifiez la langue choisie et désactivez la traduction automatique de la page, ou testez la dictée sur https://www.google.com/intl/fr/chrome/demos/speech.html");
            }
        }, 8000);
    }

    async function begin() {
        fatalError = false;
        // Demande explicite du micro : affiche la fenêtre d'autorisation et détecte un refus.
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                startMeter(stream);
            } catch (e) {
                const code = e && e.name === 'NotFoundError' ? 'audio-capture' : 'not-allowed';
                showError(ERROR_MESSAGES[code]);
                return;
            }
        }
        committedText = rawText.value ? rawText.value.replace(/\s*$/, ' ') : '';
        wantRecording = true;
        startAnimation();
        armWatchdog();
        startListening();
    }

    function end() {
        wantRecording = false;
        stopMeter();
        recognition.stop();
        rawText.value = committedText.trim() ? committedText : rawText.value;
        stopAnimation();
    }

    btnRecord.onclick = () => {
        if (wantRecording) end();
        else begin();
    };

    if (langSelect) {
        langSelect.onchange = () => {
            // Changement de langue pendant la dictée : on relance avec la nouvelle langue.
            if (wantRecording) recognition.stop();
        };
    }

    recognition.onstart = () => { isListening = true; };

    recognition.onresult = (event) => {
        gotResult = true;
        clearTimeout(watchdog);
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                committedText += transcript.trim() + ' ';
            } else {
                interim += transcript;
            }
        }
        // Affiche le texte en direct dans la zone (le texte provisoire apparaît à la suite)
        rawText.value = committedText + interim;
        rawText.scrollTop = rawText.scrollHeight;
        setStatus(interim ? "En cours : " + interim : "Écoute active... parlez maintenant.", "#E74C3C");
    };

    recognition.onerror = (e) => {
        if (e.error === 'no-speech' || e.error === 'aborted') return; // silence : on relance dans onend
        if (ERROR_MESSAGES[e.error]) {
            fatalError = true;
            wantRecording = false;
            stopMeter();
            stopAnimation(null);
            showError(ERROR_MESSAGES[e.error]);
        } else {
            setStatus("Erreur : " + e.error, "#E74C3C");
        }
    };

    recognition.onend = () => {
        isListening = false;
        if (wantRecording && !fatalError) {
            // Le navigateur coupe après un silence : on relance automatiquement.
            rawText.value = committedText;
            setTimeout(startListening, 150);
        } else if (!fatalError) {
            rawText.value = committedText.trim() ? committedText : rawText.value;
            stopAnimation();
        }
    };
}

// Le texte peut aussi être tapé à la main
rawText.addEventListener('input', () => {
    btnProcess.disabled = rawText.value.trim() === '';
});

// --- 3. BOUTONS ACTIONS ---

btnClear.onclick = () => {
    if(confirm('Tout effacer ?')) {
        rawText.value = '';
        status.innerText = "Prêt.";
        aiAssistContainer.style.display = 'none';
    }
}

btnSaveDraft.onclick = () => {
    const text = rawText.value.trim();
    if (!text) return alert("Rien à sauvegarder !");

    fetch('save_draft.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texte: text })
    })
    .then(r => r.json())
    .then(data => {
        if(data.success) {
            alert("Brouillon sauvegardé !");
        } else {
            alert("Erreur: " + data.error);
        }
    });
};

btnProcess.onclick = () => {
    const text = rawText.value.trim();
    if (!text) return alert("Aucun texte à analyser !");

    btnProcess.disabled = true;
    btnProcess.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Traitement...';
    
    fetch('fix_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texte: text })
    })
    .then(r => r.json())
    .then(data => {
        btnProcess.disabled = false;
        btnProcess.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Générer le Document Officiel';

        if(data.error) {
            alert('Erreur IA: ' + data.error);
        } else {
            // 1. Modal (PDF)
            docTitle.value = data.type_document || "Document";
            docContent.value = data.contenu || "";
            overlay.style.display = 'flex';

            // 2. Assistant IA principal
            if (data.imc || data.diagnostics || (data.alertes && data.alertes.length > 0)) {
                aiAssistContainer.style.display = 'block';
            }

            // IMC
            if (data.imc && data.imc.valeur) {
                imcBadge.style.display = 'inline-block';
                imcBadge.innerHTML = `<i class="fa-solid fa-weight-scale"></i> IMC: ${data.imc.valeur} (${data.imc.statut})`;
            } else { imcBadge.style.display = 'none'; }

            // Diagnostics
            if (data.diagnostics && data.diagnostics.length > 0) {
                diagList.style.display = 'inline-block';
                diagList.innerHTML = `<i class="fa-solid fa-stethoscope"></i> À vérifier : ${data.diagnostics.join(', ')}`;
            } else { diagList.style.display = 'none'; }

            // Alertes
            if (data.alertes && data.alertes.length > 0) {
                alertBox.style.display = 'flex';
                alertText.innerText = data.alertes[0];
            } else { alertBox.style.display = 'none'; }
        }
    })
    .catch(err => {
        btnProcess.disabled = false;
        alert("Erreur réseau");
    });
};

closeModal.onclick = () => { overlay.style.display = 'none'; };