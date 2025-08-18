import React, { useEffect, useRef, useState } from 'react';
import { View, Dimensions, PanResponder, StyleSheet } from 'react-native';
import Matter from 'matter-js';

const { width, height } = Dimensions.get('window');
const SIDE_MARGIN = 10;
const BALL_RADIUS = 20;

export default function Game() {
  const [ballPos, setBallPos] = useState({ x: width / 2, y: 50 });
  const [isFalling, setIsFalling] = useState(false);
  const ballRef = useRef(null);

  const engine = useRef(Matter.Engine.create()).current;
  const world = engine.world;

  useEffect(() => {
    world.gravity.y = 1;

    const ball = Matter.Bodies.circle(width / 2, 50, BALL_RADIUS, {
      restitution: 0.5,
      frictionAir: 0.02,
      label: 'ball',
    });

    const ground = Matter.Bodies.rectangle(width / 2, height - 50, width - 2 * SIDE_MARGIN, 60, {
      isStatic: true,
      label: 'ground',
    });

    const leftWall = Matter.Bodies.rectangle(SIDE_MARGIN / 2, height / 2, SIDE_MARGIN, height, {
      isStatic: true,
      label: 'leftWall',
    });

    const rightWall = Matter.Bodies.rectangle(width - SIDE_MARGIN / 2, height / 2, SIDE_MARGIN, height, {
      isStatic: true,
      label: 'rightWall',
    });

    Matter.World.add(world, [ball, ground, leftWall, rightWall]);
    Matter.Body.setStatic(ball, true);
    ballRef.current = ball;

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    Matter.Events.on(engine, 'afterUpdate', () => {
      if (ballRef.current) {
        const { x, y } = ballRef.current.position;
        setBallPos({ x, y });
        if (isFalling && y > height - 60 - BALL_RADIUS) {
          setIsFalling(false);
          Matter.Body.setStatic(ballRef.current, true);
        }
      }
    });

    return () => {
      Matter.Runner.stop(runner);
      Matter.World.clear(world);
      Matter.Engine.clear(engine);
    };
  }, []);

const isDragging = useRef(false);

const panResponder = useRef(
  PanResponder.create({
    onStartShouldSetPanResponder: () => true,

    onPanResponderGrant: (e) => {
      isDragging.current = false;
      const { locationX, locationY } = e.nativeEvent;
      const dx = locationX - ballPos.x;
      const dy = locationY - ballPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= BALL_RADIUS) {
        Matter.Body.setStatic(ballRef.current, true);
      }
    },

    onPanResponderMove: (e, gestureState) => {
      isDragging.current = true; // انگشت حرکت کرده
      const { moveX } = gestureState;
      let clampedX = Math.max(SIDE_MARGIN + BALL_RADIUS, Math.min(width - SIDE_MARGIN - BALL_RADIUS, moveX));
      if (!isFalling && ballRef.current) {
        Matter.Body.setPosition(ballRef.current, { x: clampedX, y: 50 });
        setBallPos({ x: clampedX, y: 50 });
      }
    },

    onPanResponderRelease: (e, gestureState) => {
      if (!ballRef.current) return;

      let x;
      if (isDragging.current) {
        // درگ اند دراپ: از موقعیت حرکت آخر استفاده کن
        x = gestureState.moveX;
      } else {
        // تپ: از موقعیت تپ استفاده کن
        x = e.nativeEvent.locationX;
      }

      // محدود کردن x
      if (x < SIDE_MARGIN + BALL_RADIUS) x = SIDE_MARGIN + BALL_RADIUS;
      if (x > width - SIDE_MARGIN - BALL_RADIUS) x = width - SIDE_MARGIN - BALL_RADIUS;

      Matter.Body.setPosition(ballRef.current, { x, y: 50 });
      Matter.Body.setVelocity(ballRef.current, { x: 0, y: 0 });
      Matter.Body.setStatic(ballRef.current, false);
      setBallPos({ x, y: 50 });
      setIsFalling(true);
    },
  })
).current;



  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View
        style={[
          styles.ball,
          {
            left: ballPos.x - BALL_RADIUS,
            top: ballPos.y - BALL_RADIUS,
          },
        ]}
      />
      <View
        style={[
          styles.ground,
          { left: SIDE_MARGIN, width: width - 2 * SIDE_MARGIN },
        ]}
      />
      <View style={[styles.wall, { left: 0 }]} />
      <View style={[styles.wall, { right: 0 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eee',
  },
  ball: {
    position: 'absolute',
    width: BALL_RADIUS * 2,
    height: BALL_RADIUS * 2,
    borderRadius: BALL_RADIUS,
    backgroundColor: 'tomato',
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    height: 60,
    backgroundColor: 'green',
  },
  wall: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SIDE_MARGIN,
    backgroundColor: 'brown',
  },
});
