# 🐳 Guide Docker - Projet Médical

## 📋 Prérequis

- Docker Desktop installé ([Télécharger ici](https://www.docker.com/products/docker-desktop))
- Docker Compose (inclus avec Docker Desktop)

## 🚀 Démarrage rapide

### 1. Construire et démarrer les conteneurs

```bash
docker-compose up -d --build
```

Cette commande va :
- 🏗️ Construire l'image Docker PHP
- 🚀 Démarrer 3 conteneurs : Web (PHP/Apache), MySQL, phpMyAdmin
- 📦 Créer la base de données automatiquement

### 2. Vérifier que les conteneurs sont actifs

```bash
docker-compose ps
```

### 3. Accéder à l'application

- **Application web** : http://localhost:8080
- **phpMyAdmin** : http://localhost:8081
  - Utilisateur : `root`
  - Mot de passe : `root_password`

## 🔧 Configuration

### Variables d'environnement

Modifie le fichier `docker-compose.yml` pour changer :
- Les mots de passe MySQL
- Les ports exposés
- Le nom de la base de données

### Connexion à la base de données

Pour utiliser Docker, remplace dans tes fichiers PHP :
```php
// Remplace
include 'db.php';
// Par
include 'db.docker.php';
```

Ou renomme directement les fichiers :
```bash
mv db.php db.local.php
mv db.docker.php db.php
```

## 📝 Commandes utiles

### Arrêter les conteneurs
```bash
docker-compose down
```

### Arrêter et supprimer les volumes (⚠️ efface la BDD)
```bash
docker-compose down -v
```

### Voir les logs
```bash
docker-compose logs -f
```

### Voir les logs d'un service spécifique
```bash
docker-compose logs -f web
docker-compose logs -f db
```

### Redémarrer un service
```bash
docker-compose restart web
```

### Accéder au shell du conteneur web
```bash
docker exec -it medical_app bash
```

### Accéder à MySQL en ligne de commande
```bash
docker exec -it medical_db mysql -u root -proot_password cabinet_medical
```

### Importer un fichier SQL
```bash
docker exec -i medical_db mysql -u root -proot_password cabinet_medical < votre_fichier.sql
```

### Exporter la base de données
```bash
docker exec medical_db mysqldump -u root -proot_password cabinet_medical > backup.sql
```

## 🔄 Mise à jour du code

Les fichiers sont synchronisés en temps réel grâce aux volumes Docker. Modifie simplement ton code et recharge la page dans le navigateur.

Si tu modifies le `Dockerfile`, rebuild l'image :
```bash
docker-compose up -d --build
```

## 🗃️ Volumes et persistance

- Les données MySQL sont stockées dans un volume Docker persistent nommé `mysql_data`
- Même après `docker-compose down`, les données sont conservées
- Pour effacer les données : `docker-compose down -v`

## 🐛 Dépannage

### Port déjà utilisé
Si le port 8080 ou 3306 est déjà utilisé, modifie dans `docker-compose.yml` :
```yaml
ports:
  - "9090:80"  # Change 8080 en 9090 (ou autre)
```

### Erreur de connexion MySQL
Attends quelques secondes que MySQL soit complètement démarré :
```bash
docker-compose logs db
```

### Recharger la configuration
```bash
docker-compose down
docker-compose up -d --build
```

## 📊 Architecture

```
┌─────────────────────┐
│   Navigateur        │
│   localhost:8080    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Container Web     │
│   PHP 8.2 + Apache  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Container DB      │
│   MySQL 8.0         │
└─────────────────────┘
```

## ⚙️ Configuration de production

Pour la production, modifie :
1. Change tous les mots de passe
2. Désactive phpMyAdmin
3. Configure les limites de ressources
4. Active le mode HTTPS
5. Configure les backups automatiques

## 📞 Support

En cas de problème :
1. Vérifie que Docker Desktop est lancé
2. Vérifie les logs : `docker-compose logs`
3. Redémarre les conteneurs : `docker-compose restart`
