export function makeThreadKeyFromCard(card: { id: string; slug?: string }) {
  return `pc_${card.id}`;
}
