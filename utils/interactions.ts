export interface InteractionRule {
  a: string[];
  b: string[];
  message: string;
}

// Canonical names → synonym aliases (all lowercase)
const SYNONYMS: Record<string, string[]> = {
  'iron': ['ferrous sulfate', 'ferrous gluconate', 'ferric iron', 'fe'],
  'calcium': ['calcium carbonate', 'calcium citrate', 'cal', 'ca'],
  'magnesium': ['magnesium glycinate', 'magnesium citrate', 'magnesium oxide', 'mag', 'mg'],
  'zinc': ['zinc gluconate', 'zinc picolinate', 'zinc sulfate', 'zn'],
  'vitamin d': ['vitamin d3', 'vit d', 'vit d3', 'd3', 'cholecalciferol', 'calciferol'],
  'vitamin c': ['ascorbic acid', 'vit c', 'c', 'ascorbate'],
  'vitamin e': ['tocopherol', 'vit e', 'alpha-tocopherol'],
  'vitamin k': ['vitamin k1', 'vitamin k2', 'vit k', 'k1', 'k2', 'menaquinone', 'phylloquinone'],
  'vitamin a': ['retinol', 'vit a', 'beta-carotene', 'beta carotene'],
  'vitamin b12': ['b12', 'cobalamin', 'methylcobalamin', 'cyanocobalamin'],
  'folate': ['folic acid', 'vitamin b9', 'b9', 'methylfolate'],
  'omega-3': ['fish oil', 'omega 3', 'epa', 'dha', 'flaxseed oil'],
  'copper': ['cupric', 'cu'],
  'iodine': ['potassium iodide', 'kelp'],
  'selenium': ['selenomethionine', 'se'],
  'melatonin': ['mel'],
  'caffeine': ['coffee', 'guarana', 'green tea extract'],
  'st johns wort': ["st. john's wort", 'hypericum'],
  'green tea extract': ['egcg', 'camellia sinensis'],
  'coq10': ['coenzyme q10', 'ubiquinol', 'ubiquinone'],
  'ashwagandha': ['withania somnifera', 'indian ginseng'],
  '5-htp': ['5htp', '5 htp', 'hydroxytryptophan'],
};

export const INTERACTION_RULES: InteractionRule[] = [
  {
    a: ['iron'],
    b: ['calcium'],
    message: 'Iron and calcium compete for absorption — taking them together reduces effectiveness of both. Space them at least 2 hours apart.',
  },
  {
    a: ['iron'],
    b: ['zinc'],
    message: 'High-dose iron and zinc compete for absorption at the same intestinal transporter. Take them at separate times.',
  },
  {
    a: ['magnesium'],
    b: ['zinc'],
    message: 'Magnesium and zinc can compete for absorption when taken in high doses together. Consider spacing them apart.',
  },
  {
    a: ['calcium'],
    b: ['zinc'],
    message: 'Calcium can inhibit zinc absorption when taken simultaneously. Take them at least 1–2 hours apart.',
  },
  {
    a: ['vitamin d'],
    b: ['vitamin a'],
    message: 'Very high doses of vitamin A may interfere with vitamin D function. Ensure combined intake stays within safe limits.',
  },
  {
    a: ['vitamin d'],
    b: ['vitamin k'],
    message: 'Vitamin D increases calcium absorption; vitamin K2 directs calcium to bones rather than arteries. Taking both together is often beneficial — ensure you have adequate K2 if supplementing high-dose D3.',
  },
  {
    a: ['omega-3'],
    b: ['vitamin e'],
    message: 'Omega-3 fatty acids can oxidise over time; vitamin E acts as an antioxidant that may help stabilise them — generally safe together, but very high combined doses may affect clotting.',
  },
  {
    a: ['st johns wort'],
    b: ['5-htp'],
    message: "St. John's Wort and 5-HTP both raise serotonin levels — combining them increases the risk of serotonin syndrome. Consult a healthcare provider before taking both.",
  },
  {
    a: ['st johns wort'],
    b: ['melatonin'],
    message: "St. John's Wort may affect sleep cycles similarly to melatonin. Taking both can cause excessive drowsiness or disrupt sleep timing.",
  },
  {
    a: ['caffeine'],
    b: ['melatonin'],
    message: 'Caffeine (including from supplements like green tea extract or guarana) can block melatonin receptors, reducing melatonin effectiveness. Avoid caffeine-containing supplements close to bedtime.',
  },
  {
    a: ['green tea extract'],
    b: ['iron'],
    message: 'Green tea extract contains tannins that can bind to non-haem iron and significantly reduce its absorption. Take iron at least 2 hours away from green tea extract.',
  },
  {
    a: ['copper'],
    b: ['zinc'],
    message: 'High zinc intake depletes copper over time. If supplementing zinc long-term, consider ensuring adequate copper intake (typically a 8:1 zinc-to-copper ratio).',
  },
  {
    a: ['selenium'],
    b: ['vitamin c'],
    message: 'High-dose vitamin C may reduce the bioavailability of selenite (one form of selenium). If using selenium, prefer selenomethionine which is less affected.',
  },
  {
    a: ['calcium'],
    b: ['magnesium'],
    message: 'Calcium and magnesium compete for the same absorption pathway. A 2:1 calcium-to-magnesium ratio is typical; very high calcium can impair magnesium absorption.',
  },
  {
    a: ['folate'],
    b: ['vitamin b12'],
    message: 'High-dose folate can mask a vitamin B12 deficiency. Ensure adequate B12 levels if taking large amounts of folate.',
  },
  {
    a: ['vitamin a'],
    b: ['vitamin a'],
    message: '',
  },
  {
    a: ['iodine'],
    b: ['selenium'],
    message: 'Iodine and selenium work together in thyroid function — but very high iodine without adequate selenium can stress the thyroid. Ensure balanced intake if supplementing both.',
  },
];

function normalise(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function resolveCanonical(name: string): string {
  const n = normalise(name);
  for (const [canonical, aliases] of Object.entries(SYNONYMS)) {
    if (n === canonical || aliases.includes(n)) return canonical;
  }
  return n;
}

function namesMatch(a: string, b: string): boolean {
  return resolveCanonical(a) === resolveCanonical(b);
}

export interface FoundInteraction {
  withName: string;
  message: string;
}

export function findInteractions(
  newName: string,
  existingNames: string[],
): FoundInteraction[] {
  if (!newName.trim()) return [];

  const results: FoundInteraction[] = [];
  const newCanonical = resolveCanonical(newName);

  for (const existing of existingNames) {
    const existingCanonical = resolveCanonical(existing);

    // Skip self-comparison (editing the same item)
    if (newCanonical === existingCanonical) continue;

    for (const rule of INTERACTION_RULES) {
      if (!rule.message) continue;

      const aMatchesNew = rule.a.some((term) => resolveCanonical(term) === newCanonical);
      const bMatchesExisting = rule.b.some((term) => resolveCanonical(term) === existingCanonical);
      const aMatchesExisting = rule.a.some((term) => resolveCanonical(term) === existingCanonical);
      const bMatchesNew = rule.b.some((term) => resolveCanonical(term) === newCanonical);

      if ((aMatchesNew && bMatchesExisting) || (aMatchesExisting && bMatchesNew)) {
        // Avoid duplicate warnings for the same existing item
        if (!results.some((r) => r.withName === existing)) {
          results.push({ withName: existing, message: rule.message });
        }
        break;
      }
    }
  }

  return results;
}
