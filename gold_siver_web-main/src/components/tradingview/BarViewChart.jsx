import React from "react";
import "./BarViewChart.css";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
export default function GrowBarChart({
    p1, p2, p3, p4, p5, p6
}) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const data = [
        { name: 'ancarat', value: p1, fill: p1 >= 0 ? "#00C26F" : "#FF4D4D" },
        { name: 'Kim Ngan Phuc', value: p2, fill: p2 >= 0 ? "#00C26F" : "#FF4D4D" },
        { name: 'Nguyên Liệu', value: p3, fill: p3 >= 0 ? "#00C26F" : "#FF4D4D" },
        { name: 'Phú Quý', value: p4, fill: p4 >= 0 ? "#00C26F" : "#FF4D4D" },
        { name: 'Quốc Tế', value: p5, fill: p5 >= 0 ? "#00C26F" : "#FF4D4D" },
        { name: 'Sacombank', value: p6, fill: p6 >= 0 ? "#00C26F" : "#FF4D4D" },

    ];

    return (
        <div className="contain-bar-chart">
            <a className="title-bar-chart" onClick={() => navigate('/xauxagdetail')}> {t("growBarChart.title")}</a>
            <ResponsiveContainer>
                <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                    <CartesianGrid stroke="#2A2A2A" strokeDasharray="3 3" />

                    <XAxis
                        dataKey="name"
                        stroke="#999"
                        tick={{ fill: "#999" }}
                    />
                    <YAxis
                        stroke="#999"
                        tick={{ fill: "#999" }}
                    />

                    <Tooltip
                        contentStyle={{
                            backgroundColor: "#c2c0c0c1",
                            border: "1px solid #979797ff",
                        }}
                        labelStyle={{ color: "#000000ff" }}
                    />

                    <Bar
                        dataKey="value"
                        radius={[4, 4, 0, 0]}
                        background={false}
                        barSize={30}
                    >
                        {data.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}