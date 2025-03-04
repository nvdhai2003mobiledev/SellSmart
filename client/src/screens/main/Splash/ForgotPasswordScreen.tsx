import React, { useState } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Modal, FlatList, Text } from 'react-native';
import { Images } from '../../../assets';
import { Button, DynamicText, Input, Header } from '../../../components';
import { scaleHeight, scaledSize } from '../../../utils';
import { useNavigation } from '@react-navigation/native'; // Import hook useNavigation
import { contents } from '../../../context';

const countryCodes = [
    { code: '🇻🇳 Việt Nam', label: '+84' },
    { code: '🇺🇸 Mỹ', label: '+1' },
    { code: '🇬🇧 Anh', label: '+44' },
    { code: '🇯🇵 Nhật Bản', label: '+81' },
];

const ForgotPasswordScreen = () => {
    const navigation = useNavigation(); 

    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('vi');
    const [selectedCountryCode, setSelectedCountryCode] = useState(countryCodes[0]); 
    const [modalVisible, setModalVisible] = useState(false);

    const validatePhoneNumber = () => {
        const phoneRegex = /^[0-9]{9,10}$/;
        if (!phoneRegex.test(phone)) {
            setError('Số điện thoại không chính xác. Kiểm tra lại!');
        } else {
            setError('');
            navigation.navigate('XacMinh');
        }
    };

    return (
        <View style={styles.container}>
            <Header title="Liên kết số điện thoại" showBackIcon onPressBack={() => navigation.goBack()} /> 
            <Image source={Images.ForgotPass} style={styles.logoImage} />

            {/* Chọn mã vùng + nhập số điện thoại */}
            <View style={styles.inputWrapper}>
                {/* Button mở danh sách mã vùng */}
                <TouchableOpacity style={styles.countryCodeContainer} onPress={() => setModalVisible(true)}>
                    <Text style={styles.countryCodeText}>{selectedCountryCode.label}</Text>
                </TouchableOpacity>

                <Input
                    placeholder="Nhập số điện thoại"
                    keyboardType="numeric"
                    value={phone}
                    onChangeText={setPhone}
                    style={styles.input}
                />
            </View>

            {error ? <DynamicText style={styles.errorText}>{error}</DynamicText> : null}

            <Button
                title={contents.login.next}
                onPress={validatePhoneNumber}
                buttonContainerStyle={styles.buttonContainer}
            />

            {/* Modal chọn mã vùng */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <FlatList
                            data={countryCodes}
                            keyExtractor={(item) => item.code}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.modalItem}
                                    onPress={() => {
                                        setSelectedCountryCode(item);
                                        setModalVisible(false);
                                    }}
                                >
                                    <Text style={styles.modalText}>{item.label} ({item.code})</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <Button title="Đóng" onPress={() => setModalVisible(false)} />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        paddingTop: scaleHeight(30),
        paddingHorizontal: scaleHeight(20),
    },
    logoImage: {
        marginVertical: scaleHeight(30),
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: scaledSize(10),
        paddingHorizontal: scaledSize(20),
        width: '80%',
        height: scaleHeight(45),
        marginBottom: scaleHeight(10),
        backgroundColor: '#fff', // Màu nền cho khung input
        right:scaledSize(10)
    },
    countryCodeContainer: {
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    countryCodeText: {
        fontSize: scaledSize(16),
        fontWeight: 'bold',
    },
    input: {
        flex: 1,
        fontSize: scaledSize(16),
        paddingLeft: scaleHeight(20),
        color: '#333', // Màu văn bản trong input
    },
    errorText: {
        color: 'red',
        marginTop: scaleHeight(10),
    },
    buttonContainer: {
        marginTop: scaleHeight(15),
        marginBottom: scaleHeight(170),
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
    },
    modalItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    modalText: {
        fontSize: scaledSize(18),
        textAlign: 'center',
    },
});

export default ForgotPasswordScreen;
