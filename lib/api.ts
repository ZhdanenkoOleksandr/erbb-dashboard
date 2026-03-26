import { Business } from "./types";
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const fetchBusinesses = async (): Promise<Business[]> => {
  await delay(600);
  return [
    { id:"1", name:"Auto Center Kyiv", lat:50.4501, lng:30.5234, status:"CONNECTED", auraScore:82, address:"15 Khreshchatyk St", phone:"+380 44 123 4567", category:"Automotive" },
    { id:"2", name:"WOG Gas Station", lat:50.451, lng:30.52, status:"NOT_CONNECTED", address:"8 Vasylkivska St", phone:"+380 44 234 5678", category:"Fuel" },
    { id:"3", name:"Master Car Service", lat:50.452, lng:30.525, status:"HIGH_POTENTIAL", auraScore:67, address:"22 Antonovycha St", phone:"+380 44 345 6789", category:"Car Service" },
    { id:"4", name:"CityMall Shopping", lat:50.4485, lng:30.5267, status:"CONNECTED", auraScore:91, address:"3 Baseina St", phone:"+380 44 456 7890", category:"Retail" },
    { id:"5", name:"Pravda Beer Theatre", lat:50.4532, lng:30.5198, status:"HIGH_POTENTIAL", auraScore:74, address:"32 Rohnidynska St", phone:"+380 44 567 8901", category:"Restaurant" },
    { id:"6", name:"Smart Pharmacy", lat:50.4495, lng:30.5315, status:"NOT_CONNECTED", address:"7 Saksahanskoho St", phone:"+380 44 678 9012", category:"Healthcare" },
    { id:"7", name:"Silpo Supermarket", lat:50.4518, lng:30.5155, status:"CONNECTED", auraScore:88, address:"12 Lva Tolstoho St", phone:"+380 44 789 0123", category:"Grocery" },
  ];
};
export const connectBusiness = async (id: string): Promise<{ success: boolean }> => {
  await delay(1200); return { success: true };
};