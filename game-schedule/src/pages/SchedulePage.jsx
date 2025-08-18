import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  fetchTeamsMetadataAsync, 
  selectTeamsMetadata, 
  selectTeamsLoading, 
  selectTeamsError 
} from '../store/slices/teamsSlice';
import { 
  fetchScheduleAsync, 
  fetchAllGamesLiveAsync,
  selectGamesByTeamId, 
  selectLiveByPk, 
  selectCurrentDate,
  selectScheduleLoading,
  selectScheduleError,
  setCurrentDate
} from '../store/slices/scheduleSlice';
import { MARLINS_ORG_TEAM_IDS } from '../services/api';
import DatePicker from '../components/DatePicker';
import GameTile from '../components/GameTile';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { getTodayDateString } from '../utils/formatters';

export default function SchedulePage() {
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const teamsMeta = useAppSelector(selectTeamsMetadata);
  const teamsLoading = useAppSelector(selectTeamsLoading);
  const teamsError = useAppSelector(selectTeamsError);
  const gamesByTeamId = useAppSelector(selectGamesByTeamId);
  const liveByPk = useAppSelector(selectLiveByPk);
  const currentDate = useAppSelector(selectCurrentDate);
  const scheduleLoading = useAppSelector(selectScheduleLoading);
  const scheduleError = useAppSelector(selectScheduleError);

  // Local state for date picker
  const [selectedDate, setSelectedDate] = useState(currentDate || getTodayDateString());

  // Fetch teams metadata on component mount
  useEffect(() => {
    if (!teamsMeta) {
      dispatch(fetchTeamsMetadataAsync());
    }
  }, [dispatch, teamsMeta]);

  // Fetch schedule and live data when date changes
  useEffect(() => {
    if (!selectedDate) return;
    
    dispatch(fetchScheduleAsync(selectedDate));
  }, [dispatch, selectedDate]);

  // Fetch live data for games when schedule changes
  useEffect(() => {
    if (Object.keys(gamesByTeamId).length > 0) {
      const games = Object.values(gamesByTeamId).filter(Boolean);
      if (games.length > 0) {
        dispatch(fetchAllGamesLiveAsync(games));
      }
    }
  }, [dispatch, gamesByTeamId]);

  // Update current date in Redux when local date changes
  useEffect(() => {
    if (selectedDate !== currentDate) {
      dispatch(setCurrentDate(selectedDate));
    }
  }, [dispatch, selectedDate, currentDate]);

  // Sort teams by game state priority and league rank
  const teamsList = useMemo(() => {
    if (!teamsMeta) return [];
    
    const list = MARLINS_ORG_TEAM_IDS.map((id) => teamsMeta[id]).filter(Boolean);
    
    // Sort by game state priority: Live > Preview > No Game
    const getGameStatePriority = (team) => {
      const game = gamesByTeamId[team.id];
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

  // Handle date change
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  // Determine loading and error states
  const isLoading = teamsLoading || scheduleLoading;
  const error = teamsError || scheduleError;

  return (
    <div className="max-w-7xl mx-auto p-3">
      <h1 className="text-2xl font-bold mb-6">Miami Marlins Organization Schedule</h1>
      <DatePicker date={selectedDate} onChange={handleDateChange} />
      
      <div className='h-8'>
        {error && <ErrorMessage message={error} />}
        {isLoading && <LoadingSpinner label="Loading schedule…" />}
      </div>    
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"> 
        {teamsList.map((team) => {
          const game = gamesByTeamId[team.id];
          const live = game ? liveByPk[game.gamePk] : null;
          
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