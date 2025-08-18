import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchPlayerStats, fetchPlayerGameLogs } from '../../services/api';

// Async thunks
export const fetchPlayerStatsAsync = createAsyncThunk(
  'players/fetchStats',
  async ({ playerId, season = 2024 }, { rejectWithValue }) => {
    try {
      const [hittingStats, pitchingStats] = await Promise.all([
        fetchPlayerStats(playerId, season, 'hitting'),
        fetchPlayerStats(playerId, season, 'pitching')
      ]);
      
      return {
        playerId,
        season,
        hitting: hittingStats.stats?.[0]?.splits?.[0]?.stat || {},
        pitching: pitchingStats.stats?.[0]?.splits?.[0]?.stat || {}
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPlayerGameLogsAsync = createAsyncThunk(
  'players/fetchGameLogs',
  async ({ playerId, season = 2024 }, { rejectWithValue }) => {
    try {
      const gameLogs = await fetchPlayerGameLogs(playerId, season);
      return {
        playerId,
        season,
        gameLogs: gameLogs.stats?.[0]?.splits?.slice(0, 10) || []
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAllMarlinsPlayersAsync = createAsyncThunk(
  'players/fetchAllMarlins',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const teamsMetadata = state.teams.metadata;
      
      if (!teamsMetadata) {
        throw new Error('Teams metadata not loaded');
      }
      
      const teamIds = [146, 385, 467, 564, 554]; // Main teams
      const allPlayers = [];
      
      for (const teamId of teamIds) {
        try {
          const roster = await fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=active`)
            .then(res => res.json())
            .then(data => data.roster || []);
          
          const playersWithTeam = roster.map(player => ({
            ...player,
            teamId: teamId
          }));
          allPlayers.push(...playersWithTeam);
        } catch (error) {
          console.warn(`Failed to load roster for team ${teamId}:`, error);
        }
      }
      
      return allPlayers;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  allPlayers: [],
  stats: {},
  gameLogs: {},
  loading: false,
  error: null,
};

const playersSlice = createSlice({
  name: 'players',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPlayerStats: (state, action) => {
      const { playerId, season } = action.payload;
      delete state.stats[`${playerId}-${season}`];
    },
    clearPlayerGameLogs: (state, action) => {
      const { playerId, season } = action.payload;
      delete state.gameLogs[`${playerId}-${season}`];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch player stats
      .addCase(fetchPlayerStatsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlayerStatsAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { playerId, season, hitting, pitching } = action.payload;
        state.stats[`${playerId}-${season}`] = { hitting, pitching };
      })
      .addCase(fetchPlayerStatsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch player game logs
      .addCase(fetchPlayerGameLogsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlayerGameLogsAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { playerId, season, gameLogs } = action.payload;
        state.gameLogs[`${playerId}-${season}`] = gameLogs;
      })
      .addCase(fetchPlayerGameLogsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch all Marlins players
      .addCase(fetchAllMarlinsPlayersAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllMarlinsPlayersAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.allPlayers = action.payload;
      })
      .addCase(fetchAllMarlinsPlayersAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearPlayerStats, clearPlayerGameLogs } = playersSlice.actions;

// Selectors
export const selectAllPlayers = (state) => state.players.allPlayers;
export const selectPlayerStats = (state, playerId, season) => 
  state.players.stats[`${playerId}-${season}`];
export const selectPlayerGameLogs = (state, playerId, season) => 
  state.players.gameLogs[`${playerId}-${season}`];
export const selectPlayersLoading = (state) => state.players.loading;
export const selectPlayersError = (state) => state.players.error;

// Filtered selectors
export const selectPlayersByTeam = (state, teamId) => 
  state.players.allPlayers.filter(player => player.teamId === teamId);

export const selectPlayersByName = (state, searchQuery) => {
  if (!searchQuery.trim()) return state.players.allPlayers.slice(0, 20);
  
  return state.players.allPlayers
    .filter(player => 
      player.person.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 20);
};

export default playersSlice.reducer;
