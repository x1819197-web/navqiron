import { AppExperience } from "@/components/app/AppExperience";
import { loadBoundary } from "@/lib/boundary";
import { friendGoingCounts } from "@/lib/friends";
import { listCategories, listEvents, listPlaces } from "@/lib/queries";
import { getUserSession } from "@/lib/user-auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getUserSession();
  const going = user ? await friendGoingCounts(user.id) : {};
  const events = (await listEvents({ status: "published" })).map((event) => ({
    ...event,
    friendsGoing: going[event.id] ?? 0,
  }));
  const places = await listPlaces({ status: "published" });
  const categories = await listCategories();

  return (
    <AppExperience
      user={user}
      events={events}
      places={places}
      categories={categories}
      boundary={loadBoundary()}
      googleApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
      googleMapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? ""}
    />
  );
}
