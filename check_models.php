<?php
// Fichier : check_models.php
header("Content-Type: text/html; charset=UTF-8");
require_once __DIR__ . '/env.php';

$apiKey = env('GEMINI_API_KEY', ''); // Défini dans .env ou sur le serveur

$url = "https://generativelanguage.googleapis.com/v1beta/models?key=" . $apiKey;

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

$response = curl_exec($ch);
curl_close($ch);

$json = json_decode($response, true);

echo "<h1>Modèles disponibles pour votre clé :</h1>";

if (isset($json['error'])) {
    echo "<h3 style='color:red'>ERREUR : " . $json['error']['message'] . "</h3>";
} elseif (isset($json['models'])) {
    echo "<ul>";
    foreach ($json['models'] as $model) {
        // On cherche ceux qui savent générer du contenu (generateContent)
        if (in_array("generateContent", $model['supportedGenerationMethods'])) {
            // On affiche le nom technique exact qu'il faut utiliser
            $nomTechnique = str_replace("models/", "", $model['name']);
            echo "<li>✅ <strong>" . $nomTechnique . "</strong></li>";
        }
    }
    echo "</ul>";
} else {
    echo "Réponse vide ou inconnue.";
}
?>