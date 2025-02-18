import { Image, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { BaseLayout } from '../../../components'
import { Images } from '../../../assets'
import { scaledSize } from '../../../utils'

const SplashScreen = () => {
  return (
    <BaseLayout style={styles.container}>
      <Image source={Images.LOGO} style={styles.logoImage} />
    </BaseLayout>
  )
}

export default SplashScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: scaledSize(120),
    height: scaledSize(120),
    resizeMode: 'contain'
  }
})