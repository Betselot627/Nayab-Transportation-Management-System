/**
 * NTMS Automated Transportation Pricing Engine
 *
 * Calculates estimated shipment prices based on:
 * - Origin & destination road distance (Ethiopian logistics matrix)
 * - Vehicle type and cargo weight
 * - Base rate & dynamic surcharge
 */

// Road distances (in km) from Addis Ababa and major transport corridors
const CITY_DISTANCES_FROM_ADDIS = {
  "addis ababa": 0,
  "finfinne": 0,
  "adama": 99,
  "nazret": 99,
  "bishoftu": 45,
  "debre zeit": 45,
  "hawassa": 275,
  "shashemene": 250,
  "bahir dar": 565,
  "gondar": 658,
  "dire dawa": 450,
  "harar": 520,
  "jigjiga": 620,
  "mekelle": 780,
  "jimma": 350,
  "debre markos": 300,
  "dessie": 400,
  "kombolcha": 375,
  "arba minch": 505,
  "sodo": 390,
  "dilla": 360,
  "nekemte": 330,
  "asosa": 670,
  "semera": 590,
  "logiya": 580,
  "moyale": 770,
};

const VEHICLE_RATES_PER_KM = {
  pickup: 25, // ETB / km
  van: 35,
  truck: 55,
  trailer: 85,
  other: 40,
};

const BASE_FLAG_FEE = 500; // Base dispatch fee in ETB

/**
 * Estimate road distance between two cities in Ethiopia
 */
const estimateDistance = (pickupCity = "", deliveryCity = "") => {
  const pCity = (pickupCity || "").toLowerCase().trim();
  const dCity = (deliveryCity || "").toLowerCase().trim();

  if (!pCity || !dCity || pCity === dCity) {
    return 25; // Intra-city local transit (25 km avg)
  }

  const pDist = CITY_DISTANCES_FROM_ADDIS[pCity];
  const dDist = CITY_DISTANCES_FROM_ADDIS[dCity];

  if (pDist !== undefined && dDist !== undefined) {
    if (pCity === "addis ababa" || pCity === "finfinne") return Math.max(dDist, 25);
    if (dCity === "addis ababa" || dCity === "finfinne") return Math.max(pDist, 25);
    // Rough triangle approximation for inter-regional trips via transit hub
    return Math.max(Math.abs(pDist - dDist), Math.round((pDist + dDist) * 0.75));
  }

  if (pDist !== undefined) return Math.max(pDist, 80);
  if (dDist !== undefined) return Math.max(dDist, 80);

  return 150; // Default reasonable corridor distance if unlisted
};

/**
 * Calculate automated shipment price
 * @param {Object} params
 * @param {string} params.pickupCity
 * @param {string} params.deliveryCity
 * @param {number} params.weight - weight in kg or ton
 * @param {string} params.unit - 'kg' or 'ton'
 * @param {string} params.vehicleType - 'pickup', 'van', 'truck', 'trailer'
 * @param {number} [params.distanceKm] - optional manual distance
 * @returns {Object} Price breakdown in ETB
 */
const calculateShipmentPrice = ({
  pickupCity = "",
  deliveryCity = "",
  weight = 100,
  unit = "kg",
  vehicleType = "truck",
  distanceKm,
}) => {
  const dist = distanceKm && distanceKm > 0
    ? distanceKm
    : estimateDistance(pickupCity, deliveryCity);

  const weightInKg = unit === "ton" ? parseFloat(weight) * 1000 : parseFloat(weight) || 100;
  
  // Recommend vehicle type if not explicitly matched
  let inferredVehicleType = vehicleType || "truck";
  if (!vehicleType) {
    if (weightInKg <= 1000) inferredVehicleType = "pickup";
    else if (weightInKg <= 3500) inferredVehicleType = "van";
    else if (weightInKg <= 12000) inferredVehicleType = "truck";
    else inferredVehicleType = "trailer";
  }

  const ratePerKm = VEHICLE_RATES_PER_KM[inferredVehicleType] || 45;
  const distanceCost = Math.round(dist * ratePerKm);

  // Weight surcharge for heavy loads (over 1000kg, +1.5 ETB per kg)
  let weightSurcharge = 0;
  if (weightInKg > 1000) {
    weightSurcharge = Math.round((weightInKg - 1000) * 1.5);
  }

  const totalAmount = Math.max(BASE_FLAG_FEE + distanceCost + weightSurcharge, 800);

  return {
    distanceKm: dist,
    baseFee: BASE_FLAG_FEE,
    distanceCost,
    weightSurcharge,
    totalAmount,
    ratePerKm,
    vehicleType: inferredVehicleType,
    currency: "ETB",
  };
};

module.exports = {
  estimateDistance,
  calculateShipmentPrice,
  CITY_DISTANCES_FROM_ADDIS,
  VEHICLE_RATES_PER_KM,
};
