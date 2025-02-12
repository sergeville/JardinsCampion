export const translations = {
  en: {
    title: 'Jardins du Lac Campion\nLogo Selection',
    mobileMessage: 'Welcome! Tap on a logo to vote.',
    selectThis: 'Select this',
    votes: 'Votes',
    recentVotes: 'Recent Votes',
    votedFor: 'voted for Logo #',
    enterName: 'Please enter your name:',
    nameLabel: 'Name:',
    namePlaceholder: 'Your name',
    submit: 'Submit Vote',
    cancel: 'Cancel',
    alreadyVoted: (name: string, logo: string) =>
      `${name}, you have already voted for Logo #${logo}!`,
    cannotVoteOwn: 'Sorry, you cannot vote for your own logo!',
    voteRecorded: (name: string, logo: string) =>
      `Thank you ${name}! Your vote for Logo #${logo} has been recorded.`,
    voteChanged: (name: string, oldLogo: string, newLogo: string) =>
      `Thank you ${name}! Your vote has been changed from Logo #${oldLogo} to Logo #${newLogo}.`,
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    noVotesYet: 'No votes yet',
  },
  fr: {
    title: 'Jardins du Lac Campion\nVoté pour le plus beau logo',
    mobileMessage: 'Bienvenue! Tapez sur un logo pour voter.',
    selectThis: 'Sélectionner',
    votes: 'Votes',
    recentVotes: 'Votes Récents',
    votedFor: 'a voté pour le Logo #',
    enterName: 'Veuillez entrer votre nom:',
    nameLabel: 'Nom:',
    namePlaceholder: 'Votre nom',
    submit: 'Soumettre le Vote',
    cancel: 'Annuler',
    alreadyVoted: (name: string, logo: string) =>
      `${name}, vous avez déjà voté pour le Logo #${logo}!`,
    cannotVoteOwn: 'Désolé, vous ne pouvez pas voter pour votre propre logo!',
    voteRecorded: (name: string, logo: string) =>
      `Merci ${name}! Votre vote pour le Logo #${logo} a été enregistré.`,
    voteChanged: (name: string, oldLogo: string, newLogo: string) =>
      `Merci ${name}! Votre vote a été changé du Logo #${oldLogo} au Logo #${newLogo}.`,
    darkMode: 'Mode Sombre',
    lightMode: 'Mode Clair',
    noVotesYet: 'Aucun vote pour le moment',
  },
} as const;
