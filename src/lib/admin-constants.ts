export const BANNER_PLACEMENTS = ["top", "hero", "mid", "featured_link", "sidebar"] as const;

export const BANNER_PLACEMENT_LABELS: Record<string, string> = {
  top: "Top strip (above header)",
  hero: "Home hero carousel",
  mid: "Home mid-page carousel",
  featured_link: "Home \"More products\" tiles",
  sidebar: "Home sidebar ads",
};

export const ORDER_STATUSES = ["pending", "processing", "completed", "cancelled"] as const;
