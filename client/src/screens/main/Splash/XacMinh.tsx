import React, { useState } from 'react';
import { View, StyleSheet, Image, TextInput, TouchableOpacity } from 'react-native';
import { Images } from '../../../assets';
import { Button, Header, DynamicText } from '../../../components';
import { scaleHeight, scaledSize } from '../../../utils';
import RNPickerSelect from 'react-native-picker-select';
import { useNavigation } from '@react-navigation/native';
import { contents } from '../../../context';

const XacMinh = () => {
    const navigation = useNavigation();
    const [otp, setOtp] = useState(['', '', '', '']);
    const [error, setError] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('vi');

    const handleOtpChange = (value, index) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
    };

    return (
        <View style={styles.container}>
            <Header title="Xác minh" showBackIcon onPressBack={() => { }} />
            <Image source={Images.Dienthoai} style={styles.logoImage} />
            <DynamicText style={styles.instructionText}>{contents.xacminh.nhapma}</DynamicText>

            <DynamicText style={styles.phoneNumber}>{contents.xacminh.phone}</DynamicText>


            <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                    <TextInput
                        key={index}
                        style={styles.otpInput}
                        keyboardType="numeric"
                        maxLength={1}
                        value={digit}
                        onChangeText={(value) => handleOtpChange(value, index)}
                    />
                ))}
            </View>

            {error !== '' && <DynamicText style={styles.errorText}>{error}</DynamicText>}

            <TouchableOpacity>

                <DynamicText style={styles.resendText}>{contents.xacminh.guilai}</DynamicText>
            </TouchableOpacity>

          
               <Button
                      title={contents.login.next}
                      buttonContainerStyle={styles.buttonContainer}
                    />

            <View style={styles.languagePickerContainer}>
                <RNPickerSelect
                    onValueChange={(value) => setSelectedLanguage(value)}
                    items={[{ label: '🇻🇳 Tiếng Việt', value: 'vi' }, { label: '🇬🇧 English', value: 'en' }]}
                    style={pickerSelectStyles}
                    value={selectedLanguage}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        paddingTop: scaleHeight(30),
    },
    logoImage: {
        marginVertical: scaleHeight(30),
    },
    instructionText: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
    },
    phoneNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: scaleHeight(10),
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: scaleHeight(20),
    },
    otpInput: {
        width: 50,
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        textAlign: 'center',
        fontSize: 20,
        marginHorizontal: 5,
        borderRadius: 8,
    },
    errorText: {
        color: 'red',
        marginTop: 10,
    },
    resendText: {
        color: '#007bff',
        marginTop: 10,
    },
    buttonContainer: {
        marginTop: scaleHeight(20),
        width: '80%',
    },
    languagePickerContainer: {
        marginTop: scaleHeight(200),
        alignSelf: 'center',
        width: "80%",
        paddingVertical: 8,
        paddingHorizontal: 80,
        marginLeft: 20,
    },
});

const pickerSelectStyles = {
    inputIOS: { fontSize: 16, padding: 10, borderRadius: 5, color: 'black' },
    inputAndroid: { fontSize: 16, padding: 10, borderRadius: 5, color: 'black' },
};

export default XacMinh;