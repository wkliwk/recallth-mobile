import Fuse from 'fuse.js';
import { SupplementType } from './cabinet';

export interface SupplementAlias {
  canonical: string;
  aliases: string[];
  type: SupplementType;
  doseUnit: string;
  typicalDose: string;
}

export const SUPPLEMENT_ALIASES: SupplementAlias[] = [
  { canonical: 'Vitamin D3', aliases: ['vitamin d', 'vit d', 'd3', 'cholecalciferol', 'vitamin d3', 'vit d3'], type: 'vitamin', doseUnit: 'IU', typicalDose: '2000' },
  { canonical: 'Omega-3 (Fish Oil)', aliases: ['omega 3', 'omega-3', 'fish oil', 'epa dha', 'epa/dha', 'fish oil capsules', 'cod liver oil', 'dha', 'epa'], type: 'supplement', doseUnit: 'mg', typicalDose: '1000' },
  { canonical: 'Magnesium Glycinate', aliases: ['magnesium glycinate', 'mag glycinate', 'magnesium bisglycinate', 'magnesium glysinate'], type: 'supplement', doseUnit: 'mg', typicalDose: '200' },
  { canonical: 'Magnesium Citrate', aliases: ['magnesium citrate', 'mag citrate'], type: 'supplement', doseUnit: 'mg', typicalDose: '200' },
  { canonical: 'Magnesium Malate', aliases: ['magnesium malate', 'mag malate'], type: 'supplement', doseUnit: 'mg', typicalDose: '200' },
  { canonical: 'Magnesium', aliases: ['magnesium', 'mag', 'magnesium oxide', 'magnesiun'], type: 'supplement', doseUnit: 'mg', typicalDose: '200' },
  { canonical: 'Vitamin B12', aliases: ['b12', 'vitamin b12', 'vit b12', 'cobalamin', 'methylcobalamin', 'cyanocobalamin'], type: 'vitamin', doseUnit: 'mcg', typicalDose: '1000' },
  { canonical: 'Vitamin B Complex', aliases: ['b complex', 'b-complex', 'vitamin b complex', 'b vitamins'], type: 'vitamin', doseUnit: 'tablet', typicalDose: '1' },
  { canonical: 'Vitamin C', aliases: ['vitamin c', 'vit c', 'ascorbic acid', 'ascorbate', 'l-ascorbic acid'], type: 'vitamin', doseUnit: 'mg', typicalDose: '1000' },
  { canonical: 'Vitamin K2', aliases: ['vitamin k2', 'vit k2', 'k2', 'mk-7', 'mk7', 'menaquinone'], type: 'vitamin', doseUnit: 'mcg', typicalDose: '100' },
  { canonical: 'Vitamin A', aliases: ['vitamin a', 'vit a', 'retinol', 'beta carotene', 'beta-carotene'], type: 'vitamin', doseUnit: 'IU', typicalDose: '5000' },
  { canonical: 'Vitamin E', aliases: ['vitamin e', 'vit e', 'tocopherol', 'alpha-tocopherol'], type: 'vitamin', doseUnit: 'IU', typicalDose: '400' },
  { canonical: 'Zinc', aliases: ['zinc', 'zinc picolinate', 'zinc gluconate', 'zinc citrate', 'zink'], type: 'supplement', doseUnit: 'mg', typicalDose: '15' },
  { canonical: 'Iron', aliases: ['iron', 'ferrous sulfate', 'ferrous gluconate', 'ferric', 'iron supplement'], type: 'supplement', doseUnit: 'mg', typicalDose: '18' },
  { canonical: 'Calcium', aliases: ['calcium', 'calcium carbonate', 'calcium citrate', 'cal'], type: 'supplement', doseUnit: 'mg', typicalDose: '500' },
  { canonical: 'Folate', aliases: ['folate', 'folic acid', 'vitamin b9', 'b9', 'methylfolate', '5-mthf'], type: 'vitamin', doseUnit: 'mcg', typicalDose: '400' },
  { canonical: 'CoQ10', aliases: ['coq10', 'co q10', 'coenzyme q10', 'ubiquinol', 'ubiquinone', 'coq-10'], type: 'supplement', doseUnit: 'mg', typicalDose: '100' },
  { canonical: 'Ashwagandha', aliases: ['ashwagandha', 'ashwaganda', 'ashwagondha', 'withania somnifera', 'withania', 'ksm-66', 'ksm66', 'sensoril'], type: 'supplement', doseUnit: 'mg', typicalDose: '300' },
  { canonical: 'Creatine Monohydrate', aliases: ['creatine', 'creatine monohydrate', 'creatine hcl', 'creatine hcl', 'creatin'], type: 'supplement', doseUnit: 'g', typicalDose: '5' },
  { canonical: 'NAC (N-Acetyl Cysteine)', aliases: ['nac', 'n-acetyl cysteine', 'n acetyl cysteine', 'n-acetylcysteine', 'acetylcysteine'], type: 'supplement', doseUnit: 'mg', typicalDose: '600' },
  { canonical: 'Probiotics', aliases: ['probiotic', 'probiotics', 'lactobacillus', 'bifidobacterium', 'acidophilus'], type: 'supplement', doseUnit: 'billion CFU', typicalDose: '10' },
  { canonical: 'Collagen', aliases: ['collagen', 'collagen peptides', 'hydrolyzed collagen', 'marine collagen', 'bovine collagen'], type: 'supplement', doseUnit: 'g', typicalDose: '10' },
  { canonical: 'Melatonin', aliases: ['melatonin', 'malatonin', 'sleep supplement', 'sleep aid'], type: 'supplement', doseUnit: 'mg', typicalDose: '3' },
  { canonical: 'L-Theanine', aliases: ['theanine', 'l-theanine', 'l theanine', 'suntheanine'], type: 'supplement', doseUnit: 'mg', typicalDose: '200' },
  { canonical: 'Alpha-GPC', aliases: ['alpha gpc', 'alpha-gpc', 'alphagpc', 'glycerophosphocholine'], type: 'supplement', doseUnit: 'mg', typicalDose: '300' },
  { canonical: 'Lion\'s Mane', aliases: ['lions mane', "lion's mane", 'hericium erinaceus', 'lions mane mushroom'], type: 'supplement', doseUnit: 'mg', typicalDose: '500' },
  { canonical: 'Rhodiola Rosea', aliases: ['rhodiola', 'rhodiola rosea', 'rosavin', 'golden root'], type: 'supplement', doseUnit: 'mg', typicalDose: '400' },
  { canonical: 'Berberine', aliases: ['berberine', 'berberine hcl', 'berberin'], type: 'supplement', doseUnit: 'mg', typicalDose: '500' },
  { canonical: 'Turmeric / Curcumin', aliases: ['turmeric', 'curcumin', 'curcuminoid', 'turmeric extract', 'curcuma'], type: 'supplement', doseUnit: 'mg', typicalDose: '500' },
  { canonical: 'Quercetin', aliases: ['quercetin', 'quercetine', 'quercitin'], type: 'supplement', doseUnit: 'mg', typicalDose: '500' },
  { canonical: 'Resveratrol', aliases: ['resveratrol', 'resveratrole', 'trans-resveratrol'], type: 'supplement', doseUnit: 'mg', typicalDose: '100' },
  { canonical: 'DHEA', aliases: ['dhea', 'dehydroepiandrosterone'], type: 'supplement', doseUnit: 'mg', typicalDose: '25' },
  { canonical: 'Selenium', aliases: ['selenium', 'selenomethionine', 'selenium yeast'], type: 'supplement', doseUnit: 'mcg', typicalDose: '200' },
  { canonical: 'Iodine', aliases: ['iodine', 'potassium iodide', 'kelp iodine'], type: 'supplement', doseUnit: 'mcg', typicalDose: '150' },
  { canonical: 'Biotin', aliases: ['biotin', 'vitamin b7', 'b7', 'vitamin h'], type: 'vitamin', doseUnit: 'mcg', typicalDose: '5000' },
  { canonical: 'Glucosamine', aliases: ['glucosamine', 'glucosamine sulfate', 'glucosamine hcl'], type: 'supplement', doseUnit: 'mg', typicalDose: '1500' },
  { canonical: 'Chondroitin', aliases: ['chondroitin', 'chondroitin sulfate', 'chrondroitin'], type: 'supplement', doseUnit: 'mg', typicalDose: '1200' },
  { canonical: 'MSM', aliases: ['msm', 'methylsulfonylmethane', 'methyl sulfonylmethane'], type: 'supplement', doseUnit: 'mg', typicalDose: '1000' },
  { canonical: 'Spirulina', aliases: ['spirulina', 'spirulina powder', 'blue green algae'], type: 'supplement', doseUnit: 'g', typicalDose: '3' },
  { canonical: 'Chlorella', aliases: ['chlorella', 'chlorella powder'], type: 'supplement', doseUnit: 'g', typicalDose: '3' },
  { canonical: 'Maca Root', aliases: ['maca', 'maca root', 'maca powder', 'lepidium meyenii'], type: 'supplement', doseUnit: 'g', typicalDose: '3' },
  { canonical: 'Saw Palmetto', aliases: ['saw palmetto', 'serenoa repens', 'sabal palm'], type: 'supplement', doseUnit: 'mg', typicalDose: '320' },
  { canonical: 'St. John\'s Wort', aliases: ["st john's wort", 'st johns wort', 'hypericum', 'hypericum perforatum'], type: 'supplement', doseUnit: 'mg', typicalDose: '300' },
  { canonical: 'Valerian Root', aliases: ['valerian', 'valerian root', 'valeriana officinalis'], type: 'supplement', doseUnit: 'mg', typicalDose: '400' },
  { canonical: 'Passionflower', aliases: ['passionflower', 'passion flower', 'passiflora'], type: 'supplement', doseUnit: 'mg', typicalDose: '400' },
  { canonical: 'Holy Basil (Tulsi)', aliases: ['holy basil', 'tulsi', 'ocimum sanctum'], type: 'supplement', doseUnit: 'mg', typicalDose: '300' },
  { canonical: 'Ginkgo Biloba', aliases: ['ginkgo', 'ginkgo biloba', 'gingko', 'gingko biloba'], type: 'supplement', doseUnit: 'mg', typicalDose: '120' },
  { canonical: 'Ginseng', aliases: ['ginseng', 'panax ginseng', 'korean ginseng', 'american ginseng', 'red ginseng'], type: 'supplement', doseUnit: 'mg', typicalDose: '400' },
  { canonical: 'Echinacea', aliases: ['echinacea', 'echinecea', 'echinacea purpurea', 'purple coneflower'], type: 'supplement', doseUnit: 'mg', typicalDose: '300' },
  { canonical: 'Elderberry', aliases: ['elderberry', 'sambucus', 'sambucus nigra', 'elder berry'], type: 'supplement', doseUnit: 'mg', typicalDose: '500' },
  { canonical: 'Multivitamin', aliases: ['multivitamin', 'multi vitamin', 'daily multivitamin', 'men multivitamin', 'women multivitamin', 'prenatal vitamin'], type: 'vitamin', doseUnit: 'tablet', typicalDose: '1' },
];

const fuseIndex = new Fuse(
  SUPPLEMENT_ALIASES.flatMap((s) =>
    [s.canonical, ...s.aliases].map((alias) => ({ alias: alias.toLowerCase(), entry: s })),
  ),
  {
    keys: ['alias'],
    threshold: 0.35,
    distance: 80,
    minMatchCharLength: 2,
  },
);

export interface FuzzyMatch {
  canonical: string;
  type: SupplementType;
  doseUnit: string;
  typicalDose: string;
}

export function fuzzySearchSupplements(query: string, limit = 5): FuzzyMatch[] {
  if (!query.trim()) return [];
  const results = fuseIndex.search(query.toLowerCase().trim(), { limit: limit * 3 });
  const seen = new Set<string>();
  const out: FuzzyMatch[] = [];
  for (const r of results) {
    const key = r.item.entry.canonical;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({
        canonical: r.item.entry.canonical,
        type: r.item.entry.type,
        doseUnit: r.item.entry.doseUnit,
        typicalDose: r.item.entry.typicalDose,
      });
    }
    if (out.length >= limit) break;
  }
  return out;
}
