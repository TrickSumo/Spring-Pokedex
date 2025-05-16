import { create } from 'zustand'

const useStore = create((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: (newBears) => set({ bears: newBears }),

   count: 1,
  inc: () => set((state) => ({ count: state.count + 1 })),

  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications].slice(0,3),
  })),
}))

export default useStore;