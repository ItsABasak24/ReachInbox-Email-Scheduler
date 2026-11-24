import { db } from '../db/connection';

export interface User {
  id: string;
  google_id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  slack_webhook_url?: string | null;
  slack_access_token?: string | null;
  slack_channel_id?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserData {
  google_id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
}

export interface SlackInfoData {
  slack_access_token?: string | null;
  slack_webhook_url?: string | null;
  slack_channel_id?: string | null;
}

export const UserModel = {
  async findById(id: string): Promise<User | undefined> {
    return db<User>('users').where({ id }).first();
  },

  async findByGoogleId(googleId: string): Promise<User | undefined> {
    return db<User>('users').where({ google_id: googleId }).first();
  },

  async findByEmail(email: string): Promise<User | undefined> {
    return db<User>('users').where({ email }).first();
  },

  async create(userData: CreateUserData): Promise<User> {
    const [user] = await db<User>('users')
      .insert({
        google_id: userData.google_id,
        email: userData.email,
        name: userData.name,
        avatar_url: userData.avatar_url || null,
      })
      .returning('*');
    return user;
  },

  async upsertByGoogleId(userData: CreateUserData): Promise<User> {
    const existing = await UserModel.findByGoogleId(userData.google_id);
    if (existing) {
      const [updated] = await db<User>('users')
        .where({ id: existing.id })
        .update({
          email: userData.email,
          name: userData.name,
          avatar_url: userData.avatar_url || existing.avatar_url,
          updated_at: new Date(),
        })
        .returning('*');
      return updated;
    }
    return UserModel.create(userData);
  },

  async updateSlackInfo(userId: string, slackData: SlackInfoData): Promise<User | undefined> {
    const [user] = await db<User>('users')
      .where({ id: userId })
      .update({
        ...slackData,
        updated_at: new Date(),
      })
      .returning('*');
    return user;
  },

  async removeSlackInfo(userId: string): Promise<User | undefined> {
    const [user] = await db<User>('users')
      .where({ id: userId })
      .update({
        slack_access_token: null,
        slack_webhook_url: null,
        slack_channel_id: null,
        updated_at: new Date(),
      })
      .returning('*');
    return user;
  },
};

export default UserModel;
