import { Session } from '../../main/db';

export function generateFocusRecommendations(
  sessions: Session[], 
  currentFocusScore: number,
  mode: 'work' | 'break'
): string[] {
  const recommendations: string[] = [];

  // 1. Current session advice
  if (mode === 'work') {
    if (currentFocusScore >= 85) {
      recommendations.push(
        "🚀 État de Flow : Votre niveau d'attention est exceptionnel. Profitez de ce pic d'énergie pour aborder vos tâches de programmation ou d'écriture complexes."
      );
    } else if (currentFocusScore < 60) {
      recommendations.push(
        "☕ Signal de Fatigue : Votre concentration fléchit. Pensez à relâcher la pression, buvez un verre d'eau et effectuez quelques étirements légers."
      );
    } else {
      recommendations.push(
        "🎯 Focus Stable : Vous êtes sur la bonne voie. Restez focalisé sur une seule tâche à la fois et limitez le multitâche."
      );
    }
  } else {
    recommendations.push(
      "🧘 Règle des 20-20-20 : Pendant cette pause, regardez à 20 pieds (6 mètres) pendant 20 secondes pour détendre vos muscles oculaires."
    );
    recommendations.push(
      "🔋 Déconnexion active : Évitez de regarder votre téléphone ou de changer d'onglet. Laissez votre cerveau se reposer complètement."
    );
  }

  // 2. Trend analysis based on historical session records
  const completedWorkSessions = sessions.filter(s => s.type === 'work' && !s.interrupted);
  
  if (completedWorkSessions.length >= 3) {
    const recentScores = completedWorkSessions.slice(0, 3).map(s => s.focusScore);
    const isDeclining = recentScores[0] < recentScores[1] && recentScores[1] < recentScores[2];
    
    if (isDeclining) {
      recommendations.push(
        "⚠️ Tendance Fatigue : Vos scores de concentration diminuent sur les 3 dernières sessions. Nous vous suggérons d'augmenter le temps de votre prochaine pause."
      );
    }

    // Peak hours calculation
    const hourScores: Record<number, { sum: number; count: number }> = {};
    completedWorkSessions.forEach(s => {
      const date = new Date(s.startTime);
      const hour = date.getHours();
      if (!hourScores[hour]) {
        hourScores[hour] = { sum: 0, count: 0 };
      }
      hourScores[hour].sum += s.focusScore;
      hourScores[hour].count += 1;
    });

    let peakHour = -1;
    let maxAvg = 0;
    Object.entries(hourScores).forEach(([hour, data]) => {
      const avg = data.sum / data.count;
      if (avg > maxAvg) {
        maxAvg = avg;
        peakHour = parseInt(hour, 10);
      }
    });

    if (peakHour !== -1) {
      recommendations.push(
        `📈 Pic de Productivité : Vos données locales indiquent que vous êtes le plus performant vers ${peakHour}h. Planifiez vos sessions les plus exigeantes à ce moment.`
      );
    }
  } else {
    // Default helpful prompts
    recommendations.push(
      "💡 Astuce : Le mode sans caméra s'active automatiquement si la webcam est occupée ou coupée. Il analyse vos saisies et fenêtres."
    );
    recommendations.push(
      "⚙️ Personnalisation : Réglez les limites minimales et maximales du Pomodoro dans l'onglet Paramètres pour calibrer l'algorithme."
    );
  }

  return recommendations;
}
