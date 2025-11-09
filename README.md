# 🐦 Custom Flappy Bird - Enhanced Edition

<div align="center">

![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-54.0.0-000020?style=for-the-badge&logo=expo&logoColor=white)
![Skia](https://img.shields.io/badge/Skia-2.2.12-4285F4?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

A modern, feature-rich Flappy Bird clone with premium UI, customizable characters, multiple themes, and a dedicated development team showcase.

[Features](#-features) • [Installation](#-installation) • [Gameplay](#-how-to-play) • [Tech Stack](#️-tech-stack) • [Team](#-development-team)

</div>

---

## ✨ Features

### 🎮 Core Gameplay
- **Classic Flappy Bird Mechanics** - Tap to fly, avoid pipes
- **Dynamic Difficulty Scaling** - Pipe speed increases with score progression
- **Real-time Score Tracking** - Live score updates with persistent high scores
- **Physics-Based Movement** - Realistic gravity (1000) and jump force (-500)
- **Smooth 60 FPS Animations** - Powered by React Native Reanimated 4.1.1
- **Collision Detection** - Precise hit detection with visual feedback

### 🎨 Customization System

#### Character Selection
- **Manas Bird (Default)** - Premium circular profile picture character
- **Classic Birds** - Yellow, Blue, and Red bird options
- **Custom Characters** - Upload your own images (up to 10 custom birds)
- **Circular Clipping** - All custom characters rendered as circular profiles
- **Live Preview** - See your character in action before playing

#### Theme Options
- **Day Theme** - Classic bright daytime background
- **Night Theme** - Dark atmospheric nighttime scene
- **City Theme** - Modern urban skyline background
- **Real-time Switching** - Change themes on the fly

### 🎨 Premium UI Design
- **Development Team Screen** - Showcase of 5 team members with premium cards
- **Color-Coded Cards** - Gold (Team Lead), Blue, Red, Green, Purple themes
- **Profile Integration** - Direct Instagram links for each team member
- **Glassmorphic Effects** - Modern blur and gradient overlays
- **Responsive Design** - Optimized for all screen sizes
- **Touch Feedback** - Haptic responses on all interactions

### 🔊 Audio & Feedback
- **Sound Effects System** - Jump, score, collision, and game over sounds
- **Haptic Feedback** - Vibration on tap, collision, and menu interactions
- **Visual Feedback** - Smooth animations and color transitions
- **Audio Controls** - Toggle sound on/off (coming soon)

### 👥 Development Team Features
- **Team Showcase** - Dedicated screen for development team
- **Premium Cards** - Each developer has a unique themed card
  - Mithun Gowda B - Team Lead (Gold)
  - Harsha N - Developer (Red)
  - Manas Habbu - Developer (Blue)
  - Naren V - Developer (Green)
  - Nevil D'Souza - Developer (Purple)
- **Social Integration** - Direct Instagram profile links
- **Role Badges** - PRO/DEV badges with glow effects
- **Status Indicators** - Active status with green indicators
- **Skill Tags** - DESIGN, LOGIC specialization badges

### 💾 Data Persistence
- **AsyncStorage Integration** - Save custom birds and preferences
- **Theme Persistence** - Remember user's selected theme
- **Character Persistence** - Auto-load last selected character
- **High Score Tracking** - Local storage for best scores

## 🚀 Installation

### Prerequisites

```bash
Node.js >= 16.x
npm >= 8.x or yarn >= 1.22
Expo CLI >= 6.x
```

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/mithun50/Custom-Flappy-Bird.git
cd Custom-Flappy-Bird
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Start development server**
```bash
npm start
# or
expo start
```

4. **Run on platform**
```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Web Browser
npm run web

# Physical Device
# Scan QR code with Expo Go app
```

### Building for Production

#### Android APK
```bash
# Generate APK
expo build:android -t apk

# Or with EAS Build
eas build --platform android
```

#### iOS App
```bash
# Generate IPA
expo build:ios

# Or with EAS Build
eas build --platform ios
```

## 🎮 How to Play

### Main Menu
1. **Start Screen** - Tap anywhere to begin
2. **Customize Button** - Access customization options
3. **Development Team Button** - View team showcase

### Customization Screen
1. **Select Character** - Choose from 4 default birds or add custom
2. **Select Theme** - Choose Day, Night, or City background
3. **Upload Custom** - Add your own character images (tap + icon)
4. **Save Changes** - Save button to persist selections

### Gameplay
1. **Tap to Jump** - Single tap makes your character fly
2. **Avoid Obstacles** - Navigate through pipes
3. **Score Points** - +1 for each pipe passed
4. **Game Over** - Collision ends the game
5. **Restart** - Tap restart button to play again

### Development Team
1. **View Profiles** - Tap Development Team button
2. **Browse Cards** - Scroll through team member cards
3. **Visit Instagram** - Tap any card to open Instagram profile
4. **Back Button** - Return to main menu

## 🛠️ Tech Stack

### Core Technologies
- **React Native 0.81.5** - Cross-platform mobile framework
- **React 19.1.0** - Latest React features and optimizations
- **Expo 54.0.0** - Development and build platform

### Graphics & Animation
- **@shopify/react-native-skia 2.2.12** - High-performance 2D graphics
- **react-native-reanimated 4.1.1** - 60 FPS animations on UI thread
- **react-native-gesture-handler 2.28.0** - Native touch gestures

### Features & Utilities
- **expo-haptics 15.0.7** - Haptic feedback system
- **expo-image-picker 17.0.8** - Image selection and upload
- **expo-file-system 19.0.17** - File system access
- **@react-native-async-storage/async-storage 2.2.0** - Data persistence

### Performance
- **react-native-worklets-core 1.6.2** - High-performance worklets
- **react-native-worklets 0.5.1** - JavaScript worklet support

## 📂 Project Structure

```
FlappyBird/
├── assets/
│   ├── sprites/
│   │   ├── developers/           # Team profile pictures
│   │   │   ├── harsha.png
│   │   │   ├── manas.png
│   │   │   ├── mithun.png
│   │   │   ├── naren.png
│   │   │   └── nevil.png
│   │   ├── background-day.png
│   │   ├── background-night.png
│   │   ├── nightcity.jpg
│   │   ├── yellowbird-upflap.png
│   │   ├── bluebird-upflap.png
│   │   ├── redbird-upflap.png
│   │   ├── pipe-green.png
│   │   ├── pipe-green-top.png
│   │   ├── base.png
│   │   ├── customize_button.png
│   │   ├── development_team_button.png
│   │   ├── restart_button.png
│   │   ├── save_button.png
│   │   └── back_button.png
│   ├── icon.png                 # App icon
│   └── splash.png               # Splash screen
├── .github/
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── App.js                       # Main game logic (1700+ lines)
├── package.json                 # Dependencies
├── babel.config.js              # Babel configuration
├── app.json                     # Expo configuration
└── README.md                    # This file
```

## 🎨 Advanced Customization

### Physics Configuration

```javascript
// Gravity and jump force
const GRAVITY = 1000;           // Pixels/second²
const JUMP_FORCE = -500;        // Initial jump velocity

// Pipe settings
const pipeWidth = 104;          // Pipe width in pixels
const pipeHeight = 640;         // Pipe height in pixels
const pipeGap = 200;            // Gap between top and bottom pipes
```

### Adding Custom Birds

```javascript
// 1. Add image to assets/sprites/
// 2. Import in App.js
const customBird = useImage(require('./assets/sprites/custom-bird.png'));

// 3. Add to bird selection UI (line ~1186)
{/* Custom Bird */}
<Group>
  {customBird && (
    <Group clip={rrect(rect(x, y, 70, 70), 35, 35)}>
      <Image image={customBird} x={x} y={y} width={70} height={70} fit="cover" />
    </Group>
  )}
</Group>
```

### Theme Customization

```javascript
// Add new theme background
const bgCustom = useImage(require('./assets/sprites/custom-bg.png'));

// Update theme selection
const bg = theme === 'custom' ? bgCustom :
           theme === 'night' ? bgNight :
           theme === 'city' ? bgCity : bgDay;
```

### Difficulty Tuning

```javascript
// Adjust pipe speed progression
const pipesSpeed = useDerivedValue(() => {
  return interpolate(
    score.value,
    [0, 10, 20, 30],           // Score milestones
    [1, 1.5, 2, 2.5]           // Speed multipliers
  );
});
```

## 🎯 Features Roadmap

### ✅ Completed
- [x] Multiple bird characters with custom upload
- [x] Theme selection (Day, Night, City)
- [x] Development team showcase screen
- [x] Instagram social integration
- [x] Premium UI with glassmorphic cards
- [x] AsyncStorage data persistence
- [x] Haptic feedback system
- [x] Sound effects
- [x] Manas as default bird character

### 🚧 In Progress
- [ ] High score leaderboard
- [ ] Sound toggle controls
- [ ] Additional character animations
- [ ] More theme variations

### 📋 Planned
- [ ] Multiplayer mode
- [ ] Power-ups and bonuses
- [ ] Achievement system
- [ ] Daily challenges
- [ ] Cloud save synchronization
- [ ] Social sharing features
- [ ] Replay system
- [ ] Custom pipe themes

## 👥 Development Team

Meet the talented developers behind Custom Flappy Bird - a passionate team of React Native enthusiasts who brought this project to life with modern UI design, premium features, and meticulous attention to detail.

### Team Members

<table>
  <tr>
    <td align="center">
      <img src="assets/sprites/developers/mithun.png" width="120px;" alt="Mithun Gowda B"/><br />
      <sub><b>Mithun Gowda B</b></sub><br />
      <sub>🏆 Team Lead & Core Developer</sub><br />
      <br />
      <sub>Project architect and team lead responsible for overall system design, game logic implementation, and team coordination. Specialized in React Native development and high-performance animations.</sub><br />
      <br />
      <a href="https://github.com/mithun50">
        <img src="https://img.shields.io/badge/GitHub-mithun50-181717?style=flat&logo=github" />
      </a><br />
      <a href="https://instagram.com/mithun.gowda.b">
        <img src="https://img.shields.io/badge/Instagram-mithun.gowda.b-E4405F?style=flat&logo=instagram&logoColor=white" />
      </a>
    </td>
    <td align="center">
      <img src="assets/sprites/developers/harsha.png" width="120px;" alt="Harsha N"/><br />
      <sub><b>Harsha N</b></sub><br />
      <sub>🎨 UI/UX Designer & Frontend Developer</sub><br />
      <br />
      <sub>Lead designer responsible for the premium UI cards, glassmorphic effects, and visual aesthetics. Created the beautiful development team showcase and customization interface.</sub><br />
      <br />
      <a href="https://github.com/harshaxyZ">
        <img src="https://img.shields.io/badge/GitHub-harshaxyZ-181717?style=flat&logo=github" />
      </a><br />
      <a href="https://instagram.com/harsha1218_">
        <img src="https://img.shields.io/badge/Instagram-harsha1218__-E4405F?style=flat&logo=instagram&logoColor=white" />
      </a>
    </td>
    <td align="center">
      <img src="assets/sprites/developers/manas.png" width="120px;" alt="Manas Habbu"/><br />
      <sub><b>Manas Habbu</b></sub><br />
      <sub>🎨 Design Developer & Graphics Specialist</sub><br />
      <br />
      <sub>Graphics and design specialist who crafted the default bird character system, circular profile implementations, and visual effects. Focused on creating a cohesive design language throughout the app.</sub><br />
      <br />
      <a href="https://github.com/Manas-H13">
        <img src="https://img.shields.io/badge/GitHub-Manas--H13-181717?style=flat&logo=github" />
      </a><br />
      <a href="https://instagram.com/manas.habbu13">
        <img src="https://img.shields.io/badge/Instagram-manas.habbu13-E4405F?style=flat&logo=instagram&logoColor=white" />
      </a>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="assets/sprites/developers/naren.png" width="120px;" alt="Naren V"/><br />
      <sub><b>Naren V</b></sub><br />
      <sub>⚙️ Logic Developer & Backend Specialist</sub><br />
      <br />
      <sub>Core logic developer who implemented game physics, collision detection, and scoring systems. Specialized in performance optimization and worklet-based animations for smooth 60 FPS gameplay.</sub><br />
      <br />
      <a href="https://github.com/naren_vk_29">
        <img src="https://img.shields.io/badge/GitHub-naren__vk__29-181717?style=flat&logo=github" />
      </a><br />
      <a href="https://instagram.com/naren_vk_29">
        <img src="https://img.shields.io/badge/Instagram-naren__vk__29-E4405F?style=flat&logo=instagram&logoColor=white" />
      </a>
    </td>
    <td align="center">
      <img src="assets/sprites/developers/nevil.png" width="120px;" alt="Nevil D'Souza"/><br />
      <sub><b>Nevil D'Souza</b></sub><br />
      <sub>⚙️ Logic Developer & Features Engineer</sub><br />
      <br />
      <sub>Features engineer who developed the customization system, AsyncStorage integration, and custom character upload functionality. Implemented data persistence and state management solutions.</sub><br />
      <br />
      <a href="https://github.com/nevil06">
        <img src="https://img.shields.io/badge/GitHub-nevil06-181717?style=flat&logo=github" />
      </a><br />
      <a href="https://instagram.com/_nevil_06">
        <img src="https://img.shields.io/badge/Instagram-__nevil__06-E4405F?style=flat&logo=instagram&logoColor=white" />
      </a>
    </td>
    <td align="center">
      <sub><b>Join Our Team!</b></sub><br />
      <sub>🚀 We're always looking for passionate developers</sub><br />
      <br />
      <sub>Interested in contributing to Custom Flappy Bird? Check out our <a href="#-contributing">Contributing Guidelines</a> and open a pull request!</sub><br />
      <br />
      <a href="https://github.com/mithun50/Custom-Flappy-Bird/issues">
        <img src="https://img.shields.io/badge/Contribute-Welcome-brightgreen?style=flat" />
      </a>
    </td>
  </tr>
</table>

### Team Contributions

| Developer | Specialization | Key Contributions |
|-----------|---------------|-------------------|
| **Mithun Gowda B** | Team Lead, Architecture | Game engine, physics system, team coordination |
| **Harsha N** | UI/UX Design | Premium cards, glassmorphic effects, visual design |
| **Manas Habbu** | Graphics & Design | Default character system, circular profiles, design language |
| **Naren V** | Game Logic | Collision detection, scoring system, performance optimization |
| **Nevil D'Souza** | Features Engineering | Customization system, data persistence, state management |

### Collaboration Tools
- **Version Control**: Git & GitHub
- **Communication**: Instagram, GitHub Discussions
- **Project Management**: GitHub Issues & Projects
- **Code Review**: Pull Request workflow
- **Development**: React Native, Expo, VS Code

## 🐛 Known Issues & Limitations

### Current Limitations
- Custom images are automatically clipped to circular shape for visual consistency
- Maximum 10 custom birds can be uploaded
- Sound effects use Web Audio API (may have platform-specific behavior)
- iOS requires additional permissions for image picker

### Browser Compatibility
- Best performance on Chrome/Safari mobile browsers
- Firefox mobile may have reduced performance
- Desktop browsers supported but optimized for mobile

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to branch** (`git push origin feature/AmazingFeature`)
5. **Open Pull Request**

### Development Guidelines
- Follow existing code style
- Add comments for complex logic
- Test on both iOS and Android
- Update README for new features
- Keep commits atomic and descriptive

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### MIT License Summary
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ❌ Liability
- ❌ Warranty

## 🙏 Acknowledgments

- **Graphics Assets** - Classic sprite assets and visual elements
- **React Native Community** - For amazing libraries and support
- **Expo Team** - For the excellent development platform
- **Shopify Skia Team** - For high-performance graphics library

## 📧 Contact & Support

**Project Maintainer:** Mithun Gowda B

- 📧 Email: [Create an issue](https://github.com/mithun50/Custom-Flappy-Bird/issues)
- 🐙 GitHub: [@mithun50](https://github.com/mithun50)
- 📱 Instagram: [@mithun.gowda.b](https://instagram.com/mithun.gowda.b)

**Project Links:**
- 📦 Repository: [Custom-Flappy-Bird](https://github.com/mithun50/Custom-Flappy-Bird)
- 🐛 Issue Tracker: [Report Bug](https://github.com/mithun50/Custom-Flappy-Bird/issues)
- 💡 Feature Requests: [Request Feature](https://github.com/mithun50/Custom-Flappy-Bird/issues)

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/mithun50/Custom-Flappy-Bird?style=social)
![GitHub forks](https://img.shields.io/github/forks/mithun50/Custom-Flappy-Bird?style=social)
![GitHub issues](https://img.shields.io/github/issues/mithun50/Custom-Flappy-Bird)
![GitHub pull requests](https://img.shields.io/github/issues-pr/mithun50/Custom-Flappy-Bird)

## 🌟 Show Your Support

If you find this project helpful or interesting, please consider:
- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 🔀 Contributing code
- 📢 Sharing with others

---

<div align="center">

**Built with ❤️ using React Native & Expo**

Made by the [Custom Flappy Bird Team](#-development-team)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>
