import { CreateBookingIntentSchema } from "../src/modules/booking-intents/booking-intent.schema.js";

const payload = {
  idempotencyKey: "a0000000-0000-0000-0000-000000000001",
  tripType: "one-way",
  originName: "Agra",
  destinationName: "Delhi",
  vehicleTier: "sedan",
  pickupAddress: "Agra",
  dropAddress: "Delhi",
  customerName: "tarun",
  customerPhone: "+919520434336",
  customerEmail: "tarun.1sisodia@gmail.com",
  pickupDatetime: "2026-10-04T09:00:00.000Z",
  promoCode: "TEST99",
};

const res = CreateBookingIntentSchema.safeParse(payload);
if (!res.success) {
  console.log("Validation Errors:", JSON.stringify(res.error.issues, null, 2));
} else {
  console.log("Passed!");
}
