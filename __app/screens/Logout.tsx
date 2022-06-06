import React, {useEffect, useState} from 'react';
import {Alert} from 'react-native';
import {api, storage} from '../utils';
import {AuthContext} from '../../App';

interface Props {
  navigation: object;
}

const Logout: React.FC<Props> = ({navigation}) => {
  const {state, dispatch} = React.useContext(AuthContext);

  useEffect(() => {
    dispatch({type: 'SIGN_OUT'});
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'This will log you out. Proceed?', [
      {onPress: () => dispatch({type: 'SIGN_OUT'}), text: 'OK'},
      {text: 'Cancel'},
    ]);
  };

  return false;
};

export default Logout;
