// ? Import React & Hooks
import React, {useEffect, useState} from 'react';

// ? Import React Native Libraries
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  Image,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import {Card} from 'react-native-paper';
import {LineChart} from 'react-native-chart-kit';
import {RectButton} from 'react-native-gesture-handler';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';
import AnimateNumber from 'react-native-animate-number';
import LinearGradient from 'react-native-linear-gradient';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaskedView from '@react-native-masked-view/masked-view';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import * as Animatable from 'react-native-animatable';

// ? Register Animations
const AnimatableFlatList = Animatable.createAnimatableComponent(FlatList);
const AnimatedClearIcon = Animatable.createAnimatableComponent(MCI);

// ? Import Utilities
import {api, controller, storage} from '../../App';
import {errorMessage, handleError, timedFetch} from '../utils';

// ? Import Components
import CircularProgress from '../components/CircularProgress';
import CircularLoader from '../components/CircularLoader';
import ResourceError from '../assets/icons/resource_error.png';

const Locations = ({navigation, route}) => {
  const {code, name, storeId} = route.params;

  const [chart, setChart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [locations, setLocations] = useState(null);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState('PK');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState([
    {
      colors: ['#3CB371', '#98FB98'],
      count: 0,
      icon: require(`../assets/physical_count.png`),
      name: 'Physical Count',
    },
    {
      colors: ['#4169E1', '#00BFFF'],
      count: 0,
      icon: require(`../assets/system_count.png`),
      name: 'System Count',
    },
    {
      colors: ['#B22222', '#F08080'],
      count: 0,
      icon: require(`../assets/discrepancy.png`),
      name: 'Discrepancies',
    },
  ]);

  const scrollY = React.useRef(new Animated.Value(0)).current;

  // ? Pull to Refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    setLocations(null);
    setTimeout(() => {
      fetchLocations();
      setRefreshing(false);
    }, 2000);
  };

  const fetchLocations = () => {
    if (searchQuery.length === 0) {
      locations ? setLoadingMore(true) : setLoading(true);

      console.log(page);

      const uri = `[{"operator": "eq", "value": "${storeId}", "property": "storeFK"}]`;

      const filter = encodeURI(uri);

      timedFetch()(
        fetch(
          `${api}Locations/?filter=${filter}&page=${page}&limit=${limit}&offset=${offset}&sort=${sort}`,
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${storage.getString('token')}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          },
        ),
      )
        .then(response => {
          if (response.status > 200) {
            throw new Error(`${response.status}. ${errorMessage}`);
          }
          return response.json();
        })
        .then(data => {
          console.log(data.cumulativeCount);
          setPage(prevState => prevState + 1);

          locations
            ? setLocations(prevState => [...prevState, ...data.data])
            : setLocations(data.data);

          Object.entries(data.cumulativeCount).forEach(entry => {
            const [key, value] = entry;
            setStats(prevState => {
              return prevState.map(item => {
                if (item.name === key) {
                  return {
                    ...item,
                    count: value,
                  };
                }
                return item;
              });
            });
          });
        })
        .catch(error => handleError(error))
        .finally(() => (locations ? setLoadingMore(false) : setLoading(false)));

      return () => controller.abort();
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{alignItems: 'center', flexDirection: 'row'}}>
          <MaterialIcons
            name="search"
            size={24}
            color="grey"
            style={{marginRight: 20}}
          />
          <TextInput
            autoCapitalize="characters"
            maxLength={6}
            onChangeText={(text: string) => {
              setSearchQuery(text);
            }}
            placeholder="Search Locations"
            placeholderTextColor="rgba(0, 0, 0, 0.5)"
            returnKeyType="search"
            style={{
              color: '#000',
              fontFamily: 'Rubik-Regular',
              fontSize: RFPercentage(2.5),
              width: Dimensions.get('window').width * 0.55,
            }}
            value={searchQuery}
          />
          {searchQuery.length > 0 ? (
            <AnimatedClearIcon
              animation="slideInRight"
              // @ts-ignore: Props error
              name="close"
              onPress={() => setSearchQuery('')}
              size={26}
              style={{
                color: 'rgba(0, 0, 0, 0.3)',
                position: 'absolute',
                right: 0,
              }}
            />
          ) : (
            <AnimatedClearIcon
              animation="fadeOut"
              // @ts-ignore: Props error
              name="close"
              size={26}
              style={{
                color: 'rgba(0, 0, 0, 0.3)',
                position: 'absolute',
                right: 0,
              }}
            />
          )}
        </View>
      ),
      /* headerSearchBarOptions: {
        onChangeText: event => setBarcode(event.nativeEvent.text),
        autoCapitalize: 'characters',
        placeholder: 'Search Locations',
        textColor: '#000',
        hintTextColor: '#000',
        headerIconColor: '#000',
      }, */
      headerRight: () => (
        <View style={{alignItems: 'center', flexDirection: 'row'}}>
          <MCI
            name="logout-variant"
            size={24}
            color="grey"
            style={{marginRight: 20}}
            onPress={() => handleLogout()}
          />
        </View>
      ),
    });
  }, [navigation, searchQuery]);

  useEffect(() => {
    fetchLocations();
  }, []);

  // ? Search Locations
  useEffect(() => {
    if (searchQuery.length > 1) {
      setLoading(true);

      const uri = `[{"operator": "eq", "value": "${searchQuery}", "property": "barcode"}]`;

      const filter = encodeURI(uri);

      timedFetch()(
        fetch(
          `${api}Locations/?filter=${filter}&page=${page}&limit=${limit}&offset=${offset}&sort=${sort}`,
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${storage.getString('token')}`,
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
          },
        ),
      )
        .then(response => {
          if (response.status > 200) {
            throw new Error(`${response.status}. ${errorMessage}`);
          }
          return response.json();
        })
        .then(data => {
          console.log(data.cumulativeCount);
          setLocations(data.data);

          Object.entries(data.cumulativeCount).forEach(entry => {
            const [key, value] = entry;
            setStats((prevState: any[]) => {
              return prevState.map(item => {
                if (item.name === key) {
                  return {
                    ...item,
                    count: value,
                  };
                }
                return item;
              });
            });
          });
        })
        .catch(error => handleError(error))
        .finally(() => setLoading(false));

      return () => controller.abort();
    }
  }, [searchQuery]);

  const handleReset = (entity: string, key: number) => {
    console.log(entity, key);
    return false;
    fetch(`${api}Locations/`, {
      body: JSON.stringify({entity, key}),
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${storage.getString('token')}`,
        'Content-Type': 'application/json',
      },
      method: 'DELETE',
      signal: controller.signal,
    })
      .then(response => {
        if (response.status > 200) {
          throw new Error('Couldnt fetch data');
        }
        return response.json();
      })
      .then(data => setLocations(data.data))
      .catch(error => {
        setError(true);
        Alert.alert('Server error!', error, [{text: 'OK'}]);
      })
      .finally(() => setLoading(false));

    return () => controller?.abort();
  };

  return (
    <View style={{flex: 1}}>
      <StatusBar
        animated={true}
        backgroundColor="#fff"
        barStyle="dark-content"
        showHideTransition="fade"
      />

      <Animated.View
        style={{
          paddingTop: 15,
          /* transform: [
            {
              scale: scrollY.interpolate({
                inputRange: [-1, 0, 150 * 1, 150 * (1 + 2)],
                outputRange: [1, 1, 1, 0],
              }),
            },
          ], */
        }}>
        <Animated.Text
          style={{
            color: 'rgba(0, 0, 0, 0.5)',
            fontFamily: 'Rubik-Regular',
            fontSize: RFPercentage(3),
            marginBottom: 3,
            textAlign: 'center',
          }}>
          {code}
        </Animated.Text>

        <Text
          style={{
            color: '#000',
            fontFamily: 'Abel-Regular',
            fontSize: RFPercentage(4),
            marginBottom: 10,
            textAlign: 'center',
          }}>
          {name}
        </Text>

        <AnimatableFlatList
          animation="slideInRight"
          data={stats}
          duration={1000}
          easing="ease-in-out"
          horizontal
          renderItem={({item, i}) => (
            // @ts-ignore
            <LinearGradient
              angle={45}
              colors={item.colors}
              key={i}
              style={{
                borderRadius: 10,
                backgroundColor: 'rgba(10, 10, 20, 0.5)',
                flexGrow: 1,
                marginHorizontal: 5,
                marginTop: 5,
                overflow: 'hidden',
                width: Dimensions.get('window').width / 2.5,
              }}
              useAngle={true}>
              <View
                style={{
                  flexDirection: 'row',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  overflow: 'hidden',
                }}>
                <View>
                  <Text
                    numberOfLines={1}
                    style={{fontFamily: 'Abel-Regular', fontSize: 18}}>
                    {item.name}
                  </Text>
                  <AnimateNumber
                    countBy={10}
                    formatter={val => val.toLocaleString()}
                    interval={5}
                    style={{fontFamily: 'Rubik-Regular', fontSize: 30}}
                    timing="easeOut"
                    value={item.count}
                  />
                </View>
                <View style={{flex: 1}} />
                <Image
                  source={item.icon}
                  style={{
                    width: 75,
                    height: 75,
                    position: 'absolute',
                    right: -15,
                    top: 30,
                    opacity: 0.8,
                  }}
                />
              </View>
            </LinearGradient>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </Animated.View>

      {loading ? (
        <CircularLoader position="center" />
      ) : (
        <Animated.FlatList
          contentContainerStyle={{marginTop: 20}}
          data={locations}
          keyExtractor={(item: object, i: number) => i.toString()}
          //initialNumToRender={10}
          ListEmptyComponent={
            <View
              style={{
                alignItems: 'center',
                height: Dimensions.get('window').height * 0.6,
                justifyContent: 'center',
              }}>
              <Image
                resizeMode="contain"
                source={ResourceError}
                style={{
                  height: 100,
                  opacity: 0.7,
                  width: 100,
                }}
              />
              <Text
                style={{
                  color: 'rgba(0, 0, 0, 0.4)',
                  fontFamily: 'Rubik-Regular',
                  fontSize: RFPercentage(2.5),
                  marginTop: 10,
                }}>
                Location was not found.
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore && (
              <ActivityIndicator
                color="purple"
                size="large"
                style={{marginTop: 50}}
              />
            )
          }
          onEndReached={() => {
            fetchLocations();
          }}
          onScroll={Animated.event(
            [
              {
                nativeEvent: {
                  contentOffset: {
                    y: scrollY,
                  },
                },
              },
            ],
            {useNativeDriver: false},
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({item: location, index}) => {
            const itemSize = 120;
            const inputRange = [
              -1,
              0,
              itemSize * index,
              itemSize * (index + 2),
            ];
            const opacityInputRange = [
              -1,
              0,
              itemSize * index,
              itemSize * (index + 1),
            ];
            const scale = scrollY.interpolate({
              inputRange,
              outputRange: [1, 1, 1, 0],
            });
            const opacity = scrollY.interpolate({
              inputRange: opacityInputRange,
              outputRange: [1, 1, 1, 0],
            });

            return (
              <>
                {/* // ? Activate or Deactivate chart */}
                {chart && (
                  <LineChart
                    bezier
                    chartConfig={{
                      backgroundColor: 'transparent',
                      backgroundGradientFrom: '#fff',
                      backgroundGradientTo: '#fff',
                      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      decimalPlaces: 0,
                      fillShadowGradientFrom: '#33FFEC',
                      fillShadowGradientTo: '#FCDE00',
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      propsForDots: {
                        backgroundColor: '#fff',
                        r: '6',
                        stroke: '#ffa726',
                        strokeWidth: 2,
                      },
                      propsForLabels: {
                        fontSize: 12,
                        fontFamily: 'Rubik-Regular',
                        opacity: 0.5,
                      },
                      style: {
                        borderRadius: 16,
                      },
                    }}
                    data={{
                      labels: [
                        'Mar 2022',
                        'Sep 2022',
                        'Mar 2023',
                        'Sep 2023               ',
                      ],
                      datasets: [
                        {
                          data: [30, 67, 21, 108],
                        },
                      ],
                    }}
                    height={200}
                    style={{
                      borderRadius: 16,
                      marginTop: 25,
                      marginLeft: -25,
                    }}
                    width={
                      Dimensions.get('window').width +
                      Dimensions.get('window').width / 3
                    }
                    withHorizontalLines={true}
                    withVerticalLines={true}
                    yAxisInterval={1}
                    yAxisLabel=""
                    yAxisSuffix=""
                  />
                )}

                {/* // ? Locations */}
                <Swipeable
                  leftThreshold={100}
                  onSwipeableOpen={direction => console.log(direction)}
                  rightThreshold={100}
                  renderLeftActions={(progress, dragX) => {
                    const trans = dragX.interpolate({
                      inputRange: [0, 50, 100, 101],
                      outputRange: [0, 0, 0, 1],
                    });
                    return (
                      <RectButton
                        onPress={() => {
                          Alert.alert(
                            'Reset Physical Count',
                            'Proceed to reset physical count in this location?',
                            [
                              {text: 'NO'},
                              {
                                text: 'YES',
                                onPress: () =>
                                  handleReset('physical', location.PK),
                              },
                            ],
                          );
                        }}
                        style={{
                          alignItems: 'center',
                          flexDirection: 'row',
                          height: '80%',
                          justifyContent: 'center',
                        }}>
                        <Animated.View
                          style={{
                            marginHorizontal: 20,
                            overflow: 'hidden',
                            transform: [{translateX: trans}],
                          }}>
                          <LinearGradient
                            angle={45}
                            colors={['#654ea3', '#eaafc8']}
                            useAngle={true}
                            style={{
                              alignItems: 'center',
                              borderRadius: 20,
                              height: 70,
                              justifyContent: 'center',
                              width: 70,
                            }}>
                            <Text
                              style={{
                                fontFamily: 'Rubik-Bold',
                                fontSize: RFPercentage(2),
                                paddingHorizontal: 5,
                                textAlign: 'center',
                              }}>
                              RESET
                            </Text>
                          </LinearGradient>
                        </Animated.View>
                      </RectButton>
                    );
                  }}
                  renderRightActions={(progress, dragX) => {
                    const trans = dragX.interpolate({
                      inputRange: [-100, 50, 100, 101],
                      outputRange: [-10, 0, 0, 1],
                    });
                    return (
                      <>
                        <RectButton
                          onPress={() => {
                            console.log('hello');
                          }}
                          style={{
                            alignItems: 'center',
                            flexDirection: 'row',
                            height: '80%',
                            justifyContent: 'center',
                          }}>
                          <Animated.View
                            style={{
                              overflow: 'hidden',
                              transform: [{translateX: trans}],
                            }}>
                            <LinearGradient
                              angle={45}
                              colors={['#00F260', '#0575E6']}
                              useAngle={true}
                              style={{
                                alignItems: 'center',
                                borderRadius: 20,
                                height: 70,
                                justifyContent: 'center',
                                width: 70,
                              }}>
                              <Text
                                style={{
                                  fontFamily: 'Rubik-Bold',
                                  fontSize: RFPercentage(2),
                                  paddingHorizontal: 5,
                                  textAlign: 'center',
                                }}>
                                RESCAN
                              </Text>
                            </LinearGradient>
                          </Animated.View>
                        </RectButton>
                      </>
                    );
                  }}>
                  <Animated.View
                    key={location.PK}
                    style={{paddingHorizontal: 20, transform: [{scale}]}}>
                    <Card
                      elevation={10}
                      style={{
                        borderRadius: 20,
                        marginBottom: 30,
                        opacity,
                        overflow: 'hidden',
                      }}>
                      <TouchableNativeFeedback>
                        <RectButton
                          onPress={() =>
                            navigation.navigate('Location', {
                              location: location.barcode,
                              PhysicalCount: location.PhysicalCount,
                              SystemCount: location.SystemCount,
                              discrepancy: location.discrepancy,
                            })
                          }
                          rippleColor={
                            location.PhysicalCount > location.SystemCount
                              ? 'rgb(222, 184, 135)'
                              : 'rgb(250, 128, 114)'
                          }>
                          <LinearGradient
                            angle={45}
                            colors={
                              location.PhysicalCount > location.SystemCount
                                ? ['rgba(222, 184, 135, 0.5)', '#fff']
                                : location.SystemCount > location.PhysicalCount
                                ? ['rgba(250, 128, 114, 0.3)', '#fff']
                                : ['#fff', '#fff']
                            }
                            style={{borderRadius: 20, padding: 20}}
                            useAngle={true}>
                            <View
                              style={{
                                alignItems: 'center',
                                flexDirection: 'row',
                              }}>
                              <View style={{marginRight: 15}}>
                                <CircularProgress
                                  size={50}
                                  strokeWidth={5}
                                  text={location.discrepancy}
                                />
                              </View>
                              <View>
                                <MaskedView
                                  style={{flex: 1, flexDirection: 'row'}}
                                  maskElement={
                                    <Text
                                      style={{
                                        fontFamily: 'Abel-Regular',
                                        fontSize: RFPercentage(3.5),
                                      }}>
                                      {location.barcode}
                                    </Text>
                                  }>
                                  <LinearGradient
                                    colors={['#667eea', '#43e97b']}
                                    start={{x: 0, y: 1}}
                                    end={{x: 1, y: 0}}
                                    style={{flex: 1}}
                                  />
                                </MaskedView>

                                <Text
                                  style={{
                                    color: 'rgb(0 ,0 ,0)',
                                    fontFamily: 'Rubik-Regular',
                                    fontSize: RFPercentage(2),
                                    marginBottom: 5,
                                    opacity: 0.5,
                                  }}>
                                  Modified on {location.ModifiedOn}
                                </Text>
                              </View>
                              <View style={{flex: 1}} />
                              <View style={{justifyContent: 'flex-end'}}>
                                <View
                                  style={{
                                    alignItems: 'center',
                                    flex: 1,
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                  }}>
                                  <Text
                                    style={{
                                      color: 'black',
                                      fontFamily: 'Rubik-Regular',
                                      fontSize: RFPercentage(1.5),
                                      marginTop: 3,
                                    }}>
                                    Phys / Sys
                                  </Text>

                                  <MaskedView
                                    maskElement={
                                      <Text
                                        numberOfLines={1}
                                        style={{
                                          fontFamily: 'Abel-Regular',
                                          fontSize: RFPercentage(4),
                                        }}>
                                        {location.PhysicalCount}/
                                        {location.SystemCount}
                                      </Text>
                                    }
                                    style={{
                                      flex: 1,
                                      flexDirection: 'row',
                                      width: 70,
                                    }}>
                                    <LinearGradient
                                      colors={['#ff5858', '#16a085']}
                                      start={{x: 0, y: 1}}
                                      end={{x: 1, y: 0}}
                                      style={{flex: 1}}
                                    />
                                  </MaskedView>
                                </View>
                              </View>
                            </View>
                          </LinearGradient>
                        </RectButton>
                      </TouchableNativeFeedback>
                    </Card>
                  </Animated.View>
                </Swipeable>
              </>
            );
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default Locations;
