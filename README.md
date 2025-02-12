# Jardins du Lac Campion - Logo Voting App

A modern, accessible web application for voting on logo designs for Jardins du Lac Campion. The app supports both English and French languages, features a dark/light mode theme, and provides real-time vote tracking.

## Features

- 🖼️ Interactive logo grid with keyboard navigation
- 🌍 Bilingual support (English/French)
- 🌓 Dark/Light mode theme with consistent styling:
  - Dark gray theme (#2d2d2d) for improved readability
  - White backgrounds for logos in dark mode
  - Optimized contrast for text and interactive elements
- 📊 Real-time vote tracking
- 📱 Responsive design
- ♿ Accessibility features
- 🔒 Vote validation and owner restrictions

## Theme Implementation

The application uses CSS variables for theming, with two main themes:

### Light Mode
```css
:root {
  --bg-color: #ffffff;
  --card-bg: #ffffff;
  --text-color: #000000;
  --accent-color: #2e7d32;
}
```

### Dark Mode
```css
[data-theme="dark"] {
  --bg-color: #2d2d2d;
  --card-bg: #2d2d2d;
  --text-color: #ffffff;
  --accent-color: #4caf50;
}
```

Theme switching is handled by the `useTheme` hook, which:
- Detects system color scheme preference
- Allows manual theme toggling
- Persists theme choice in localStorage
- Provides smooth transitions between themes

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/jardins-campion.git
cd jardins-campion
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

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

## Project Structure

```text

jardins-campion/
├── public/
│   └── logos/          # Logo images
├── src/
│   ├── app/            # Next.js app directory
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   └── translations/   # Language files
├── __tests__/         # Test files
└── __mocks__/         # Test mocks
```

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

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Next.js team for the amazing framework
- React Testing Library for the testing utilities
- All contributors and users of the app
