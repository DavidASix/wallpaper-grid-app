import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
} from 'react-native';
import { AdMobBanner } from 'react-native-admob'
import { setCustomTextInput, setCustomText } from 'react-native-global-props';

import Router from './src/config/Router';
const c = require('./src/assets/constants');

const fontFamilyProps = { style: { fontSize: 16, fontFamily: 'Sriracha' } };
setCustomTextInput(fontFamilyProps);
setCustomText(fontFamilyProps);

class App extends React.Component {
  render() {
    return (
      <>
        <StatusBar barStyle='light-content' />
        <Router />
        <View style={{ flex: 0, width: '100%', alignItems: 'center', justifyContent: 'center', borderColor: '#000', borderTopWidth: 1 }}>
          <AdMobBanner
            adSize='banner'
            adUnitID={c.ads.bottomBanner}
            testDevices={[AdMobBanner.simulatorId]}
            onAdFailedToLoad={error => console.log('Bottom Banner, ',new Date(Date.now()), ': ', error)} />
        </View>
      </>
    );
  }
}

export default App;
