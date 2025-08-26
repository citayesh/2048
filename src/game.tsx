import React, { useEffect, useRef, useState } from 'react';
import { View, Dimensions, PanResponder, StyleSheet, Animated, TouchableWithoutFeedback, Text } from 'react-native';
import Matter from 'matter-js';

const { width, height } = Dimensions.get('window');
const SIDE_MARGIN = 10;

export default function Game() {
  const [balls, setBalls] = useState([]);
  const [isBallFalling, setIsBallFalling] = useState(false);

  const [nextBallValue, setNextBallValue] = useState(0);

  const engine = useRef(Matter.Engine.create()).current;
  const world = engine.world;
  const ballRefs = useRef([]);

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
      setBalls(ballRefs.current.map(b => ({
        x: b.position.x,
        y: b.position.y,
        id: b.id,
        value: b.value,
        radius: b.radius
      })));
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
      x = Math.max(SIDE_MARGIN + 20, Math.min(width - SIDE_MARGIN - 20, x));
      pan.setValue(x);
    },
    onPanResponderRelease: (evt, gestureState) => {
      let x = startX + gestureState.dx;
      x = Math.max(SIDE_MARGIN + 20, Math.min(width - SIDE_MARGIN - 20, x));
      setBallX(x);
      pan.setValue(x);

    },
  })
).current;
  useEffect(()=>{
  spawnBallMatter(ballX);
},[ballX])

  const handleTap = (e) => {
    const x = Math.max(SIDE_MARGIN + 20, Math.min(width - SIDE_MARGIN - 20, e.nativeEvent.locationX));
    pan.setValue(x);
    setBallX(x);
  };

  const spawnBallMatter = (x) => {
    if (isBallFalling) return;

    const value = nextBallValue;
    console.log(value,nextBallValue,"ll")
    const radius = value * 4;

    const ball = Matter.Bodies.circle(x, 50, radius, { restitution: 0.5, frictionAir: 0.02 });
    ball.id = Date.now();
    ball.value = value;
    ball.radius = radius;

    Matter.World.add(world, ball);
    ballRefs.current.push(ball);
    setIsBallFalling(true);

    const values = [2, 4, 8];
    const newValue = values[Math.floor(Math.random() * values.length)];
    setNextBallValue(newValue);

    setTimeout(() => {
      setIsBallFalling(false);
    }, 2000);
  };

  const getColor = (value) => {
    switch (value) {
      case 2: return "#c53306ff";
      case 4: return "#f52a2aff";
      case 8: return "#f2b179";
      case 16: return "#f59563";
      case 32: return "#f67c5f";
      case 64: return "#f65e3b";
      case 128: return "#edcf72";
      case 256: return "#edcc61";
      case 512: return "#edc850";
      case 1024: return "#edc53f";
      case 2048: return "#edc22e";
      default: return "tomato";
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={styles.container}>
        {balls.map(b => (
          <View key={b.id} style={[
            styles.ball,
            {
              left: b.x - b.radius,
              top: b.y - b.radius,
              width: b.radius * 2,
              height: b.radius * 2,
              borderRadius: b.radius,
              backgroundColor: getColor(b.value)
            }
          ]}>
            <Text style={styles.ballText}>{b.value}</Text>
          </View>
        ))}

        {!isBallFalling && (
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.ball,
              { 
                top: 50,
                transform: [{ translateX: pan }],
                width: nextBallValue * 8,
                height: nextBallValue * 8,
                borderRadius: nextBallValue * 4,
                backgroundColor: getColor(nextBallValue)
              }
            ]}
          >
            <Text style={styles.ballText}>{nextBallValue}</Text>
          </Animated.View>
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
  ball: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center'
  },
  ballText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: "#333"
  },
  ground: { position: 'absolute', bottom: 0, height: 60, backgroundColor: 'green' },
  wall: { position: 'absolute', top: 0, bottom: 0, width: SIDE_MARGIN, backgroundColor: 'brown' },
});
