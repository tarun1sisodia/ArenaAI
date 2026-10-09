import type { AdminUser, Booking, BookingStatus, FareSnapshot, TripType, VehicleTier } from "@/lib/types";

export type { AdminUser, Booking, BookingStatus, FareSnapshot, TripType, VehicleTier };

export interface NewBookingFormState {
  customerName: string;
  phone: string;
  email: string;
  pickupDatetime: string;
  returnDatetime: string;
  originName: string;
  destinationName: string;
  pickupAddress: string;
  dropAddress: string;
  passengerCount: number;
  luggageCount: number;
  specialRequests: string;
  vehicleTier: VehicleTier;
  tripType: string;
}

export const EMPTY_NEW_BOOKING_FORM: NewBookingFormState = {
  customerName: "",
  phone: "",
  email: "",
  pickupDatetime: "",
  returnDatetime: "",
  originName: "Agra",
  destinationName: "Delhi Airport",
  pickupAddress: "",
  dropAddress: "",
  passengerCount: 2,
  luggageCount: 2,
  specialRequests: "",
  vehicleTier: "sedan",
  tripType: "one-way",
};
