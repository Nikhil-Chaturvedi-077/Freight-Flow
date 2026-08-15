export const LOAD_STATUS_CONFIG = {
  OPEN: {
    label: "Open",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  BIDDING_CLOSED: {
    label: "Bidding Closed",
    color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  },
  IN_TRANSIT: {
    label: "In Transit",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  ARRIVED: {
    label: "Arrived",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  DELIVERED: {
    label: "Delivered",
    color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
} as const;

export const BID_STATUS_CONFIG = {
  ACTIVE: {
    label: "Active",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  OUTBID: {
    label: "Outbid",
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
  ACCEPTED: {
    label: "Accepted",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  },
} as const;

export const MATERIAL_TYPES = [
  { value: "STEEL", label: "Steel" },
  { value: "PHARMA", label: "Pharma" },
  { value: "AGRI", label: "Agriculture" },
  { value: "MACHINERY", label: "Machinery" },
  { value: "ELECTRONICS", label: "Electronics" },
  { value: "CHEMICALS", label: "Chemicals" },
  { value: "TEXTILE", label: "Textile" },
  { value: "FMCG", label: "FMCG" },
  { value: "OTHER", label: "Other" },
] as const;

export const PACKAGING_TYPES = [
  { value: "PALLETS", label: "Pallets" },
  { value: "CRATES", label: "Crates" },
  { value: "LOOSE", label: "Loose" },
  { value: "DRUMS", label: "Drums" },
  { value: "BAGS", label: "Bags" },
  { value: "BOXES", label: "Boxes" },
] as const;

export const BID_RATE_LIMIT_SECONDS = 30;
export const PLATFORM_FEE_PERCENT = 2.5;
export const GST_RATE = 18;