import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Participant {
  userId: string;
  username: string;
  color: string;
  isHost: boolean;
}

interface RoomStore {
  roomId: string | null;
  roomCode: string | null;
  token: string | null;
  user: { id: string; username: string; color: string } | null;
  participants: Participant[];
  isConnected: boolean;
  setRoom: (roomId: string, roomCode: string) => void;
  setToken: (token: string) => void;
  setUser: (user: { id: string; username: string; color: string }) => void;
  setParticipants: (participants: Participant[]) => void;
  addParticipant: (p: Participant) => void;
  removeParticipant: (userId: string) => void;
  setConnected: (v: boolean) => void;
  clearRoom: () => void;
}

export const useRoomStore = create<RoomStore>()(
  persist(
    (set) => ({
      roomId: null,
      roomCode: null,
      token: null,
      user: null,
      participants: [],
      isConnected: false,
      setRoom: (roomId, roomCode) => set({ roomId, roomCode }),
      setToken: (token) => {
        set({ token });
        if (typeof window !== 'undefined') localStorage.setItem('collabcode_token', token);
      },
      setUser: (user) => set({ user }),
      setParticipants: (participants) => set({ participants }),
      addParticipant: (p) => set((s) => ({
        participants: [...s.participants.filter((x) => x.userId !== p.userId), p],
      })),
      removeParticipant: (userId) => set((s) => ({
        participants: s.participants.filter((x) => x.userId !== userId),
      })),
      setConnected: (isConnected) => set({ isConnected }),
      clearRoom: () => set({ roomId: null, roomCode: null, participants: [], isConnected: false }),
    }),
    {
      name: 'collabcode-room',
      partialize: (s) => ({ token: s.token, user: s.user }),
    }
  )
);
