import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { RoomService } from '../services/RoomService';

export class RoomController extends BaseController {
  constructor(private roomService: RoomService) {
    super();
  }

  async createRoom(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const room = await this.roomService.createRoom(userId);
      this.handleSuccess(
        res,
        {
          roomCode: room.roomCode,
          hostId: room.hostId,
          isActive: room.isActive,
          playbackState: room.playbackState,
        },
        201
      );
    } catch (error) {
      this.handleError(error, res, 'RoomController.createRoom');
    }
  }

  async joinRoom(req: Request, res: Response): Promise<void> {
    try {
      const { roomCode } = req.params;
      const userId = (req as any).user.userId;
      const room = await this.roomService.joinRoom(roomCode, userId);
      this.handleSuccess(
        res,
        {
          roomCode: room.roomCode,
          hostId: room.hostId,
          listeners: room.listeners,
          playbackState: room.playbackState,
        },
        200
      );
    } catch (error) {
      this.handleError(error, res, 'RoomController.joinRoom');
    }
  }

  async getRoom(req: Request, res: Response): Promise<void> {
    try {
      const { roomCode } = req.params;
      const room = await this.roomService.getRoomState(roomCode);
      this.handleSuccess(
        res,
        {
          roomCode: room.roomCode,
          hostId: room.hostId,
          listeners: room.listeners,
          playbackState: room.playbackState,
        },
        200
      );
    } catch (error) {
      this.handleError(error, res, 'RoomController.getRoom');
    }
  }

  async leaveRoom(req: Request, res: Response): Promise<void> {
    try {
      const { roomCode } = req.params;
      const userId = (req as any).user.userId;
      const result = await this.roomService.leaveRoom(roomCode, userId);
      this.handleSuccess(res, result, 200);
    } catch (error) {
      this.handleError(error, res, 'RoomController.leaveRoom');
    }
  }
}
