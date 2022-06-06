// ? Import React & Hooks
import React from 'react';

// ? Import React Native Libraries
import {
  ActivityIndicator,
  Image,
  StatusBar,
  StyleSheet,
  Text,
} from 'react-native';
import {RFPercentage} from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';

import logo from '../assets/icons/foresee100.png';

const SplashScreen = () => {
  return (
    <LinearGradient colors={['#fff', '#77FAF0']} style={styles.container}>
      <StatusBar
        animated
        backgroundColor="#fff"
        barStyle="light-content"
        showHideTransition="fade"
        translucent
      />

      <Image
        resizeMode="contain"
        source={logo}
        style={{
          height: 100,
          marginBottom: 20,
          width: 100,
        }}
      />
      <Text
        style={{
          color: '#867000',
          fontFamily: 'Abel-Regular',
          fontSize: RFPercentage(4),
          marginBottom: 15,
        }}>
        Foresee Technologies
      </Text>
      <ActivityIndicator color="grey" size="large" />

      <Text
        style={{
          bottom: 10,
          color: '#867000',
          fontFamily: 'Abel-Regular',
          fontSize: RFPercentage(2.5),
          position: 'absolute',
        }}>
        Version 1.0.0
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});

export default SplashScreen;
