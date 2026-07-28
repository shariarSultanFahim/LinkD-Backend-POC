import { Server } from 'socket.io';
import { AuthenticatedSocket } from './socketAuth';
import { RoomRepository } from '../repositories/RoomRepository';
import { RoomService } from '../services/RoomService';

const roomRepository = new RoomRepository();
const roomService = new RoomService(roomRepository);

export function registerRoomSockets(io: Server, socket: AuthenticatedSocket): void {
  const userId = socket.user?.userId;
  const username = socket.user?.username;

  if (!userId) {
    socket.disconnect(true);
    return;
  }

  socket.on('join_room', async ({ roomCode }: { roomCode: string }) => {
    try {
      if (!roomCode) {
        socket.emit('error', { message: 'roomCode is required' });
        return;
      }

      const formattedCode = roomCode.toUpperCase();
      const room = await roomRepository.findActiveByCode(formattedCode);
      if (!room) {
        socket.emit('error', { message: 'Room not found or inactive' });
        return;
      }

      socket.join(formattedCode);

      // Notify other members in the room
      socket.to(formattedCode).emit('listener_joined', { userId, username });
    } catch (error: any) {
      socket.emit('error', { message: error.message || 'Failed to join socket room' });
    }
  });

  socket.on(
    'playback_update',
    async ({
      roomCode,
      currentTrackUri,
      currentPositionMs,
      isPaused,
    }: {
      roomCode: string;
      currentTrackUri: string | null;
      currentPositionMs: number;
      isPaused: boolean;
    }) => {
      try {
        if (!roomCode) {
          socket.emit('error', { message: 'roomCode is required' });
          return;
        }

        const formattedCode = roomCode.toUpperCase();
        const updatedAt = Date.now();
        
        // Update database through RoomService (verifies host authorization)
        await roomService.updatePlayback(formattedCode, userId, {
          currentTrackUri,
          currentPositionMs,
          isPaused,
          updatedAt,
        });

        // Broadcast to listeners (excluding host)
        socket.to(formattedCode).emit('state_update', {
          roomCode: formattedCode,
          currentTrackUri,
          currentPositionMs,
          isPaused,
          updatedAt,
        });
      } catch (error: any) {
        socket.emit('error', { message: error.message || 'Playback update failed' });
      }
    }
  );

  socket.on('leave_room', async ({ roomCode }: { roomCode: string }) => {
    try {
      if (!roomCode) return;
      const formattedCode = roomCode.toUpperCase();

      socket.leave(formattedCode);
      socket.to(formattedCode).emit('listener_left', { userId, username });
    } catch (error: any) {
      socket.emit('error', { message: error.message || 'Failed to leave room' });
    }
  });

  socket.on('disconnect', () => {
    // Optional disconnect handling
  });
}
