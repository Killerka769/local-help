const SHARED_STATUSES = new Set([
  "approved",
  "completed_by_executor",
  "completed",
]);

export function isContactStatus(status: string): boolean {
  return SHARED_STATUSES.has(status);
}

export function viewerCanSeeRequestAddress(params: {
  viewerId: string | null;
  authorId: string;
  offers: { userId: string; status: string }[];
}): boolean {
  const { viewerId, authorId, offers } = params;
  if (!viewerId) return false;
  if (viewerId === authorId) return true;
  return offers.some(
    (offer) => offer.userId === viewerId && isContactStatus(offer.status)
  );
}

export function viewerCanSeeAuthorPhone(params: {
  viewerId: string | null;
  authorId: string;
  offers: { userId: string; status: string }[];
}): boolean {
  return viewerCanSeeRequestAddress(params);
}

export function viewerCanSeeOfferPhone(params: {
  viewerId: string | null;
  authorId: string;
  offerUserId: string;
  offerStatus: string;
}): boolean {
  const { viewerId, authorId, offerUserId, offerStatus } = params;
  if (!viewerId) return false;
  if (!isContactStatus(offerStatus)) return false;
  return viewerId === authorId || viewerId === offerUserId;
}
