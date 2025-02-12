# Contributing Guidelines

## Versioning Standards

We follow [Semantic Versioning](https://semver.org/) (SemVer) for version numbers:

- MAJOR version (x.0.0) - incompatible API changes
- MINOR version (0.x.0) - added functionality in a backward compatible manner
- PATCH version (0.0.x) - backward compatible bug fixes

### Version Update Process

1. Update version numbers in:
   - package.json
   - CHANGELOG.md

2. CHANGELOG.md format:
```markdown
## [x.y.z] - YYYY-MM-DD

### Category (Fixed/Changed/Added/Removed)
- Feature/Component name:
  - Specific change description
  - Additional details
  - Implementation notes
```

### Categories:
- **Fixed**: Bug fixes and corrections
- **Changed**: Changes in existing functionality
- **Added**: New features
- **Removed**: Removed features
- **Technical Updates**: Infrastructure, configuration changes
- **Code Quality**: Refactoring, testing, documentation

## Commit Standards

### Commit Message Format
```
type(scope): Brief description

- Detailed bullet points of changes
- Additional context if needed
```

### Types:
- **fix**: Bug fixes
- **feat**: New features
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Test updates
- **chore**: Maintenance tasks

### Example:
```
fix(image-loading): Update image path handling

- Remove hardcoded base paths
- Add environment-aware path configuration
- Update Next.js config for proper asset handling
```

## Release Process

1. Update version numbers
2. Update CHANGELOG.md
3. Create commit with version bump
4. Create git tag
5. Push changes and tags
6. Create GitHub release (if applicable)

## Best Practices

1. One logical change per commit
2. Keep commits focused and atomic
3. Write clear, descriptive commit messages
4. Always update CHANGELOG.md for user-facing changes
5. Test changes before committing
6. Review version numbers match across files

## Development Workflow

1. Create feature branch
2. Make changes
3. Update tests
4. Update documentation
5. Update CHANGELOG.md
6. Create pull request
7. Code review
8. Merge to main branch

## Questions?

If you have questions about these guidelines, please reach out to the project maintainers. 