import { Explorer } from "@/components/explorer/Explorer";
import { loadBoundary } from "@/lib/boundary";
import { listCategories, listEvents, listPlaces } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const events = listEvents({ status: "published" });
  const places = listPlaces({ status: "published" });
  const categories = listCategories();

  return (
    <Explorer
      events={events}
      places={places}
      categories={categories}
      boundary={loadBoundary()}
      googleApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
      googleMapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? ""}
    />
  );
}
