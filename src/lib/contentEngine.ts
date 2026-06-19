export interface Commune {
  nom: string;
  slug: string;
  codeInsee: string;
  codePostal: string;
  population: number;
  latitude?: number;
  longitude?: number;
  intercommunalite?: string;
  introText?: string;
  conseilLocal?: string;
  faq?: { q: string; a: string }[];
  marketData?: {
    couvreursRGE: number;
    prixM2Refection: number;
    prixM2Demoussage: number;
    delaiMoyenJours: number;
  };
}

export function getDynamicPrices(commune: Commune) {
  const rPrice = commune.marketData?.prixM2Refection || 135;
  const dPrice = commune.marketData?.prixM2Demoussage || 25;
  
  return {
    refectionCanal: { min: Math.round(rPrice * 0.9), max: Math.round(rPrice * 1.3) },
    refectionMeca: { min: Math.round(rPrice * 0.75), max: Math.round(rPrice * 1.1) },
    demoussageHydro: { min: Math.round(dPrice * 0.8), max: Math.round(dPrice * 1.2) },
    reparationFuite: { min: 350, max: 1200 },
    faitageMl: { min: 40, max: 80 },
    zinguerieMl: { min: 50, max: 90 },
    isolationSarking: { min: 80, max: 150 },
    charpenteM2: { min: 60, max: 120 },
    etancheiteTerrasse: { min: 50, max: 100 }
  };
}

