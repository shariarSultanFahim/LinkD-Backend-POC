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

  // ──────────────────────────────────────────────────────────
  // Time Sync — allows clients to calculate their clock offset
  // relative to the server for precise playback synchronization.
  // Client sends { clientTime: Date.now() }, server responds
  // with both the client's original timestamp and the server's
  // current time so the client can compute RTT and offset.
  // ──────────────────────────────────────────────────────────
  socket.on('timesync', (data: { clientTime: number }) => {
    socket.emit('timesync_response', {
      clientTime: data?.clientTime ?? 0,
      serverTime: Date.now(),
    });
  });

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

      // Send current playback state to the joining client so it can
      // immediately sync without a separate sync_music request.
      if (room.playbackState) {
        const serverTime = Date.now();
        let currentPositionMs = room.playbackState.currentPositionMs;
        if (!room.playbackState.isPaused) {
          currentPositionMs += serverTime - room.playbackState.updatedAt;
        }

        socket.emit('state_update', {
          roomCode: formattedCode,
          currentTrackUri: room.playbackState.currentTrackUri,
          currentPositionMs,
          isPaused: room.playbackState.isPaused,
          updatedAt: serverTime,
          serverTime,
        });
      }
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
        const serverTime = Date.now();

        // ── BROADCAST FIRST ──────────────────────────────────
        // Emit to all listeners immediately so they receive the
        // update with minimal latency. DB persistence happens
        // asynchronously afterwards.
        socket.to(formattedCode).emit('state_update', {
          roomCode: formattedCode,
          currentTrackUri,
          currentPositionMs,
          isPaused,
          updatedAt: serverTime,
          serverTime,
        });

        // ── PERSIST ASYNC ────────────────────────────────────
        // Fire-and-forget DB update. Errors are logged but do
        // not block the real-time broadcast path.
        roomService
          .updatePlayback(formattedCode, userId, {
            currentTrackUri,
            currentPositionMs,
            isPaused,
            updatedAt: serverTime,
          })
          .catch((err) => {
            console.error('[roomSocket] playback_update DB persist failed:', err.message);
          });
      } catch (error: any) {
        socket.emit('error', { message: error.message || 'Playback update failed' });
      }
    }
  );

  socket.on(
    'sync_music',
    async ({ roomCode }: { roomCode: string }) => {
      try {
        if (!roomCode) {
          socket.emit('error', { message: 'roomCode is required' });
          return;
        }

        const formattedCode = roomCode.toUpperCase();
        const playbackState = await roomService.syncPlayback(formattedCode, userId);
        const serverTime = Date.now();

        if (playbackState) {
          // Only send to the requesting socket — this is a
          // self-sync, not a room-wide broadcast.
          socket.emit('state_update', {
            roomCode: formattedCode,
            ...playbackState,
            serverTime,
          });
        }
      } catch (error: any) {
        socket.emit('error', { message: error.message || 'Sync music failed' });
      }
    }
  );

  socket.on(
    'pause_music',
    async ({
      roomCode,
      positionMs,
      isPaused,
    }: {
      roomCode: string;
      positionMs?: number;
      isPaused?: boolean;
    }) => {
      try {
        if (!roomCode) {
          socket.emit('error', { message: 'roomCode is required' });
          return;
        }

        const formattedCode = roomCode.toUpperCase();
        const room = await roomService.pausePlayback(
          formattedCode,
          userId,
          positionMs,
          isPaused
        );

        if (room.playbackState) {
          const serverTime = Date.now();
          io.to(formattedCode).emit('state_update', {
            roomCode: formattedCode,
            ...room.playbackState,
            serverTime,
          });
        }
      } catch (error: any) {
        socket.emit('error', { message: error.message || 'Pause music failed' });
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
