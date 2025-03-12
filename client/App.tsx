import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { AppNavigation } from './src/navigation/AppNavigation'
import AddProductScreen from './src/screens/x/AddProductScreen'
import CreateOrderScreen from './src/screens/x/CreateOrderScreen'
import ProductDetailScreen from './src/screens/x/ProductDetailScreen'
import ProductListScreen from './src/screens/x/ProductListScreen'
import StatisticsScreen from './src/screens/x/StatisticsScreen'
import WarehouseScreen from './src/screens/x/WarehouseScreen'

const App = () => {
  return (
    <NavigationContainer>
      <WarehouseScreen />
    </NavigationContainer>
  )
}

export default App