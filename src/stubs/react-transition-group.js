// Stub for react-transition-group — web-only, not used in the RN toast path.
// @gluestack-ui/transitions lists it as a dep but the RN Animated branch
// never actually calls it.
module.exports = {
  Transition:      () => null,
  CSSTransition:   () => null,
  TransitionGroup: () => null,
  SwitchTransition: () => null,
};
