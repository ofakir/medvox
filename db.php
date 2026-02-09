<?php
// Fichier : db.php
$host = 'localhost';
$dbname = 'cabinet_medical';
$username = 'root';
$password = ''; // Par défaut vide sur WAMP

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    // En production, on évite d'afficher l'erreur brute, mais pour le dev c'est ok
    die("Erreur de connexion BDD : " . $e->getMessage());
}
?>