import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchTeamsMetadata, fetchTeamRoster, fetchTeamStats } from '../../services/api';

// Marlins org team IDs
const MARLINS_ORG_TEAM_IDS = [
  146,   // Miami Marlins (MLB)
  385,   // Jacksonville Jumbo Shrimp (AAA)
  467,   // Pensacola Blue Wahoos (AA)
  564,   // Beloit Sky Carp (High-A)
  554,   // Jupiter Hammerheads (A)
  619,   // FCL Marlins (Rookie)
  3276,  // DSL Marlins (Rookie)
  4124,  // DSL Marlins Bautista (Rookie)
  3277,  // DSL Marlins San Pedro (Rookie)
  479,   // DSL Marlins (Rookie)
  2127   // DSL Marlins (Rookie)
];

// Async thunks
export const fetchTeamsMetadataAsync = createAsyncThunk(
  'teams/fetchMetadata',
  async (_, { rejectWithValue }) => {
    try {
      const teams = await fetchTeamsMetadata(MARLINS_ORG_TEAM_IDS);
      return teams;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTeamRosterAsync = createAsyncThunk(
  'teams/fetchRoster',
  async ({ teamId, rosterType = 'active' }, { rejectWithValue }) => {
    try {
      const roster = await fetchTeamRoster(teamId, rosterType);
      return { teamId, roster };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTeamStatsAsync = createAsyncThunk(
  'teams/fetchStats',
  async ({ teamId, season = 2024 }, { rejectWithValue }) => {
    try {
      const [hittingStats, pitchingStats] = await Promise.all([
        fetchTeamStats(teamId, season, 'hitting'),
        fetchTeamStats(teamId, season, 'pitching')
      ]);
      
      return {
        teamId,
        season,
        hitting: hittingStats.stats?.[0]?.splits?.[0]?.stat || {},
        pitching: pitchingStats.stats?.[0]?.splits?.[0]?.stat || {}
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  metadata: null,
  rosters: {},
  stats: {},
  loading: false,
  error: null,
};

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearTeamStats: (state, action) => {
      const { teamId, season } = action.payload;
      delete state.stats[`${teamId}-${season}`];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch teams metadata
      .addCase(fetchTeamsMetadataAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamsMetadataAsync.fulfilled, (state, action) => {
        state.loading = false;
        console.log('=== TEAMS METADATA DEBUG ===');
        console.log('Teams metadata payload type:', typeof action.payload);
        console.log('Teams metadata is Map?', action.payload instanceof Map);
        console.log('Teams metadata keys:', Object.keys(action.payload || {}));
        console.log('Teams metadata constructor:', action.payload?.constructor?.name);
        console.log('Teams metadata sample:', action.payload ? Object.keys(action.payload).slice(0, 3) : 'null');
        console.log('=== END DEBUG ===');
        state.metadata = action.payload;
      })
      .addCase(fetchTeamsMetadataAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch team roster
      .addCase(fetchTeamRosterAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamRosterAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { teamId, roster } = action.payload;
        state.rosters[teamId] = roster;
      })
      .addCase(fetchTeamRosterAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch team stats
      .addCase(fetchTeamStatsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeamStatsAsync.fulfilled, (state, action) => {
        state.loading = false;
        const { teamId, season, hitting, pitching } = action.payload;
        state.stats[`${teamId}-${season}`] = { hitting, pitching };
      })
      .addCase(fetchTeamStatsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearTeamStats } = teamsSlice.actions;

// Selectors
export const selectTeamsMetadata = (state) => state.teams.metadata;
export const selectTeamRoster = (state, teamId) => state.teams.rosters[teamId];
export const selectTeamStats = (state, teamId, season) => 
  state.teams.stats[`${teamId}-${season}`];
export const selectTeamsLoading = (state) => state.teams.loading;
export const selectTeamsError = (state) => state.teams.error;

export default teamsSlice.reducer;
