'use strict';
// CommonJS stub for @gluestack-ui/overlay.
// The package ships only ESM (lib/index.jsx + src/index.tsx) which Metro cannot
// consume without transpilation. This stub re-exports the same surface using
// the pre-built commonjs build of @react-native-aria/overlays so that
// OverlayProvider, OverlayContainer, ExitAnimationContext, and Overlay all
// resolve correctly at runtime.

const React = require('react');
const { Modal, Platform } = require('react-native');
const aria = require('@react-native-aria/overlays/lib/commonjs/index');

const ExitAnimationContext = React.createContext({ exited: true, setExited: () => {} });
exports.ExitAnimationContext = ExitAnimationContext;
exports.OverlayProvider = aria.OverlayProvider;

// Minimal Overlay component matching the interface used by @gluestack-ui/toast.
const Overlay = React.forwardRef(function Overlay(
  { children, isOpen, useRNModal = false, useRNModalOnAndroid = false,
    isKeyboardDismissable = true, animationPreset = 'fade', onRequestClose, style },
  ref
) {
  const [exited, setExited] = React.useState(!isOpen);

  if (!isOpen && exited) return null;

  if (useRNModal || (useRNModalOnAndroid && Platform.OS === 'android')) {
    return React.createElement(
      ExitAnimationContext.Provider,
      { value: { exited, setExited } },
      React.createElement(Modal,
        { statusBarTranslucent: true, transparent: true, visible: isOpen,
          onRequestClose, animationType: animationPreset, ref },
        children
      )
    );
  }

  return React.createElement(
    aria.OverlayContainer,
    { style },
    React.createElement(ExitAnimationContext.Provider, { value: { exited, setExited } }, children)
  );
});

exports.Overlay = Overlay;
