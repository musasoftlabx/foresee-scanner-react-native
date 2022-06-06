import React from 'react';
import {ActivityIndicator, Dimensions, StyleSheet, View} from 'react-native';

type Position = {
  position: 'flex-start' | 'center';
};

const CircularLoader = ({position}: Position) => {
  return (
    <View style={[styles.container, {justifyContent: position}]}>
      <View style={styles.circle}>
        <ActivityIndicator color="turquoise" size="large" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    height: Dimensions.get('window').height * 0.6,
  },
  circle: {
    backgroundColor: '#fff',
    borderRadius: 50,
    elevation: 10,
    padding: 5,
  },
});

export default CircularLoader;
