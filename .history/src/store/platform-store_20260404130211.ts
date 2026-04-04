import { create } from "zustand";

interface PlatformState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const usePlatformStore = create<PlatformState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen }))
}));
