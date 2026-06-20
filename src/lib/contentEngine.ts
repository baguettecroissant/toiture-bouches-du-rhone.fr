import communes from '../data/communes.json';
import { getSmartNearbyCommunes } from './geoLinks';

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

// Deterministic hashing helper to select variant consistently per commune slug
function getStringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function selectVariant(slug: string, key: string, variants: string[]): string {
  const hash = getStringHash(slug + "-" + key);
  return variants[hash % variants.length];
}

export function generateCommuneContent(commune: Commune, pageType: 'refection' | 'demoussage' | 'artisan') {
  const rPrice = commune.marketData?.prixM2Refection || 135;
  const dPrice = commune.marketData?.prixM2Demoussage || 25;
  const minRPrice = Math.round(rPrice * 0.9);
  const maxRPrice = Math.round(rPrice * 1.3);
  const minDPrice = Math.round(dPrice * 0.8);
  const maxDPrice = Math.round(dPrice * 1.2);
  const rge = commune.marketData?.couvreursRGE || 3;
  const delays = commune.marketData?.delaiMoyenJours || 15;

  const slug = commune.slug;

  // 1. Geographic Classification (Coastal, Camargue/West, Inland/Mountain)
  const lat = commune.latitude || 43.5;
  const lon = commune.longitude || 5.2;
  const pop = commune.population || 5000;
  
  let geoZone: 'coastal' | 'camargue' | 'inland' = 'inland';
  if (lon < 4.9) {
    geoZone = 'camargue';
  } else if (lat < 43.37) {
    geoZone = 'coastal';
  }

  // 2. City Density Classification
  const density: 'city' | 'village' = pop > 30000 ? 'city' : 'village';

  // 3. Smart local neighbor communes (dynamic semantic internal linking)
  const nearby = getSmartNearbyCommunes(slug, communes as any[], 3, 0);
  const nearbyNames = nearby.map(n => n.nom).join(', ');

  // --- Dynamic text spinning pools ---

  // Title spinning
  let title = "";
  if (pageType === 'refection') {
    title = selectVariant(slug, 'title_refection', [
      `Réfection de Toiture à ${commune.nom} (${commune.codePostal}) — Couvreur RGE`,
      `Rénovation & Remplacement de Toiture à ${commune.nom} (13)`,
      `Couvreur à ${commune.nom} : Réfection & Travaux de Toiture RGE`
    ]);
  } else if (pageType === 'demoussage') {
    title = selectVariant(slug, 'title_demoussage', [
      `Démoussage & Nettoyage de Toiture à ${commune.nom} (${commune.codePostal})`,
      `Nettoyage de Toiture & Traitement Hydrofuge à ${commune.nom}`,
      `Démoussage de Tuiles à ${commune.nom} : Prix & Devis de Nettoyage`
    ]);
  } else {
    title = selectVariant(slug, 'title_artisan', [
      `Trouver un Couvreur RGE à ${commune.nom} (${commune.codePostal}) — Devis Gratuits`,
      `Artisan Couvreur à ${commune.nom} : Devis Rénovation de Toiture RGE`,
      `Meilleurs Couvreurs de ${commune.nom} (13) : Comparez 3 Tarifs 2026`
    ]);
  }

  // Intro Paragraph spinning
  let introParagraph = "";
  if (pageType === 'refection') {
    introParagraph = selectVariant(slug, 'intro_refection', [
      `Votre toiture à ${commune.nom} présente des signes de fatigue ou d'infiltration ? Nos maîtres couvreurs partenaires certifiés RGE interviennent pour la réfection complète ou partielle de votre couverture en tuiles canal provençales. Bénéficiez d'une pose soignée aux normes DTU, avec un coût moyen estimé entre ${minRPrice}€ et ${maxRPrice}€ le m² incluant la zinguerie neuve.`,
      `Envisager la réfection de son toit à ${commune.nom} exige l'intervention d'un couvreur-zingueur qualifié RGE. Spécialisés dans la rénovation du bâti provençal, nos artisans partenaires prennent en main l'étanchéité, le liteonnage et la zinguerie complète. Comptez environ ${minRPrice}€ à ${maxRPrice}€ par m² pour des travaux pérennes garantis par assurance décennale.`,
      `Pour préserver la valeur de votre patrimoine immobilier à ${commune.nom}, une réfection de toiture performante s'impose. Nos équipes locales réalisent la pose de tuiles canal ou mécaniques de qualité supérieure. Les tarifs de réfection constatés sur votre secteur oscillent entre ${minRPrice}€ et ${maxRPrice}€ TTC au m², éligibles aux aides MaPrimeRénov' pour l'isolation.`
    ]);
  } else if (pageType === 'demoussage') {
    introParagraph = selectVariant(slug, 'intro_demoussage', [
      `L'apparition de mousses, de lichens noirs ou de traces de pollution sur vos tuiles à ${commune.nom} altère gravement leur imperméabilité. Un démoussage complet combiné à un traitement fongicide et hydrofuge protecteur redonne de l'éclat et de la force à votre toit. Pour ce type de nettoyage en profondeur dans les Bouches-du-Rhône, prévoyez de ${minDPrice}€ à ${maxDPrice}€ par m².`,
      `À ${commune.nom}, le soleil méditerranéen intense conjugué aux précipitations d'automne favorise la porosité des tuiles canal. Notre nettoyage de toiture professionnel (sans chlore ni haute pression agressive) élimine les germes incrustés pour un tarif de ${minDPrice}€ à ${maxDPrice}€ TTC au m², assurant une protection hydrofuge durable sur plusieurs années.`,
      `Protégez votre habitation des infiltrations d'eau à ${commune.nom} grâce à un démoussage de toiture régulier. Nos couvreurs locaux appliquent des traitements autonettoyants de surface respectueux de la terre cuite. Comptez un budget moyen de ${minDPrice}€ à ${maxDPrice}€ le m² selon la pente et le degré d'encrassement du toit.`
    ]);
  } else {
    introParagraph = selectVariant(slug, 'intro_artisan', [
      `Vous recherchez un artisan couvreur de confiance certifié RGE à ${commune.nom} ou ses environs ? Nous vous connectons avec un réseau local de professionnels qualifiés Qualibat. Obtenez et comparez gratuitement jusqu'à 3 devis détaillés pour vos travaux de couverture et profitez des aides d'État à la rénovation énergétique.`,
      `Trouver un couvreur disponible et compétent à ${commune.nom} peut s'avérer complexe. Grâce à nos partenaires agréés RGE, accédez rapidement aux meilleurs spécialistes de la toiture dans le 13. Que ce soit pour une réparation d'urgence après tempête ou un projet global, recevez vos chiffrages personnalisés sans aucun engagement.`,
      `Besoin d'un diagnostic toiture complet ou d'un devis couvreur à ${commune.nom} ? Comparez les offres de ${rge} artisans couvreurs RGE partenaires actifs sur votre secteur. Profitez de conseils d'experts pour vos travaux d'isolation (sarking) ou de rénovation de couverture traditionnelle en tuiles de terre cuite.`
    ]);
  }

  // Climate Context spinning (based on actual coordinates)
  let climateContext = "";
  if (geoZone === 'coastal') {
    climateContext = selectVariant(slug, 'climate_coastal', [
      `Exposée directement à l'air marin et aux vents côtiers à ${commune.nom}, votre toiture subit la corrosion saline. Le sel attaque la zinguerie (solins, gouttières en zinc) et accélère la porosité des tuiles canal. Nos artisans locaux préconisent des fixations en inox renforcées et des tuiles de qualité supérieure pour résister aux tempêtes maritimes répétées.`,
      `Le climat littoral de ${commune.nom} nécessite des précautions majeures d'étanchéité face aux entrées maritimes et aux embruns corrosifs. Un scellement étanche à la chaux hydraulique naturelle des faîtages et des rives est indispensable pour éviter que le vent marin ne soulève les tuiles ou n'altère la charpente sous-jacente.`
    ]);
  } else if (geoZone === 'camargue') {
    climateContext = selectVariant(slug, 'climate_camargue', [
      `La proximité des étangs et du delta du Rhône crée à ${commune.nom} un taux d'humidité résiduelle plus important qu'ailleurs dans le département. Cette humidité favorise la prolifération ultra-rapide des mousses épaisses et surtout des lichens noirs très adhérents sur la terre cuite. Un démoussage avec hydrofuge de surface est impératif pour préserver les tuiles canal.`,
      `Le microclimat camarguais humide sur le secteur de ${commune.nom} met les couvertures à rude épreuve. Le gel hivernal, bien que rare, fait éclater les tuiles saturées d'eau. C'est pourquoi imperméabiliser la toiture par un traitement hydrofuge de qualité professionnelle est vivement recommandé par nos couvreurs partenaires.`
    ]);
  } else {
    climateContext = selectVariant(slug, 'climate_inland', [
      `Soumise aux violentes rafales du Mistral soufflant du couloir rhodanien vers ${commune.nom}, la toiture doit présenter une résistance mécanique optimale. Les DTU 40.21 imposent un crochetage systématique de toutes les tuiles de rive et un scellement rigoureux. Nos couvreurs fixent solidement les tuiles pour éviter tout sinistre lors des pics de vent.`,
      `Les fortes amplitudes thermiques enregistrées à ${commune.nom}, notamment au pied des massifs provençaux, créent d'importants cycles d'expansion et de contraction des matériaux. Cela fragilise les anciens mortiers de ciment. Nous privilégions les closoirs ventilés mécaniques et un mortier de chaux souple pour suivre les mouvements naturels du bâti.`
    ]);
  }

  // ABF / Urban regulations spinning
  const abfRegulations = selectVariant(slug, 'abf_regulations', [
    `Si votre maison à ${commune.nom} se trouve dans un secteur classé ou à proximité d'un monument protégé, les Architectes des Bâtiments de France (ABF) imposent l'usage exclusif de tuiles canal traditionnelles en terre cuite. Les teintes doivent respecter le nuancier local (ocre, rouge naturel, patiné vieilli) et exclure les tuiles sombres ou trop modernes.`,
    `Les règles d'urbanisme à ${commune.nom} visent à conserver l'authenticité esthétique des toits de Provence. Avant toute rénovation ou réfection de toiture, le dépôt d'une Déclaration Préalable (DP) en mairie est requis. Nos artisans partenaires sélectionnent des tuiles certifiées conformes aux exigences du PLU de la commune.`,
    `La préservation du cachet provençal à ${commune.nom} implique des contraintes techniques. Les Bâtiments de France exigent souvent l'intégration de génoises (de 1 à 3 rangs) maçonnées en sous-face de rive en remplacement des planches de rive modernes en PVC ou alu.`
  ]);

  // Housing Typology spinning (based on population / city density)
  let housingTypologyInsight = "";
  if (density === 'city') {
    housingTypologyInsight = selectVariant(slug, 'typology_city', [
      `Le parc immobilier à ${commune.nom} est dense, marqué par des immeubles de centre-ville et des copropriétés urbaines. La réalisation de travaux de toiture y demande une logistique complexe : installation d'échafaudages sur voirie publique avec autorisation de la mairie, pose de monte-matériaux, et coordination étroite avec les voisins immédiats.`,
      `À ${commune.nom}, les habitations mitoyennes et immeubles anciens de type marseillais exigent un traitement rigoureux des raccords d'étanchéité. Les solins en plomb ou zinc doivent être refaits à neuf lors de la réfection pour éliminer tout risque d'infiltration d'eau pluviale d'une propriété à l'autre.`
    ]);
  } else {
    housingTypologyInsight = selectVariant(slug, 'typology_village', [
      `L'habitat à ${commune.nom} se compose majoritairement de villas individuelles, de bastides provençales et de mas traditionnels. Les charpentes traditionnelles en bois (pannes et chevrons en pin ou chêne) nécessitent un examen minutieux pour repérer d'éventuels insectes xylophages ou des faiblesses structurelles avant d'ajouter le poids de nouvelles tuiles.`,
      `Les propriétés de ${commune.nom} sont souvent entourées de grands pins parasols ou de chênes. La chute des aiguilles et feuilles obstrue régulièrement les chéneaux et gouttières, ce qui peut provoquer des débordements d'eau sous le toit. L'installation de crapaudines ou de pare-feuilles sur les descentes de gouttières y est particulièrement conseillée.`
    ]);
  }

  // Energy Profile spinning
  const energyProfileText = selectVariant(slug, 'energy_profile', [
    `La majorité des habitations à ${commune.nom} ont été construites avant les réglementations thermiques modernes. Sans isolation de toiture, près de 30% des calories s'échappent directement par le toit en hiver. Une réfection complète est l'opportunité idéale pour poser une isolation par l'extérieur (méthode Sarking) performante.`,
    `Le profil énergétique des maisons de ${commune.nom} révèle des factures de chauffage et de climatisation élevées dues à des combles mal isolés. Poser un écran sous-toiture HPV (Hautement Perméable à la Vapeur) combiné à un isolant à fort déphasage permet de réduire drastiquement ces coûts tout en améliorant le DPE du logement.`,
    `Avec le réchauffement climatique dans les Bouches-du-Rhône, l'isolation thermique sous toiture à ${commune.nom} sert autant à se protéger du froid en hiver qu'à limiter la surchauffe des pièces sous combles en été, abaissant la température intérieure de 3°C à 5°C sans surconsommation de climatisation.`
  ]);

  // Master Roofer tip spinning
  const vitrageRecommendation = selectVariant(slug, 'master_roofer_tip', [
    `Conseil du couvreur : Pour votre maison à ${commune.nom}, privilégiez toujours une pose à sec des tuiles de faîtage sur closoir ventilé souple plutôt qu'un scellement rigide au mortier de ciment. Cela évite les fissures dues aux vents et permet à la charpente en bois de respirer librement pour évacuer l'humidité.`,
    `Astuce de pro : Lors d'un nettoyage ou démoussage à ${commune.nom}, refusez systématiquement l'utilisation d'un nettoyeur haute pression réglé à puissance maximale sur vos tuiles en terre cuite. Cela détruit la couche protectrice (l'engobe) et rend la tuile poreuse, accélérant le retour des mousses.`,
    `Information importante : Les travaux d'isolation thermique extérieure (sarking) réalisés par un artisan certifié RGE sur ${commune.nom} ouvrent droit aux aides financières de l'ANAH. Faites réaliser les métrés exacts et exigez la mention de la résistance thermique R (minimum 6 m².K/W) sur votre devis.`
  ]);

  // Table Intro spinning
  const tableIntro = selectVariant(slug, 'table_intro', [
    `Consultez la grille des tarifs moyens indicatifs constatés pour les travaux de ${pageType === 'refection' ? 'rénovation de couverture' : pageType === 'demoussage' ? 'nettoyage et démoussage' : 'couverture et isolation'} à ${commune.nom} pour l'année 2026. Ces prix sont hors taxes et à ajuster selon les accès de votre chantier.`,
    `Grille tarifaire 2026 : Estimation budgétaire au m² pour votre projet de toiture à ${commune.nom}. Les prix réels fluctuent selon la hauteur du bâtiment, la pente du toit, le type de tuiles retenu (canal ou mécanique) et l'accès de l'échafaudage.`,
    `Voici un aperçu réaliste des budgets à prévoir pour des travaux de toiture de qualité professionnelle sur la commune de ${commune.nom}. Obtenez des chiffrages précis en effectuant une demande de devis comparatif local.`
  ]);

  // Expert tip spinning
  const expertTip = selectVariant(slug, 'expert_tip', [
    `Pour éviter que l'eau ne stagne et ne remonte sous les tuiles à ${commune.nom}, vérifiez régulièrement que les couloirs de zinguerie et les noues ne soient pas encombrés de débris de végétation ou de nids d'oiseaux.`,
    `Pensez à contrôler les fixations métalliques de vos tuiles de rive à ${commune.nom} après les tempêtes majeures de Mistral afin de prévenir les infiltrations d'eau lors des violentes pluies méditerranéennes d'automne.`,
    `L'application d'un hydrofuge de toiture coloré à base de résine acrylique permet de raviver la couleur ocre d'un vieux toit en terre cuite sur ${commune.nom} tout en restaurant son imperméabilité d'origine.`
  ]);

  // Savings estimate spinning
  const savingsEstimate = selectVariant(slug, 'savings_estimate', [
    `Réaliser des travaux d'isolation sous toiture (Sarking) permet de réduire de 25% à 30% les déperditions thermiques globales de votre logement à ${commune.nom}.`,
    `Un traitement hydrofuge de qualité retarde de plus de 10 ans la porosité naturelle de vos tuiles canal sur la commune de ${commune.nom}, retardant ainsi une réfection complète coûteuse.`,
    `Le gain en confort d'été procuré par une isolation à base de laine de bois sous toiture peut éviter le recours à une climatisation continue dans les pièces mansardées à ${commune.nom}.`
  ]);

  // Local profile text spinning
  const localProfileParagraph = selectVariant(slug, 'local_profile', [
    `Située dans le département des Bouches-du-Rhône au sein de la collectivité ${commune.intercommunalite || 'de votre secteur'}, la commune de ${commune.nom} possède un patrimoine bâti remarquable. La protection des charpentes et l'étanchéité des toitures traditionnelles représentent un enjeu local majeur de conservation.`,
    `Riche de son histoire provençale et intégrée à ${commune.intercommunalite || 'la métropole locale'}, la commune de ${commune.nom} est le lieu de nombreux chantiers de rénovation de villas et de mas anciens. Nos couvreurs RGE locaux interviennent activement dans le respect des styles architecturaux locaux.`,
    `La gestion de l'eau de pluie et la résistance aux vents forts sont des priorités de construction historiques à ${commune.nom}. La toiture y est l'élément le plus exposé de l'enveloppe du bâtiment traditionnel provençal.`
  ]);

  // Diagnostic Énergétique spinning
  const diagnosticEnergetique = selectVariant(slug, 'diagnostic', [
    `Un diagnostic complet de votre toiture à ${commune.nom} permet de déceler les tuiles fendues, les mortiers de scellement désagrégés et les défauts d'isolation. Anticiper ces réparations évite des dégâts des eaux majeurs dans les plafonds et l'isolation intérieure.`,
    `Nos artisans partenaires RGE réalisent une inspection approfondie de l'état de vos bois de charpente et de l'étanchéité de vos solins en zinc à ${commune.nom} avant de formuler toute proposition de réfection ou de nettoyage.`,
    `Un bilan thermique sous toiture permet de cibler précisément l'épaisseur d'isolant nécessaire pour éliminer l'inconfort thermique hivernal et estival persistant dans les pièces sous toit à ${commune.nom}.`
  ]);

  // Dynamic Pose steps spinning (different formulations for step details)
  const step1Desc = selectVariant(slug, 'step1', [
    `Installation des structures de protection collective, mise en sécurité du chantier à ${commune.nom} conformément aux règles de sécurité, puis dépose minutieuse de l'ancienne couverture.`,
    `Mise en place de l'échafaudage réglementaire, sécurisation des abords sur la commune de ${commune.nom}, et retrait soigné des tuiles abîmées ou des éléments de zinguerie HS.`
  ]);
  const step2Desc = selectVariant(slug, 'step2', [
    `Contrôle minutieux de l'état mécanique de la charpente en bois, puis installation d'un écran sous-toiture HPV respirant agrafé sur les chevrons.`,
    `Examen des pannes et chevrons de la charpente, traitement fongicide curatif si nécessaire, et pose tendue de l'écran de sous-toiture étanche à l'eau.`
  ]);
  const step3Desc = selectVariant(slug, 'step3', [
    `Fixation par clouage des contre-lattes et liteaux de soutien en bois traité, puis traçage précis pour l'alignement futur des tuiles canal ou mécaniques.`,
    `Liteonnage horizontal et vertical pour créer la grille de pose, permettant une ventilation sous-tuile efficace et un calage parfait de la couverture.`
  ]);
  const step4Desc = selectVariant(slug, 'step4', [
    `Mise en place des tuiles canal ou mécaniques avec crochetage ou clouage métallique systématique de toutes les tuiles de rive et de faitage selon le DTU 40.21.`,
    `Pose de la couverture en terre cuite avec scellement mécanique pour résister aux coups de Mistral fréquents sur la région de ${commune.nom}.`
  ]);
  const step5Desc = selectVariant(slug, 'step5', [
    `Réalisation des solins de raccordement, pose des gouttières zinc neuves et nettoyage complet des combles et du jardin avec évacuation des déchets du 13.`,
    `Raccordements de zinguerie étanches sur les cheminées et rives, nettoyage final du chantier et évacuation des gravats vers une déchetterie agréée des Bouches-du-Rhône.`
  ]);

  const poseSteps = [
    { title: selectVariant(slug, 'step1_title', ["Préparation & Échafaudage", "Sécurisation & Dépose"]), description: step1Desc },
    { title: selectVariant(slug, 'step2_title', ["Contrôle Charpente & Écran HPV", "Vérification Bois & Sous-Toiture"]), description: step2Desc },
    { title: selectVariant(slug, 'step3_title', ["Liteonnage & Alignement", "Supportage & Calage des tuiles"]), description: step3Desc },
    { title: selectVariant(slug, 'step4_title', ["Fixation & Pose (DTU 40.21)", "Pose de Tuiles & Crochetage Anti-Vent"]), description: step4Desc },
    { title: selectVariant(slug, 'step5_title', ["Zinguerie & Nettoyage final", "Finitions Zinc & Fin de chantier"]), description: step5Desc }
  ];

  // Dynamic internal links
  const guideLinks = [
    { href: "/guides/prix-refection-toiture-marseille-13-2026/", label: selectVariant(slug, 'g1', ["Tarifs Toiture 2026", "Budget Toiture 2026"]), desc: selectVariant(slug, 'g1_d', ["Quel budget prévoir au m² pour votre toit ?", "Les prix moyens des couvreurs dans le 13."]) },
    { href: "/guides/tuiles-canal-provencales-guide-pose-bouches-du-rhone/", label: selectVariant(slug, 'g2', ["Guide Tuiles Provençales", "L'art des Tuiles Canal"]), desc: selectVariant(slug, 'g2_d', ["La pose traditionnelle des tuiles canal.", "Comment poser des tuiles de courant et couvert."]) },
    { href: "/guides/mistral-toiture-securiser-tuiles-rafales-provence/", label: selectVariant(slug, 'g3', ["Guide Anti-Mistral", "Sécuriser face au Mistral"]), desc: selectVariant(slug, 'g3_d', ["Comment protéger et bloquer les tuiles.", "Fixer sa couverture contre les tempêtes du 13."]) }
  ];

  // --- Dynamic FAQ Pool & Spinning ---
  const allFAQs = [
    {
      q: `Quelle tuile choisir pour ma toiture à ${commune.nom} ?`,
      a: selectVariant(slug, 'faq1', [
        `Dans les Bouches-du-Rhône et particulièrement à ${commune.nom}, la tuile canal en terre cuite reste la référence historique et esthétique exigée par la majorité des PLU. Toutefois, si votre habitation n'est pas située en zone protégée (ABF), les tuiles mécaniques imitation canal offrent une excellente alternative : plus légères, elles se verrouillent à emboîtement pour une résistance accrue au Mistral et requièrent moins de temps de main-d'œuvre lors de la pose.`,
        `Le choix dépend de l'urbanisme local à ${commune.nom}. Les zones soumises aux Bâtiments de France exigent des tuiles canal traditionnelles posées sur chevrons ou plaques sous-tuile (PST). Pour les maisons hors secteur classé, les tuiles à emboîtement (mécaniques) de couleur ocre ou vieillie sont prisées car elles réduisent le coût du chantier tout en gardant le charme provençal.`
      ])
    },
    {
      q: `À quelle fréquence faut-il nettoyer ou démousser son toit à ${commune.nom} ?`,
      a: selectVariant(slug, 'faq2', [
        `Il est conseillé de réaliser un entretien préventif tous les 3 à 5 ans. Bien que le climat provençal à ${commune.nom} soit sec la majeure partie de l'année, les fortes chaleurs estivales suivies de pluies orageuses d'automne créent un terrain propice au développement de micro-organismes poreux qui fragilisent les tuiles. L'application d'un traitement hydrofuge de surface retarde durablement ce phénomène.`,
        `Un nettoyage professionnel à ${commune.nom} doit avoir lieu dès l'apparition de traînées sombres ou de mousses vertes. En général, inspecter son toit tous les 4 ans permet d'anticiper la porosité des tuiles canal avant que les racines de lichen ne pénètrent l'argile et provoquent des infiltrations sous toiture.`
      ])
    },
    {
      q: `Comment déclarer une fuite de toiture après une tempête de Mistral à ${commune.nom} ?`,
      a: selectVariant(slug, 'faq3', [
        `Vous disposez d'un délai légal de 5 jours ouvrés pour déclarer le sinistre à votre assurance habitation. Il est conseillé de contacter immédiatement un couvreur intervenant sur ${commune.nom} pour planifier un bâchage d'urgence (mise hors d'eau temporaire) afin de sauvegarder vos plafonds et votre isolation, puis d'établir un devis détaillé des réparations définitives à soumettre à l'expert de votre assurance.`,
        `Après un coup de vent violent sur ${commune.nom}, prenez des photos des tuiles déplacées ou envolées. Déclarez le sinistre à votre assureur sous 5 jours. Faites appel à un artisan couvreur local pour poser une bâche d'urgence. Ce premier déplacement d'urgence est généralement pris en charge par votre contrat multirisque habitation.`
      ])
    },
    {
      q: `MaPrimeRénov' finance-t-elle la réfection complète de toiture à ${commune.nom} ?`,
      a: selectVariant(slug, 'faq4', [
        `Non, le remplacement simple des tuiles canal ou mécaniques n'est pas financé par MaPrimeRénov'. Cependant, si vous combinez ces travaux de couverture avec des travaux d'isolation thermique de la toiture (isolation extérieure par sarking ou isolation des combles perdus) réalisés par un couvreur certifié RGE à ${commune.nom}, vous êtes éligible à des subventions substantielles calculées selon vos revenus fiscaux.`,
        `Les aides nationales ne couvrent pas l'esthétique du toit (les tuiles). En revanche, l'isolation thermique sous rampant réalisée en même temps que la réfection de toiture par un artisan RGE sur ${commune.nom} bénéficie des aides MaPrimeRénov' et des Certificats d'Économie d'Énergie (CEE) qui peuvent réduire la facture globale.`
      ])
    },
    {
      q: `Qu'est-ce que l'isolation de toiture par sarking à ${commune.nom} ?`,
      a: selectVariant(slug, 'faq5', [
        `Le sarking est une méthode d'isolation thermique de toiture par l'extérieur. Elle consiste à poser des panneaux isolants rigides (polyuréthane, laine de bois) directement sur les chevrons de la charpente, sous les tuiles canal. À ${commune.nom}, cette solution haut de gamme élimine 100% des ponts thermiques sans perdre de volume habitable sous les combles, ce qui est idéal pour les pièces mansardées.`,
        `Isoler par sarking à ${commune.nom} consiste à envelopper la charpente par l'extérieur avant la pose des tuiles. Cela permet de conserver les poutres apparentes à l'intérieur de la maison tout en créant un bouclier thermique continu ultra-performant contre le froid d'hiver et le soleil de plomb en été.`
      ])
    },
    {
      q: `Combien de temps durent les travaux de réfection de toiture à ${commune.nom} ?`,
      a: selectVariant(slug, 'faq6', [
        `Pour une maison individuelle de taille moyenne (100 m² de toiture) à ${commune.nom}, les travaux d'une équipe de 2 à 3 couvreurs prennent généralement entre 5 et 10 jours de travail effectif. Cette durée dépend beaucoup des conditions météorologiques (absence de pluie et Mistral modéré inférieur à 50 km/h indispensable pour le travail en hauteur) et de l'état de la charpente.`,
        `Le chantier s'étale habituellement sur une bonne semaine pour une couverture classique sur ${commune.nom}. La dépose des anciennes tuiles et la vérification de la charpente prennent les deux premiers jours, suivis par le liteonnage, la pose des tuiles neuves et les finitions de zinguerie.`
      ])
    },
    {
      q: `Quels sont les avantages d'un traitement hydrofuge de toiture à ${commune.nom} ?`,
      a: selectVariant(slug, 'faq7', [
        `L'hydrofuge pénètre les pores de la tuile en terre cuite et crée un effet perlant empêchant l'eau de pluie de pénétrer dans l'argile. À ${commune.nom}, cela permet de protéger les tuiles contre l'usure précoce, d'éviter que le gel ne les casse, et de limiter considérablement l'adhérence des lichens et mousses pour conserver un toit propre très longtemps.`,
        `Appliquer un hydrofuge de qualité sur votre toiture à ${commune.nom} restaure la protection imperméable d'origine de vos tuiles canal. En glissant sur le toit, l'eau de pluie emporte les poussières et résidus de pollution, créant un effet autonettoyant naturel sans altérer la perméabilité à l'air de la terre cuite.`
      ])
    },
    {
      q: `Comment choisir un bon couvreur de confiance certifié RGE à ${commune.nom} ?`,
      a: selectVariant(slug, 'faq8', [
        `Vérifiez impérativement plusieurs éléments : l'existence d'une garantie décennale valide couvrant explicitement l'activité de couverture-zinguerie dans les Bouches-du-Rhône, le label RGE Qualibat à jour pour l'année 2026, et des références de chantiers visitables sur le secteur de ${commune.nom}. Enfin, comparez au moins 3 devis détaillés mentionnant les cotes réelles et les marques de tuiles.`,
        `À ${commune.nom}, privilégiez un artisan couvreur local répertorié sur l'annuaire officiel France Rénov'. Exigez ses attestations d'assurance (décennale et responsabilité civile professionnelle) avant le début des travaux. Un bon professionnel viendra toujours effectuer un contrôle visuel sur votre toit avant d'établir un devis.`
      ])
    }
  ];

  // Deterministically select 4 FAQs based on the pageType and the commune slug
  const faqIndices: number[] = [];
  const seed = getStringHash(slug + "-" + pageType);
  
  // Select index logic based on page type to ensure relevance
  if (pageType === 'refection') {
    // 0: Quelle tuile, 3: MaPrimeRénov, 4: Sarking, 5: Temps
    faqIndices.push(0, 3, 4, 5);
  } else if (pageType === 'demoussage') {
    // 1: Fréquence, 6: Avantages hydrofuge, 2: Fuite/Mistral, 7: Choisir couvreur
    faqIndices.push(1, 6, 2, 7);
  } else {
    // 7: Choisir couvreur, 3: MaPrimeRénov, 0: Quelle tuile, 2: Fuite/Mistral
    faqIndices.push(7, 3, 0, 2);
  }

  // Shuffle slightly based on seed to vary the ordering between towns
  const selectedFAQs = faqIndices.map(idx => allFAQs[idx]);
  const finalFAQs = [
    selectedFAQs[seed % 4],
    selectedFAQs[(seed + 1) % 4],
    selectedFAQs[(seed + 2) % 4],
    selectedFAQs[(seed + 3) % 4]
  ].filter((v, i, a) => a.indexOf(v) === i); // Deduplicate just in case

  // Fallback to fill up to 4 if deduplication removed any
  while (finalFAQs.length < 4) {
    const missing = allFAQs.find(f => !finalFAQs.includes(f));
    if (missing) finalFAQs.push(missing);
    else break;
  }

  const faqItems = finalFAQs.map(f => ({
    question: f.q,
    answer: f.a
  }));

  // Secteur info text
  const marketDataText = selectVariant(slug, 'market_data', [
    `Secteur ${commune.nom} (${commune.codePostal}) : ${rge} couvreurs partenaires certifiés RGE disponibles sous ${delays} jours pour vos diagnostics et chiffrages.`,
    `Marché local ${commune.nom} : nous comptons actuellement ${rge} artisans de confiance certifiés disposant de créneaux d'intervention sous ${delays} jours.`,
    `Zone ${commune.nom} : planifiez une visite avec l'un de nos ${rge} couvreurs qualifiés RGE. Délai de réponse moyen constaté de ${delays} jours.`
  ]);

  // Real estate insight
  const realEstateInsight = selectVariant(slug, 'real_estate', [
    `Faire réaliser la réfection ou l'isolation de sa toiture à ${commune.nom} valorise de manière significative votre patrimoine immobilier. Une couverture propre, étanche et isolée est un argument de vente majeur qui rassure les acheteurs et justifie une plus-value sur le marché immobilier de la région.`,
    `Dans le cadre d'une vente ou d'une mise en location à ${commune.nom}, le DPE joue un rôle déterminant. Rénover le toit permet d'éviter que le logement soit classé comme passoire thermique, augmentant sa valeur patrimoniale globale.`,
    `Investir dans la réfection de toiture à ${commune.nom} sécurise votre habitation contre les sinistres et sinistres climatiques futurs, réduisant également le coût de vos contrats d'assurance habitation.`
  ]);

  // General local agencies helper
  const localAgencyName = selectVariant(slug, 'agency_name', [
    `l'Espace Conseil France Rénov' des Bouches-du-Rhône`,
    `l'ADIL du 13 (Agence Départementale d'Information sur le Logement)`,
    `le guichet unique de la rénovation énergétique de la Métropole`
  ]);

  const localAgencyDetail = selectVariant(slug, 'agency_detail', [
    `le guichet public chargé de l'accompagnement des particuliers. Un conseiller neutre et gratuit vous aide dans l'analyse de vos devis et les dossiers de subventions`,
    `l'organisme public d'information qui vous renseigne gratuitement sur vos droits, les aides locales (prêt à taux zéro, éco-PTU) et la fiscalité de vos travaux de rénovation`,
    `le pôle métropolitain de conseil en transition écologique qui vous guide pas à pas dans l'obtention des financements nationaux et régionaux`
  ]);

  // Calendar
  const calendrierRenovation = selectVariant(slug, 'calendar', [
    `Le remplacement complet d'une toiture à ${commune.nom} dure généralement entre 5 et 10 jours ouvrés selon les conditions climatiques et l'accès.`,
    `Le planning moyen d'un chantier de toiture sur ${commune.nom} s'établit sur une semaine de travail continu, excluant les dimanches et jours de grand Mistral.`,
    `Prévoyez une amplitude de 5 à 12 jours pour la réfection globale, comprenant la dépose de l'ancien toit et la mise en place de la nouvelle zinguerie.`
  ]);

  // Local agencies
  const conseilAides = selectVariant(slug, 'aides', [
    `Les travaux d'isolation thermique extérieure (sarking) réalisés par un artisan certifié RGE ouvrent droit à des subventions nationales (MaPrimeRénov' et primes CEE).`,
    `Bénéficiez du taux de TVA réduit à 5,5% sur la main-d'œuvre et le matériel en faisant réaliser vos travaux de toiture et d'isolation par un professionnel RGE.`,
    `L'éco-prêt à taux zéro (éco-PTU) permet de financer jusqu'à 30 000€ de travaux d'isolation de toiture à ${commune.nom} sans aucun intérêt bancaire.`
  ]);

  return {
    title,
    introParagraph,
    tableIntro,
    marketDataText,
    realEstateInsight,
    abfRegulations,
    climateContext,
    poseSteps,
    diagnosticEnergetique,
    vitrageRecommendation,
    calendrierRenovation,
    faqItems,
    sourcesCitation: "Données de marché estimées pour l'année 2026 issues des rapports de l'ANAH, du CSTB et des fédérations du bâtiment des Bouches-du-Rhône.",
    conseilAides,
    localAgencyName,
    localAgencyDetail,
    guideLinks,
    expertTip,
    savingsEstimate,
    localProfileParagraph,
    housingTypologyInsight,
    energyProfileText,
    smartNearbyCommunesText: `Nous intervenons également activement sur les localités limitrophes de ${commune.nom} : ${nearbyNames}.`
  };
}
