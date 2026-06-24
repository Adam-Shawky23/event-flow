export class CreateEventDto {
  title: string;
  categories: string[];
  eventType: string;
  venue: string;
  address: string;
  city: string;
  country: string;
  geoLat?: number;
  geoLng?: number;
  startDateTime: string;
  endDateTime: string;
  capacity: number;
  description: string;
  ticketTypes: {
    name: string;
    price: number;
    quantity: number;
  }[];
}