import "./TableData.css";

export default function TableData({ dataAnalysis }) {
  const entries = Object.entries(dataAnalysis);

  // Chia danh sách thành hai cột: left (6 dòng) và right (còn lại)
  const chunkSize = 6;
  const leftEntries = entries.slice(0, chunkSize);
  const rightEntries = entries.slice(chunkSize);

  const numRows = Math.max(leftEntries.length, rightEntries.length);

  // Hàm lấy đơn vị dựa trên tên
  const getUnit = (key) => {
    if (key.includes("nhân tỷ giá") && key.includes("lượng")) return " (triệu/lượng)";
    if (key.includes("nhân tỷ giá") && key.includes("kg")) return " (triệu/kg)";
    if (key.includes("Chênh lệch: bạc")) return " (Triệu/Cân)";
    if (key.includes("Chênh lệch: vàng")) return " (Triệu/Lượng)";
    if (key.includes("kitco USD") || key.includes("Silver kitco usd")) return " (USD/Ounce)";
    if (key.includes("Tỷ giá USD")) return " (VND/USD)";
    if (key.includes("Vàng nhân tỷ giá")) return " (triệu/lượng)";
    if (key.includes("Vàng nguyên liệu")) return " (triệu/lượng)";
    if (key.includes("Bạc nguyên liệu") && key.includes("lượng")) return " (triệu/lượng)";
    if (key.includes("Bạc nguyên liệu") && key.includes("kg")) return " (triệu/kg)";
    return "";
  };

  // Hàm định dạng giá trị
  const formatValue = (value) => Number(value || 0).toFixed(5);

  // Hàm render một ô (cột) với dữ liệu
  const renderCell = (item) => {
    if (!item) return [<td key="name"></td>, <td key="value"></td>];
    const [key, value] = item;
    return [
      <td key="name">{key}</td>,
      <td key="value">
        <span style={{ color: '#facc15' }}>{formatValue(value)}</span>
        {getUnit(key)}
      </td>
    ];
  };

  return (
    <div className="price-table-container" style={{ display: "flex", justifyContent: "center" }}>
      <table className="price-table" style={{ width: "100%" }}>
        <thead>
          <tr>
            <td style={{ color: 'red', fontWeight: 'bold' }}>Tên</td>
            <td style={{ color: 'red', fontWeight: 'bold' }}>Giá trị</td>
            <td style={{ color: 'red', fontWeight: 'bold' }}>Tên</td>
            <td style={{ color: 'red', fontWeight: 'bold' }}>Giá trị</td>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: numRows }).map((_, rowIndex) => {
            const leftItem = leftEntries[rowIndex];
            const rightItem = rightEntries[rowIndex];
            return (
              <tr key={rowIndex}>
                {renderCell(leftItem)}
                {renderCell(rightItem)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
