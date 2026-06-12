export interface TaskEstimate {
  difficulty: 'Facile' | 'Moyen' | 'Difficile';
  pomodoros: number;
  estimatedHours: number;
}

export function estimateTaskPomodoros(title: string, description: string): TaskEstimate {
  const text = `${title.toLowerCase()} ${description.toLowerCase()}`;
  
  // Keyword category weight tables
  const complexKeywords = [
    'coder', 'développer', 'implémenter', 'refactorer', 'debugger', 'architecture', 'optimiser',
    'base de données', 'migrations', 'api', 'backend', 'frontend', 'configuration', 'deploy',
    'docker', 'kubernetes', 'tests unitaires', 'integration', 'sécurité', 'compiler'
  ];
  
  const mediumKeywords = [
    'rédiger', 'rédaction', 'écrire', 'rapport', 'conception', 'maquette', 'design', 'figma',
    'présentation', 'analyser', 'analyse', 'recherche', 'apprendre', 'réviser', 'synthèse',
    'réunion', 'review', 'corriger', 'mise à jour', 'tutoriel'
  ];
  
  const simpleKeywords = [
    'lire', 'lecture', 'trier', 'mail', 'email', 'téléphone', 'appel', 'organiser', 'planning',
    'classement', 'sauvegarde', 'vérifier', 'imprimer', 'nettoyer'
  ];

  let score = 0;
  
  // Count matches
  complexKeywords.forEach(k => {
    if (text.includes(k)) score += 3;
  });
  
  mediumKeywords.forEach(k => {
    if (text.includes(k)) score += 2;
  });

  simpleKeywords.forEach(k => {
    if (text.includes(k)) score += 1;
  });

  // Base scoring on description length
  if (description.length > 200) {
    score += 2;
  } else if (description.length > 50) {
    score += 1;
  }

  // Determine difficulty and pomodoro count
  let difficulty: 'Facile' | 'Moyen' | 'Difficile' = 'Moyen';
  let pomodoros = 2;

  if (score <= 2) {
    difficulty = 'Facile';
    pomodoros = 1;
  } else if (score <= 5) {
    difficulty = 'Facile';
    pomodoros = 2;
  } else if (score <= 9) {
    difficulty = 'Moyen';
    pomodoros = 3;
  } else if (score <= 13) {
    difficulty = 'Moyen';
    pomodoros = 4;
  } else if (score <= 18) {
    difficulty = 'Difficile';
    pomodoros = 6;
  } else {
    difficulty = 'Difficile';
    pomodoros = 8;
  }

  // Estimate total hours based on 25 min work session + 5 min break = 30m total cycle (0.5 hour per Pomodoro)
  const estimatedHours = Number((pomodoros * 0.5).toFixed(1));

  return {
    difficulty,
    pomodoros,
    estimatedHours
  };
}
