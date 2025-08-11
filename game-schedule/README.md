# Miami Marlins Organization Schedule Viewer

A React web application that displays the schedule and game status for all Miami Marlins affiliate teams.

## Features

- View schedule for any date in the 2025 season
- Real-time game status (Preview, Live, Final)
- Live game data including scores, innings, and current players
- Responsive design with Tailwind CSS


### API Integration
- Working with MLB's Stats API
- Handling complex nested JSON responses
- Managing multiple API endpoints (schedule, live data, team metadata)

### React Patterns
- Using hooks (useState, useEffect, useMemo)
- Component composition and prop drilling
- Error handling and loading states

### Data Processing
- Mapping and filtering complex data structures
- Timezone handling (EST for baseball)
- Conditional rendering based on game states

### Challenges I Faced
- The live game data API structure was tricky - had to try multiple paths to get current pitcher/batter
- Timezone issues with date picker - had to explicitly handle EST
- League name mapping - had to look up all the different minor league names

## Technical Details

- Built with React 18 and Vite
- Styled with Tailwind CSS
- Uses Axios for API calls
- Fetches data from MLB Stats API

## Running the Project

```bash
npm install
npm run dev
```

## API Endpoints Used

- Schedule: `https://statsapi.mlb.com/api/v1/schedule`
- Live Game Data: `https://statsapi.mlb.com/api/v1.1/game/{gamePk}/feed/live`
- Team Metadata: `https://statsapi.mlb.com/api/v1/teams`

## Future Improvements

- Add game highlights/replays
- Implement notifications for game start
- Add player statistics
- Improve mobile experience
