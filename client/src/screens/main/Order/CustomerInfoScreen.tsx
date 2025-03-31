import React, { useState } from 'react';
import { View, Text, StyleSheet,TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { BaseLayout, Input, Button } from '../../../components';

const CustomerInfoScreen = () => {
  const [phone, setPhone] = useState('0398289916');
  const [name, setName] = useState('Nguyễn Văn A');
  const [dob, setDob] = useState('16/02/2003');
  const [address, setAddress] = useState('Mỹ Đình, Nam Từ Liêm, Hà Nội');

  const renderInput = (label, value, setValue) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <Input
        value={value}
        onChangeText={setValue}
        inputContainerStyle={styles.inputWrapper}
        EndIcon={
          <TouchableOpacity onPress={() => setValue('')}>
            <Icon name="x-circle" size={18} color="#B0B0B0" />
          </TouchableOpacity>
        }
      />
    </View>
  );

  return (
    <BaseLayout>
      <Text style={styles.title}>Thông tin khách hàng</Text>
      {renderInput('Số điện thoại', phone, setPhone)}
      {renderInput('Tên khách hàng', name, setName)}
      {renderInput('Ngày sinh', dob, setDob)}
      {renderInput('Địa chỉ', address, setAddress)}
      <Button
        title="Tiếp tục"
        buttonContainerStyle={styles.button}
        titleStyle={styles.buttonText}
      />
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F7F7F7',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomerInfoScreen;
