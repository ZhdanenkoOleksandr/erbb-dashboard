export type BusinessStatus = "CONNECTED" | "NOT_CONNECTED" | "HIGH_POTENTIAL";
export interface Business {
  id: string; name: string; lat: number; lng: number;
  status: BusinessStatus; auraScore?: number;
  address?: string; phone?: string; category?: string;
}
export interface MapFilters {
  showConnected: boolean; showNotConnected: boolean; showHighPotential: boolean;
}
export const STATUS_COLORS: Record<BusinessStatus, string> = {
  CONNECTED: "#00FF9F", NOT_CONNECTED: "#FF4D4F", HIGH_POTENTIAL: "#FFC857",
};
export const STATUS_LABELS: Record<BusinessStatus, string> = {
  CONNECTED: "Connected", NOT_CONNECTED: "Not Connected", HIGH_POTENTIAL: "High Potential",
};