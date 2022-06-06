// ? Import React & Hooks
import React from 'react';

// ? Import React Native Libraries
import {
  createStackNavigator,
  CardStyleInterpolators,
} from '@react-navigation/stack';
import {Buffer} from 'buffer';
import {getBrand} from 'react-native-device-info';

// ? Import Project Files
import TabNavigator from './TabNavigator';
import Location from './Location';
import Locations from './Locations';
import ScanLocation from './ScanLocation';
import ScanLocationWithCamera from './ScanLocationWithCamera';
import ScanProductWithCamera from './ScanProductWithCamera';
import ScanProduct from './ScanProduct';

// ? Import Constants
import {AuthContext} from '../../App';

// ? Register Components
const Stack = createStackNavigator();

const StackNavigator = () => {
  const {state} = React.useContext(AuthContext);

  const data = state.token.split('.')[1];
  const entity = Buffer.from(data, 'base64').toString('utf8');
  const role = JSON.parse(entity).data.role;

  return (
    <Stack.Navigator
      initialRouteName={
        role === 'Scanner' && getBrand() === 'EA500'
          ? 'ScanLocation'
          : role === 'Scanner' && getBrand() !== 'EA500'
          ? 'ScanLocationWithCamera'
          : 'TabNavigator'
      }>
      <Stack.Screen
        component={TabNavigator}
        name="TabNavigator"
        options={{headerShown: false}}
      />
      <Stack.Screen
        component={Locations}
        name="Locations"
        options={{
          cardStyleInterpolator:
            CardStyleInterpolators.forFadeFromBottomAndroid,
          transitionSpec: {
            open: {
              animation: 'spring',
              config: {
                stiffness: 1000,
                damping: 500,
                mass: 3,
                overshootClamping: true,
                restDisplacementThreshold: 0.01,
                restSpeedThreshold: 0.01,
              },
            },
            close: {
              animation: 'spring',
              config: {
                stiffness: 1000,
                damping: 500,
                mass: 3,
                overshootClamping: true,
                restDisplacementThreshold: 0.01,
                restSpeedThreshold: 0.01,
              },
            },
          },
        }}
      />
      <Stack.Screen
        component={Location}
        name="Location"
        options={{
          gestureDirection: 'vertical',
          transitionSpec: {
            open: {
              animation: 'spring',
              config: {
                stiffness: 1000,
                damping: 500,
                mass: 3,
                overshootClamping: true,
                restDisplacementThreshold: 0.01,
                restSpeedThreshold: 0.01,
              },
            },
            close: {
              animation: 'spring',
              config: {
                stiffness: 1000,
                damping: 500,
                mass: 3,
                overshootClamping: true,
                restDisplacementThreshold: 0.01,
                restSpeedThreshold: 0.01,
              },
            },
          },
        }}
      />
      <Stack.Screen
        component={ScanLocation}
        name="ScanLocation"
        options={{headerShown: false}}
      />
      <Stack.Screen
        component={ScanLocationWithCamera}
        name="ScanLocationWithCamera"
        options={{headerShown: false}}
      />
      <Stack.Screen
        component={ScanProductWithCamera}
        name="ScanProductWithCamera"
        options={{headerShown: false}}
      />
      <Stack.Screen
        component={ScanProduct}
        name="ScanProduct"
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

export default StackNavigator;
