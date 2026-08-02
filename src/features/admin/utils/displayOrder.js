export function reorderById(items, draggedId, targetId, getId) {
  const fromIndex = items.findIndex((item) => getId(item) === draggedId);
  const toIndex = items.findIndex((item) => getId(item) === targetId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return items;

  const reordered = [...items];
  const [dragged] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, dragged);
  return reordered.map((item, index) => ({ ...item, displayOrder: index + 1 }));
}
