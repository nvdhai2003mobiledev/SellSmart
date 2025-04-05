import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigation } from './src/navigation/AppNavigation';
import { Provider } from 'mobx-react';
import { rootStore } from './src/models/root-store';
import { CustomerScreen, EmployeeScreen, ProductListScreen } from './src/screens';

const App = () => {
  return (
    <Provider rootStore={rootStore}>
      <NavigationContainer>
        <AppNavigation />
        {/* <EmployeeScreen/> */}
        {/* <CustomerScreen /> */}
      </NavigationContainer>
    </Provider>
  );
};

export default App;
