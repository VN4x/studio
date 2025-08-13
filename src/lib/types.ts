import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'manager' | 'team';

export interface AppUser {
  uid: string;
  email: string | null;
  name: string | null;
  role: UserRole;
  teamId?: string;
}

export interface Team {
  id: string;
  name: string;
}

export interface Job {
  id: string;
  date: string;
  time: string;
  estimatedTime: string;
  contractNumber: string;
  clientAddress: string;
  clientPhone: string;
  windowCount: number;
  squareMeters: number;
  circumference: number;
  addons: {
    innerSills: boolean;
    outerSills: boolean;
    finishing: boolean;
    tape: boolean;
    extras: boolean;
  };
  notes: string;
  status: 'Scheduled' | 'Finished' | 'To Be Continued' | 'Problem';
  teamId: string;
  teamName?: string; 
  createdBy: string;
  createdAt: Timestamp;
}
