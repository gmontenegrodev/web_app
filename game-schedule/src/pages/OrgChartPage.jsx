import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTeamsMetadataAsync } from '../store/slices/teamsSlice';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

// Marlins organization structure
const MARLINS_ORG_STRUCTURE = {
  MLB: {
    id: 146,
    name: 'Miami Marlins',
    level: 'Major League Baseball',
    description: 'The parent club - Major League Baseball team',
    color: 'bg-blue-600',
    textColor: 'text-white'
  },
  AAA: {
    id: 554,
    name: 'Jacksonville Jumbo Shrimp',
    level: 'Triple-A',
    description: 'AAA affiliate - International League',
    color: 'bg-green-600',
    textColor: 'text-white'
  },
  AA: {
    id: 564,
    name: 'Pensacola Blue Wahoos',
    level: 'Double-A',
    description: 'AA affiliate - Southern League',
    color: 'bg-purple-600',
    textColor: 'text-white'
  },
  A_PLUS: {
    id: 467,
    name: 'Beloit Sky Carp',
    level: 'High-A',
    description: 'High-A affiliate - Midwest League',
    color: 'bg-orange-600',
    textColor: 'text-white'
  },
  A: {
    id: 385,
    name: 'Jupiter Hammerheads',
    level: 'Single-A',
    description: 'Single-A affiliate - Florida State League',
    color: 'bg-red-600',
    textColor: 'text-white'
  },
  ROOKIE: {
    id: 572,
    name: 'FCL Marlins',
    level: 'Rookie',
    description: 'Rookie affiliate - Florida Complex League',
    color: 'bg-gray-600',
    textColor: 'text-white'
  }
};

