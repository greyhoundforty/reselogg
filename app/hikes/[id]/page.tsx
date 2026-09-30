import { HikeDetail } from "@/components/hike-detail";

export default async function HikePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HikeDetail hikeId={id} />;
}
