// ? Import React & Hooks
import React, {useState} from 'react';

// ? Import React Native Libraries
import {Image, ScrollView, StatusBar, Text, View} from 'react-native';
import {Button, TextInput} from 'react-native-paper';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Buffer} from 'buffer';

// ? Import Utilities
import {api, AuthContext} from '../../App';
import {deviceHeight, deviceWidth, handleError, timedFetch} from '../utils';

// ? Import Assets
import loginArtwork from '../assets/icons/login.png';

export default function Login() {
  // * useStates
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  // * useContexts
  const {dispatch} = React.useContext(AuthContext);

  // * Functions
  const handleLogin = () => {
    setLoading(true);

    timedFetch()(
      fetch(`${api}Login/`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          username,
          password: Buffer.from(password).toString('base64'),
        }),
      }),
    )
      .then(response => {
        if (response.ok) return response.json();
        return response.json().then((error: any) => {
          setLoading(false);
          throw new Error(JSON.stringify(error));
        });
      })
      .then(data => {
        setUsername('');
        setPassword('');
        dispatch({type: 'SIGN_IN', token: data.token});
      })
      .catch(error => handleError(error));
  };

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
          style={{height: 300, width: 300}}
        />

        <Text
          style={{
            color: 'rgba(0, 0, 0, 0.7)',
            fontFamily: 'Abel-Regular',
            fontSize: RFPercentage(4),
            marginBottom: 10,
            marginTop: -20,
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
          onChangeText={(text: string) => setUsername(text)}
          style={{
            backgroundColor: '#fff',
            fontSize: RFPercentage(2.3),
            marginBottom: 20,
            width: deviceWidth * 0.8,
          }}
          theme={{
            animation: {scale: 3},
            fonts: {regular: {fontFamily: 'Rubik-Regular'}},
            roundness: 10,
          }}
          value={username}
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
            fontSize: RFPercentage(2.3),
            marginBottom: 30,
            width: deviceWidth * 0.8,
          }}
          theme={{
            animation: {scale: 3},
            fonts: {regular: {fontFamily: 'Rubik-Regular'}},
            roundness: 10,
          }}
          value={password}
        />

        <Button
          contentStyle={{paddingHorizontal: 50, paddingVertical: 8}}
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
            elevation: loading || !username || !password ? 0 : 20,
          }}>
          LOGIN
        </Button>
      </View>
    </ScrollView>
  );
}
