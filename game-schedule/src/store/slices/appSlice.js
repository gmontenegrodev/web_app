import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentSeason: 2024,
  selectedTeam: null,
  selectedStat: 'homeRuns',
  selectedType: 'hitting', // 'hitting' or 'pitching'
  sidebarOpen: false,
  theme: 'light',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setCurrentSeason: (state, action) => {
      state.currentSeason = action.payload;
    },
    setSelectedTeam: (state, action) => {
      state.selectedTeam = action.payload;
    },
    setSelectedStat: (state, action) => {
      state.selectedStat = action.payload;
    },
    setSelectedType: (state, action) => {
      state.selectedType = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    resetFilters: (state) => {
      state.selectedTeam = null;
      state.selectedStat = 'homeRuns';
      state.selectedType = 'hitting';
    },
  },
});

export const {
  setCurrentSeason,
  setSelectedTeam,
  setSelectedStat,
  setSelectedType,
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  resetFilters,
} = appSlice.actions;

// Selectors
export const selectCurrentSeason = (state) => state.app.currentSeason;
export const selectSelectedTeam = (state) => state.app.selectedTeam;
export const selectSelectedStat = (state) => state.app.selectedStat;
export const selectSelectedType = (state) => state.app.selectedType;
export const selectSidebarOpen = (state) => state.app.sidebarOpen;
export const selectTheme = (state) => state.app.theme;

export default appSlice.reducer;
