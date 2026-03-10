/**
 * French translations for MyFridge
 */
export const fr = {
  // App
  appName: 'MonFrigo',
  tagline: 'Suivez vos aliments, réduisez le gaspillage.',

  // Landing
  landing: {
    badge: 'Stop au gaspillage alimentaire',
    title: 'Sachez ce qu\'il y a dans votre frigo.',
    titleHighlight: 'Utilisez-le avant qu\'il n\'expire.',
    description: 'Suivez votre inventaire alimentaire, recevez des alertes d\'expiration et utilisez l\'IA pour ajouter rapidement des articles.',
    cta: 'Commencer gratuitement',
    features: {
      scan: { title: 'Scannez', description: 'Prenez une photo. L\'IA détecte vos articles automatiquement.' },
      expiration: { title: 'Alertes expiration', description: 'Code couleur pour savoir quoi utiliser en premier.' },
      voice: { title: 'Commandes rapides', description: '"Ajoute du lait, expire le 20 mars" - dites-le simplement.' },
    },
  },

  // Setup
  setup: {
    welcome: 'Bienvenue sur MonFrigo',
    whatsYourName: 'Comment vous appelez-vous ?',
    namePlaceholder: 'ex: Angel',
    continue: 'Continuer',
    hey: 'Salut',
    setupFridge: 'Configurez votre frigo',
    createNew: 'Créer un nouveau frigo',
    createNewDesc: 'Commencez et invitez d\'autres personnes plus tard',
    joinExisting: 'Rejoindre avec un code',
    joinExistingDesc: 'Quelqu\'un a partagé un code avec vous',
    nameYourFridge: 'Nommez votre frigo',
    enterCode: 'Entrez le code d\'invitation',
    fridgeNamePlaceholder: 'ex: Cuisine Maison',
    codePlaceholder: 'ex: A3F7K9',
    createFridge: 'Créer le frigo',
    joinFridge: 'Rejoindre le frigo',
    back: '← Retour',
  },

  // Dashboard
  dashboard: {
    loading: 'Chargement de votre frigo...',
    loadingItems: 'Chargement des articles...',
    invite: 'Inviter',
    signOut: 'Déconnexion',
    shareCode: 'Partagez ce code :',
    copyCode: 'Copier le code',
    addItem: 'Ajouter',
  },

  // Products
  products: {
    noItems: 'Aucun article',
    noItemsDesc: 'Ajoutez votre premier article pour commencer à suivre votre frigo.',
    addItem: 'Ajouter un article',
    items: 'article',
    itemsPlural: 'articles',
    in: 'dans',
    searchPlaceholder: 'Rechercher...',
    all: 'Tout',
    fridge: 'Frigo',
    freezer: 'Congélateur',
    pantry: 'Placard',
    noMatch: 'Aucun article trouvé.',
  },

  // Add product
  addProduct: {
    title: 'Ajouter un article',
    editTitle: 'Modifier l\'article',
    name: 'Nom du produit',
    namePlaceholder: 'ex: Lait entier',
    quantity: 'Quantité',
    unit: 'Unité',
    category: 'Catégorie',
    location: 'Emplacement',
    expirationDate: 'Date d\'expiration',
    notes: 'Notes (optionnel)',
    notesPlaceholder: 'ex: Bio, ouvert le...',
    cancel: 'Annuler',
    save: 'Enregistrer',
    add: 'Ajouter',
  },

  // Camera / Scan
  scan: {
    title: 'Ajouter des articles',
    takePhoto: 'Prendre une photo',
    analyzing: 'Analyse en cours...',
    detected: 'Détecté',
    receipt: 'Ticket de caisse',
    singleProduct: 'Produit',
    addAll: 'Tout ajouter',
    addSelected: 'Ajouter la sélection',
    retry: 'Réessayer',
    hint: 'Prenez des photos de vos produits ou tickets',
    error: 'Impossible d\'analyser l\'image. Réessayez.',
    added: 'ajouté(s) au frigo !',
    gallery: 'Galerie',
    processing: 'En cours...',
    processed: 'Traité',
    failed: 'Échec',
    itemsAdded: '{count} article(s) ajouté(s)',
    scanMore: 'Scanner un autre',
    done: 'Terminé',
    continueScan: 'Continuez à scanner pendant le traitement',
  },

  // Add screen options
  addScreen: {
    title: 'Ajouter',
    camera: 'Appareil photo',
    cameraDesc: 'Scannez un produit ou ticket',
    gallery: 'Galerie',
    galleryDesc: 'Sélectionnez des photos',
    manual: 'Manuel',
    manualDesc: 'Remplir les détails',
    ai: 'Parler à l\'IA',
    aiDesc: 'Dites ce que vous ajoutez',
  },

  // Command bar
  command: {
    placeholder: 'Ex: "Ajoute 2L de lait, expire le 20 mars"',
    send: 'Envoyer',
    unknownCommand: 'Je n\'ai pas compris. Essayez : "Ajoute du lait" ou "Le poulet expire le 20 mars"',
    listening: 'Écoute...',
    micError: 'Micro non disponible',
  },

  // Categories
  categories: {
    dairy: 'Produits laitiers',
    meat: 'Viande',
    produce: 'Fruits & Légumes',
    beverages: 'Boissons',
    grains: 'Céréales',
    frozen: 'Surgelés',
    condiments: 'Condiments',
    snacks: 'Snacks',
    other: 'Autre',
  },

  // Units
  units: {
    pcs: 'Pièces',
    lbs: 'Livres',
    oz: 'Onces',
    kg: 'Kilogrammes',
    g: 'Grammes',
    liters: 'Litres',
    ml: 'Millilitres',
    gallons: 'Gallons',
    cups: 'Tasses',
    bags: 'Sacs',
    boxes: 'Boîtes',
    cans: 'Conserves',
    bottles: 'Bouteilles',
  },

  // Locations
  locations: {
    fridge: 'Frigo',
    freezer: 'Congélateur',
    pantry: 'Placard',
  },

  // Expiration
  expiration: {
    noDate: 'Pas de date d\'expiration',
    today: 'Expire aujourd\'hui',
    yesterday: 'Expiré hier',
    daysAgo: 'Expiré il y a {days} jours',
    oneDay: '1 jour restant',
    daysLeft: '{days} jours restants',
  },
  // Profile
  profile: {
    title: 'Mon profil',
    fridgeName: 'Nom du frigo',
    role: 'Rôle',
    roleOwner: 'Propriétaire',
    roleMember: 'Membre',
    inviteCode: 'Code d\'invitation',
    inviteDesc: 'Partagez ce code pour inviter quelqu\'un dans votre frigo',
    signOut: 'Déconnexion',
    back: '← Retour',
    copied: 'Copié !',
  },

  // Product detail
  productDetail: {
    purchaseDate: 'Date d\'achat',
    expirationDate: 'Date d\'expiration',
    category: 'Catégorie',
    location: 'Emplacement',
    quantity: 'Quantité',
    notes: 'Notes',
    noPhoto: 'Pas de photo',
    delete: 'Supprimer',
    edit: 'Modifier',
    confirmDelete: 'Voulez-vous vraiment supprimer cet article ?',
    deleted: 'Article supprimé',
    back: '← Retour',
    saved: 'Enregistré !',
    changePhoto: 'Changer la photo',
    tapToZoom: 'Appuyez pour agrandir',
  },

  // Swipe actions
  swipe: {
    consumed: 'Courses',
    delete: 'Supprimer',
  },

  // Shopping list
  shopping: {
    title: 'Liste de courses',
    empty: 'Aucun article à racheter',
    emptyDesc: 'Les produits terminés apparaîtront ici automatiquement.',
    bought: 'Acheté',
    removeAll: 'Tout effacer',
    checkedItems: '{count} acheté(s)',
    addPlaceholder: 'Ajouter un article...',
    add: 'Ajouter',
  },

  // History
  history: {
    title: 'Historique',
    empty: 'Aucun historique',
    consumed: 'Terminé',
    deleted: 'Supprimé',
    on: 'le',
    today: 'Aujourd\'hui',
    yesterday: 'Hier',
    archiveDesc: 'Historique de vos produits terminés et supprimés.',
  },

  // Scan review
  scanReview: {
    title: 'Vérifier les articles',
    duplicate: 'Déjà dans le frigo — quantité mise à jour',
    confirm: 'Confirmer',
    edit: 'Modifier',
  },

  // AI Verify
  verify: {
    button: 'Vérifier avec l\'IA',
    buttonDesc: 'L\'IA corrige les catégories, emplacements et trouve les doublons',
    analyzing: 'Analyse en cours...',
    noIssues: 'Tout est en ordre !',
    noIssuesDesc: 'Aucune correction nécessaire.',
    corrections: 'Corrections suggérées',
    duplicates: 'Doublons détectés',
    apply: 'Appliquer',
    applyAll: 'Tout appliquer',
    merge: 'Fusionner',
    keepSeparate: 'Garder séparés',
    applied: 'Appliqué !',
    merged: 'Fusionné !',
    location: 'Emplacement',
    category: 'Catégorie',
    from: 'de',
    to: 'vers',
    dismiss: 'Ignorer',
    done: 'Terminé',
    imageIssues: 'Problèmes d\'images',
    removeImage: 'Supprimer image',
    imageRemoved: 'Image supprimée !',
    receiptAsImage: 'L\'image est un ticket de caisse, pas le produit',
    wrongProduct: 'L\'image ne correspond pas au produit',
    unrelatedImage: 'L\'image n\'est pas liée au produit',
  },
} as const;
