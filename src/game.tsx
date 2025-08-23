import React, { useEffect, useRef, useState } from 'react';
import { View, Dimensions, PanResponder, StyleSheet, Animated, TouchableWithoutFeedback } from 'react-native';
import Matter from 'matter-js';

const { width, height } = Dimensions.get('window');
const BALL_RADIUS = 20;
const SIDE_MARGIN = 10;

export default function Game() {
  const [balls, setBalls] = useState([]);
  const [isBallFalling, setIsBallFalling] = useState(false);

  const engine = useRef(Matter.Engine.create()).current;
  const world = engine.world;
  const ballRefs = useRef([]);
  const currentBallRef = useRef(null);

  const [ballX, setBallX] = useState(width / 2);
  const pan = useRef(new Animated.Value(width / 2)).current;

  useEffect(() => {
    world.gravity.y = 1;

    const ground = Matter.Bodies.rectangle(width / 2, height - 30, width - 2 * SIDE_MARGIN, 60, { isStatic: true });
    const leftWall = Matter.Bodies.rectangle(SIDE_MARGIN / 2, height / 2, SIDE_MARGIN, height, { isStatic: true });
    const rightWall = Matter.Bodies.rectangle(width - SIDE_MARGIN / 2, height / 2, SIDE_MARGIN, height, { isStatic: true });
    Matter.World.add(world, [ground, leftWall, rightWall]);

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);

    Matter.Events.on(engine, 'afterUpdate', () => {
      setBalls(ballRefs.current.map(b => ({ x: b.position.x, y: b.position.y, id: b.id })));
    });

    return () => {
      Matter.Runner.stop(runner);
      Matter.World.clear(world);
      Matter.Engine.clear(engine);
    };
  }, []);

  let startX = 0;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startX = ballX;
      },
      onPanResponderMove: (evt, gestureState) => {
        let x = startX + gestureState.dx;
        x = Math.max(SIDE_MARGIN + BALL_RADIUS, Math.min(width - SIDE_MARGIN - BALL_RADIUS, x));
        pan.setValue(x);
      },
      onPanResponderRelease: (evt, gestureState) => {
        let x = startX + gestureState.dx;
        x = Math.max(SIDE_MARGIN + BALL_RADIUS, Math.min(width - SIDE_MARGIN - BALL_RADIUS, x));
        setBallX(x);
        pan.setValue(x);
        spawnBallMatter(x);
      },
    })
  ).current;

  const handleTap = (e) => {
    const x = Math.max(SIDE_MARGIN + BALL_RADIUS, Math.min(width - SIDE_MARGIN - BALL_RADIUS, e.nativeEvent.locationX));
    pan.setValue(x);
    setBallX(x);
    spawnBallMatter(x);
  };

  const spawnBallMatter = (x) => {
    if (isBallFalling) return;

    const ball = Matter.Bodies.circle(x, 50, BALL_RADIUS, { restitution: 0.5, frictionAir: 0.02 });
    ball.id = Date.now();
    Matter.World.add(world, ball);
    ballRefs.current.push(ball);
    currentBallRef.current = ball;
    setIsBallFalling(true);

    setTimeout(() => {
      setIsBallFalling(false);
    }, 2000);
  };

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={styles.container}>
        {balls.map(b => (
          <View key={b.id} style={[styles.ball, { left: b.x - BALL_RADIUS, top: b.y - BALL_RADIUS }]} />
        ))}

        {!isBallFalling && (
          <Animated.View
            {...panResponder.panHandlers}
            style={[styles.ball, { top: 50, transform: [{ translateX: pan }] }]}
          />
        )}

        <View style={[styles.ground, { left: SIDE_MARGIN, width: width - 2 * SIDE_MARGIN }]} />
        <View style={[styles.wall, { left: 0 }]} />
        <View style={[styles.wall, { right: 0 }]} />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eee' },
  ball: { position: 'absolute', width: BALL_RADIUS * 2, height: BALL_RADIUS * 2, borderRadius: BALL_RADIUS, backgroundColor: 'tomato' },
  ground: { position: 'absolute', bottom: 0, height: 60, backgroundColor: 'green' },
  wall: { position: 'absolute', top: 0, bottom: 0, width: SIDE_MARGIN, backgroundColor: 'brown' },
});
