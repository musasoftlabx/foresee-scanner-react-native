import React from 'react';
import {Circle, Svg, Text as SVGText} from 'react-native-svg';

interface Props {
  size: number;
  strokeWidth: number;
  text: number;
}

const CircularProgress = (props: Props) => {
  const {size, strokeWidth, text} = props;
  const radius = (size - strokeWidth) / 2;
  const circum = radius * 2 * Math.PI;
  const svgProgress = 100 - text;

  return (
    <Svg width={size} height={size}>
      <Circle
        stroke="#fff"
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth="5"
      />
      <Circle
        stroke="#3b5998"
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeDasharray={`${circum} ${circum}`}
        strokeDashoffset={radius * Math.PI * 2 * (svgProgress / 100)}
        strokeLinecap="round"
        transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        strokeWidth="5"
      />
      <SVGText
        fontSize="15"
        x={size / 2}
        y={size / 2 + 5}
        textAnchor="middle"
        fill="#333333"
        style={{
          fontFamily: 'AbelRegular',
        }}>
        {text}
      </SVGText>
    </Svg>
  );
};

export default CircularProgress;
