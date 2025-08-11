import React from 'react';
import { extractLevelFromLeague, getOpponentParentClubName, formatLocalTimeFromIso } from '../utils/formatters';

// Component to show runners on base - this was fun to build
function RunnersOnBase({ liveData }) {
  const runners = liveData?.liveData?.plays?.currentPlay?.runners || [];
  if (runners.length === 0) return 'None';
  
  const bases = ['1st', '2nd', '3rd'];
  const onBase = runners
    .filter(r => r.movement?.start === null && r.movement?.end)
    .map(r => bases[r.movement.end - 1])
    .join(', ');
  
  return onBase || 'None';
}

export default function GameTile({ team, game, liveData, teamsMetadata }) {
  const teamName = team?.name || team?.teamName || '';
  const level = extractLevelFromLeague(team?.league?.name || '');

  // Debug: log team data to see what we're getting
  console.log('Team:', team?.name, 'League:', team?.league?.name, 'Level:', level);

  if (!game) {
    return (
      <div className="border border-gray-200 rounded-lg p-3 bg-white text-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-slate-900 truncate" title={teamName}>{teamName}</div>
          <div><span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-700">
            {level || '—'}
          </span>
          </div>
        </div>
        <div className="text-[13px] text-gray-600">NO GAME</div>
      </div>
    );
  }

  const isHome = game?.teams?.home?.team?.id === team?.id;
  const opponent = isHome ? game?.teams?.away?.team : game?.teams?.home?.team;
  const opponentParent = getOpponentParentClubName(teamsMetadata, opponent);
  const venue = game?.venue?.name;
  const state = game?.status?.abstractGameState; // Preview | Live | Final
  const detailedState = game?.status?.detailedState;

  // Style based on game state - learned this pattern from Tailwind docs
  const stateStyle = state === 'Live'
    ? { badge: 'bg-green-100 text-green-800', left: 'border-l-4 border-green-400' }
    : state === 'Final'
      ? { badge: 'bg-slate-100 text-slate-800', left: 'border-l-4 border-slate-300' }
      : { badge: 'bg-yellow-100 text-yellow-800', left: 'border-l-4 border-yellow-300' };
      
  const stateBadge = (
    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium ${stateStyle.badge}`}>
      {state === 'Live' ? 'Live' : (detailedState || state)}
    </span>
  );

  let body = null;
  if (state === 'Preview') {
    const time = formatLocalTimeFromIso(game?.gameDate);
    const homeProb = game?.teams?.home?.probablePitcher?.fullName;
    const awayProb = game?.teams?.away?.probablePitcher?.fullName;
    
    // Debug: log the probable pitcher data - this was hard to get right
    console.log('Preview game for team:', teamName);
    console.log('Game state:', state);
    console.log('Home probable pitcher:', homeProb);
    console.log('Away probable pitcher:', awayProb);
    console.log('Full game data:', game);
    
    body = (
      <dl className="text-[13px] space-y-1.5">
        <div className="flex justify-between gap-2"><dt className="text-gray-500">Time</dt><dd className="font-medium text-slate-900">{time || 'TBD'}</dd></div>
        <div className="flex justify-between gap-2"><dt className="text-gray-500">Opponent</dt><dd className="font-medium text-slate-900 truncate" title={opponent?.name}>{opponent?.name}{opponentParent && ` (${opponentParent})`}</dd></div>
        {venue && (
          <div className="flex justify-between gap-2"><dt className="text-gray-500">Venue</dt><dd className="font-medium text-slate-900 truncate" title={venue}>{venue}</dd></div>
        )}
        <>
          <div className="flex justify-between gap-2"><dt className="text-gray-500">SP ({game?.teams?.home?.team?.name})</dt><dd className="font-medium text-slate-900 truncate">{homeProb || 'TBD'}</dd></div>
          <div className="flex justify-between gap-2"><dt className="text-gray-500">SP ({game?.teams?.away?.team?.name})</dt><dd className="font-medium text-slate-900 truncate">{awayProb || 'TBD'}</dd></div>
        </>
      </dl>
    );
  } else if (state === 'Live') {
    const linescore = liveData?.liveData?.linescore;
    const inning = linescore?.currentInning;
    const half = linescore?.isTopInning != null ? (linescore.isTopInning ? 'Top' : 'Bot') : linescore?.inningState || '';
    const outs = linescore?.outs ?? 0;
    const homeRuns = linescore?.teams?.home?.runs ?? 0;
    const awayRuns = linescore?.teams?.away?.runs ?? 0;
    
    // Try multiple paths to get current pitcher and batter - this was tricky
    let pitcher = undefined;
    let batter = undefined;
    
    // Method 1: Try linescore defense/offense
    const pitcherId1 = liveData?.liveData?.linescore?.defense?.pitcher;
    const batterId1 = liveData?.liveData?.linescore?.offense?.batter;
    
    if (pitcherId1) {
      pitcher = liveData?.liveData?.boxscore?.players?.[`ID${pitcherId1}`]?.person?.fullName;
    }
    if (batterId1) {
      batter = liveData?.liveData?.boxscore?.players?.[`ID${batterId1}`]?.person?.fullName;
    }
    
    // Method 2: Try current play data
    if (!pitcher || !batter) {
      const currentPlay = liveData?.liveData?.plays?.currentPlay;
      if (currentPlay) {
        if (!pitcher && currentPlay.matchup?.pitcher?.fullName) {
          pitcher = currentPlay.matchup.pitcher.fullName;
        }
        if (!batter && currentPlay.matchup?.batter?.fullName) {
          batter = currentPlay.matchup.batter.fullName;
        }
      }
    }
    
    // Method 3: Try last play data
    if (!pitcher || !batter) {
      const plays = liveData?.liveData?.plays?.allPlays;
      if (plays && plays.length > 0) {
        const lastPlay = plays[plays.length - 1];
        if (!pitcher && lastPlay.matchup?.pitcher?.fullName) {
          pitcher = lastPlay.matchup.pitcher.fullName;
        }
        if (!batter && lastPlay.matchup?.batter?.fullName) {
          batter = lastPlay.matchup.batter.fullName;
        }
      }
    }
    
    // Method 4: Try boxscore teams data - fallback method
    if (!pitcher || !batter) {
      const homeTeam = liveData?.liveData?.boxscore?.teams?.home;
      const awayTeam = liveData?.liveData?.boxscore?.teams?.away;
      
      if (!pitcher) {
        const homePitchers = homeTeam?.pitchers || [];
        const awayPitchers = awayTeam?.pitchers || [];
        const allPitchers = [...homePitchers, ...awayPitchers];
        if (allPitchers.length > 0) {
          pitcher = allPitchers[0]?.person?.fullName;
        }
      }
      
      if (!batter) {
        const homeBatters = homeTeam?.batters || [];
        const awayBatters = awayTeam?.batters || [];
        const allBatters = [...homeBatters, ...awayBatters];
        if (allBatters.length > 0) {
          batter = allBatters[0]?.person?.fullName;
        }
      }
    }
    
    // Debug: log the live data structure to see what's available
    console.log('Live data for game:', game?.gamePk);
    console.log('Linescore defense:', liveData?.liveData?.linescore?.defense);
    console.log('Linescore offense:', liveData?.liveData?.linescore?.offense);
    console.log('Current play:', liveData?.liveData?.plays?.currentPlay);
    console.log('Boxscore teams:', liveData?.liveData?.boxscore?.teams);
    console.log('Final Pitcher:', pitcher, 'Final Batter:', batter);
    
    body = (
      <div className="space-y-1.5 text-[13px]">
        <div className="flex justify-between gap-2"><span className="text-gray-500">Opponent</span><span className="font-medium text-slate-900 truncate" title={opponent?.name}>{opponent?.name}{opponentParent && ` (${opponentParent})`}</span></div>
        {venue && <div className="flex justify-between gap-2"><span className="text-gray-500">Venue</span><span className="font-medium text-slate-900 truncate" title={venue}>{venue}</span></div>}
        <div className="flex items-baseline justify-between">
          <span className="text-gray-500">Score</span>
          <span className="font-semibold text-slate-900 text-sm">{awayRuns} - {homeRuns} <span className="font-normal text-gray-600">({game?.teams?.away?.team?.name} - {game?.teams?.home?.team?.name})</span></span>
        </div>
        <div className="flex justify-between gap-2"><span className="text-gray-500">Inning</span><span className="font-medium text-slate-900">{half} {inning} • Outs: {outs}</span></div>
        <div className="flex justify-between gap-2"><span className="text-gray-500">Runners</span><span className="font-medium text-slate-900"><RunnersOnBase liveData={liveData} /></span></div>
        <div className="flex justify-between gap-2"><span className="text-gray-500">Current</span><span className="font-medium text-slate-900">P: {pitcher || '—'} • B: {batter || '—'}</span></div>
      </div>
    );
  } else if (state === 'Final') {
    const linescore = liveData?.liveData?.linescore;
    const homeRuns = linescore?.teams?.home?.runs ?? 0;
    const awayRuns = linescore?.teams?.away?.runs ?? 0;
    const decisions = liveData?.liveData?.decisions || {};
    
    body = (
      <dl className="text-[13px] space-y-1.5">
        <div className="flex justify-between gap-2"><dt className="text-gray-500">Final</dt><dd className="font-semibold text-slate-900">{awayRuns} - {homeRuns} <span className="font-normal text-gray-600">({game?.teams?.away?.team?.name} - {game?.teams?.home?.team?.name})</span></dd></div>
        <div className="flex justify-between gap-2"><dt className="text-gray-500">Pitchers</dt><dd className="font-medium text-slate-900">W: {decisions?.winner?.fullName || '—'} • L: {decisions?.loser?.fullName || '—'}{decisions?.save?.fullName ? ` • SV: ${decisions.save.fullName}` : ''}</dd></div>
        <div className="flex justify-between gap-2"><dt className="text-gray-500">Opponent</dt><dd className="font-medium text-slate-900 truncate" title={opponent?.name}>{opponent?.name}{opponentParent && ` (${opponentParent})`}</dd></div>
        {venue && <div className="flex justify-between gap-2"><dt className="text-gray-500">Venue</dt><dd className="font-medium text-slate-900 truncate" title={venue}>{venue}</dd></div>}
      </dl>
    );
  } else {
    body = (
      <dl className="text-[13px] space-y-1.5">
        <div className="flex justify-between gap-2"><dt className="text-gray-500">State</dt><dd className="font-medium text-slate-900">{detailedState || state}</dd></div>
        <div className="flex justify-between gap-2"><dt className="text-gray-500">Opponent</dt><dd className="font-medium text-slate-900 truncate" title={opponent?.name}>{opponent?.name}{opponentParent && ` (${opponentParent})`}</dd></div>
        {venue && <div className="flex justify-between gap-2"><dt className="text-gray-500">Venue</dt><dd className="font-medium text-slate-900 truncate" title={venue}>{venue}</dd></div>}
      </dl>
    );
  }

  return (
    <div className={`border border-gray-200 rounded-lg p-3 bg-white text-slate-800 shadow-sm ${stateStyle.left}`}>      
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-slate-900 truncate" title={teamName}>{teamName}</div>
        <div className="flex items-center gap-1.5">
          {stateBadge}
          <span className="inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-700">
            {level || '—'}
          </span>
        </div>
      </div>      
      {body}
    </div>
  );
}


