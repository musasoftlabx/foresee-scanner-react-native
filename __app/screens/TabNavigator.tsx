// ? Import React & Hooks
import React from 'react';

// ? Import React Native Libraries
import Ionicons from 'react-native-vector-icons/Ionicons';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

// ? Import Project Files
import Stores from './Stores';
import ScanOperators from './ScanOperators';

const Tab = createBottomTabNavigator();

const Home = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      activeColor="#f0edf6"
      inactiveColor="gray"
      labeled={false}
      barStyle={{backgroundColor: '#694fad'}}
      screenOptions={({route}) => ({
        headerBackVisible: true,
        headerShown: false,
        headerTransparent: false,
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Scan Operator') {
            iconName = focused
              ? 'ios-finger-print-outline'
              : 'ios-finger-print-sharp';
          }

          return <Ionicons name={iconName} size={24 || size} color={color} />;
        },
        tabBarShowLabel: true,
        tabBarLabelPosition: 'beside-icon',
        tabBarLabelStyle: {
          fontFamily: 'Abel-Regular',
          fontSize: 20,
          marginLeft: 20,
        },
        tabBarStyle: {
          backgroundColor: '#11B4A7',
          borderTopColor: '#11B4A7',
          height: 55,
          paddingBottom: 5,
          paddingHorizontal: 10,
          paddingTop: 5,
        },
        tabBarItemStyle: {
          borderRadius: 50,
          paddingBottom: 5,
        },
        tabBarActiveTintColor: '#E2FFFD',
        tabBarInactiveTintColor: 'white',
        tabBarActiveBackgroundColor: 'turquoise',
        tabBarInactiveBackgroundColor: '#11B4A7',
      })}>
      <Tab.Screen
        children={props => <Stores {...props} />}
        name="Home"
        options={{tabBarLabel: 'Home'}}
      />
      <Tab.Screen
        name="Scan Operators"
        component={ScanOperators}
        options={{
          headerShown: true,
          headerTransparent: true,
          tabBarLabel: 'Scan Operator',
        }}
      />
    </Tab.Navigator>
  );
};

export default Home;
