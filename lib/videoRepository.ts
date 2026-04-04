import videos from "@/data/video_taxonomy_ssot.json";
import type { VideoItem } from "@/types/workout";

export interface VideoRepository {
  getAllVideos(): Promise<VideoItem[]>;
}

class LocalVideoRepository implements VideoRepository {
  async getAllVideos(): Promise<VideoItem[]> {
    return videos as VideoItem[];
  }
}

export function createVideoRepository(): VideoRepository {
  return new LocalVideoRepository();
}
