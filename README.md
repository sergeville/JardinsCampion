# Jardins du Lac Campion - Logo Voting App

A modern, accessible web application for voting on logo designs for Jardins du Lac Campion. The app supports both English and French languages, features a dark/light mode theme, and provides real-time vote tracking with persistent data storage.

## Features

- 🖼️ Interactive logo grid with keyboard navigation
- 🌍 Bilingual support (English/French)
- 🌓 Dark/Light mode theme with consistent styling:
  - Dark gray theme (#2d2d2d) for improved readability
  - White backgrounds for logos in dark mode
  - Optimized contrast for text and interactive elements
- 📊 Real-time vote tracking
- 💾 Persistent data storage with MongoDB
- 📱 Responsive design
- ♿ Accessibility features
- 🔒 Vote validation and owner restrictions

## Theme Implementation

The application uses CSS variables for theming, with two main themes:

### Light Mode

```css
:root {
  --bg-color: #ffffff; /* Pure white background */
  --card-bg: #ffffff; /* Pure white card background */
  --text-color: #1b5e20; /* Dark green text */
  --accent-color: #2e7d32; /* Forest green accent */
}
```

### Dark Mode

```css
[data-theme='dark'] {
  --bg-color: #2d2d2d; /* Dark gray background */
  --card-bg: #2d2d2d; /* Dark gray card background */
  --text-color: #e8f5e9; /* Very light green text */
  --accent-color: #4caf50; /* Light green accent */
}
```

Theme switching is handled by the `useTheme` hook, which:

- Detects system color scheme preference
- Allows manual theme toggling
- Persists theme choice in localStorage
- Provides smooth transitions between themes

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Docker and Docker Compose

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/jardins-campion.git
cd jardins-campion
```

2. Install dependencies:

```bash
npm install
```

3. Start the MongoDB containers:

```bash
docker-compose up -d
```

4. Create a `.env.local` file with your database configuration (see `.env.example` for reference)

5. Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Database Setup

The application uses MongoDB for data persistence with separate development and production databases. See [DATABASE.md](Docs/DATABASE.md) for detailed setup instructions and configuration options.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production version
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run show-data` - Display database schemas and contents
- `npm run version:patch` - Bump patch version
- `npm run version:minor` - Bump minor version
- `npm run version:major` - Bump major version

## Project Structure

```text
jardins-campion/
├── docker-compose.yml    # Docker configuration for MongoDB
├── public/
│   └── logos/           # Logo images
├── src/
│   ├── app/            # Next.js app directory
│   │   └── page.tsx    # Main application page
│   ├── components/     # React components
│   │   ├── LogoGrid/   # Logo display and voting interface
│   │   ├── VoteHistory/# Vote history display
│   │   └── NameInputModal/ # User name input
│   ├── hooks/          # Custom React hooks
│   │   ├── useVoteManagement/ # Vote state and logic
│   │   ├── useTheme/   # Dark/light mode
│   │   └── useLanguage/# Language selection
│   ├── models/         # MongoDB models
│   │   ├── User.ts     # User schema and methods
│   │   ├── Vote.ts     # Vote schema and methods
│   │   └── Logo.ts     # Logo schema and methods
│   ├── lib/            # Utilities
│   │   ├── mongodb.ts  # Database connection
│   │   ├── dataConsistency.ts # Data validation
│   │   └── services/   # Database services
│   ├── scripts/        # Utility scripts
│   │   ├── version-bump.js # Version management
│   │   └── ShowMeTheData.ts # Schema display
│   └── translations/   # Language files
├── __tests__/         # Test files
└── __mocks__/         # Test mocks
```

## Database Features

### Multi-User Support

- Unique user identification
- Vote tracking per user
- Vote ownership validation
- 24-hour voting cooldown

### Vote Management

- Real-time vote tracking
- Conflict resolution for concurrent votes
- Vote status tracking (pending/confirmed/rejected)
- Vote history with timestamps

### Logo Management

- Active/inactive logo states
- Vote statistics per logo
- Owner restrictions
- Image validation

### Data Consistency

- Optimistic concurrency control
- Automatic vote count updates
- Reference integrity checks
- Conflict resolution system

## Development Tools

### Database Utilities

- `ShowMeTheData.ts` script for schema inspection
- Data validation utilities
- Conflict resolution system
- Automatic cleanup processes

### Version Management

- Semantic versioning support
- Automated version bumping
- Changelog management
- Git tag automation

### Testing Suite

- Unit tests for components
- Integration tests for database
- Accessibility testing
- Mock data generation

## Security Features

### Database Security

- Separate development/production databases
- Authentication required
- Environment-based configuration
- Docker network isolation

### Vote Validation

- User authentication
- Vote ownership checks
- Cooldown periods
- Conflict detection

### Data Protection

- Input validation
- XSS prevention
- CSRF protection
- Rate limiting

## Key Components

- `LogoGrid`: Displays logos in a grid with voting interface
- `VoteHistory`: Shows recent votes
- `NameInputModal`: Modal for entering voter's name
- `ErrorBoundary`: Handles component errors gracefully

## Custom Hooks

- `useVoteManagement`: Manages voting state and logic
- `useTheme`: Handles dark/light mode theme
- `useLanguage`: Manages language selection

## Testing

The project uses Jest and React Testing Library for testing. Tests cover:

- Component rendering
- User interactions
- Accessibility features
- Theme switching
- Language switching
- Vote management
- Error handling

## Accessibility

The app follows WCAG guidelines with features like:

- Keyboard navigation
- ARIA labels
- Semantic HTML
- Color contrast compliance
- Screen reader support

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

See [CONTRIBUTING.md](Docs/CONTRIBUTING.md) for detailed contribution guidelines.

For version history and updates, see [CHANGELOG.md](Docs/CHANGELOG.md).

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Next.js team for the amazing framework
- React Testing Library for the testing utilities
- All contributors and users of the app

## Database Management

### Docker Commands

- Start containers:

```bash
docker-compose up -d
```

- Stop containers:

```bash
docker-compose down
```

- View logs:

```bash
docker-compose logs
```

### Database Inspection

The application includes a built-in database inspection interface accessible at `/show-data`. Features include:

#### Real-time Monitoring

- Auto-refresh capability with configurable intervals (2s, 5s, 10s, 30s)
- Manual refresh button
- Real-time data updates

#### Data Filtering

- Text-based filtering across all fields
- Instant filtering results
- Case-insensitive search

#### Data Export

- Export to JSON format with timestamps
- Export to CSV format with collection separation
- Downloadable files for offline analysis

#### View Options

- Schema definitions with detailed field information
- Collection data in tabular format
- Collection counts and statistics

#### Data Management

- Add new records to any collection
- Edit existing records with a form interface
- Delete records with confirmation
- Support for all data types:
  - Text fields
  - Numbers
  - Booleans
  - Complex objects (JSON)
- Real-time validation
- Error handling and loading states

#### Usage Instructions

1. **Viewing Data**

   - Navigate to `http://localhost:3000/show-data`
   - Switch between Schemas, Collections, and Counts tabs
   - Use the filter box to search across all fields
   - Enable auto-refresh for real-time updates

2. **Adding Records**

   - Click the "Add New" button above any collection
   - Fill in the form fields
   - Complex objects can be entered as JSON
   - Click "Save" to create the record

3. **Editing Records**

   - Hover over a table row to reveal the "Edit" button
   - Click "Edit" to open the edit modal
   - Modify fields as needed
   - Click "Save" to update the record

4. **Deleting Records**

   - Open the edit modal for the record
   - Click the "Delete" button
   - Confirm the deletion when prompted

5. **Exporting Data**

   - Click "Export JSON" for complete database export
   - Click "Export CSV" for spreadsheet-compatible format
   - Files are named with timestamps for versioning

6. **Real-time Updates**
   - Enable "Auto-refresh" to see changes in real-time
   - Choose refresh interval (2s, 5s, 10s, or 30s)
   - Click "Refresh Now" for manual updates

#### Security Notes

- All database operations require proper authentication
- Validation is performed on both client and server
- Complex object inputs are validated as proper JSON
- Confirmation required for destructive operations

Access the interface at: `http://localhost:3000/show-data`
