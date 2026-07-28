import { Room, IRoom, IPlaybackState } from '../models/Room';

export class RoomRepository {
  async findByCode(roomCode: string): Promise<IRoom | null> {
    return Room.findOne({ roomCode: roomCode.toUpperCase() });
  }

  async findActiveByCode(roomCode: string): Promise<IRoom | null> {
    return Room.findOne({ roomCode: roomCode.toUpperCase(), isActive: true });
  }

  async createRoom(hostId: string, roomCode: string): Promise<IRoom> {
    const room = new Room({
      roomCode: roomCode.toUpperCase(),
      hostId,
      listeners: [hostId],
      isActive: true,
      playbackState: null,
    });
    return room.save();
  }

  async addListener(roomCode: string, userId: string): Promise<IRoom | null> {
    return Room.findOneAndUpdate(
      { roomCode: roomCode.toUpperCase(), isActive: true },
      { $addToSet: { listeners: userId } },
      { new: true }
    );
  }

  async removeListener(roomCode: string, userId: string): Promise<IRoom | null> {
    return Room.findOneAndUpdate(
      { roomCode: roomCode.toUpperCase() },
      { $pull: { listeners: userId } },
      { new: true }
    );
  }

  async deactivateRoom(roomCode: string): Promise<IRoom | null> {
    return Room.findOneAndUpdate(
      { roomCode: roomCode.toUpperCase() },
      { isActive: false },
      { new: true }
    );
  }

  async updatePlaybackState(
    roomCode: string,
    state: IPlaybackState
  ): Promise<IRoom | null> {
    return Room.findOneAndUpdate(
      { roomCode: roomCode.toUpperCase(), isActive: true },
      { playbackState: state },
      { new: true }
    );
  }
}
