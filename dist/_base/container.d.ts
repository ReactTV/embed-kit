export interface CreatePlayerContainerOptions {
    width?: string | number;
    height?: string | number;
    overflow?: string;
}
/**
 * Create a div with a unique id and optional dimensions, append it to the container,
 * and return the element and its id. Used by providers whose SDK mounts into a
 * container found by document.getElementById (e.g. Dailymotion, YouTube).
 */
export declare function createPlayerContainer(container: HTMLElement, idPrefix: string, options?: CreatePlayerContainerOptions): {
    element: HTMLDivElement;
    id: string;
};
//# sourceMappingURL=container.d.ts.map