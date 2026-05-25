import Reactotron from 'reactotron-react-native';

if (__DEV__) {
  Reactotron
    .configure({ host: '192.168.1.87', name: 'E-Commerce App' })
    .useReactNative({ networking: true })
    .connect();
}
