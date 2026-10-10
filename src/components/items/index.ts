export type ItemId = 'item_bag';

export interface ItemConfig {
  id: ItemId;
  nameUk: string;
  nameEn: string;
  nameRu: string;
  icon: string;
  color: string;
  descriptionUk: string;
  descriptionEn: string;
  descriptionRu: string;
}

export const ITEMS_CONFIG: Record<ItemId, ItemConfig> = {
  item_bag: {
    id: 'item_bag',
    nameUk: 'Сумка з предметом',
    nameEn: 'Item Bag',
    nameRu: 'Сумка с предметом',
    icon: 'ShoppingBag',
    color: '#f59e0b',
    descriptionUk: 'Отримайте з кейсів',
    descriptionEn: 'Obtain from cases',
    descriptionRu: 'Получите из кейсов',
  },
};

export function getItemConfig(id: ItemId): ItemConfig {
  return ITEMS_CONFIG[id] || ITEMS_CONFIG.item_bag;
}
