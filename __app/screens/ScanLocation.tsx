// ? Import React & Hooks
import React, {useState} from 'react';

// ? Import React Native Libraries
import {Alert, StatusBar, TextInput, View} from 'react-native';
import {Button, ProgressBar} from 'react-native-paper';
import {RFPercentage} from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Animatable from 'react-native-animatable';

// ? Register Animations
const AnimatedTextInput = Animatable.createAnimatableComponent(TextInput);
const AnimatedLogoutIcon = Animatable.createAnimatableComponent(MCI);

// ? Import Constants
import {AuthContext, api, storage} from '../../App';
import {deviceWidth, handleError, timedFetch} from '../utils';

const controller = new AbortController();

// ? Start Component
const ScanLocation: React.FC = ({navigation}) => {
  // * Contexts specification
  const {dispatch} = React.useContext(AuthContext);

  // * State declaration
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState(null);

  // * Ref declaration
  const codeInput = React.useRef();

  // * Effects
  React.useLayoutEffect(() => {
    setSearchQuery('');
    //return () => controller.abort();
  }, []);

  // ? Fetch data from server
  const getSuggestions = React.useCallback(async (query: string) => {
    if (query.length < 5) {
      setLocations(null);
      return;
    }

    setLoading(true);

    timedFetch()(
      fetch(`${api}Locations/?Scan=location`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${storage.getString('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({code: query}),
        //signal: controller.signal,
      }),
    )
      .then(response => {
        if (response.ok) return response.json();
        return response.json().then((error: any) => {
          setSearchQuery('');
          throw new Error(JSON.stringify(error));
        });
      })
      .then(data => {
        //setTimeout(() => {
        navigation.navigate('ScanProduct', {
          id: data.id,
          code: data.code,
          physicalCount: data.physicalCount,
          systemCount: data.systemCount,
          storeId: data.storeId,
        });
        //}, 100);
      })
      .catch(error => handleError(error))
      .finally(() => (setSearchQuery(''), setLoading(false)));
  }, []);

  return (
    // @ts-ignore
    <LinearGradient
      colors={['#016961', '#30D5C8']}
      style={{alignItems: 'center', flex: 1, justifyContent: 'center'}}>
      <StatusBar
        animated
        backgroundColor="#016961"
        barStyle="light-content"
        showHideTransition="fade"
        translucent
      />
      {/*@ts-ignore*/}
      <AnimatedLogoutIcon
        name="logout-variant"
        size={24}
        color="rgba(255, 255, 255, 0.7)"
        style={{position: 'absolute', top: 60, right: 30}}
        onPress={() =>
          Alert.alert('Logout', 'Proceed to logout?', [
            {text: 'NO'},
            {
              text: 'YES',
              onPress: () => dispatch({type: 'SIGN_OUT'}),
            },
          ])
        }
      />

      <View style={{alignItems: 'center', flexDirection: 'row'}}>
        {/*@ts-ignore*/}
        <AnimatedTextInput
          animation="fadeIn"
          duration={5000}
          autoFocus
          allowFontScaling={false}
          autoCapitalize="words"
          autoCorrect={false}
          blurOnSubmit
          dense
          maxLength={20}
          onChangeText={(text: string) => {
            getSuggestions(text);
            setSearchQuery(text);
          }}
          placeholder="Scan location"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          ref={codeInput}
          returnKeyType="search"
          selectionColor="rgba(255, 255, 115, 0.8)"
          style={{
            color: '#fff',
            borderColor: 'rgba(255, 255, 255, 1)',
            borderBottomWidth: loading ? 0 : 1,
            borderStyle: 'dashed',
            fontFamily: 'Abel-Regular',
            fontSize: RFPercentage(5),
            textAlign: 'center',
            width: deviceWidth * 0.9,
          }}
          value={searchQuery}
        />
      </View>

      <ProgressBar
        color="rgba(255, 255, 28 , 1)"
        indeterminate
        style={{
          borderRadius: 50,
          height: 3,
          width: deviceWidth * 0.7,
        }}
        visible={loading}
      />

      {searchQuery.length > 0 && (
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <Button
            labelStyle={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: 'Rubik-Bold',
              fontSize: 17,
            }}
            mode="text"
            onPress={() => (setSearchQuery(''), setLocations(null))}
            style={{marginTop: 18}}>
            CLEAR
          </Button>
          <Button
            labelStyle={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: 'Rubik-Bold',
              fontSize: 17,
            }}
            mode="text"
            onPress={() => getSuggestions(searchQuery)}
            style={{marginTop: 18}}>
            ENTER
          </Button>
        </View>
      )}
    </LinearGradient>
  );
};

export default ScanLocation;
