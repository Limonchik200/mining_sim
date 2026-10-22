import type { CraftItem, CraftRecipe, RawMaterialType, ConstructionType } from '@/types/craft';

export const CRAFT_ITEMS: Record<string, CraftItem> = {
  wood_log: {
    type: 'wood_log',
    category: 'raw',
    nameUk: 'Колода',
    nameEn: 'Wood Log',
    nameRu: 'Бревно',
    icon: 'TreePine',
    color: '#92400e',
    weight: 0.5,
  },
  steel_plank: {
    type: 'steel_plank',
    category: 'raw',
    nameUk: 'Планка',
    nameEn: 'Steel Plank',
    nameRu: 'Планка',
    icon: 'Layers',
    color: '#94a3b8',
    weight: 0.3,
  },
  wooden_bracing: {
    type: 'wooden_bracing',
    category: 'construction',
    nameUk: 'Дерев\'яне кріплення',
    nameEn: 'Wooden Bracing',
    nameRu: 'Деревянное крепление',
    icon: 'Frame',
    color: '#a16207',
    weight: 2,
    descriptionUk: 'Підсилює стіни шахти',
    descriptionEn: 'Reinforces mine walls',
    descriptionRu: 'Усиливает стены шахты',
  },
  rails: {
    type: 'rails',
    category: 'construction',
    nameUk: 'Рейки',
    nameEn: 'Rails',
    nameRu: 'Рельсы',
    icon: 'Split',
    color: '#64748b',
    weight: 3,
    descriptionUk: 'Для вагонетки',
    descriptionEn: 'For mine cart',
    descriptionRu: 'Для вагонетки',
  },
  shelf: {
    type: 'shelf',
    category: 'construction',
    nameUk: 'Стелаж',
    nameEn: 'Shelf',
    nameRu: 'Стеллаж',
    icon: 'Grid2x2',
    color: '#0891b2',
    weight: 5,
    descriptionUk: 'Місткість 4м²',
    descriptionEn: 'Capacity 4m²',
    descriptionRu: 'Вместимость 4м²',
  },
  food_cabinet: {
    type: 'food_cabinet',
    category: 'construction',
    nameUk: 'Шафа для їжі',
    nameEn: 'Food Cabinet',
    nameRu: 'Шкаф для еды',
    icon: 'Archive',
    color: '#16a34a',
    weight: 4,
    descriptionUk: 'Місткість 100 шт їжі',
    descriptionEn: 'Capacity 100 food items',
    descriptionRu: 'Вместимость 100 шт еды',
  },
};

export const CRAFT_RECIPES: CraftRecipe[] = [
  {
    result: 'wooden_bracing',
    resultNameUk: 'Дерев\'яне кріплення',
    resultNameEn: 'Wooden Bracing',
    resultNameRu: 'Деревянное крепление',
    icon: 'Frame',
    color: '#a16207',
    ingredients: [{ type: 'wood_log', amount: 8 }],
    descriptionUk: '8 колод',
    descriptionEn: '8 wood logs',
    descriptionRu: '8 бревен',
  },
  {
    result: 'rails',
    resultNameUk: 'Рейки',
    resultNameEn: 'Rails',
    resultNameRu: 'Рельсы',
    icon: 'Split',
    color: '#64748b',
    ingredients: [
      { type: 'wood_log', amount: 5 },
      { type: 'steel_plank', amount: 2 },
    ],
    descriptionUk: '5 колод + 2 планки',
    descriptionEn: '5 wood logs + 2 steel planks',
    descriptionRu: '5 бревен + 2 планки',
  },
  {
    result: 'shelf',
    resultNameUk: 'Стелаж',
    resultNameEn: 'Shelf',
    resultNameRu: 'Стеллаж',
    icon: 'Grid2x2',
    color: '#0891b2',
    ingredients: [
      { type: 'wood_log', amount: 12 },
      { type: 'steel_plank', amount: 32 },
    ],
    descriptionUk: '12 колод + 32 планки (місткість 4м²)',
    descriptionEn: '12 wood logs + 32 steel planks (capacity 4m²)',
    descriptionRu: '12 бревен + 32 планки (вместимость 4м²)',
  },
  {
    result: 'food_cabinet',
    resultNameUk: 'Шафа для їжі',
    resultNameEn: 'Food Cabinet',
    resultNameRu: 'Шкаф для еды',
    icon: 'Archive',
    color: '#16a34a',
    ingredients: [{ type: 'wood_log', amount: 5 }],
    descriptionUk: '5 колод (назавжди, місткість 100 шт)',
    descriptionEn: '5 wood logs (permanent, capacity 100)',
    descriptionRu: '5 бревен (навсегда, вместимость 100)',
  },
];

export function getCraftItemName(type: string, lang: 'uk' | 'en' | 'ru'): string {
  const item = CRAFT_ITEMS[type];
  if (!item) return type;
  if (lang === 'ru') return item.nameRu;
  if (lang === 'uk') return item.nameUk;
  return item.nameEn;
}

export function canCraft(recipe: CraftRecipe, inventory: Record<string, number>): boolean {
  return recipe.ingredients.every((ing) => (inventory[ing.type] || 0) >= ing.amount);
}

export function craftRecipe(recipe: CraftRecipe, inventory: Record<string, number>): Record<string, number> | null {
  if (!canCraft(recipe, inventory)) return null;
  const newInv = { ...inventory };
  for (const ing of recipe.ingredients) {
    newInv[ing.type] = (newInv[ing.type] || 0) - ing.amount;
  }
  newInv[recipe.result] = (newInv[recipe.result] || 0) + 1;
  return newInv;
}
