// Helper functions for formatting data - these were tricky to get right

export function formatDateInputValue(date) {
  // Handle date string from input (YYYY-MM-DD format)
  if (typeof date === 'string' && date.includes('-')) {
    return date; // Already in correct format
  }
  
  // Handle Date object - had issues with timezone before
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getTodayDateString() {
  // Get today's date in EST timezone - this was causing issues before
  const today = new Date();
  const estDate = new Date(today.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const y = estDate.getFullYear();
  const m = String(estDate.getMonth() + 1).padStart(2, '0');
  const day = String(estDate.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatLocalTimeFromIso(isoString) {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(d);
  } catch {
    return '';
  }
}

export function extractLevelFromLeague(leagueName) {
  if (!leagueName) return '';
  
  // Handle MLB leagues (Major League, National League, American League)
  if (leagueName.includes('Major League') || leagueName.includes('National League') || leagueName.includes('American League')) {
    return 'MLB';
  }
  
  // Map league names to short labels - had to look up all these
  const map = [
    { key: 'Triple-A', label: 'AAA' },
    { key: 'International League', label: 'AAA' }, // International League is Triple-A
    { key: 'Pacific Coast League', label: 'AAA' }, // Pacific Coast League is Triple-A
    { key: 'Double-A', label: 'AA' },
    { key: 'Southern League', label: 'AA' }, // Southern League is Double-A
    { key: 'Eastern League', label: 'AA' }, // Eastern League is Double-A
    { key: 'Texas League', label: 'AA' }, // Texas League is Double-A
    { key: 'High-A', label: 'High-A' },
    { key: 'Midwest League', label: 'High-A' }, // Midwest League is High-A
    { key: 'South Atlantic League', label: 'High-A' }, // South Atlantic League is High-A
    { key: 'Northwest League', label: 'High-A' }, // Northwest League is High-A
    { key: 'Single-A', label: 'A' },
    { key: 'Florida State League', label: 'A' }, // Florida State League is Single-A
    { key: 'Carolina League', label: 'A' }, // Carolina League is Single-A
    { key: 'Florida Complex', label: 'FCL' },
    { key: 'Dominican Summer', label: 'DSL' },
  ];
  
  const found = map.find((m) => leagueName.includes(m.key));
  return found ? found.label : leagueName;
}

export function getOpponentParentClubName(teamsMetaMap, opponentTeam) {
  if (!teamsMetaMap || !opponentTeam) return '';
  
  const meta = teamsMetaMap.get(opponentTeam.id);
  if (!meta) return '';
  
  const leagueName = meta?.league?.name || '';
  const isMlb = leagueName.includes('Major League') || leagueName.includes('National League') || leagueName.includes('American League');
  
  if (isMlb) {
    return meta?.teamName || meta?.name || '';
  }
  
  // For minor league teams, show parent club name
  return meta?.parentOrgName || meta?.franchiseName || '';
}

// TODO: Add more robust timezone handling
// TODO: Consider using a date library like date-fns for better date manipulation
// TODO: Add validation for league name mapping
