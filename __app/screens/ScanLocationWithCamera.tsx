// ? Import React & Hooks
import React, {useEffect, useState} from 'react';

// ? Import React Native Libraries
import {
  ActivityIndicator,
  Alert,
  StatusBar,
  Vibration,
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
import {RFPercentage} from 'react-native-responsive-fontsize';
import LinearGradient from 'react-native-linear-gradient';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Animatable from 'react-native-animatable';
import * as REA from 'react-native-reanimated';

// ? Register Animations
const AnimatedLogoutIcon = Animatable.createAnimatableComponent(MCI);

// ? Import Constants
import {AuthContext, api, storage} from '../../App';
import {deviceHeight, deviceWidth, handleError, timedFetch} from '../utils';

// ? Import Components
import GradientText from '../components/GradientText';

export default function ScanLocationWithCamera({navigation}) {
  // * Contexts specification
  const {dispatch} = React.useContext(AuthContext);

  // * State declaration
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
      '{"ImageParameter":{"BarcodeFormatIds":["BF_CODE_128"],"Description":"","Name":"Settings"},"Version":"3.0"}';
    const results: TextResult[] = decode(frame, config);
    REA.runOnJS(setBarcodeResults)(results);
  }, []);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'authorized');
    })();
  }, []);

  // * Effects invoke
  useEffect(() => {
    if (barcodeResults && barcodeResults[0]?.barcodeText.length >= 5) {
      const code = barcodeResults[0].barcodeText;

      Vibration.vibrate(100);
      setCameraActive(false);
      setLoading(true);

      ToastAndroid.showWithGravity(
        `Scanning location ${code}...`,
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
      );

      timedFetch()(
        fetch(`${api}Locations/?Scan=location`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${storage.getString('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({code}),
        }),
      )
        .then(response => {
          if (response.ok) return response.json();
          return response.json().then((error: any) => {
            throw new Error(JSON.stringify(error));
          });
        })
        .then(data => {
          setTimeout(() => {
            navigation.navigate('ScanProductWithCamera', {
              id: data.id,
              code: data.code,
              physicalCount: data.physicalCount,
              systemCount: data.systemCount,
              storeId: data.storeId,
            });
          }, 500);
        })
        .catch(error => handleError(error))
        .finally(
          () => (
            setCameraActive(true), setBarcodeResults([]), setLoading(false)
          ),
        );
    }
  }, [barcodeResults]);

  return (
    device != null &&
    hasPermission && (
      // @ts-ignore
      <LinearGradient
        colors={['#016961', '#30D5C8']}
        style={{alignItems: 'center', flex: 1}}>
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

        <GradientText
          gradient={['#fff', '#43e97b']}
          style={{
            fontFamily: 'Abel-Regular',
            fontSize: RFPercentage(5),
            marginTop: deviceHeight * 0.1,
          }}>
          Scan Location
        </GradientText>

        <Camera
          // @ts-ignore
          style={{
            height: deviceHeight * 0.1,
            marginVertical: 15,
            width: deviceWidth * 0.5,
          }}
          device={device}
          isActive={cameraActive}
          frameProcessor={frameProcessor}
          frameProcessorFps={1}
        />
        {barcodeResults.map((barcode: {barcodeText: string}, idx: number) => (
          <Text
            key={idx}
            style={{fontFamily: 'Rubik-Regular', fontSize: RFPercentage(2)}}>
            {barcode.barcodeText}
          </Text>
        ))}

        <Button
          labelStyle={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontFamily: 'Rubik-Bold',
            fontSize: 17,
          }}
          mode="text"
          onPress={() => navigation.replace('ScanLocationWithCamera')}
          style={{marginTop: 18}}>
          RE-ACTIVATE CAMERA
        </Button>

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
