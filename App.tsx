// ? Import React & Hooks
import React, {createContext, useEffect, useReducer} from 'react';

// ? Import React Native Libraries
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import merge from 'deepmerge';
import {MMKV} from 'react-native-mmkv';
import {
  DarkTheme as PaperDarkTheme,
  DefaultTheme as PaperDefaultTheme,
  Provider as PaperProvider,
} from 'react-native-paper';

// ? Import Project Files
import Login from './__app/screens/Login';
import Logout from './__app/screens/Logout';
import SplashScreen from './__app/screens/SplashScreen';
import StackNavigator from './__app/screens/StackNavigator';

// ? Import Utilities
import {token} from './__app/utils';
export const server = 'https://foresee-technologies.com/';
export const api = `${server}api/v1/`;
export const storage = new MMKV();

// ? Import Contexts
import ContextProvider from './__app/contexts';

// ? Register Components
const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();
export const AuthContext = createContext();
export const PreferencesContext = createContext({
  toggleTheme: () => {},
  isThemeDark: true,
});
const CombinedDefaultTheme = merge(PaperDefaultTheme, NavigationDefaultTheme);
const CombinedDarkTheme = merge(PaperDarkTheme, NavigationDarkTheme);

export const controller = new AbortController();
let timer: any;

// ? Start Component
const App: () => Node = () => {
  const [isThemeDark, setIsThemeDark] = React.useState(false);
  let theme = isThemeDark ? CombinedDarkTheme : CombinedDefaultTheme;
  const toggleTheme = React.useCallback(() => {
    return setIsThemeDark(!isThemeDark);
  }, [isThemeDark]);
  const preferences = React.useMemo(
    () => ({toggleTheme, isThemeDark}),
    [toggleTheme, isThemeDark],
  );

  const [state, dispatch] = useReducer(
    (state, action) => {
      switch (action.type) {
        case 'SIGN_IN':
          storage.set('token', action.token);
          return {...state, token: action.token};
        case 'SIGN_OUT':
          storage.delete('token');
          return {...state, loading: false, token: null};
        case 'GET_TOKEN':
          action.token && storage.set('token', action.token);
          return {...state, loading: false, token: action.token || null};
      }
    },
    {loading: true, token: null},
  );

  useEffect(() => {
    if (token) {
      fetch(`${api}_ValidateToken/`, {
        headers: {Authorization: `Bearer ${token}`},
        signal: controller.signal,
      })
        .then(response => {
          if (response.status > 200)
            throw new Error(`Token validation failed: ${response.status}`);
          return response.text();
        })
        .then(token => dispatch({type: 'GET_TOKEN', token}))
        .catch(error => (dispatch({type: 'SIGN_OUT'}), console.log(error)));
    } else {
      dispatch({type: 'GET_TOKEN'});
    }
  }, []);

  if (state.loading) {
    return <SplashScreen />;
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <AuthContext.Provider value={{state, dispatch}}>
        <ContextProvider
          children={
            <PaperProvider
              children={
                <PreferencesContext.Provider value={preferences}>
                  <NavigationContainer
                    children={
                      state.token ? (
                        <Drawer.Navigator
                          initialRouteName="Home"
                          screenOptions={{
                            headerShown: false,
                            drawerType: 'back',
                            drawerStyle: {
                              backgroundColor: '#c6cbef',
                              width: 140,
                            },
                          }}>
                          <Drawer.Screen
                            name="Home"
                            component={StackNavigator}
                          />
                          <Drawer.Screen name="Logout" component={Logout} />
                        </Drawer.Navigator>
                      ) : (
                        <Stack.Navigator initialRouteName="Login">
                          <Stack.Screen
                            children={props => (
                              <Login {...props} SampleProp="SampleProp" />
                            )}
                            name="Login"
                            options={{headerShown: false}}
                          />
                        </Stack.Navigator>
                      )
                    }
                    theme={{
                      ...theme,
                      colors: {
                        background: '#fff',
                      },
                    }}
                    //theme={theme}
                  />
                </PreferencesContext.Provider>
              }
              theme={theme}
            />
          }
        />
      </AuthContext.Provider>
    </GestureHandlerRootView>
  );
};

export default App;
