import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import Svg, { Line } from 'react-native-svg';
import { COLORS } from '../../constants/colors';

interface GlucoseReading {
  time: string;
  level: number;
}

const getGlucoseColor = (level: number): string => {
  if (level < 70 || level > 180) return '#ef4444'; // Rojo - Crítico
  if ((level >= 70 && level < 80) || (level > 140 && level <= 180)) return '#f59e0b'; // Amarillo - Advertencia
  return '#22c55e'; // Verde - Normal
};

const getStatusText = (level: number): { text: string; color: string; bg: string } => {
  if (level < 70) return { text: 'Crítico', color: '#ef4444', bg: '#fee2e2' };
  if (level > 180) return { text: 'Crítico', color: '#ef4444', bg: '#fee2e2' };
  if ((level >= 70 && level < 80) || (level > 140 && level <= 180)) return { text: 'Advertencia', color: '#f59e0b', bg: '#fef3c7' };
  return { text: 'Normal', color: '#22c55e', bg: '#d1fae5' };
};

export default function GlucoseChart() {
  const insets = useSafeAreaInsets();
  
  const [data, setData] = useState<GlucoseReading[]>([
    { time: '08:00', level: 95 },
    { time: '10:00', level: 105 },
    { time: '12:00', level: 125 },
    { time: '14:00', level: 135 },
    { time: '16:00', level: 120 },
    { time: '18:00', level: 100 },
  ]);

  const [currentLevel, setCurrentLevel] = useState(100);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1);
      
      // Simular nueva lectura cada 5 segundos
      if (seconds % 5 === 0) {
        const newLevel = Math.max(60, Math.min(200, currentLevel + (Math.random() - 0.5) * 40));
        
        setCurrentLevel(newLevel);
        setData(prev => {
          const now = new Date();
          const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
          const newData = [...prev.slice(-5), { time: timeStr, level: Math.round(newLevel) }];
          return newData;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentLevel, seconds]);

  const latestReading = data[data.length - 1];
  const status = getStatusText(latestReading.level);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const chartWidth = 340;
  const chartHeight = 120;

  return (
    <View style={[s.screen]}>
      <LinearGradient 
        colors={[COLORS.teal, COLORS.tealLight]} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }}
        style={[s.scrollBg, { marginTop: 30 }]}
      >
        <ScrollView contentContainerStyle={[s.container]} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={s.headerInner}>
            <Image
              source={require('../../assets/images/glucoguard_logo_blanco.png')}
              style={s.logo}
              resizeMode="contain"
            />
            <Text style={s.brand}>GlucoGuard</Text>
          </View>

          {/* Main Card */}
          <View style={s.card}>
            <Text style={s.title}>Monitoreo en Tiempo Real</Text>
            <Text style={s.subtitle}>
              Visualiza tus niveles de glucosa actualizados automáticamente.
            </Text>

            {/* Chart Section */}
            <View style={s.chartSection}>
              <View style={s.levelRow}>
                <Text style={s.levelLabel}>Nivel Actual</Text>
                <Text style={[s.levelValue, { color: status.color }]}>
                  {latestReading.level}
                </Text>
              </View>

              {/* Simple Line Chart */}
              <View style={s.chartContainer}>
                <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                  {data.map((entry, index) => {
                    if (index === 0) return null;
                    
                    const prevEntry = data[index - 1];
                    const totalPoints = data.length;
                    
                    // Calcular posiciones X
                    const x1 = ((index - 1) / (totalPoints - 1)) * chartWidth;
                    const x2 = (index / (totalPoints - 1)) * chartWidth;
                    
                    // Calcular posiciones Y
                    // Rango de glucosa: 60-200
                    const yScale = (level: number) => {
                      const normalized = (level - 60) / (200 - 60);
                      return chartHeight - (normalized * chartHeight);
                    };
                    
                    const y1 = yScale(prevEntry.level);
                    const y2 = yScale(entry.level);
                    
                    const color = getGlucoseColor(entry.level);
                    
                    return (
                      <Line
                        key={`line-${index}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={color}
                        strokeWidth={3}
                        strokeLinecap="round"
                      />
                    );
                  })}
                </Svg>
              </View>

              {/* Status and Time */}
              <View style={s.statusRow}>
                <Text style={s.statusLabel}>Nivel</Text>
                <View style={s.statusRight}>
                  <View style={[s.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[s.statusText, { color: status.color }]}>
                      {status.text}
                    </Text>
                  </View>
                  <Text style={s.timeText}>{formatTime(seconds)}</Text>
                </View>
              </View>
            </View>

            {/* Legend */}
            <View style={s.legendContainer}>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: '#22c55e' }]} />
                <Text style={s.legendText}>Normal</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: '#f59e0b' }]} />
                <Text style={s.legendText}>Advertencia</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: '#ef4444' }]} />
                <Text style={s.legendText}>Crítico</Text>
              </View>
            </View>
            {/* Footer */}
            <View style={s.footer}>
              <Image
                source={require('../../assets/images/glucoguard_logo_azul.png')}
                style={s.footerLogo}
                resizeMode="contain"
              />
              <Text style={s.footerText}>GlucoGuard</Text>
            </View>
          </View>     
        </ScrollView>
      </LinearGradient>
      
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollBg: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  headerInner: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  brand: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: '#000000',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    color: '#6b7280',
  },
  chartSection: {
    marginBottom: 24,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  levelLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  levelValue: {
    fontSize: 56,
    fontWeight: '700',
  },
  chartContainer: {
    width: '100%',
    height: 120,
    marginBottom: 24,
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeText: {
    fontSize: 14,
    color: '#6b7280',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: '#6b7280',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerLogo: {
    width: 20,
    height: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#6b7280',
  },
});
