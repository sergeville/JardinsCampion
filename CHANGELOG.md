# Changelog

## [1.2.0] - 2025-02-12

### Added
- 

### Changed
- Theme Improvements:
  - Updated text color to very light green (#e8f5e9) in both light and dark modes
  - Enhanced visual consistency across themes
  - Improved readability with subtle green tint

### Fixed
- 

## [1.1.0] - 2024-02-20

### Added
- Multi-user persistence and real-time synchronization:
  - Add database integration for persistent storage
  - Implement real-time vote synchronization
  - Add user session management
  - Add concurrent voting support

### Changed
- Architecture Updates:
  - Move to client-server architecture
  - Add API endpoints for vote management
  - Update state management for real-time data
  - Implement optimistic UI updates

## [1.0.4] - 2024-02-20

### Added
- Automated version management system:
  - Add version bump scripts for patch, minor, and major versions
  - Add CONTRIBUTING.md with versioning guidelines
  - Add automated changelog management

### Changed
- Standardized development workflow:
  - Implement semantic versioning (SemVer)
  - Add commit message standards
  - Document release process

### Technical Updates
- Add scripts/version-bump.js for automated version management
- Update package.json with version bump commands
- Implement git tag automation

## [1.0.3] - 2024-02-20

### Fixed
- Image loading in development:
  - Fixed image paths to work correctly in local development
  - Removed environment-specific path prefixes
  - Simplified image loading configuration
- Next.js Configuration:
  - Optimized basePath and assetPrefix settings
  - Streamlined image loading configuration
  - Improved development and production environment handling

## [1.0.2] - 2024-02-20

### Fixed
- Mobile layout improvements:
  - Repositioned header buttons to prevent overlap with title
  - Adjusted welcome message spacing and padding
  - Improved vertical spacing between elements
  - Better responsive layout for small screens
- Image loading issues:
  - Fixed image paths for GitHub Pages deployment
  - Added proper base path configuration
  - Updated Next.js config for static exports
  - Improved error handling for failed image loads
  - Fixed image paths to work correctly in both local development and production
  - Removed hardcoded base paths for better environment handling
  - Simplified image path management in LogoGrid component
- Vote history display:
  - Updated to show votes in reverse chronological order (newest first)
  - Improved timestamp sorting accuracy

### Changed
- Layout Enhancements:
  - Reduced padding and margins on mobile
  - Added padding-top to title for better button spacing
  - Centered header buttons on mobile
  - More compact mobile layout while maintaining readability

### Technical Updates
- Next.js Configuration:
  - Added proper basePath handling for GitHub Pages
  - Configured image optimization settings
  - Updated static export settings
  - Simplified asset prefix configuration
  - Removed unnecessary image domains and patterns
- Mobile Responsiveness:
  - Improved header component structure
  - Better CSS organization for mobile styles
  - Enhanced button positioning logic

## [1.0.1] - 2024-02-20

### Fixed
- Dark mode styling issues:
  - Fixed page background color to match container color (#2d2d2d)
  - Removed duplicate body styles in CSS
  - Fixed incorrect background-color variable name
  - Unified dark mode colors across all components

### Changed
- Dark Mode Improvements:
  - Updated logo container backgrounds to use consistent dark gray
  - Set logo image backgrounds to white in dark mode
  - Removed unnecessary borders and shadows in dark mode
  - Improved contrast for text and interactive elements
  - Adjusted green accent colors for better visibility

### Technical Fixes
- Fixed CSS variable naming:
  - Changed `--background-color` to `--bg-color` for consistency
  - Consolidated duplicate CSS declarations
  - Standardized color variable usage across components

### Visual Enhancements
- Logo Display:
  - Removed padding from logo images in dark mode
  - Improved logo container contrast
  - Fixed white background for logo images
- UI Consistency:
  - Unified dark mode color scheme
  - Improved visual hierarchy
  - Enhanced readability in dark mode

### Code Quality
- Removed duplicate CSS declarations
- Consolidated body styles
- Improved CSS organization
- Fixed variable naming conventions

## [1.0.0] - Initial Release

- Basic logo voting functionality
- Language switching (EN/FR)
- Dark/Light mode toggle
- Responsive design
- Vote history tracking 