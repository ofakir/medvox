<?php
// Fichier : save_draft.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$input = json_decode(file_get_contents("php://input"), true);
$texte = $input['texte'] ?? '';

if (empty($texte)) {
    echo json_encode(["error" => "Texte vide"]);
    exit;
}

try {
    require_once 'db.php'; // Ta connexion BDD
    
    // On l'appelle "Brouillon" pour le reconnaître dans l'historique
    $titre = "Brouillon (Non traité)";
    
    $stmt = $pdo->prepare("INSERT INTO documents (titre, contenu, date_creation) VALUES (?, ?, NOW())");
    $stmt->execute([$titre, $texte]);
    
    echo json_encode(["success" => true, "message" => "Brouillon sauvegardé !"]);

} catch (Exception $e) {
    echo json_encode(["error" => "Erreur SQL : " . $e->getMessage()]);
}
?>