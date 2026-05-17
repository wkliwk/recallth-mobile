import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');
const COLORS = ['#ed8547', '#2d9d5a', '#2563EB', '#c4880f', '#b91c1c', '#fce8d0'];
const COUNT = 30;

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  rot: Animated.Value;
  color: string;
  size: number;
  xEnd: number;
}

function makeParticles(): Particle[] {
  return Array.from({ length: COUNT }, (_, i) => ({
    x: new Animated.Value(SW * 0.5),
    y: new Animated.Value(SH * 0.35),
    rot: new Animated.Value(0),
    color: COLORS[i % COLORS.length] ?? '#ed8547',
    size: 8 + Math.random() * 8,
    xEnd: (Math.random() - 0.5) * SW * 1.2,
  }));
}

interface Props {
  onDone?: () => void;
}

export function ConfettiOverlay({ onDone }: Props) {
  const particles = useRef<Particle[]>(makeParticles()).current;

  useEffect(() => {
    const anims = particles.map((p) =>
      Animated.parallel([
        Animated.timing(p.x, {
          toValue: p.xEnd,
          duration: 900 + Math.random() * 400,
          useNativeDriver: true,
        }),
        Animated.timing(p.y, {
          toValue: SH + 60,
          duration: 900 + Math.random() * 400,
          useNativeDriver: true,
        }),
        Animated.timing(p.rot, {
          toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
          duration: 900 + Math.random() * 400,
          useNativeDriver: true,
        }),
      ]),
    );

    Animated.stagger(20, anims).start(() => {
      onDone?.();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.piece,
            {
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                {
                  rotate: p.rot.interpolate({
                    inputRange: [-360, 360],
                    outputRange: ['-360deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', borderRadius: 2 },
});
