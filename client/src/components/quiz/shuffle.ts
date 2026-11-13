export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

const orders = new Map<string, string[]>();

export function shuffledOptions<T extends { id: string }>(
  itemId: string,
  options: readonly T[],
): T[] {
  let order = orders.get(itemId);
  if (!order || order.length !== options.length) {
    order = shuffle(options.map((o) => o.id));
    orders.set(itemId, order);
  }
  return order.map((id) => options.find((o) => o.id === id)!);
}
