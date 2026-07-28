import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository';
import { generateToken } from '../utils/jwt';
import { IUser } from '../models/User';

export interface UserAuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
    spotifyUserId?: string;
  };
  token: string;
}

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async signup(data: {
    username: string;
    email: string;
    password: string;
  }): Promise<UserAuthResponse> {
    const existingEmail = await this.userRepository.findByEmail(data.email);
    if (existingEmail) {
      const error: any = new Error('Email is already in use');
      error.statusCode = 409;
      throw error;
    }

    const existingUsername = await this.userRepository.findByUsername(data.username);
    if (existingUsername) {
      const error: any = new Error('Username is already taken');
      error.statusCode = 409;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await this.userRepository.create({
      username: data.username,
      email: data.email,
      passwordHash,
    });

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
    });

    return {
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        spotifyUserId: user.spotifyUserId,
      },
      token,
    };
  }

  async login(data: {
    email: string;
    password: string;
  }): Promise<UserAuthResponse> {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      const error: any = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      const error: any = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
    });

    return {
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        spotifyUserId: user.spotifyUserId,
      },
      token,
    };
  }

  async getProfile(userId: string): Promise<{ id: string; username: string; email: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
    };
  }
}
