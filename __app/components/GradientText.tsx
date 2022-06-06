import React from 'react';
import {Text} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

interface Props {
  gradient: string[];
  style: object;
}

const GradientText = (props: Props) => {
  return (
    <MaskedView
      maskElement={<Text {...props} />}
      renderToHardwareTextureAndroid
      style={{flexDirection: 'row'}}>
      <LinearGradient
        colors={props.gradient}
        start={{x: 0, y: 1}}
        end={{x: 1, y: 0}}>
        <Text {...props} style={[props.style, {opacity: 0}]} />
      </LinearGradient>
    </MaskedView>
  );
};

export default GradientText;
