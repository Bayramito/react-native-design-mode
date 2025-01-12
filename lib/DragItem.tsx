import React, {useEffect, useMemo} from 'react';

import {View, Dimensions, StyleSheet} from 'react-native';
import {Gesture, PanGestureHandler} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');
const POINT_HEIGHT = SCREEN_HEIGHT / 3;
const POINT_WIDTH = SCREEN_WIDTH / 2;
const gapY = 50;
const gapX = 20;
const CIRLE_SIZE = 60;

const DragItem = ({children}) => {
  const origin = {
    x: useSharedValue(0),
    y: useSharedValue(0),
  };

  useEffect(async () => {
    const data = await AsyncStorage.getItem('dragItem');
    if (data) {
      const {x, y} = JSON.parse(data);
      // origin.x.value = x;
      // origin.y.value = y;
      translateX.value = x;
      translateY.value = y;
    }
  }, []);
  const saveToStorage = () => {
    setTimeout(() => {
      AsyncStorage.setItem(
        'dragItem',
        JSON.stringify({x: translateX.value, y: translateY.value}),
      );
    }, 300);
  };
  const isDragging = useSharedValue(false);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const snapTo = (x, y) => {
    'worklet';

    const topRight = x > SCREEN_WIDTH / 2 && y < POINT_HEIGHT;
    const topLeft = x < SCREEN_WIDTH / 2 && y < POINT_HEIGHT;
    const bottomLeft = x < SCREEN_WIDTH / 2 && y > SCREEN_HEIGHT - POINT_HEIGHT;
    const bottomRight =
      x > SCREEN_WIDTH / 2 && y > SCREEN_HEIGHT - POINT_HEIGHT;
    const middleLeft =
      x < SCREEN_WIDTH / 2 &&
      y < SCREEN_HEIGHT - POINT_HEIGHT &&
      y > POINT_HEIGHT;
    const middleRight =
      x > SCREEN_WIDTH / 2 &&
      y < SCREEN_HEIGHT - POINT_HEIGHT &&
      y > POINT_HEIGHT;

    if (topRight) {
      translateX.value = withTiming(SCREEN_WIDTH - CIRLE_SIZE - gapX * 2);
      translateY.value = withTiming(-SCREEN_HEIGHT + CIRLE_SIZE + gapY * 2);
    } else if (topLeft) {
      translateX.value = withTiming(0);
      translateY.value = withTiming(-SCREEN_HEIGHT + CIRLE_SIZE + gapY * 2);
    } else if (bottomLeft) {
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
    } else if (bottomRight) {
      translateX.value = withTiming(SCREEN_WIDTH - CIRLE_SIZE - gapX * 2);
      translateY.value = withTiming(0);
    } else if (middleLeft) {
      translateX.value = withTiming(0);
      translateY.value = withTiming(-SCREEN_HEIGHT / 2 + CIRLE_SIZE / 2 + gapY);
    } else if (middleRight) {
      translateX.value = withTiming(SCREEN_WIDTH - CIRLE_SIZE - gapX * 2);
      translateY.value = withTiming(-SCREEN_HEIGHT / 2 + CIRLE_SIZE / 2 + gapY);
    } else {
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
    }
    runOnJS(saveToStorage)();
  };

  const gesture = useAnimatedGestureHandler({
    onStart: (event, ctx) => {
      origin.x.value = translateX.value;
      origin.y.value = translateY.value;
      isDragging.value = withTiming(true, {duration: 300});
    },
    onActive: (e, ctx) => {
      const x = e.absoluteX;
      const y = e.absoluteY;
      translateX.value = e.translationX + origin.x.value;
      translateY.value = e.translationY + origin.y.value;
      console.log(x, y);
    },
    onEnd: (e, ctx) => {
      snapTo(e.absoluteX, e.absoluteY);
      isDragging.value = withTiming(false, {duration: 300});
    },
  });
  const rStyles = useAnimatedStyle(() => {
    return {
      width: CIRLE_SIZE,
      height: CIRLE_SIZE,
      transform: [
        {translateX: translateX.value},
        {translateY: translateY.value},
      ],
    };
  });

  const clonedChildren = useMemo(
    () =>
      React.cloneElement(children, {
        style: [
          StyleSheet.flatten(children.props.style),
          {
            bottom: gapY,
            left: gapX,
          },
        ],
      }),
    [children],
  );

  return (
    <PanGestureHandler onGestureEvent={gesture}>
      <Animated.View style={[rStyles]}>{clonedChildren}</Animated.View>
    </PanGestureHandler>
  );
};

export default DragItem;
