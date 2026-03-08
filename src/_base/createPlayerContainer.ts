export interface CreatePlayerContainerOptions {
  width?: number;
  height?: number;
  overflow?: string;
}

/**
 * Create a div with a unique id and optional dimensions, append it to the container,
 * and return the element and its id. Used by providers whose SDK mounts into a
 * container found by document.getElementById (e.g. Dailymotion, YouTube).
 */
export function createPlayerContainer(
  container: HTMLElement,
  idPrefix: string,
  options: CreatePlayerContainerOptions = {}
): { element: HTMLDivElement; id: string } {
  const id = `${idPrefix}-${Math.random().toString(36).slice(2, 11)}`;
  const div = document.createElement("div");
  div.id = id;

  const { width, height, overflow = "hidden" } = options;
  if (width !== undefined) div.style.width = `${width}px`;
  if (height !== undefined) div.style.height = `${height}px`;
  div.style.overflow = overflow;

  container.appendChild(div);
  return { element: div, id };
}
