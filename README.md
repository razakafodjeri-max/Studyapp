# StudyFlow - Assistant Intelligent de Concentration Pomodoro

StudyFlow est une application de bureau haut de gamme conçue pour optimiser vos sessions de travail. Basée sur une approche **Pomodoro adaptative**, l'application ajuste dynamiquement la durée de vos cycles de travail et de repos en mesurant votre niveau d'attention en temps réel.

---

## 🌟 Fonctionnalités Clés

1. **🍅 Pomodoro Adaptatif :** Durées de travail oscillant dynamiquement entre 15 et 50 minutes basées sur l'efficacité constatée.
2. **👁️ Détection de Concentration IA :** Utilise un modèle local de vision par ordinateur (TensorFlow.js BlazeFace) pour classifier si vous êtes *Concentré*, *Distrait* ou *Absent*.
3. **⌨️ Mode sans Caméra (Activité) :** Si la caméra est coupée, l'IA bascule sur l'analyse de l'activité clavier/souris, de l'état de focus de la fenêtre et du temps d'inactivité du système.
4. **📋 Gestion de Tâches Intégrée :** Kanban complet avec CRUD, Glisser-déposer pour valider les tâches, et outil d'estimation de charge intelligente par mots-clés.
5. **📊 Tableau de Bord et Analytiques :** Graphiques interactifs (via Chart.js) illustrant l'évolution temporelle de votre attention, vos scores moyens et la répartition de votre temps productif.
6. **🧘 Recommandations Personnalisées :** Conseils d'ergonomie et alertes de fatigue ciblées générés à partir de votre profil d'attention local.
7. **🔒 Confidentialité Absolue :** 100% local. Aucune image de webcam n'est enregistrée ou transmise. SQLite local sécurisé pour les statistiques.
8. **♿ Accessibilité et Confort :** Raccourcis clavier globaux, mode sombre par défaut, et régulateurs de taille de police / contraste élevé.

---

## 🛠️ Stack Technique

*   **Frontend :** React, TypeScript, TailwindCSS, Framer Motion
*   **Backend / Conteneur Bureau :** Electron.js (Main & Preload)
*   **Base de Données :** SQLite (via le module natif `node:sqlite` de Node.js 22, avec repli automatique vers une base JSON locale)
*   **Visualisations :** Chart.js & React-Chartjs-2
*   **Intelligence Artificielle :** TensorFlow.js & BlazeFace Face Landmarks Detector

---

## ⌨️ Raccourcis Clavier

StudyFlow intègre une navigation clavier fluide pour les professionnels :

*   `Espace` : Lancer ou mettre en pause le minuteur Pomodoro
*   `Ctrl + Shift + D` : Basculer sur le **Dashboard**
*   `Ctrl + Shift + T` : Ouvrir le gestionnaire de **Tâches**
*   `Ctrl + Shift + A` : Consulter les **Analytiques**
*   `Ctrl + Shift + S` : Ouvrir les **Paramètres**

---

## 🚀 Installation et Démarrage

### Prérequis
*   **Node.js :** v20.x ou v22.x+ (recommandé v22 pour bénéficier de SQLite natif)
*   **NPM :** v10.x+

### 1. Cloner et installer les dépendances
```bash
# Se placer dans le répertoire du projet
cd StudyFlow

# Installer les dépendances
npm install
```

### 2. Démarrer en Mode Développement
Le script démarre le compilateur `esbuild` en mode observation (watch) pour le processus principal d'Electron, démarre le serveur de développement Vite pour le code React, et lance l'interface graphique.
```bash
npm run dev
```

### 3. Compiler et Packager le Projet
Compile le code source et génère des paquets d'installation autonomes compressés pour votre système d'exploitation dans le dossier `/release`.

```bash
# Compiler le code principal et le rendu React
npm run build

# Générer l'installateur adapté à votre OS (EXE, DMG, ou AppImage)
npm run package
```

Les configurations d'assemblage (`electron-builder`) ciblent :
*   **Windows :** Installateur auto-extractible NSIS (`.exe`)
*   **macOS :** Image disque standard (`.dmg`)
*   **Linux :** Format portable universel (`.AppImage`)