export function generateCommuneContent(commune: Commune, pageType: 'refection' | 'demoussage' | 'artisan') {
  const rPrice = commune.marketData?.prixM2Refection || 135;
  const dPrice = commune.marketData?.prixM2Demoussage || 25;
  const rge = commune.marketData?.couvreursRGE || 3;
  const delays = commune.marketData?.delaiMoyenJours || 15;

  let title = "";
  let introParagraph = "";
  let typeLabel = "";

  if (pageType === 'refection') {
    typeLabel = "réfection de toiture";
    title = `Réfection de Toiture à ${commune.nom} (${commune.codePostal}) — Couvreur RGE`;
    introParagraph = commune.introText || `Votre toiture à ${commune.nom} a besoin d'une réfection ? Nos couvreurs RGE du 13 rénovent votre toiture entre ${Math.round(rPrice * 0.9)}€ et ${Math.round(rPrice * 1.3)}€ TTC au m², zinguerie et isolation sous toiture incluses.`;
  } else if (pageType === 'demoussage') {
    typeLabel = "démoussage de toiture";
    title = `Démoussage & Nettoyage de Toiture à ${commune.nom} (${commune.codePostal})`;
    introParagraph = `Le climat méditerranéen sec à ${commune.nom} favorise le développement de mousses et lichens noirs poreux sur vos tuiles. Un démoussage avec traitement algicide et hydrofuge protecteur coûte en moyenne de ${Math.round(dPrice * 0.8)}€ à ${Math.round(dPrice * 1.2)}€ TTC par m² pour pérenniser vos tuiles canal.`;
  } else {
    typeLabel = "couvreur certifié RGE";
    title = `Trouver un Couvreur RGE à ${commune.nom} (${commune.codePostal}) — Devis Gratuits`;
    introParagraph = `Vous recherchez un couvreur-zingueur de confiance certifié RGE à ${commune.nom} ? Il y a actuellement ${rge} artisans qualifiés RGE actifs sur votre secteur. Obtenez 3 devis comparatifs gratuits pour vos travaux de couverture et d'isolation de toiture.`;
  }

  // FAQ Items mapping
  const faqItems = (commune.faq || []).map(f => ({
    question: f.q,
    answer: f.a
  }));

  // Pose steps
  const poseSteps = [
    { title: "Préparation & Échafaudage", description: "Mise en sécurité du chantier à " + commune.nom + ", installation des structures de protection et dépose soignée des anciennes tuiles ou éléments endommagés." },
    { title: "Contrôle Charpente & Pose Écran HPV", description: "Vérification des pannes et chevrons en bois, puis pose d'un écran sous-toiture HPV (Hautement Perméable à la Vapeur) pour garantir l'étanchéité à l'eau." },
    { title: "Liteonnage & Calage des tuiles", description: "Clouage des nouveaux liteaux et pose des tuiles canal (courant et couvert) ou tuiles mécaniques selon les cotes de la toiture." },
    { title: "Fixation & Scellement (DTU 40.21)", description: "Fixation mécanique de toutes les tuiles de rive et faîtage par crochetage en acier inox pour assurer la résistance au Mistral fort." },
    { title: "Zinguerie & Nettoyage final", description: "Raccordement des solins, gouttières en zinc et nettoyage complet du chantier avec évacuation des déchets en déchetterie agréée du 13." }
  ];

  const guideLinks = [
    { href: "/guides/prix-refection-toiture-marseille-13-2026/", label: "Tarifs Toiture 2026", desc: "Quel budget prévoir au m² pour votre toit ?" },
    { href: "/guides/tuiles-canal-provencales-guide-pose-bouches-du-rhone/", label: "Guide Tuiles Provençales", desc: "La pose traditionnelle des tuiles canal de courant et couvert." },
    { href: "/guides/mistral-toiture-securiser-tuiles-rafales-provence/", label: "Guide Anti-Mistral", desc: "Comment protéger et bloquer les tuiles contre le vent fort." }
  ];

  return {
    title,
    introParagraph,
    tableIntro: `Grille de tarifs indicatifs constatés pour les travaux de ${typeLabel} à ${commune.nom} en 2026. Ces prix varient selon la pente et l'accès.`,
    marketDataText: `Secteur ${commune.nom} (${commune.codePostal}) : ${rge} couvreurs partenaires RGE disponibles sous ${delays} jours.`,
    realEstateInsight: `Faire rénover sa toiture à ${commune.nom} valorise votre patrimoine et améliore le DPE de votre logement. En effet, 30% des déperditions énergétiques s'effectuent par le toit.`,
    abfRegulations: `Si votre maison à ${commune.nom} se trouve dans le périmètre d'un monument historique ou d'une zone protégée par les Bâtiments de France, vous devez utiliser des tuiles canal en terre cuite de teinte agréée ou vieillies.`,
    climateContext: `La commune de ${commune.nom} subit régulièrement les assauts du Mistral et de violents épisodes pluvieux méditerranéens. Une attention particulière doit être portée sur la fixation des tuiles (crochetage obligatoire) et l'étanchéité des solins.`,
    poseSteps,
    diagnosticEnergetique: `Un toit non isolé laisse échapper la chaleur en hiver et surchauffe en été. L'isolation thermique sous toiture par l'extérieur (Sarking) permet de réaliser jusqu'à 30% d'économies de chauffage.`,
    vitrageRecommendation: commune.conseilLocal || `Pour votre toiture à ${commune.nom}, privilégiez des matériaux de qualité professionnelle certifiés NF et une pose assurée par un couvreur certifié RGE pour bénéficier des subventions nationales.`,
    calendrierRenovation: `Le remplacement complet d'une toiture à ${commune.nom} prend en moyenne de 5 à 10 jours de travail effectif selon la météo.`,
    faqItems,
    sourcesCitation: "Données de marché estimées pour l'année 2026 issues des rapports de l'ANAH et des fédérations du bâtiment du 13.",
    conseilAides: `Les travaux d'isolation thermique de toiture (sarking) réalisés par un artisan certifié RGE ouvrent droit à des subventions nationales (MaPrimeRénov' et primes CEE).`,
    localAgencyName: `l'Espace Conseil France Rénov' des Bouches-du-Rhône`,
    localAgencyDetail: `le service public d'accompagnement à la rénovation énergétique du 13. Un conseiller France Rénov' vous aide gratuitement dans vos démarches de subventions`,
    guideLinks,
    expertTip: `Faites réaliser un nettoyage annuel de vos gouttières pour éviter l'accumulation d'aiguilles de pin et les risques de débordements d'eau de pluie sous votre toiture.`,
    savingsEstimate: `L'isolation thermique sous toiture permet de baisser de 3°C à 5°C la température sous combles en plein été sous le soleil provençal.`,
    localProfileParagraph: `Située au sein de ${commune.intercommunalite}, la commune de ${commune.nom} présente une dynamique immobilière soutenue. La préservation et l'étanchéité des toitures en tuiles canal constituent une priorité locale pour protéger le bâti traditionnel provençal.`,
    housingTypologyInsight: `Le parc immobilier à ${commune.nom} se caractérise par des maisons individuelles de style provençal (mas, bastides) et des résidences à toits plats ou à faible pente qui nécessitent des contrôles réguliers d'étanchéité.`,
    energyProfileText: `La plupart des habitations de ${commune.nom} ont été construites avant 1990 et nécessitent des travaux de rénovation énergétique au niveau de la toiture pour améliorer leur isolation hivernale et estivale.`
  };
}
