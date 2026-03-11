import type React from "react";

/* eslint-disable @typescript-eslint/no-namespace */

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "youtube-video": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          muted?: boolean | undefined;
          width?: number | undefined;
          height?: number | undefined;
          controls?: string | undefined;
          captions?: string | undefined;
          annotations?: string | undefined;
          playing?: string | undefined;
          volume?: number | undefined;
        },
        HTMLElement
      >;
      "vimeo-video": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { src?: string; muted?: boolean | undefined },
        HTMLElement
      >;
      "twitch-video": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          muted?: boolean | undefined;
          playing?: string | undefined;
          width?: number | undefined;
          height?: number | undefined;
          controls?: string | undefined;
          captions?: string | undefined;
          annotations?: string | undefined;
          volume?: number | undefined;
        },
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
