import { configureStore } from '@reduxjs/toolkit';
import teamsReducer from './slices/teamsSlice';
import playersReducer from './slices/playersSlice';
import scheduleReducer from './slices/scheduleSlice';
import appReducer from './slices/appSlice';

// Force cache refresh - timestamp: 2024-08-17
export const store = configureStore({
  reducer: {
    teams: teamsReducer,
    players: playersReducer,
    schedule: scheduleReducer,
    app: appReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['*'], // Ignore all actions
        ignoredPaths: ['*'], // Ignore all paths
      },
    }),
});
