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

// --- 2. RECONNAISSANCE VOCALE (CORRIGÉE POUR ÉVITER LES RÉPÉTITIONS) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    status.innerHTML = "<span style='color:red'>Navigateur non supporté.</span>";
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = true; 
    recognition.interimResults = true;

    let isRecording = false;

    btnRecord.onclick = () => {
        if (isRecording) {
            recognition.stop();
            stopAnimation();
        } else {
            recognition.start();
            startAnimation();
        }
    };

    function startAnimation() {
        isRecording = true;
        micContainer.classList.add('recording');
        micIcon.classList.replace('fa-microphone', 'fa-stop');
        status.innerText = "Écoute active...";
        status.style.color = "#E74C3C";
        btnProcess.disabled = true;
    }

    function stopAnimation() {
        isRecording = false;
        micContainer.classList.remove('recording');
        micIcon.classList.replace('fa-stop', 'fa-microphone');
        status.innerText = "Pause. Cliquez pour reprendre.";
        status.style.color = "#95A5A6";
        btnProcess.disabled = false;
    }

    recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        // On n'ajoute que le texte finalisé pour éviter la répétition infinie
        if (finalTranscript !== '') {
            rawText.value += finalTranscript + ' ';
            // Auto-scroll vers le bas
            rawText.scrollTop = rawText.scrollHeight;
        }

        // Feedback visuel pour le texte en cours
        if (interimTranscript !== '') {
            status.innerText = "En cours : " + interimTranscript;
        }
    };
    
    recognition.onerror = (e) => { stopAnimation(); status.innerText = "Erreur: " + e.error; };
}

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