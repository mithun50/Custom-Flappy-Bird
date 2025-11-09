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

  const pipeOffset = useSharedValue(0);
  const topPipeY = useDerivedValue(() => pipeOffset.value - 320);
  const bottomPipeY = useDerivedValue(() => height - 320 + pipeOffset.value);

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
        pipeOffset.value = Math.random() * 400 - 200;
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

      // Ground collision detection
      if (currentValue > height - 100 || currentValue < 0) {
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
    runOnJS(setScore)(0);
    runOnJS(setGameState)('waiting');
  };

  const gesture = Gesture.Tap().onStart((event) => {
    if (gameState === 'waiting') {
      const tapX = event.x;
      const tapY = event.y;

      // Check if tapping on Customize button (checks both possible positions)
      const btnY1 = height / 2 + 50;  // Position when hasCustomization is true
      const btnY2 = height / 2 + 100; // Position when hasCustomization is false
      const btnHeight = 107;

      if (tapX >= width / 2 - 160 && tapX <= width / 2 + 160 &&
          ((tapY >= btnY1 && tapY <= btnY1 + btnHeight) ||
           (tapY >= btnY2 && tapY <= btnY2 + btnHeight))) {
        runOnJS(setCurrentPage)('customize');
        runOnJS(playJumpSound)();
        return;
      }

      // Check if tapping on Development Team button
      const devBtnY1 = height / 2 + 165;  // Position when hasCustomization is true
      const devBtnY2 = height / 2 + 215;  // Position when hasCustomization is false
      const devBtnHeight = 87;

      if (tapX >= width / 2 - 130 && tapX <= width / 2 + 130 &&
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

    // Theme buttons
    const themeY = 250;
    const themeRadius = 30;

    // Day theme
    if (Math.sqrt((tapX - (width / 2 - 80)) ** 2 + (tapY - themeY) ** 2) <= themeRadius) {
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
    if (Math.sqrt((tapX - (width / 2 + 80)) ** 2 + (tapY - themeY) ** 2) <= themeRadius) {
      runOnJS(setTheme)('city');
      runOnJS(playJumpSound)();
      return;
    }

    // Bird buttons
    const birdY = 410;
    const birdHeight = 52;
    const birdWidth = 70;

    // Yellow bird
    if (tapX >= 40 && tapX <= 40 + birdWidth && tapY >= birdY && tapY <= birdY + birdHeight) {
      runOnJS(setBirdColor)('yellow');
      runOnJS(playJumpSound)();
      return;
    }

    // Blue bird
    if (tapX >= 130 && tapX <= 130 + birdWidth && tapY >= birdY && tapY <= birdY + birdHeight) {
      runOnJS(setBirdColor)('blue');
      runOnJS(playJumpSound)();
      return;
    }

    // Red bird
    if (tapX >= 220 && tapX <= 220 + birdWidth && tapY >= birdY && tapY <= birdY + birdHeight) {
      runOnJS(setBirdColor)('red');
      runOnJS(playJumpSound)();
      return;
    }

    // Manas bird
    if (tapX >= 310 && tapX <= 310 + birdWidth && tapY >= birdY && tapY <= birdY + birdHeight) {
      runOnJS(setBirdColor)('manas');
      runOnJS(playJumpSound)();
      return;
    }

    // Custom bird buttons - aligned with default birds positions
    const customPositions = [75, 165, 255, 345]; // Match Yellow, Blue, Red positions + 1 more
    const customBirdStartY = 536;
    const customBirdRadius = 40;
    const customBirdRowSpacing = 100;
    const birdsPerRow = 4;

    // Check each existing custom bird
    for (let i = 0; i < customImages.length; i++) {
      const col = i % birdsPerRow;
      const row = Math.floor(i / birdsPerRow);
      const birdX = customPositions[col];
      const birdY = customBirdStartY + row * customBirdRowSpacing;

      // Check delete button (top-right corner)
      const deleteX = birdX + 25;
      const deleteY = birdY - 25;
      const deleteRadius = 15;

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

    // Check the "+" add button (always after the last custom bird)
    const nextIndex = customImages.length;
    const nextCol = nextIndex % birdsPerRow;
    const nextRow = Math.floor(nextIndex / birdsPerRow);
    const nextX = customPositions[nextCol];
    const nextY = customBirdStartY + nextRow * customBirdRowSpacing;

    if (Math.sqrt((tapX - nextX) ** 2 + (tapY - nextY) ** 2) <= 35) {
      runOnJS(pickImage)();
      return;
    }

    // Save button
    if (tapX >= width / 2 - 140 && tapX <= width / 2 + 140 && tapY >= height - 220 && tapY <= height - 140) {
      runOnJS(savePreferences)();
      return;
    }

    // Back button
    if (tapX >= width / 2 - 140 && tapX <= width / 2 + 140 && tapY >= height - 120 && tapY <= height - 40) {
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
            height={150}
            y={height - 75}
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

          {/* Tap to Play Message */}
          {gameState === 'waiting' && messageImg && (
            <>
              <Image
                image={messageImg}
                x={width / 2 - 92}
                y={height / 2 - 150}
                width={184}
                height={267}
              />

              {/* Customize Button - moves based on whether customization is saved */}
              {customizeBtn && (
                <Image
                  image={customizeBtn}
                  x={width / 2 - 145}
                  y={hasCustomization ? height / 2 + 50 : height / 2 + 100}
                  width={320}
                  height={107}
                  fit="contain"
                />
              )}

              {/* Development Team Button */}
              {devTeamBtn && (
                <Image
                  image={devTeamBtn}
                  x={width / 2 - 130}
                  y={hasCustomization ? height / 2 + 165 : height / 2 + 215}
                  width={260}
                  height={87}
                  fit="contain"
                />
              )}
            </>
          )}

          {/* Game Over Screen */}
          {gameState === 'gameOver' && (
            <>
              {/* Game Over Image */}
              {gameOverImg && (
                <Image
                  image={gameOverImg}
                  x={width / 2 - 96}
                  y={150}
                  width={192}
                  height={42}
                />
              )}

              {/* Final Score with shadow effect - more right */}
              <Text
                x={122}
                y={250}
                text={`Score: ${score}`}
                font={font}
                color="#000000"
              />
              <Text
                x={120}
                y={248}
                text={`Score: ${score}`}
                font={font}
                color="#FFD700"
              />

              {/* Restart Game Button */}
              {restartGameBtn && (
                <Image
                  image={restartGameBtn}
                  x={width / 2 - 140}
                  y={300}
                  width={280}
                  height={80}
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

          {/* Page Title */}
          <Group>
            {customizePt && (
              <Image
                image={customizePt}
                x={width / 2 - 280}
                y={10}
                width={560}
                height={160}
                fit="contain"
              />
            )}
          </Group>

          {/* Theme Section */}
          <Group>
            {selectThemePt && (
              <Image
                image={selectThemePt}
                x={-10}
                y={160}
                width={280}
                height={70}
                fit="contain"
              />
            )}

            {/* Day Theme */}
            <Group>
              <Circle
                cx={width / 2 - 80}
                cy={250}
                r={30}
                color="#87CEEB"
                opacity={theme === 'day' ? 1 : 0.4}
              />
              {bgDay && (
                <Group clip={rrect(rect(width / 2 - 110, 220, 60, 60), 30, 30)}>
                  <Image
                    image={bgDay}
                    x={width / 2 - 110}
                    y={220}
                    width={60}
                    height={60}
                    fit="cover"
                    opacity={theme === 'day' ? 1 : 0.4}
                  />
                </Group>
              )}
              {theme === 'day' && (
                <Circle
                  cx={width / 2 - 80}
                  cy={250}
                  r={33}
                  style="stroke"
                  strokeWidth={3}
                  color="#FFD700"
                />
              )}
              <Text
                x={width / 2 - 95}
                y={290}
                text="Day"
                font={smallFont}
                color="#FFFFFF"
              />
            </Group>

            {/* Night Theme */}
            <Group>
              <Circle
                cx={width / 2}
                cy={250}
                r={30}
                color="#1a1a2e"
                opacity={theme === 'night' ? 1 : 0.4}
              />
              {bgNight && (
                <Group clip={rrect(rect(width / 2 - 30, 220, 60, 60), 30, 30)}>
                  <Image
                    image={bgNight}
                    x={width / 2 - 30}
                    y={220}
                    width={60}
                    height={60}
                    fit="cover"
                    opacity={theme === 'night' ? 1 : 0.4}
                  />
                </Group>
              )}
              {theme === 'night' && (
                <Circle
                  cx={width / 2}
                  cy={250}
                  r={33}
                  style="stroke"
                  strokeWidth={3}
                  color="#FFD700"
                />
              )}
              <Text
                x={width / 2 - 20}
                y={290}
                text="Night"
                font={smallFont}
                color="#FFFFFF"
              />
            </Group>

            {/* City Theme */}
            <Group>
              <Circle
                cx={width / 2 + 80}
                cy={250}
                r={30}
                color="#FF6B6B"
                opacity={theme === 'city' ? 1 : 0.4}
              />
              {bgCity && (
                <Group clip={rrect(rect(width / 2 + 50, 220, 60, 60), 30, 30)}>
                  <Image
                    image={bgCity}
                    x={width / 2 + 50}
                    y={220}
                    width={60}
                    height={60}
                    fit="cover"
                    opacity={theme === 'city' ? 1 : 0.4}
                  />
                </Group>
              )}
              {theme === 'city' && (
                <Circle
                  cx={width / 2 + 80}
                  cy={250}
                  r={33}
                  style="stroke"
                  strokeWidth={3}
                  color="#FFD700"
                />
              )}
              <Text
                x={width / 2 + 65}
                y={290}
                text="City"
                font={smallFont}
                color="#FFFFFF"
              />
            </Group>
          </Group>

          {/* Bird Section */}
          <Group>
            {selectCharectorPt && (
              <Image
                image={selectCharectorPt}
                x={-10}
                y={340}
                width={280}
                height={70}
                fit="contain"
              />
            )}

            {/* Yellow Bird */}
            <Group>
              {yellowBird && (
                <>
                  {birdColor === 'yellow' && (
                    <Group opacity={0.3}>
                      <Image
                        image={yellowBird}
                        x={40}
                        y={410}
                        width={70}
                        height={52}
                      />
                    </Group>
                  )}
                  <Image
                    image={yellowBird}
                    x={40}
                    y={410}
                    width={70}
                    height={52}
                    opacity={birdColor === 'yellow' ? 1 : 0.6}
                  />
                  {birdColor === 'yellow' && (
                    <Circle
                      cx={75}
                      cy={436}
                      r={40}
                      style="stroke"
                      strokeWidth={3}
                      color="#FFD700"
                    />
                  )}
                </>
              )}
            </Group>

            {/* Blue Bird */}
            <Group>
              {blueBird && (
                <>
                  {birdColor === 'blue' && (
                    <Group opacity={0.3}>
                      <Image
                        image={blueBird}
                        x={130}
                        y={410}
                        width={70}
                        height={52}
                      />
                    </Group>
                  )}
                  <Image
                    image={blueBird}
                    x={130}
                    y={410}
                    width={70}
                    height={52}
                    opacity={birdColor === 'blue' ? 1 : 0.6}
                  />
                  {birdColor === 'blue' && (
                    <Circle
                      cx={165}
                      cy={436}
                      r={40}
                      style="stroke"
                      strokeWidth={3}
                      color="#FFD700"
                    />
                  )}
                </>
              )}
            </Group>

            {/* Red Bird */}
            <Group>
              {redBird && (
                <>
                  {birdColor === 'red' && (
                    <Group opacity={0.3}>
                      <Image
                        image={redBird}
                        x={220}
                        y={410}
                        width={70}
                        height={52}
                      />
                    </Group>
                  )}
                  <Image
                    image={redBird}
                    x={220}
                    y={410}
                    width={70}
                    height={52}
                    opacity={birdColor === 'red' ? 1 : 0.6}
                  />
                  {birdColor === 'red' && (
                    <Circle
                      cx={255}
                      cy={436}
                      r={40}
                      style="stroke"
                      strokeWidth={3}
                      color="#FFD700"
                    />
                  )}
                </>
              )}
            </Group>

            {/* Manas Bird */}
            <Group>
              {manasBird && (
                <>
                  {birdColor === 'manas' && (
                    <Group opacity={0.3}>
                      <Group clip={rrect(rect(310, 401, 70, 70), 35, 35)}>
                        <Image
                          image={manasBird}
                          x={310}
                          y={401}
                          width={70}
                          height={70}
                          fit="cover"
                        />
                      </Group>
                    </Group>
                  )}
                  <Group clip={rrect(rect(310, 401, 70, 70), 35, 35)}>
                    <Image
                      image={manasBird}
                      x={310}
                      y={401}
                      width={70}
                      height={70}
                      fit="cover"
                      opacity={birdColor === 'manas' ? 1 : 0.6}
                    />
                  </Group>
                  {birdColor === 'manas' && (
                    <Circle
                      cx={345}
                      cy={436}
                      r={40}
                      style="stroke"
                      strokeWidth={3}
                      color="#FFD700"
                    />
                  )}
                </>
              )}
            </Group>

            {/* Dynamic Custom Birds - below default birds, aligned with their positions */}
            {customBirdImages.map((customBirdImg, index) => {
              // Position to match default birds: Yellow(75), Blue(165), Red(255), Custom starts at same X
              const positions = [75, 165, 255, 345]; // 4 positions matching default bird spacing
              const col = index % 4;
              const row = Math.floor(index / 4);
              const x = positions[col];
              const y = 536 + row * 100;
              const isSelected = birdColor === `custom${index}`;

              return (
                <Group key={index}>
                  {isSelected && (
                    <Circle
                      cx={x}
                      cy={y}
                      r={35}
                      color="rgba(255, 255, 255, 0.3)"
                    />
                  )}
                  <Group clip={rrect(rect(x - 35, y - 35, 70, 70), 35, 35)}>
                    <Image
                      image={customBirdImg}
                      x={x - 35}
                      y={y - 35}
                      width={70}
                      height={70}
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
                      r={37}
                      style="stroke"
                      strokeWidth={3}
                      color="#FFD700"
                    />
                  )}

                  {/* Delete button - top right corner */}
                  {deleteIcon && (
                    <Image
                      image={deleteIcon}
                      x={x + 10}
                      y={y - 40}
                      width={30}
                      height={30}
                      fit="contain"
                    />
                  )}
                </Group>
              );
            })}

            {/* Add new custom bird button */}
            <Group>
              {(() => {
                const positions = [75, 165, 255, 345];
                const nextIndex = customImages.length;
                const col = nextIndex % 4;
                const row = Math.floor(nextIndex / 4);
                const x = positions[col];
                const y = 536 + row * 100;

                return (
                  <>
                    <Circle
                      cx={x}
                      cy={y}
                      r={35}
                      color="rgba(255, 255, 255, 0.1)"
                    />
                    <Circle
                      cx={x}
                      cy={y}
                      r={35}
                      style="stroke"
                      strokeWidth={2}
                      color="rgba(255, 255, 255, 0.5)"
                    />
                    {addIcon && (
                      <Image
                        image={addIcon}
                        x={x - 30}
                        y={y - 30}
                        width={60}
                        height={60}
                        fit="contain"
                      />
                    )}
                  </>
                );
              })()}
            </Group>
          </Group>

          {/* Save Button */}
          {saveBtn && (
            <Image
              image={saveBtn}
              x={width / 2 - 140}
              y={height - 220}
              width={280}
              height={80}
              fit="contain"
            />
          )}

          {/* Back Button */}
          {backBtn && (
            <Image
              image={backBtn}
              x={width / 2 - 140}
              y={height - 120}
              width={280}
              height={80}
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

          // Harsha card (Gold)
          if (tapX >= 5 && tapX <= 355 && tapY >= 120 && tapY <= 235) {
            runOnJS(openInstagram)('harsha1218_');
            runOnJS(playJumpSound)();
            return;
          }

          // Manas card (Blue)
          if (tapX >= 5 && tapX <= 355 && tapY >= 245 && tapY <= 360) {
            runOnJS(openInstagram)('manas.habbu13');
            runOnJS(playJumpSound)();
            return;
          }

          // Mithun card (Red)
          if (tapX >= 5 && tapX <= 355 && tapY >= 370 && tapY <= 485) {
            runOnJS(openInstagram)('mithun.gowda.b');
            runOnJS(playJumpSound)();
            return;
          }

          // Naren card (Green)
          if (tapX >= 5 && tapX <= 355 && tapY >= 495 && tapY <= 610) {
            runOnJS(openInstagram)('naren_vk_29');
            runOnJS(playJumpSound)();
            return;
          }

          // Nevil card (Purple)
          if (tapX >= 5 && tapX <= 355 && tapY >= 620 && tapY <= 735) {
            runOnJS(openInstagram)('_nevil_06');
            runOnJS(playJumpSound)();
            return;
          }

          // Back button
          if (tapX >= width / 2 - 140 && tapX <= width / 2 + 140 && tapY >= height - 120 && tapY <= height - 40) {
            runOnJS(setCurrentPage)('game');
            runOnJS(playJumpSound)();
            return;
          }
        })}>
          <Canvas style={{ width, height }}>
          {/* Development Team Page Background */}
          <Image image={bg} width={width} height={height} fit={'cover'} />

          {/* Page Title */}
          {devTeamPt && (
            <Image
              image={devTeamPt}
              x={width / 2 - 250}
              y={10}
              width={500}
              height={100}
              fit="contain"
            />
          )}

          {/* Developer Cards - Premium Full-Width Design */}
          <Group>
            {/* Harsha Card - Red Premium */}
            <Group>
              {/* Outer glow mega effect */}
              <Group clip={rrect(rect(3, 123, 354, 115), 28, 28)} opacity={0.4}>
                <Circle cx={180} cy={180} r={130} color="#E74C3C" />
              </Group>
              {/* Card deep shadow */}
              <Group clip={rrect(rect(6, 125, 354, 115), 28, 28)}>
                <Circle cx={183} cy={182} r={140} color="rgba(0, 0, 0, 0.35)" />
              </Group>
              {/* Card base - gradient dark */}
              <Group clip={rrect(rect(5, 120, 350, 115), 28, 28)}>
                <Circle cx={180} cy={177} r={140} color="#0a0a0a" />
                <Circle cx={100} cy={140} r={100} color="#1a1a1a" opacity={0.8} />
                <Circle cx={280} cy={200} r={90} color="#1a1a1a" opacity={0.6} />
              </Group>
              {/* Left gradient overlay */}
              <Group clip={rrect(rect(5, 120, 120, 115), 28, 0)} opacity={0.5}>
                <Circle cx={65} cy={177} r={90} color="#E74C3C50" />
              </Group>
              {/* Right subtle gradient */}
              <Group clip={rrect(rect(240, 120, 115, 115), 0, 28)} opacity={0.15}>
                <Circle cx={298} cy={177} r={80} color="#E74C3C30" />
              </Group>
              {/* Top premium accent bar */}
              <Group clip={rrect(rect(5, 120, 350, 5), 28, 0)}>
                <Circle cx={180} cy={122} r={175} color="#E74C3C" />
                <Circle cx={250} cy={122} r={100} color="#C0392B" opacity={0.6} />
              </Group>
              {/* Avatar section - large premium */}
              {/* Outer glow rings */}
              <Circle cx={70} cy={177} r={52} color="#E74C3C40" />
              <Circle cx={70} cy={177} r={50} color="#E74C3C60" />
              {/* Avatar base rings */}
              <Circle cx={70} cy={177} r={48} color="#0a0a0a" />
              <Circle cx={70} cy={177} r={45} color="#E74C3C" />
              <Circle cx={70} cy={177} r={43} color="#1a1a1a" />
              <Circle cx={70} cy={177} r={40} color="#2a2a2a" />
              {/* Inner gradient for depth */}
              <Circle cx={70} cy={177} r={38} color="#E74C3C20" />
              {/* Avatar image */}
              {harshaPt && (
                <Group clip={rrect(rect(30, 137, 80, 80), 40, 40)}>
                  <Image image={harshaPt} x={30} y={137} width={80} height={80} fit="cover" />
                </Group>
              )}
              {/* Status dot with glow */}
              <Circle cx={102} cy={155} r={9} color="#00FF0060" />
              <Circle cx={102} cy={155} r={7} color="#0a0a0a" />
              <Circle cx={102} cy={155} r={5} color="#00FF00" />
              {/* Decorative line separator */}
              <Group clip={rrect(rect(130, 165, 2, 30), 1, 1)}>
                <Circle cx={131} cy={180} r={20} color="#E74C3C30" />
              </Group>
              {/* Name and role section */}
              <Text x={145} y={165} text="HARSHA N" font={boldPixelFont} color="#FFFFFF" />
              <Text x={145} y={185} text="Developer" font={mediumFont} color="#E74C3C" />
              {/* Stats badges - premium style */}
              <Group clip={rrect(rect(145, 197, 70, 28), 14, 14)}>
                <Circle cx={180} cy={211} r={45} color="#E74C3C25" />
              </Group>
              <Text x={153} y={215} text="DESIGN" font={mediumFont} color="#E74C3C" />
              <Group clip={rrect(rect(225, 197, 70, 28), 14, 14)}>
                <Circle cx={260} cy={211} r={45} color="#00FF0025" />
              </Group>
              <Text x={235} y={215} text="ACTIVE" font={mediumFont} color="#00FF00" />
              {/* Right corner badge */}
              <Group clip={rrect(rect(305, 197, 38, 22), 11, 11)}>
                <Circle cx={324} cy={208} r={25} color="#E74C3C40" />
              </Group>
              <Text x={312} y={212} text="DEV" font={mediumFont} color="#E74C3C" />
            </Group>

            {/* Manas Card - Blue Premium */}
            <Group>
              <Group clip={rrect(rect(3, 248, 354, 115), 28, 28)} opacity={0.4}>
                <Circle cx={180} cy={305} r={130} color="#4A90E2" />
              </Group>
              <Group clip={rrect(rect(6, 250, 354, 115), 28, 28)}>
                <Circle cx={183} cy={307} r={140} color="rgba(0, 0, 0, 0.35)" />
              </Group>
              <Group clip={rrect(rect(5, 245, 350, 115), 28, 28)}>
                <Circle cx={180} cy={302} r={140} color="#0a0a0a" />
                <Circle cx={100} cy={265} r={100} color="#1a1a1a" opacity={0.8} />
                <Circle cx={280} cy={325} r={90} color="#1a1a1a" opacity={0.6} />
              </Group>
              <Group clip={rrect(rect(5, 245, 120, 115), 28, 0)} opacity={0.5}>
                <Circle cx={65} cy={302} r={90} color="#4A90E250" />
              </Group>
              <Group clip={rrect(rect(240, 245, 115, 115), 0, 28)} opacity={0.15}>
                <Circle cx={298} cy={302} r={80} color="#4A90E230" />
              </Group>
              <Group clip={rrect(rect(5, 245, 350, 5), 28, 0)}>
                <Circle cx={180} cy={247} r={175} color="#4A90E2" />
                <Circle cx={250} cy={247} r={100} color="#357ABD" opacity={0.6} />
              </Group>
              <Circle cx={70} cy={302} r={52} color="#4A90E240" />
              <Circle cx={70} cy={302} r={50} color="#4A90E260" />
              <Circle cx={70} cy={302} r={48} color="#0a0a0a" />
              <Circle cx={70} cy={302} r={45} color="#4A90E2" />
              <Circle cx={70} cy={302} r={43} color="#1a1a1a" />
              <Circle cx={70} cy={302} r={40} color="#2a2a2a" />
              <Circle cx={70} cy={302} r={38} color="#4A90E220" />
              {/* Avatar image */}
              {manasPt && (
                <Group clip={rrect(rect(30, 262, 80, 80), 40, 40)}>
                  <Image image={manasPt} x={30} y={262} width={80} height={80} fit="cover" />
                </Group>
              )}
              <Circle cx={102} cy={280} r={9} color="#00FF0060" />
              <Circle cx={102} cy={280} r={7} color="#0a0a0a" />
              <Circle cx={102} cy={280} r={5} color="#00FF00" />
              <Group clip={rrect(rect(130, 290, 2, 30), 1, 1)}>
                <Circle cx={131} cy={305} r={20} color="#4A90E230" />
              </Group>
              <Text x={145} y={290} text="MANAS HABBU" font={boldPixelFont} color="#FFFFFF" />
              <Text x={145} y={310} text="Developer" font={mediumFont} color="#4A90E2" />
              <Group clip={rrect(rect(145, 322, 70, 28), 14, 14)}>
                <Circle cx={180} cy={336} r={45} color="#4A90E225" />
              </Group>
              <Text x={153} y={340} text="DESIGN" font={mediumFont} color="#4A90E2" />
              <Group clip={rrect(rect(225, 322, 70, 28), 14, 14)}>
                <Circle cx={260} cy={336} r={45} color="#00FF0025" />
              </Group>
              <Text x={235} y={340} text="ACTIVE" font={mediumFont} color="#00FF00" />
              <Group clip={rrect(rect(305, 322, 38, 22), 11, 11)}>
                <Circle cx={324} cy={333} r={25} color="#4A90E240" />
              </Group>
              <Text x={312} y={337} text="DEV" font={mediumFont} color="#4A90E2" />
            </Group>

            {/* Mithun Card - Gold Premium */}
            <Group>
              <Group clip={rrect(rect(3, 373, 354, 115), 28, 28)} opacity={0.4}>
                <Circle cx={180} cy={430} r={130} color="#FFD700" />
              </Group>
              <Group clip={rrect(rect(6, 375, 354, 115), 28, 28)}>
                <Circle cx={183} cy={432} r={140} color="rgba(0, 0, 0, 0.35)" />
              </Group>
              <Group clip={rrect(rect(5, 370, 350, 115), 28, 28)}>
                <Circle cx={180} cy={427} r={140} color="#0a0a0a" />
                <Circle cx={100} cy={390} r={100} color="#1a1a1a" opacity={0.8} />
                <Circle cx={280} cy={450} r={90} color="#1a1a1a" opacity={0.6} />
              </Group>
              <Group clip={rrect(rect(5, 370, 120, 115), 28, 0)} opacity={0.5}>
                <Circle cx={65} cy={427} r={90} color="#FFD70050" />
              </Group>
              <Group clip={rrect(rect(240, 370, 115, 115), 0, 28)} opacity={0.15}>
                <Circle cx={298} cy={427} r={80} color="#FFD70030" />
              </Group>
              <Group clip={rrect(rect(5, 370, 350, 5), 28, 0)}>
                <Circle cx={180} cy={372} r={175} color="#FFD700" />
                <Circle cx={250} cy={372} r={100} color="#FFA500" opacity={0.6} />
              </Group>
              <Circle cx={70} cy={427} r={52} color="#FFD70040" />
              <Circle cx={70} cy={427} r={50} color="#FFD70060" />
              <Circle cx={70} cy={427} r={48} color="#0a0a0a" />
              <Circle cx={70} cy={427} r={45} color="#FFD700" />
              <Circle cx={70} cy={427} r={43} color="#1a1a1a" />
              <Circle cx={70} cy={427} r={40} color="#2a2a2a" />
              <Circle cx={70} cy={427} r={38} color="#FFD70020" />
              {/* Avatar image */}
              {mithunPt && (
                <Group clip={rrect(rect(30, 387, 80, 80), 40, 40)}>
                  <Image image={mithunPt} x={30} y={387} width={80} height={80} fit="cover" />
                </Group>
              )}
              <Circle cx={102} cy={405} r={9} color="#00FF0060" />
              <Circle cx={102} cy={405} r={7} color="#0a0a0a" />
              <Circle cx={102} cy={405} r={5} color="#00FF00" />
              <Group clip={rrect(rect(130, 415, 2, 30), 1, 1)}>
                <Circle cx={131} cy={430} r={20} color="#FFD70030" />
              </Group>
              <Text x={145} y={415} text="MITHUN GOWDA B" font={boldPixelFont} color="#FFFFFF" />
              <Text x={145} y={435} text="Team Lead" font={mediumFont} color="#FFD700" />
              <Group clip={rrect(rect(145, 447, 70, 28), 14, 14)}>
                <Circle cx={180} cy={461} r={45} color="#FFD70025" />
              </Group>
              <Text x={157} y={465} text="LOGIC" font={mediumFont} color="#FFD700" />
              <Group clip={rrect(rect(225, 447, 70, 28), 14, 14)}>
                <Circle cx={260} cy={461} r={45} color="#00FF0025" />
              </Group>
              <Text x={235} y={465} text="ACTIVE" font={mediumFont} color="#00FF00" />
              <Group clip={rrect(rect(305, 447, 38, 22), 11, 11)}>
                <Circle cx={324} cy={458} r={25} color="#FFD70040" />
              </Group>
              <Text x={312} y={462} text="PRO" font={mediumFont} color="#FFD700" />
            </Group>

            {/* Naren Card - Green Premium */}
            <Group>
              <Group clip={rrect(rect(3, 498, 354, 115), 28, 28)} opacity={0.4}>
                <Circle cx={180} cy={555} r={130} color="#27AE60" />
              </Group>
              <Group clip={rrect(rect(6, 500, 354, 115), 28, 28)}>
                <Circle cx={183} cy={557} r={140} color="rgba(0, 0, 0, 0.35)" />
              </Group>
              <Group clip={rrect(rect(5, 495, 350, 115), 28, 28)}>
                <Circle cx={180} cy={552} r={140} color="#0a0a0a" />
                <Circle cx={100} cy={515} r={100} color="#1a1a1a" opacity={0.8} />
                <Circle cx={280} cy={575} r={90} color="#1a1a1a" opacity={0.6} />
              </Group>
              <Group clip={rrect(rect(5, 495, 120, 115), 28, 0)} opacity={0.5}>
                <Circle cx={65} cy={552} r={90} color="#27AE6050" />
              </Group>
              <Group clip={rrect(rect(240, 495, 115, 115), 0, 28)} opacity={0.15}>
                <Circle cx={298} cy={552} r={80} color="#27AE6030" />
              </Group>
              <Group clip={rrect(rect(5, 495, 350, 5), 28, 0)}>
                <Circle cx={180} cy={497} r={175} color="#27AE60" />
                <Circle cx={250} cy={497} r={100} color="#229954" opacity={0.6} />
              </Group>
              <Circle cx={70} cy={552} r={52} color="#27AE6040" />
              <Circle cx={70} cy={552} r={50} color="#27AE6060" />
              <Circle cx={70} cy={552} r={48} color="#0a0a0a" />
              <Circle cx={70} cy={552} r={45} color="#27AE60" />
              <Circle cx={70} cy={552} r={43} color="#1a1a1a" />
              <Circle cx={70} cy={552} r={40} color="#2a2a2a" />
              <Circle cx={70} cy={552} r={38} color="#27AE6020" />
              {/* Avatar image */}
              {narenPt && (
                <Group clip={rrect(rect(30, 512, 80, 80), 40, 40)}>
                  <Image image={narenPt} x={30} y={512} width={80} height={80} fit="cover" />
                </Group>
              )}
              <Circle cx={102} cy={530} r={9} color="#00FF0060" />
              <Circle cx={102} cy={530} r={7} color="#0a0a0a" />
              <Circle cx={102} cy={530} r={5} color="#00FF00" />
              <Group clip={rrect(rect(130, 540, 2, 30), 1, 1)}>
                <Circle cx={131} cy={555} r={20} color="#27AE6030" />
              </Group>
              <Text x={145} y={540} text="NAREN V" font={boldPixelFont} color="#FFFFFF" />
              <Text x={145} y={560} text="Developer" font={mediumFont} color="#27AE60" />
              <Group clip={rrect(rect(145, 572, 70, 28), 14, 14)}>
                <Circle cx={180} cy={586} r={45} color="#27AE6025" />
              </Group>
              <Text x={157} y={590} text="LOGIC" font={mediumFont} color="#27AE60" />
              <Group clip={rrect(rect(225, 572, 70, 28), 14, 14)}>
                <Circle cx={260} cy={586} r={45} color="#00FF0025" />
              </Group>
              <Text x={235} y={590} text="ACTIVE" font={mediumFont} color="#00FF00" />
              <Group clip={rrect(rect(305, 572, 38, 22), 11, 11)}>
                <Circle cx={324} cy={583} r={25} color="#27AE6040" />
              </Group>
              <Text x={312} y={587} text="DEV" font={mediumFont} color="#27AE60" />
            </Group>

            {/* Nevil Card - Purple Premium */}
            <Group>
              <Group clip={rrect(rect(3, 623, 354, 115), 28, 28)} opacity={0.4}>
                <Circle cx={180} cy={680} r={130} color="#9B59B6" />
              </Group>
              <Group clip={rrect(rect(6, 625, 354, 115), 28, 28)}>
                <Circle cx={183} cy={682} r={140} color="rgba(0, 0, 0, 0.35)" />
              </Group>
              <Group clip={rrect(rect(5, 620, 350, 115), 28, 28)}>
                <Circle cx={180} cy={677} r={140} color="#0a0a0a" />
                <Circle cx={100} cy={640} r={100} color="#1a1a1a" opacity={0.8} />
                <Circle cx={280} cy={700} r={90} color="#1a1a1a" opacity={0.6} />
              </Group>
              <Group clip={rrect(rect(5, 620, 120, 115), 28, 0)} opacity={0.5}>
                <Circle cx={65} cy={677} r={90} color="#9B59B650" />
              </Group>
              <Group clip={rrect(rect(240, 620, 115, 115), 0, 28)} opacity={0.15}>
                <Circle cx={298} cy={677} r={80} color="#9B59B630" />
              </Group>
              <Group clip={rrect(rect(5, 620, 350, 5), 28, 0)}>
                <Circle cx={180} cy={622} r={175} color="#9B59B6" />
                <Circle cx={250} cy={622} r={100} color="#8E44AD" opacity={0.6} />
              </Group>
              <Circle cx={70} cy={677} r={52} color="#9B59B640" />
              <Circle cx={70} cy={677} r={50} color="#9B59B660" />
              <Circle cx={70} cy={677} r={48} color="#0a0a0a" />
              <Circle cx={70} cy={677} r={45} color="#9B59B6" />
              <Circle cx={70} cy={677} r={43} color="#1a1a1a" />
              <Circle cx={70} cy={677} r={40} color="#2a2a2a" />
              <Circle cx={70} cy={677} r={38} color="#9B59B620" />
              {/* Avatar image */}
              {nevilPt && (
                <Group clip={rrect(rect(30, 637, 80, 80), 40, 40)}>
                  <Image image={nevilPt} x={30} y={637} width={80} height={80} fit="cover" />
                </Group>
              )}
              <Circle cx={102} cy={655} r={9} color="#00FF0060" />
              <Circle cx={102} cy={655} r={7} color="#0a0a0a" />
              <Circle cx={102} cy={655} r={5} color="#00FF00" />
              <Group clip={rrect(rect(130, 665, 2, 30), 1, 1)}>
                <Circle cx={131} cy={680} r={20} color="#9B59B630" />
              </Group>
              <Text x={145} y={665} text="NEVIL D'SOUZA" font={boldPixelFont} color="#FFFFFF" />
              <Text x={145} y={685} text="Developer" font={mediumFont} color="#9B59B6" />
              <Group clip={rrect(rect(145, 697, 70, 28), 14, 14)}>
                <Circle cx={180} cy={711} r={45} color="#9B59B625" />
              </Group>
              <Text x={157} y={715} text="LOGIC" font={mediumFont} color="#9B59B6" />
              <Group clip={rrect(rect(225, 697, 70, 28), 14, 14)}>
                <Circle cx={260} cy={711} r={45} color="#00FF0025" />
              </Group>
              <Text x={235} y={715} text="ACTIVE" font={mediumFont} color="#00FF00" />
              <Group clip={rrect(rect(305, 697, 38, 22), 11, 11)}>
                <Circle cx={324} cy={708} r={25} color="#9B59B640" />
              </Group>
              <Text x={312} y={712} text="DEV" font={mediumFont} color="#9B59B6" />
            </Group>
          </Group>

          {/* Back Button */}
          {backBtn && (
            <Image
              image={backBtn}
              x={width / 2 - 140}
              y={height - 120}
              width={280}
              height={80}
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
