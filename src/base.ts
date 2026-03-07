/**
 * Shared contract for embed providers.
 * Each provider (YouTube, Twitch, etc.) implements this interface.
 */

export interface EmbedOptions {
  [key: string]: unknown;
}

export interface ParsedEmbed {
  id: string;
  provider: string;
}

export interface EmbedProvider {
  readonly name: string;

  /** Build the embed URL for the given media ID and options. */
  getEmbedUrl(id: string, options?: EmbedOptions): string;

  /** Parse a source URL and return provider id + provider name if recognized. */
  parseSourceUrl(url: string): ParsedEmbed | null;
}
