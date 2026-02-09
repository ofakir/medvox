<?php
// Fichier : get_history.php
header("Content-Type: application/json; charset=UTF-8");
require_once 'db.php';

try {
    // On récupère les 10 derniers documents
    $stmt = $pdo->query("SELECT id, titre, contenu, date_creation FROM documents ORDER BY date_creation DESC LIMIT 10");
    $docs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($docs);
} catch (Exception $e) {
    echo json_encode([]);
}
?>