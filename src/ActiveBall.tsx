import React from 'react';
import Ball from './Ball';

const ActiveBall = ({ x, y, radius }: { x:number; y:number; radius:number }) => {
  return <Ball x={x} y={y} radius={radius} />;
};

export default ActiveBall;
