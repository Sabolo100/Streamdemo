import { createVideoRepository } from "@/lib/videoRepository";
import WorkoutBuilderApp from "@/components/WorkoutBuilderApp";

export default async function Page() {
  const repository = createVideoRepository();
  const videos = await repository.getAllVideos();

  return <WorkoutBuilderApp videos={videos} />;
}
