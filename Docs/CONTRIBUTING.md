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

### Categories

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

### Types

- **fix**: Bug fixes
- **feat**: New features
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Test updates
- **chore**: Maintenance tasks

### Example

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

## Testing Guidelines

### Component Testing Best Practices

1. **Async Effects**
   - Always wait for effects to complete using `waitFor`
   - Check both state changes and UI updates
   - Handle initial state setup properly

2. **Component Cleanup**
   - Use the `unmount` function returned by `render`
   - Clean up after each test
   - Reset global state (localStorage, theme, etc.)

3. **Language and Theme Testing**
   - Set initial state explicitly
   - Wait for state changes to propagate
   - Verify both state and UI updates
   - Handle transitions between states

4. **Test Structure**
   ```typescript
   it('test description', async () => {
     // 1. Setup initial state
     window.localStorage.setItem('key', 'value');
     const { unmount } = render(<Component />);

     // 2. Wait for effects
     await waitFor(() => {
       expect(window.localStorage.getItem('key')).toBe('value');
     });

     // 3. Verify UI
     await waitFor(() => {
       expect(screen.getByText('expected text')).toBeInTheDocument();
     });

     // 4. Perform actions
     await act(async () => {
       fireEvent.click(screen.getByRole('button'));
     });

     // 5. Verify changes
     await waitFor(() => {
       expect(screen.getByText('new text')).toBeInTheDocument();
     });

     // 6. Cleanup
     unmount();
   });
   ```

## Questions?

If you have questions about these guidelines, please reach out to the project maintainers.
