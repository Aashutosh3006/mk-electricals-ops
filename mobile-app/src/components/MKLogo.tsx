import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

interface MKLogoProps {
  size?: 'sm' | 'md' | 'lg';
  darkText?: boolean;
}

export const MKLogo: React.FC<MKLogoProps> = ({ size = 'md', darkText = false }) => {
  const textColor = darkText ? '#230308' : '#FFFFFF';
  const subColor = darkText ? '#3B040C' : '#FFFFFF';
  const cutoutStroke = darkText ? '#FFFFFF' : '#260207';

  const dimensions =
    size === 'lg'
      ? { width: 210, height: 105 }
      : size === 'sm'
      ? { width: 118, height: 58 }
      : { width: 156, height: 78 };

  return (
    <View style={styles.container}>
      <Svg width={dimensions.width} height={dimensions.height} viewBox="0 0 240 115" fill="none">
        {/* Heavy Slanted Geometric M */}
        <Path
          d="M22 72L36 14H57L68 48L88 14H109L95 72H78L88 31L67 66H56L46 31L37 72H22Z"
          fill={textColor}
        />
        {/* Heavy Slanted Geometric K */}
        <Path
          d="M116 72L130 14H149L142 42L173 14H197L160 44L185 72H162L143 49L135 56L131 72H116Z"
          fill={textColor}
        />
        {/* Diagonal Knockout + High-Voltage Crimson Lightning Bolt */}
        <Path d="M126 3L97 46H117L98 85L142 39H120L126 3Z" fill={cutoutStroke} />
        <Path d="M125 5L99 45H117L100 82L139 40H119L125 5Z" fill="#EF233C" />
        <Path
          d="M123 11L103 44H116L105 72L133 41H118L123 11Z"
          fill="#FF4D6D"
          fillOpacity={0.45}
        />
        {/* Tracked ELECTRICALS Wordmark */}
        <SvgText
          x="112"
          y="104"
          fill={subColor}
          fontSize="15.5"
          fontWeight="800"
          letterSpacing="5.5"
          textAnchor="middle"
        >
          ELECTRICALS
        </SvgText>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
