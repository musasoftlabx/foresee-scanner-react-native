import {useState} from 'react';
import {Alert, Dimensions} from 'react-native';
import {MMKV} from 'react-native-mmkv';

const server = 'https://foresee-technologies.com/';
const api = `${server}api/v1/`;
const storage = new MMKV();
const token = storage.getString('token');
const fetchTimeout: number = 8;
const errorMessage = 'We could not proceed with your request due to an error.';
const deviceHeight = Dimensions.get('window').height;
const deviceWidth = Dimensions.get('window').width;

const handleError = (err: any) => {
  const error = JSON.parse(err.message).error;
  const message = JSON.parse(err.message).message;
  Alert.alert(error, message, [{text: 'OK'}]);
};

const timedFetch = (seconds: number = fetchTimeout) => {
  return (promise: any) => {
    const timeout = new Promise((resolve, reject) =>
      setTimeout(
        () => reject(new Error('Request timed out. Kindly retry.')),
        seconds * 1000,
      ),
    );
    return Promise.race([promise, timeout]);
  };
};

export {
  api,
  deviceHeight,
  deviceWidth,
  errorMessage,
  server,
  storage,
  token,
  handleError,
  timedFetch,
};
