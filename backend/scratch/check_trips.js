require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const trips = await prisma.trip.findMany({
      include: {
        driver: true,
        vehicle: true,
        shipment: true
      }
    });
    console.log("Total trips found:", trips.length);
    for (const trip of trips) {
      console.log(`Trip ID: ${trip.id}`);
      console.log(`Trip Number: ${trip.tripNumber}`);
      console.log(`Driver ID: ${trip.driverId} (${trip.driver?.fullName})`);
      console.log(`Vehicle ID: ${trip.vehicleId} (${trip.vehicle?.plateNumber})`);
      console.log(`Shipment ID: ${trip.shipmentId} (${trip.shipment?.shipmentNumber})`);
      console.log(`Status: ${trip.status}`);
      console.log("-----------------------------------------");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
