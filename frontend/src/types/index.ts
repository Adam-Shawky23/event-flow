export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  vatNumber: string;
  role: 'ADMIN' | 'ORGANIZER' | 'PARTICIPANT' | 'GUEST';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface TicketType {
  id: number;
  ticketId: string;
  name: string;
  price: number;
  quantity: number;
  available: number;
  eventId: number;
}

export interface Event {
  id: number;
  eventId: string;
  title: string;
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
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED';
  description: string;
  categories: { category: { id: number; name: string } }[];
  ticketTypes: TicketType[];
  photos: { id: number; filename: string }[];
  organizer?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
  bookings?: any[];
  createdAt?: string;
}

export interface Booking {
  id: number;
  bookingId: string;
  numberOfTickets: number;
  totalCost: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  time: string;
  event?: Partial<Event>;
  ticketType?: TicketType;
  attendee?: Partial<User>;
}

export interface Message {
  id: number;
  subject: string;
  body: string;
  isReadByReceiver: boolean;
  createdAt: string;
  sender?: Partial<User>;
  receiver?: Partial<User>;
}