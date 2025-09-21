import { DocumentWithTimestampAndVirtualId } from './mongoose';

export interface ApiKey {
  label: string;
  lastUsedAt?: Date;
  hashedKey: string;
}

export interface ApiKeyDocument
  extends ApiKey,
    DocumentWithTimestampAndVirtualId {}
