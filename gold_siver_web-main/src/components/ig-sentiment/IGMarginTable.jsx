import React from "react";
import "./IGMarginTable.css";

const IGMarginTable = ({ raw }) => {
  if (!raw) return null;

  let rows = [];
  try {
    rows = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (e) {
    try {
      rows = JSON.parse(String(raw).replace(/'/g, '"'));
    } catch (err) {
      console.warn("Failed to parse margin_full_table", err);
      return null;
    }
  }

  if (!Array.isArray(rows) || rows.length === 0) return null;

  return (
    <div className="margin-card">
      <div className="margin-card-body">
        <h4 className="margin-title">Margin</h4>

        <div className="margin-table-wrapper">
          <table className="margin-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Position size</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.tier ?? '—'}</td>
                  <td>{r.position_size ?? '—'}</td>
                  <td>{r.margin_rate ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default IGMarginTable;
