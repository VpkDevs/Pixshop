/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
export type ImageSize = "1K" | "2K" | "4K";
export type VideoResolution = "720p" | "1080p";

export interface GenerationConfig {
    aspectRatio: AspectRatio;
    imageSize: ImageSize;
}