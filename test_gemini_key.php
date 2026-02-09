<?php
// Fichier de test pour vérifier la clé API Gemini
header("Content-Type: text/html; charset=UTF-8");

// ⚠️ Colle ta clé API Gemini ici
$apiKey = "VOTRE_CLE_API_GEMINI_ICI";

// URL de l'API Gemini
$url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=" . $apiKey;

// Test simple : demander à Gemini de répondre "Bonjour"
$data = [
    "contents" => [
        [
            "parts" => [
                ["text" => "Réponds simplement: Bonjour"]
            ]
        ]
    ],
    "generationConfig" => [
        "temperature" => 0.1
    ]
];

echo "<h1>🧪 Test de la clé API Gemini</h1>";
echo "<hr>";
echo "<h3>🔑 Clé API utilisée:</h3>";
echo "<p><code>" . substr($apiKey, 0, 20) . "..." . substr($apiKey, -10) . "</code></p>";
echo "<hr>";
echo "<h3>📡 Envoi de la requête...</h3>";

// Envoi de la requête
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if ($response === false) {
    echo "<p style='color: red;'>❌ <strong>Erreur cURL:</strong> " . curl_error($ch) . "</p>";
    curl_close($ch);
    exit;
}
curl_close($ch);

echo "<h3>📊 Code HTTP: $httpCode</h3>";
echo "<hr>";

// Décodage de la réponse
$jsonResponse = json_decode($response, true);

// Affichage du résultat
if ($httpCode == 200 && isset($jsonResponse['candidates'])) {
    echo "<p style='color: green; font-size: 20px;'>✅ <strong>SUCCÈS!</strong></p>";
    echo "<p>Ta clé API Gemini fonctionne correctement! 🎉</p>";
    echo "<hr>";
    echo "<h3>📝 Réponse de Gemini:</h3>";
    $content = $jsonResponse['candidates'][0]['content']['parts'][0]['text'] ?? 'Pas de contenu';
    echo "<p style='background: #f0f0f0; padding: 10px; border-radius: 5px;'><strong>" . htmlspecialchars($content) . "</strong></p>";
    
    echo "<hr>";
    echo "<h3>📦 Réponse JSON complète:</h3>";
    echo "<pre style='background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto;'>";
    echo htmlspecialchars(json_encode($jsonResponse, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo "</pre>";
    
} else {
    echo "<p style='color: red; font-size: 20px;'>❌ <strong>ÉCHEC!</strong></p>";
    
    if (isset($jsonResponse['error'])) {
        echo "<h3>🚫 Message d'erreur:</h3>";
        echo "<p style='background: #ffebee; padding: 10px; border-radius: 5px;'>";
        echo "<strong>Code:</strong> " . ($jsonResponse['error']['code'] ?? 'N/A') . "<br>";
        echo "<strong>Message:</strong> " . ($jsonResponse['error']['message'] ?? 'N/A') . "<br>";
        echo "<strong>Status:</strong> " . ($jsonResponse['error']['status'] ?? 'N/A');
        echo "</p>";
        
        echo "<hr>";
        echo "<h3>💡 Solutions possibles:</h3>";
        echo "<ul>";
        if (strpos($jsonResponse['error']['message'], 'API key') !== false) {
            echo "<li>Ta clé API est invalide ou mal formatée</li>";
            echo "<li>Vérifie que tu as copié la clé complète depuis <a href='https://makersuite.google.com/app/apikey' target='_blank'>Google AI Studio</a></li>";
        }
        if (strpos($jsonResponse['error']['message'], 'quota') !== false) {
            echo "<li>Tu as dépassé le quota gratuit de l'API</li>";
            echo "<li>Attends quelques minutes ou active la facturation</li>";
        }
        if (strpos($jsonResponse['error']['message'], 'blocked') !== false) {
            echo "<li>L'API est bloquée dans ta région</li>";
            echo "<li>Essaie avec un VPN</li>";
        }
        echo "</ul>";
    }
    
    echo "<hr>";
    echo "<h3>📦 Réponse complète:</h3>";
    echo "<pre style='background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto;'>";
    echo htmlspecialchars($response);
    echo "</pre>";
}

echo "<hr>";
echo "<p style='text-align: center; color: #666;'>🏥 Test de l'API Gemini - Projet Médical</p>";
?>
