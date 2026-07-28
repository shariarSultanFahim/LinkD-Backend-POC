import { Schema, model, Document, Types } from 'mongoose';

export interface IPlaybackState {
  currentTrackUri: string | null;
  currentPositionMs: number;
  isPaused: boolean;
  updatedAt: number;
}

export interface IRoom extends Document {
  _id: Types.ObjectId;
  roomCode: string;
  hostId: Types.ObjectId;
  listeners: Types.ObjectId[];
  isActive: boolean;
  playbackState: IPlaybackState | null;
  createdAt: Date;
}

const playbackStateSchema = new Schema<IPlaybackState>(
  {
    currentTrackUri: { type: String, default: null },
    currentPositionMs: { type: Number, default: 0 },
    isPaused: { type: Boolean, default: true },
    updatedAt: { type: Number, default: () => Date.now() },
  },
  { _id: false }
);

const roomSchema = new Schema<IRoom>(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    listeners: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    playbackState: {
      type: playbackStateSchema,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    suppressReservedKeysWarning: true,
  }
);

export const Room = model<IRoom>('Room', roomSchema);
