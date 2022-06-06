import React, {useCallback, useEffect, useState} from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  Vibration,
  View,
} from 'react-native';
import {
  Button,
  Card,
  FAB,
  IconButton,
  Modal,
  Portal,
  Provider,
  TextInput,
} from 'react-native-paper';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {SvgXml, Rect} from 'react-native-svg';
//import Barcode from '@kichiyaki/react-native-barcode-generator';
import LinearGradient from 'react-native-linear-gradient';
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient';
import {LinearTextGradient} from 'react-native-text-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useFonts} from 'expo-font';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import {BarCodeScanner} from 'expo-barcode-scanner';

import {storage} from '../App';

const Home = ({API, navigation}) => {
  const [locations, setLocations] = useState([]);
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [network, setNetwork] = useState({});

  const wait = timeout => {
    return new Promise(resolve => setTimeout(resolve, timeout));
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLocations();
    wait(2000).then(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    {
      Device.brand !== 'EA500' &&
        (async () => {
          const {status} = await BarCodeScanner.requestPermissionsAsync();
          setHasPermission(status === 'granted');
        })();
    }
    setInterval(() => {
      (async () => {
        const network = await Network.getNetworkStateAsync();
        setNetwork(network);
      })();
    }, 5000);
  }, []);

  useEffect(() => {
    setTimeout(() => fetchLocations(), 1000);
  }, []);

  useEffect(() => {
    barcode.length >= 8 ? handleSearch() : fetchLocations();
  }, [barcode]);

  const fetchLocations = () => {
    setLoading(true);

    fetch(`${API}Locations/?page=0&limit=3&start=0sort=PK`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${storage.getString('token')}`,
        'Content-Type': 'application/json',
      },
    }).then(res =>
      res
        .json()
        .then(data => {
          if (res.status > 200) {
            storage.delete('token');
            navigation.navigate('Login');
          } else {
            setLocations(data.data);
          }
        })
        .catch(e => Alert.alert('Server error!', e, [{text: 'OK'}]))
        .finally(() => setLoading(false)),
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'This will log you out. Proceed?', [
      {text: 'Cancel'},
      {
        text: 'OK',
        onPress: () => {
          storage.delete('token');
          navigation.navigate('Login');
        },
      },
    ]);
  };

  const [loaded] = useFonts({
    RubikRegular: require('../assets/fonts/Rubik-Regular.ttf'),
    RubikBold: require('../assets/fonts/Rubik-Bold.ttf'),
  });

  if (!loaded) {
    return null;
  }

  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);

  const handleSearch = () => {
    setLoading(true);

    fetch(`${API}Locations/Search/`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        token: storage.getString('token'),
        barcode,
      }),
    }).then(res =>
      res
        .text()
        .then(result => {
          switch (res.status) {
            case 401:
              Alert.alert('Unathorized!', result, [{text: 'OK'}]);
              break;
            default:
              setLocations(JSON.parse(result));
              break;
          }
        })
        .catch(err => {
          Alert.alert('Alert Title', err, [
            {text: 'OK', onPress: () => console.log('OK Pressed')},
          ]);
        })
        .finally(() => {
          setLoading(false);
        }),
    );
  };

  const handleBarCodeScanned = ({data}) => {
    Vibration.vibrate(100);
    hideModal();
    setBarcode(data);
  };

  /*  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  } */

  const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="144 0 240 320">
                <path fill="#0099ff" fill-opacity="1" d="M0,32L30,69.3C60,107,120,181,180,213.3C240,245,300,235,360,208C420,181,480,139,540,149.3C600,160,660,224,720,245.3C780,267,840,245,900,218.7C960,192,1020,160,1080,170.7C1140,181,1200,235,1260,218.7C1320,203,1380,117,1410,74.7L1440,32L1440,0L1410,0C1380,0,1320,0,1260,0C1200,0,1140,0,1080,0C1020,0,960,0,900,0C840,0,780,0,720,0C660,0,600,0,540,0C480,0,420,0,360,0C300,0,240,0,180,0C120,0,60,0,30,0L0,0Z"></path>
              </svg>`;

  return (
    <>
      <View style={{alignItems: 'center'}}>
        <StatusBar
          animated={true}
          backgroundColor="#0099ff"
          barStyle="light-content"
          showHideTransition="fade"
        />
        <SvgXml
          xml={SVG}
          style={{
            top: -Dimensions.get('screen').height * 0.3,
            position: 'absolute',
            zIndex: -1,
          }}
        />
        <IconButton
          icon="logout-variant"
          color="white"
          size={30}
          onPress={handleLogout}
          style={{
            position: 'absolute',
            right: 10,
            top: 10,
          }}
        />
        <Text
          style={{
            color: '#fff',
            fontFamily: 'RubikBold',
            fontSize: RFPercentage(4),
            marginBottom: 15,
            marginTop: 50,
          }}>
          Locations
        </Text>
        <TextInput
          autoFocus={true}
          error={barcode.length >= 6 ? false : true}
          left={
            <TextInput.Icon
              name="shield-search"
              style={{marginTop: 6, opacity: 0.5}}
            />
          }
          mode="outlined"
          //onEndEditing={handleSearch}
          onChangeText={text => setBarcode(text)}
          //onSubmitEditing={handleSearch}
          placeholder="Scan Location"
          right={
            <TextInput.Icon
              name="close"
              onPress={() => setBarcode('')}
              style={{marginTop: 6, opacity: 0.5}}
            />
          }
          style={{
            borderRadius: 50,
            borderTopStartRadius: 50,
            borderTopEndRadius: 50,
            marginBottom: 30,
            width: Dimensions.get('window').width * 0.8,
          }}
          value={barcode}
        />
        {Device.brand !== 'EA500' && (
          <Button
            labelStyle={{fontFamily: 'RubikRegular', fontSize: RFPercentage(2)}}
            mode="contained"
            onPress={showModal}
            style={{
              borderRadius: 10,
              elevation: 0,
              marginBottom: 20,
              paddingVertical: 6,
              width: 230,
            }}>
            ... OR SCAN LOCATION
          </Button>
        )}
        {loading ? (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            style={{
              minHeight: '100%',
            }}>
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 10,
                margin: 15,
                marginBottom: 30,
                minWidth: Dimensions.get('window').width * 0.9,
                padding: 20,
              }}>
              <SvgAnimatedLinearGradient
                primaryColor="#e8f7ff"
                secondaryColor="#4dadf7"
                height={25}>
                <Rect x="0" y="5" rx="4" ry="4" width="200" height="15" />
              </SvgAnimatedLinearGradient>
              <SvgAnimatedLinearGradient
                primaryColor="#e8f7ff"
                secondaryColor="#4dadf7"
                height={15}>
                <Rect x="0" y="5" rx="4" ry="4" width="200" height="15" />
              </SvgAnimatedLinearGradient>
              <SvgAnimatedLinearGradient
                primaryColor="#e8f7ff"
                secondaryColor="#4dadf7"
                height={15}>
                <Rect x="0" y="5" rx="4" ry="4" width="200" height="15" />
              </SvgAnimatedLinearGradient>
              <SvgAnimatedLinearGradient
                primaryColor="#e8f7ff"
                secondaryColor="#4dadf7"
                height={75}>
                <Rect x="50" y="15" rx="4" ry="4" width="200" height="55" />
              </SvgAnimatedLinearGradient>
              <SvgAnimatedLinearGradient
                primaryColor="#e8f7ff"
                secondaryColor="#4dadf7"
                height={80}>
                <Rect x="0" y="20" rx="4" ry="4" width="60" height="10" />
                <Rect x="0" y="40" rx="4" ry="4" width="40" height="40" />
              </SvgAnimatedLinearGradient>
            </View>
          </ScrollView>
        ) : (
          <FlatList
            data={locations}
            contentContainerStyle={{
              minHeight: '100%',
              paddingBottom: 200,
            }}
            keyExtractor={(item, index) => index.toString()}
            ListEmptyComponent={() => (
              <LinearGradient
                colors={['#232526', '#414345']}
                useAngle={true}
                angle={45}
                style={{
                  borderRadius: 20,
                  minWidth: Dimensions.get('window').width * 0.9,
                  padding: 20,
                }}>
                <View
                  style={{
                    alignItems: 'center',
                    height: 300,
                    justifyContent: 'center',
                  }}>
                  <MaterialCommunityIcons
                    name="alert-decagram-outline"
                    size={50}
                    style={{marginBottom: 10}}
                  />
                  <Text
                    style={{
                      fontFamily: 'RubikBold',
                      fontSize: RFPercentage(2),
                    }}>
                    Location(s) could not be found.
                  </Text>
                </View>
              </LinearGradient>
            )}
            initialNumToRender={3}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({item}) => (
              <Card
                elevation={10}
                style={{
                  borderRadius: 20,
                  margin: 15,
                  marginBottom: 30,
                  minWidth: Dimensions.get('window').width * 0.9,
                }}>
                <LinearGradient
                  colors={['#fef9d7', '#B5FFFC']}
                  useAngle={true}
                  angle={45}
                  style={{borderRadius: 20, padding: 20}}>
                  <LinearTextGradient
                    style={{fontFamily: 'RubikBold', fontSize: RFPercentage(4)}}
                    locations={[0, 1]}
                    colors={['#667eea', '#43e97b']}
                    start={{x: 0, y: 1}}
                    end={{x: 1, y: 0}}>
                    <Text>{item.barcode}</Text>
                  </LinearTextGradient>
                  <Text
                    style={{
                      color: 'black',
                      fontFamily: 'RubikRegular',
                      fontSize: RFPercentage(2.5),
                      opacity: 0.5,
                    }}>
                    Store: {item.store}
                  </Text>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 10,
                    }}>
                    <FAB
                      icon="camera-plus"
                      onPress={() =>
                        navigation.navigate('Scanner', {
                          LocationPK: item.PK,
                          LocationBarcode: item.barcode,
                          SystemCount: item.SystemCount,
                        })
                      }
                      style={{
                        bottom: -40,
                        position: 'absolute',
                        right: 0,
                        borderWidth: 1,
                        borderColor: '#fff',
                      }}
                    />
                    <View
                      style={{
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}>
                      <Text
                        style={{
                          color: 'black',
                          fontFamily: 'RubikRegular',
                          fontSize: RFPercentage(2),
                        }}>
                        System count
                      </Text>
                      <LinearTextGradient
                        style={{
                          fontFamily: 'RubikBold',
                          fontSize: RFPercentage(6.5),
                          textAlign: 'right',
                        }}
                        locations={[0, 1]}
                        colors={['#ff5858', '#16a085']}
                        start={{x: 0, y: 1}}
                        end={{x: 1, y: 0}}>
                        <Text>{item.SystemCount}</Text>
                      </LinearTextGradient>
                    </View>
                  </View>
                </LinearGradient>
              </Card>
            )}
          />
        )}
      </View>

      <Provider>
        <Portal>
          <Modal
            visible={visible}
            onDismiss={hideModal}
            contentContainerStyle={{
              backgroundColor: 'black',
              margin: 50,
            }}>
            <View style={{height: Dimensions.get('window').height * 0.67}}>
              <BarCodeScanner
                onBarCodeScanned={handleBarCodeScanned}
                style={StyleSheet.absoluteFillObject}
              />
            </View>
          </Modal>
        </Portal>
      </Provider>
    </>
  );
};

export default Home;
