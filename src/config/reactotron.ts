import Reactotron from 'reactotron-react-native';

if (__DEV__) {
  Reactotron
    .configure({ host: '10.0.2.2', name: 'E-Commerce App' })
    .useReactNative({ networking: true })
    .connect();
}