export default function OrgChartPage() {
  const dispatch = useAppDispatch();
  const [selectedTeam, setSelectedTeam] = useState(null);
  
  // Redux state
  const { metadata: teamsMeta, loading: teamsLoading, error: teamsError } = useAppSelector(state => state.teams);

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

  const handleTeamClick = (teamKey) => {
    setSelectedTeam(selectedTeam === teamKey ? null : teamKey);
  };

  const getTeamDetails = (teamKey) => {
    const teamConfig = MARLINS_ORG_STRUCTURE[teamKey];
    if (!teamConfig) return null;
    
    const teamData = teamsMeta?.[teamConfig.id];
    return {
      ...teamConfig,
      data: teamData
    };
  };

  return (
    <div className="max-w-7xl mx-auto p-3">
      <h1 className="text-2xl font-bold mb-6">Miami Marlins Organization Chart</h1>
      
      {/* Page Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">🏢 Marlins Baseball Organization</h2>
        <p className="text-blue-800 text-sm">
          Explore the complete Miami Marlins organization structure, from the Major League club down to the rookie levels. 
          Click on any team to see detailed information about their league, division, and venue.
        </p>
      </div>

      {/* Error and Loading States */}
      <div className='h-8'>
        {teamsError && <ErrorMessage message={teamsError} />}
        {teamsLoading && <LoadingSpinner label="Loading organization data..." />}
      </div>

      {/* Organization Chart */}
      {!teamsLoading && teamsMeta && (
        <div className="space-y-8">
          {/* MLB Level */}
          <div className="flex justify-center">
            <div className="text-center">
              <div 
                className={`${MARLINS_ORG_STRUCTURE.MLB.color} ${MARLINS_ORG_STRUCTURE.MLB.textColor} rounded-lg p-6 shadow-lg cursor-pointer transform transition-all duration-200 hover:scale-105`}
                onClick={() => handleTeamClick('MLB')}
              >
                <div className="text-2xl font-bold">{MARLINS_ORG_STRUCTURE.MLB.name}</div>
                <div className="text-sm opacity-90">{MARLINS_ORG_STRUCTURE.MLB.level}</div>
              </div>
              {selectedTeam === 'MLB' && (
                <div className="mt-4 bg-white rounded-lg shadow-md p-4 max-w-md">
                  <h3 className="font-semibold text-gray-900 mb-2">Team Details</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>League:</strong> {getTeamDetails('MLB')?.data?.league?.name || '—'}</p>
                    <p><strong>Division:</strong> {getTeamDetails('MLB')?.data?.division?.name || '—'}</p>
                    <p><strong>Venue:</strong> {getTeamDetails('MLB')?.data?.venue?.name || '—'}</p>
                    <p><strong>First Year:</strong> {getTeamDetails('MLB')?.data?.firstYearOfPlay || '—'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Connection Line */}
          <div className="flex justify-center">
            <div className="w-px h-8 bg-gray-300"></div>
          </div>

          {/* AAA Level */}
          <div className="flex justify-center">
            <div className="text-center">
              <div 
                className={`${MARLINS_ORG_STRUCTURE.AAA.color} ${MARLINS_ORG_STRUCTURE.AAA.textColor} rounded-lg p-4 shadow-lg cursor-pointer transform transition-all duration-200 hover:scale-105`}
                onClick={() => handleTeamClick('AAA')}
              >
                <div className="text-lg font-bold">{MARLINS_ORG_STRUCTURE.AAA.name}</div>
                <div className="text-xs opacity-90">{MARLINS_ORG_STRUCTURE.AAA.level}</div>
              </div>
              {selectedTeam === 'AAA' && (
                <div className="mt-4 bg-white rounded-lg shadow-md p-4 max-w-md">
                  <h3 className="font-semibold text-gray-900 mb-2">Team Details</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>League:</strong> {getTeamDetails('AAA')?.data?.league?.name || '—'}</p>
                    <p><strong>Division:</strong> {getTeamDetails('AAA')?.data?.division?.name || '—'}</p>
                    <p><strong>Venue:</strong> {getTeamDetails('AAA')?.data?.venue?.name || '—'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Connection Line */}
          <div className="flex justify-center">
            <div className="w-px h-8 bg-gray-300"></div>
          </div>

          {/* AA Level */}
          <div className="flex justify-center">
            <div className="text-center">
              <div 
                className={`${MARLINS_ORG_STRUCTURE.AA.color} ${MARLINS_ORG_STRUCTURE.AA.textColor} rounded-lg p-4 shadow-lg cursor-pointer transform transition-all duration-200 hover:scale-105`}
                onClick={() => handleTeamClick('AA')}
              >
                <div className="text-lg font-bold">{MARLINS_ORG_STRUCTURE.AA.name}</div>
                <div className="text-xs opacity-90">{MARLINS_ORG_STRUCTURE.AA.level}</div>
              </div>
              {selectedTeam === 'AA' && (
                <div className="mt-4 bg-white rounded-lg shadow-md p-4 max-w-md">
                  <h3 className="font-semibold text-gray-900 mb-2">Team Details</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>League:</strong> {getTeamDetails('AA')?.data?.league?.name || '—'}</p>
                    <p><strong>Division:</strong> {getTeamDetails('AA')?.data?.division?.name || '—'}</p>
                    <p><strong>Venue:</strong> {getTeamDetails('AA')?.data?.venue?.name || '—'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Connection Line */}
          <div className="flex justify-center">
            <div className="w-px h-8 bg-gray-300"></div>
          </div>

          {/* A+ and A Levels Side by Side */}
          <div className="flex justify-center space-x-16">
            {/* A+ Level */}
            <div className="text-center">
              <div 
                className={`${MARLINS_ORG_STRUCTURE.A_PLUS.color} ${MARLINS_ORG_STRUCTURE.A_PLUS.textColor} rounded-lg p-4 shadow-lg cursor-pointer transform transition-all duration-200 hover:scale-105`}
                onClick={() => handleTeamClick('A_PLUS')}
              >
                <div className="text-lg font-bold">{MARLINS_ORG_STRUCTURE.A_PLUS.name}</div>
                <div className="text-xs opacity-90">{MARLINS_ORG_STRUCTURE.A_PLUS.level}</div>
              </div>
              {selectedTeam === 'A_PLUS' && (
                <div className="mt-4 bg-white rounded-lg shadow-md p-4 max-w-md">
                  <h3 className="font-semibold text-gray-900 mb-2">Team Details</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>League:</strong> {getTeamDetails('A_PLUS')?.data?.league?.name || '—'}</p>
                    <p><strong>Division:</strong> {getTeamDetails('A_PLUS')?.data?.division?.name || '—'}</p>
                    <p><strong>Venue:</strong> {getTeamDetails('A_PLUS')?.data?.venue?.name || '—'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* A Level */}
            <div className="text-center">
              <div 
                className={`${MARLINS_ORG_STRUCTURE.A.color} ${MARLINS_ORG_STRUCTURE.A.textColor} rounded-lg p-4 shadow-lg cursor-pointer transform transition-all duration-200 hover:scale-105`}
                onClick={() => handleTeamClick('A')}
              >
                <div className="text-lg font-bold">{MARLINS_ORG_STRUCTURE.A.name}</div>
                <div className="text-xs opacity-90">{MARLINS_ORG_STRUCTURE.A.level}</div>
              </div>
              {selectedTeam === 'A' && (
                <div className="mt-4 bg-white rounded-lg shadow-md p-4 max-w-md">
                  <h3 className="font-semibold text-gray-900 mb-2">Team Details</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>League:</strong> {getTeamDetails('A')?.data?.league?.name || '—'}</p>
                    <p><strong>Division:</strong> {getTeamDetails('A')?.data?.division?.name || '—'}</p>
                    <p><strong>Venue:</strong> {getTeamDetails('A')?.data?.venue?.name || '—'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Connection Line */}
          <div className="flex justify-center">
            <div className="w-px h-8 bg-gray-300"></div>
          </div>

          {/* Rookie Level */}
          <div className="flex justify-center">
            <div className="text-center">
              <div 
                className={`${MARLINS_ORG_STRUCTURE.ROOKIE.color} ${MARLINS_ORG_STRUCTURE.ROOKIE.textColor} rounded-lg p-4 shadow-lg cursor-pointer transform transition-all duration-200 hover:scale-105`}
                onClick={() => handleTeamClick('ROOKIE')}
              >
                <div className="text-lg font-bold">{MARLINS_ORG_STRUCTURE.ROOKIE.name}</div>
                <div className="text-xs opacity-90">{MARLINS_ORG_STRUCTURE.ROOKIE.level}</div>
              </div>
              {selectedTeam === 'ROOKIE' && (
                <div className="mt-4 bg-white rounded-lg shadow-md p-4 max-w-md">
                  <h3 className="font-semibold text-gray-900 mb-2">Team Details</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>League:</strong> {getTeamDetails('ROOKIE')?.data?.league?.name || '—'}</p>
                    <p><strong>Division:</strong> {getTeamDetails('ROOKIE')?.data?.division?.name || '—'}</p>
                    <p><strong>Venue:</strong> {getTeamDetails('ROOKIE')?.data?.venue?.name || '—'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Organization Summary */}
      {!teamsLoading && teamsMeta && (
        <div className="mt-12 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Organization Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-blue-900">Total Teams</div>
              <div className="text-2xl font-bold text-blue-600">6</div>
              <div className="text-xs text-blue-700">Across all levels</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-green-900">Geographic Coverage</div>
              <div className="text-2xl font-bold text-green-600">4 States</div>
              <div className="text-xs text-green-700">FL, AL, WI, GA</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-purple-900">Player Development</div>
              <div className="text-2xl font-bold text-purple-600">Complete</div>
              <div className="text-xs text-purple-700">Rookie to MLB</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
