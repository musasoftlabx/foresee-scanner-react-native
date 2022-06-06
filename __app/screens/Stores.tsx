// ? Import React & Hooks
import React, {useCallback, useState} from 'react';

// ? Import React Native Libraries
import {
  Alert,
  Dimensions,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import {ProgressBar} from 'react-native-paper';
import {FlatList, TouchableNativeFeedback} from 'react-native-gesture-handler';
import {RFPercentage} from 'react-native-responsive-fontsize';
import debounce from 'lodash.debounce';
import LinearGradient from 'react-native-linear-gradient';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Animatable from 'react-native-animatable';

// ? Register Animations
const AnimatedClearIcon = Animatable.createAnimatableComponent(MCI);
const AnimatedLogoutIcon = Animatable.createAnimatableComponent(MCI);
const AnimatedTextInput = Animatable.createAnimatableComponent(TextInput);

// ? Import Utilities
import {AuthContext, api, storage} from '../../App';
import {handleError, timedFetch} from '../utils';

// ? Start Component
export default function Stores({navigation}: {navigation: any}) {
  // * useStates
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stores, setStores] = useState(null);

  // * useContexts
  const {dispatch} = React.useContext(AuthContext);

  // * useCallbacks
  // ? Get debounced suggestions
  const getSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setStores(null);
      return;
    }

    setLoading(true);

    timedFetch()(
      fetch(`${api}Stores/?query=${query}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${storage.getString('token')}`,
          'Content-Type': 'application/json',
        },
      }),
    )
      .then(response => {
        if (response.ok) return response.json();
        return response.json().then((error: any) => {
          setLoading(false);
          throw new Error(JSON.stringify(error));
        });
      })
      .then(data => setStores(data))
      .catch(error => handleError(error))
      .finally(() => setLoading(false));
  }, []);

  // ? Debounce entry
  const debounced = useCallback(debounce(getSuggestions, 500), []);

  return (
    // @ts-ignore: Props error
    <LinearGradient
      colors={['#005C97', '#11B4A7']}
      style={{alignItems: 'center', flex: 1, justifyContent: 'center'}}>
      <StatusBar
        animated
        backgroundColor="#005F9C"
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
          onChangeText={(text: string) => (
            debounced(text), setSearchQuery(text)
          )}
          placeholder="Search store"
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
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
            width: Dimensions.get('window').width * 0.7,
          }}
          value={searchQuery}
        />

        {searchQuery.length > 0 ? (
          // @ts-ignore
          <AnimatedClearIcon
            animation="slideInRight"
            color="#fff"
            name="close"
            onPress={() => (setSearchQuery(''), setStores(null))}
            size={30}
            style={{
              bottom: 15,
              opacity: 0.4,
              position: 'absolute',
              right: 0,
            }}
          />
        ) : (
          // @ts-ignore
          <AnimatedClearIcon
            animation="fadeOut"
            color="#fff"
            name="close"
            size={30}
            style={{
              bottom: 15,
              opacity: 0.4,
              position: 'absolute',
              right: 0,
            }}
          />
        )}
      </View>

      <ProgressBar
        color="rgba(255, 255, 28 , 1)"
        indeterminate
        style={{
          borderRadius: 50,
          height: 3,
          width: Dimensions.get('window').width * 0.7,
        }}
        visible={loading}
      />

      {stores && stores.length > 0 && (
        // @ts-ignore
        <Animatable.View
          animation="fadeInUpBig"
          style={{
            borderColor: '#fff',
            borderRadius: 10,
            borderWidth: 0.3,
            maxHeight: Dimensions.get('window').height * 0.4,
            marginTop: 10,
            overflow: 'hidden',
            width: Dimensions.get('window').width * 0.9,
          }}>
          <FlatList
            data={stores}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  borderBottomColor: 'rgba(255, 255, 255, 0.5)',
                  borderBottomWidth: 0.2,
                }}
              />
            )}
            keyExtractor={(item: {id: number}) => item.id}
            renderItem={({item: store}) =>
              store.name.toLowerCase().includes(searchQuery.toLowerCase()) && (
                <TouchableNativeFeedback
                  onPress={() => {
                    setStores(null);
                    navigation.navigate('Locations', {
                      code: store.code,
                      name: store.name,
                      storeId: store.id,
                    });
                  }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 15,
                    }}>
                    {/*// @ts-ignore */}
                    <LinearGradient
                      colors={['#ffff1c', '#00c3ff']}
                      useAngle={true}
                      angle={45}
                      style={{borderRadius: 50, marginRight: 10}}>
                      <MCI
                        color="white"
                        name="domain"
                        size={24}
                        style={{padding: 10}}
                      />
                    </LinearGradient>
                    <View style={{flex: 10, overflow: 'hidden'}}>
                      <Text
                        numberOfLines={1}
                        style={{
                          color: 'rgba(135, 249, 239 , 1)',
                          fontFamily: 'Rubik-Regular',
                          fontSize: RFPercentage(2.5),
                        }}>
                        {store.name}
                      </Text>
                      <Text
                        numberofLines={1}
                        style={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontFamily: 'Rubik-Regular',
                          fontSize: RFPercentage(2),
                        }}>
                        Located in {store.country}
                      </Text>
                    </View>
                    <View style={{flex: 1}} />
                    <View>
                      <Text
                        numberofLines={1}
                        style={{
                          color: 'rgba(255, 255, 28 , 0.7)',
                          fontFamily: 'Rubik-Bold',
                          fontSize: RFPercentage(2.3),
                        }}>
                        {store.code}
                      </Text>
                    </View>
                  </View>
                </TouchableNativeFeedback>
              )
            }
          />
        </Animatable.View>
      )}

      {stores && !stores.length && searchQuery.length > 2 && !loading && (
        <View style={{alignItems: 'center', marginTop: 50}}>
          <MCI color="#FBF858" name="progress-alert" size={60} />
          <Text
            style={{
              color: '#FBF858',
              fontFamily: 'Rubik-Regular',
              fontSize: RFPercentage(3),
              marginTop: 3,
            }}>
            Store not found
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}
