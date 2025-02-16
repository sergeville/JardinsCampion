export const translations = {
  en: {
    title: 'Jardins du Lac Campion\nLogo Selection',
    mobileMessage: 'Welcome! Tap on a logo to vote.',
    selectThis: 'Select this',
    votes: 'Votes',
    recentVotes: 'Recent Votes',
    votedFor: 'voted for Logo #',
    selectUser: 'Select who is voting',
    selectUserRequired: 'Please select who is voting',
    enterName: 'Please enter your name:',
    nameLabel: 'Name:',
    namePlaceholder: 'Your name',
    nameRequired: 'Please enter your name',
    submit: 'Submit Vote',
    cancel: 'Cancel',
    loginRequired: 'Please log in to vote',
    alreadyVoted: (name: string, logo: string) => `${name} has already voted for Logo #${logo}!`,
    cannotVoteOwn: 'Sorry, you cannot vote for your own logo!',
    voteRecorded: (name: string, logo: string) =>
      `Thank you ${name}! Your vote for Logo #${logo} has been recorded.`,
    voteChanged: (name: string, oldLogo: string, newLogo: string) =>
      `Thank you ${name}! Your vote has been changed from Logo #${oldLogo} to Logo #${newLogo}.`,
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    noVotesYet: 'No votes yet',
    voteFailed: 'Vote failed. Please try again.',
    voteConflictMessage: (name: string, originalVote: string, newVote: string) =>
      `${name} has already voted for Logo #${originalVote}. Would you like to change your vote to Logo #${newVote}?`,
    failedToLoadUsers: 'Failed to load users. Please try again.',
  },
  fr: {
    title: 'Jardins du Lac Campion\nVoté pour le plus beau logo',
    mobileMessage: 'Bienvenue! Tapez sur un logo pour voter.',
    selectThis: 'Sélectionner',
    votes: 'Votes',
    recentVotes: 'Votes Récents',
    votedFor: 'a voté pour le Logo #',
    selectUser: 'Sélectionnez qui vote',
    selectUserRequired: 'Veuillez sélectionner qui vote',
    enterName: 'Veuillez entrer votre nom:',
    nameLabel: 'Nom:',
    namePlaceholder: 'Votre nom',
    nameRequired: 'Veuillez entrer votre nom',
    submit: 'Soumettre le Vote',
    cancel: 'Annuler',
    loginRequired: 'Veuillez vous connecter pour voter',
    alreadyVoted: (name: string, logo: string) => `${name} a déjà voté pour le Logo #${logo}!`,
    cannotVoteOwn: 'Désolé, vous ne pouvez pas voter pour votre propre logo!',
    voteRecorded: (name: string, logo: string) =>
      `Merci ${name}! Votre vote pour le Logo #${logo} a été enregistré.`,
    voteChanged: (name: string, oldLogo: string, newLogo: string) =>
      `Merci ${name}! Votre vote a été changé du Logo #${oldLogo} au Logo #${newLogo}.`,
    darkMode: 'Mode Sombre',
    lightMode: 'Mode Clair',
    noVotesYet: 'Aucun vote pour le moment',
    voteFailed: 'Le vote a échoué. Veuillez réessayer.',
    voteConflictMessage: (name: string, originalVote: string, newVote: string) =>
      `${name} a déjà voté pour le Logo #${originalVote}. Voulez-vous changer votre vote pour le Logo #${newVote}?`,
    failedToLoadUsers: 'Échec du chargement des utilisateurs. Veuillez réessayer.',
  },
} as const;
