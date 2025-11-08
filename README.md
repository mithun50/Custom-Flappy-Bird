# 🐦 Custom Flappy Bird

A modern, customizable Flappy Bird clone built with React Native and Skia, featuring bird selection, custom character upload, and retro pixel art styling.

![React Native](https://img.shields.io/badge/React%20Native-0.76.5-blue)
![Expo](https://img.shields.io/badge/Expo-52.0.20-black)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🎮 Gameplay
- **Classic Flappy Bird mechanics** - Tap to make your character fly
- **Dynamic difficulty** - Pipe speed increases with score
- **Score tracking** - Keep track of your high scores
- **Smooth animations** - Powered by Reanimated 3
- **Physics-based movement** - Realistic gravity and jump mechanics

### 🎨 Customization
- **Multiple bird options** - Choose from Yellow, Blue, or Red birds
- **Custom character upload** - Upload your own image as a playable character
- **Pixel art fonts** - Retro gaming aesthetic with monospace fonts
- **Styled UI cards** - Beautiful green cards with golden borders

### 🔊 Audio & Feedback
- **Sound effects** - Web Audio API for jump, score, and collision sounds
- **Haptic feedback** - Vibration feedback on all interactions
- **Visual feedback** - Smooth animations and transitions

### 📱 User Interface
- **Start screen** - Character selection with preview
- **Game over screen** - Shows final score with restart option
- **Centered UI elements** - Professional, polished design
- **Responsive layout** - Works on various screen sizes

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation

1. **Clone the repository**
```bash
git clone git@github.com:mithun50/Custom-Flappy-Bird.git
cd Custom-Flappy-Bird
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm start
```

4. **Run on your device**
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

## 🎮 How to Play

1. **Select your character** - Tap on Yellow, Blue, Red bird, or upload custom image
2. **Tap anywhere to start** - Your character will jump
3. **Navigate through pipes** - Avoid hitting pipes or the ground
4. **Score points** - Each pipe you pass increases your score
5. **Game Over** - Tap to restart and try again

## 🛠️ Tech Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **@shopify/react-native-skia** - 2D graphics rendering
- **react-native-reanimated** - Smooth animations
- **react-native-gesture-handler** - Touch gestures
- **expo-haptics** - Haptic feedback
- **expo-image-picker** - Custom image upload
- **Web Audio API** - Sound effects

## 📂 Project Structure

```
FlappyBird/
├── assets/
│   ├── sprites/           # Game sprites (birds, pipes, background)
│   ├── icon.png          # App icon
│   └── splash.png        # Splash screen
├── App.js                # Main game logic
├── package.json          # Dependencies
├── babel.config.js       # Babel configuration
└── README.md            # This file
```

## 🎨 Customization Guide

### Adding New Bird Colors

1. Add bird sprite to `assets/sprites/`
2. Import in `App.js`:
```javascript
const newBird = useImage(require('./assets/sprites/newbird-upflap.png'));
```
3. Add to bird selection UI
4. Update state management

### Modifying Game Physics

```javascript
const GRAVITY = 1000;      // Gravity force
const JUMP_FORCE = -500;   // Jump velocity
```

### Changing Difficulty

```javascript
const pipesSpeed = useDerivedValue(() => {
  return interpolate(score, [0, 20], [1, 2]); // Speed progression
});
```

## 🎯 Features Roadmap

- [ ] Local high score persistence
- [ ] Multiple difficulty levels
- [ ] Different background themes
- [ ] Power-ups and bonuses
- [ ] Multiplayer mode
- [ ] Leaderboard integration
- [ ] Sound on/off toggle
- [ ] More character animations

## 🐛 Known Issues

- Custom images are clipped to circular shape for consistency
- Sound may not work on all platforms (using Web Audio API fallback)

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original Flappy Bird concept by Dong Nguyen
- Sprites and assets from the original Flappy Bird
- Built with love using React Native and Expo
- Special thanks to the open-source community

## 📧 Contact

**Mithun** - [@mithun50](https://github.com/mithun50)

Project Link: [https://github.com/mithun50/Custom-Flappy-Bird](https://github.com/mithun50/Custom-Flappy-Bird)

## 🌟 Show Your Support

Give a ⭐️ if you like this project!

---

**Built with ❤️ using React Native**
