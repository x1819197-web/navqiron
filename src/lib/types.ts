export type CategoryKind = "event" | "place";
export type Status = "published" | "draft";

export interface Category {
  id: number;
  slug: string;
  name: string;
  color: string;
  icon: string;
  kind: CategoryKind;
}

export interface EventItem {
  id: number;
  slug: string;
  title: string;
  description: string;
  categoryId: number;
  lat: number;
  lng: number;
  venue: string;
  address: string;
  startsAt: string;
  endsAt: string | null;
  organizer: string;
  isFree: boolean;
  price: string | null;
  capacity: number | null;
  registered: number;
  status: Status;
  createdAt: string;
  category: Category;
  friendsGoing?: number;
}

export interface PlaceItem {
  id: number;
  slug: string;
  name: string;
  description: string;
  categoryId: number;
  lat: number;
  lng: number;
  address: string;
  workingHours: string | null;
  phone: string | null;
  url: string | null;
  status: Status;
  createdAt: string;
  category: Category;
}

export interface Stats {
  upcomingEvents: number;
  places: number;
  registered: number;
  freeEvents: number;
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
}

export interface UserAccount {
  id: number;
  name: string;
  phone: string;
  createdAt: string;
}

export interface FriendSummary {
  id: number;
  name: string;
  phone: string;
  initials: string;
  since: string;
  freeUntil: string | null;
  freeNote: string | null;
}

export interface FriendRequestItem {
  id: number;
  user: FriendSummary;
  createdAt: string;
}

export interface FreeFriend {
  id: number;
  name: string;
  initials: string;
  lat: number;
  lng: number;
  note: string;
  until: string;
}

export interface FreeStatus {
  until: string;
  note: string;
  lat: number | null;
  lng: number | null;
}

export type Relation = "self" | "none" | "friends" | "incoming" | "outgoing" | "blocked";

export interface PublicUser {
  id: number;
  name: string;
  initials: string;
  phone: string | null;
  relation: Relation;
  freeUntil: string | null;
  freeNote: string | null;
}

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  eventId: number | null;
  createdAt: string;
  readAt: string | null;
}

export interface FriendsOverview {
  friends: FriendSummary[];
  incoming: FriendRequestItem[];
  outgoing: FriendRequestItem[];
  free: FreeFriend[];
  freeStatus: FreeStatus | null;
  notifications: AppNotification[];
  unread: number;
}

export interface MapPoint {
  key: string;
  kind: CategoryKind;
  entityId: number;
  slug: string;
  title: string;
  lat: number;
  lng: number;
  color: string;
  icon: string;
  categoryName: string;
  meta: string;
}

export interface Boundary {
  coordinates: [number, number][];
  bbox: [number, number, number, number];
  center: [number, number];
}

export type TransitKind = "metro" | "bus";

export interface TransitStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  kind: TransitKind;
}

export interface Registration {
  id: number;
  eventId: number;
  name: string;
  phone: string;
  createdAt: string;
}

export type ApiList<T> = { data: T[]; meta: { total: number } };
