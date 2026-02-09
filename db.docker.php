<?php
// Fichier : db.docker.php - Configuration pour Docker
// Utilisation des variables d'environnement Docker
$host = getenv('DB_HOST') ?: 'db';
$dbname = getenv('DB_NAME') ?: 'cabinet_medical';
$username = getenv('DB_USER') ?: 'root';
$password = getenv('DB_PASSWORD') ?: 'root_password';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    // En production, on évite d'afficher l'erreur brute, mais pour le dev c'est ok
    die("Erreur de connexion BDD : " . $e->getMessage());
}
?>
