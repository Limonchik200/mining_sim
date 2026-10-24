import { useGame } from '@/context/GameContext';
import { formatMoney } from '@/config';
import { CRAFT_RECIPES, CRAFT_ITEMS, getCraftItemName, canCraft } from '@/config/craftConfig';
import { isCraftItemUnlocked } from '@/config/levelUnlocks';
import { Hammer, Coins, Gem, TreePine, Layers, Frame, Split, Grid2x2, Archive, Package, Lock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  TreePine,
  Layers,
  Frame,
  Split,
  Grid2x2,
  Archive,
};

export default function CraftPanel() {
  const { state, lang, t, craftItem } = useGame();
  const inv = state.craftInventory || {};

  const materialEntries = Object.entries(CRAFT_ITEMS).filter(
    ([key, item]) => item.category === 'raw' && isCraftItemUnlocked(key, state.level)
  );
  const constructionEntries = Object.entries(CRAFT_ITEMS).filter(
    ([key, item]) => item.category === 'construction' && isCraftItemUnlocked(key, state.level)
  );

  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
          <Hammer className="w-5 h-5 text-primary-500" />
          {lang === 'ru' ? 'Крафт' : (lang === 'uk' ? 'Крафт' : 'Craft')}
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-success-500" />
            <span className="text-sm font-bold text-success-500">{formatMoney(state.balance)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Gem className="w-4 h-4 text-accent-500" />
            <span className="text-sm font-bold text-accent-500">{state.gems}</span>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-4 h-4 text-primary-500" />
          <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
            {lang === 'ru' ? 'Материалы' : (lang === 'uk' ? 'Матеріали' : 'Materials')}
          </h3>
          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {materialEntries.map(([key, item]) => (
            <div key={key} className="rounded-xl p-3 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:border-neutral-800 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: item.color + '20' }}>
                {(() => {
                  const Icon = ICON_MAP[item.icon] || Package;
                  return <Icon className="w-4.5 h-4.5" style={{ color: item.color }} />;
                })()}
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{getCraftItemName(key, lang)}</div>
                <div className="text-xs text-neutral-400">{inv[key] || 0} {lang === 'ru' ? 'шт.' : (lang === 'uk' ? 'шт.' : 'pcs.')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Frame className="w-4 h-4 text-accent-500" />
          <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
            {lang === 'ru' ? 'Рецепты' : (lang === 'uk' ? 'Рецепти' : 'Recipes')}
          </h3>
          <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
        </div>
        <div className="space-y-3">
          {CRAFT_RECIPES
            .filter((r) => !(r.result === 'food_cabinet' && (state.craftInventory?.food_cabinet ?? 0) > 0))
            .filter((r) => isCraftItemUnlocked(r.result, state.level))
            .map((recipe, idx) => {
            const realIdx = CRAFT_RECIPES.indexOf(recipe);
            const Icon = ICON_MAP[recipe.icon] || Package;
            const recipeCanCraft = canCraft(recipe, inv);
            const resultName = lang === 'ru' ? recipe.resultNameRu : (lang === 'uk' ? recipe.resultNameUk : recipe.resultNameEn);
            const desc = lang === 'ru' ? recipe.descriptionRu : (lang === 'uk' ? recipe.descriptionUk : recipe.descriptionEn);
            return (
              <div key={idx} className="rounded-xl p-4 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:bg-neutral-800">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: recipe.color + '20' }}>
                      <Icon className="w-5 h-5" style={{ color: recipe.color }} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">{resultName}</div>
                      <div className="text-xs text-neutral-400">{desc}</div>
                    </div>
                  </div>
                  {inv[recipe.result] > 0 && (
                    <span className="text-xs font-bold text-success-500 bg-success-500/10 px-2 py-0.5 rounded-md">
                      {inv[recipe.result]} {lang === 'ru' ? 'шт.' : (lang === 'uk' ? 'шт.' : 'pcs.')}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {recipe.ingredients.map((ing, i) => {
                    const ingItem = CRAFT_ITEMS[ing.type];
                    const IngIcon = ICON_MAP[ingItem?.icon] || Package;
                    const have = inv[ing.type] || 0;
                    const enough = have >= ing.amount;
                    return (
                      <span key={i} className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1 font-medium ${enough ? 'bg-success-500/10 text-success-600' : 'bg-error-500/10 text-error-500'}`}>
                        <IngIcon className="w-3 h-3" />
                        {getCraftItemName(ing.type, lang)}: {have}/{ing.amount}
                      </span>
                    );
                  })}
                </div>
                <button
                  onClick={() => craftItem(realIdx)}
                  disabled={!recipeCanCraft}
                  className={`btn w-full py-2 text-sm rounded-lg flex items-center justify-center gap-1.5 ${
                    recipeCanCraft
                      ? 'bg-primary-500 text-white hover:bg-primary-600'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                  }`}
                >
                  <Hammer className="w-4 h-4" />
                  {recipeCanCraft
                    ? (lang === 'ru' ? 'Скрафтить' : (lang === 'uk' ? 'Скрафтити' : 'Craft'))
                    : (lang === 'ru' ? 'Не хватает материалов' : (lang === 'uk' ? 'Бракує матеріалів' : 'Not enough materials'))
                  }
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {constructionEntries.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Archive className="w-4 h-4 text-success-500" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              {lang === 'ru' ? 'Конструкции' : (lang === 'uk' ? 'Конструкції' : 'Constructions')}
            </h3>
            <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {constructionEntries.map(([key, item]) => (
              <div key={key} className="rounded-xl p-3 bg-neutral-50 dark:bg-neutral-850/50 border border-neutral-200 dark:bg-neutral-800 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: item.color + '20' }}>
                  {(() => {
                    const Icon = ICON_MAP[item.icon] || Package;
                    return <Icon className="w-4.5 h-4.5" style={{ color: item.color }} />;
                  })()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{getCraftItemName(key, lang)}</div>
                  <div className="text-xs text-neutral-400">{inv[key] || 0} {lang === 'ru' ? 'шт.' : (lang === 'uk' ? 'шт.' : 'pcs.')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
