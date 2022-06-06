// ? Import React & Hooks
import React, {useEffect, useState, useRef} from 'react';

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
  Vibration,
} from 'react-native';
import {Button, Card, Modal, Portal, Provider} from 'react-native-paper';
import {RectButton, TouchableOpacity} from 'react-native-gesture-handler';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';
import debounce from 'lodash.debounce';
import LinearGradient from 'react-native-linear-gradient';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import * as Animatable from 'react-native-animatable';

// ? Register Animations
const AnimatableFlatList = Animatable.createAnimatableComponent(FlatList);
const AnimatedClearIcon = Animatable.createAnimatableComponent(MCI);

// ? Import Utilities
import {AuthContext, api, controller, storage} from '../../App';
import {handleError, timedFetch} from '../utils';

// ? Import Components
import CircularProgress from '../components/CircularProgress';
import CircularLoader from '../components/CircularLoader';
import GradientText from '../components/GradientText';
import ResourceError from '../assets/icons/resource_error.png';

let onEndReachedCalledDuringMomentum = true;

export default function Locations({navigation, route}) {
  // * useParams
  const {code, name, storeId} = route.params;

  // * useStates
  const [loading, setLoading] = useState(false);
  const [loadingUpdateCount, setLoadingUpdateCount] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [locations, setLocations] = useState(null);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState('id');
  const [searchQuery, setSearchQuery] = useState('');
  const [isListEnd, setIsListEnd] = useState(false);
  const [visible, setVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState([
    {
      color: '#fff',
      colors: ['#8a5bea', '#45e0ff'],
      count: 0,
      filters: [],
      icon: require(`../assets/icons/total.png`),
      name: 'Total',
      onPress: () => {
        storage.set('filterLocationsBy', 'Total');
        fetchLocations([]);
      },
    },
    {
      color: '#fff',
      colors: ['#3CB371', '#98FB98'],
      count: 0,
      filters: [
        {
          operator: 'custom',
          property: 'counted',
          value: 1,
        },
      ],
      icon: require(`../assets/icons/counted.png`),
      name: 'Counted',
      onPress: () => {
        storage.set('filterLocationsBy', 'Counted');
        fetchLocations([
          {
            operator: 'custom',
            property: 'counted',
            value: 1,
          },
        ]);
      },
    },
    {
      border: 1,
      color: 'rgba(0, 0, 0, 0.5)',
      colors: ['#fafafa', '#FFF'],
      count: 0,
      filters: [
        {
          operator: 'eq',
          property: 'isVerified',
          value: 0,
        },
        {
          operator: 'eq',
          property: 'systemCount',
          value: 0,
        },
      ],
      icon: require(`../assets/icons/not_counted.png`),
      name: 'Not Counted',
      onPress: () => {
        storage.set('filterLocationsBy', 'Not Counted');
        fetchLocations([
          {
            operator: 'eq',
            property: 'isVerified',
            value: 0,
          },
          {
            operator: 'eq',
            property: 'systemCount',
            value: 0,
          },
        ]);
      },
    },
    {
      color: '#fff',
      colors: ['#B22222', '#F08080'],
      count: 0,
      filters: [
        {
          operator: 'custom',
          property: 'discrepancy',
          value: 0,
        },
      ],
      icon: require(`../assets/icons/discrepancy.png`),
      name: 'Discrepancies',
      onPress: () => {
        storage.set('filterLocationsBy', 'Discrepancies');
        fetchLocations([
          {
            operator: 'custom',
            property: 'discrepancy',
            value: 0,
          },
        ]);
      },
    },
  ]);

  // * useContexts
  const {dispatch} = React.useContext(AuthContext);

  // * useEffects
  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{alignItems: 'center', flexDirection: 'row'}}>
          <MaterialIcons
            color="grey"
            name="search"
            size={24}
            style={{marginRight: 20}}
          />
          <TextInput
            autoCapitalize="characters"
            maxLength={5}
            //onChangeText={(text: string) => setSearchQuery(text)}
            onChangeText={(text: string) => (
              debounced(text), setSearchQuery(text)
            )}
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
            // @ts-ignore
            <AnimatedClearIcon
              animation="slideInRight"
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
            // @ts-ignore
            <AnimatedClearIcon
              animation="fadeOut"
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
      headerRight: () => (
        <View style={{alignItems: 'center', flexDirection: 'row'}}>
          <MCI
            name="logout-variant"
            size={24}
            color="grey"
            style={{marginRight: 20}}
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
        </View>
      ),
    });
  }, [navigation, searchQuery]);

  useEffect(() => {
    getSuggestions('');
  }, []);

  const getSuggestions = React.useCallback(async (query: string) => {
    if (query.length > 0) {
      setLoading(true);

      const statics = [
        {
          operator: 'rx',
          property: 'code',
          value: `${query}`,
        },
      ];

      const filter = encodeURI(JSON.stringify(statics));

      timedFetch()(
        fetch(
          `${api}Locations/?filter=${filter}&page=${0}&limit=${limit}&order=${0}&sort=${sort}`,
          {
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${storage.getString('token')}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      )
        .then(response => {
          if (response.ok) return response.json();
          return response.json().then((error: any) => {
            throw new Error(JSON.stringify(error));
          });
        })
        .then(data => {
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
    } else {
      const name = storage.getString('filterLocationsBy');
      !name
        ? fetchLocations(stats[0].filters)
        : fetchLocations(
            stats[stats.findIndex((item: any) => item.name === name)].filters,
          );
    }
  }, []);

  // * Functions
  const showModal = ({
    index,
    id,
    count,
  }: {
    index: number;
    id: number;
    count: string;
  }) => {
    setSelectedLocation({index, id, count});
    setVisible(true);
  };

  const scrollY = useRef(new Animated.Value(0)).current;
  const LocationsFlatList = useRef();

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      const name = storage.getString('filterLocationsBy');

      !name
        ? fetchLocations(stats[0].filters)
        : fetchLocations(
            stats[stats.findIndex((item: any) => item.name === name)].filters,
          );
      setRefreshing(false);
    }, 2000);
  };

  const fetchLocations = params => {
    //if (!loadingMore && !isListEnd) {
    //locations ? setLoadingMore(true) : setLoading(true);
    setLoading(true);

    const statics = [
      {
        operator: 'eq',
        property: 'storeId',
        value: `${Number(storeId)}`,
      },
    ];

    params && params.forEach(param => statics.push(param));

    const filter = encodeURI(JSON.stringify(statics));

    timedFetch()(
      fetch(
        `${api}Locations/?filter=${filter}&page=${0}&limit=${limit}&order=${0}&sort=${sort}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${storage.getString('token')}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    )
      .then(response => {
        if (response.ok) return response.json();
        return response.json().then((error: any) => {
          throw new Error(JSON.stringify(error));
        });
      })
      .then(data => {
        setPage(prevState => prevState + 1);

        /* locations
            ? setLocations(prevState => [...prevState, ...data.data])
            : setLocations(data.data); */

        setLocations(data.data);

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

        /* if (data.data.length > 0) {
            setIsListEnd(true);
          } */
      })
      .catch(error => handleError(error))
      //.finally(() => (locations ? setLoadingMore(false) : setLoading(false)));
      .finally(() => setLoading(false));
    //}
  };

  const handleUpdatePhysicalCount = () => {
    setLoadingUpdateCount(true);

    timedFetch()(
      fetch(`${api}Locations/?ResetPhysicalCount`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${storage.getString('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedLocation.id,
          physicalCount: selectedLocation.count,
        }),
      }),
    )
      .then(response => {
        if (response.ok) return response.text();
        return response.json().then((error: any) => {
          throw new Error(JSON.stringify(error));
        });
      })
      .then(() => {
        setVisible(false);
        const newState = [...locations];
        const i = selectedLocation.index;

        newState[i].physicalCount = selectedLocation.count;
        newState[i].discrepancy = Math.abs(
          newState[i].physicalCount - newState[i].systemCount,
        );
        setLocations(newState);
      })
      .catch(error => handleError(error))
      .finally(() => setLoadingUpdateCount(false));

    return () => controller.abort();
  };

  const handleReset = (
    index: number,
    id: number,
    code: string,
    store: string,
  ) => {
    timedFetch()(
      fetch(`${api}Locations/`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${storage.getString('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({code, entity: 'systemCount', id, store}),
      }),
    )
      .then(response => {
        if (response.ok) return response.text();
        return response.json().then((error: any) => {
          throw new Error(JSON.stringify(error));
        });
      })
      .then(() => {
        const newState = [...locations];
        newState[index].systemCount = 0;
        newState[index].discrepancy = Math.abs(
          newState[index].physicalCount - newState[index].systemCount,
        );
        setLocations(newState);
      })
      .catch(error => handleError(error))
      .finally(() => setLoading(false));
  };

  // ? Debounce entry
  const debounced = React.useCallback(debounce(getSuggestions, 500), []);

  return (
    <>
      <StatusBar
        animated
        backgroundColor="#fff"
        barStyle="dark-content"
        showHideTransition="fade"
        translucent
      />

      <Animated.View style={{paddingTop: 10}}>
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

        {/* @ts-ignore */}
        <AnimatableFlatList
          animation="slideInRight"
          data={stats}
          duration={1000}
          easing="ease-in-out"
          horizontal
          renderItem={({item, index}) => (
            <LinearGradient
              key={index}
              useAngle
              angle={45}
              colors={item.colors}
              style={{
                borderColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: 10,
                borderWidth: item?.border,
                backgroundColor: 'rgba(10, 10, 20, 0.5)',
                flexGrow: 1,
                marginHorizontal: 5,
                marginTop: 5,
                overflow: 'hidden',
                width: Dimensions.get('window').width / 2.25,
              }}>
              <TouchableOpacity onPress={item.onPress}>
                <View
                  style={{
                    flexDirection: 'row',
                    overflow: 'hidden',
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                  }}>
                  <View>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: item.color,
                        fontFamily: 'Abel-Regular',
                        fontSize: RFPercentage(2.5),
                      }}>
                      {item.name}
                    </Text>
                    <Text
                      style={{
                        color: item.color,
                        fontFamily: 'Rubik-Regular',
                        fontSize: RFPercentage(4),
                      }}>
                      {item.count}
                    </Text>
                  </View>
                  <View style={{flex: 1}} />
                  <Image
                    source={item.icon}
                    style={{
                      height: 65,
                      opacity: 0.8,
                      position: 'absolute',
                      right: -10,
                      top: 10,
                      width: 65,
                    }}
                  />
                </View>
              </TouchableOpacity>
            </LinearGradient>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </Animated.View>

      {loading ? (
        <CircularLoader position="center" />
      ) : (
        <Animated.FlatList
          data={locations}
          keyExtractor={(item: object, index: number) => index.toString()}
          contentContainerStyle={{marginTop: 10}}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View
              style={{
                alignItems: 'center',
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
                Location(s) not found.
              </Text>
            </View>
          }
          ListFooterComponent={
            loadingMore && (
              <ActivityIndicator
                color="turquoise"
                size="large"
                style={{marginTop: 50}}
              />
            )
          }
          /* onEndReached={() => {
            LocationsFlatList.current.scrollToOffset({
              offset: Dimensions.get('window').height + 100,
            });
            fetchLocations();
          }} */
          onEndReachedThreshold={0.2}
          onMomentumScrollBegin={() =>
            (onEndReachedCalledDuringMomentum = false)
          }
          /* onScroll={Animated.event(
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
          )} */
          ref={LocationsFlatList}
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
              <Swipeable
                leftThreshold={100}
                rightThreshold={100}
                renderLeftActions={(progress, dragX) => {
                  const trans = dragX.interpolate({
                    inputRange: [0, 50, 100, 101],
                    outputRange: [0, 0, 0, 1],
                  });
                  return (
                    <Animated.View
                      style={{
                        justifyContent: 'center',
                        transform: [{translateX: trans}],
                      }}>
                      <Button
                        color="turquoise"
                        contentStyle={{paddingVertical: 10}}
                        labelStyle={{color: 'white'}}
                        mode="contained"
                        onPress={() => {
                          Vibration.vibrate(100);
                          showModal({index, id: location.id, count: ''});
                        }}
                        style={{
                          borderRadius: 10,
                          elevation: 10,
                          marginLeft: 15,
                        }}>
                        RECOUNT
                      </Button>
                    </Animated.View>
                  );
                }}
                renderRightActions={(progress, dragX) => {
                  const trans = dragX.interpolate({
                    inputRange: [-100, 50, 100, 101],
                    outputRange: [-10, 0, 0, 1],
                  });
                  return (
                    <Animated.View
                      style={{
                        justifyContent: 'center',
                        transform: [{translateX: trans}],
                      }}>
                      <Button
                        color="#FF8686"
                        contentStyle={{paddingVertical: 10}}
                        labelStyle={{color: 'white'}}
                        mode="contained"
                        onPress={() => {
                          Vibration.vibrate(100);
                          Alert.alert(
                            'Rescan Location',
                            'Proceed to rescan this location?',
                            [
                              {text: 'NO'},
                              {
                                text: 'YES',
                                onPress: () =>
                                  handleReset(
                                    index,
                                    location.id,
                                    location.code,
                                    location.storeId,
                                  ),
                              },
                            ],
                          );
                        }}
                        style={{borderRadius: 10, elevation: 10}}>
                        RESCAN
                      </Button>
                    </Animated.View>
                  );
                }}>
                <Animated.View
                  key={location.id}
                  style={{paddingHorizontal: 20, transform: [{scale}]}}>
                  <Card
                    elevation={10}
                    style={{
                      borderRadius: 20,
                      marginVertical: 15,
                      opacity,
                      overflow: 'hidden',
                    }}>
                    <TouchableNativeFeedback>
                      <RectButton
                        onPress={() =>
                          navigation.navigate('Location', {
                            code: location.code,
                            physicalCount: location.physicalCount,
                            systemCount: location.systemCount,
                            discrepancy: location.discrepancy,
                          })
                        }
                        rippleColor={
                          location.physicalCount > location.systemCount
                            ? 'rgb(222, 184, 135)'
                            : 'rgb(250, 128, 114)'
                        }>
                        <LinearGradient
                          useAngle={true}
                          angle={45}
                          colors={
                            location.isVerified === 1 &&
                            location.discrepancy === 0
                              ? ['rgba(192, 255, 134, 0.5)', '#fff']
                              : location.discrepancy > 0 &&
                                location.systemCount > 0
                              ? ['rgba(250, 128, 114, 0.3)', '#fff']
                              : ['#fff', '#fff']
                          }
                          style={{padding: 20}}>
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
                              <GradientText
                                gradient={['#667eea', 'green']}
                                style={{
                                  fontFamily: 'Abel-Regular',
                                  fontSize: RFPercentage(3.5),
                                  marginBottom: 5,
                                }}>
                                {location.code.split('-')[0]}
                              </GradientText>

                              <Text
                                numberOfLines={1}
                                style={{
                                  color: 'rgb(0 ,0 ,0)',
                                  fontFamily: 'Rubik-Regular',
                                  fontSize: RFPercentage(1.9),
                                  marginBottom: 5,
                                  opacity: 0.5,
                                }}>
                                <Text style={{fontWeight: 'bold'}}>
                                  {location.lastScannedBy}
                                </Text>{' '}
                                - <Text>{location.lastScannedOn}</Text>
                              </Text>
                            </View>
                            <View style={{flex: 2, alignItems: 'flex-end'}}>
                              <Text
                                style={{
                                  color: 'black',
                                  fontFamily: 'Rubik-Regular',
                                  fontSize: RFPercentage(1.5),
                                  marginTop: 3,
                                }}>
                                Phys / Sys
                              </Text>

                              <Text
                                numberOfLines={1}
                                style={{
                                  color: 'rgba(0, 155, 255, 0.5)',
                                  fontFamily: 'Abel-Regular',
                                  fontSize: RFPercentage(4),
                                }}>
                                {location.physicalCount}/{location.systemCount}
                              </Text>
                            </View>
                          </View>
                        </LinearGradient>
                      </RectButton>
                    </TouchableNativeFeedback>
                  </Card>
                </Animated.View>
              </Swipeable>
            );
          }}
        />
      )}

      <Provider
        children={
          <Portal>
            <Modal
              dismissable={false}
              visible={visible}
              onDismiss={() => setVisible(false)}
              contentContainerStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                borderColor: '#2ebf91',
                borderRadius: 10,
                borderWidth: 0.5,
                margin: 50,
                overflow: 'hidden',
              }}
              children={
                <LinearGradient
                  colors={['#8360c3', '#2ebf91']}
                  angle={45}
                  useAngle
                  style={{
                    justifyContent: 'center',
                    height: Dimensions.get('window').height * 0.23,
                  }}>
                  <Text
                    style={{
                      alignSelf: 'center',
                      color: 'yellow',
                      fontFamily: 'Rubik-Bold',
                      fontSize: RFPercentage(2.5),
                      marginBottom: 20,
                      marginTop: 30,
                    }}>
                    Update Physical Count
                  </Text>
                  <TextInput
                    keyboardType="number-pad"
                    label="New Physical Count"
                    maxLength={3}
                    onChangeText={(text: string) =>
                      setSelectedLocation((prev: {prev: object}) => {
                        return {...prev, count: text};
                      })
                    }
                    placeholder="New Physical Count"
                    returnKeyType="search"
                    value={selectedLocation?.count}
                    style={{
                      alignSelf: 'center',
                      borderWidth: 1,
                      borderColor: '#fff',
                      borderRadius: 10,
                      color: '#fff',
                      fontFamily: 'Rubik-Regular',
                      fontSize: RFPercentage(2.3),
                      paddingHorizontal: 20,
                      width: Dimensions.get('window').width * 0.6,
                    }}
                  />
                  <View
                    style={{
                      justifyContent: 'flex-end',
                      flexDirection: 'row',
                      marginTop: 20,
                      marginBottom: 20,
                      marginRight: 20,
                    }}>
                    <Button
                      color="#71B280"
                      labelStyle={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontFamily: 'Rubik-Bold',
                        fontSize: 17,
                      }}
                      onPress={() => setVisible(false)}>
                      CANCEL
                    </Button>
                    <Button
                      color="#71B280"
                      contentStyle={{flexDirection: 'row-reverse'}}
                      disabled={loadingUpdateCount}
                      labelStyle={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontFamily: 'Rubik-Bold',
                        fontSize: 17,
                      }}
                      loading={loadingUpdateCount}
                      onPress={handleUpdatePhysicalCount}>
                      SET COUNT
                    </Button>
                  </View>
                </LinearGradient>
              }
            />
          </Portal>
        }
      />
    </>
  );
}
