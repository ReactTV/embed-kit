import type React from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "youtube-video": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { src?: string; muted?: boolean | undefined },
        HTMLElement
      >;
      "vimeo-video": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { src?: string; muted?: boolean | undefined },
        HTMLElement
      >;
      "twitch-video": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { src?: string; muted?: boolean | undefined },
        HTMLElement
      >;
      "tiktok-video": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { src?: string; muted?: boolean | undefined },
        HTMLElement
      >;
      "dailymotion-video": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { src?: string; muted?: boolean | undefined },
        HTMLElement
      >;
    }
  }
}

export {};
