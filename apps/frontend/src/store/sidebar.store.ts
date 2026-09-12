import { create } from 'zustand';

interface SidebarStore {
  isOpen: boolean; // For mobile open/close
  isCollapsed: boolean; // For desktop collapse/expand (72px vs 260px)
  open: () => void;
  close: () => void;
  toggle: () => void;
  toggleCollapsed: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isOpen: false,
  isCollapsed: typeof window !== 'undefined' ? localStorage.getItem('vidyaai_sidebar_collapsed') === 'true' : false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  toggleCollapsed: () =>
    set((s) => {
      const next = !s.isCollapsed;
      if (typeof window !== 'undefined') {
        localStorage.setItem('vidyaai_sidebar_collapsed', String(next));
      }
      return { isCollapsed: next };
    }),
  setCollapsed: (collapsed: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vidyaai_sidebar_collapsed', String(collapsed));
    }
    set({ isCollapsed: collapsed });
  },
}));
