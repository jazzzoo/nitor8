import React from 'react';
import { Image, View } from 'react-native';

export default function LogoMark({ size = 32, style }) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Image
        source={require('../../web/assets/favicon.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}
