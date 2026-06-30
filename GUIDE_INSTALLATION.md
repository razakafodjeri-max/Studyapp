# 📘 Guide d'Installation de StudyFlow (Pour tous)

Bienvenue dans **StudyFlow** ! Ce guide simple est conçu pour vous aider à installer et démarrer l'application facilement, même si vous n'avez aucune connaissance en informatique ou en programmation.

---

## 🚀 Option 1 : Installer l'application prête à l'emploi (Méthode Simple)

Cette méthode ne nécessite **aucun outil de développement** (pas de terminal, pas de Node.js). Vous téléchargez l'application comme n'importe quel autre logiciel de votre ordinateur.

### 📥 Étape 1 : Télécharger l'installateur
1. Allez sur la page du projet **GitHub**.
2. Cliquez sur l'onglet **Releases** (ou Versions) sur le côté droit.
3. Téléchargez le fichier correspondant à votre ordinateur :
   * 💻 **Windows :** Téléchargez le fichier se terminant par `.exe` (ex: `StudyFlow-Setup-1.0.0.exe`).
   * 🍎 **Mac :** Téléchargez le fichier se terminant par `.dmg` (ex: `StudyFlow-1.0.0.dmg`).
   * 🐧 **Linux :** Téléchargez le fichier se terminant par `.AppImage` (ex: `StudyFlow-1.0.0.AppImage`).

---

### 💿 Étape 2 : L'installer sur votre ordinateur

#### 💻 Sur Windows :
1. Faites un double-clic sur le fichier `.exe` téléchargé.
2. Si Windows affiche un écran bleu *"Windows a protégé votre ordinateur"* (dû au fait que l'application est récente et non signée commercialement) :
   * Cliquez sur le lien **"Informations complémentaires"**.
   * Cliquez sur le bouton **"Exécuter quand même"**.
3. L'application s'installe toute seule en quelques secondes et se lance automatiquement. Un raccourci est créé sur votre bureau !

#### 🍎 Sur macOS :
1. Double-cliquez sur le fichier `.dmg` téléchargé.
2. Dans la fenêtre qui s'ouvre, glissez l'icône de **StudyFlow** dans le dossier **Applications**.
3. Allez dans votre dossier Applications, puis faites un **clic droit** sur StudyFlow et choisissez **Ouvrir** (pour autoriser le lancement initial de l'application).

#### 🐧 Sur Linux :
1. Faites un clic droit sur le fichier `.AppImage` téléchargé et allez dans **Propriétés**.
2. Dans l'onglet *Permissions*, cochez la case **"Autoriser l'exécution du fichier comme un programme"**.
3. Double-cliquez sur le fichier pour lancer StudyFlow immédiatement.

---

## 🎥 Première utilisation de l'application

1. **L'Assistant d'Accueil :** Au premier démarrage, un écran de bienvenue (Onboarding) vous explique les bases du Pomodoro et vous demande vos préférences.
2. **Autorisation de la Caméra :** Si vous choisissez d'activer l'IA d'attention Webcam, une notification vous demandera l'accès à la caméra. Cliquez sur **"Autoriser"** pour permettre à l'IA d'analyser vos yeux.
3. **Respect de votre vie privée :** **Aucune image ne sort de votre ordinateur**. Tout le calcul se fait en local dans l'application, et la caméra s'éteint automatiquement dès que la pause commence ou que le minuteur est arrêté.
4. **Mode Sans Caméra :** Si vous ne voulez pas utiliser votre caméra, désactivez-la simplement dans l'onglet **Paramètres**. L'application mesurera votre attention intelligemment en se basant sur vos frappes de clavier et vos mouvements de souris !

---

## 🛠️ Option 2 : Pour les développeurs (Lancer depuis le code source)

Si vous souhaitez modifier le code ou exécuter l'application en mode développeur :

1. Installez **Node.js** (version 22 recommandée).
2. Ouvrez un terminal dans le dossier `Studyapp` et installez les dépendances :
   ```bash
   npm install
   ```
3. Lancez l'application en mode développement :
   ```bash
   npm run dev
   ```
4. Pour créer vous-même les fichiers installateurs `.exe` ou `.dmg` prêts à être distribués à vos proches :
   ```bash
   npm run package
   ```
   Les fichiers d'installation prêts pour le public seront générés dans le dossier `/release`.
