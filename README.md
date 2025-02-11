# Jardins Campion Logo Voting App

A modern Next.js application for collecting votes on logo designs. Users can view logo options, select their favorite, and submit their vote along with their name.

![Next.js](https://img.shields.io/badge/Next.js-13-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-18-blue)

## Features

- 🎨 Interactive logo gallery with hover effects
- 📱 Responsive design that works on all devices
- ✨ Clean, modern UI with smooth animations
- 🔍 High-quality image display with Next.js Image optimization
- 📊 Real-time vote counting
- 👤 User name collection with each vote
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
│   └── logos/         # Logo images
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
