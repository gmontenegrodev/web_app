import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTeamsMetadataAsync, fetchTeamRosterAsync } from '../store/slices/teamsSlice';
import { fetchPlayerStatsAsync, fetchPlayerGameLogsAsync } from '../store/slices/playersSlice';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';

const TEAM_NAMES = {
  146: 'Miami Marlins (MLB)',
  385: 'Jacksonville Jumbo Shrimp (AAA)',
  467: 'Pensacola Blue Wahoos (AA)',
  564: 'Beloit Sky Carp (High-A)',
  554: 'Jupiter Hammerheads (A)'
};

export default function PlayerStatsPage() {
  const dispatch = useAppDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [season, setSeason] = useState(2025);

  // Redux state
  const { rosters, loading: teamsLoading, error: teamsError } = useAppSelector(state => state.teams);
  const { stats, gameLogs, loading: playersLoading, error: playersError } = useAppSelector(state => state.players);

  // Get all players from rosters
  const allPlayers = React.useMemo(() => {
    const players = [];
    Object.keys(rosters).forEach(teamId => {
      const roster = rosters[teamId];
      if (roster && Array.isArray(roster)) {
        const playersWithTeam = roster.map(player => ({
          ...player,
          teamName: TEAM_NAMES[teamId] || `Team ${teamId}`,
          teamId: parseInt(teamId)
        }));
        players.push(...playersWithTeam);
      }
    });
    return players;
  }, [rosters]);

  // Filter players based on search
  const filteredPlayers = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return allPlayers.slice(0, 20);
    }
    return allPlayers
      .filter(player => 
        player.person.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 20);
  }, [searchQuery, allPlayers]);

  // Get current player data
  const currentPlayerStats = selectedPlayer ? stats[`${selectedPlayer.person.id}-${season}`] : null;
  const currentPlayerGameLogs = selectedPlayer && gameLogs ? gameLogs[`${selectedPlayer.person.id}-${season}`] || [] : [];

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load teams metadata
        await dispatch(fetchTeamsMetadataAsync()).unwrap();
        
        // Load rosters for main teams
        const teamIds = [146, 385, 467, 564, 554];
        for (const teamId of teamIds) {
          try {
            await dispatch(fetchTeamRosterAsync({ teamId, rosterType: 'active' })).unwrap();
          } catch (error) {
            console.warn(`Failed to load roster for team ${teamId}:`, error);
          }
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadInitialData();
  }, [dispatch]);

  // Load player stats when selected
  useEffect(() => {
    if (!selectedPlayer) return;

    const loadPlayerData = async () => {
      try {
        await Promise.all([
          dispatch(fetchPlayerStatsAsync({ 
            playerId: selectedPlayer.person.id, 
            season, 
            group: 'hitting' 
          })).unwrap(),
          dispatch(fetchPlayerStatsAsync({ 
            playerId: selectedPlayer.person.id, 
            season, 
            group: 'pitching' 
          })).unwrap(),
          dispatch(fetchPlayerGameLogsAsync({ 
            playerId: selectedPlayer.person.id, 
            season 
          })).unwrap()
        ]);
      } catch (error) {
        console.error('Failed to load player data:', error);
      }
    };

    loadPlayerData();
  }, [selectedPlayer, season, dispatch]);

  const formatStat = (value, type) => {
    if (value === undefined || value === null) return '—';
    
    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Check if it's a valid number
    if (typeof numValue !== 'number' || isNaN(numValue)) return '—';
    
    if (type === 'avg' || type === 'obp' || type === 'slg' || type === 'ops') {
      return numValue.toFixed(3);
    }
    if (type === 'era') {
      return numValue.toFixed(2);
    }
    if (type === 'innings') {
      return numValue.toFixed(1);
    }
    
    return numValue.toString();
  };

  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Player Statistics</h1>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search for a player..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Players List */}
        {!teamsLoading && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {searchQuery ? `Search Results (${filteredPlayers.length})` : 'All Players'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
              {filteredPlayers.map((player) => (
                <button
                  key={player.person.id}
                  onClick={() => handlePlayerClick(player)}
                  className={`text-left p-4 rounded-lg border transition-colors ${
                    selectedPlayer?.person.id === player.person.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{player.person.fullName}</div>
                  <div className="text-sm text-gray-600">{player.teamName}</div>
                  <div className="text-xs text-gray-500">{player.position?.name}</div>
                </button>
              ))}
            </div>
            {filteredPlayers.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No players found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading and Error States */}
      {(teamsLoading || playersLoading) && (
        <div className="text-center py-8">
          <LoadingSpinner label="Loading..." />
        </div>
      )}

      {(teamsError || playersError) && (
        <ErrorMessage message={teamsError || playersError} />
      )}

      {/* Selected Player Stats */}
      {selectedPlayer && !playersLoading && (
        <div className="space-y-6">
          {/* Player Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedPlayer.person.fullName}</h2>
                <p className="text-gray-600">{selectedPlayer.teamName} • {selectedPlayer.position?.name}</p>
              </div>
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Season:</label>
                <select
                  value={season}
                  onChange={(e) => setSeason(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={2025}>2025</option>
                  <option value={2024}>2024</option>
                  <option value={2023}>2023</option>
                  <option value={2022}>2022</option>
                </select>
              </div>
            </div>
          </div>

          {/* Hitting Stats */}
          {currentPlayerStats?.hitting && Object.keys(currentPlayerStats.hitting).length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Hitting Statistics</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Games</div>
                    <div className="text-xl font-semibold">{currentPlayerStats.hitting.games || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">At Bats</div>
                    <div className="text-xl font-semibold">{currentPlayerStats.hitting.atBats || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Hits</div>
                    <div className="text-xl font-semibold">{currentPlayerStats.hitting.hits || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Home Runs</div>
                    <div className="text-xl font-semibold text-blue-600">{currentPlayerStats.hitting.homeRuns || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">RBIs</div>
                    <div className="text-xl font-semibold">{currentPlayerStats.hitting.rbi || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Batting Avg</div>
                    <div className="text-xl font-semibold">{formatStat(currentPlayerStats.hitting.avg, 'avg')}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">On-Base %</div>
                    <div className="text-xl font-semibold">{formatStat(currentPlayerStats.hitting.obp, 'obp')}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Slugging %</div>
                    <div className="text-xl font-semibold">{formatStat(currentPlayerStats.hitting.slg, 'slg')}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">OPS</div>
                    <div className="text-xl font-semibold">{formatStat(currentPlayerStats.hitting.ops, 'ops')}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Walks</div>
                    <div className="text-xl font-semibold">{currentPlayerStats.hitting.baseOnBalls || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Strikeouts</div>
                    <div className="text-xl font-semibold">{currentPlayerStats.hitting.strikeOuts || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Stolen Bases</div>
                    <div className="text-xl font-semibold">{currentPlayerStats.hitting.stolenBases || '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pitching Stats */}
          {currentPlayerStats?.pitching && Object.keys(currentPlayerStats.pitching).length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Pitching Statistics</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Games</div>
                    <div className="text-xl font-semibold">{currentPlayerStats.pitching.games || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Wins</div>
                    <div className="text-xl font-semibold text-green-600">{currentPlayerStats.pitching.wins || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Losses</div>
                    <div className="text-xl font-semibold text-red-600">{currentPlayerStats.pitching.losses || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">ERA</div>
                    <div className="text-xl font-semibold">{formatStat(currentPlayerStats.pitching.era, 'era')}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Innings</div>
                    <div className="text-xl font-semibold">{formatStat(currentPlayerStats.pitching.inningsPitched, 'innings')}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Strikeouts</div>
                    <div className="text-xl font-semibold">{currentPlayerStats.pitching.strikeOuts || '—'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">WHIP</div>
                    <div className="text-xl font-semibold">{formatStat(currentPlayerStats.pitching.whip, 'whip')}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Saves</div>
                    <div className="text-xl font-semibold">{currentPlayerStats.pitching.saves || '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Game Logs */}
          {currentPlayerGameLogs.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Recent Games</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Opponent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">AB</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">H</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">HR</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RBI</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">BB</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SO</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentPlayerGameLogs.map((game, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(game.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {game.opponent?.name || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {game.stat?.atBats || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {game.stat?.hits || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {game.stat?.homeRuns || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {game.stat?.rbi || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {game.stat?.baseOnBalls || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {game.stat?.strikeOuts || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
