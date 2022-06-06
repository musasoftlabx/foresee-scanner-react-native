// ? Import React & Hooks
import React, {useEffect, useState} from 'react';

// ? Import React Native Libraries
import {
  ActivityIndicator,
  Alert,
  StatusBar,
  Vibration,
  View,
  Text,
  ToastAndroid,
} from 'react-native';
import {Button} from 'react-native-paper';
import {
  Camera,
  useCameraDevices,
  useFrameProcessor,
} from 'react-native-vision-camera';
import {
  DBRConfig,
  decode,
  TextResult,
} from 'vision-camera-dynamsoft-barcode-reader';
import {getPowerState, getSerialNumber} from 'react-native-device-info';
import {RFPercentage} from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';
import * as Animatable from 'react-native-animatable';
import * as REA from 'react-native-reanimated';

// ? Import Constants
import {api, storage} from '../../App';
import {deviceHeight, deviceWidth, handleError, timedFetch} from '../utils';

// ? Import Components
import GradientText from '../components/GradientText';

export default function ScanProductWithCamera({navigation, route}) {
  // * Params deconstruction
  const {id, code, physicalCount, systemCount, storeId} = route.params;

  // * State declaration
  const [barcode, setBarcode] = useState('');
  const [count, setCount] = useState(systemCount);
  const [barcodeResults, setBarcodeResults] = useState([] as TextResult[]);
  const [cameraActive, setCameraActive] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(false);

  // * Invoke camera
  const devices = useCameraDevices();
  const device = devices.back;
  const frameProcessor = useFrameProcessor(frame => {
    'worklet';
    const config: DBRConfig = {};
    config.template =
      '{"ImageParameter":{"BarcodeFormatIds":["BF_EAN_13"],"Description":"","Name":"Settings"},"Version":"3.0"}';
    const results: TextResult[] = decode(frame, config);
    REA.runOnJS(setBarcodeResults)(results);
  }, []);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (barcodeResults && barcodeResults[0]?.barcodeText.length >= 12) {
        const barcode = barcodeResults[0].barcodeText;

        Vibration.vibrate(100);
        setCameraActive(false);
        setLoading(true);

        ToastAndroid.showWithGravity(
          `Scanning item ${barcode}...`,
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        );

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
              barcode,
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
          .finally(() => (setCameraActive(true), setLoading(false)));
      }
    })();
  }, [barcodeResults]);

  // * Functions
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
      .then(() => navigation.navigate('ScanLocationWithCamera'))
      .catch(error => handleError(error))
      .finally(() => setLoading(false));
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
      .finally(() => (setBarcodeResults([]), setLoading(false)));
  };

  return (
    device != null &&
    hasPermission && (
      // @ts-ignore
      <LinearGradient
        colors={['#30D5C8', '#fff']}
        style={{
          alignItems: 'center',
          height: deviceHeight,
          justifyContent: 'center',
        }}>
        <StatusBar
          animated={true}
          backgroundColor="#30D5C8"
          barStyle="dark-content"
          showHideTransition="fade"
          translucent
        />

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

        <Camera
          // @ts-ignore
          style={{
            height: deviceHeight * 0.1,
            marginVertical: 15,
            width: deviceWidth * 0.7,
          }}
          device={device}
          isActive={cameraActive}
          frameProcessor={frameProcessor}
          frameProcessorFps={1}
        />
        {barcodeResults.map((barcode: {barcodeText: string}, idx: number) => (
          <Text
            key={idx}
            style={{
              color: '#000',
              fontFamily: 'Rubik-Regular',
              fontSize: RFPercentage(2),
            }}>
            {barcode.barcodeText}
          </Text>
        ))}

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
              elevation: loading || count === 0 ? 0 : 10,
              margin: 18,
              marginRight: 20,
              padding: 8,
            }}>
            RESET
          </Button>

          <Button
            color="#71B280"
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
                'Submit Count',
                'Are you sure you want to submit your count?',
                [{text: 'Cancel'}, {text: 'Submit', onPress: handleSubmit}],
              );
            }}
            style={{
              borderRadius: 10,
              elevation: loading || count === 0 ? 0 : 10,
              margin: 18,
              marginLeft: 20,
              paddingVertical: 8,
            }}>
            SUBMIT
          </Button>
        </View>

        <ActivityIndicator
          animating={loading}
          size={50}
          style={{
            alignSelf: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: loading ? 'flex' : 'none',
            height: deviceHeight * 1.1,
            justifyContent: 'center',
            position: 'absolute',
            width: deviceWidth,
          }}
        />
      </LinearGradient>
    )
  );
}
