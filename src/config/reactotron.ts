import Reactotron from 'reactotron-react-native';

if (__DEV__) {
  Reactotron
    .configure({ host: '192.168.0.4', name: 'E-Commerce App' })
    .useReactNative({ networking: true })
    .connect();
}
