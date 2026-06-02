import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authRepository } from './auth.repository';
import { jwtConfig } from '../../config/jwt';

export const authService = {
  login: async (email: string, password: string) => {
    const user = await authRepository.findByEmail(email);
    if (!user) throw new Error('Invalid email or password');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error('Invalid email or password');

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  },

  getProfile: async (userId: string) => {
    const user = await authRepository.findById(userId);
    if (!user) throw new Error('User not found');
    return user;
  },
};
