import { configureStore } from "@reduxjs/toolkit";
import sidebarReducer from "./reducers/sidebarReducer";


const store = configureStore({reducer: sidebarReducer});

export default store;