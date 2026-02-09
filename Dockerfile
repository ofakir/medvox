# 1. Image de base (Le socle)
FROM php:8.2-apache
# On choisit l'image officielle PHP 8.2 avec le serveur Apache inclus.
# Cela garantit que le code fonctionnera sur n'importe quelle machine de la même façon.

# 2. Mises à jour et Outils système
RUN apt-get update && apt-get install -y \
    libpng-dev libjpeg-dev libfreetype6-dev \
    zip unzip git curl
# 'apt-get' installe les utilitaires Linux nécessaires au projet.
# 'curl' est indispensable pour que MedVox puisse communiquer avec l'API Gemini.

# 3. Configuration de la bibliothèque Image (GD)
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd
# Permet à PHP de manipuler des images (pour générer des logos ou graphiques dans les rapports).

# 4. Connexion à la base de données (Pilotes)
RUN docker-php-ext-install pdo pdo_mysql mysqli
# Ces extensions permettent à PHP de communiquer avec MySQL pour sauvegarder l'historique médical.

# 5. Nettoyage du système
RUN apt-get clean && rm -rf /var/lib/apt/lists/*
# Supprime les fichiers temporaires pour que l'image Docker soit la plus légère possible.

# 6. Activation de la réécriture d'URL (Apache Rewrite)
RUN a2enmod rewrite
# Permet d'avoir des URLs propres (ex: /patient/1 au lieu de /patient.php?id=1).

# 7. Répertoire de travail (Workspace)
WORKDIR /var/www/html
# Définit le dossier par défaut où toutes les commandes suivantes seront exécutées.

# 8. Copie des fichiers du projet
COPY . /var/www/html/
# Copie tout ton code source (index.html, script.js, api_gemini.php) vers l'intérieur du conteneur.

# 9. Gestion des Permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html
# Donne les droits d'accès au serveur Apache pour lire et exécuter les fichiers sans erreur "403 Forbidden".

# 10. Exposition et Lancement
EXPOSE 80
CMD ["apache2-foreground"]
# Ouvre le port 80 pour le trafic Web et lance le serveur Apache automatiquement au démarrage.