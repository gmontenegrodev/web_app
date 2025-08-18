import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTeamsMetadataAsync, fetchTeamRosterAsync } from '../store/slices/teamsSlice';
import { fetchPlayerStatsAsync } from '../store/slices/playersSlice';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

// Team mapping for display
const TEAM_NAMES = {
  146: 'Miami Marlins (MLB)',
  564: 'Jacksonville Jumbo Shrimp (AAA)',
  554: 'Beloit Sky Carp (High-A)',
  467: 'Pensacola Blue Wahoos (AA)',
  385: 'Jupiter Hammerheads (A)',
  572: 'FCL Marlins (Rookie)'
};

// Available statistics for leaderboards
const HITTING_STATS = [
  { key: 'homeRuns', label: 'Home Runs', sortDesc: true },
  { key: 'rbi', label: 'RBIs', sortDesc: true },
  { key: 'avg', label: 'Batting Average', sortDesc: true },
  { key: 'obp', label: 'On-Base %', sortDesc: true },
  { key: 'slg', label: 'Slugging %', sortDesc: true },
  { key: 'ops', label: 'OPS', sortDesc: true },
  { key: 'hits', label: 'Hits', sortDesc: true },
  { key: 'doubles', label: 'Doubles', sortDesc: true },
  { key: 'triples', label: 'Triples', sortDesc: true },
  { key: 'stolenBases', label: 'Stolen Bases', sortDesc: true },
  { key: 'walks', label: 'Walks', sortDesc: true },
  { key: 'strikeOuts', label: 'Strikeouts', sortDesc: false }
];

const PITCHING_STATS = [
  { key: 'wins', label: 'Wins', sortDesc: true },
  { key: 'losses', label: 'Losses', sortDesc: false },
  { key: 'era', label: 'ERA', sortDesc: false },
  { key: 'strikeOuts', label: 'Strikeouts', sortDesc: true },
  { key: 'saves', label: 'Saves', sortDesc: true },
  { key: 'inningsPitched', label: 'Innings Pitched', sortDesc: true },
  { key: 'whip', label: 'WHIP', sortDesc: false },
  { key: 'battingAverageAgainst', label: 'BAA', sortDesc: false }
];

