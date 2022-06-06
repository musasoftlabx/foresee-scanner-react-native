import React, {useCallback, useEffect, useLayoutEffect, useState} from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  Image,
  SafeAreaView,
  ScrollView,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
} from 'react-native';
import {
  Button,
  Card,
  DataTable,
  FAB,
  IconButton,
  Modal,
  Portal,
  Provider,
  Surface,
  //TextInput,
} from 'react-native-paper';
import {RFPercentage} from 'react-native-responsive-fontsize';
import {Circle, Svg, Text as SVGText, SvgXml} from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import SvgAnimatedLinearGradient from 'react-native-svg-animated-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaskedView from '@react-native-masked-view/masked-view';
//import Barcode from '@kichiyaki/react-native-barcode-generator';

import CircularLoader from '../components/CircularLoader';
import GradientText from '../components/GradientText';

// ? Import Utilities
import {AuthContext, api, storage} from '../../App';

const optionsPerPage = [2, 3, 4];

const Home = ({navigation, route}) => {
  // * Param destructuring
  const {code, physicalCount, systemCount, discrepancy} = route.params;

  // * Contexts specification
  const {dispatch} = React.useContext(AuthContext);

  // * State declaration
  const [data, setData] = useState([]);
  const [filtrate, setFiltrate] = useState([]);
  const [barcode, setBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState<number>(0);
  const [itemsPerPage, setItemsPerPage] = useState(optionsPerPage[0]);

  const [state, setState] = React.useState({open: false});

  const onStateChange = ({open}) => setState({open});

  const {open} = state;

  const [sections] = useState([
    {
      title: 'Main',
      data: [1],
    },
  ]);

  useEffect(() => {
    setPage(0);
  }, [itemsPerPage]);

  const wait = (timeout: number) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
    wait(2000).then(() => setRefreshing(false));
  }, []);

  useLayoutEffect(() => {
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
            keyboardType="number-pad"
            onChangeText={(text: number) => setBarcode(text)}
            placeholder="Search barcode"
            placeholderTextColor="rgba(0, 0, 0, 0.5)"
            style={{
              color: 'black',
              fontSize: RFPercentage(2.5),
              width: Dimensions.get('window').width * 0.6,
            }}
            value={barcode}
          />
          {barcode.length > 0 && (
            <MaterialIcons
              color="grey"
              name="close"
              onPress={() => setBarcode('')}
              size={24}
              style={{marginRight: 20}}
            />
          )}
        </View>
      ),
    });
  }, [navigation, barcode]);

  useEffect(() => {
    barcode.length > 0
      ? setFiltrate(
          data.filter((item: {barcode: string}) =>
            item.barcode.includes(barcode),
          ),
        )
      : setFiltrate(data);
  }, [barcode]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);

    fetch(`${api}Locations/?products=true&location=${code}`, {
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
            navigation.navigate('Login');
          } else {
            setData(data);
            setFiltrate(data);
          }
        })
        .catch(e => Alert.alert('Server error!', e, [{text: 'OK'}]))
        .finally(() => setLoading(false)),
    );
  };

  return (
    <View style={{flex: 1}}>
      <StatusBar
        animated={true}
        backgroundColor="#fff"
        barStyle="dark-content"
        showHideTransition="fade"
      />

      <View
        style={{
          alignItems: 'center',
          marginTop: 20,
        }}>
        <GradientText
          gradient={['#667eea', '#43e97b']}
          style={{
            fontFamily: 'Abel-Regular',
            fontSize: RFPercentage(5),
          }}>
          {code.split('-')[0]}
        </GradientText>

        <Text
          style={{
            color: 'rgba(0, 0, 0, 0.5)',
            fontFamily: 'Rubik-Regular',
            fontSize: RFPercentage(2.2),
          }}>
          Last scanned by {data && data[data.length - 1]?.lastScannedBy}
        </Text>

        <LinearGradient
          colors={['#667eea', '#43e97b']}
          angle={45}
          useAngle={true}
          style={{
            borderRadius: 10,
            backgroundColor: 'rgba(10, 10, 20, 0.5)',
            width: Dimensions.get('window').width * 0.95,
            marginTop: 20,
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginVertical: 20,
              paddingHorizontal: 20,
            }}>
            <View style={{justifyContent: 'center'}}>
              <Text style={styles.statsHeader}>Physical Count</Text>
              <Text style={[styles.statsHeader, {fontSize: RFPercentage(4)}]}>
                {physicalCount}
              </Text>
            </View>
            <View
              style={{
                alignItems: 'center',
                borderColor: '#fff',
                borderRadius: 5,
                borderWidth: 1,
                justifyContent: 'center',
                padding: 5,
              }}>
              <Text style={styles.statsHeader}>Discrepancy</Text>
              <Text
                style={[
                  styles.statsHeader,
                  {fontFamily: 'Rubik-Bold', fontSize: RFPercentage(6)},
                ]}>
                {discrepancy}
              </Text>
            </View>
            <View style={{alignItems: 'flex-end', justifyContent: 'center'}}>
              <Text style={styles.statsHeader}>System Count</Text>
              <Text style={[styles.statsHeader, {fontSize: RFPercentage(4)}]}>
                {systemCount}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {loading ? (
        <CircularLoader position="center" />
      ) : (
        <SectionList
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({section}) => (
            <>
              <DataTable
                style={{
                  backgroundColor: 'transparent',
                  borderTopEndRadius: 20,
                  borderTopStartRadius: 20,
                }}>
                <DataTable.Header>
                  <DataTable.Title>Barcode</DataTable.Title>
                  <DataTable.Title>Name</DataTable.Title>
                  <DataTable.Title>Last Scanned On</DataTable.Title>
                </DataTable.Header>

                {filtrate &&
                  filtrate.map(location => (
                    <DataTable.Row key={location.PK}>
                      <DataTable.Cell
                        children={
                          <Text style={styles.tableFont}>
                            {location.barcode}
                          </Text>
                        }
                      />
                      <DataTable.Cell
                        children={
                          <Text style={styles.tableFont}>{location.name}</Text>
                        }
                      />
                      <DataTable.Cell
                        children={
                          <Text style={styles.tableFont}>
                            {location.LastScannedOn}
                          </Text>
                        }
                      />
                    </DataTable.Row>
                  ))}

                <DataTable.Pagination
                  page={page}
                  numberOfPages={3}
                  onPageChange={page => setPage(page)}
                  label="1-2 of 6"
                  optionsPerPage={optionsPerPage}
                  itemsPerPage={itemsPerPage}
                  setItemsPerPage={setItemsPerPage}
                  showFastPagination
                  sortDirection="ascending"
                  optionsLabel={'Rows per page'}
                />
              </DataTable>
            </>
          )}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          sections={sections}
          style={{backgroundColor: '#fff'}}
        />
      )}

      {/* <Provider
        children={
          <Portal>
            <FAB.Group
              actions={[
                {
                  icon: 'lock-reset',
                  label: 'Reset Physical',
                  labelStyle: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    borderTopRightRadius: 30,
                    elevation: 0,
                    paddingRight: 18,
                  },
                  onPress: () =>
                    Alert.alert(
                      'Reset Physical Count',
                      'Proceed to reset physical count in this location?',
                      [
                        {text: 'NO'},
                        {
                          text: 'YES',
                          //onPress: () => handleReset('physical', location),
                          onPress: () => console.log(physicalCount),
                        },
                      ],
                    ),
                  style: {backgroundColor: '#EF7070'},
                },
                {
                  icon: 'barcode',
                  label: 'Rescan',
                  labelStyle: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    borderTopRightRadius: 30,
                    elevation: 0,
                    paddingRight: 18,
                  },
                  onPress: () =>
                    Alert.alert(
                      'Rescan Location',
                      'Proceed to rescan this location?',
                      [
                        {text: 'NO'},
                        {
                          text: 'YES',
                          //onPress: () => handleReset('physical', location),
                          onPress: () => console.log(physicalCount),
                        },
                      ],
                    ),
                  style: {backgroundColor: '#FFF46E'},
                },
                {
                  color: '#fff',
                  icon: 'export',
                  label: 'Export to Excel',
                  labelStyle: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    borderTopRightRadius: 30,
                    borderBottomRightRadius: 30,
                    elevation: 0,
                    paddingRight: 18,
                  },
                  onPress: () => console.log('Pressed notifications'),
                  small: false,
                  style: {backgroundColor: '#A0B936'},
                },
              ]}
              fabStyle={{backgroundColor: 'turquoise'}}
              icon={open ? 'close' : 'plus'}
              onPress={() => {
                if (open) {
                  // do something if the speed dial is open
                }
              }}
              onStateChange={onStateChange}
              open={open}
            />
          </Portal>
        }
      /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  tableFont: {
    fontFamily: 'Abel-Regular',
    fontSize: RFPercentage(2),
  },
  statsHeader: {color: '#fff', fontFamily: 'Rubik-Regular'},
});

export default Home;
