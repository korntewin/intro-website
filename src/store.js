import { create } from "zustand";
import { MIN_SCROLL_DIFF } from "./config";


const useStore = create((set, get) => ({
    isSideBarOpen: false,
    openSideBar: () => set({ isSideBarOpen: true }),
    closeSideBar: () => set({ isSideBarOpen: false }),
    lastYPos: 0,
    isNavOpen: true,
    onScrollHandler: (_) => {
        let prevYPos = get().lastYPos;
        let currentYPos = window.scrollY;
        setTimeout( () => {
            if (currentYPos - prevYPos > MIN_SCROLL_DIFF ) {  // Scroll Down
                set({ lastYPos: window.scrollY, isNavOpen: false});
            } else if (prevYPos - currentYPos > MIN_SCROLL_DIFF ) { // Scroll Up
                set({ lastYPos: window.scrollY, isNavOpen: true});
            }
        }, 250)
    }
}))


export default useStore;