export default function LeaderboardsPage() {
  const dispatch = useAppDispatch();
  const [selectedTeam, setSelectedTeam] = useState('146'); // Fixed to Miami Marlins
  const [selectedStat, setSelectedStat] = useState(''); // Blank by default
  const [selectedType, setSelectedType] = useState(''); // Blank by default
  const [season, setSeason] = useState(2025); // Default to 2025
  const [fetchingPlayerStats, setFetchingPlayerStats] = useState(false);
  const [dataMode, setDataMode] = useState('current'); // 'current' or 'season'

  // Redux state
  const { metadata: teamsMeta, rosters, loading: teamsLoading, error: teamsError } = useAppSelector(state => state.teams);
  const { stats: playerStats, loading: playersLoading, error: playersError } = useAppSelector(state => state.players);

  // Handle season change - reset stat type and statistic
  const handleSeasonChange = (newSeason) => {
    setSeason(newSeason);
    setSelectedType(''); // Reset stat type
    setSelectedStat(''); // Reset statistic
  };

  // Handle stat type change - reset statistic
  const handleStatTypeChange = (newType) => {
    setSelectedType(newType);
    setSelectedStat(''); // Reset statistic
  };

  // Handle statistic change - no reset needed
  const handleStatChange = (newStat) => {
    setSelectedStat(newStat);
  };

  // Load teams metadata
  useEffect(() => {
    const loadTeamsData = async () => {
      try {
        await dispatch(fetchTeamsMetadataAsync()).unwrap();
      } catch (error) {
        console.error('Failed to load teams data:', error);
      }
    };

    loadTeamsData();
  }, [dispatch]);

  // Load team roster when team selection changes
  useEffect(() => {
    const loadTeamRoster = async () => {
      if (!selectedTeam) {
        console.log('No team selected, skipping roster load');
        return;
      }
      
      console.log(`Loading roster for team ${selectedTeam} (${TEAM_NAMES[selectedTeam]})`);
      
      try {
        await dispatch(fetchTeamRosterAsync({ teamId: parseInt(selectedTeam) })).unwrap();
        console.log(`Successfully loaded roster for team ${selectedTeam}`);
      } catch (error) {
        console.error(`Failed to load team roster for team ${selectedTeam}:`, error);
      }
    };

    loadTeamRoster();
  }, [dispatch, selectedTeam]);

  // Get current team roster
  const currentTeamRoster = rosters[selectedTeam] || [];

  // Fetch player stats when roster changes or season changes
  useEffect(() => {
    const loadPlayerStats = async () => {
      if (!currentTeamRoster || currentTeamRoster.length === 0) {
        console.log('No roster available, skipping player stats fetch');
        return;
      }
      
      if (!selectedType || !selectedStat) {
        console.log('Stat type or statistic not selected, skipping player stats fetch');
        return;
      }
      
      console.log(`Fetching stats for ${currentTeamRoster.length} players from team ${selectedTeam} for season ${season}`);
      setFetchingPlayerStats(true);
      
      try {
        // Fetch stats for first 25 players to ensure we get all potential leaders
        const playersToFetch = currentTeamRoster.slice(0, 25);
        console.log('Players to fetch stats for:', playersToFetch.map(p => p.person.fullName));
        
        for (const player of playersToFetch) {
          try {
            console.log(`Fetching stats for player: ${player.person.fullName} (ID: ${player.person.id})`);
            await dispatch(fetchPlayerStatsAsync({ 
              playerId: player.person.id, 
              season 
            })).unwrap();
            console.log(`Successfully fetched stats for ${player.person.fullName}`);
          } catch (error) {
            console.warn(`Failed to fetch stats for player ${player.person.fullName}:`, error);
          }
        }
      } catch (error) {
        console.error('Error in loadPlayerStats:', error);
      } finally {
        setFetchingPlayerStats(false);
        console.log('Finished fetching player stats');
      }
    };

    loadPlayerStats();
  }, [dispatch, selectedTeam, season, currentTeamRoster.length, selectedType, selectedStat]); // Added selectedType and selectedStat as dependencies

  // Debug: Log when filters change
  useEffect(() => {
    console.log('LeaderboardsPage - Filters changed:', {
      selectedTeam,
      selectedStat,
      selectedType,
      season,
      currentTeamRosterLength: currentTeamRoster.length,
      playerStatsKeys: Object.keys(playerStats || {})
    });
    
    // Check if any players have stats for this team/season
    if (currentTeamRoster.length > 0 && playerStats) {
      const playersWithStats = currentTeamRoster.filter(player => {
        const playerKey = `${player.person.id}-${season}`;
        return playerStats[playerKey];
      });
      
      console.log(`Team ${TEAM_NAMES[selectedTeam]}: ${playersWithStats.length} out of ${currentTeamRoster.length} players have stats for season ${season}`);
      
      if (playersWithStats.length === 0) {
        console.log('No players have stats for this team/season combination. This is common for minor league teams.');
      }
    }
    
    // Check if specific players are in our roster
    if (selectedTeam === '146' && season === 2024) { // Miami Marlins
      const jakeBurger = currentTeamRoster.find(p => 
        p.person.fullName.toLowerCase().includes('jake burger') ||
        p.person.fullName.toLowerCase().includes('burger')
      );
      const derekHill = currentTeamRoster.find(p => 
        p.person.fullName.toLowerCase().includes('derek hill') ||
        p.person.fullName.toLowerCase().includes('hill')
      );
      
      console.log('Looking for specific players:');
      console.log('Jake Burger found:', jakeBurger ? jakeBurger.person.fullName : 'NOT FOUND');
      console.log('Derek Hill found:', derekHill ? derekHill.person.fullName : 'NOT FOUND');
      
      if (jakeBurger) {
        const burgerKey = `${jakeBurger.person.id}-${season}`;
        const burgerStats = playerStats?.[burgerKey];
        console.log('Jake Burger stats:', burgerStats);
      }
      
      if (derekHill) {
        const hillKey = `${derekHill.person.id}-${season}`;
        const hillStats = playerStats?.[hillKey];
        console.log('Derek Hill stats:', hillStats);
      }
    }
  }, [selectedTeam, selectedStat, selectedType, season, currentTeamRoster.length, playerStats]);

  // Get players with stats
  const playersWithStats = React.useMemo(() => {
    if (!currentTeamRoster || !playerStats) return [];
    
    console.log('LeaderboardsPage - currentTeamRoster:', currentTeamRoster.length);
    console.log('LeaderboardsPage - playerStats keys:', Object.keys(playerStats));
    console.log('LeaderboardsPage - selectedTeam:', selectedTeam, 'season:', season);
    
    return currentTeamRoster.map(player => {
      const playerKey = `${player.person.id}-${season}`;
      const hittingStats = playerStats[playerKey]?.hitting || {};
      const pitchingStats = playerStats[playerKey]?.pitching || {};
      
      console.log(`Player ${player.person.fullName} (${playerKey}):`, { hittingStats, pitchingStats });
      
      return {
        ...player,
        hittingStats,
        pitchingStats,
        teamId: parseInt(selectedTeam)
      };
    });
  }, [currentTeamRoster, playerStats, season, selectedTeam]);

  // Filter and sort players based on selections
  const filteredAndSortedPlayers = React.useMemo(() => {
    let filtered = playersWithStats;
    
    console.log('Filtering players:', {
      totalPlayers: playersWithStats.length,
      selectedType,
      selectedStat
    });
    
    // Get stats based on type
    const stats = selectedType === 'hitting' ? 'hittingStats' : 'pitchingStats';
    
    // TEMPORARY: Show all players with any stats, not just the selected stat
    filtered = filtered.filter(player => {
      const playerStats = player[stats];
      const hasAnyStats = playerStats && Object.keys(playerStats).length > 0;
      console.log(`Player ${player.person.fullName}: has ${selectedType} stats = ${hasAnyStats}`, playerStats);
      return hasAnyStats;
    });
    
    console.log(`Players with ${selectedType} stats:`, filtered.length);
    
    // Sort by selected stat (if available) or just show all
    const statConfig = selectedType === 'hitting' 
      ? HITTING_STATS.find(s => s.key === selectedStat)
      : PITCHING_STATS.find(s => s.key === selectedStat);
    
    const sortDesc = statConfig?.sortDesc ?? true;
    
    // Log all players with their selected stat value before sorting
    console.log('Players with selected stat before sorting:');
    filtered.forEach(player => {
      const statValue = player[stats][selectedStat];
      console.log(`${player.person.fullName}: ${selectedStat} = ${statValue}`);
    });
    
    filtered.sort((a, b) => {
      const aValue = a[stats][selectedStat] || 0;
      const bValue = b[stats][selectedStat] || 0;
      
      if (sortDesc) {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });
    
    // Log top 5 after sorting
    console.log('Top 5 players after sorting:');
    filtered.slice(0, 5).forEach((player, index) => {
      const statValue = player[stats][selectedStat];
      console.log(`${index + 1}. ${player.person.fullName}: ${selectedStat} = ${statValue}`);
    });
    
    return filtered.slice(0, 10); // Top 10
  }, [playersWithStats, selectedStat, selectedType]);

  const formatStatValue = (value, statKey) => {
    if (value === undefined || value === null) return '—';
    
    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Check if it's a valid number
    if (typeof numValue !== 'number' || isNaN(numValue)) return '—';
    
    // Format based on stat type
    if (['avg', 'obp', 'slg', 'ops', 'whip', 'battingAverageAgainst'].includes(statKey)) {
      return numValue.toFixed(3);
    }
    if (['era'].includes(statKey)) {
      return numValue.toFixed(2);
    }
    if (['inningsPitched'].includes(statKey)) {
      return numValue.toFixed(1);
    }
    
    return numValue.toString();
  };

  const getStatLabel = () => {
    const allStats = [...HITTING_STATS, ...PITCHING_STATS];
    const stat = allStats.find(s => s.key === selectedStat);
    return stat?.label || selectedStat;
  };

  const isLoading = teamsLoading || playersLoading || fetchingPlayerStats;
  const error = teamsError || playersError;

  return (
    <div className="max-w-7xl mx-auto p-3">
      <h1 className="text-2xl font-bold mb-6">Marlins Organization Leaderboards</h1>
      
      {/* Page Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">🏆 Miami Marlins Performance Leaders</h2>
        <p className="text-blue-800 text-sm">
          Discover the top performers on the Miami Marlins roster. Compare players and see who leads in key hitting and pitching statistics.
        </p>
      </div>
      
      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
            <select
              value={season}
              onChange={(e) => handleSeasonChange(parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
              <option value={2022}>2022</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
            <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-700">
              Miami Marlins (MLB)
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stat Type</label>
            <select
              value={selectedType}
              onChange={(e) => handleStatTypeChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select stat type...</option>
              <option value="hitting">Hitting</option>
              <option value="pitching">Pitching</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Statistic</label>
            <select
              value={selectedStat}
              onChange={(e) => handleStatChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!selectedType}
            >
              <option value="">Select statistic...</option>
              {selectedType === 'hitting' 
                ? HITTING_STATS.map(stat => (
                    <option key={stat.key} value={stat.key}>{stat.label}</option>
                  ))
                : selectedType === 'pitching'
                ? PITCHING_STATS.map(stat => (
                    <option key={stat.key} value={stat.key}>{stat.label}</option>
                  ))
                : []
              }
            </select>
          </div>
        </div>
      </div>

      {/* Error and Loading */}
      <div className='h-8'>
        {error && <ErrorMessage message={error} />}
        {isLoading && (
          <LoadingSpinner 
            label={
              teamsLoading ? "Loading teams..." : 
              fetchingPlayerStats ? "Loading player statistics..." : 
              "Loading leaderboards…"
            } 
          />
        )}
      </div>

      {/* Selection Required Message */}
      {!isLoading && !error && (!selectedType || !selectedStat) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="text-blue-800">
            <h3 className="text-lg font-semibold mb-2">📋 Complete Your Selection</h3>
            <p className="text-sm">
              Please select the remaining fields to view the Miami Marlins leaderboard:
            </p>
            <div className="mt-3 text-xs space-y-1">
              {!selectedType && <p>• Select a stat type (hitting or pitching)</p>}
              {selectedType && !selectedStat && <p>• Select a specific statistic</p>}
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {!isLoading && !error && selectedType && selectedStat && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Miami Marlins - Top {getStatLabel()} Leaders ({season})
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Showing top 10 players from {currentTeamRoster.length} total players
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {getStatLabel()}
                  </th>
                  {selectedType === 'hitting' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        AVG
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        OPS
                      </th>
                    </>
                  )}
                  {selectedType === 'pitching' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ERA
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        WHIP
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedPlayers.map((player, index) => {
                  const stats = selectedType === 'hitting' ? player.hittingStats : player.pitchingStats;
                  return (
                    <tr key={player.person.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {player.person.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatStatValue(stats[selectedStat], selectedStat)}
                      </td>
                      {selectedType === 'hitting' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatStatValue(stats.avg, 'avg')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatStatValue(stats.ops, 'ops')}
                          </td>
                        </>
                      )}
                      {selectedType === 'pitching' && (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatStatValue(stats.era, 'era')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatStatValue(stats.whip, 'whip')}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredAndSortedPlayers.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500">
              <div className="text-lg font-medium mb-2">No players found with the selected criteria.</div>
              <div className="text-sm">
                This could be because:
                <ul className="list-disc list-inside mt-2 text-left max-w-md mx-auto">
                  <li>The selected team has no players with stats for this season</li>
                  <li>The selected statistic has no data available</li>
                  <li>There was an issue loading the player data</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Data Source Note - Moved to end of page */}
      {!isLoading && !error && selectedType && selectedStat && (
        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="font-semibold text-orange-800 mb-2">📊 Data Source Note</p>
          <p className="text-xs text-orange-700">
            <strong>Important:</strong> This shows statistics for Miami Marlins players currently on the active roster. 
            Players who were traded, released, or moved during the season may not appear.
            <br/><br/>
            <strong>Why rankings may differ from other sources:</strong>
            <br/>• <strong>Current roster only:</strong> We show stats for active players, not full season roster
            <br/>• <strong>Player transfers:</strong> Traded players (like Jake Burger) won't appear in current rankings
            <br/>• <strong>Different data sources:</strong> Other sites may use full season data from all teams
            <br/>• <strong>Update frequency:</strong> Roster changes may not be immediately reflected
          </p>
        </div>
      )}
    </div>
  );
}
