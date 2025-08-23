import React, { useEffect, useRef, useState } from 'react';
import { View, PanResponder, Dimensions, StyleSheet } from 'react-native';
import Matter from 'matter-js';

const { width, height } = Dimensions.get('window');
const BALL_RADIUS = 20;

export default function Ball({ initialX, isActive, onFall }) {
  const [pos, setPos] = useState({ x: initialX, y: 50 });
  const ballRef = useRef(null);
  const engine = useRef(Matter.Engine.create()).current;
  const world = engine.world;

  useEffect(() => {
    if (!isActive) return; // غیرفعال باشه

    world.gravity.y = 1;

    const ball = Matter.Bodies.circle(initialX, 50, BALL_RADIUS, {
      restitution: 0.5,
      frictionAir: 0.02,
      label: 'ball',
    });

    const ground = Matter.Bodies.rectangle(width / 2, height - 50, width - 20, 60, {
      isStatic: true,
      label: 'ground',
    });

    Matter.World.add(world, [ball, ground]);
    Matter.Body.setStatic(ball, true);
    ballRef.current = ball;

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    Matter.Events.on(engine, 'afterUpdate', () => {
      if (ballRef.current) {
        const { x, y } = ballRef.current.position;
        setPos({ x, y });
        if (y > height - 60 - BALL_RADIUS) {
          Matter.Body.setStatic(ballRef.current, true);
          onFall(); // توپ افتاد
        }
      }
    });

    return () => {
      Matter.Runner.stop(runner);
      Matter.World.clear(world);
      Matter.Engine.clear(engine);
    };
  }, [isActive]);

  const isDragging = useRef(false);

const panResponder = useRef(
  PanResponder.create({
    onStartShouldSetPanResponder: () => true, // همیشه true
    onPanResponderGrant: () => { isDragging.current = false; },
    onPanResponderMove: (e, gestureState) => {
      if (!isActive || !ballRef.current) return; // غیرفعال: کاری نکن
      isDragging.current = true;
      let x = gestureState.moveX;
      x = Math.max(BALL_RADIUS, Math.min(width - BALL_RADIUS, x));
      Matter.Body.setPosition(ballRef.current, { x, y: 50 });
      setPos({ x, y: 50 });
    },
    onPanResponderRelease: (e, gestureState) => {
      if (!isActive || !ballRef.current) return; // غیرفعال: کاری نکن
      let x = isDragging.current ? gestureState.moveX : e.nativeEvent.locationX;
      x = Math.max(BALL_RADIUS, Math.min(width - BALL_RADIUS, x));
      Matter.Body.setPosition(ballRef.current, { x, y: 50 });
      Matter.Body.setVelocity(ballRef.current, { x: 0, y: 0 });
      Matter.Body.setStatic(ballRef.current, false);
      setPos({ x, y: 50 });
    },
  })
).current;


  return (
    <View
      style={[
        styles.ball,
        { left: pos.x - BALL_RADIUS, top: pos.y - BALL_RADIUS },
      ]}
      {...panResponder.panHandlers}
    />
  );
}

const styles = StyleSheet.create({
  ball: {
    position: 'absolute',
    width: BALL_RADIUS * 2,
    height: BALL_RADIUS * 2,
    borderRadius: BALL_RADIUS,
    backgroundColor: 'tomato',
  },
});
