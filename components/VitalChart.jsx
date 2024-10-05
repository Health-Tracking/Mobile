import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
        borderRadius: 16,
    },
};

const data = {
    labels: ['1일', '2일', '3일', '4일', '5일', '6일', '7일'],
    datasets: [
        {
            data: [98, 97, 99, 98, 97, 98, 99],
            color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
            strokeWidth: 2,
        },
    ],
};

export default function VitalChart() {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.chartContainer}>
                <Text style={styles.title}>산소포화도</Text>
                <LineChart
                    data={data}
                    width={screenWidth - 40}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                />
            </View>

            <View style={styles.chartContainer}>
                <Text style={styles.title}>혈압</Text>
                <LineChart
                    data={{
                        ...data,
                        datasets: [
                            {
                                data: [120, 118, 122, 119, 121, 120, 123],
                                color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
                                strokeWidth: 2,
                            },
                        ],
                    }}
                    width={screenWidth - 40}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                />
            </View>

            <View style={styles.chartContainer}>
                <Text style={styles.title}>혈당</Text>
                <LineChart
                    data={{
                        ...data,
                        datasets: [
                            {
                                data: [100, 105, 95, 110, 98, 102, 97],
                                color: (opacity = 1) => `rgba(0, 255, 0, ${opacity})`,
                                strokeWidth: 2,
                            },
                        ],
                    }}
                    width={screenWidth - 40}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    chartContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        padding: 20,
        marginVertical: 10,
        marginHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
});