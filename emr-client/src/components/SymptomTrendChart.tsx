"use client";

import { useQuery, gql } from "@apollo/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const GET_ESAS_HISTORY = gql`
  query GetEsasHistory($patientId: UUID!) {
    esasHistoryByPatient(patientId: $patientId) {
      assessmentId
      pain
      tiredness
      anxiety
      assessedAt
    }
  }
`;

export default function SymptomTrendChart({
  patientId,
}: {
  patientId: string;
}) {
  const { data, loading } = useQuery(GET_ESAS_HISTORY, {
    variables: { patientId },
  });

  if (loading)
    return (
      <div className="h-64 flex items-center justify-center text-slate-500">
        Loading Trends...
      </div>
    );

  const chartData =
    data?.esasHistoryByPatient?.map((e: any) => ({
      name: new Date(e.assessedAt).toLocaleDateString(),
      Pain: e.pain,
      Tiredness: e.tiredness,
      Anxiety: e.anxiety,
    })) || [];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={100}
        minHeight={100}
      >
        <LineChart data={chartData}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--divider-color)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            stroke="var(--text-muted)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--text-muted)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            domain={[0, 10]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: "12px",
              color: "var(--text-primary)",
            }}
            itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
            labelStyle={{
              fontSize: "10px",
              color: "var(--text-muted)",
              fontWeight: "bold",
              marginBottom: "4px",
            }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: "10px", paddingTop: "10px" }}
          />
          <Line
            type="monotone"
            dataKey="Pain"
            stroke="#ef4444"
            strokeWidth={3}
            dot={{ r: 4, fill: "#ef4444" }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Anxiety"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ r: 4, fill: "#3b82f6" }}
          />
          <Line
            type="monotone"
            dataKey="Tiredness"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 4, fill: "#10b981" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
