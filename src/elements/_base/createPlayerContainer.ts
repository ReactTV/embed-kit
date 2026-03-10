export interface CreatePlayerContainerOptions {
  width?: number | string | undefined;
  height?: number | string | undefined;
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

  const { width = "100%", height = "100%", overflow = "hidden" } = options;
  div.style.width = typeof width === "number" ? `${width}px` : width;
  div.style.height = typeof height === "number" ? `${height}px` : height;
  div.style.overflow = overflow;

  container.appendChild(div);
  return { element: div, id };
}
