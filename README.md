# Jardins Campion Logo Voting App

A modern Next.js application for collecting votes on logo designs. Users can view logo options, select their favorite, and submit their vote along with their name.

![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue)
![React](https://img.shields.io/badge/React-19.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

## Features

- 🎨 Interactive logo gallery with hover effects
- 📱 Responsive design that works on all devices
- ✨ Clean, modern UI with smooth animations
- 🔍 High-quality image display with Next.js Image optimization
- 📊 Real-time vote counting and history tracking
- 👤 User name collection with each vote
- 🔄 Smart vote management:
  - Users can change their vote
  - Previous vote is automatically decremented
  - Prevents duplicate votes for the same logo
  - Shows vote history with timestamps
- 🎯 Form validation and error handling

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
.
├── public/
│   ├── logos/        # Logo images
│   ├── favicon.svg   # Site favicon
│   └── icon.svg      # Site icon
├── src/
│   └── app/
│       ├── page.tsx   # Main voting page
│       ├── layout.tsx # Root layout
│       └── globals.css # Global styles
├── package.json
└── tsconfig.json
```

## Technology Stack

- **Framework**: Next.js 13+ with App Router
- **Language**: TypeScript
- **Styling**: CSS Modules
- **State Management**: React Hooks
- **Image Optimization**: Next.js Image Component
- **Form Handling**: Native HTML5 Forms

## Voting System Features

### User Vote Management
- Each user can vote once per logo
- Users can change their vote at any time
- Previous votes are automatically decremented when changed
- Duplicate votes for the same logo are prevented

### Vote History
- Real-time vote tracking
- Shows who voted for which logo
- Includes timestamps for each vote
- Maintains a chronological list of all votes

### Vote Counting
- Accurate vote counting with duplicate prevention
- Automatic vote count adjustment when users change votes
- Zero-floor protection for vote counts

## Development

### Prerequisites

- Node.js 16.8 or later
- npm or yarn

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/sergeville/jardins-campion.git
   cd jardins-campion
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

### Adding New Logos

Place new logo files in the `public/logos` directory and update the logo array in `src/app/page.tsx`.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
