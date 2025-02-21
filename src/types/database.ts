import { Document } from 'mongoose';
import { ILogo } from '@/models/Logo';
import { IUser } from '@/models/User';
import { IVote } from '@/models/Vote';

export interface DatabaseCollections {
  logos: ILogo[];
  users: IUser[];
  votes: IVote[];
}

export interface DatabaseDocument<T extends Document> {
  _id: string;
  [key: string]: T[keyof T] | unknown;
}

export interface DatabaseStats {
  collections: {
    [key: string]: {
      count: number;
      avgSize: number;
      totalSize: number;
    };
  };
  totalSize: number;
  avgObjSize: number;
}

export interface DatabaseInfo {
  collections: {
    [K in keyof DatabaseCollections]: DatabaseCollections[K];
  };
  stats: DatabaseStats;
  schemas: {
    [key: string]: unknown;
  };
  counts: {
    [key: string]: number;
  };
}

export interface DatabaseSyncState {
  collections: {
    [K in keyof DatabaseCollections]: {
      data: DatabaseCollections[K];
      lastUpdated: Date;
    };
  };
  connected: boolean;
  error: Error | null;
}

export interface DatabaseAction<T> {
  type: string;
  collection: keyof DatabaseCollections;
  data: T;
  timestamp: Date;
}

export interface DatabaseEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  collectionName: keyof DatabaseCollections;
  initialData?: DatabaseDocument<Document>;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export interface Logo {
  id: string;
  url: string;
  votes: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
