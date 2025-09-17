export type ServiceOption = { value: string; label: string; keywords?: string[] };
export type ServiceGroup = { id: string; label: string; icon?: string; children: ServiceOption[] };

/** Groups use `icon`, children labels are PLAIN (no emojis here) */
export const SERVICE_GROUPS: ServiceGroup[] = [
  {
    id: 'hair',
    label: 'Hair',
    icon: '💇',
    children: [
      { value: 'hair-braids', label: 'Hair Braids', keywords: ['braid','plait','cornrows'] },
      { value: 'haircut', label: 'Haircut', keywords: ['cut','trim'] },
      { value: 'hair-coloring', label: 'Hair Coloring', keywords: ['dye','balayage','color'] },
      { value: 'hair-styling', label: 'Hair Styling', keywords: ['style','updo','blowout'] },
    ],
  },
  {
    id: 'nails',
    label: 'Nails',
    icon: '💅',
    children: [
      { value: 'manicure', label: 'Manicure' },
      { value: 'pedicure', label: 'Pedicure' },
      { value: 'nail-extensions', label: 'Nail Extensions', keywords: ['acrylic','gel'] },
      { value: 'nail-art', label: 'Nail Art', keywords: ['design'] },
    ],
  },
  {
    id: 'lashes-brows',
    label: 'Lashes & Brows',
    icon: '👁️',
    children: [
      { value: 'eyelash-extensions', label: 'Eyelash Extensions', keywords: ['classic','volume','hybrid'] },
      { value: 'lash-lift', label: 'Lash Lift' },
      { value: 'brow-lamination', label: 'Brow Lamination' },
      { value: 'brow-shaping', label: 'Brow Shaping', keywords: ['wax','thread'] },
      { value: 'brow-tint', label: 'Brow Tint' },
    ],
  },
  {
    id: 'cosmetology',
    label: 'Cosmetology',
    icon: '✨',
    children: [
      { value: 'cosmetology-consult', label: 'Cosmetology Consultation', keywords: ['derma'] },
      { value: 'botox', label: 'Botox Injections', keywords: ['botulinum','anti-wrinkle'] },
      { value: 'lip-fillers', label: 'Lip Fillers', keywords: ['hyaluronic'] },
      { value: 'cheek-fillers', label: 'Cheek Fillers' },
      { value: 'nasolabial-fillers', label: 'Nasolabial Fold Fillers' },
      { value: 'mesotherapy', label: 'Mesotherapy' },
      { value: 'microneedling', label: 'Microneedling' },
      { value: 'chemical-peel', label: 'Chemical Peel', keywords: ['peeling','aha','bha'] },
      { value: 'prp', label: 'PRP (Plasma Therapy)', keywords: ['vampire facial'] },
      { value: 'laser-hair-removal', label: 'Laser Hair Removal', keywords: ['epilation'] },
      { value: 'facial', label: 'Facial Treatment', keywords: ['cleaning','hydration'] },
    ],
  },
  {
    id: 'makeup',
    label: 'Makeup',
    icon: '💄',
    children: [
      { value: 'makeup-day', label: 'Day Makeup' },
      { value: 'makeup-evening', label: 'Evening Makeup' },
      { value: 'makeup-bridal', label: 'Bridal Makeup' },
    ],
  },
  {
    id: 'depilation',
    label: 'Depilation',
    icon: '🧴',
    children: [
      { value: 'waxing', label: 'Waxing' },
      { value: 'sugaring', label: 'Sugaring' },
    ],
  },
  {
    id: 'massage',
    label: 'Massage',
    icon: '💆',
    children: [
      { value: 'massage-classic', label: 'Classic Massage' },
      { value: 'massage-lymphatic', label: 'Lymphatic Massage' },
      { value: 'massage-sport', label: 'Sport Massage' },
      { value: 'massage-face', label: 'Face Massage' },
    ],
  },
  {
    id: 'tattoo',
    label: 'Tattoo',
    icon: '🖊️',
    children: [
      { value: 'tattoo', label: 'Tattoo' },
      { value: 'fine-line-tattoo', label: 'Fine Line Tattoo' },
      { value: 'sleeve-tattoo', label: 'Sleeve Tattoo' },
      { value: 'tattoo-removal-laser', label: 'Tattoo Removal (Laser)' },
    ],
  },
];

export function findServiceLabel(value: string): string {
  for (const g of SERVICE_GROUPS) {
    const o = g.children.find(c => c.value === value);
    if (o) return o.label;
  }
  return value;
}