import { RoomRepository } from '../repositories/RoomRepository';
import { generateRoomCode } from '../utils/roomCodeGenerator';
import { IRoom, IPlaybackState } from '../models/Room';

export class RoomService {
  constructor(private roomRepository: RoomRepository) {}

  async createRoom(hostId: string): Promise<IRoom> {
    let roomCode = generateRoomCode();
    let existingRoom = await this.roomRepository.findByCode(roomCode);
    
    // Ensure roomCode uniqueness
    let attempts = 0;
    while (existingRoom && attempts < 5) {
      roomCode = generateRoomCode();
      existingRoom = await this.roomRepository.findByCode(roomCode);
      attempts++;
    }

    return this.roomRepository.createRoom(hostId, roomCode);
  }

  async joinRoom(roomCode: string, userId: string): Promise<IRoom> {
    const room = await this.roomRepository.findByCode(roomCode);
    if (!room) {
      const error: any = new Error('Room not found');
      error.statusCode = 404;
      throw error;
    }

    if (!room.isActive) {
      const error: any = new Error('Room is inactive');
      error.statusCode = 410;
      throw error;
    }

    const updatedRoom = await this.roomRepository.addListener(roomCode, userId);
    if (!updatedRoom) {
      const error: any = new Error('Could not join room');
      error.statusCode = 500;
      throw error;
    }

    return updatedRoom;
  }

  async getRoomState(roomCode: string): Promise<IRoom> {
    const room = await this.roomRepository.findByCode(roomCode);
    if (!room) {
      const error: any = new Error('Room not found');
      error.statusCode = 404;
      throw error;
    }

    if (!room.isActive) {
      const error: any = new Error('Room is inactive');
      error.statusCode = 410;
      throw error;
    }

    return room;
  }

  async leaveRoom(roomCode: string, userId: string): Promise<{ left: boolean; isHost: boolean }> {
    const room = await this.roomRepository.findByCode(roomCode);
    if (!room) {
      const error: any = new Error('Room not found');
      error.statusCode = 404;
      throw error;
    }

    const isHost = room.hostId.toString() === userId;
    if (isHost) {
      await this.roomRepository.deactivateRoom(roomCode);
      return { left: true, isHost: true };
    } else {
      await this.roomRepository.removeListener(roomCode, userId);
      return { left: true, isHost: false };
    }
  }

  async updatePlayback(roomCode: string, userId: string, state: IPlaybackState): Promise<IRoom> {
    const room = await this.roomRepository.findActiveByCode(roomCode);
    if (!room) {
      const error: any = new Error('Room not found or inactive');
      error.statusCode = 404;
      throw error;
    }

    if (room.hostId.toString() !== userId) {
      const error: any = new Error('Only room host can update playback state');
      error.statusCode = 403;
      throw error;
    }

    const updated = await this.roomRepository.updatePlaybackState(roomCode, state);
    if (!updated) {
      const error: any = new Error('Failed to update playback state');
      error.statusCode = 500;
      throw error;
    }

    return updated;
  }

  async syncPlayback(roomCode: string, userId: string): Promise<IPlaybackState | null> {
    const room = await this.roomRepository.findActiveByCode(roomCode);
    if (!room) {
      const error: any = new Error('Room not found or inactive');
      error.statusCode = 404;
      throw error;
    }

    const isMember =
      room.hostId.toString() === userId ||
      room.listeners.some((listenerId) => listenerId.toString() === userId);

    if (!isMember) {
      const error: any = new Error('You are not a member of this room');
      error.statusCode = 403;
      throw error;
    }

    if (!room.playbackState) {
      return null;
    }

    const now = Date.now();
    let currentPositionMs = room.playbackState.currentPositionMs;
    if (!room.playbackState.isPaused) {
      currentPositionMs += now - room.playbackState.updatedAt;
    }

    return {
      currentTrackUri: room.playbackState.currentTrackUri,
      currentPositionMs,
      isPaused: room.playbackState.isPaused,
      updatedAt: now,
    };
  }

  async pausePlayback(
    roomCode: string,
    userId: string,
    positionMs?: number,
    isPaused?: boolean
  ): Promise<IRoom> {
    const room = await this.roomRepository.findActiveByCode(roomCode);
    if (!room) {
      const error: any = new Error('Room not found or inactive');
      error.statusCode = 404;
      throw error;
    }

    if (room.hostId.toString() !== userId) {
      const error: any = new Error('Only room host can update playback pause state');
      error.statusCode = 403;
      throw error;
    }

    const now = Date.now();
    const currentTrackUri = room.playbackState?.currentTrackUri || null;
    
    // If isPaused parameter is provided, use it; otherwise toggle current pause state
    const newIsPaused =
      typeof isPaused === 'boolean'
        ? isPaused
        : !(room.playbackState?.isPaused ?? true);

    let currentPositionMs = positionMs ?? room.playbackState?.currentPositionMs ?? 0;

    // Auto sync current position if positionMs was not explicitly supplied and it was currently playing
    if (
      positionMs === undefined &&
      room.playbackState &&
      !room.playbackState.isPaused
    ) {
      currentPositionMs += now - room.playbackState.updatedAt;
    }

    const newState: IPlaybackState = {
      currentTrackUri,
      currentPositionMs,
      isPaused: newIsPaused,
      updatedAt: now,
    };

    const updated = await this.roomRepository.updatePlaybackState(roomCode, newState);
    if (!updated) {
      const error: any = new Error('Failed to update playback state');
      error.statusCode = 500;
      throw error;
    }

    return updated;
  }
}
