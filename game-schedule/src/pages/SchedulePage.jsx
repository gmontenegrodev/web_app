import React, { useState, useEffect, useMemo } from 'react';
import { fetchSchedule, fetchTeamsMetadata, fetchGameLive } from '../services/api';
import DatePicker from '../components/DatePicker';
import GameTile from '../components/GameTile';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { getTodayDateString } from '../utils/formatters';

// Marlins org team IDs - copied from api.js
const MARLINS_ORG_TEAM_IDS = [
  146, 385, 467, 564, 554, 619, 3276, 4124, 3277, 479, 2127
];

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teamsMeta, setTeamsMeta] = useState(null);
  const [gamesByTeamId, setGamesByTeamId] = useState(new Map());
  const [liveByPk, setLiveByPk] = useState(new Map());

  // Fetch teams metadata on component mount
  useEffect(() => {
    async function loadTeamsMeta() {
      try {
        console.log('Loading teams metadata...'); // debugging
        const teams = await fetchTeamsMetadata();
        setTeamsMeta(teams);
      } catch (err) {
        console.error('Failed to load teams metadata:', err);
        setError('Failed to load teams data');
      }
    }
    loadTeamsMeta();
  }, []);

  // Fetch schedule and live data when date changes
  useEffect(() => {
    async function loadSchedule() {
      if (!selectedDate) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Loading schedule for date:', selectedDate); // debugging
        
        // Fetch schedule data
        const scheduleData = await fetchSchedule(selectedDate);
        const games = scheduleData?.dates?.[0]?.games || [];
        
        // Create map of games by team ID
        const gamesMap = new Map();
        MARLINS_ORG_TEAM_IDS.forEach(teamId => {
          const game = games.find(g => 
            g.teams?.home?.team?.id === teamId || g.teams?.away?.team?.id === teamId
          );
          gamesMap.set(teamId, game || null);
        });
        
        setGamesByTeamId(gamesMap);
        
        // Fetch live data for all games in parallel
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
        const liveMap = new Map(liveResults);
        setLiveByPk(liveMap);
        
      } catch (err) {
        console.error('Failed to load schedule:', err);
        setError('Failed to load schedule data');
      } finally {
        setLoading(false);
      }
    }
    
    loadSchedule();
  }, [selectedDate]);

  // Sort teams by game state priority and league rank
  const teamsList = useMemo(() => {
    if (!teamsMeta) return [];
    
    const list = MARLINS_ORG_TEAM_IDS.map((id) => teamsMeta.get(id)).filter(Boolean);
    
    // Sort by game state priority: Live > Preview > No Game
    const getGameStatePriority = (team) => {
      const game = gamesByTeamId.get(team.id);
      if (!game) return 3; // No Game - lowest priority
      
      const state = game?.status?.abstractGameState;
      if (state === 'Live') return 0; // Live - highest priority
      if (state === 'Preview') return 1; // Preview - medium priority
      return 2; // Other states (Final, etc.)
    };
    
    // Secondary sort by league rank (MLB first, then affiliates)
    const getLeagueRank = (t) => {
      const n = t?.league?.name || '';
      if (n.includes('Major League')) return 0;
      if (n.includes('Triple-A')) return 1;
      if (n.includes('Double-A')) return 2;
      if (n.includes('High-A')) return 3;
      if (n.includes('Single-A')) return 4;
      if (n.includes('Florida Complex')) return 5;
      if (n.includes('Dominican Summer')) return 6;
      return 99;
    };
    
    return list.sort((a, b) => {
      const stateA = getGameStatePriority(a);
      const stateB = getGameStatePriority(b);
      
      // First sort by game state
      if (stateA !== stateB) {
        return stateA - stateB;
      }
      
      // Then sort by league rank within same state
      return getLeagueRank(a) - getLeagueRank(b);
    });
  }, [teamsMeta, gamesByTeamId]);

  return (
    <div className="max-w-7xl mx-auto p-3">
      <h1 className="text-xl font-semibold mb-2">Miami Marlins Org Schedule</h1>
      <DatePicker date={selectedDate} onChange={setSelectedDate} />
      
      <div className='h-8'>
        {error && <ErrorMessage message={error} />}
        {loading && <LoadingSpinner label="Loading schedule…" />}
      </div>    
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"> 
        {teamsList.map((team) => {
          const game = gamesByTeamId.get(team.id);
          const live = game ? liveByPk.get(game.gamePk) : null;
          
          return (
            <GameTile
              key={team.id}
              team={team}
              game={game}
              liveData={live}
              teamsMetadata={teamsMeta}
            />
          );
        })}
      </div>      
    </div>
  );
}