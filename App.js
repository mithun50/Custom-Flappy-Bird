import { Platform, useWindowDimensions } from 'react-native';
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
import AsyncStorage from '@react-native-async-storage/async-storage';

const GRAVITY = 1000;
const JUMP_FORCE = -500;

const pipeWidth = 104;
const pipeHeight = 640;

const App = () => {
  const { width, height } = useWindowDimensions();
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('waiting'); // 'waiting', 'playing', 'gameOver'
  const [birdColor, setBirdColor] = useState('yellow'); // 'yellow', 'blue', 'red', 'custom'
  const [customImageUri, setCustomImageUri] = useState(null);
  const [theme, setTheme] = useState('day'); // 'day', 'night', 'city'
  const [currentPage, setCurrentPage] = useState('game'); // 'game', 'customize'

  const bgDay = useImage(require('./assets/sprites/background-day.png'));
  const bgNight = useImage(require('./assets/sprites/background-night.png'));
  const bgCity = useImage(require('./assets/sprites/nightcity.jpg'));

  // Get current background based on theme
  const bg = theme === 'night' ? bgNight : theme === 'city' ? bgCity : bgDay;
  const yellowBird = useImage(require('./assets/sprites/yellowbird-upflap.png'));
  const blueBird = useImage(require('./assets/sprites/bluebird-upflap.png'));
  const redBird = useImage(require('./assets/sprites/redbird-upflap.png'));
  const pipeBottom = useImage(require('./assets/sprites/pipe-green.png'));
  const pipeTop = useImage(require('./assets/sprites/pipe-green-top.png'));
  const base = useImage(require('./assets/sprites/base.png'));
  const messageImg = useImage(require('./assets/sprites/message.png'));
  const gameOverImg = useImage(require('./assets/sprites/gameover.png'));
  const customBird = useImage(customImageUri);
  const customizeBtn = useImage(require('./assets/sprites/customize_button.png'));
  const saveBtn = useImage(require('./assets/sprites/save_button.png'));
  const backBtn = useImage(require('./assets/sprites/back_button.png'));

  // Get current bird based on selection
  const bird = birdColor === 'custom' ? customBird :
               birdColor === 'blue' ? blueBird :
               birdColor === 'red' ? redBird : yellowBird;

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
        const savedCustomImageUri = await AsyncStorage.getItem('customImageUri');

        if (savedTheme) setTheme(savedTheme);
        if (savedBirdColor) setBirdColor(savedBirdColor);
        if (savedCustomImageUri) setCustomImageUri(savedCustomImageUri);
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
      if (customImageUri) {
        await AsyncStorage.setItem('customImageUri', customImageUri);
      }
      playJumpSound();
      setCurrentPage('game'); // Return to game after saving
    } catch (error) {
      console.log('Error saving preferences:', error);
    }
  };

  // Pick custom image
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        // Use the image directly without processing
        setCustomImageUri(result.assets[0].uri);
        setBirdColor('custom');
        playJumpSound();
      }
    } catch (error) {
      console.log('Error picking image:', error);
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

      // Check if tapping on Customize button
      if (tapX >= width / 2 - 120 && tapX <= width / 2 + 120 && tapY >= height / 2 + 150 && tapY <= height / 2 + 230) {
        runOnJS(setCurrentPage)('customize');
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

    // Custom bird button
    if (Math.sqrt((tapX - 330) ** 2 + (tapY - 436) ** 2) <= 35) {
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
          <Group transform={birdTransform} origin={birdOrigin}>
            {birdColor === 'custom' && customBird ? (
              <Group clip={birdClipPath}>
                {/* Circular clipped custom bird with pixel art style and background removal */}
                <Image
                  image={customBird}
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

              {/* Customize Button */}
              {customizeBtn && (
                <Image
                  image={customizeBtn}
                  x={width / 2 - 120}
                  y={height / 2 + 150}
                  width={240}
                  height={80}
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

              {/* Restart instruction - Compact Card */}
              <Group>
                {/* Background box with rounded corners - centered */}
                <Group clip={rrect(rect(width / 2 - 90, 315, 180, 40), 8, 8)}>
                  <Group>
                    <Circle cx={width / 2} cy={335} r={100} color="#2C5F2D" />
                  </Group>
                </Group>

                {/* Border outline */}
                <Group>
                  <Group clip={rrect(rect(width / 2 - 91, 314, 182, 42), 8, 8)}>
                    <Circle cx={width / 2} cy={335} r={102} color="rgba(0,0,0,0)" style="stroke" strokeWidth={2} />
                  </Group>
                  <Group clip={rrect(rect(width / 2 - 90, 315, 180, 40), 8, 8)} style="stroke">
                    <Circle cx={width / 2} cy={335} r={100} color="#FFD700" style="stroke" strokeWidth={2} />
                  </Group>
                </Group>

                {/* Text - centered */}
                <Text
                  x={width / 2 - 75}
                  y={342}
                  text="Tap to Restart"
                  font={mediumFont}
                  color="#FFFFFF"
                />
              </Group>
            </>
          )}
        </Canvas>
      </GestureDetector>
      ) : (
        <GestureDetector gesture={customizeGesture}>
          <Canvas style={{ width, height }}>
          {/* Customization Page Background */}
          <Image image={bg} width={width} height={height} fit={'cover'} />

          {/* Page Title */}
          <Group>
            <Text
              x={width / 2 - 100}
              y={80}
              text="Customize"
              font={font}
              color="#000000"
            />
            <Text
              x={width / 2 - 102}
              y={78}
              text="Customize"
              font={font}
              color="#FFD700"
            />
          </Group>

          {/* Theme Section */}
          <Group>
            <Text
              x={50}
              y={180}
              text="Select Theme:"
              font={mediumFont}
              color="#FFFFFF"
            />

            {/* Day Theme */}
            <Group>
              <Circle
                cx={width / 2 - 80}
                cy={250}
                r={30}
                color={theme === 'day' ? '#87CEEB' : 'rgba(135, 206, 235, 0.4)'}
              />
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
                color={theme === 'night' ? '#1a1a2e' : 'rgba(26, 26, 46, 0.4)'}
              />
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
                color={theme === 'city' ? '#FF6B6B' : 'rgba(255, 107, 107, 0.4)'}
              />
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
            <Text
              x={50}
              y={360}
              text="Select Bird:"
              font={mediumFont}
              color="#FFFFFF"
            />

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

            {/* Custom Bird */}
            <Group>
              {customBird && birdColor === 'custom' ? (
                <>
                  <Circle
                    cx={330}
                    cy={436}
                    r={35}
                    color="rgba(255, 255, 255, 0.3)"
                  />
                  <Group clip={rrect(rect(295, 401, 70, 70), 35, 35)}>
                    <Image
                      image={customBird}
                      x={295}
                      y={401}
                      width={70}
                      height={70}
                      fit="cover"
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
                  <Circle
                    cx={330}
                    cy={436}
                    r={37}
                    style="stroke"
                    strokeWidth={3}
                    color="#FFD700"
                  />
                </>
              ) : (
                <>
                  <Circle
                    cx={330}
                    cy={436}
                    r={35}
                    color="rgba(255, 255, 255, 0.1)"
                  />
                  <Circle
                    cx={330}
                    cy={436}
                    r={35}
                    style="stroke"
                    strokeWidth={2}
                    color="rgba(255, 255, 255, 0.5)"
                  />
                  <Text
                    x={318}
                    y={449}
                    text="+"
                    font={font}
                    color="#FFFFFF"
                  />
                </>
              )}
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
      )}
    </GestureHandlerRootView>
  );
};
export default App;
