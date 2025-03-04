import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Text } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { BarChart } from "react-native-chart-kit";
import { BaseLayout, DynamicText, Header } from "../../../components";
import { scaledSize, scaleHeight } from "../../../utils"; // Import responsive utils
import { Notification } from "iconsax-react-native";
import { contents } from '../../../context';

const data1 = [
  { id: 1, title: "Tổng đơn", icon: "clipboard-outline", count: 3 },
  { id: 2, title: "Chờ thanh toán", icon: "calendar-outline", count: 5 },
  { id: 3, title: "Hủy", icon: "clipboard-outline", count: 0 },
];


const screenWidth = Dimensions.get("window").width;

const data = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      data: [30, 70, 100, 80, 40, 90],
    },
  ],
};

const barColors = ["#ff0000", "#ff9900", "#33cc33", "#0066ff", "#9900cc", "#ff3399"]; // Màu riêng cho từng cột

const HomeScreen = () => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  const [selectedTab, setSelectedTab] = useState("all");

  return (
    <BaseLayout>
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="SellSmart" showBackIcon={false} onPressBack={() => { }} showRightIcon RightIcon={<Notification />} />
        {/* Tabs chọn thời gian */}
        {/* <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <DynamicText style={styles.activeTabText}>Hôm nay</DynamicText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <DynamicText style={styles.tabText}>Tuần này</DynamicText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <DynamicText style={styles.tabText}>Tháng này</DynamicText>
          </TouchableOpacity>
        </View> */}


        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "all" && styles.activeTab]}
            onPress={() => setSelectedTab("all")}
          >
   
            <DynamicText style={styles.tabText}>{contents.home.today}</DynamicText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "promo" && styles.activeTab]}
            onPress={() => setSelectedTab("promo")}
          >
           <DynamicText style={styles.tabText}>{contents.home.week}</DynamicText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "order" && styles.activeTab]}
            onPress={() => setSelectedTab("order")}
          >
            <DynamicText style={styles.tabText}>{contents.home.month}</DynamicText>
          </TouchableOpacity>
        </View>


        <View style={styles.infoContainer}>
          {/* Card doanh thu hôm nay */}
          <View style={styles.revenueCard}>
            <View>
              <DynamicText style={styles.cardTitle}>{contents.home.doanhthuhomnay}</DynamicText>
              <View style={styles.dateRow}>
                <Icon name="calendar-outline" size={14} color="#6c757d" />
                <DynamicText style={styles.cardTitle}>{contents.home.date}</DynamicText>
              </View>
              <DynamicText style={styles.cardValue}>{contents.home.price}</DynamicText>
            </View>
            <Icon style={styles.hihi} name="chevron-forward-outline" size={24} color="#007bff" />
          </View>

          {/* Chỉ số nhỏ - Xếp dọc bên phải */}
          <View style={styles.statsContainer}>
            <View style={[styles.statBox, styles.lightBlue]}>
              <DynamicText style={styles.statLabel}>{contents.home.gtridon}</DynamicText>
              <DynamicText style={styles.statValue}>{contents.home.price}</DynamicText>
            </View>
            <View style={[styles.statBox, styles.lightGreen]}>
              <DynamicText style={styles.statLabel}>{contents.home.sldangban}</DynamicText>
              <DynamicText style={styles.statValue}>{contents.home.soluong}</DynamicText>
            </View>
          </View>
        </View>


        {/* Biểu đồ doanh thu */}
        <View style={styles.chartContainer}>
          <View
            style={{
              backgroundColor: "#fff",
              padding: 20,
              borderRadius: 20,
              height: "69%",
              marginBottom:scaleHeight(10)
            }}
          >
            <ScrollView horizontal>
              <BarChart
                data={data}
                width={screenWidth * 0.9}
                height={250}
                yAxisLabel=""
                chartConfig={{
                  backgroundGradientFrom: "white",
                  backgroundGradientTo: "white",
                  color: (opacity = 1, index) => {
                    if (selectedIndex === null) {
                      return barColors[index % barColors.length];
                    }
                    return index === selectedIndex
                      ? barColors[index % barColors.length]
                      : `${barColors[index % barColors.length]}55`;
                  },
                  strokeWidth: 4,
                  barRadius: 20,
                }}
                showValuesOnTopOfBars
                fromZero
                onDataPointClick={({ index }) => setSelectedIndex(index)}
              />
            </ScrollView>
          </View>
        </View>



        <View style={styles.container2}>
          <DynamicText style={styles.headerText}>{contents.home.kquaKD}</DynamicText>
          {data1.map((item, index) => (
            <TouchableOpacity key={item.id} style={[styles.row, index < data1.length - 1 && styles.borderBottom]}>
              <View style={styles.rowLeft}>
                <Icon name={item.icon} size={scaledSize(15)} color="#333" />
                <DynamicText style={styles.title}>{item.title}</DynamicText>
              </View>
              <View style={styles.rowRight}>
                <DynamicText style={styles.count}>{item.count}</DynamicText>
                <Icon name="chevron-forward-outline" size={scaledSize(18)} color="#333" />
              </View>
            </TouchableOpacity>
          ))}
        </View>



      </ScrollView>
    </BaseLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: scaleHeight(5),
  },



  tabs: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "white",
    borderRadius: 10,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "200",
  },


  hihi: {
    marginLeft: scaledSize(150),
    marginTop: scaledSize(-250),
    marginBottom: scaleHeight(75)

  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",

  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "stretch", // Căn đều chiều cao các card
    width: "100%",
    marginTop: scaleHeight(-15)
  },
  revenueCard: {
    backgroundColor: "#e7f1ff",
    padding: scaleHeight(10),
    borderRadius: scaledSize(10),
    width: "60%", // Chiếm bên trái lớn hơn
    height: scaledSize(120), // Tăng chiều cao để tránh trống
    flexDirection: "column", // Chuyển về dọc
    alignItems: "flex-start", // Căn chữ lên trên
    justifyContent: "space-between", // Tránh bị trống dưới
    maxHeight: scaleHeight(120),
    marginTop:scaleHeight(25)
  },

  cardTitle: {
    fontSize: scaledSize(13),
    color: "#333",

  },
  cardValue: {
    fontSize: scaledSize(16),
    fontWeight: "bold",
    marginTop: scaleHeight(10),
  },
  header: {
    fontSize: scaledSize(20),
    fontWeight: "bold",
    marginBottom: scaleHeight(20),
  },
  statsContainer: {
    flexDirection: "column",
    justifyContent: "space-between",
    width: "40%", // Card nhỏ xếp dọc bên phải
    marginTop:scaleHeight(21)
  },
  statBox: {
    flex: 1,
    padding: scaleHeight(12),
    borderRadius: scaledSize(12),
    alignItems: "center",
    justifyContent: "center",
    marginVertical: scaledSize(5), // Khoảng cách giữa 2 card nhỏ
    height: scaleHeight(51),
    marginTop: scaleHeight(5),
    marginLeft: scaledSize(10)
  },
  lightBlue: {
    backgroundColor: "#CCFFFF",
  },
  lightGreen: {
    backgroundColor: "#e8f5e9",
  },
  statLabel: {
    fontSize: scaledSize(13),
    color: "#333",
    marginRight: scaleHeight(40),
    paddingTop: scaleHeight(5)
  },
  statValue: {
    fontSize: scaledSize(18),
    fontWeight: "bold",
    marginRight: scaleHeight(75)
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#f8f9fa",
    padding: scaleHeight(8),
    borderRadius: scaledSize(12),
    marginBottom: scaleHeight(20),
  },
  tab: {
    flex: 1,
    paddingVertical: scaleHeight(10),
    borderRadius: scaledSize(10),
    alignItems: "center",
    marginHorizontal: scaledSize(5),
    backgroundColor: "#ffffff",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  activeTab: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#0056b3",
  },
  tabText: {
    fontSize: scaledSize(16),
    color: "black",
    fontWeight: "500",
  },
  activeTabText: {
    fontSize: scaledSize(16),
    color: "black",
  },
  chartContainer: {
    marginTop: scaleHeight(10)
  },




  container2: {
    backgroundColor: "white",
    borderRadius: scaledSize(12),
    padding: scaledSize(10),
    marginTop: scaleHeight(-120), // Thêm marginTop để tránh bị che
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
    height: "90%"
  },

  headerText: {
    fontSize: scaledSize(14),
    fontWeight: "500",
    color: "#777",
    marginBottom: scaleHeight(10),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: scaleHeight(8),
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: scaledSize(14),
    marginLeft: scaledSize(10),
    color: "#333",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  count: {
    fontSize: scaledSize(14),
    color: "#333",
    marginRight: scaledSize(5),
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },


});

export default HomeScreen;
