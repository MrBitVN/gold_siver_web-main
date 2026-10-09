import React, { useEffect, useState } from "react";
import { fetchSharkData } from "../services/sharkGlobalService";
import GlobalShark from "../components/spdr-gold/GlobalShark";
import GlobalShark1Day from "../components/spdr-gold/GlobalShark1Day";
import DataEUR from "../components/spdr-gold/DataEUR";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import WhaleIntelPanel from "../components/whale-intel/WhaleIntelPanel";

const SharkGlobalSection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [allSeries, setAllSeries] = useState([]);
  const [allSeries1DAY, setAllSeries1DAY] = useState([]);

  useEffect(() => {
    fetchSharkData("ALL")
      .then(setAllSeries)
      .catch(() => {});
    fetchSharkData("DAY")
      .then(setAllSeries1DAY)
      .catch(() => {});
  }, []);

  return (
    <>
      {allSeries?.length > 0 && (
        <>
          <h2
            className="title-shark-global"
            onClick={() => navigate("/DetailSharkGlobal")}
          >
            {t("SharkGlobalSection.title")}
          </h2>
          <div
            className="dashboard-container"
            onClick={() => navigate("/SharkGlobalChart")}
          >
            <div className="dashboard-item">
              <GlobalShark1Day data={allSeries1DAY} />
            </div>
            <div className="dashboard-item">
              <DataEUR />
            </div>
            <div className="dashboard-item">
              <GlobalShark data={allSeries} zoomable={false} time="1Y" />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default SharkGlobalSection;
