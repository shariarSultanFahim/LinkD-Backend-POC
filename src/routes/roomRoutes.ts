import { Router } from 'express';
import { RoomController } from '../controllers/RoomController';
import { RoomService } from '../services/RoomService';
import { RoomRepository } from '../repositories/RoomRepository';
import { authMiddleware } from '../middleware/authMiddleware';
import { asyncErrorWrapper } from '../middleware/asyncErrorWrapper';
import { validateParams, roomCodeParamSchema } from '../validators/auth.schema';

const roomRepository = new RoomRepository();
const roomService = new RoomService(roomRepository);
const roomController = new RoomController(roomService);

const router = Router();

router.post(
  '/',
  authMiddleware,
  asyncErrorWrapper((req, res) => roomController.createRoom(req, res))
);

router.post(
  '/:roomCode/join',
  authMiddleware,
  validateParams(roomCodeParamSchema),
  asyncErrorWrapper((req, res) => roomController.joinRoom(req, res))
);

router.get(
  '/:roomCode',
  authMiddleware,
  validateParams(roomCodeParamSchema),
  asyncErrorWrapper((req, res) => roomController.getRoom(req, res))
);

router.post(
  '/:roomCode/leave',
  authMiddleware,
  validateParams(roomCodeParamSchema),
  asyncErrorWrapper((req, res) => roomController.leaveRoom(req, res))
);

router.post(
  '/:roomCode/sync',
  authMiddleware,
  validateParams(roomCodeParamSchema),
  asyncErrorWrapper((req, res) => roomController.syncMusic(req, res))
);

router.post(
  '/:roomCode/pause',
  authMiddleware,
  validateParams(roomCodeParamSchema),
  asyncErrorWrapper((req, res) => roomController.pauseMusic(req, res))
);

export default router;
