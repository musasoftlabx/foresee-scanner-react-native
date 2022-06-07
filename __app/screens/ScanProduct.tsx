// ? Import React & Hooks
import React, {useState} from 'react';

// ? Import React Native Libraries
import {ActivityIndicator, Alert, StatusBar, Text, View} from 'react-native';
import {Button, TextInput} from 'react-native-paper';
import {getPowerState, getSerialNumber} from 'react-native-device-info';
import {RFPercentage} from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';

// ? Import Constants
import {api, storage} from '../../App';
import {deviceHeight, deviceWidth, handleError, timedFetch} from '../utils';

// ? Import Components
import GradientText from '../components/GradientText';

const ScanProduct = ({navigation, route}) => {
  // * Params deconstruction
  const {id, code, physicalCount, systemCount, storeId} = route.params;

  // * State declaration
  const [barcode, setBarcode] = useState('');
  const [count, setCount] = useState(systemCount);
  const [loading, setLoading] = useState(false);

  // * Ref declaration
  const barcodeInput = React.useRef();

  // * Functions
  const handleScan = async (query: any) => {
    let q = null;

    if (query) {
      q = query;
    } else {
      q = barcode;
    }

    if (q.length === 13) {
      setLoading(true);

      const batteryLevel = await getPowerState().then(
        state => state.batteryLevel,
      );
      const serialNumber = await getSerialNumber().then(
        serialNumber => serialNumber,
      );

      timedFetch(15)(
        fetch(`${api}Locations/?Scan=product`, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${storage.getString('token')}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify({
            id,
            barcode: q,
            batteryLevel: `${Math.floor(batteryLevel * 100)}%`,
            code,
            serialNumber,
            storeId,
          }),
        }),
      )
        .then(response => {
          if (response.ok) return response.json();
          return response.json().then((error: any) => {
            response.status === 404 && setCount((prev: number) => prev + 1);
            throw new Error(JSON.stringify(error));
          });
        })
        .then(() => setCount((prev: number) => prev + 1))
        .catch(error => handleError(error))
        .finally(
          () => (
            setBarcode(''), setLoading(false), barcodeInput.current.focus()
          ),
        );
    }
  };

  const handleSubmit = () => {
    setLoading(true);

    timedFetch()(
      fetch(`${api}Locations/?SubmitScan`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${storage.getString('token')}`,
          'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify({id}),
      }),
    )
      .then(response => {
        if (response.ok) return response.json();
        return response.json().then((error: any) => {
          throw new Error(JSON.stringify(error));
        });
      })
      .then(() => navigation.navigate('ScanLocation'))
      .catch(error => handleError(error))
      .finally(() => (setBarcode(''), setLoading(false)));
  };

  const handleReset = () => {
    setLoading(true);

    timedFetch()(
      fetch(`${api}Locations/`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${storage.getString('token')}`,
          'Content-Type': 'application/json',
        },
        method: 'DELETE',
        body: JSON.stringify({id, code}),
      }),
    )
      .then(response => {
        if (response.ok) return response.text();
        return response.text().then((error: any) => {
          throw new Error(JSON.stringify(error));
        });
      })
      .then(() => setCount(0))
      .catch(error => handleError(error))
      .finally(
        () => (setBarcode(''), setLoading(false), barcodeInput.current.focus()),
      );
  };

  return (
    <View style={{flex: 1, justifyContent: 'center'}}>
      <StatusBar
        animated={true}
        backgroundColor="#30D5C8"
        barStyle="dark-content"
        showHideTransition="fade"
        translucent
      />

      <LinearGradient
        colors={['#30D5C8', '#fff']}
        style={{
          alignItems: 'center',
          height: deviceHeight,
          justifyContent: 'center',
        }}>
        <GradientText
          gradient={['#FF5F6D', '#A43931']}
          style={{
            fontFamily: 'Abel-Regular',
            fontSize: RFPercentage(7),
            marginBottom: 5,
          }}>
          {code.split('-')[0]}
        </GradientText>

        <Text
          style={{
            color: '#000',
            fontFamily: 'Abel-Regular',
            fontSize: RFPercentage(3),
          }}>
          Scan{count > 0 && 'ned'} Items
        </Text>

        {/*@ts-ignore*/}
        <Animatable.Text
          animation="zoomInDown"
          style={{
            color: '#fff',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            borderColor: '#fff',
            borderRadius: 15,
            borderWidth: 0.5,
            fontFamily: 'Rubik-Bold',
            fontSize: RFPercentage(20),
            marginBottom: 20,
            marginTop: 3,
            paddingHorizontal: 23,
            paddingVertical: 10,
            paddingTop: 15,
            textAlign: 'center',
          }}>
          {count}
        </Animatable.Text>

        {/* <Text
          style={{
            color: 'rgba(0, 0, 0, 0.5)',
            fontFamily: 'Rubik-Regular',
            fontSize: RFPercentage(3),
          }}>
          Physical count: {physicalCount}
        </Text> */}

        <TextInput
          autoFocus
          keyboardType="numeric"
          left={
            <TextInput.Icon
              name="barcode"
              style={{marginTop: 9, opacity: 0.5}}
            />
          }
          mode="outlined"
          onChangeText={(text: number) => (setBarcode(text), handleScan(text))}
          onSubmitEditing={handleScan}
          placeholder="Scan item barcode"
          ref={barcodeInput}
          right={
            <TextInput.Icon
              name="close"
              onPress={() => setBarcode('')}
              style={{marginTop: 7, opacity: 0.5}}
            />
          }
          //showSoftInputOnFocus={false}
          style={{
            fontFamily: 'Rubik-Regular',
            margin: 12,
            marginTop: 15,
            width: deviceWidth * 0.8,
          }}
          theme={{colors: {primary: '#000'}}}
          value={barcode}
        />

        <Text
          style={{
            color: 'rgba(0, 0, 0, 0.5)',
            fontFamily: 'Rubik-Regular',
            fontSize: RFPercentage(2),
            textAlign: 'right',
          }}>
          {barcode.length} character{barcode.length !== 1 && 's'}
        </Text>

        <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
          <Button
            color="#FF4E50"
            disabled={loading || count === 0}
            labelStyle={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: 'Rubik-Bold',
              fontSize: 17,
            }}
            loading={loading}
            mode="contained"
            onPress={() => {
              Alert.alert(
                'Reset Count',
                'Are you sure you want to reset your count?',
                [{text: 'Cancel'}, {text: 'Reset', onPress: handleReset}],
              );
            }}
            style={{
              borderRadius: 10,
              elevation:
                loading || barcode.length !== 13 || count === 0 ? 0 : 10,
              margin: 18,
              marginRight: 20,
              padding: 8,
            }}>
            RESET
          </Button>
          <Button
            color="#71B280"
            disabled={loading || barcode.length !== 13 || count === 0}
            labelStyle={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontFamily: 'Rubik-Bold',
              fontSize: 17,
            }}
            loading={loading}
            mode="contained"
            onPress={() => {
              Alert.alert(
                'Submit Count',
                'Are you sure you want to submit your count?',
                [{text: 'Cancel'}, {text: 'Submit', onPress: handleSubmit}],
              );
            }}
            style={{
              borderRadius: 10,
              elevation:
                loading || barcode.length !== 13 || count === 0 ? 0 : 10,
              margin: 18,
              marginLeft: 20,
              paddingVertical: 8,
            }}>
            SUBMIT
          </Button>
        </View>
      </LinearGradient>

      <ActivityIndicator
        animating={loading}
        size={50}
        style={{
          alignSelf: 'center',
          backgroundColor: 'rgba(112, 225, 245, 0.75)',
          display: loading ? 'flex' : 'none',
          height: deviceHeight,
          justifyContent: 'center',
          position: 'absolute',
          width: deviceWidth,
        }}
      />
    </View>
  );
};

export default ScanProduct;
