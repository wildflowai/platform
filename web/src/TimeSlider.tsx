import React, { useState, useCallback } from "react";
import {
  AreaChart,
  XAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  TooltipProps,
  Area,
} from "recharts";

export interface TimeData {
  date_millis: number;
  count: number;
}

interface TimeSliderProps {
  data: TimeData[];
  onDateChange: (date: number) => void;
}

const CustomizedAxisTick: React.FC<any> = ({ x, y, payload, data }) => {
  const dateText = new Date(payload.value).toLocaleDateString();
  const dataMax = Math.max(...data.map((item: any) => item.date_millis));
  const dataMin = Math.min(...data.map((item: any) => item.date_millis));
  if (payload.value === dataMin || payload.value === dataMax) {
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} dx={16} textAnchor="end" fill="#FFFFFF">
          {dateText}
        </text>
      </g>
    );
  } else {
    return null;
  }
};

const CustomTooltip: React.FC<TooltipProps<any, string>> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    const date = new Date(Number(payload[0].payload.date_millis));
    return (
      <div className="custom-tooltip">
        <p className="label">{`Date: ${date.toLocaleDateString()}`}</p>
        <p className="intro">{`Count: ${
          Math.round(payload[0].value * 100) / 100
        }`}</p>
      </div>
    );
  }
  return null;
};
const getClosestDataPoint = (aa: TimeData[], value: number) => {
  return aa.reduce((prev, curr) =>
    Math.abs(curr.date_millis - value) < Math.abs(prev.date_millis - value)
      ? curr
      : prev
  );
};

const TimeSlider: React.FC<TimeSliderProps> = ({ data, onDateChange }) => {
  const [selectedDate, setSelectedDate] = useState<number>(data[0].date_millis);

  const handleClick = useCallback(
    (inputData: any, index: number) => {
      const clickedDate = inputData?.activePayload[0].payload.date_millis;
      if (clickedDate) {
        const closestPoint = getClosestDataPoint(data, clickedDate);
        const closestDate = closestPoint.date_millis;
        setSelectedDate(closestDate);
        onDateChange(closestDate);
      }
    },
    [onDateChange]
  );

  return (
    <div className="mt-4 w-full bg-white bg-opacity-0">
      <div className="w-full">
        <ResponsiveContainer width="100%" height={100}>
          <AreaChart data={data} onClick={handleClick}>
            <XAxis
              type="number"
              dataKey="date_millis"
              tick={(props) => <CustomizedAxisTick {...props} data={data} />}
              interval="preserveStartEnd"
              domain={["dataMin", "dataMax"]}
              stroke="transparent"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#FFFFFF"
              fill="#FFFFFF"
              strokeWidth={2}
              dot={false}
            />
            <ReferenceLine
              x={selectedDate}
              label={{
                value: new Date(Number(selectedDate)).toLocaleDateString(),
                fill: "#FFFFFF",
                position: "insideTopRight",
              }}
              stroke="red"
              strokeWidth={3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TimeSlider;
