import PocketBase from 'pocketbase';

interface User {
  id: string;
  username: string;
}

const pb = new PocketBase('http://127.0.0.1:8090');

export const login = async (username: string, password: string): Promise<User> => {
  try {
    const authData = await pb.collection('users').authWithPassword(username, password);
    return {
      id: authData.record.id,
      username: authData.record.username
    };
  } catch (error: any) {
    throw new Error(error.message || "Login failed");
  }
};

export const logout = async (): Promise<void> => {
  pb.authStore.clear();
};

export const getCurrentUser = (): User | null => {
  if (pb.authStore.isValid && pb.authStore.model) {
    return {
      id: pb.authStore.model.id,
      username: pb.authStore.model.username
    };
  }
  return null;
};

export const isAuthenticated = (): boolean => {
  return pb.authStore.isValid;
};

export const getPocketBase = (): PocketBase => {
  return pb;
};