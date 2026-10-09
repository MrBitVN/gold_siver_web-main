// TradingEconomicsWidgets.jsx
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./TradingEconomicsWidgets.css";
import { logUserInfo } from "../utils/logUserInfo";

const widgetUrls = {
    economicIndex: ['https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&ref=/united-states/interest-rate&s=fdtr',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&ref=/united-states/gdp-growth&s=gdp+cqoq',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&ref=/united-states/crude-oil-stocks-change&s=unitedstacruoilstoch',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&ref=/united-states/api-crude-oil-stock-change&s=apicrudeoil',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&ref=/united-states/crude-oil-rigs&s=usoilrigs'
    ],
    inflationIndex: ['https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&ref=/united-states/inflation-cpi&s=cpi+yoy',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&ref=/united-states/core-inflation-rate&s=usacorecpirate',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&ref=/united-states/inflation-rate-mom&s=unitedstainfratmom',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=unitedstapropricha&ref=/united-states/producer-prices-change',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&ref=/united-states/core-producer-prices-yoy&s=usacppy',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&ref=/united-states/producer-price-inflation-mom&s=usappim',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&ref=/united-states/pce-price-index-annual-change&s=usappiac',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=usacppiac&ref=/united-states/core-pce-price-index-annual-change',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=usacppim&ref=/united-states/core-pce-price-index-mom'
    ],
    manufacturing: ['https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=unitedstamanpmi&ref=/united-states/manufacturing-pmi',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=napmpmi&ref=/united-states/business-confidence',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=unitedstaindpromom&ref=/united-states/industrial-production-mom',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=usampmom&ref=/united-states/manufacturing-production-mom',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=unitedstacaputi&ref=/united-states/capacity-utilization'
    ],
    employment: ['https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=unitedstaadpempcha&ref=/united-states/adp-employment-change',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=unitedstajoboff&ref=/united-states/job-offers',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=nfp+tch&ref=/united-states/non-farm-payrolls',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=usurtot&ref=/united-states/unemployment-rate',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=ijcusa&ref=/united-states/jobless-claims',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=unitedstalabforparra&ref=/united-states/labor-force-participation-rate',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=unitedstaavehouear&ref=/united-states/average-hourly-earnings',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=usaahey&ref=/united-states/average-hourly-earnings-yoy'
    ],
    consumer: ['https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=unitedstaperinc&ref=/united-states/personal-income',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=unitedstabanlenrat&ref=/united-states/bank-lending-rate',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=unitedstapersav&ref=/united-states/personal-savings',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=usamce&ref=/united-states/michigan-consumer-expectations',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=unitedstaperspe&ref=/united-states/personal-spending',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=concconf&ref=/united-states/consumer-confidence'
    ],
    trade: ['https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=tbextot&ref=/united-states/exports',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=tbimtot&ref=/united-states/imports',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=ustbtot&ref=/united-states/balance-of-trade',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=usaepm&ref=/united-states/export-prices-mom',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=usaipm&ref=/united-states/import-prices-mom',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=rstamom&ref=/united-states/retail-sales',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=unitedstabusinv&ref=/united-states/business-inventories',
    ],
    realEstate: ['https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=unitedstabuiper&ref=/united-states/building-permits',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=unitedstahousta&ref=/united-states/housing-starts',
        'https://tradingeconomics.com/embed/?h=300&w=600&time=27:11:25-06:36:07&s=unitedstanewhomsal&ref=/united-states/new-home-sales'
    ]
};




function TradingEconomicsWidgets() {
    const { t } = useTranslation();

    useEffect(() => {
        (async () => {
            await logUserInfo("Màn hình TradingEconomicsWidgets.jsx")
        })();
    }, []);
    return (
        <div className="te-widget-container">
            <h1 style={{ fontSize: '60px', marginBottom: '60px', marginTop: '40px', fontWeight: 'bold', color: '#ffc107' }}>{t('TradingEconomicsWidgets.title')}</h1>
            {Object.entries(widgetUrls).map(([category, urls], catIndex) => (
                <div key={category}>
                    {catIndex !== 0 && <h1 style={{ marginTop: '50px', color: 'red', fontWeight: 'bold' }}>{t(`TradingEconomicsWidgets.categories.${category}`)}</h1>}
                    <div className="contain-widget">
                        {urls.map((url, index) => (
                            <div className="widget-item" key={index}>
                                <h3>{t(`TradingEconomicsWidgets.indicators.${category}.${index}`)}</h3>
                                <iframe
                                    src={url}
                                    title={`TE Widget ${index}`}
                                    allowTransparency="true"
                                    loading="lazy"
                                    scrolling="no"
                                ></iframe>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>

    );
}

export default TradingEconomicsWidgets;
