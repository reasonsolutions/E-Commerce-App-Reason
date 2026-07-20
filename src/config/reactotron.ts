import Reactotron from 'reactotron-react-native';

const host = '192.168.0.3';

if (__DEV__) {
  Reactotron.configure({ host, name: 'E-Commerce App' }) // physical device: change host to your `machine's LAN IP
    .useReactNative({ networking: true })
    .connect();
}
