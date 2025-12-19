// Types for drag and drop with @dnd-kit
export type DragItemType = "file" | "folder";

export interface DragItem {
  id: string;
  type: DragItemType;
  name: string;
  currentFolderId?: string | null;
}

// Helper to create draggable ID
export const createDraggableId = (type: DragItemType, id: string): string => {
  return `${type}-${id}`;
};

// Helper to parse draggable ID
export const parseDraggableId = (
  draggableId: string
): { type: DragItemType; id: string } | null => {
  const parts = draggableId.split("-");
  if (parts.length < 2) return null;

  const type = parts[0] as DragItemType;
  const id = parts.slice(1).join("-");

  if (type !== "file" && type !== "folder") return null;

  return { type, id };
};

// Check if drop is valid
export const isValidDrop = (
  dragItem: DragItem,
  targetFolderId: string | null
): boolean => {
  // Can't drop item into its current folder
  if (dragItem.currentFolderId === targetFolderId) {
    return false;
  }

  // Can't drop folder into itself
  if (dragItem.type === "folder" && dragItem.id === targetFolderId) {
    return false;
  }

  return true;
};
