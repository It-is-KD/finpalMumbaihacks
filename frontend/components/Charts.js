<<<<<<< HEAD
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { theme, spacing } from '../theme';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: '#fff',
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(29, 137, 115, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(66, 67, 67, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: theme.colors.primary,
  },
};

export const CategoryPieChart = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const colors = [
    '#1d8973', '#286098', '#FF9800', '#E91E63', '#9C27B0',
    '#4CAF50', '#00BCD4', '#795548', '#F44336', '#3F51B5',
  ];

  const chartData = data.slice(0, 8).map((item, index) => ({
    name: item.name || item.category,
    amount: parseFloat(item.amount || item.total) || 0,
    color: colors[index % colors.length],
    legendFontColor: theme.colors.text,
    legendFontSize: 12,
  }));

  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <PieChart
        data={chartData}
        width={screenWidth - 32}
        height={200}
        chartConfig={chartConfig}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="0"
        absolute
      />
    </View>
  );
};

export const SpendingBarChart = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const chartData = {
    labels: data.slice(0, 6).map(item => 
      (item.name || item.category || '').substring(0, 6)
    ),
    datasets: [{
      data: data.slice(0, 6).map(item => 
        parseFloat(item.amount || item.total) || 0
      ),
    }],
  };

  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <BarChart
        data={chartData}
        width={screenWidth - 32}
        height={220}
        chartConfig={{
          ...chartConfig,
          barPercentage: 0.6,
        }}
        style={styles.chart}
        showValuesOnTopOfBars
        fromZero
      />
    </View>
  );
};

export const TrendLineChart = ({ data, title, labels }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const chartData = {
    labels: labels || data.map((_, i) => `W${i + 1}`),
    datasets: [{
      data: data.map(d => parseFloat(d) || 0),
      strokeWidth: 2,
    }],
  };

  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <LineChart
        data={chartData}
        width={screenWidth - 32}
        height={200}
        chartConfig={{
          ...chartConfig,
          fillShadowGradientFrom: theme.colors.primary,
          fillShadowGradientTo: 'rgba(29, 137, 115, 0.1)',
        }}
        style={styles.chart}
        bezier
        withInnerLines={false}
        withOuterLines={false}
      />
    </View>
  );
};

export const SavingsProgressChart = ({ current, target }) => {
  const progress = (current / target) * 100;
  const data = {
    labels: ['Saved', 'Remaining'],
    datasets: [{
      data: [current || 0, Math.max(0, (target || 0) - (current || 0))],
    }],
  };

  const pieData = [
    {
      name: 'Saved',
      amount: current || 0,
      color: theme.colors.primary,
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Remaining',
      amount: Math.max(0, (target || 0) - (current || 0)),
      color: theme.colors.gray300,
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    },
  ];

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Goal Progress</Text>
      <View style={styles.progressCenter}>
        <PieChart
          data={pieData}
          width={screenWidth - 32}
          height={160}
          chartConfig={chartConfig}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="30"
          hasLegend={false}
        />
        <View style={styles.progressOverlay}>
          <Text style={styles.progressPercent}>{progress.toFixed(0)}%</Text>
          <Text style={styles.progressLabel}>Complete</Text>
        </View>
      </View>
    </View>
  );
};

export const MonthlyComparisonChart = ({ thisMonth, lastMonth }) => {
  const data = {
    labels: ['Last Month', 'This Month'],
    datasets: [{
      data: [lastMonth || 0, thisMonth || 0],
    }],
  };

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Monthly Comparison</Text>
      <BarChart
        data={data}
        width={screenWidth - 32}
        height={180}
        chartConfig={{
          ...chartConfig,
          barPercentage: 0.5,
        }}
        style={styles.chart}
        showValuesOnTopOfBars
        fromZero
      />
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.md,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.md,
  },
  chart: {
    borderRadius: 16,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: theme.colors.gray500,
    fontSize: 14,
  },
  progressCenter: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercent: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  progressLabel: {
    fontSize: 12,
    color: theme.colors.gray500,
  },
});
=======
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { theme, spacing } from '../theme';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: '#fff',
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(29, 137, 115, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(66, 67, 67, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: theme.colors.primary,
  },
};

