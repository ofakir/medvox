<?php
// Fichier : db.php
// - Si DB_HOST est défini (Docker, WAMP, hébergeur) : connexion MySQL.
// - Sinon : base SQLite locale (data/medvox.sqlite), créée automatiquement.
//   Pratique pour une démo en ligne sans serveur MySQL.
require_once __DIR__ . '/env.php';

try {
    $host = env('DB_HOST');

    if ($host) {
        $dbname = env('DB_NAME', 'cabinet_medical');
        $port = env('DB_PORT', '3306');
        $pdo = new PDO(
            "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
            env('DB_USER', 'root'),
            env('DB_PASSWORD', '')
        );
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    } else {
        $dir = __DIR__ . '/data';
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
        $pdo = new PDO('sqlite:' . $dir . '/medvox.sqlite');
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->exec("CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titre TEXT NOT NULL,
            contenu TEXT NOT NULL,
            date_creation DATETIME DEFAULT CURRENT_TIMESTAMP
        )");
    }
} catch (PDOException $e) {
    error_log('MedVox DB error: ' . $e->getMessage());
    if (defined('DB_SOFT_FAIL')) {
        $pdo = null; // L'appelant continue sans base de données
        return;
    }
    http_response_code(500);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(["error" => "Connexion à la base de données impossible."]);
    exit;
}
