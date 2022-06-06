// ? Import React & Hooks
import React, {useState} from 'react';

// ? Import React Native Libraries
import {Image, ScrollView, StatusBar, Text, View} from 'react-native';
import {Button, TextInput, useTheme} from 'react-native-paper';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Buffer} from 'buffer';
import {SvgXml} from 'react-native-svg';

// ? Import Constants
import {AuthContext, api, PreferencesContext} from '../../App';
import {
  deviceHeight,
  deviceWidth,
  errorMessage,
  handleError,
  timedFetch,
} from '../utils';

import loginArtwork from '../icons/login.png';

const controller = new AbortController();

interface Props {
  navigation: object;
}

const Login: React.FC<Props> = ({navigation}) => {
  // * State declaration
  const [username, setUsername] = useState<string | null>('');
  const [password, setPassword] = useState<string | null>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [secureText, setSecureText] = useState(true);

  // * Contexts specification
  const {state, dispatch} = React.useContext(AuthContext);
  const {toggleTheme, isThemeDark} = React.useContext(PreferencesContext);

  const theme = useTheme();

  // * Functions
  const handleLogin = () => {
    setLoading(true);

    timedFetch()(
      fetch(`${api}Login/`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          domain: 'Scanner',
          username,
          password: new Buffer(password).toString('base64'),
        }),
        signal: controller.signal,
      }),
    )
      .then(response => {
        if (response.ok) return response.json();
        return response.json().then((error: any) => {
          throw new Error(JSON.stringify(error));
        });
      })
      .then(
        data => (
          setUsername(''),
          setPassword(''),
          dispatch({type: 'SIGN_IN', token: data.token})
        ),
      )
      .catch(error => handleError(error));
  };

  const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
                <path 
                  fill="#0099ff" 
                  fill-opacity="1" 
                  d="M0,192L17.1,197.3C34.3,203,69,213,103,202.7C137.1,192,171,160,206,144C240,128,274,128,309,144C342.9,160,377,192,411,208C445.7,224,480,224,514,240C548.6,256,583,288,617,261.3C651.4,235,686,149,720,117.3C754.3,85,789,107,823,144C857.1,181,891,235,926,224C960,213,994,139,1029,101.3C1062.9,64,1097,64,1131,58.7C1165.7,53,1200,43,1234,37.3C1268.6,32,1303,32,1337,69.3C1371.4,107,1406,181,1423,218.7L1440,256L1440,320L1422.9,320C1405.7,320,1371,320,1337,320C1302.9,320,1269,320,1234,320C1200,320,1166,320,1131,320C1097.1,320,1063,320,1029,320C994.3,320,960,320,926,320C891.4,320,857,320,823,320C788.6,320,754,320,720,320C685.7,320,651,320,617,320C582.9,320,549,320,514,320C480,320,446,320,411,320C377.1,320,343,320,309,320C274.3,320,240,320,206,320C171.4,320,137,320,103,320C68.6,320,34,320,17,320L0,320Z">
                </path>
              </svg>`;

  return (
    <ScrollView>
      <View
        style={{
          alignItems: 'center',
          height: deviceHeight,
          justifyContent: 'center',
        }}>
        <StatusBar
          animated
          backgroundColor="#fff"
          barStyle="dark-content"
          showHideTransition="fade"
          translucent
        />

        <Image
          resizeMode="contain"
          source={loginArtwork}
          style={{
            height: 300,
            marginBottom: -deviceWidth * 0.07,
            marginTop: -deviceWidth * 0.25,
            width: 300,
          }}
        />

        <Text
          style={{
            color: 'rgba(0, 0, 0, 0.7)',
            fontFamily: 'Abel-Regular',
            fontSize: RFPercentage(4),
            marginBottom: 10,
          }}>
          Let's get you signed in
        </Text>

        <TextInput
          label="Username"
          left={
            <TextInput.Icon
              name="shield-account"
              style={{marginTop: 8, opacity: 0.5}}
            />
          }
          mode="outlined"
          value={username}
          onChangeText={(text: string) => setUsername(text)}
          style={{
            backgroundColor: '#fff',
            fontFamily: 'Rubik-Regular',
            marginBottom: 20,
            width: deviceWidth * 0.8,
          }}
        />

        <TextInput
          label="Password"
          left={
            <TextInput.Icon
              name="lastpass"
              style={{marginTop: 8, opacity: 0.5}}
            />
          }
          mode="outlined"
          value={password}
          secureTextEntry={secureText}
          right={
            <TextInput.Icon
              name={secureText ? 'eye-off' : 'eye'}
              onPress={() => setSecureText(secureText ? false : true)}
              style={{marginTop: 8, opacity: 0.5}}
            />
          }
          onChangeText={(text: string) => setPassword(text)}
          style={{
            backgroundColor: '#fff',
            marginBottom: 30,
            width: deviceWidth * 0.8,
          }}
        />

        <Button
          disabled={loading || !username || !password}
          labelStyle={{
            fontFamily: 'Rubik-Regular',
            fontSize: RFPercentage(2.5),
          }}
          loading={loading}
          mode="contained"
          onPress={handleLogin}
          style={{
            borderRadius: 50,
            elevation: 0,
            paddingVertical: 8,
            width: 200,
          }}>
          LOGIN
        </Button>
      </View>

      {/* <View
        style={{
          backgroundColor: '#0099ff',
          borderRadius: 300,
          height: 100,
          width: deviceWidth,
        }}
      /> */}

      {/* <SvgXml
        xml={SVG}
        width="100%"
        height="100%"
        style={{bottom: 0, position: 'absolute', zIndex: 0}}
      /> */}
    </ScrollView>
  );
};

export default Login;
