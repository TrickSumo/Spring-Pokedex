import { create } from 'zustand'

const useStore = create((set) => ({
  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications].slice(0,1),
  })),
  clearNotifications: () => set(() => ({
    notifications: [],
  })),

  status: "ready",
  setStatus: (text) => set(() => ({
    status: text,
  })),

  scannedDetails : {},
  setScannedDetails: (details) => set(() => ({
    scannedDetails: details,
  })),

  momentoDisposableToken: "",
  setMomentoDisposableToken: (token) => set(() => ({

    momentoDisposableToken: token,
  })),
}))

export default useStore;