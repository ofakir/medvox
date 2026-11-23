<?php
header('Content-Type: application/json');

// 1. Récupération input
$input = json_decode(file_get_contents('php://input'), true);
if (!$input || empty($input['texte'])) {
    echo json_encode(["error" => "Aucun texte reçu"]);
    exit;
}

$texte = $input['texte'];
require_once __DIR__ . '/env.php';
$apiKey = env('GEMINI_API_KEY', ''); // Défini dans .env ou sur le serveur

// 2. Définition des types de documents possibles
$docTypes = "Ordonnance, Certificat médical, Arrêt de travail, Compte rendu, Demande d'analyses, Demande d'examens (Radio/IRM), Lettre d'orientation, Certificat d'aptitude, Conseils médicaux, Régime alimentaire";

// 3. Prompt système (Ingénierie de prompt)
$prompt = "
Rôle : Tu es un assistant médical expert chargé de rédiger des documents officiels.
Contexte : Voici la transcription brute d'une conversation entre un médecin et un patient, ou une dictée du médecin :
\"$texte\"

Tâches :
1. ANALYSE : Identifie qui parle. Ignore les plaintes du patient. Concentre-toi uniquement sur les décisions, prescriptions et constats du médecin.
2. CLASSIFICATION : Choisis le type de document le plus approprié parmi cette liste : $docTypes.
3. RÉDACTION : Rédige le contenu du corps du document. Sois professionnel, direct et clair. Utilise des tirets pour les listes.
4. FORMAT : Réponds UNIQUEMENT avec ce JSON strict :
{
    \"type_document\": \"Le Titre du Document\",
    \"contenu\": \"Le texte du corps du document...\"
}
";

// 4. Appel API Gemini via cURL
$url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" . $apiKey;
$data = [ "contents" => [ [ "parts" => [ ["text" => $prompt] ] ] ] ];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
$response = curl_exec($ch);
curl_close($ch);

// 5. Traitement de la réponse
$jsonResp = json_decode($response, true);
if (isset($jsonResp['candidates'][0]['content']['parts'][0]['text'])) {
    $rawAI = $jsonResp['candidates'][0]['content']['parts'][0]['text'];
    // Nettoyage des balises Markdown ```json ... ```
    $cleanJson = str_replace(['```json', '```'], '', $rawAI);
    echo $cleanJson;
} else {
    echo json_encode(["error" => "Réponse invalide de Gemini", "raw" => $response]);
}
?>