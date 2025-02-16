import { DB_CONSTANTS } from '@/constants/db';

export interface VoteData {
  userId: string;
  logoId: string;
  timestamp: Date;
  ownerId?: string;
}

export interface VoteResult {
  status: (typeof DB_CONSTANTS.VOTE_STATUS)[keyof typeof DB_CONSTANTS.VOTE_STATUS];
  conflictResolution?: {
    originalVote: VoteData;
    newVote: VoteData;
    resolution: 'keep-original' | 'use-new';
  };
  error?: string;
}

export interface UserVote {
  userId: string;
  logoId: string;
  timestamp: Date;
  ownerId?: string;
}

export interface Logo {
  id: string;
  alt: string;
  imageUrl: string;
  ownerId: string;
}

export interface VoteStats {
  totalVotes: number;
  uniqueVoters: number;
  lastVoteAt?: Date;
}

export interface LogoStats {
  logoId: string;
  totalVotes: number;
  uniqueVoters: number;
  lastVoteAt?: Date;
}

import { Document } from 'mongoose';

export interface VoteDocument extends Document {
  userId: string;
  logoId: string;
  timestamp: Date;
  status: (typeof DB_CONSTANTS.VOTE_STATUS)[keyof typeof DB_CONSTANTS.VOTE_STATUS];
  ownerId?: string;
}
