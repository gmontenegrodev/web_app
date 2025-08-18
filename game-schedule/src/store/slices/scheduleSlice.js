import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchSchedule, fetchGameLive } from '../../services/api';

// Marlins org team IDs
const MARLINS_ORG_TEAM_IDS = [
  146, 385, 467, 564, 554, 619, 3276, 4124, 3277, 479, 2127
];

// Sport IDs for different levels
const SPORT_IDS = [1, 21, 16, 11, 13, 12, 14];

// Async thunks
export const fetchScheduleAsync = createAsyncThunk(
  'schedule/fetchSchedule',
  async (date, { rejectWithValue }) => {
    try {
      const scheduleData = await fetchSchedule(date);
      const games = scheduleData?.dates?.[0]?.games || [];
      
      // Create map of games by team ID
      const gamesMap = {};
      MARLINS_ORG_TEAM_IDS.forEach(teamId => {
        const game = games.find(g => 
          g.teams?.home?.team?.id === teamId || g.teams?.away?.team?.id === teamId
        );
        gamesMap[teamId] = game || null;
      });
      
      return { date, games: gamesMap };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchGameLiveAsync = createAsyncThunk(
  'schedule/fetchGameLive',
  async (gamePk, { rejectWithValue }) => {
    try {
      const liveData = await fetchGameLive(gamePk);
      return { gamePk, liveData };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAllGamesLiveAsync = createAsyncThunk(
  'schedule/fetchAllGamesLive',
  async (games, { rejectWithValue }) => {
    try {
      const livePromises = games.map(async (game) => {
        try {
          const liveData = await fetchGameLive(game.gamePk);
          return [game.gamePk, liveData];
        } catch (err) {
          console.warn('Failed to fetch live data for game:', game.gamePk, err);
          return [game.gamePk, null];
        }
      });
      
      const liveResults = await Promise.all(livePromises);
      const liveMap = {};
      liveResults.forEach(([gamePk, liveData]) => {
        liveMap[gamePk] = liveData;
      });
      
      return liveMap;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  gamesByTeamId: {},
  liveByPk: {},
  currentDate: null,
  loading: false,
  error: null,
};

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentDate: (state, action) => {
      state.currentDate = action.payload;
    },
    clearSchedule: (state) => {
      state.gamesByTeamId = {};
      state.liveByPk = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch schedule
      .addCase(fetchScheduleAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchScheduleAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { date, games } = action.payload;
        state.currentDate = date;
        state.gamesByTeamId = games;
      })
      .addCase(fetchScheduleAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch single game live data
      .addCase(fetchGameLiveAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGameLiveAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { gamePk, liveData } = action.payload;
        state.liveByPk[gamePk] = liveData;
      })
      .addCase(fetchGameLiveAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch all games live data
      .addCase(fetchAllGamesLiveAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllGamesLiveAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.liveByPk = { ...state.liveByPk, ...action.payload };
      })
      .addCase(fetchAllGamesLiveAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setCurrentDate, clearSchedule } = scheduleSlice.actions;

// Selectors
export const selectGamesByTeamId = (state) => state.schedule.gamesByTeamId;
export const selectGameByTeamId = (state, teamId) => state.schedule.gamesByTeamId[teamId];
export const selectLiveByPk = (state) => state.schedule.liveByPk;
export const selectGameLive = (state, gamePk) => state.schedule.liveByPk[gamePk];
export const selectCurrentDate = (state) => state.schedule.currentDate;
export const selectScheduleLoading = (state) => state.schedule.loading;
export const selectScheduleError = (state) => state.schedule.error;

export default scheduleSlice.reducer;
