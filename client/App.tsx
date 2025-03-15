import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import CustomerInfoScreen from './src/screens/main/x/CustomerInfoScreen'
import ProductDetailScreen from './src/screens/main/Product/ProductDetailScreen'


const App = () => {
  return (
    <NavigationContainer>
      <ProductDetailScreen/>
    </NavigationContainer>
  )
}

export default App