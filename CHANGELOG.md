# Changelog

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