// src/services/api.js
import axios from 'axios';

// Marlins org team IDs - found these by looking at the API examples
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

// Sport IDs for different levels - had to look this up in MLB API docs
const SPORT_IDS = [1, 21, 16, 11, 13, 12, 14];

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
    
    // Convert to Map for easier lookup - learned this pattern from React docs
    return new Map(teams.map((t) => [t.id, t]));
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

// TODO: Add caching to avoid repeated API calls for same data
// TODO: Add retry logic for failed requests
// TODO: Consider using React Query or SWR for better data management