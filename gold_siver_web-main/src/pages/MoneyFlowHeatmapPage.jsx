import React from 'react';
import { useTranslation } from 'react-i18next';
import MoneyFlowHeatmap from '../components/money-flow-heatmap/MoneyFlowHeatmap';
import './MoneyFlowHeatmapPage.css';

const MoneyFlowHeatmapPage = () => {
    const { t } = useTranslation();

    return (
        <div className="money-flow-heatmap-page">
            <div className="page-header">
                <h1>{t("MoneyFlowHeatmap.title")}</h1>
                <p className="page-subtitle">
                    {t("MoneyFlowHeatmap.subtitle")}
                </p>
            </div>

            <div className="page-content">
                <MoneyFlowHeatmap />
            </div>

            <div className="page-info-section">
                <div className="info-card">
                    <h3>{t("MoneyFlowHeatmap.instructions.title")}</h3>
                    <ul>
                        <li><strong>{t("MoneyFlowHeatmap.instructions.boxSize")}</strong> {t("MoneyFlowHeatmap.instructions.boxSizeDesc")}</li>
                        <li><strong>{t("MoneyFlowHeatmap.instructions.green")}</strong> {t("MoneyFlowHeatmap.instructions.greenDesc")}</li>
                        <li><strong>{t("MoneyFlowHeatmap.instructions.yellow")}</strong> {t("MoneyFlowHeatmap.instructions.yellowDesc")}</li>
                        <li><strong>{t("MoneyFlowHeatmap.instructions.red")}</strong> {t("MoneyFlowHeatmap.instructions.redDesc")}</li>
                        <li><strong>{t("MoneyFlowHeatmap.instructions.zoom")}</strong> {t("MoneyFlowHeatmap.instructions.zoomDesc")}</li>
                    </ul>
                </div>

                <div className="info-card">
                    <h3>{t("MoneyFlowHeatmap.assetGroups.title")}</h3>
                    <div className="asset-groups-list">
                        <div className="group-item">
                            <span className="group-icon">💻</span>
                            <span>{t("MoneyFlowHeatmap.assetGroups.aiTech")}</span>
                        </div>
                        <div className="group-item">
                            <span className="group-icon">🏦</span>
                            <span>{t("MoneyFlowHeatmap.assetGroups.banking")}</span>
                        </div>
                        <div className="group-item">
                            <span className="group-icon">🏠</span>
                            <span>{t("MoneyFlowHeatmap.assetGroups.realEstate")}</span>
                        </div>
                        <div className="group-item">
                            <span className="group-icon">⚡</span>
                            <span>{t("MoneyFlowHeatmap.assetGroups.energy")}</span>
                        </div>
                        <div className="group-item">
                            <span className="group-icon">🛠️</span>
                            <span>{t("MoneyFlowHeatmap.assetGroups.manufacturing")}</span>
                        </div>
                        <div className="group-item">
                            <span className="group-icon">💱</span>
                            <span>{t("MoneyFlowHeatmap.assetGroups.forex")}</span>
                        </div>
                        <div className="group-item">
                            <span className="group-icon">₿</span>
                            <span>{t("MoneyFlowHeatmap.assetGroups.crypto")}</span>
                        </div>
                        <div className="group-item">
                            <span className="group-icon">🥇</span>
                            <span>{t("MoneyFlowHeatmap.assetGroups.metals")}</span>
                        </div>
                        <div className="group-item">
                            <span className="group-icon">📊</span>
                            <span>{t("MoneyFlowHeatmap.assetGroups.globalIndices")}</span>
                        </div>
                        <div className="group-item">
                            <span className="group-icon">🌍</span>
                            <span>{t("MoneyFlowHeatmap.assetGroups.globalLeaders")}</span>
                        </div>
                        <div className="group-item">
                            <span className="group-icon">📈</span>
                            <span>{t("MoneyFlowHeatmap.assetGroups.etfFlow")}</span>
                        </div>
                        <div className="group-item">
                            <span className="group-icon">💰</span>
                            <span>{t("MoneyFlowHeatmap.assetGroups.bonds")}</span>
                        </div>
                        <div className="group-item">
                            <span className="group-icon">🚀</span>
                            <span>{t("MoneyFlowHeatmap.assetGroups.emerging")}</span>
                        </div>
                        <div className="group-item">
                            <span className="group-icon">🔬</span>
                            <span>{t("MoneyFlowHeatmap.assetGroups.innovation")}</span>
                        </div>
                        <div className="group-item">
                            <span className="group-icon">🌱</span>
                            <span>{t("MoneyFlowHeatmap.assetGroups.sustainable")}</span>
                        </div>
                    </div>
                </div>

                <div className="info-card">
                    <h3>{t("MoneyFlowHeatmap.usage.title")}</h3>
                    <ol>
                        <li>{t("MoneyFlowHeatmap.usage.step1")}</li>
                        <li>{t("MoneyFlowHeatmap.usage.step2")}</li>
                        <li>{t("MoneyFlowHeatmap.usage.step3")}</li>
                        <li>{t("MoneyFlowHeatmap.usage.step4")}</li>
                        <li>{t("MoneyFlowHeatmap.usage.step5")}</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

export default MoneyFlowHeatmapPage;