export const CategoryPieChart = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const colors = [
    '#1d8973', '#286098', '#FF9800', '#E91E63', '#9C27B0',
    '#4CAF50', '#00BCD4', '#795548', '#F44336', '#3F51B5',
  ];

  const chartData = data.slice(0, 8).map((item, index) => ({
    name: item.name || item.category,
    amount: parseFloat(item.amount || item.total) || 0,
    color: colors[index % colors.length],
    legendFontColor: theme.colors.text,
    legendFontSize: 12,
  }));

  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <PieChart
        data={chartData}
        width={screenWidth - 32}
        height={200}
        chartConfig={chartConfig}
        accessor="amount"
        backgroundColor="transparent"
        paddingLeft="0"
        absolute
      />
    </View>
  );
};

export const SpendingBarChart = ({ data, title }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const chartData = {
    labels: data.slice(0, 6).map(item => 
      (item.name || item.category || '').substring(0, 6)
    ),
    datasets: [{
      data: data.slice(0, 6).map(item => 
        parseFloat(item.amount || item.total) || 0
      ),
    }],
  };

  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <BarChart
        data={chartData}
        width={screenWidth - 32}
        height={220}
        chartConfig={{
          ...chartConfig,
          barPercentage: 0.6,
        }}
        style={styles.chart}
        showValuesOnTopOfBars
        fromZero
      />
    </View>
  );
};

export const TrendLineChart = ({ data, title, labels }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const chartData = {
    labels: labels || data.map((_, i) => `W${i + 1}`),
    datasets: [{
      data: data.map(d => parseFloat(d) || 0),
      strokeWidth: 2,
    }],
  };

  return (
    <View style={styles.chartContainer}>
      {title && <Text style={styles.chartTitle}>{title}</Text>}
      <LineChart
        data={chartData}
        width={screenWidth - 32}
        height={200}
        chartConfig={{
          ...chartConfig,
          fillShadowGradientFrom: theme.colors.primary,
          fillShadowGradientTo: 'rgba(29, 137, 115, 0.1)',
        }}
        style={styles.chart}
        bezier
        withInnerLines={false}
        withOuterLines={false}
      />
    </View>
  );
};

export const SavingsProgressChart = ({ current, target }) => {
  const progress = (current / target) * 100;
  const data = {
    labels: ['Saved', 'Remaining'],
    datasets: [{
      data: [current || 0, Math.max(0, (target || 0) - (current || 0))],
    }],
  };

  const pieData = [
    {
      name: 'Saved',
      amount: current || 0,
      color: theme.colors.primary,
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    },
    {
      name: 'Remaining',
      amount: Math.max(0, (target || 0) - (current || 0)),
      color: theme.colors.gray300,
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    },
  ];

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Goal Progress</Text>
      <View style={styles.progressCenter}>
        <PieChart
          data={pieData}
          width={screenWidth - 32}
          height={160}
          chartConfig={chartConfig}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="30"
          hasLegend={false}
        />
        <View style={styles.progressOverlay}>
          <Text style={styles.progressPercent}>{progress.toFixed(0)}%</Text>
          <Text style={styles.progressLabel}>Complete</Text>
        </View>
      </View>
    </View>
  );
};

export const MonthlyComparisonChart = ({ thisMonth, lastMonth }) => {
  const data = {
    labels: ['Last Month', 'This Month'],
    datasets: [{
      data: [lastMonth || 0, thisMonth || 0],
    }],
  };

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Monthly Comparison</Text>
      <BarChart
        data={data}
        width={screenWidth - 32}
        height={180}
        chartConfig={{
          ...chartConfig,
          barPercentage: 0.5,
        }}
        style={styles.chart}
        showValuesOnTopOfBars
        fromZero
      />
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.md,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.md,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: spacing.md,
  },
  chart: {
    borderRadius: 16,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: theme.colors.gray500,
    fontSize: 14,
  },
  progressCenter: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercent: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  progressLabel: {
    fontSize: 12,
    color: theme.colors.gray500,
  },
});
>>>>>>> 2c5691fad8196faad9092c0293bb4957adef9391
