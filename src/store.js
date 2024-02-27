import { create } from "zustand";


const useStore = create((set) => ({
    isSideBarOpen: false,
    openSideBar: () => set({ isSideBarOpen: true }),
    closeSideBar: () => set({ isSideBarOpen: false }),
}))


export default useStore;