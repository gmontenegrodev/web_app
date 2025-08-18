// src/services/api.js
import axios from 'axios';

// Marlins org team IDs - found these by looking at the API examples
export const MARLINS_ORG_TEAM_IDS = [
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

// Sport IDs for different levels - had to look this up in MLB API docs
const SPORT_IDS = [1, 21, 16, 11, 13, 12, 14];

// League mapping for better display
export const LEAGUE_NAMES = {
  103: 'American League',
  104: 'National League',
  110: 'International League',
  111: 'Pacific Coast League',
  112: 'Eastern League',
  113: 'Southern League',
  114: 'Texas League',
  115: 'California League',
  116: 'Carolina League',
  117: 'Florida State League',
  118: 'Midwest League',
  119: 'South Atlantic League',
  120: 'New York-Penn League',
  121: 'Northwest League',
  122: 'Appalachian League',
  123: 'Pioneer League',
  124: 'Arizona League',
  125: 'Gulf Coast League',
  126: 'Dominican Summer League',
  127: 'Venezuelan Summer League'
};

function buildScheduleUrl(date) {
  // Build the URL with all team IDs and sport IDs
  const teamParams = MARLINS_ORG_TEAM_IDS.map(id => `teamId=${id}`).join('&');
  const sportParams = SPORT_IDS.map(id => `sportId=${id}`).join('&');
  
  let url = `https://statsapi.mlb.com/api/v1/schedule?${teamParams}&${sportParams}`;
  
  if (date) {
    url += `&date=${date}`;
  }
  
  return url;
}

export async function fetchSchedule(date) {
  try {
    const url = buildScheduleUrl(date);
    console.log('Fetching schedule from:', url); // debugging
    const { data } = await axios.get(url);
    return data;
  } catch (error) {
    console.error('Error fetching schedule:', error);
    throw error;
  }
}

export async function fetchTeamsMetadata(teamIds = MARLINS_ORG_TEAM_IDS) {
  try {
    const params = teamIds.map((id) => `teamId=${id}`).join('&');
    const url = `https://statsapi.mlb.com/api/v1/teams?${params}`;
    const { data } = await axios.get(url);
    const teams = data?.teams || [];
    
    // Convert to plain object instead of Map for Redux compatibility
    const teamsObject = {};
    teams.forEach((team) => {
      teamsObject[team.id] = team;
    });
    
    return teamsObject;
  } catch (error) {
    console.error('Error fetching teams metadata:', error);
    throw error;
  }
}

export async function fetchGameLive(gamePk) {
  try {
    const url = `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`;
    const { data } = await axios.get(url);
    return data;
  } catch (error) {
    console.error('Error fetching live game data:', error);
    throw error;
  }
}

// New functions for analytics dashboard

export async function fetchTeamRoster(teamId, rosterType = 'active') {
  try {
    const url = `https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?rosterType=${rosterType}`;
    const { data } = await axios.get(url);
    return data.roster || [];
  } catch (error) {
    console.error('Error fetching team roster:', error);
    throw error;
  }
}

export async function fetchPlayerStats(playerId, season = 2024, group = 'hitting') {
  try {
    const url = `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=season&group=${group}&season=${season}`;
    const { data } = await axios.get(url);
    return data;
  } catch (error) {
    console.error('Error fetching player stats:', error);
    throw error;
  }
}

export async function fetchTeamStats(teamId, season = 2024, group = 'hitting') {
  try {
    const url = `https://statsapi.mlb.com/api/v1/teams/${teamId}/stats?season=${season}&group=${group}`;
    const { data } = await axios.get(url);
    return data;
  } catch (error) {
    console.error('Error fetching team stats:', error);
    throw error;
  }
}

export async function fetchLeagueLeaders(season = 2024, group = 'hitting', stat = 'homeRuns', limit = 10) {
  try {
    const url = `https://statsapi.mlb.com/api/v1/stats/leaders?season=${season}&group=${group}&stat=${stat}&limit=${limit}`;
    const { data } = await axios.get(url);
    return data;
  } catch (error) {
    console.error('Error fetching league leaders:', error);
    throw error;
  }
}

export async function searchPlayer(query) {
  try {
    const url = `https://statsapi.mlb.com/api/v1/people?search=${encodeURIComponent(query)}`;
    const { data } = await axios.get(url);
    return data.people || [];
  } catch (error) {
    console.error('Error searching player:', error);
    throw error;
  }
}

export async function fetchPlayerGameLogs(playerId, season = 2024) {
  try {
    const url = `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=gameLog&season=${season}`;
    const { data } = await axios.get(url);
    return data;
  } catch (error) {
    console.error('Error fetching player game logs:', error);
    throw error;
  }
}

// Helper function to get all Marlins players with stats
export async function fetchAllMarlinsPlayersStats(season = 2024) {
  try {
    const allPlayers = [];
    
    // Fetch roster for each team
    for (const teamId of MARLINS_ORG_TEAM_IDS) {
      try {
        const roster = await fetchTeamRoster(teamId);
        
        // Get stats for each player
        const playersWithStats = await Promise.all(
          roster.map(async (player) => {
            try {
              const hittingStats = await fetchPlayerStats(player.person.id, season, 'hitting');
              const pitchingStats = await fetchPlayerStats(player.person.id, season, 'pitching');
              
              return {
                ...player,
                hittingStats: hittingStats.stats?.[0]?.splits?.[0]?.stat || {},
                pitchingStats: pitchingStats.stats?.[0]?.splits?.[0]?.stat || {},
                teamId
              };
            } catch (error) {
              console.warn(`Failed to fetch stats for player ${player.person.fullName}:`, error);
              return {
                ...player,
                hittingStats: {},
                pitchingStats: {},
                teamId
              };
            }
          })
        );
        
        allPlayers.push(...playersWithStats);
      } catch (error) {
        console.warn(`Failed to fetch roster for team ${teamId}:`, error);
      }
    }
    
    return allPlayers;
  } catch (error) {
    console.error('Error fetching all Marlins players stats:', error);
    throw error;
  }
}

// TODO: Add caching to avoid repeated API calls for same data
// TODO: Add retry logic for failed requests
// TODO: Consider using React Query or SWR for better data management