export interface FaqItem {
  category: string;
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  { category: 'Compte', question: 'L’inscription est-elle payante ?', answer: 'Non. La création du compte est gratuite. Vous ne payez que les commandes que vous passez, à partir de votre solde.' },
  { category: 'Compte', question: 'Ai-je besoin de donner mon mot de passe de réseau social ?', answer: 'Non, jamais. Seul le lien public du profil ou de la publication est demandé. Ne partagez votre mot de passe avec personne.' },
  { category: 'Tarifs', question: 'Comment lire le prix « par 1000 » ?', answer: 'Chaque service affiche un prix en MAD pour 1000 unités. Pour 500 unités d’un service à 42 MAD / 1000, le montant est de 21 MAD. Le devis exact est affiché avant de valider.' },
  { category: 'Tarifs', question: 'Les prix peuvent-ils changer ?', answer: 'Oui. Les tarifs du catalogue peuvent évoluer. Le prix appliqué est celui affiché dans le devis au moment de la commande.' },
  { category: 'Commandes', question: 'Combien de temps prend une livraison ?', answer: 'Certains services indiquent un délai de démarrage estimé dans leur description. Il s’agit d’une estimation, pas d’un engagement : la vitesse réelle dépend de la plateforme et du volume.' },
  { category: 'Commandes', question: 'Que signifie le « compteur de départ » ?', answer: 'C’est le nombre relevé sur votre profil ou publication au démarrage de la commande. Il sert de point de référence pour suivre la progression.' },
  { category: 'Commandes', question: 'Pourquoi la progression n’est-elle pas en temps réel ?', answer: 'Les chiffres sont mis à jour lors de chaque synchronisation. La date de dernière synchronisation est affichée sur chaque commande et vous pouvez demander une actualisation.' },
  { category: 'Commandes', question: 'Que se passe-t-il si une commande est partielle ?', answer: 'Une commande partielle signifie qu’une partie seulement a été livrée. Le détail livrés / restants reste visible dans votre suivi. Contactez le support pour toute question.' },
  { category: 'Paiement', question: 'Comment recharger mon solde ?', answer: 'Depuis « Ajouter des fonds », choisissez un moyen de paiement, indiquez le montant et joignez votre justificatif. Le solde est crédité après vérification par l’équipe.' },
  { category: 'Paiement', question: 'Mon dépôt a été refusé, que faire ?', answer: 'Le motif du refus est affiché dans l’historique des dépôts. Vous pouvez soumettre un nouveau justificatif ou ouvrir un ticket de support.' },
  { category: 'Revendeurs', question: 'Proposez-vous une API ?', answer: 'Oui. Une documentation API revendeur est disponible dans l’espace client, avec une clé personnelle à garder confidentielle.' }
];

