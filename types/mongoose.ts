import mongoose, { Document, Schema, Model, Types } from 'mongoose';

export interface DocumentTimestamp {
  updatedAt?: Date;
  createdAt?: Date;
}

export interface VirtualId {
  id: string;
}

/** Mongoose document with virtual id and timestamps enabled */
export interface DocumentWithTimestampAndVirtualId
  extends Omit<Document<Types.ObjectId>, 'id'>,
    DocumentTimestamp,
    VirtualId {}
