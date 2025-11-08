# Contributing to Custom Flappy Bird

First off, thank you for considering contributing to Custom Flappy Bird! It's people like you that make this project better for everyone.

## Code of Conduct

By participating in this project, you are expected to uphold our code of conduct:

- Be respectful and inclusive
- Be patient and welcoming
- Be collaborative and constructive
- Focus on what is best for the community

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Device/Platform** information (iOS/Android version, device model)
- **Error messages** or console logs

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case** - why would this feature be useful?
- **Possible implementation** - how could this work?
- **Mockups or examples** if applicable

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Write clear commit messages**
6. **Submit a pull request**

## Development Setup

```bash
# Clone your fork
git clone git@github.com:your-username/Custom-Flappy-Bird.git
cd Custom-Flappy-Bird

# Install dependencies
npm install

# Start development server
npm start
```

## Coding Standards

### JavaScript/React Native

- Use **functional components** with hooks
- Follow **ES6+ syntax**
- Use **meaningful variable names**
- Add **comments** for complex logic
- Keep functions **small and focused**

### Code Style

```javascript
// Good
const handleJump = () => {
  birdYVelocity.value = JUMP_FORCE;
  playJumpSound();
};

// Bad
const h = () => {
  birdYVelocity.value = -500;
  playJumpSound();
};
```

### Commit Messages

Follow conventional commit format:

```
feat: add night mode background
fix: correct collision detection on Android
docs: update README with installation steps
style: format code with prettier
refactor: simplify bird selection logic
test: add unit tests for physics
chore: update dependencies
```

## Project Structure

```
FlappyBird/
├── assets/           # Static assets
│   └── sprites/      # Game graphics
├── App.js           # Main game component
├── package.json     # Dependencies
└── README.md        # Documentation
```

## What to Contribute?

### Good First Issues

- Add sound toggle button
- Implement local high score storage
- Add more bird color options
- Improve custom image preview
- Add difficulty levels

### Feature Ideas

- Night/day mode toggle
- Multiple background themes
- Power-ups (shields, slow-motion)
- Achievements system
- Leaderboard integration
- Additional character animations

### Bug Fixes

Check the [issues page](https://github.com/mithun50/Custom-Flappy-Bird/issues) for bugs to fix.

## Testing

Before submitting a PR:

1. **Test on both iOS and Android** if possible
2. **Test different screen sizes**
3. **Verify all game features work**
4. **Check for console errors**
5. **Test custom image upload**

## Documentation

When adding new features:

- Update **README.md** with usage instructions
- Add **code comments** for complex logic
- Update **customization guide** if applicable
- Include **examples** when helpful

## Questions?

Feel free to:

- Open an issue for discussion
- Reach out to [@mithun50](https://github.com/mithun50)
- Check existing issues and PRs

## Recognition

Contributors will be acknowledged in:

- README.md contributors section
- GitHub contributors page
- Release notes for significant contributions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing! 🎉
