<?php
// Fichier : get_history_full.php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
require_once 'db.php';

try {
    // On récupère tout, du plus récent au plus ancien
    $stmt = $pdo->query("SELECT * FROM documents ORDER BY date_creation DESC");
    $docs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($docs);
} catch (Exception $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>