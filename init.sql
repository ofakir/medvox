-- Fichier d'initialisation de la base de données
CREATE DATABASE IF NOT EXISTS cabinet_medical CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE cabinet_medical;

-- Table utilisée par l'application (brouillons + documents générés)
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    contenu TEXT NOT NULL,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (date_creation)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table pour stocker l'historique des consultations
CREATE TABLE IF NOT EXISTS historique (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_document VARCHAR(50) NOT NULL,
    contenu TEXT NOT NULL,
    imc_valeur VARCHAR(10),
    imc_statut VARCHAR(50),
    alertes TEXT,
    diagnostics TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (date_creation),
    INDEX idx_type (type_document)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table pour les brouillons (optionnel)
CREATE TABLE IF NOT EXISTS brouillons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    texte TEXT NOT NULL,
    date_sauvegarde TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (date_sauvegarde)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
