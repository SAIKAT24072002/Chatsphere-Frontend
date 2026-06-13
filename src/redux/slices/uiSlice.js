import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    sidebarOpen: true,
    activeModal: null,
    modalData: null,
    searchOpen: false,
    profilePanelOpen: false,
    theme: "dark",
  },
  reducers: {
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarOpen(state, action) { state.sidebarOpen = action.payload; },
    openModal(state, action) {
      state.activeModal = action.payload.modal;
      state.modalData = action.payload.data || null;
    },
    closeModal(state) { state.activeModal = null; state.modalData = null; },
    setSearchOpen(state, action) { state.searchOpen = action.payload; },
    setProfilePanelOpen(state, action) { state.profilePanelOpen = action.payload; },
    toggleTheme(state) { state.theme = state.theme === "dark" ? "light" : "dark"; },
  },
});

export const { toggleSidebar, setSidebarOpen, openModal, closeModal, setSearchOpen, setProfilePanelOpen, toggleTheme } = uiSlice.actions;
export default uiSlice.reducer;
