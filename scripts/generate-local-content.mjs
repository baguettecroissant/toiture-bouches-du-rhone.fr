#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const communesPath = join(__dirname, '..', 'src', 'data', 'communes.json');

if (!existsSync(communesPath)) {
  console.error('communes.json not found. Run fetch-cities.mjs first.');
  process.exit(1);
}

const communes = JSON.parse(readFileSync(communesPath, 'utf-8'));

function hash(slug, seed = 0) {
  let h = seed * 31;
  for (let i = 0; i < slug.length; i++) {
    h = ((h << 5) - h + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Map postal code/slug to Bouches-du-Rhône intercommunalities
function getIntercommunalite(cp, slug) {
  const codePostal = String(cp);
  
  if (['arles', 'tarascon', 'saint-martin-de-crau', 'boulbon'].includes(slug) || codePostal.startsWith('13200') || codePostal.startsWith('13150') || codePostal.startsWith('13310')) {
    return "Métropole d'Arles Crau Camargue Montagnette";
  }
  
  if (['chateaurenard', 'barbentane', 'noves', 'cabannes', 'rognonas', 'eyragues', 'orgon'].includes(slug) || ['13160', '13570', '13630', '13550', '13940', '13660'].includes(codePostal)) {
    return "Communauté d'agglomération Terre de Provence";
  }
  
  if (['saint-remy-de-provence', 'fontvieille', 'maussane-les-alpilles', 'mouries', 'eygalieres'].includes(slug) || ['13210', '13990', '13520', '13810', '13890'].includes(codePostal)) {
    return "Communauté de communes Vallée des Baux-Alpilles";
  }

  return "Métropole d'Aix-Marseille-Provence";
}

function getHabitatType(slug) {
  const h = hash(slug, 1);
  const types = [
    "bastides provençales traditionnelles et mas en pierre de taille",
    "maisons individuelles contemporaines et pavillons récents",
    "copropriétés urbaines et immeubles de type marseillais en centre ancien",
    "résidences de standing et villas provençales en tuiles canal",
    "bâtisses traditionnelles provençales, bastides et maisons de village"
  ];
  if (['marseille', 'aix-en-provence', 'arles', 'aubagne'].includes(slug)) {
    return "immeubles de type marseillais en centre ancien et copropriétés urbaines";
  }
  return types[h % types.length];
}

function getAnecdotePatrimoine(slug) {
  const anecdotes = [
    "la protection historique des façades à proximité des monuments phares de la région provençale",
    "le respect des teintes traditionnelles ocre et terre cuite imposées par les architectes des Bâtiments de France (ABF)",
    "l'architecture provençale locale où les génoises à trois rangs protègent les murs des eaux de ruissellement",
    "les toitures traditionnelles en tuiles canal scellées au mortier de chaux pour faire face aux assauts répétés du Mistral",
    "les bastides locales dont la toiture à faible pente caractéristique permet de mieux résister à la force du vent dominant"
  ];
  
  if (slug.includes('marseille')) {
    return "la proximité de Notre-Dame de la Garde et de la rade marseillaise, exigeant des toitures résistantes aux embruns marins et aux vents violents de la côte";
  }
  if (slug.includes('aix-en-provence')) {
    return "le patrimoine historique du Cours Mirabeau et des hôtels particuliers aixois, où la réfection exige le respect strict des DTU et l'aval fréquent des Architectes des Bâtiments de France";
  }
  if (slug.includes('arles')) {
    return "le patrimoine romain antique exceptionnel d'Arles et la proximité de la Camargue, imposant des contraintes strictes sur la pose de tuiles de récupération ou vieillies";
  }
  if (slug.includes('aubagne')) {
    return "l'héritage des tuiliers et céramistes de la vallée de l'Huveaune, valorisant les tuiles canal en terre cuite issues des argiles locales";
  }
  if (slug.includes('martigues')) {
    return "les célèbres canaux de la Venise Provençale et l'étang de Berre, imposant des précautions majeures d'étanchéité à l'eau lors des pluies torrentielles d'automne";
  }
  
  const h = hash(slug, 2);
  return anecdotes[h % anecdotes.length];
}

function getLocalIntroText(commune) {
  const { nom, slug, population } = commune;
  const habitat = getHabitatType(slug);
  const anecdote = getAnecdotePatrimoine(slug);
  
  return `Avec ses ${population.toLocaleString('fr-FR')} habitants, la commune de ${nom} présente un parc immobilier varié, composé en grande partie de ${habitat}. Le climat méditerranéen local, caractérisé par un ensoleillement exceptionnel mais aussi par des épisodes de Mistral violent et des pluies torrentielles soudaines, met les couvertures à rude épreuve. De plus, ${anecdote}. C'est pourquoi faire appel à un couvreur RGE qualifié est indispensable pour assurer la longévité de votre toiture dans cette zone des Bouches-du-Rhône.`;
}

function getLocalAdvice(commune) {
  const { nom, slug } = commune;
  const h = hash(slug, 3);
  const advices = [
    `Pour la réfection de toiture à ${nom}, sachez que l'isolation sous toiture par l'extérieur (technique du sarking) est éligible aux aides MaPrimeRénov' et aux primes CEE, vous permettant d'amortir jusqu'à 60% du montant total des travaux d'isolation thermique.`,
    `Dans les copropriétés de ${nom}, les travaux de réfection de toiture requièrent un vote en assemblée générale (majorité de l'article 24). Un couvreur RGE local peut vous aider à monter le dossier de financement collectif pour obtenir les subventions de la Métropole.`,
    `Avant de signer votre devis de toiture à ${nom}, exigez systématiquement l'attestation d'assurance décennale du couvreur à jour pour l'année 2026. Vérifiez également que la garantie de parfait achèvement est explicitement mentionnée dans le contrat.`,
    `Un traitement hydrofuge de toiture après démoussage est fortement conseillé à ${nom}. En effet, les pluies automnales méditerranéennes peuvent saturer les tuiles poreuses et provoquer des infiltrations dans les combles en l'absence de traitement protecteur.`
  ];
  return advices[h % advices.length];
}

function getLocalFAQ(commune) {
  const { nom, slug } = commune;
  
  const faqList = [
    {
      q: `Quelle tuile choisir pour ma toiture à ${nom} ?`,
      a: `En Provence et à ${nom}, la tuile canal en terre cuite reste la référence historique et esthétique obligatoire dans la majorité des PLU. Toutefois, si vous n'êtes pas en zone protégée (ABF), les tuiles mécaniques (ou tuiles à emboîtement) imitation canal offrent une excellente résistance au Mistral et sont plus rapides à poser, réduisant le coût de main-d'œuvre.`
    },
    {
      q: `À quelle fréquence faut-il nettoyer ou démousser son toit à ${nom} ?`,
      a: `En raison de l'alternance entre de longues périodes sèches et de fortes pluies dans le 13, le démoussage et l'application d'un traitement algicide/hydrofuge doivent idéalement être réalisés tous les 3 à 5 ans. Cela évite que les mousses et lichens ne retiennent l'humidité et ne fassent éclater les tuiles lors des rares gels hivernaux.`
    },
    {
      q: `Comment déclarer une fuite de toiture après une tempête de Mistral à ${nom} ?`,
      a: `Vous devez contacter votre assurance habitation dans un délai maximum de 5 jours ouvrés après le sinistre. Il est recommandé de faire intervenir immédiatement un couvreur à ${nom} pour effectuer une mise hors d'eau rapide (bâchage temporaire) afin de limiter les dégâts intérieurs, puis de lui demander un devis détaillé pour les réparations définitives.`
    },
    {
      q: `MaPrimeRénov' finance-t-elle la réfection complète de toiture à ${nom} ?`,
      a: `Non, MaPrimeRénov' ne finance pas le remplacement simple des tuiles. En revanche, si vous combinez la réfection de couverture avec des travaux d'isolation thermique sous toiture (isolation des combles ou sarking) réalisés par un couvreur certifié RGE à ${nom}, vous pouvez bénéficier d'aides substantielles proportionnelles à vos revenus.`
    }
  ];
  
  return faqList;
}

function getMarketData(commune) {
  const { slug, population } = commune;
  const h = hash(slug, 4);
  
  // Base values adjusted by population and a hash variation
  let rgeCount = 2;
  if (population > 100000) rgeCount = 45;      // Marseille
  else if (population > 50000) rgeCount = 22;   // Aix-en-Provence
  else if (population > 20000) rgeCount = 11;
  else if (population > 10000) rgeCount = 6;
  else if (population > 5000) rgeCount = 4;
  
  rgeCount += (h % 3);
  rgeCount = Math.max(1, rgeCount);
  
  // Cost variation
  const basePriceRef = 115 + (h % 35); // 115 - 150
  const basePriceDem = 15 + (h % 15);   // 15 - 30
  
  return {
    couvreursRGE: rgeCount,
    prixM2Refection: basePriceRef,
    prixM2Demoussage: basePriceDem,
    delaiMoyenJours: 10 + (h % 15) // 10 - 25 days lead time
  };
}

const enriched = communes.map(commune => {
  const intercommunalite = getIntercommunalite(commune.codePostal, commune.slug);
  const intro = getLocalIntroText(commune);
  const conseil = getLocalAdvice(commune);
  const faq = getLocalFAQ(commune);
  const market = getMarketData(commune);
  
  return {
    ...commune,
    intercommunalite,
    introText: intro,
    conseilLocal: conseil,
    faq: faq,
    marketData: market
  };
});

writeFileSync(communesPath, JSON.stringify(enriched, null, 2), 'utf-8');

console.log(`✅ Enriched ${enriched.length} Bouches-du-Rhône (13) communes with unique SEO data.`);
console.log('Sample Marseille:', JSON.stringify(enriched.find(c => c.slug.includes('marseille')), null, 2));
console.log('Sample Aix-en-Provence:', JSON.stringify(enriched.find(c => c.slug === 'aix-en-provence'), null, 2));

