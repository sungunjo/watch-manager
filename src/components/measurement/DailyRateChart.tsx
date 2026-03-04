import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Circle, Path, Text as SvgText, Rect } from 'react-native-svg';
import { Measurement, ServiceRecord, ServiceType } from '../../types';
import { Colors } from '../../constants';
import { formatDate } from '../../utils/date';

interface DailyRateChartProps {
  measurements: Measurement[];
  serviceRecords?: ServiceRecord[];
  height?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_PADDING = { top: 20, right: 20, bottom: 40, left: 48 };

export function DailyRateChart({
  measurements,
  serviceRecords = [],
  height = 200,
}: DailyRateChartProps) {
  const data = useMemo(() => {
    return measurements
      .filter((m) => m.dailyRateSec !== undefined && m.endTime)
      .sort((a, b) => new Date(a.measurementDate).getTime() - new Date(b.measurementDate).getTime())
      .map((m) => ({
        date: m.measurementDate,
        rate: m.dailyRateSec as number,
        id: m.id,
      }));
  }, [measurements]);

  const overhaulDates = useMemo(() => {
    return serviceRecords
      .filter((s) => s.serviceType === ServiceType.OVERHAUL || s.serviceType === ServiceType.REGULATION)
      .map((s) => s.serviceDate);
  }, [serviceRecords]);

  if (data.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>
          {data.length === 0 ? '측정 데이터 없음' : '측정 데이터가 2개 이상 필요합니다'}
        </Text>
      </View>
    );
  }

  const chartWidth = SCREEN_WIDTH - 32;
  const plotWidth = chartWidth - CHART_PADDING.left - CHART_PADDING.right;
  const plotHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;

  const rates = data.map((d) => d.rate);
  const minRate = Math.min(...rates);
  const maxRate = Math.max(...rates);
  const rateRange = maxRate - minRate || 2;
  const paddedMin = minRate - rateRange * 0.1;
  const paddedMax = maxRate + rateRange * 0.1;
  const paddedRange = paddedMax - paddedMin;

  const dates = data.map((d) => new Date(d.date).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const dateRange = maxDate - minDate || 1;

  const toX = (date: string) =>
    CHART_PADDING.left + ((new Date(date).getTime() - minDate) / dateRange) * plotWidth;

  const toY = (rate: number) =>
    CHART_PADDING.top + ((paddedMax - rate) / paddedRange) * plotHeight;

  // Path 생성
  const pathData = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(d.date).toFixed(1)} ${toY(d.rate).toFixed(1)}`)
    .join(' ');

  // 0선 Y 좌표
  const zeroY = toY(0);

  // Y축 눈금
  const yTicks: number[] = [];
  const tickStep = Math.ceil(paddedRange / 5);
  const firstTick = Math.ceil(paddedMin);
  for (let t = firstTick; t <= paddedMax; t += Math.max(1, tickStep)) {
    yTicks.push(t);
  }

  const average = rates.reduce((a, b) => a + b, 0) / rates.length;

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height}>
        {/* 배경 그리드 */}
        {yTicks.map((tick) => {
          const y = toY(tick);
          if (y < CHART_PADDING.top || y > height - CHART_PADDING.bottom) return null;
          return (
            <React.Fragment key={tick}>
              <Line
                x1={CHART_PADDING.left}
                y1={y}
                x2={chartWidth - CHART_PADDING.right}
                y2={y}
                stroke={Colors.border}
                strokeWidth={1}
                strokeDasharray={tick === 0 ? '' : '4,4'}
              />
              <SvgText
                x={CHART_PADDING.left - 6}
                y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill={tick === 0 ? Colors.textSecondary : Colors.textMuted}
                fontWeight={tick === 0 ? '600' : '400'}
              >
                {tick > 0 ? `+${tick}` : tick}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* 0선 강조 */}
        {zeroY >= CHART_PADDING.top && zeroY <= height - CHART_PADDING.bottom && (
          <Line
            x1={CHART_PADDING.left}
            y1={zeroY}
            x2={chartWidth - CHART_PADDING.right}
            y2={zeroY}
            stroke={Colors.textSecondary}
            strokeWidth={1.5}
          />
        )}

        {/* 오버홀/레귤레이션 마커 */}
        {overhaulDates.map((date, i) => {
          const d = new Date(date).getTime();
          if (d < minDate || d > maxDate) return null;
          const x = CHART_PADDING.left + ((d - minDate) / dateRange) * plotWidth;
          return (
            <React.Fragment key={i}>
              <Line
                x1={x}
                y1={CHART_PADDING.top}
                x2={x}
                y2={height - CHART_PADDING.bottom}
                stroke={Colors.gold}
                strokeWidth={1.5}
                strokeDasharray="6,3"
              />
              <SvgText
                x={x + 3}
                y={CHART_PADDING.top + 10}
                fontSize={9}
                fill={Colors.gold}
              >
                OH
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* 평균선 */}
        {(() => {
          const avgY = toY(average);
          if (avgY >= CHART_PADDING.top && avgY <= height - CHART_PADDING.bottom) {
            return (
              <Line
                x1={CHART_PADDING.left}
                y1={avgY}
                x2={chartWidth - CHART_PADDING.right}
                y2={avgY}
                stroke={Colors.accentLight}
                strokeWidth={1}
                strokeDasharray="8,4"
                opacity={0.6}
              />
            );
          }
          return null;
        })()}

        {/* 라인 */}
        <Path
          d={pathData}
          stroke={Colors.gold}
          strokeWidth={2}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* 데이터 포인트 */}
        {data.map((d) => {
          const x = toX(d.date);
          const y = toY(d.rate);
          const isPositive = d.rate >= 0;
          return (
            <Circle
              key={d.id}
              cx={x}
              cy={y}
              r={4}
              fill={isPositive ? Colors.warning : Colors.info}
              stroke={Colors.background}
              strokeWidth={1.5}
            />
          );
        })}

        {/* X축 날짜 레이블 (첫/마지막) */}
        <SvgText
          x={CHART_PADDING.left}
          y={height - 6}
          fontSize={9}
          fill={Colors.textMuted}
          textAnchor="start"
        >
          {formatDate(new Date(data[0].date))}
        </SvgText>
        <SvgText
          x={chartWidth - CHART_PADDING.right}
          y={height - 6}
          fontSize={9}
          fill={Colors.textMuted}
          textAnchor="end"
        >
          {formatDate(new Date(data[data.length - 1].date))}
        </SvgText>
      </Svg>

      {/* 통계 요약 */}
      <View style={styles.stats}>
        <StatItem
          label="평균 일차"
          value={`${average >= 0 ? '+' : ''}${average.toFixed(1)} s/day`}
          color={Math.abs(average) <= 5 ? Colors.success : Colors.warning}
        />
        <StatItem
          label="최대"
          value={`+${Math.max(...rates).toFixed(1)}s`}
          color={Colors.warning}
        />
        <StatItem
          label="최소"
          value={`${Math.min(...rates).toFixed(1)}s`}
          color={Colors.info}
        />
        <StatItem
          label="측정 횟수"
          value={`${data.length}회`}
          color={Colors.textSecondary}
        />
      </View>
    </View>
  );
}

function StatItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 16,
  },
  empty: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
});
