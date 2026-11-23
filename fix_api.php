<?php
// Fichier : fix_api.php (Version Groq)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// 1. Récupération du texte
$input = json_decode(file_get_contents("php://input"), true);
$texte = $input['texte'] ?? '';

if (empty($texte)) {
    echo json_encode(["error" => "Aucun texte reçu"]);
    exit;
}

// Limite de taille pour éviter les abus sur la démo publique
if (mb_strlen($texte) > 6000) {
    echo json_encode(["error" => "Texte trop long (6000 caractères maximum)."]);
    exit;
}

// 2. Clé API Groq : lue depuis .env ou les variables du serveur (jamais dans le code)
require_once __DIR__ . '/env.php';
$apiKey = env('GROQ_API_KEY');
if (!$apiKey) {
    http_response_code(500);
    echo json_encode(["error" => "Clé API Groq manquante (GROQ_API_KEY)."]);
    exit;
}

// 3. Configuration pour GROQ
$url = "https://api.groq.com/openai/v1/chat/completions";
$model = "llama-3.1-8b-instant";

$system_prompt = "Tu es un assistant médical expert. Analyse le texte dicté et réponds UNIQUEMENT en format JSON structuré comme suit :
{
  \"type_document\": \"Ordonnance|Certificat|Compte Rendu\",
  \"contenu\": \"Le texte médical formaté ici\",
  \"imc\": {\"valeur\": \"valeur numérique\", \"statut\": \"Normal|Surpoids|etc.\"},
  \"alertes\": [\"Liste des dangers ou interactions médicamenteuses\"],
  \"diagnostics\": [\"Liste de 3 pathologies suggérées\"]
}
Instructions : 
1. Si tu trouves un poids (kg) et une taille (m ou cm), calcule l'IMC.
2. Si le médecin prescrit plusieurs médicaments, vérifie s'ils sont dangereux ensemble (ex: Aspirine + Anti-inflammatoire).
3. Suggère des diagnostics basés sur les symptômes cités.";

$data = [
    "model" => $model,
    "messages" => [
        ["role" => "system", "content" => $system_prompt],
        ["role" => "user", "content" => "Texte à analyser: " . $texte]
    ],
    "temperature" => 0.1,
    "response_format" => ["type" => "json_object"]
];

// 4. Envoi de la requête cURL
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer " . $apiKey
]);


$response = curl_exec($ch);

if ($response === false) {
    echo json_encode(["error" => "Erreur cURL : " . curl_error($ch)]);
    exit;
}
curl_close($ch);

// 5. Traitement de la réponse
$jsonGroq = json_decode($response, true);

if (isset($jsonGroq['error'])) {
    echo json_encode(["error" => "Erreur API Groq : " . $jsonGroq['error']['message']]);
    exit;
}

// Extraction du contenu JSON généré par l'IA
$content = trim($jsonGroq['choices'][0]['message']['content'] ?? '');

// On renvoie un JSON propre (même si le modèle a ajouté du texte)
$decoded = json_decode($content, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    $start = strpos($content, '{');
    $end = strrpos($content, '}');
    if ($start !== false && $end !== false && $end > $start) {
        $content = substr($content, $start, $end - $start + 1);
        $decoded = json_decode($content, true);
    }
}

if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
    echo json_encode([
        "error" => "Réponse IA non-JSON",
        "raw" => $content
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode($decoded, JSON_UNESCAPED_UNICODE);
?>