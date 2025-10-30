import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getCollection, toObjectId } from './mongodb-connection';
import { ObjectId } from 'mongodb';

interface User {
  _id: ObjectId;
  email: string;
  username: string;
  password_hash: string;
  profile_picture_url?: string;
  created_at: Date;
  updated_at: Date;
}

interface UserPayload {
  userId: string;
  email: string;
  username: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Generate JWT refresh token
 */
export function generateRefreshToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(payload: UserPayload): TokenPair {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload)
  };
}

/**
 * Verify and decode JWT access token
 */
export function verifyAccessToken(token: string): UserPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

/**
 * Verify and decode JWT refresh token
 */
export function verifyRefreshToken(token: string): UserPayload {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as UserPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

/**
 * Register a new user
 */
export async function registerUser(email: string, password: string, username?: string): Promise<User> {
  const usersCollection = getCollection<User>('users');

  // Check if user already exists
  const existingUser = await usersCollection.findOne({
    $or: [{ email }, { username: username || email }]
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new Error('Email already registered');
    }
    if (existingUser.username === username) {
      throw new Error('Username already taken');
    }
  }

  // Hash password
  const password_hash = await hashPassword(password);

  // Create user document
  const newUser: Omit<User, '_id'> = {
    email,
    username: username || email.split('@')[0], // Use email prefix if no username provided
    password_hash,
    created_at: new Date(),
    updated_at: new Date()
  };

  const result = await usersCollection.insertOne(newUser as User);

  // Return user without password hash
  const user = await usersCollection.findOne({ _id: result.insertedId });
  if (!user) {
    throw new Error('Failed to create user');
  }

  return user;
}

/**
 * Login user with email/username and password
 */
export async function loginUser(emailOrUsername: string, password: string): Promise<{ user: User; tokens: TokenPair }> {
  const usersCollection = getCollection<User>('users');

  // Find user by email or username
  const user = await usersCollection.findOne({
    $or: [
      { email: emailOrUsername },
      { username: emailOrUsername }
    ]
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }

  // Generate tokens
  const payload: UserPayload = {
    userId: user._id.toString(),
    email: user.email,
    username: user.username
  };

  const tokens = generateTokenPair(payload);

  return { user, tokens };
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenPair> {
  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken);

  // Get user to ensure they still exist
  const usersCollection = getCollection<User>('users');
  const user = await usersCollection.findOne({ _id: toObjectId(payload.userId) });

  if (!user) {
    throw new Error('User not found');
  }

  // Generate new token pair
  const newPayload: UserPayload = {
    userId: user._id.toString(),
    email: user.email,
    username: user.username
  };

  return generateTokenPair(newPayload);
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const usersCollection = getCollection<User>('users');
  return await usersCollection.findOne({ _id: toObjectId(userId) });
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
  const usersCollection = getCollection<User>('users');

  // Don't allow updating password through this method
  delete updates.password_hash;

  // Add updated_at timestamp
  updates.updated_at = new Date();

  const result = await usersCollection.findOneAndUpdate(
    { _id: toObjectId(userId) },
    { $set: updates },
    { returnDocument: 'after' }
  );

  if (!result) {
    throw new Error('User not found');
  }

  return result;
}

/**
 * Change user password
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const usersCollection = getCollection<User>('users');

  const user = await usersCollection.findOne({ _id: toObjectId(userId) });
  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isValidPassword = await verifyPassword(currentPassword, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const password_hash = await hashPassword(newPassword);

  // Update password
  await usersCollection.updateOne(
    { _id: toObjectId(userId) },
    { $set: { password_hash, updated_at: new Date() } }
  );
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}
