import { Platform, useWindowDimensions, Linking } from 'react-native';
import {
  Canvas,
  useImage,
  Image,
  Group,
  Text,
  matchFont,
  Circle,
  rect,
  rrect,
  ColorMatrix,
  Paint,
  Skia,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withTiming,
  Easing,
  withSequence,
  withRepeat,
  useFrameCallback,
  useDerivedValue,
  interpolate,
  Extrapolation,
  useAnimatedReaction,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GRAVITY = 1000;
const JUMP_FORCE = -500;

const pipeWidth = 104;
const pipeHeight = 640;

const App = () => {
  const { width, height } = useWindowDimensions();

  // Responsive scaling based on screen size (reference: 360x800)
  const scaleWidth = width / 360;
  const scaleHeight = height / 800;
  const scale = Math.min(scaleWidth, scaleHeight); // Use minimum to maintain aspect ratio

  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('waiting'); // 'waiting', 'playing', 'gameOver'
  const [birdColor, setBirdColor] = useState('manas'); // 'yellow', 'blue', 'red', 'manas', 'custom0', 'custom1', etc.
  const [customImages, setCustomImages] = useState([]); // Array of custom image URIs
  const [theme, setTheme] = useState('day'); // 'day', 'night', 'city'
  const [currentPage, setCurrentPage] = useState('game'); // 'game', 'customize', 'devteam'
  const [hasCustomization, setHasCustomization] = useState(false); // Track if user has saved customization
  const [scrollY, setScrollY] = useState(0); // For scrolling the customize page

  const bgDay = useImage(require('./assets/sprites/background-day.png'));
  const bgNight = useImage(require('./assets/sprites/background-night.png'));
  const bgCity = useImage(require('./assets/sprites/nightcity.jpg'));

  // Get current background based on theme
  const bg = theme === 'night' ? bgNight : theme === 'city' ? bgCity : bgDay;
  const yellowBird = useImage(require('./assets/sprites/yellowbird-upflap.png'));
  const blueBird = useImage(require('./assets/sprites/bluebird-upflap.png'));
  const redBird = useImage(require('./assets/sprites/redbird-upflap.png'));
  const manasBird = useImage(require('./assets/sprites/developers/manas.png'));
  const pipeBottom = useImage(require('./assets/sprites/pipe-green.png'));
  const pipeTop = useImage(require('./assets/sprites/pipe-green-top.png'));
  const base = useImage(require('./assets/sprites/base.png'));
  const messageImg = useImage(require('./assets/sprites/message.png'));
  const gameOverImg = useImage(require('./assets/sprites/gameover.png'));
  const restartGameBtn = useImage(require('./assets/sprites/restart_button.png'));
  const addIcon = useImage(require('./assets/sprites/add_icon.png'));
  const deleteIcon = useImage(require('./assets/sprites/wrong_icon.png'));

  // Development team images
  const devTeamBtn = useImage(require('./assets/sprites/development_team_button.png'));
  const devTeamPt = useImage(require('./assets/sprites/development_team_pt.png'));
  const harshaPt = useImage(require('./assets/sprites/developers/harsha.png'));
  const manasPt = useImage(require('./assets/sprites/developers/manas.png'));
  const mithunPt = useImage(require('./assets/sprites/developers/mithun.png'));
  const narenPt = useImage(require('./assets/sprites/developers/naren.png'));
  const nevilPt = useImage(require('./assets/sprites/developers/nevil.png'));

  // Load custom bird images - using individual hooks to avoid conditional hook calls
  const customBird0 = useImage(customImages[0]);
  const customBird1 = useImage(customImages[1]);
  const customBird2 = useImage(customImages[2]);
  const customBird3 = useImage(customImages[3]);
  const customBird4 = useImage(customImages[4]);
  const customBird5 = useImage(customImages[5]);
  const customBird6 = useImage(customImages[6]);
  const customBird7 = useImage(customImages[7]);
  const customBird8 = useImage(customImages[8]);
  const customBird9 = useImage(customImages[9]);

  // Create array of loaded images
  const customBirdImages = [
    customBird0, customBird1, customBird2, customBird3, customBird4,
    customBird5, customBird6, customBird7, customBird8, customBird9
  ].slice(0, customImages.length);

  // Debug: Log when custom images change
  useEffect(() => {
    console.log('Custom Images array:', customImages);
    console.log('Number of custom birds:', customImages.length);
  }, [customImages]);
  const customizeBtn = useImage(require('./assets/sprites/customize_button.png'));
  const saveBtn = useImage(require('./assets/sprites/save_button.png'));
  const backBtn = useImage(require('./assets/sprites/back_button.png'));

  // Text images
  const customizePt = useImage(require('./assets/sprites/customize_pt.png'));
  const selectThemePt = useImage(require('./assets/sprites/select_theme_pt.png'));
  const selectCharectorPt = useImage(require('./assets/sprites/select_charector_pt.png'));
  const developmentTeamPt = useImage(require('./assets/sprites/development_team_pt.png'));

  // Get current bird based on selection
  const bird = birdColor.startsWith('custom')
    ? customBirdImages[parseInt(birdColor.replace('custom', ''))] || manasBird
    : birdColor === 'blue' ? blueBird :
      birdColor === 'red' ? redBird :
      birdColor === 'manas' ? manasBird : yellowBird;

  // Debug log
  useEffect(() => {
    console.log('Bird Color:', birdColor);
    console.log('Manas Bird loaded:', !!manasBird);
    console.log('Current bird:', !!bird);
  }, [birdColor, manasBird, bird]);

  const gameOver = useSharedValue(false);
  const pipeX = useSharedValue(width);

  const birdY = useSharedValue(height / 3);
  const birdX = width / 4;
  const birdYVelocity = useSharedValue(0);

  const pipeOffset = useSharedValue(Math.random() * 400 * scaleHeight - 200 * scaleHeight); // Random initial gap position (scaled)
  const topPipeY = useDerivedValue(() => pipeOffset.value - 320 * scaleHeight);
  const bottomPipeY = useDerivedValue(() => height - 320 * scaleHeight + pipeOffset.value);

  const pipesSpeed = useDerivedValue(() => {
    return interpolate(score, [0, 20], [1, 2]);
  });

  const obstacles = useDerivedValue(() => [
    // bottom pipe
    {
      x: pipeX.value,
      y: bottomPipeY.value,
      h: pipeHeight,
      w: pipeWidth,
    },
    // top pipe
    {
      x: pipeX.value,
      y: topPipeY.value,
      h: pipeHeight,
      w: pipeWidth,
    },
  ]);

  // No audio setup needed - using Web Audio API directly

  // No image processing - use original image directly

  // Load saved preferences on app start
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        const savedBirdColor = await AsyncStorage.getItem('birdColor');
        const savedCustomImages = await AsyncStorage.getItem('customImages');

        if (savedTheme) setTheme(savedTheme);
        if (savedBirdColor) setBirdColor(savedBirdColor);
        if (savedCustomImages) {
          const parsedImages = JSON.parse(savedCustomImages);
          // Convert from old object format to array if needed
          if (Array.isArray(parsedImages)) {
            setCustomImages(parsedImages);
          } else {
            // Migrate old format
            const imageArray = [];
            if (parsedImages.custom1) imageArray.push(parsedImages.custom1);
            if (parsedImages.custom2) imageArray.push(parsedImages.custom2);
            if (parsedImages.custom3) imageArray.push(parsedImages.custom3);
            setCustomImages(imageArray);
          }
        }

        // Check if user has any saved customization
        if (savedTheme || savedBirdColor || savedCustomImages) {
          setHasCustomization(true);
        }
      } catch (error) {
        console.log('Error loading preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  // Save preferences
  const savePreferences = async () => {
    try {
      await AsyncStorage.setItem('theme', theme);
      await AsyncStorage.setItem('birdColor', birdColor);
      await AsyncStorage.setItem('customImages', JSON.stringify(customImages));
      setHasCustomization(true);
      playJumpSound();
      setCurrentPage('game'); // Return to game after saving
    } catch (error) {
      console.log('Error saving preferences:', error);
    }
  };

  // Pick custom image - adds to array and auto-selects
  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        console.log('Permission denied');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const sourceUri = result.assets[0].uri;
        const newIndex = customImages.length;
        console.log('Selected image URI:', sourceUri, 'adding as custom' + newIndex);

        // Add new image to array
        setCustomImages(prev => [...prev, sourceUri]);
        setBirdColor(`custom${newIndex}`);
        playJumpSound();
        console.log('Custom image added successfully at index', newIndex);
      }
    } catch (error) {
      console.log('Error picking image:', error);
      console.error('Full error:', error);
    }
  };

  // Delete custom bird
  const deleteCustomBird = async (index) => {
    try {
      // Remove the image from array
      const newImages = customImages.filter((_, i) => i !== index);
      setCustomImages(newImages);

      // If the deleted bird was selected, switch to yellow bird
      if (birdColor === `custom${index}`) {
        setBirdColor('yellow');
      } else if (birdColor.startsWith('custom')) {
        // Update bird color index if it's after the deleted one
        const currentIndex = parseInt(birdColor.replace('custom', ''));
        if (currentIndex > index) {
          setBirdColor(`custom${currentIndex - 1}`);
        }
      }

      // Save to AsyncStorage
      await AsyncStorage.setItem('customImages', JSON.stringify(newImages));
      playJumpSound();
    } catch (error) {
      console.log('Error deleting custom bird:', error);
    }
  };

  // Open Instagram profile
  const openInstagram = async (username) => {
    try {
      const instagramUrl = `https://www.instagram.com/${username}/`;
      const supported = await Linking.canOpenURL(instagramUrl);

      if (supported) {
        await Linking.openURL(instagramUrl);
      } else {
        console.log("Can't open Instagram URL");
      }
    } catch (error) {
      console.log('Error opening Instagram:', error);
    }
  };

  // Sound effect functions using Web Audio API
  const playJumpSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Wing flap sound - quick swoosh
      const oscillator1 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContext.destination);
      oscillator1.frequency.value = 200;
      oscillator1.type = 'sine';
      gainNode1.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.05);

      // Jump beep - chirp sound
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      oscillator2.frequency.value = 600;
      oscillator2.type = 'square';
      gainNode2.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
      oscillator2.start(audioContext.currentTime);
      oscillator2.stop(audioContext.currentTime + 0.08);

      // Strong vibration
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    } catch (error) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }
  };

  const playScoreSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);

      // Second tone for musical effect
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 1000;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.2, audioContext.currentTime + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      osc2.start(audioContext.currentTime + 0.1);
      osc2.stop(audioContext.currentTime + 0.3);

      // Double vibration pulse for score
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      }, 100);
    } catch (error) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }
  };

  const playHitSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Impact bass - deep thud
      const oscillator1 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContext.destination);
      oscillator1.frequency.value = 80;
      oscillator1.type = 'sawtooth';
      gainNode1.gain.setValueAtTime(0.6, audioContext.currentTime);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.4);

      // Crash noise - harsh overtone
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      oscillator2.frequency.value = 300;
      oscillator2.type = 'square';
      gainNode2.gain.setValueAtTime(0.4, audioContext.currentTime);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator2.start(audioContext.currentTime);
      oscillator2.stop(audioContext.currentTime + 0.2);

      // Triple STRONG vibration burst for collision
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      }, 80);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
      }, 160);
    } catch (error) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }
  };

  useEffect(() => {
    if (gameState === 'playing') {
      moveTheMap();
    }
  }, [gameState]);

  const moveTheMap = () => {
    pipeX.value = withSequence(
      withTiming(width, { duration: 0 }),
      withTiming(-150, {
        duration: 3000 / pipesSpeed.value,
        easing: Easing.linear,
      }),
      withTiming(width, { duration: 0 })
    );
  };

  // Scoring system
  useAnimatedReaction(
    () => pipeX.value,
    (currentValue, previousValue) => {
      const middle = birdX;

      // change offset for the position of the next gap
      if (previousValue && currentValue < -100 && previousValue > -100) {
        pipeOffset.value = Math.random() * 400 * scaleHeight - 200 * scaleHeight;
        cancelAnimation(pipeX);
        runOnJS(moveTheMap)();
      }

      if (
        currentValue !== previousValue &&
        previousValue &&
        currentValue <= middle &&
        previousValue > middle
      ) {
        // Score point with sound
        runOnJS(setScore)(score + 1);
        runOnJS(playScoreSound)();
      }
    }
  );

  const isPointCollidingWithRect = (point, rect) => {
    'worklet';
    return (
      point.x >= rect.x && // right of the left edge AND
      point.x <= rect.x + rect.w && // left of the right edge AND
      point.y >= rect.y && // below the top AND
      point.y <= rect.y + rect.h // above the bottom
    );
  };

  // Collision detection
  useAnimatedReaction(
    () => birdY.value,
    (currentValue, previousValue) => {
      const center = {
        x: birdX + 32,
        y: birdY.value + 24,
      };

      // Ground collision detection (scaled)
      if (currentValue > height - 100 * scaleHeight || currentValue < 0) {
        gameOver.value = true;
      }

      const isColliding = obstacles.value.some((rect) =>
        isPointCollidingWithRect(center, rect)
      );
      if (isColliding) {
        gameOver.value = true;
      }
    }
  );

  useAnimatedReaction(
    () => gameOver.value,
    (currentValue, previousValue) => {
      if (currentValue && !previousValue) {
        cancelAnimation(pipeX);
        runOnJS(playHitSound)();
        runOnJS(setGameState)('gameOver');
      }
    }
  );

  useFrameCallback(({ timeSincePreviousFrame: dt }) => {
    if (!dt || gameOver.value || gameState !== 'playing') {
      return;
    }
    birdY.value = birdY.value + (birdYVelocity.value * dt) / 1000;
    birdYVelocity.value = birdYVelocity.value + (GRAVITY * dt) / 1000;
  });

  const restartGame = () => {
    'worklet';
    birdY.value = height / 3;
    birdYVelocity.value = 0;
    gameOver.value = false;
    pipeX.value = width;
    pipeOffset.value = Math.random() * 400 * scaleHeight - 200 * scaleHeight; // Random gap position on restart (scaled)
    runOnJS(setScore)(0);
    runOnJS(setGameState)('waiting');
  };

  const gesture = Gesture.Tap().onStart((event) => {
    if (gameState === 'waiting') {
      const tapX = event.x;
      const tapY = event.y;

      // Check if tapping on Customize button (checks both possible positions) - SCALED
      const btnY1 = height / 2 + 50 * scaleHeight;  // Position when hasCustomization is true
      const btnY2 = height / 2 + 100 * scaleHeight; // Position when hasCustomization is false
      const btnHeight = 107 * scaleHeight;

      if (tapX >= width / 2 - 160 * scaleWidth && tapX <= width / 2 + 160 * scaleWidth &&
          ((tapY >= btnY1 && tapY <= btnY1 + btnHeight) ||
           (tapY >= btnY2 && tapY <= btnY2 + btnHeight))) {
        runOnJS(setCurrentPage)('customize');
        runOnJS(playJumpSound)();
        return;
      }

      // Check if tapping on Development Team button - SCALED
      const devBtnY1 = height / 2 + 165 * scaleHeight;  // Position when hasCustomization is true
      const devBtnY2 = height / 2 + 215 * scaleHeight;  // Position when hasCustomization is false
      const devBtnHeight = 87 * scaleHeight;

      if (tapX >= width / 2 - 130 * scaleWidth && tapX <= width / 2 + 130 * scaleWidth &&
          ((tapY >= devBtnY1 && tapY <= devBtnY1 + devBtnHeight) ||
           (tapY >= devBtnY2 && tapY <= devBtnY2 + devBtnHeight))) {
        runOnJS(setCurrentPage)('devteam');
        runOnJS(playJumpSound)();
        return;
      }

      // Otherwise start game
      runOnJS(setGameState)('playing');
      runOnJS(playJumpSound)();
      birdYVelocity.value = JUMP_FORCE;
    } else if (gameState === 'playing') {
      // Jump
      runOnJS(playJumpSound)();
      birdYVelocity.value = JUMP_FORCE;
    } else if (gameState === 'gameOver') {
      // Restart
      restartGame();
    }
  });

  // Customize page gesture handler
  const customizeGesture = Gesture.Tap().onStart((event) => {
    'worklet';
    const tapX = event.x;
    const tapY = event.y;

    // Theme buttons - SCALED
    const themeY = 250 * scaleHeight;
    const themeRadius = 30 * scale;

    // Day theme
    if (Math.sqrt((tapX - (width / 2 - 80 * scaleWidth)) ** 2 + (tapY - themeY) ** 2) <= themeRadius) {
      runOnJS(setTheme)('day');
      runOnJS(playJumpSound)();
      return;
    }

    // Night theme
    if (Math.sqrt((tapX - (width / 2)) ** 2 + (tapY - themeY) ** 2) <= themeRadius) {
      runOnJS(setTheme)('night');
      runOnJS(playJumpSound)();
      return;
    }

    // City theme
    if (Math.sqrt((tapX - (width / 2 + 80 * scaleWidth)) ** 2 + (tapY - themeY) ** 2) <= themeRadius) {
      runOnJS(setTheme)('city');
      runOnJS(playJumpSound)();
      return;
    }

    // Bird buttons - SCALED
    const birdY = 410 * scaleHeight;
    const birdHeight = 52 * scaleHeight;
    const birdWidth = 70 * scaleWidth;

    // Yellow bird
    if (tapX >= 15 * scaleWidth && tapX <= 15 * scaleWidth + birdWidth && tapY >= birdY && tapY <= birdY + birdHeight) {
      runOnJS(setBirdColor)('yellow');
      runOnJS(playJumpSound)();
      return;
    }

    // Blue bird
    if (tapX >= 100 * scaleWidth && tapX <= 100 * scaleWidth + birdWidth && tapY >= birdY && tapY <= birdY + birdHeight) {
      runOnJS(setBirdColor)('blue');
      runOnJS(playJumpSound)();
      return;
    }

    // Red bird
    if (tapX >= 185 * scaleWidth && tapX <= 185 * scaleWidth + birdWidth && tapY >= birdY && tapY <= birdY + birdHeight) {
      runOnJS(setBirdColor)('red');
      runOnJS(playJumpSound)();
      return;
    }

    // Manas bird
    if (tapX >= 270 * scaleWidth && tapX <= 270 * scaleWidth + birdWidth && tapY >= birdY && tapY <= birdY + birdHeight) {
      runOnJS(setBirdColor)('manas');
      runOnJS(playJumpSound)();
      return;
    }

    // Custom bird buttons - 4 columns with proper spacing - SCALED
    const birdSize = 60 * scale;
    const totalWidth = width - 20 * scaleWidth;
    const spacing = (totalWidth - (4 * birdSize)) / 5;
    const customPositions = [
      10 * scaleWidth + spacing + birdSize / 2,
      10 * scaleWidth + spacing + birdSize + spacing + birdSize / 2,
      10 * scaleWidth + spacing + birdSize + spacing + birdSize + spacing + birdSize / 2,
      10 * scaleWidth + spacing + birdSize + spacing + birdSize + spacing + birdSize + spacing + birdSize / 2
    ];
    const customBirdStartY = 530 * scaleHeight;
    const customBirdRadius = 35 * scale; // Smaller radius for smaller birds
    const customBirdRowSpacing = 110 * scaleHeight; // More spacing between rows
    const birdsPerRow = 4; // 4 columns with better spacing

    // Check each existing custom bird
    for (let i = 0; i < customImages.length; i++) {
      const col = i % birdsPerRow;
      const row = Math.floor(i / birdsPerRow);
      const birdX = customPositions[col];
      const birdY = customBirdStartY + row * customBirdRowSpacing;

      // Check delete button (top-right corner) - SCALED
      const deleteX = birdX + 25 * scaleWidth;
      const deleteY = birdY - 25 * scaleHeight;
      const deleteRadius = 15 * scale;

      if (Math.sqrt((tapX - deleteX) ** 2 + (tapY - deleteY) ** 2) <= deleteRadius) {
        runOnJS(deleteCustomBird)(i);
        return;
      }

      // Check bird selection (main circle)
      if (Math.sqrt((tapX - birdX) ** 2 + (tapY - birdY) ** 2) <= customBirdRadius) {
        runOnJS(setBirdColor)(`custom${i}`);
        runOnJS(playJumpSound)();
        return;
      }
    }

    // Check the "+" add button (always after the last custom bird) - SCALED
    const nextIndex = customImages.length;
    const nextCol = nextIndex % birdsPerRow;
    const nextRow = Math.floor(nextIndex / birdsPerRow);
    const nextX = customPositions[nextCol];
    const nextY = customBirdStartY + nextRow * customBirdRowSpacing;

    if (Math.sqrt((tapX - nextX) ** 2 + (tapY - nextY) ** 2) <= 35 * scale) {
      runOnJS(pickImage)();
      return;
    }

    // Save button - SCALED
    if (tapX >= width / 2 - 140 * scaleWidth && tapX <= width / 2 + 140 * scaleWidth && tapY >= height - 220 * scaleHeight && tapY <= height - 140 * scaleHeight) {
      runOnJS(savePreferences)();
      return;
    }

    // Back button - SCALED
    if (tapX >= width / 2 - 140 * scaleWidth && tapX <= width / 2 + 140 * scaleWidth && tapY >= height - 120 * scaleHeight && tapY <= height - 40 * scaleHeight) {
      runOnJS(setCurrentPage)('game');
      runOnJS(playJumpSound)();
      return;
    }
  });

  const birdTransform = useDerivedValue(() => {
    return [
      {
        rotate: interpolate(
          birdYVelocity.value,
          [-500, 500],
          [-0.5, 0.5],
          Extrapolation.CLAMP
        ),
      },
    ];
  });
  const birdOrigin = useDerivedValue(() => {
    return { x: width / 4 + 32, y: birdY.value + 24 };
  });

  // Create circular clip for custom bird
  const birdClipPath = useDerivedValue(() => {
    return rrect(rect(birdX, birdY.value, 48, 48), 24, 24);
  });

  const fontFamily = Platform.select({ ios: 'Helvetica', default: 'serif' });
  const pixelFontFamily = Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' });

  const fontStyle = {
    fontFamily,
    fontSize: 40,
  };
  const font = matchFont(fontStyle);

  const smallFontStyle = {
    fontFamily,
    fontSize: 14,
  };
  const smallFont = matchFont(smallFontStyle);

  const mediumFontStyle = {
    fontFamily: pixelFontFamily,
    fontSize: 18,
    fontWeight: 'bold',
  };
  const mediumFont = matchFont(mediumFontStyle);

  const boldPixelFontStyle = {
    fontFamily: pixelFontFamily,
    fontSize: 24,
    fontWeight: 'bold',
  };
  const boldPixelFont = matchFont(boldPixelFontStyle);

  const pixelAvatarFontStyle = {
    fontFamily: pixelFontFamily,
    fontSize: 32,
    fontWeight: 'bold',
  };
  const pixelAvatarFont = matchFont(pixelAvatarFontStyle);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {currentPage === 'game' ? (
        <GestureDetector gesture={gesture}>
          <Canvas style={{ width, height }}>
          {/* BG */}
          <Image image={bg} width={width} height={height} fit={'cover'} />

          {/* Pipes - only show when playing */}
          {gameState !== 'waiting' && (
            <>
              <Image
                image={pipeTop}
                y={topPipeY}
                x={pipeX}
                width={pipeWidth}
                height={pipeHeight}
              />
              <Image
                image={pipeBottom}
                y={bottomPipeY}
                x={pipeX}
                width={pipeWidth}
                height={pipeHeight}
              />
            </>
          )}

          {/* Base */}
          <Image
            image={base}
            width={width}
            height={150 * scaleHeight}
            y={height - 75 * scaleHeight}
            x={0}
            fit={'cover'}
          />

          {/* Bird */}
          {bird && (
            <Group transform={birdTransform} origin={birdOrigin}>
              {(birdColor.startsWith('custom') || birdColor === 'manas') ? (
                <Group clip={birdClipPath}>
                  {/* Circular clipped custom bird with pixel art style and background removal */}
                  <Image
                    image={bird}
                    y={birdY}
                    x={birdX}
                    width={48}
                    height={48}
                    fit="cover"
                  >
                    <ColorMatrix
                      matrix={[
                        1.2, 0, 0, 0, 0,     // Red: boost contrast
                        0, 1.2, 0, 0, 0,     // Green: boost contrast
                        0, 0, 1.2, 0, 0,     // Blue: boost contrast
                        0, 0, 0, 1.5, -0.3,  // Alpha: increase transparency on lighter pixels
                      ]}
                    />
                  </Image>
                </Group>
              ) : (
                <Image image={bird} y={birdY} x={birdX} width={64} height={48} />
              )}
            </Group>
          )}

          {/* Score - only show when playing */}
          {gameState === 'playing' && (
            <Text
              x={width / 2 - 30}
              y={100}
              text={score.toString()}
              font={font}
            />
          )}

          {/* Tap to Play Message - SCALED */}
          {gameState === 'waiting' && messageImg && (
            <>
              <Image
                image={messageImg}
                x={width / 2 - 92 * scaleWidth}
                y={height / 2 - 150 * scaleHeight}
                width={184 * scaleWidth}
                height={267 * scaleHeight}
              />

              {/* Customize Button - moves based on whether customization is saved - SCALED */}
              {customizeBtn && (
                <Image
                  image={customizeBtn}
                  x={width / 2 - 145 * scaleWidth}
                  y={hasCustomization ? height / 2 + 50 * scaleHeight : height / 2 + 100 * scaleHeight}
                  width={320 * scaleWidth}
                  height={107 * scaleHeight}
                  fit="contain"
                />
              )}

              {/* Development Team Button - SCALED */}
              {devTeamBtn && (
                <Image
                  image={devTeamBtn}
                  x={width / 2 - 130 * scaleWidth}
                  y={hasCustomization ? height / 2 + 165 * scaleHeight : height / 2 + 215 * scaleHeight}
                  width={260 * scaleWidth}
                  height={87 * scaleHeight}
                  fit="contain"
                />
              )}
            </>
          )}

          {/* Game Over Screen - SCALED */}
          {gameState === 'gameOver' && (
            <>
              {/* Game Over Image - SCALED */}
              {gameOverImg && (
                <Image
                  image={gameOverImg}
                  x={width / 2 - 96 * scaleWidth}
                  y={150 * scaleHeight}
                  width={192 * scaleWidth}
                  height={42 * scaleHeight}
                />
              )}

              {/* Final Score with shadow effect - SCALED */}
              <Text
                x={122 * scaleWidth}
                y={250 * scaleHeight}
                text={`Score: ${score}`}
                font={font}
                color="#000000"
              />
              <Text
                x={120 * scaleWidth}
                y={248 * scaleHeight}
                text={`Score: ${score}`}
                font={font}
                color="#FFD700"
              />

              {/* Restart Game Button - SCALED */}
              {restartGameBtn && (
                <Image
                  image={restartGameBtn}
                  x={width / 2 - 140 * scaleWidth}
                  y={300 * scaleHeight}
                  width={280 * scaleWidth}
                  height={80 * scaleHeight}
                  fit="contain"
                />
              )}
            </>
          )}
        </Canvas>
      </GestureDetector>
      ) : currentPage === 'customize' ? (
        <GestureDetector gesture={customizeGesture}>
          <Canvas style={{ width, height }}>
          {/* Customization Page Background */}
          <Image image={bg} width={width} height={height} fit={'cover'} />

          {/* Page Title - SCALED */}
          <Group>
            {customizePt && (
              <Image
                image={customizePt}
                x={width / 2 - 280 * scaleWidth}
                y={10 * scaleHeight}
                width={560 * scaleWidth}
                height={160 * scaleHeight}
                fit="contain"
              />
            )}
          </Group>

          {/* Theme Section - SCALED */}
          <Group>
            {selectThemePt && (
              <Image
                image={selectThemePt}
                x={-10 * scaleWidth}
                y={160 * scaleHeight}
                width={280 * scaleWidth}
                height={70 * scaleHeight}
                fit="contain"
              />
            )}

            {/* Day Theme - SCALED */}
            <Group>
              <Circle
                cx={width / 2 - 80 * scaleWidth}
                cy={250 * scaleHeight}
                r={30 * scale}
                color="#87CEEB"
                opacity={theme === 'day' ? 1 : 0.4}
              />
              {bgDay && (
                <Group clip={rrect(rect(width / 2 - 110 * scaleWidth, 220 * scaleHeight, 60 * scale, 60 * scale), 30 * scale, 30 * scale)}>
                  <Image
                    image={bgDay}
                    x={width / 2 - 110 * scaleWidth}
                    y={220 * scaleHeight}
                    width={60 * scale}
                    height={60 * scale}
                    fit="cover"
                    opacity={theme === 'day' ? 1 : 0.4}
                  />
                </Group>
              )}
              {theme === 'day' && (
                <Circle
                  cx={width / 2 - 80 * scaleWidth}
                  cy={250 * scaleHeight}
                  r={33 * scale}
                  style="stroke"
                  strokeWidth={3 * scale}
                  color="#FFD700"
                />
              )}
              <Text
                x={width / 2 - 95 * scaleWidth}
                y={290 * scaleHeight}
                text="Day"
                font={smallFont}
                color="#FFFFFF"
              />
            </Group>

            {/* Night Theme - SCALED */}
            <Group>
              <Circle
                cx={width / 2}
                cy={250 * scaleHeight}
                r={30 * scale}
                color="#1a1a2e"
                opacity={theme === 'night' ? 1 : 0.4}
              />
              {bgNight && (
                <Group clip={rrect(rect(width / 2 - 30 * scale, 220 * scaleHeight, 60 * scale, 60 * scale), 30 * scale, 30 * scale)}>
                  <Image
                    image={bgNight}
                    x={width / 2 - 30 * scale}
                    y={220 * scaleHeight}
                    width={60 * scale}
                    height={60 * scale}
                    fit="cover"
                    opacity={theme === 'night' ? 1 : 0.4}
                  />
                </Group>
              )}
              {theme === 'night' && (
                <Circle
                  cx={width / 2}
                  cy={250 * scaleHeight}
                  r={33 * scale}
                  style="stroke"
                  strokeWidth={3 * scale}
                  color="#FFD700"
                />
              )}
              <Text
                x={width / 2 - 20 * scaleWidth}
                y={290 * scaleHeight}
                text="Night"
                font={smallFont}
                color="#FFFFFF"
              />
            </Group>

            {/* City Theme - SCALED */}
            <Group>
              <Circle
                cx={width / 2 + 80 * scaleWidth}
                cy={250 * scaleHeight}
                r={30 * scale}
                color="#FF6B6B"
                opacity={theme === 'city' ? 1 : 0.4}
              />
              {bgCity && (
                <Group clip={rrect(rect(width / 2 + 50 * scaleWidth, 220 * scaleHeight, 60 * scale, 60 * scale), 30 * scale, 30 * scale)}>
                  <Image
                    image={bgCity}
                    x={width / 2 + 50 * scaleWidth}
                    y={220 * scaleHeight}
                    width={60 * scale}
                    height={60 * scale}
                    fit="cover"
                    opacity={theme === 'city' ? 1 : 0.4}
                  />
                </Group>
              )}
              {theme === 'city' && (
                <Circle
                  cx={width / 2 + 80 * scaleWidth}
                  cy={250 * scaleHeight}
                  r={33 * scale}
                  style="stroke"
                  strokeWidth={3 * scale}
                  color="#FFD700"
                />
              )}
              <Text
                x={width / 2 + 65 * scaleWidth}
                y={290 * scaleHeight}
                text="City"
                font={smallFont}
                color="#FFFFFF"
              />
            </Group>
          </Group>

          {/* Bird Section - SCALED */}
          <Group>
            {selectCharectorPt && (
              <Image
                image={selectCharectorPt}
                x={-10 * scaleWidth}
                y={340 * scaleHeight}
                width={280 * scaleWidth}
                height={70 * scaleHeight}
                fit="contain"
              />
            )}

            {/* Yellow Bird - SCALED */}
            <Group>
              {yellowBird && (
                <>
                  {birdColor === 'yellow' && (
                    <Group opacity={0.3}>
                      <Image
                        image={yellowBird}
                        x={15 * scaleWidth}
                        y={410 * scaleHeight}
                        width={70 * scaleWidth}
                        height={52 * scaleHeight}
                      />
                    </Group>
                  )}
                  <Image
                    image={yellowBird}
                    x={15 * scaleWidth}
                    y={410 * scaleHeight}
                    width={70 * scaleWidth}
                    height={52 * scaleHeight}
                    opacity={birdColor === 'yellow' ? 1 : 0.6}
                  />
                  {birdColor === 'yellow' && (
                    <Circle
                      cx={50 * scaleWidth}
                      cy={436 * scaleHeight}
                      r={40 * scale}
                      style="stroke"
                      strokeWidth={3 * scale}
                      color="#FFD700"
                    />
                  )}
                </>
              )}
            </Group>

            {/* Blue Bird - SCALED */}
            <Group>
              {blueBird && (
                <>
                  {birdColor === 'blue' && (
                    <Group opacity={0.3}>
                      <Image
                        image={blueBird}
                        x={100 * scaleWidth}
                        y={410 * scaleHeight}
                        width={70 * scaleWidth}
                        height={52 * scaleHeight}
                      />
                    </Group>
                  )}
                  <Image
                    image={blueBird}
                    x={100 * scaleWidth}
                    y={410 * scaleHeight}
                    width={70 * scaleWidth}
                    height={52 * scaleHeight}
                    opacity={birdColor === 'blue' ? 1 : 0.6}
                  />
                  {birdColor === 'blue' && (
                    <Circle
                      cx={135 * scaleWidth}
                      cy={436 * scaleHeight}
                      r={40 * scale}
                      style="stroke"
                      strokeWidth={3 * scale}
                      color="#FFD700"
                    />
                  )}
                </>
              )}
            </Group>

            {/* Red Bird - SCALED */}
            <Group>
              {redBird && (
                <>
                  {birdColor === 'red' && (
                    <Group opacity={0.3}>
                      <Image
                        image={redBird}
                        x={185 * scaleWidth}
                        y={410 * scaleHeight}
                        width={70 * scaleWidth}
                        height={52 * scaleHeight}
                      />
                    </Group>
                  )}
                  <Image
                    image={redBird}
                    x={185 * scaleWidth}
                    y={410 * scaleHeight}
                    width={70 * scaleWidth}
                    height={52 * scaleHeight}
                    opacity={birdColor === 'red' ? 1 : 0.6}
                  />
                  {birdColor === 'red' && (
                    <Circle
                      cx={220 * scaleWidth}
                      cy={436 * scaleHeight}
                      r={40 * scale}
                      style="stroke"
                      strokeWidth={3 * scale}
                      color="#FFD700"
                    />
                  )}
                </>
              )}
            </Group>

            {/* Manas Bird - SCALED */}
            <Group>
              {manasBird && (
                <>
                  {birdColor === 'manas' && (
                    <Group opacity={0.3}>
                      <Group clip={rrect(rect(270 * scaleWidth, 401 * scaleHeight, 70 * scaleWidth, 70 * scaleHeight), 35 * scale, 35 * scale)}>
                        <Image
                          image={manasBird}
                          x={270 * scaleWidth}
                          y={401 * scaleHeight}
                          width={70 * scaleWidth}
                          height={70 * scaleHeight}
                          fit="cover"
                        />
                      </Group>
                    </Group>
                  )}
                  <Group clip={rrect(rect(270 * scaleWidth, 401 * scaleHeight, 70 * scaleWidth, 70 * scaleHeight), 35 * scale, 35 * scale)}>
                    <Image
                      image={manasBird}
                      x={270 * scaleWidth}
                      y={401 * scaleHeight}
                      width={70 * scaleWidth}
                      height={70 * scaleHeight}
                      fit="cover"
                      opacity={birdColor === 'manas' ? 1 : 0.6}
                    />
                  </Group>
                  {birdColor === 'manas' && (
                    <Circle
                      cx={305 * scaleWidth}
                      cy={436 * scaleHeight}
                      r={40 * scale}
                      style="stroke"
                      strokeWidth={3 * scale}
                      color="#FFD700"
                    />
                  )}
                </>
              )}
            </Group>

            {/* Dynamic Custom Birds - below default birds, aligned with their positions - SCALED */}
            {customBirdImages.map((customBirdImg, index) => {
              // Position to fit within screen bounds - 4 columns with proper spacing
              const birdSize = 60 * scale; // Smaller birds
              const totalWidth = width - 20 * scaleWidth; // Leave margins
              const spacing = (totalWidth - (4 * birdSize)) / 5; // 5 gaps for 4 birds
              const positions = [
                10 * scaleWidth + spacing + birdSize / 2,
                10 * scaleWidth + spacing + birdSize + spacing + birdSize / 2,
                10 * scaleWidth + spacing + birdSize + spacing + birdSize + spacing + birdSize / 2,
                10 * scaleWidth + spacing + birdSize + spacing + birdSize + spacing + birdSize + spacing + birdSize / 2
              ];
              const col = index % 4; // 4 columns with better spacing
              const row = Math.floor(index / 4);
              const x = positions[col];
              const y = 530 * scaleHeight + row * 110 * scaleHeight; // More vertical spacing
              const isSelected = birdColor === `custom${index}`;

              return (
                <Group key={index}>
                  {isSelected && (
                    <Circle
                      cx={x}
                      cy={y}
                      r={32 * scale}
                      color="rgba(255, 255, 255, 0.3)"
                    />
                  )}
                  <Group clip={rrect(rect(x - 30 * scale, y - 30 * scale, 60 * scale, 60 * scale), 30 * scale, 30 * scale)}>
                    <Image
                      image={customBirdImg}
                      x={x - 30 * scale}
                      y={y - 30 * scale}
                      width={60 * scale}
                      height={60 * scale}
                      fit="cover"
                      opacity={isSelected ? 1 : 0.6}
                    >
                      <ColorMatrix
                        matrix={[
                          1.2, 0, 0, 0, 0,
                          0, 1.2, 0, 0, 0,
                          0, 0, 1.2, 0, 0,
                          0, 0, 0, 1.5, -0.3,
                        ]}
                      />
                    </Image>
                  </Group>
                  {isSelected && (
                    <Circle
                      cx={x}
                      cy={y}
                      r={37 * scale}
                      style="stroke"
                      strokeWidth={3 * scale}
                      color="#FFD700"
                    />
                  )}

                  {/* Delete button - top right corner - SCALED */}
                  {deleteIcon && (
                    <Image
                      image={deleteIcon}
                      x={x + 10 * scaleWidth}
                      y={y - 40 * scaleHeight}
                      width={30 * scaleWidth}
                      height={30 * scaleHeight}
                      fit="contain"
                    />
                  )}
                </Group>
              );
            })}

            {/* Add new custom bird button - SCALED */}
            <Group>
              {(() => {
                const birdSize = 60 * scale;
                const totalWidth = width - 20 * scaleWidth;
                const spacing = (totalWidth - (4 * birdSize)) / 5;
                const positions = [
                  10 * scaleWidth + spacing + birdSize / 2,
                  10 * scaleWidth + spacing + birdSize + spacing + birdSize / 2,
                  10 * scaleWidth + spacing + birdSize + spacing + birdSize + spacing + birdSize / 2,
                  10 * scaleWidth + spacing + birdSize + spacing + birdSize + spacing + birdSize + spacing + birdSize / 2
                ];
                const nextIndex = customImages.length;
                const col = nextIndex % 4;
                const row = Math.floor(nextIndex / 4);
                const x = positions[col];
                const y = 530 * scaleHeight + row * 110 * scaleHeight;

                return (
                  <>
                    <Circle
                      cx={x}
                      cy={y}
                      r={35 * scale}
                      color="rgba(255, 255, 255, 0.1)"
                    />
                    <Circle
                      cx={x}
                      cy={y}
                      r={35 * scale}
                      style="stroke"
                      strokeWidth={2 * scale}
                      color="rgba(255, 255, 255, 0.5)"
                    />
                    {addIcon && (
                      <Image
                        image={addIcon}
                        x={x - 30 * scale}
                        y={y - 30 * scale}
                        width={60 * scale}
                        height={60 * scale}
                        fit="contain"
                      />
                    )}
                  </>
                );
              })()}
            </Group>
          </Group>

          {/* Save Button - SCALED */}
          {saveBtn && (
            <Image
              image={saveBtn}
              x={width / 2 - 140 * scaleWidth}
              y={height - 220 * scaleHeight}
              width={280 * scaleWidth}
              height={80 * scaleHeight}
              fit="contain"
            />
          )}

          {/* Back Button - SCALED */}
          {backBtn && (
            <Image
              image={backBtn}
              x={width / 2 - 140 * scaleWidth}
              y={height - 120 * scaleHeight}
              width={280 * scaleWidth}
              height={80 * scaleHeight}
              fit="contain"
            />
          )}
        </Canvas>
        </GestureDetector>
      ) : (
        <GestureDetector gesture={Gesture.Tap().onStart((event) => {
          'worklet';
          const tapX = event.x;
          const tapY = event.y;

          // Harsha card (Gold) - SCALED
          if (tapX >= 5 * scaleWidth && tapX <= 355 * scaleWidth && tapY >= 120 * scaleHeight && tapY <= 235 * scaleHeight) {
            runOnJS(openInstagram)('harsha1218_');
            runOnJS(playJumpSound)();
            return;
          }

          // Manas card (Blue) - SCALED
          if (tapX >= 5 * scaleWidth && tapX <= 355 * scaleWidth && tapY >= 245 * scaleHeight && tapY <= 360 * scaleHeight) {
            runOnJS(openInstagram)('manas.habbu13');
            runOnJS(playJumpSound)();
            return;
          }

          // Mithun card (Red) - SCALED
          if (tapX >= 5 * scaleWidth && tapX <= 355 * scaleWidth && tapY >= 370 * scaleHeight && tapY <= 485 * scaleHeight) {
            runOnJS(openInstagram)('mithun.gowda.b');
            runOnJS(playJumpSound)();
            return;
          }

          // Naren card (Green) - SCALED
          if (tapX >= 5 * scaleWidth && tapX <= 355 * scaleWidth && tapY >= 495 * scaleHeight && tapY <= 610 * scaleHeight) {
            runOnJS(openInstagram)('naren_vk_29');
            runOnJS(playJumpSound)();
            return;
          }

          // Nevil card (Purple) - SCALED
          if (tapX >= 5 * scaleWidth && tapX <= 355 * scaleWidth && tapY >= 620 * scaleHeight && tapY <= 735 * scaleHeight) {
            runOnJS(openInstagram)('_nevil_06');
            runOnJS(playJumpSound)();
            return;
          }

          // Back button - SCALED (left side, above Harsha card)
          if (tapX >= 0 && tapX <= 180 * scaleWidth && tapY >= 35 * scaleHeight && tapY <= 155 * scaleHeight) {
            runOnJS(setCurrentPage)('game');
            runOnJS(playJumpSound)();
            return;
          }
        })}>
          <Canvas style={{ width, height }}>
          {/* Development Team Page Background */}
          <Image image={bg} width={width} height={height} fit={'cover'} />

          {/* Page Title - SCALED */}
          {devTeamPt && (
            <Image
              image={devTeamPt}
              x={width / 2 - 250 * scaleWidth}
              y={10 * scaleHeight}
              width={500 * scaleWidth}
              height={100 * scaleHeight}
              fit="contain"
            />
          )}

          {/* Developer Cards - Premium Full-Width Design */}
          <Group>
            {/* Harsha Card - Red Premium */}
            <Group>
              {/* Outer glow mega effect */}
              <Group clip={rrect(rect(3 * scaleWidth, 123 * scaleHeight, 354 * scaleWidth, 115 * scaleHeight), 28 * scale, 28 * scale)} opacity={0.4}>
                <Circle cx={180 * scaleWidth} cy={180 * scaleHeight} r={130 * scale} color="#E74C3C" />
              </Group>
              {/* Card deep shadow */}
              <Group clip={rrect(rect(6 * scaleWidth, 125 * scaleHeight, 354 * scaleWidth, 115 * scaleHeight), 28 * scale, 28 * scale)}>
                <Circle cx={183 * scaleWidth} cy={182 * scaleHeight} r={140 * scale} color="rgba(0, 0, 0, 0.35)" />
              </Group>
              {/* Card base - gradient dark */}
              <Group clip={rrect(rect(5 * scaleWidth, 120 * scaleHeight, 350 * scaleWidth, 115 * scaleHeight), 28 * scale, 28 * scale)}>
                <Circle cx={180 * scaleWidth} cy={177 * scaleHeight} r={140 * scale} color="#0a0a0a" />
                <Circle cx={100 * scaleWidth} cy={140 * scaleHeight} r={100 * scale} color="#1a1a1a" opacity={0.8} />
                <Circle cx={280 * scaleWidth} cy={200 * scaleHeight} r={90 * scale} color="#1a1a1a" opacity={0.6} />
              </Group>
              {/* Left gradient overlay */}
              <Group clip={rrect(rect(5 * scaleWidth, 120 * scaleHeight, 120 * scaleWidth, 115 * scaleHeight), 28 * scale, 0)} opacity={0.5}>
                <Circle cx={65 * scaleWidth} cy={177 * scaleHeight} r={90 * scale} color="#E74C3C50" />
              </Group>
              {/* Right subtle gradient */}
              <Group clip={rrect(rect(240 * scaleWidth, 120 * scaleHeight, 115 * scaleWidth, 115 * scaleHeight), 0, 28 * scale)} opacity={0.15}>
                <Circle cx={298 * scaleWidth} cy={177 * scaleHeight} r={80 * scale} color="#E74C3C30" />
              </Group>
              {/* Top premium accent bar */}
              <Group clip={rrect(rect(5 * scaleWidth, 120 * scaleHeight, 350 * scaleWidth, 5 * scaleHeight), 28 * scale, 0)}>
                <Circle cx={180 * scaleWidth} cy={122 * scaleHeight} r={175 * scale} color="#E74C3C" />
                <Circle cx={250 * scaleWidth} cy={122 * scaleHeight} r={100 * scale} color="#C0392B" opacity={0.6} />
              </Group>
              {/* Avatar section - large premium */}
              {/* Outer glow rings */}
              <Circle cx={70 * scaleWidth} cy={177 * scaleHeight} r={52 * scale} color="#E74C3C40" />
              <Circle cx={70 * scaleWidth} cy={177 * scaleHeight} r={50 * scale} color="#E74C3C60" />
              {/* Avatar base rings */}
              <Circle cx={70 * scaleWidth} cy={177 * scaleHeight} r={48 * scale} color="#0a0a0a" />
              <Circle cx={70 * scaleWidth} cy={177 * scaleHeight} r={45 * scale} color="#E74C3C" />
              <Circle cx={70 * scaleWidth} cy={177 * scaleHeight} r={43 * scale} color="#1a1a1a" />
              <Circle cx={70 * scaleWidth} cy={177 * scaleHeight} r={40 * scale} color="#2a2a2a" />
              {/* Inner gradient for depth */}
              <Circle cx={70 * scaleWidth} cy={177 * scaleHeight} r={38 * scale} color="#E74C3C20" />
              {/* Avatar image */}
              {harshaPt && (
                <Group clip={rrect(rect(30 * scaleWidth, 137 * scaleHeight, 80 * scaleWidth, 80 * scaleHeight), 40 * scale, 40 * scale)}>
                  <Image image={harshaPt} x={30 * scaleWidth} y={137 * scaleHeight} width={80 * scaleWidth} height={80 * scaleHeight} fit="cover" />
                </Group>
              )}
              {/* Status dot with glow */}
              <Circle cx={102 * scaleWidth} cy={155 * scaleHeight} r={9 * scale} color="#00FF0060" />
              <Circle cx={102 * scaleWidth} cy={155 * scaleHeight} r={7 * scale} color="#0a0a0a" />
              <Circle cx={102 * scaleWidth} cy={155 * scaleHeight} r={5 * scale} color="#00FF00" />
              {/* Decorative line separator */}
              <Group clip={rrect(rect(130 * scaleWidth, 165 * scaleHeight, 2 * scaleWidth, 30 * scaleHeight), 1 * scale, 1 * scale)}>
                <Circle cx={131 * scaleWidth} cy={180 * scaleHeight} r={20 * scale} color="#E74C3C30" />
              </Group>
              {/* Name and role section */}
              <Text x={145 * scaleWidth} y={165 * scaleHeight} text="HARSHA N" font={boldPixelFont} color="#FFFFFF" />
              <Text x={145 * scaleWidth} y={185 * scaleHeight} text="Developer" font={mediumFont} color="#E74C3C" />
              {/* Stats badges - premium style */}
              <Group clip={rrect(rect(145 * scaleWidth, 197 * scaleHeight, 70 * scaleWidth, 28 * scaleHeight), 14 * scale, 14 * scale)}>
                <Circle cx={180 * scaleWidth} cy={211 * scaleHeight} r={45 * scale} color="#E74C3C25" />
              </Group>
              <Text x={153 * scaleWidth} y={215 * scaleHeight} text="DESIGN" font={mediumFont} color="#E74C3C" />
              <Group clip={rrect(rect(225 * scaleWidth, 197 * scaleHeight, 70 * scaleWidth, 28 * scaleHeight), 14 * scale, 14 * scale)}>
                <Circle cx={260 * scaleWidth} cy={211 * scaleHeight} r={45 * scale} color="#00FF0025" />
              </Group>
              <Text x={235 * scaleWidth} y={215 * scaleHeight} text="ACTIVE" font={mediumFont} color="#00FF00" />
              {/* Right corner badge */}
              <Group clip={rrect(rect(305 * scaleWidth, 197 * scaleHeight, 38 * scaleWidth, 22 * scaleHeight), 11 * scale, 11 * scale)}>
                <Circle cx={324 * scaleWidth} cy={208 * scaleHeight} r={25 * scale} color="#E74C3C40" />
              </Group>
              <Text x={312 * scaleWidth} y={212 * scaleHeight} text="DEV" font={mediumFont} color="#E74C3C" />
            </Group>

            {/* Manas Card - Blue Premium */}
            <Group>
              <Group clip={rrect(rect(3 * scaleWidth, 248 * scaleHeight, 354 * scaleWidth, 115 * scaleHeight), 28 * scale, 28 * scale)} opacity={0.4}>
                <Circle cx={180 * scaleWidth} cy={305 * scaleHeight} r={130 * scale} color="#4A90E2" />
              </Group>
              <Group clip={rrect(rect(6 * scaleWidth, 250 * scaleHeight, 354 * scaleWidth, 115 * scaleHeight), 28 * scale, 28 * scale)}>
                <Circle cx={183 * scaleWidth} cy={307 * scaleHeight} r={140 * scale} color="rgba(0, 0, 0, 0.35)" />
              </Group>
              <Group clip={rrect(rect(5 * scaleWidth, 245 * scaleHeight, 350 * scaleWidth, 115 * scaleHeight), 28 * scale, 28 * scale)}>
                <Circle cx={180 * scaleWidth} cy={302 * scaleHeight} r={140 * scale} color="#0a0a0a" />
                <Circle cx={100 * scaleWidth} cy={265 * scaleHeight} r={100 * scale} color="#1a1a1a" opacity={0.8} />
                <Circle cx={280 * scaleWidth} cy={325 * scaleHeight} r={90 * scale} color="#1a1a1a" opacity={0.6} />
              </Group>
              <Group clip={rrect(rect(5 * scaleWidth, 245 * scaleHeight, 120 * scaleWidth, 115 * scaleHeight), 28 * scale, 0)} opacity={0.5}>
                <Circle cx={65 * scaleWidth} cy={302 * scaleHeight} r={90 * scale} color="#4A90E250" />
              </Group>
              <Group clip={rrect(rect(240 * scaleWidth, 245 * scaleHeight, 115 * scaleWidth, 115 * scaleHeight), 0, 28 * scale)} opacity={0.15}>
                <Circle cx={298 * scaleWidth} cy={302 * scaleHeight} r={80 * scale} color="#4A90E230" />
              </Group>
              <Group clip={rrect(rect(5 * scaleWidth, 245 * scaleHeight, 350 * scaleWidth, 5 * scaleHeight), 28 * scale, 0)}>
                <Circle cx={180 * scaleWidth} cy={247 * scaleHeight} r={175 * scale} color="#4A90E2" />
                <Circle cx={250 * scaleWidth} cy={247 * scaleHeight} r={100 * scale} color="#357ABD" opacity={0.6} />
              </Group>
              <Circle cx={70 * scaleWidth} cy={302 * scaleHeight} r={52 * scale} color="#4A90E240" />
              <Circle cx={70 * scaleWidth} cy={302 * scaleHeight} r={50 * scale} color="#4A90E260" />
              <Circle cx={70 * scaleWidth} cy={302 * scaleHeight} r={48 * scale} color="#0a0a0a" />
              <Circle cx={70 * scaleWidth} cy={302 * scaleHeight} r={45 * scale} color="#4A90E2" />
              <Circle cx={70 * scaleWidth} cy={302 * scaleHeight} r={43 * scale} color="#1a1a1a" />
              <Circle cx={70 * scaleWidth} cy={302 * scaleHeight} r={40 * scale} color="#2a2a2a" />
              <Circle cx={70 * scaleWidth} cy={302 * scaleHeight} r={38 * scale} color="#4A90E220" />
              {/* Avatar image */}
              {manasPt && (
                <Group clip={rrect(rect(30 * scaleWidth, 262 * scaleHeight, 80 * scaleWidth, 80 * scaleHeight), 40 * scale, 40 * scale)}>
                  <Image image={manasPt} x={30 * scaleWidth} y={262 * scaleHeight} width={80 * scaleWidth} height={80 * scaleHeight} fit="cover" />
                </Group>
              )}
              <Circle cx={102 * scaleWidth} cy={280 * scaleHeight} r={9 * scale} color="#00FF0060" />
              <Circle cx={102 * scaleWidth} cy={280 * scaleHeight} r={7 * scale} color="#0a0a0a" />
              <Circle cx={102 * scaleWidth} cy={280 * scaleHeight} r={5 * scale} color="#00FF00" />
              <Group clip={rrect(rect(130 * scaleWidth, 290 * scaleHeight, 2 * scaleWidth, 30 * scaleHeight), 1 * scale, 1 * scale)}>
                <Circle cx={131 * scaleWidth} cy={305 * scaleHeight} r={20 * scale} color="#4A90E230" />
              </Group>
              <Text x={145 * scaleWidth} y={290 * scaleHeight} text="MANAS HABBU" font={boldPixelFont} color="#FFFFFF" />
              <Text x={145 * scaleWidth} y={310 * scaleHeight} text="Developer" font={mediumFont} color="#4A90E2" />
              <Group clip={rrect(rect(145 * scaleWidth, 322 * scaleHeight, 70 * scaleWidth, 28 * scaleHeight), 14 * scale, 14 * scale)}>
                <Circle cx={180 * scaleWidth} cy={336 * scaleHeight} r={45 * scale} color="#4A90E225" />
              </Group>
              <Text x={153 * scaleWidth} y={340 * scaleHeight} text="DESIGN" font={mediumFont} color="#4A90E2" />
              <Group clip={rrect(rect(225 * scaleWidth, 322 * scaleHeight, 70 * scaleWidth, 28 * scaleHeight), 14 * scale, 14 * scale)}>
                <Circle cx={260 * scaleWidth} cy={336 * scaleHeight} r={45 * scale} color="#00FF0025" />
              </Group>
              <Text x={235 * scaleWidth} y={340 * scaleHeight} text="ACTIVE" font={mediumFont} color="#00FF00" />
              <Group clip={rrect(rect(305 * scaleWidth, 322 * scaleHeight, 38 * scaleWidth, 22 * scaleHeight), 11 * scale, 11 * scale)}>
                <Circle cx={324 * scaleWidth} cy={333 * scaleHeight} r={25 * scale} color="#4A90E240" />
              </Group>
              <Text x={312 * scaleWidth} y={337 * scaleHeight} text="DEV" font={mediumFont} color="#4A90E2" />
            </Group>

            {/* Mithun Card - Gold Premium */}
            <Group>
              <Group clip={rrect(rect(3 * scaleWidth, 373 * scaleHeight, 354 * scaleWidth, 115 * scaleHeight), 28 * scale, 28 * scale)} opacity={0.4}>
                <Circle cx={180 * scaleWidth} cy={430 * scaleHeight} r={130 * scale} color="#FFD700" />
              </Group>
              <Group clip={rrect(rect(6 * scaleWidth, 375 * scaleHeight, 354 * scaleWidth, 115 * scaleHeight), 28 * scale, 28 * scale)}>
                <Circle cx={183 * scaleWidth} cy={432 * scaleHeight} r={140 * scale} color="rgba(0, 0, 0, 0.35)" />
              </Group>
              <Group clip={rrect(rect(5 * scaleWidth, 370 * scaleHeight, 350 * scaleWidth, 115 * scaleHeight), 28 * scale, 28 * scale)}>
                <Circle cx={180 * scaleWidth} cy={427 * scaleHeight} r={140 * scale} color="#0a0a0a" />
                <Circle cx={100 * scaleWidth} cy={390 * scaleHeight} r={100 * scale} color="#1a1a1a" opacity={0.8} />
                <Circle cx={280 * scaleWidth} cy={450 * scaleHeight} r={90 * scale} color="#1a1a1a" opacity={0.6} />
              </Group>
              <Group clip={rrect(rect(5 * scaleWidth, 370 * scaleHeight, 120 * scaleWidth, 115 * scaleHeight), 28 * scale, 0)} opacity={0.5}>
                <Circle cx={65 * scaleWidth} cy={427 * scaleHeight} r={90 * scale} color="#FFD70050" />
              </Group>
              <Group clip={rrect(rect(240 * scaleWidth, 370 * scaleHeight, 115 * scaleWidth, 115 * scaleHeight), 0, 28 * scale)} opacity={0.15}>
                <Circle cx={298 * scaleWidth} cy={427 * scaleHeight} r={80 * scale} color="#FFD70030" />
              </Group>
              <Group clip={rrect(rect(5 * scaleWidth, 370 * scaleHeight, 350 * scaleWidth, 5 * scaleHeight), 28 * scale, 0)}>
                <Circle cx={180 * scaleWidth} cy={372 * scaleHeight} r={175 * scale} color="#FFD700" />
                <Circle cx={250 * scaleWidth} cy={372 * scaleHeight} r={100 * scale} color="#FFA500" opacity={0.6} />
              </Group>
              <Circle cx={70 * scaleWidth} cy={427 * scaleHeight} r={52 * scale} color="#FFD70040" />
              <Circle cx={70 * scaleWidth} cy={427 * scaleHeight} r={50 * scale} color="#FFD70060" />
              <Circle cx={70 * scaleWidth} cy={427 * scaleHeight} r={48 * scale} color="#0a0a0a" />
              <Circle cx={70 * scaleWidth} cy={427 * scaleHeight} r={45 * scale} color="#FFD700" />
              <Circle cx={70 * scaleWidth} cy={427 * scaleHeight} r={43 * scale} color="#1a1a1a" />
              <Circle cx={70 * scaleWidth} cy={427 * scaleHeight} r={40 * scale} color="#2a2a2a" />
              <Circle cx={70 * scaleWidth} cy={427 * scaleHeight} r={38 * scale} color="#FFD70020" />
              {/* Avatar image */}
              {mithunPt && (
                <Group clip={rrect(rect(30 * scaleWidth, 387 * scaleHeight, 80 * scaleWidth, 80 * scaleHeight), 40 * scale, 40 * scale)}>
                  <Image image={mithunPt} x={30 * scaleWidth} y={387 * scaleHeight} width={80 * scaleWidth} height={80 * scaleHeight} fit="cover" />
                </Group>
              )}
              <Circle cx={102 * scaleWidth} cy={405 * scaleHeight} r={9 * scale} color="#00FF0060" />
              <Circle cx={102 * scaleWidth} cy={405 * scaleHeight} r={7 * scale} color="#0a0a0a" />
              <Circle cx={102 * scaleWidth} cy={405 * scaleHeight} r={5 * scale} color="#00FF00" />
              <Group clip={rrect(rect(130 * scaleWidth, 415 * scaleHeight, 2 * scaleWidth, 30 * scaleHeight), 1 * scale, 1 * scale)}>
                <Circle cx={131 * scaleWidth} cy={430 * scaleHeight} r={20 * scale} color="#FFD70030" />
              </Group>
              <Text x={145 * scaleWidth} y={415 * scaleHeight} text="MITHUN GOWDA B" font={boldPixelFont} color="#FFFFFF" />
              <Text x={145 * scaleWidth} y={435 * scaleHeight} text="Team Lead" font={mediumFont} color="#FFD700" />
              <Group clip={rrect(rect(145 * scaleWidth, 447 * scaleHeight, 70 * scaleWidth, 28 * scaleHeight), 14 * scale, 14 * scale)}>
                <Circle cx={180 * scaleWidth} cy={461 * scaleHeight} r={45 * scale} color="#FFD70025" />
              </Group>
              <Text x={157 * scaleWidth} y={465 * scaleHeight} text="LOGIC" font={mediumFont} color="#FFD700" />
              <Group clip={rrect(rect(225 * scaleWidth, 447 * scaleHeight, 70 * scaleWidth, 28 * scaleHeight), 14 * scale, 14 * scale)}>
                <Circle cx={260 * scaleWidth} cy={461 * scaleHeight} r={45 * scale} color="#00FF0025" />
              </Group>
              <Text x={235 * scaleWidth} y={465 * scaleHeight} text="ACTIVE" font={mediumFont} color="#00FF00" />
              <Group clip={rrect(rect(305 * scaleWidth, 447 * scaleHeight, 38 * scaleWidth, 22 * scaleHeight), 11 * scale, 11 * scale)}>
                <Circle cx={324 * scaleWidth} cy={458 * scaleHeight} r={25 * scale} color="#FFD70040" />
              </Group>
              <Text x={312 * scaleWidth} y={462 * scaleHeight} text="PRO" font={mediumFont} color="#FFD700" />
            </Group>

            {/* Naren Card - Green Premium */}
            <Group>
              <Group clip={rrect(rect(3 * scaleWidth, 498 * scaleHeight, 354 * scaleWidth, 115 * scaleHeight), 28 * scale, 28 * scale)} opacity={0.4}>
                <Circle cx={180 * scaleWidth} cy={555 * scaleHeight} r={130 * scale} color="#27AE60" />
              </Group>
              <Group clip={rrect(rect(6 * scaleWidth, 500 * scaleHeight, 354 * scaleWidth, 115 * scaleHeight), 28 * scale, 28 * scale)}>
                <Circle cx={183 * scaleWidth} cy={557 * scaleHeight} r={140 * scale} color="rgba(0, 0, 0, 0.35)" />
              </Group>
              <Group clip={rrect(rect(5 * scaleWidth, 495 * scaleHeight, 350 * scaleWidth, 115 * scaleHeight), 28 * scale, 28 * scale)}>
                <Circle cx={180 * scaleWidth} cy={552 * scaleHeight} r={140 * scale} color="#0a0a0a" />
                <Circle cx={100 * scaleWidth} cy={515 * scaleHeight} r={100 * scale} color="#1a1a1a" opacity={0.8} />
                <Circle cx={280 * scaleWidth} cy={575 * scaleHeight} r={90 * scale} color="#1a1a1a" opacity={0.6} />
              </Group>
              <Group clip={rrect(rect(5 * scaleWidth, 495 * scaleHeight, 120 * scaleWidth, 115 * scaleHeight), 28 * scale, 0)} opacity={0.5}>
                <Circle cx={65 * scaleWidth} cy={552 * scaleHeight} r={90 * scale} color="#27AE6050" />
              </Group>
              <Group clip={rrect(rect(240 * scaleWidth, 495 * scaleHeight, 115 * scaleWidth, 115 * scaleHeight), 0, 28 * scale)} opacity={0.15}>
                <Circle cx={298 * scaleWidth} cy={552 * scaleHeight} r={80 * scale} color="#27AE6030" />
              </Group>
              <Group clip={rrect(rect(5 * scaleWidth, 495 * scaleHeight, 350 * scaleWidth, 5 * scaleHeight), 28 * scale, 0)}>
                <Circle cx={180 * scaleWidth} cy={497 * scaleHeight} r={175 * scale} color="#27AE60" />
                <Circle cx={250 * scaleWidth} cy={497 * scaleHeight} r={100 * scale} color="#229954" opacity={0.6} />
              </Group>
              <Circle cx={70 * scaleWidth} cy={552 * scaleHeight} r={52 * scale} color="#27AE6040" />
              <Circle cx={70 * scaleWidth} cy={552 * scaleHeight} r={50 * scale} color="#27AE6060" />
              <Circle cx={70 * scaleWidth} cy={552 * scaleHeight} r={48 * scale} color="#0a0a0a" />
              <Circle cx={70 * scaleWidth} cy={552 * scaleHeight} r={45 * scale} color="#27AE60" />
              <Circle cx={70 * scaleWidth} cy={552 * scaleHeight} r={43 * scale} color="#1a1a1a" />
              <Circle cx={70 * scaleWidth} cy={552 * scaleHeight} r={40 * scale} color="#2a2a2a" />
              <Circle cx={70 * scaleWidth} cy={552 * scaleHeight} r={38 * scale} color="#27AE6020" />
              {/* Avatar image */}
              {narenPt && (
                <Group clip={rrect(rect(30 * scaleWidth, 512 * scaleHeight, 80 * scaleWidth, 80 * scaleHeight), 40 * scale, 40 * scale)}>
                  <Image image={narenPt} x={30 * scaleWidth} y={512 * scaleHeight} width={80 * scaleWidth} height={80 * scaleHeight} fit="cover" />
                </Group>
              )}
              <Circle cx={102 * scaleWidth} cy={530 * scaleHeight} r={9 * scale} color="#00FF0060" />
              <Circle cx={102 * scaleWidth} cy={530 * scaleHeight} r={7 * scale} color="#0a0a0a" />
              <Circle cx={102 * scaleWidth} cy={530 * scaleHeight} r={5 * scale} color="#00FF00" />
              <Group clip={rrect(rect(130 * scaleWidth, 540 * scaleHeight, 2 * scaleWidth, 30 * scaleHeight), 1 * scale, 1 * scale)}>
                <Circle cx={131 * scaleWidth} cy={555 * scaleHeight} r={20 * scale} color="#27AE6030" />
              </Group>
              <Text x={145 * scaleWidth} y={540 * scaleHeight} text="NAREN V" font={boldPixelFont} color="#FFFFFF" />
              <Text x={145 * scaleWidth} y={560 * scaleHeight} text="Developer" font={mediumFont} color="#27AE60" />
              <Group clip={rrect(rect(145 * scaleWidth, 572 * scaleHeight, 70 * scaleWidth, 28 * scaleHeight), 14 * scale, 14 * scale)}>
                <Circle cx={180 * scaleWidth} cy={586 * scaleHeight} r={45 * scale} color="#27AE6025" />
              </Group>
              <Text x={157 * scaleWidth} y={590 * scaleHeight} text="LOGIC" font={mediumFont} color="#27AE60" />
              <Group clip={rrect(rect(225 * scaleWidth, 572 * scaleHeight, 70 * scaleWidth, 28 * scaleHeight), 14 * scale, 14 * scale)}>
                <Circle cx={260 * scaleWidth} cy={586 * scaleHeight} r={45 * scale} color="#00FF0025" />
              </Group>
              <Text x={235 * scaleWidth} y={590 * scaleHeight} text="ACTIVE" font={mediumFont} color="#00FF00" />
              <Group clip={rrect(rect(305 * scaleWidth, 572 * scaleHeight, 38 * scaleWidth, 22 * scaleHeight), 11 * scale, 11 * scale)}>
                <Circle cx={324 * scaleWidth} cy={583 * scaleHeight} r={25 * scale} color="#27AE6040" />
              </Group>
              <Text x={312 * scaleWidth} y={587 * scaleHeight} text="DEV" font={mediumFont} color="#27AE60" />
            </Group>

            {/* Nevil Card - Purple Premium */}
            <Group>
              <Group clip={rrect(rect(3 * scaleWidth, 623 * scaleHeight, 354 * scaleWidth, 115 * scaleHeight), 28 * scale, 28 * scale)} opacity={0.4}>
                <Circle cx={180 * scaleWidth} cy={680 * scaleHeight} r={130 * scale} color="#9B59B6" />
              </Group>
              <Group clip={rrect(rect(6 * scaleWidth, 625 * scaleHeight, 354 * scaleWidth, 115 * scaleHeight), 28 * scale, 28 * scale)}>
                <Circle cx={183 * scaleWidth} cy={682 * scaleHeight} r={140 * scale} color="rgba(0, 0, 0, 0.35)" />
              </Group>
              <Group clip={rrect(rect(5 * scaleWidth, 620 * scaleHeight, 350 * scaleWidth, 115 * scaleHeight), 28 * scale, 28 * scale)}>
                <Circle cx={180 * scaleWidth} cy={677 * scaleHeight} r={140 * scale} color="#0a0a0a" />
                <Circle cx={100 * scaleWidth} cy={640 * scaleHeight} r={100 * scale} color="#1a1a1a" opacity={0.8} />
                <Circle cx={280 * scaleWidth} cy={700 * scaleHeight} r={90 * scale} color="#1a1a1a" opacity={0.6} />
              </Group>
              <Group clip={rrect(rect(5 * scaleWidth, 620 * scaleHeight, 120 * scaleWidth, 115 * scaleHeight), 28 * scale, 0)} opacity={0.5}>
                <Circle cx={65 * scaleWidth} cy={677 * scaleHeight} r={90 * scale} color="#9B59B650" />
              </Group>
              <Group clip={rrect(rect(240 * scaleWidth, 620 * scaleHeight, 115 * scaleWidth, 115 * scaleHeight), 0, 28 * scale)} opacity={0.15}>
                <Circle cx={298 * scaleWidth} cy={677 * scaleHeight} r={80 * scale} color="#9B59B630" />
              </Group>
              <Group clip={rrect(rect(5 * scaleWidth, 620 * scaleHeight, 350 * scaleWidth, 5 * scaleHeight), 28 * scale, 0)}>
                <Circle cx={180 * scaleWidth} cy={622 * scaleHeight} r={175 * scale} color="#9B59B6" />
                <Circle cx={250 * scaleWidth} cy={622 * scaleHeight} r={100 * scale} color="#8E44AD" opacity={0.6} />
              </Group>
              <Circle cx={70 * scaleWidth} cy={677 * scaleHeight} r={52 * scale} color="#9B59B640" />
              <Circle cx={70 * scaleWidth} cy={677 * scaleHeight} r={50 * scale} color="#9B59B660" />
              <Circle cx={70 * scaleWidth} cy={677 * scaleHeight} r={48 * scale} color="#0a0a0a" />
              <Circle cx={70 * scaleWidth} cy={677 * scaleHeight} r={45 * scale} color="#9B59B6" />
              <Circle cx={70 * scaleWidth} cy={677 * scaleHeight} r={43 * scale} color="#1a1a1a" />
              <Circle cx={70 * scaleWidth} cy={677 * scaleHeight} r={40 * scale} color="#2a2a2a" />
              <Circle cx={70 * scaleWidth} cy={677 * scaleHeight} r={38 * scale} color="#9B59B620" />
              {/* Avatar image */}
              {nevilPt && (
                <Group clip={rrect(rect(30 * scaleWidth, 637 * scaleHeight, 80 * scaleWidth, 80 * scaleHeight), 40 * scale, 40 * scale)}>
                  <Image image={nevilPt} x={30 * scaleWidth} y={637 * scaleHeight} width={80 * scaleWidth} height={80 * scaleHeight} fit="cover" />
                </Group>
              )}
              <Circle cx={102 * scaleWidth} cy={655 * scaleHeight} r={9 * scale} color="#00FF0060" />
              <Circle cx={102 * scaleWidth} cy={655 * scaleHeight} r={7 * scale} color="#0a0a0a" />
              <Circle cx={102 * scaleWidth} cy={655 * scaleHeight} r={5 * scale} color="#00FF00" />
              <Group clip={rrect(rect(130 * scaleWidth, 665 * scaleHeight, 2 * scaleWidth, 30 * scaleHeight), 1 * scale, 1 * scale)}>
                <Circle cx={131 * scaleWidth} cy={680 * scaleHeight} r={20 * scale} color="#9B59B630" />
              </Group>
              <Text x={145 * scaleWidth} y={665 * scaleHeight} text="NEVIL D'SOUZA" font={boldPixelFont} color="#FFFFFF" />
              <Text x={145 * scaleWidth} y={685 * scaleHeight} text="Developer" font={mediumFont} color="#9B59B6" />
              <Group clip={rrect(rect(145 * scaleWidth, 697 * scaleHeight, 70 * scaleWidth, 28 * scaleHeight), 14 * scale, 14 * scale)}>
                <Circle cx={180 * scaleWidth} cy={711 * scaleHeight} r={45 * scale} color="#9B59B625" />
              </Group>
              <Text x={157 * scaleWidth} y={715 * scaleHeight} text="LOGIC" font={mediumFont} color="#9B59B6" />
              <Group clip={rrect(rect(225 * scaleWidth, 697 * scaleHeight, 70 * scaleWidth, 28 * scaleHeight), 14 * scale, 14 * scale)}>
                <Circle cx={260 * scaleWidth} cy={711 * scaleHeight} r={45 * scale} color="#00FF0025" />
              </Group>
              <Text x={235 * scaleWidth} y={715 * scaleHeight} text="ACTIVE" font={mediumFont} color="#00FF00" />
              <Group clip={rrect(rect(305 * scaleWidth, 697 * scaleHeight, 38 * scaleWidth, 22 * scaleHeight), 11 * scale, 11 * scale)}>
                <Circle cx={324 * scaleWidth} cy={708 * scaleHeight} r={25 * scale} color="#9B59B640" />
              </Group>
              <Text x={312 * scaleWidth} y={712 * scaleHeight} text="DEV" font={mediumFont} color="#9B59B6" />
            </Group>
          </Group>

          {/* Back Button - SCALED (left side, above Harsha card) */}
          {backBtn && (
            <Image
              image={backBtn}
              x={-20 * scaleWidth}
              y={35 * scaleHeight}
              width={200 * scaleWidth}
              height={120 * scaleHeight}
              fit="contain"
            />
          )}
        </Canvas>
        </GestureDetector>
      )}
    </GestureHandlerRootView>
  );
};
export default App;
