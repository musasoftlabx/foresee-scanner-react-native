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
} from 'react-native';
import {Card} from 'react-native-paper';
import {LineChart} from 'react-native-chart-kit';
import {RectButton} from 'react-native-gesture-handler';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {TouchableNativeFeedback} from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaskedView from '@react-native-masked-view/masked-view';
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

const ScanOperators = ({navigation}) => {
  const [chart, setChart] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [offset, setOffset] = useState(0);
  const [sort, setSort] = useState('id');
  const [searchQuery, setSearchQuery] = useState('');

  const scrollY = useRef(new Animated.Value(0)).current;

  // ? Pull to Refresh
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = () => {
    setRefreshing(true);
    setData([]);
    setTimeout(() => {
      fetchData();
      setRefreshing(false);
    }, 2000);
  };

  const fetchData = () => {
    if (searchQuery.length === 0) {
      setLoading(true);

      timedFetch()(
        fetch(`${api}ScanOperators/`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${storage.getString('token')}`,
            'Content-Type': 'application/json',
          },
        }),
      )
        .then(response => {
          if (response.status > 200) {
            throw new Error(`${response.status}. ${errorMessage}`);
          }
          return response.json();
        })
        .then(data => {
          setData(data);
        })
        .catch(error => handleError(error))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{alignItems: 'center', flexDirection: 'row'}}>
          <MaterialIcons
            name="search"
            size={24}
            color="white"
            style={{marginRight: 20}}
          />
          <TextInput
            autoCapitalize="characters"
            maxLength={6}
            onChangeText={(text: string) => {
              setSearchQuery(text);
            }}
            placeholder="Search Users"
            placeholderTextColor="rgba(255, 255, 255, 0.8)"
            returnKeyType="search"
            style={{
              color: '#fff',
              fontFamily: 'Rubik-Regular',
              fontSize: RFPercentage(2.5),
              width: Dimensions.get('window').width * 0.75,
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
                color: '#fff',
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
                color: '#fff',
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
            color="white"
            style={{marginRight: 20}}
            onPress={() => handleLogout()}
          />
        </View>
      ),
    });
  }, [navigation, searchQuery]);

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <View style={{flex: 1}}>
      <StatusBar
        animated={true}
        backgroundColor="#59C173"
        barStyle="light-content"
        showHideTransition="fade"
      />

      <LinearGradient
        angle={1}
        colors={['#59C173', '#a17fe0']}
        style={{
          borderBottomLeftRadius: 100,
          height: Dimensions.get('window').height * 0.6,
          left: 0,
          padding: 20,
          position: 'absolute',
          right: 0,
        }}
        useAngle={false}
      />

      <View style={{paddingHorizontal: 24, marginTop: 100}}>
        <Text
          style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontFamily: 'Rubik-Regular',
            fontSize: RFPercentage(6),
            marginBottom: 3,
          }}>
          Scan Operators
        </Text>

        <Text
          style={{
            color: 'yellow',
            fontFamily: 'Rubik-Bold',
            fontSize: RFPercentage(7),
            marginBottom: 10,
          }}>
          {data && data.length}
        </Text>
      </View>

      {loading ? (
        <CircularLoader position="center" />
      ) : (
        <Animated.FlatList
          contentContainerStyle={{marginTop: 10}}
          data={data}
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
                User was not found.
              </Text>
            </View>
          }
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
          numColumns={2}
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

                {/* // ? Users */}
                <View
                  key={location.PK}
                  style={{flex: 1, paddingHorizontal: 10}}>
                  <Card
                    style={{
                      borderRadius: 20,
                      marginBottom: 30,
                      opacity,
                      overflow: 'hidden',
                    }}>
                    <TouchableNativeFeedback>
                      <RectButton
                        rippleColor={
                          location.PhysicalCount > location.SystemCount
                            ? 'rgb(222, 184, 135)'
                            : 'rgb(250, 128, 114)'
                        }>
                        <LinearGradient
                          angle={180}
                          colors={['rgba(48, 213, 200, 0.3)', '#fff']}
                          style={{borderRadius: 20, padding: 20}}
                          useAngle={true}>
                          <View
                            style={{
                              alignItems: 'center',
                            }}>
                            <Image
                              source={{uri: location.profilePicture}}
                              /* source={{
                                uri: 'https://i.pravatar.cc/300?img=' + index,
                              }} */
                              style={{
                                borderRadius: 100,
                                height: 100,
                                width: 100,
                              }}
                            />
                            <MaskedView
                              style={{
                                flex: 1,
                                flexDirection: 'row',
                                height: RFPercentage(3.5),
                              }}
                              maskElement={
                                <Text
                                  style={{
                                    fontFamily: 'Abel-Regular',
                                    fontSize: RFPercentage(3.5),
                                    textAlign: 'center',
                                  }}>
                                  {location.firstName} {location.lastName}
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
                              {location.scannedBy}
                            </Text>

                            <Text
                              style={{
                                color: 'rgb(0 ,0 ,0)',
                                fontFamily: 'Rubik-Bold',
                                fontSize: RFPercentage(2),
                                marginBottom: 5,
                                opacity: 0.5,
                              }}>
                              {location.scans} scans
                            </Text>

                            <Text
                              style={{
                                color: 'rgb(0 ,0 ,0)',
                                fontFamily: 'Rubik-Bold',
                                fontSize: RFPercentage(2),
                                marginBottom: 5,
                                opacity: 0.5,
                              }}>
                              {location.locations} locations (V)
                            </Text>

                            <Text
                              style={{
                                color: 'green',
                                fontFamily: 'Rubik-Bold',
                                fontSize: RFPercentage(2),
                                marginBottom: 5,
                                opacity: 0.5,
                              }}>
                              Battery - {location.batteryLevel}
                            </Text>
                          </View>
                        </LinearGradient>
                      </RectButton>
                    </TouchableNativeFeedback>
                  </Card>
                </View>
              </>
            );
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default ScanOperators;
