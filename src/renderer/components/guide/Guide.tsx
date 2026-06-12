import React, { useState } from 'react';
import guideImg from '../../assets/guide_illustration.png';
import { 
  BookOpen, 
  HelpCircle, 
  Settings, 
  Keyboard, 
  ChevronDown, 
  ChevronUp, 
  Camera, 
  Bell, 
  ShieldCheck,
  Zap,
  Accessibility
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const Guide: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'guide' | 'faq' | 'troubleshoot'>('guide');
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);

  const faqData: FAQItem[] = [
    {
      question: "Comment fonctionne le moteur d'adaptation IA ?",
      answer: "StudyFlow analyse votre concentration durant les sessions de travail. Si votre score moyen est supérieur à 85% à la fin du cycle, la durée de la prochaine session augmente de 5 minutes (jusqu'au maximum défini). Si votre score descend sous 60%, la durée diminue et la pause est allongée pour vous aider à vous reposer."
    },
    {
      question: "Mes flux vidéos caméra sont-ils sécurisés ?",
      answer: "Absolument. Aucune image ou vidéo n'est enregistrée sur le disque ni envoyée sur internet. La détection des visages s'effectue localement à 100% dans l'application via les API de votre ordinateur. Les données analytiques de score restent également stockées localement dans votre base de données SQLite."
    },
    {
      question: "Pourquoi ma concentration est mesurée même sans caméra ?",
      answer: "Si vous désactivez l'analyse par webcam, StudyFlow passe en 'Mode activité'. Il mesure le temps d'inactivité global du système (clavier/souris). Si vous n'utilisez pas votre ordinateur pendant plus de 15 secondes, le système considère que vous êtes distrait, et absent après 45 secondes."
    },
    {
      question: "Comment réinitialiser mes statistiques ?",
      answer: "Vous pouvez supprimer des sessions individuelles depuis le tableau de bord à l'aide de l'icône de corbeille, ou sauvegarder/exporter vos données au format JSON dans les paramètres."
    }
  ];

  const shortcuts = [
    { keys: "Espace", desc: "Lancer ou suspendre le minuteur (hors champs de saisie)" },
    { keys: "Ctrl + Shift + R", desc: "Réinitialiser le minuteur et la session courante" },
    { keys: "Ctrl + Shift + X", desc: "Passer à la session suivante (interrompt le cycle)" },
    { keys: "Ctrl + Shift + N", desc: "Activer ou désactiver les notifications de bureau" },
    { keys: "Ctrl + Shift + H", desc: "Activer ou désactiver le mode contraste élevé" },
    { keys: "Ctrl + Shift + V", desc: "Activer ou désactiver la synthèse vocale (aide malvoyants)" },
    { keys: "Ctrl + Shift + D", desc: "Aller à l'onglet Tableau de bord" },
    { keys: "Ctrl + Shift + T", desc: "Aller à l'onglet Liste des tâches" },
    { keys: "Ctrl + Shift + A", desc: "Aller à l'onglet Statistiques Analytiques" },
    { keys: "Ctrl + Shift + G", desc: "Aller à l'onglet Guide utilisateur et FAQ" },
    { keys: "Ctrl + Shift + S", desc: "Aller à l'onglet Paramètres de configuration" },
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-black/5 dark:border-white/5 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans text-slate-800 dark:text-white">Centre d'aide & Documentation</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Tout savoir sur l'utilisation et la configuration de StudyFlow.</p>
        </div>

        {/* Sub-tabs Selector */}
        <div className="flex gap-1 p-1 bg-black/5 dark:bg-slate-900 border border-black/5 dark:border-white/5 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('guide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeSubTab === 'guide'
                ? 'bg-brand-purple/20 border border-brand-purple/30 text-brand-purple dark:text-brand-purple-glow shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen size={13} />
            <span>Guide Utilisateur</span>
          </button>
          <button
            onClick={() => setActiveSubTab('faq')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeSubTab === 'faq'
                ? 'bg-brand-blue/20 border border-brand-blue/30 text-brand-blue dark:text-brand-blue-glow shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <HelpCircle size={13} />
            <span>FAQ</span>
          </button>
          <button
            onClick={() => setActiveSubTab('troubleshoot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              activeSubTab === 'troubleshoot'
                ? 'bg-brand-cyan/20 border border-brand-cyan/30 text-brand-cyan dark:text-brand-cyan-glow shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Settings size={13} />
            <span>Dépannage</span>
          </button>
        </div>
      </div>

      {/* View switcher */}
      <div className="flex-1 overflow-y-auto">
        {activeSubTab === 'guide' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start animate-fadeIn">
            
            {/* Illustrated Section */}
            <div className="glass-panel rounded-2xl p-5 border border-black/5 dark:border-white/5 space-y-4">
              <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-2 text-brand-purple">
                <BookOpen size={16} />
                <span className="text-xs font-bold uppercase font-sans">Fonctionnement & Ergonomie</span>
              </div>
              
              <div className="rounded-xl overflow-hidden bg-slate-950/20 border border-black/5 dark:border-white/5 p-4 flex items-center justify-center">
                <img 
                  src={guideImg} 
                  alt="Illustration du Guide d'Utilisation" 
                  className="max-h-64 object-contain rounded-lg shadow-md"
                />
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                <p>
                  <strong>StudyFlow</strong> est conçu pour vous aider à maintenir une concentration optimale en s'adaptant à vos besoins physiologiques.
                </p>
                <ul className="list-disc pl-4 space-y-2">
                  <li>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Caméra Inteligente :</span> L'IA évalue les distracteurs (regard vers l'extérieur, micro-mouvements de fatigue, absence).
                  </li>
                  <li>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Suivi d'Activité Hybride :</span> Si vous êtes en arrière-plan et tapez activement du texte, le moteur annule le statut absent pour vous compter comme concentré.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Accessibilité Intégrée :</span> Synthèse vocale complète en français et mode contraste élevé disponibles via les raccourcis.
                  </li>
                </ul>
              </div>
            </div>

            {/* Keyboard Shortcuts Section */}
            <div className="glass-panel rounded-2xl p-5 border border-black/5 dark:border-white/5 space-y-4">
              <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-2 text-brand-blue">
                <Keyboard size={16} />
                <span className="text-xs font-bold uppercase font-sans">Commandes Clavier Complètes</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black/5 dark:border-white/5 text-[10px] text-slate-500 uppercase tracking-wider">
                      <th className="py-2">Raccourci</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5 text-[11px] text-slate-600 dark:text-slate-400">
                    {shortcuts.map((shortcut, idx) => (
                      <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <td className="py-2 pr-4 font-semibold">
                          <kbd className="font-mono px-2 py-0.5 bg-black/10 dark:bg-slate-950/40 rounded border border-black/10 dark:border-white/10 text-[10px] text-slate-800 dark:text-white inline-block shadow-sm">
                            {shortcut.keys}
                          </kbd>
                        </td>
                        <td className="py-2 text-slate-700 dark:text-slate-350">{shortcut.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {activeSubTab === 'faq' && (
          <div className="max-w-3xl mx-auto space-y-3 animate-fadeIn">
            {faqData.map((faq, index) => {
              const isOpen = openFAQIndex === index;
              return (
                <div 
                  key={index}
                  className="glass-card border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between p-5 text-left font-sans font-bold text-xs text-slate-850 dark:text-white cursor-pointer select-none"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? <ChevronUp size={16} className="text-brand-purple" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </button>
                  
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-black/5 dark:border-white/5 pt-3 animate-fadeIn">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeSubTab === 'troubleshoot' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch animate-fadeIn">
            
            {/* Camera issue */}
            <div className="glass-panel rounded-2xl p-5 border border-black/5 dark:border-white/5 space-y-4">
              <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-2 text-rose-500">
                <Camera size={16} />
                <span className="text-xs font-bold uppercase font-sans">La caméra ne s'active pas ou lag</span>
              </div>
              <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                <p><strong>Causes courantes :</strong></p>
                <ul className="list-decimal pl-4 space-y-2">
                  <li>La caméra est utilisée par une autre application (Teams, Zoom, Discord). Fermez ces applications et réessayez.</li>
                  <li>Les permissions d'accès à la caméra pour l'application StudyFlow ne sont pas activées dans les paramètres système de Windows.</li>
                  <li>Le pilote de votre webcam n'est pas à jour.</li>
                </ul>
                <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-xl mt-3 text-[10px] text-rose-600 dark:text-rose-450 font-medium">
                  💡 <strong>Astuce :</strong> Désactivez l'analyse par webcam dans les paramètres ; StudyFlow basculera sur le 'Mode activité' pour mesurer votre temps d'inactivité global.
                </div>
              </div>
            </div>

            {/* Notifications issue */}
            <div className="glass-panel rounded-2xl p-5 border border-black/5 dark:border-white/5 space-y-4">
              <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-2 text-amber-500">
                <Bell size={16} />
                <span className="text-xs font-bold uppercase font-sans">Aucune notification ne s'affiche</span>
              </div>
              <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                <p><strong>Causes courantes :</strong></p>
                <ul className="list-decimal pl-4 space-y-2">
                  <li>L'interrupteur global de notification dans StudyFlow est désactivé (vérifiez le commutateur sur le tableau de bord ou dans les paramètres).</li>
                  <li>L'Assistant de concentration Windows (Focus Assist) est actif et masque les notifications. Réglez Focus Assist sur « Désactivé » ou ajoutez StudyFlow à la liste des applications prioritaires.</li>
                  <li>L'application s'est lancée sans privilèges adéquats pour enregistrer son identifiant Windows Application User Model ID.</li>
                </ul>
                <div className="p-3 bg-brand-cyan/5 border border-brand-cyan/20 rounded-xl mt-3 text-[10px] text-brand-cyan font-medium">
                  💡 <strong>Astuce :</strong> Testez en faisant clignoter le minuteur (par exemple à 1 minute de travail) pour valider la notification de fin de cycle.
                </div>
              </div>
            </div>

            {/* Privacy Check */}
            <div className="md:col-span-2 glass-panel rounded-2xl p-5 border border-black/5 dark:border-white/5 flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-500">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">Confidentialité 100% Locale</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Aucune donnée image n'est sauvegardée sur l'ordinateur ni envoyée vers des serveurs.</p>
                </div>
              </div>
              <div className="p-3 bg-brand-purple/5 border border-brand-purple/20 rounded-xl text-[10px] text-slate-600 dark:text-slate-400 leading-normal max-w-md">
                <strong>Modèle IA local :</strong> StudyFlow utilise des algorithmes TensorFlow et Shape Detection API hébergés localement pour garantir la souveraineté totale de vos données.
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Guide;
