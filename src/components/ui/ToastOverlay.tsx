import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppToast } from './Toast';
import { toastEmitter, ToastEvent } from '../../utils/toastEmitter';

const DURATION = 3500;

type ActiveToast = ToastEvent & { anim: Animated.Value };

export const ToastOverlay: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    return toastEmitter.subscribe(event => {
      const anim = new Animated.Value(0);
      setToasts(prev => [...prev, { ...event, anim }]);

      Animated.spring(anim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 180 }).start();

      timers.current[event.id] = setTimeout(() => dismiss(event.id), DURATION);
    });
  }, []);

  const dismiss = (id: string) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <View style={[styles.overlay, { top: insets.top + 8 }]} pointerEvents="box-none">
      {toasts.map(t => (
        <Animated.View
          key={t.id}
          style={{
            opacity: t.anim,
            transform: [{ translateY: t.anim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
          }}
        >
          <AppToast
            id={t.id}
            variant={t.variant}
            title={t.title}
            description={t.description}
            onClose={() => dismiss(t.id)}
          />
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left:     0,
    right:    0,
    zIndex:   9999,
    gap:      8,
  },
});
