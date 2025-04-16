import React from 'react';
import TabNav from '../../../navigation/TabNavigation';
import { useNavigation } from '@react-navigation/native';
import { Screen } from '../../../constants/Screen';

const HomeScreen = () => {
  const navigation = useNavigation();

  return <TabNav />;
};

export default HomeScreen;
