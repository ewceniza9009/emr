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
  Legend 
} from "recharts";

const GET_ENCOUNTERS = gql`
  query GetEncounters($patientId: UUID!) {
    encountersByPatient(patientId: $patientId) {
      encounterId
      type
      encounterDate
      vitalSigns {
        vitalId
        heartRate
        bloodPressureSystolic
        bloodPressureDiastolic
        respiratoryRate
        oxygenSaturation
        temperature
        weight
        recordedAt
      }
    }
  }
`;

export default function VitalsTrendChart({ patientId }: { patientId: string }) {
  const { data, loading } = useQuery(GET_ENCOUNTERS, {
    variables: { patientId }
  });

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest text-[10px]">Analyzing Vitals...</div>;
  }

  // Sort encounters chronologically for correct timeline flow
  const encounters = [...(data?.encountersByPatient || [])]
    .filter(e => e.vitalSigns && e.vitalSigns.length > 0)
    .sort((a: any, b: any) => new Date(a.encounterDate).getTime() - new Date(b.encounterDate).getTime());

  const chartData = encounters.map((e: any) => {
    const v = e.vitalSigns[0];
    return {
      date: new Date(e.encounterDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      "Heart Rate": v.heartRate ? parseFloat(v.heartRate) : null,
      "SpO2": v.oxygenSaturation ? parseFloat(v.oxygenSaturation) : null,
      "Temperature": v.temperature ? parseFloat(v.temperature) : null,
    };
  }).filter(d => d["Heart Rate"] !== null || d["SpO2"] !== null || d["Temperature"] !== null);

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 italic text-[10px] uppercase font-black tracking-widest">
        Insufficient telemetry data to plot vitals trend.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
          
          <XAxis 
            dataKey="date" 
            stroke="#64748b" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
          />
          
          {/* Left Y-axis for Heart Rate & Temp */}
          <YAxis 
            yAxisId="left"
            stroke="#64748b" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            domain={['auto', 'auto']}
            label={{ value: 'Heart Rate (bpm) / Temp (°C)', angle: -90, position: 'insideLeft', style: { fontSize: 8, fill: '#64748b', fontWeight: 'bold' } }}
          />

          {/* Right Y-axis for SpO2 */}
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#64748b" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            domain={[70, 100]}
            label={{ value: 'SpO2 (%)', angle: 90, position: 'insideRight', style: { fontSize: 8, fill: '#64748b', fontWeight: 'bold' } }}
          />

          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
            labelStyle={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}
          />
          
          <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
          
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="Heart Rate" 
            stroke="#ef4444" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#ef4444' }} 
            activeDot={{ r: 6 }} 
          />
          
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="SpO2" 
            stroke="#06b6d4" 
            strokeWidth={3} 
            dot={{ r: 4, fill: '#06b6d4' }} 
            activeDot={{ r: 6 }}
          />

          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="Temperature" 
            stroke="#f59e0b" 
            strokeWidth={2.5} 
            dot={{ r: 4, fill: '#f59e0b' }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
